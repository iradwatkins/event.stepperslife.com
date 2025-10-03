import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { calendarService } from '@/lib/services/calendar.service';

async function handleGetCalendar(request: NextRequest, context: any) {
  const { user, params } = context;
  const orderId = params.orderId;

  try {
    // Fetch order with event details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: {
          include: {
            venue: true,
            organizer: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        tickets: true
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

    // Prepare calendar event data
    const eventData = calendarService.createEventDataFromOrder({
      eventName: order.event.name,
      eventDate: order.event.startDate,
      eventDuration: 3, // Default 3 hours
      venue: order.event.venue
        ? `${order.event.venue.name}, ${order.event.venue.address}`
        : undefined,
      ticketCount: order.tickets.length,
      orderNumber: order.orderNumber,
      organizerName: order.event.organizer
        ? `${order.event.organizer.firstName} ${order.event.organizer.lastName}`.trim()
        : undefined,
      organizerEmail: order.event.organizer?.email
    });

    // Generate .ics file
    const icsBuffer = calendarService.generateICSBuffer(eventData);

    // Generate filename
    const filename = calendarService.generateFilename(order.event.name);

    // Return .ics file as downloadable
    return new NextResponse(new Uint8Array(icsBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': icsBuffer.length.toString(),
      }
    });

  } catch (error) {
    console.error('Generate calendar error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'calendar-api', operation: 'generate' },
      extra: { orderId }
    });

    return NextResponse.json(
      { error: 'Failed to generate calendar invite' },
      { status: 500 }
    );
  }
}

// GET: Download .ics calendar file
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const params = await context.params;
  return withAuth(handleGetCalendar, {
    permissions: ['orders.view']
  })(request, { params });
}
