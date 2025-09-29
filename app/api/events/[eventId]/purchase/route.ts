import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { emailService } from '@/lib/services/email';
import { z } from 'zod';
import { Client, Environment } from 'square';

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
          status: { in: ['PAID', 'CONFIRMED'] }
        }
      });

      const availableTickets = ticketType.quantity - soldTickets;
      if (availableTickets < validatedData.quantity) {
        throw new Error(`Only ${availableTickets} tickets remaining`);
      }

      // Calculate total amount
      const totalAmount = ticketType.price * validatedData.quantity;

      // Process payment with Square
      let paymentResult;
      if (totalAmount > 0) {
        const squareClient = new Client({
          accessToken: process.env.SQUARE_ACCESS_TOKEN!,
          environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox
        });

        try {
          const { result: createPaymentResult } = await squareClient.paymentsApi.createPayment({
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
          console.error('Square payment error:', error);
          throw new Error('Payment processing failed. Please try again.');
        }
      }

      // Create order record
      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          userId: user.id,
          eventId,
          email: validatedData.buyerEmail,
          firstName: validatedData.buyerName.split(' ')[0] || validatedData.buyerName,
          lastName: validatedData.buyerName.split(' ').slice(1).join(' ') || '',
          phone: validatedData.buyerPhone,
          subtotal: totalAmount,
          fees: 0,
          taxes: 0,
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
            faceValue: ticketType.price,
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

    // Send confirmation email to buyer
    try {
      await emailService.sendTicketPurchaseConfirmation({
        buyerName: validatedData.buyerName,
        buyerEmail: validatedData.buyerEmail,
        eventName: result.event.name,
        eventDate: new Date(result.event.startDate).toLocaleString(),
        eventVenue: `${result.event.venue.name}, ${result.event.venue.address}`,
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
        // TODO: Create organizer notification template
        console.log(`New ticket purchase for ${result.event.name} - notify ${result.event.organizer.email}`);
      }
    } catch (error) {
      console.error('Failed to send organizer notification:', error);
      // Don't fail the purchase if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${validatedData.quantity} ticket(s)`,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        total: result.order.total,
        ticketCount: result.tickets.length
      },
      tickets: result.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        faceValue: ticket.faceValue,
        qrCode: ticket.qrCode
      }))
    });

  } catch (error) {
    console.error('Purchase tickets error:', error);

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
  const params = await context.params; {
  return withAuth(handlePurchaseTickets, {
    permissions: ['tickets.purchase']
  })(request, { params });
}