import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@prisma/client';

/**
 * PATCH /api/events/[eventId]/status
 * Update event status (publish, unpublish, etc.)
 */
async function handlePatchStatus(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const { status, reason } = await request.json();

    // Validate status
    if (!status || !Object.values(EventStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: DRAFT, PUBLISHED, CANCELLED' },
        { status: 400 }
      );
    }

    // Get the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: true,
        venue: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is the organizer or admin
    const isOrganizer = event.organizerId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the event organizer or admin can change event status' },
        { status: 403 }
      );
    }

    // Validate status transitions
    if (status === 'PUBLISHED') {
      // Pre-publish validation
      if (!event.name || event.name.trim() === '') {
        return NextResponse.json(
          { error: 'Event must have a name before publishing' },
          { status: 400 }
        );
      }

      if (!event.description || event.description.trim() === '') {
        return NextResponse.json(
          { error: 'Event must have a description before publishing' },
          { status: 400 }
        );
      }

      if (!event.ticketTypes || event.ticketTypes.length === 0) {
        return NextResponse.json(
          { error: 'Event must have at least one ticket type before publishing' },
          { status: 400 }
        );
      }

      if (!event.venueId || !event.venue) {
        return NextResponse.json(
          { error: 'Event must have a venue before publishing' },
          { status: 400 }
        );
      }

      if (new Date(event.startDate) <= new Date()) {
        return NextResponse.json(
          { error: 'Event start date must be in the future' },
          { status: 400 }
        );
      }
    }

    if (status === 'CANCELLED' && !reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status,
        ...(status === 'CANCELLED' && { cancellationReason: reason }),
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        venue: true,
        ticketTypes: true,
      },
    });

    // TODO: Send notification email to organizer
    // TODO: If publishing, potentially send email to followers
    // TODO: If cancelling, trigger refund workflow

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: `Event ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(handlePatchStatus);
