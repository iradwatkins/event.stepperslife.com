import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { qrCodeService } from '@/lib/services/qrcode';
import { z } from 'zod';

const checkInSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  validationCode: z.string().min(1, 'Validation code is required'),
  checkInMethod: z.enum(['QR_SCAN', 'MANUAL_SEARCH', 'CONFIRMATION_NUMBER']).default('QR_SCAN'),
  location: z.string().optional()
});

const bulkCheckInSchema = z.object({
  tickets: z.array(z.object({
    ticketId: z.string(),
    validationCode: z.string()
  })).min(1).max(50)
});

async function handleCheckInTicket(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const body = await request.json();
    const validatedData = checkInSchema.parse(body);

    // Verify the user has permission to check in tickets for this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
        name: true,
        status: true,
        startDate: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const canCheckIn =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id;

    if (!canCheckIn) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Find and validate the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: validatedData.ticketId },
      include: {
        ticketType: true,
        order: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ticket is not for this event' },
        { status: 400 }
      );
    }

    if (ticket.validationCode !== validatedData.validationCode) {
      return NextResponse.json(
        { error: 'Invalid validation code' },
        { status: 400 }
      );
    }

    if (ticket.status !== 'VALID') {
      return NextResponse.json(
        { error: `Ticket status is ${ticket.status}` },
        { status: 400 }
      );
    }

    if (ticket.checkedIn) {
      return NextResponse.json(
        {
          error: 'Ticket already checked in',
          checkedInAt: ticket.checkedInAt
        },
        { status: 400 }
      );
    }

    // Perform check-in
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: user.id,
        checkInMethod: validatedData.checkInMethod,
        checkInLocation: validatedData.location || 'Main Entrance'
      },
      include: {
        ticketType: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Log check-in activity
    await prisma.auditLog.create({
      data: {
        action: 'TICKET_CHECKED_IN',
        entityType: 'TICKET',
        entityId: ticket.id,
        userId: user.id,
        metadata: {
          eventName: event.name,
          ticketNumber: ticket.ticketNumber,
          holderName: ticket.holderName,
          checkInMethod: validatedData.checkInMethod,
          location: validatedData.location
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket checked in successfully',
      ticket: {
        id: updatedTicket.id,
        ticketNumber: updatedTicket.ticketNumber,
        holderName: updatedTicket.holderName,
        ticketType: updatedTicket.ticketType.name,
        checkedInAt: updatedTicket.checkedInAt,
        attendee: updatedTicket.user ? {
          name: `${updatedTicket.user.firstName} ${updatedTicket.user.lastName}`,
          email: updatedTicket.user.email
        } : null
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);

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
      tags: { component: 'checkin-api', operation: 'checkin' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Check-in failed' },
      { status: 500 }
    );
  }
}

async function handleBulkCheckIn(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const body = await request.json();
    const validatedData = bulkCheckInSchema.parse(body);

    // Verify permissions
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true, name: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const canCheckIn =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id;

    if (!canCheckIn) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Process bulk check-ins
    const results = [];

    for (const ticketData of validatedData.tickets) {
      try {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketData.ticketId },
          include: { ticketType: true }
        });

        if (!ticket || ticket.eventId !== eventId || ticket.validationCode !== ticketData.validationCode) {
          results.push({
            ticketId: ticketData.ticketId,
            success: false,
            error: 'Invalid ticket or validation code'
          });
          continue;
        }

        if (ticket.checkedIn) {
          results.push({
            ticketId: ticketData.ticketId,
            success: false,
            error: 'Already checked in'
          });
          continue;
        }

        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            checkedIn: true,
            checkedInAt: new Date(),
            checkedInBy: user.id,
            checkInMethod: 'MANUAL_SEARCH',
            checkInLocation: 'Bulk Check-in'
          }
        });

        results.push({
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          success: true
        });

      } catch (error) {
        console.error(`Bulk check-in error for ticket ${ticketData.ticketId}:`, error);
        results.push({
          ticketId: ticketData.ticketId,
          success: false,
          error: 'Processing failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `Bulk check-in completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Bulk check-in error:', error);

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
      tags: { component: 'checkin-api', operation: 'bulk-checkin' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Bulk check-in failed' },
      { status: 500 }
    );
  }
}

async function handleGetCheckInStats(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    // Verify permissions
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const canView =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id;

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get check-in statistics
    const stats = await prisma.ticket.groupBy({
      by: ['checkedIn'],
      where: { eventId },
      _count: true
    });

    const totalTickets = stats.reduce((sum, stat) => sum + stat._count, 0);
    const checkedInTickets = stats.find(stat => stat.checkedIn)?._count || 0;
    const notCheckedIn = totalTickets - checkedInTickets;

    // Get hourly check-in distribution
    const hourlyCheckIns = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('hour', "checkedInAt") as hour,
        COUNT(*) as count
      FROM tickets
      WHERE "eventId" = ${eventId}
        AND "checkedIn" = true
        AND "checkedInAt" IS NOT NULL
      GROUP BY hour
      ORDER BY hour
    `;

    return NextResponse.json({
      success: true,
      stats: {
        totalTickets,
        checkedIn: checkedInTickets,
        notCheckedIn,
        checkInRate: totalTickets > 0 ? (checkedInTickets / totalTickets * 100) : 0,
        hourlyDistribution: hourlyCheckIns
      }
    });

  } catch (error) {
    console.error('Check-in stats error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'checkin-api', operation: 'stats' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Failed to fetch check-in stats' },
      { status: 500 }
    );
  }
}

// POST: Check in a single ticket
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'bulk') {
    return withAuth(handleBulkCheckIn, {
      permissions: ['events.edit_own']
    })(request, { params });
  }

  return withAuth(handleCheckInTicket, {
    permissions: ['events.edit_own']
  })(request, { params });
}

// GET: Get check-in statistics
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  return withAuth(handleGetCheckInStats, {
    permissions: ['events.view']
  })(request, { params });
}