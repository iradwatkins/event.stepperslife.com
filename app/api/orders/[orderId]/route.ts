import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';

async function handleGetOrder(request: NextRequest, context: any) {
  const { user, params } = context;
  const orderId = params.orderId;

  try {
    // Fetch order with all related data
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

    // Format response with proper structure for client
    const response = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      fees: Number(order.fees),
      taxes: Number(order.taxes),
      total: Number(order.total),
      ticketCount: order.tickets.length,
      event: {
        id: order.event.id,
        name: order.event.name,
        startDate: order.event.startDate.toISOString(),
        venue: order.event.venue ? {
          name: order.event.venue.name,
          address: order.event.venue.address
        } : undefined
      },
      tickets: order.tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        type: ticket.ticketType.name,
        qrCode: ticket.qrCode,
        status: ticket.status,
        price: Number(ticket.ticketType.price)
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get order error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'orders-api', operation: 'get' },
      extra: { orderId }
    });

    return NextResponse.json(
      { error: 'Failed to load order details' },
      { status: 500 }
    );
  }
}

// GET: Fetch order details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const params = await context.params;
  return withAuth(handleGetOrder, {
    permissions: ['orders.view']
  })(request, { params });
}