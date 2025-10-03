import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { emailService } from '@/lib/services/email';
import { taxService } from '@/lib/services/tax.service';
import { billingService } from '@/lib/services/billing.service';
import { PaymentErrorMapper } from '@/lib/payments/errors';
import { z } from 'zod';
import { SquareClient, SquareEnvironment } from 'square';

const purchaseTicketSchema = z.object({
  ticketTypeId: z.string().min(1, 'Ticket type is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 tickets per purchase'),
  sourceId: z.string().min(1, 'Payment source is required'),
  verificationToken: z.string().optional(),
  buyerName: z.string().min(1, 'Buyer name is required'),
  buyerEmail: z.string().email('Valid email is required'),
  buyerPhone: z.string().optional()
});

async function handlePurchaseTickets(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const body = await request.json();
    const validatedData = purchaseTicketSchema.parse(body);

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get event with ticket type
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          ticketTypes: {
            where: {
              id: validatedData.ticketTypeId,
              isActive: true
            }
          },
          venue: true,
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'PUBLISHED') {
        throw new Error('Event is not available for ticket purchase');
      }

      const ticketType = event.ticketTypes[0];
      if (!ticketType) {
        throw new Error('Ticket type not found');
      }

      // Check availability
      const soldTickets = await tx.ticket.count({
        where: {
          eventId,
          ticketTypeId: validatedData.ticketTypeId,
          status: 'VALID'
        }
      });

      const availableTickets = ticketType.quantity - soldTickets;
      if (availableTickets < validatedData.quantity) {
        throw new Error(`Only ${availableTickets} tickets remaining`);
      }

      // Calculate subtotal
      const subtotal = Number(ticketType.price) * validatedData.quantity;

      // Calculate sales tax
      let taxCalculation;
      if (event.venue?.address) {
        const state = taxService.extractStateFromAddress(event.venue.address);
        const city = taxService.extractCityFromAddress(event.venue.address);
        const zip = taxService.extractZipFromAddress(event.venue.address);

        if (state) {
          taxCalculation = await taxService.calculateSalesTax({
            taxableAmount: subtotal,
            eventId: event.id,
            state,
            city: city || undefined,
            zip: zip || undefined
          });
        }
      }

      const taxes = taxCalculation?.taxAmount || 0;
      const taxRate = taxCalculation?.combinedTaxRate || 0;
      const totalAmount = subtotal + taxes;

      // Process payment with Square
      let paymentResult;
      if (totalAmount > 0) {
        const squareClient = new SquareClient({
          token: process.env.SQUARE_ACCESS_TOKEN!,
          environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox
        });

        try {
          const createPaymentResult = await squareClient.payments.create({
            sourceId: validatedData.sourceId,
            idempotencyKey: `${eventId}-${user.id}-${Date.now()}`,
            amountMoney: {
              amount: BigInt(Math.round(totalAmount * 100)), // Convert to cents
              currency: 'USD'
            },
            ...(validatedData.verificationToken && {
              verificationToken: validatedData.verificationToken
            })
          });

          paymentResult = createPaymentResult;
        } catch (error: any) {
          // Map Square error to user-friendly message
          const paymentError = PaymentErrorMapper.mapSquareError(error);

          // Log sanitized error
          const sanitizedError = PaymentErrorMapper.sanitizeForLogging(error);
          logError(new Error('Payment processing failed'), {
            user: { id: user.id, email: user.email, role: user.role },
            tags: {
              component: 'payment',
              operation: 'square-payment',
              errorCategory: paymentError.category,
              squareErrorCode: paymentError.squareErrorCode || 'unknown'
            },
            extra: {
              eventId,
              ticketTypeId: validatedData.ticketTypeId,
              quantity: validatedData.quantity,
              amount: totalAmount,
              sanitizedError,
              retryable: paymentError.retryable
            }
          });

          // Throw with payment error details attached
          const errorWithDetails = new Error(paymentError.userMessage);
          (errorWithDetails as any).paymentError = paymentError;
          throw errorWithDetails;
        }
      }

      // Create order record with tax breakdown
      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          userId: user.id,
          eventId,
          email: validatedData.buyerEmail,
          firstName: validatedData.buyerName.split(' ')[0] || validatedData.buyerName,
          lastName: validatedData.buyerName.split(' ').slice(1).join(' ') || '',
          phone: validatedData.buyerPhone,
          subtotal: subtotal,
          fees: 0,
          taxes: taxes,
          taxRate: taxRate,
          taxBreakdown: taxCalculation ? {
            taxableAmount: taxCalculation.taxableAmount,
            stateTaxRate: taxCalculation.stateTaxRate,
            localTaxRate: taxCalculation.localTaxRate,
            combinedTaxRate: taxCalculation.combinedTaxRate,
            taxAmount: taxCalculation.taxAmount,
            jurisdiction: taxCalculation.jurisdiction,
            isExempt: taxCalculation.isExempt,
            exemptionReason: taxCalculation.exemptionReason,
            calculatedAt: new Date().toISOString()
          } : undefined,
          taxExempt: taxCalculation?.isExempt || false,
          taxExemptionId: taxCalculation?.exemptionReason || null,
          total: totalAmount,
          status: totalAmount > 0 ? 'COMPLETED' : 'COMPLETED',
          paymentStatus: totalAmount > 0 ? 'COMPLETED' : 'COMPLETED',
          squarePaymentId: paymentResult?.payment?.id,
          squareOrderId: paymentResult?.payment?.orderId
        }
      });

      // Create ticket records
      const tickets = [];
      for (let i = 0; i < validatedData.quantity; i++) {
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber: `TKT-${Date.now()}-${i + 1}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            orderId: order.id,
            ticketTypeId: validatedData.ticketTypeId,
            eventId,
            userId: user.id,
            holderName: validatedData.buyerName,
            holderEmail: validatedData.buyerEmail,
            faceValue: Number(ticketType.price),
            fees: 0,
            status: 'VALID',
            qrCode: `QR-${Date.now()}-${i + 1}-${Math.random().toString(36).substr(2, 8)}`,
            validationCode: `VAL-${Math.random().toString(36).substr(2, 12).toUpperCase()}`
          }
        });
        tickets.push(ticket);
      }

      // Log purchase activity
      await tx.auditLog.create({
        data: {
          action: 'TICKETS_PURCHASED',
          entityType: 'ORDER',
          entityId: order.id,
          userId: user.id,
          metadata: {
            eventTitle: event.name,
            ticketType: ticketType.name,
            quantity: validatedData.quantity,
            totalAmount,
            paymentId: paymentResult?.payment?.id
          }
        }
      });

      return {
        order,
        tickets,
        event,
        ticketType,
        paymentResult
      };
    });

    // Collect platform fee (CRITICAL: Revenue collection)
    try {
      await billingService.collectPlatformFee({
        orderId: result.order.id,
        organizerId: result.event.organizerId,
        eventId: result.event.id,
        subtotal: Number(result.order.subtotal),
        quantity: validatedData.quantity,
        squarePaymentId: result.paymentResult?.payment?.id
      });
    } catch (error) {
      console.error('Failed to collect platform fee:', error);
      // Log the error but don't fail the purchase
      // Platform fee collection failures should be monitored and resolved manually
      logError(error instanceof Error ? error : new Error(String(error)), {
        user: { id: user.id, email: user.email, role: user.role },
        tags: { component: 'billing', operation: 'collect-platform-fee', severity: 'critical' },
        extra: {
          orderId: result.order.id,
          eventId: result.event.id,
          subtotal: Number(result.order.subtotal)
        }
      });
    }

    // Send confirmation email to buyer
    try {
      await emailService.sendTicketPurchaseConfirmation({
        buyerName: validatedData.buyerName,
        buyerEmail: validatedData.buyerEmail,
        eventName: result.event.name,
        eventDate: new Date(result.event.startDate).toLocaleString(),
        eventVenue: result.event.venue ? `${result.event.venue.name}, ${result.event.venue.address}` : 'TBD',
        orderNumber: result.order.orderNumber,
        ticketCount: result.tickets.length,
        totalAmount: Number(result.order.total),
        tickets: result.tickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          type: result.ticketType.name,
          price: Number(ticket.faceValue)
        }))
      });
    } catch (error) {
      console.error('Failed to send purchase confirmation email:', error);
      // Don't fail the purchase if email fails
    }

    // Send notification to event organizer
    try {
      if (result.event.organizer.email) {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3004';
        const organizerName = `${result.event.organizer.firstName} ${result.event.organizer.lastName}`.trim() || 'Organizer';

        // Calculate platform fee and organizer payout
        const subtotal = Number(result.order.subtotal);
        const total = Number(result.order.total);
        const platformFee = Number(result.order.platformFee) || 0;
        const organizerPayout = subtotal - platformFee;

        await emailService.sendOrganizerTicketSaleNotification({
          organizerEmail: result.event.organizer.email,
          organizerName,
          buyerName: validatedData.buyerName,
          buyerEmail: validatedData.buyerEmail,
          eventName: result.event.name,
          eventDate: new Date(result.event.startDate).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }),
          ticketCount: result.tickets.length,
          ticketTypeName: result.ticketType.name,
          orderNumber: result.order.orderNumber,
          totalAmount: total,
          subtotal,
          platformFee,
          organizerPayout,
          dashboardUrl: `${baseUrl}/dashboard/events/${eventId}`
        });
      }
    } catch (error) {
      console.error('Failed to send organizer notification:', error);
      // Don't fail the purchase if email fails
    }

    // Type cast taxBreakdown for response
    const taxBreakdown = result.order.taxBreakdown as any;

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${validatedData.quantity} ticket(s)`,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        subtotal: result.order.subtotal,
        fees: result.order.fees,
        taxes: result.order.taxes,
        total: result.order.total,
        ticketCount: result.tickets.length,
        taxBreakdown: taxBreakdown ? {
          stateTax: Number(taxBreakdown.stateTaxRate) * 100,
          localTax: Number(taxBreakdown.localTaxRate) * 100,
          combinedRate: Number(taxBreakdown.combinedTaxRate) * 100,
          taxAmount: Number(taxBreakdown.taxAmount),
          jurisdiction: taxBreakdown.jurisdiction,
          isExempt: taxBreakdown.isExempt
        } : null
      },
      tickets: result.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        faceValue: ticket.faceValue,
        qrCode: ticket.qrCode
      }))
    });

  } catch (error: any) {
    console.error('Purchase tickets error:', error);

    // Handle payment errors with user-friendly messages
    if (error.paymentError) {
      return NextResponse.json({
        error: error.paymentError.userMessage,
        errorDetails: {
          category: error.paymentError.category,
          retryable: error.paymentError.retryable,
          suggestedActions: error.paymentError.suggestedActions
        }
      }, { status: 400 });
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'ticket-purchase-api', operation: 'purchase' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to purchase tickets' },
      { status: 500 }
    );
  }
}

// POST: Purchase tickets
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  return withAuth(handlePurchaseTickets, {
    permissions: ['tickets.purchase']
  })(request, { params });
}