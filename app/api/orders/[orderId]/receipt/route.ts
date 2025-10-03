import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { receiptService } from '@/lib/services/receipt.service';

async function handleGetReceipt(request: NextRequest, context: any) {
  const { user, params } = context;
  const orderId = params.orderId;

  try {
    // Fetch complete order data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: {
          include: {
            venue: true
          }
        },
        tickets: {
          include: {
            ticketType: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this order
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare receipt data
    const receiptData = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      eventName: order.event.name,
      eventDate: order.event.startDate,
      eventVenue: order.event.venue
        ? `${order.event.venue.name}, ${order.event.venue.address}`
        : 'Venue TBD',
      buyerName: `${order.firstName} ${order.lastName}`.trim(),
      buyerEmail: order.email,
      buyerPhone: order.phone || undefined,
      tickets: order.tickets.map(ticket => ({
        ticketNumber: ticket.ticketNumber,
        type: ticket.ticketType.name,
        quantity: 1,
        price: Number(ticket.faceValue)
      })),
      subtotal: Number(order.subtotal),
      fees: Number(order.fees),
      taxes: Number(order.taxes),
      total: Number(order.total),
      paymentMethod: 'Credit Card',
      paymentId: order.squarePaymentId || undefined
    };

    // Generate PDF receipt
    const pdfBuffer = await receiptService.generateReceipt(receiptData);

    // Generate filename
    const filename = receiptService.generateFilename(order.orderNumber);

    // Return PDF as downloadable file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      }
    });

  } catch (error) {
    console.error('Generate receipt error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'receipt-api', operation: 'generate' },
      extra: { orderId }
    });

    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}

// GET: Download PDF receipt
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const params = await context.params;
  return withAuth(handleGetReceipt, {
    permissions: ['orders.view']
  })(request, { params });
}