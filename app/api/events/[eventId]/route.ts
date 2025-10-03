import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';

async function handleGetEvent(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        ticketTypes: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this event
    const canView =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id ||
      event.visibility === 'PUBLIC' ||
      (event.visibility === 'UNLISTED' && user.role !== 'ATTENDEE');

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        ticketsSold: event._count.tickets,
        ticketTypes: event.ticketTypes.map(ticket => ({
          ...ticket,
          price: Number(ticket.price)
        }))
      }
    });

  } catch (error) {
    console.error('Get event error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'event-api', operation: 'get-single' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

async function handleUpdateEvent(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this event
    const canUpdate =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id;

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Process date and time if provided
    let startDate = event.startDate;
    let endDate = event.endDate;

    if (body.eventDate && body.startTime) {
      startDate = new Date(`${body.eventDate} ${body.startTime}`);

      if (body.endTime) {
        endDate = new Date(`${body.eventDate} ${body.endTime}`);
        // Handle times crossing midnight
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
      } else {
        endDate = startDate;
      }
    }

    // Update basic event fields
    const updateData: any = {
      updatedAt: new Date()
    };

    if (body.title) updateData.name = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category) updateData.eventType = body.category;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.capacity) updateData.maxCapacity = body.capacity;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;

    // Update venue if provided
    if (body.venueName || body.venueAddress) {
      await prisma.venue.update({
        where: { id: event.venueId! },
        data: {
          ...(body.venueName && { name: body.venueName }),
          ...(body.venueAddress && { address: body.venueAddress }),
        }
      });
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        venue: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        ticketTypes: true
      }
    });

    // Handle ticket types updates if provided
    if (body.ticketTypes && Array.isArray(body.ticketTypes)) {
      // Deactivate all existing ticket types
      await prisma.ticketType.updateMany({
        where: { eventId },
        data: { isActive: false }
      });

      // Create or update ticket types
      for (const ticketData of body.ticketTypes) {
        if (ticketData.id) {
          // Update existing ticket type
          await prisma.ticketType.update({
            where: { id: ticketData.id },
            data: {
              name: ticketData.name,
              price: ticketData.price,
              quantity: ticketData.quantity,
              salesStartDate: ticketData.salesStartDate ? new Date(ticketData.salesStartDate) : undefined,
              salesEndDate: ticketData.salesEndDate ? new Date(ticketData.salesEndDate) : undefined,
              isActive: true
            }
          });
        } else {
          // Create new ticket type
          await prisma.ticketType.create({
            data: {
              eventId,
              name: ticketData.name,
              price: ticketData.price,
              quantity: ticketData.quantity,
              salesStartDate: ticketData.salesStartDate ? new Date(ticketData.salesStartDate) : new Date(),
              salesEndDate: ticketData.salesEndDate ? new Date(ticketData.salesEndDate) : startDate,
              isActive: true
            }
          });
        }
      }
    }

    // Fetch updated event with new ticket types
    const finalEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        ticketTypes: {
          where: { isActive: true }
        }
      }
    });

    // Log event update
    await prisma.auditLog.create({
      data: {
        action: 'EVENT_UPDATED',
        entityType: 'EVENT',
        entityId: eventId,
        userId: user.id,
        metadata: {
          eventTitle: updatedEvent.name,
          updatedFields: Object.keys(body)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event: finalEvent
    });

  } catch (error) {
    console.error('Update event error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'event-api', operation: 'update' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

async function handleDeleteEvent(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
        name: true,
        _count: { select: { tickets: true } }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this event
    const canDelete =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if event has sold tickets
    if (event._count.tickets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with sold tickets. Cancel the event instead.' },
        { status: 400 }
      );
    }

    // Delete event and related data
    await prisma.$transaction(async (tx) => {
      // Delete ticket types first
      await tx.ticketType.deleteMany({
        where: { eventId }
      });

      // Delete the event
      await tx.event.delete({
        where: { id: eventId }
      });

      // Log event deletion
      await tx.auditLog.create({
        data: {
          action: 'EVENT_DELETED',
          entityType: 'EVENT',
          entityId: eventId,
          userId: user.id,
          metadata: {
            eventTitle: event.name
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'event-api', operation: 'delete' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// GET: Get single event
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  return withAuth(handleGetEvent, {
    permissions: ['events.view']
  })(request, { params });
}

// PUT: Update event
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  return withAuth(handleUpdateEvent, {
    permissions: ['events.edit_own']
  })(request, { params });
}

// DELETE: Delete event
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  return withAuth(handleDeleteEvent, {
    permissions: ['events.delete_own']
  })(request, { params });
}