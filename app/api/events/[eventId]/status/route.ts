import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { EventStatus, RefundReason } from '@prisma/client';
import { emailService } from '@/lib/services/email';
import { RefundService } from '@/lib/services/refund.service';

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

    // Post-status-change actions (run asynchronously to not block response)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3004';
    const eventDate = new Date(updatedEvent.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const eventTime = new Date(updatedEvent.startDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    // 1. Send notification email to organizer
    (async () => {
      try {
        await emailService.sendEventStatusChangeEmail({
          organizerEmail: updatedEvent.organizer.email,
          organizerName: `${updatedEvent.organizer.firstName} ${updatedEvent.organizer.lastName}`,
          eventName: updatedEvent.name,
          oldStatus: event.status,
          newStatus: status,
          eventDate,
          eventTime,
          venueName: updatedEvent.venue?.name || 'TBD',
          dashboardUrl: `${baseUrl}/dashboard/events/${eventId}`
        });
      } catch (error) {
        console.error('Failed to send organizer notification:', error);
      }
    })();

    // 2. If publishing, send email to users who favorited events by this organizer
    if (status === EventStatus.PUBLISHED && event.status !== EventStatus.PUBLISHED) {
      (async () => {
        try {
          // Get users who have favorited any event by this organizer
          const favorites = await prisma.eventFavorite.findMany({
            where: {
              event: {
                organizerId: updatedEvent.organizerId
              }
            },
            distinct: ['userId'],
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  marketingOptIn: true
                }
              }
            }
          });

          // Filter for users who opted in to marketing emails
          const interestedUsers = favorites
            .filter(f => f.user.marketingOptIn)
            .map(f => f.user);

          // Send notification to each interested user
          const ticketPrices = updatedEvent.ticketTypes.map(t => t.price);
          const minPrice = Math.min(...ticketPrices);
          const maxPrice = Math.max(...ticketPrices);
          const priceRange = minPrice === maxPrice
            ? `$${minPrice.toFixed(2)}`
            : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

          for (const user of interestedUsers) {
            await emailService.sendEventPublishedNotification({
              recipientEmail: user.email,
              recipientName: user.firstName,
              organizerName: `${updatedEvent.organizer.firstName} ${updatedEvent.organizer.lastName}`,
              eventName: updatedEvent.name,
              eventDescription: updatedEvent.description || '',
              eventDate,
              eventTime,
              venueName: updatedEvent.venue?.name || 'TBD',
              venueAddress: updatedEvent.venue?.address || '',
              ticketPriceRange: priceRange,
              eventUrl: `${baseUrl}/events/${eventId}`,
              imageUrl: updatedEvent.imageUrl || undefined
            });
          }
        } catch (error) {
          console.error('Failed to send follower notifications:', error);
        }
      })();
    }

    // 3. If cancelling, trigger refund workflow for all tickets
    if (status === EventStatus.CANCELLED) {
      (async () => {
        try {
          const refundService = new RefundService();

          // Get all valid tickets for this event
          const tickets = await prisma.ticket.findMany({
            where: {
              event: {
                id: eventId
              },
              status: 'VALID'
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true
                }
              },
              order: {
                select: {
                  squarePaymentId: true,
                  totalAmount: true
                }
              }
            }
          });

          console.log(`Processing ${tickets.length} refunds for cancelled event ${eventId}`);

          // Process refunds for each ticket
          for (const ticket of tickets) {
            try {
              await refundService.processRefund({
                ticketId: ticket.id,
                userId: ticket.userId,
                reason: RefundReason.EVENT_CANCELLED,
                initiatedBy: user.id
              });

              // Send cancellation email to ticket holder
              await emailService.sendEventCancellationEmail({
                recipientEmail: ticket.user.email,
                recipientName: ticket.user.firstName,
                eventName: updatedEvent.name,
                eventDate,
                eventTime,
                venueName: updatedEvent.venue?.name || 'TBD',
                cancellationReason: reason || 'Event cancelled by organizer',
                refundStatus: 'Your refund has been initiated and will be processed within 5-10 business days.',
                organizerName: `${updatedEvent.organizer.firstName} ${updatedEvent.organizer.lastName}`,
                organizerEmail: updatedEvent.organizer.email,
                ticketCount: 1
              });
            } catch (error) {
              console.error(`Failed to process refund for ticket ${ticket.id}:`, error);
              // Continue processing other refunds even if one fails
            }
          }

          console.log(`Completed refund processing for event ${eventId}`);
        } catch (error) {
          console.error('Failed to process event cancellation refunds:', error);
        }
      })();
    }

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
