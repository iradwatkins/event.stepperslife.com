import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { refundService } from '@/lib/services/refund.service';
import { emailService } from '@/lib/services/email';
import { logError } from '@/lib/monitoring/sentry';
import { EventStatus, TicketStatus, RefundReason } from '@prisma/client';
import { z } from 'zod';

const cancelEventSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500),
  refundAll: z.boolean().default(true),
  notifyAttendees: z.boolean().default(true)
});

async function handleCancelEvent(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const body = await request.json();
    const validatedData = cancelEventSchema.parse(body);

    // Get event with tickets and orders
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
        venue: true,
        tickets: {
          where: {
            status: TicketStatus.VALID
          },
          include: {
            order: {
              include: {
                event: {
                  include: {
                    organizer: true
                  }
                },
                payment: true,
                user: true
              }
            },
            user: true
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

    // Check if user is the organizer
    if (event.organizerId !== user.id) {
      return NextResponse.json(
        { error: 'Only the event organizer can cancel events' },
        { status: 403 }
      );
    }

    // Check if event is already cancelled
    if (event.status === EventStatus.CANCELLED) {
      return NextResponse.json(
        { error: 'Event is already cancelled' },
        { status: 400 }
      );
    }

    // Process cancellation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update event status
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          status: EventStatus.CANCELLED
        }
      });

      // Invalidate all tickets
      await tx.ticket.updateMany({
        where: {
          eventId,
          status: TicketStatus.VALID
        },
        data: {
          status: TicketStatus.CANCELLED
        }
      });

      return {
        event: updatedEvent,
        ticketsAffected: event.tickets.length
      };
    });

    // Process refunds if requested
    const refundResults = {
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    if (validatedData.refundAll && event.tickets.length > 0) {
      // Process refunds for each ticket
      for (const ticket of event.tickets) {
        try {
          // Check if ticket has a valid payment and user
          const userId = ticket.userId || ticket.order.userId;
          if (!userId) {
            console.warn(`Ticket ${ticket.id} has no associated user, skipping refund`);
            continue;
          }

          if (ticket.order.payment && ticket.order.payment.status === 'COMPLETED') {
            await refundService.processRefund({
              ticketId: ticket.id,
              userId: userId,
              reason: RefundReason.EVENT_CANCELLED,
              reasonText: `Event cancelled by organizer: ${validatedData.reason}`
            });
            refundResults.successful++;
          }
        } catch (error: any) {
          console.error(`Failed to refund ticket ${ticket.id}:`, error);
          logError(error instanceof Error ? error : new Error(String(error)), {
            user: { id: user.id, email: user.email },
            tags: { component: 'event-cancel', operation: 'refund', severity: 'high' },
            extra: { eventId, ticketId: ticket.id, errorMessage: error.message }
          });
          refundResults.failed++;
          refundResults.errors.push({
            ticketId: ticket.id,
            error: error.message
          });
        }
      }
    }

    // Send cancellation emails to attendees
    if (validatedData.notifyAttendees && event.tickets.length > 0) {
      const uniqueAttendees = new Map<string, { email: string; name: string; tickets: any[] }>();

      // Group tickets by attendee
      for (const ticket of event.tickets) {
        const attendeeEmail = ticket.user?.email || ticket.order.user?.email;
        const attendeeName = ticket.user
          ? `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email
          : ticket.order.user
            ? `${ticket.order.user.firstName || ''} ${ticket.order.user.lastName || ''}`.trim() || ticket.order.user.email
            : 'Attendee';

        if (attendeeEmail) {
          if (!uniqueAttendees.has(attendeeEmail)) {
            uniqueAttendees.set(attendeeEmail, {
              email: attendeeEmail,
              name: attendeeName,
              tickets: []
            });
          }
          uniqueAttendees.get(attendeeEmail)!.tickets.push(ticket);
        }
      }

      // Send emails to each unique attendee
      for (const attendee of uniqueAttendees.values()) {
        try {
          await emailService.sendEventCancellationEmail({
            recipientEmail: attendee.email,
            recipientName: attendee.name,
            eventName: event.name,
            eventDate: new Date(event.startDate).toLocaleDateString(),
            eventTime: new Date(event.startDate).toLocaleTimeString(),
            venueName: event.venue?.name || 'TBD',
            cancellationReason: validatedData.reason,
            refundStatus: validatedData.refundAll
              ? 'Your tickets will be refunded within 5-10 business days'
              : 'Please contact support regarding refunds',
            organizerName: `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || event.organizer.email,
            organizerEmail: event.organizer.email,
            ticketCount: attendee.tickets.length
          });
        } catch (emailError) {
          console.error(`Failed to send cancellation email to ${attendee.email}:`, emailError);
          // Don't fail the cancellation if email fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        id: result.event.id,
        name: result.event.name,
        status: result.event.status
      },
      cancellation: {
        ticketsAffected: result.ticketsAffected,
        refunds: {
          processed: validatedData.refundAll,
          successful: refundResults.successful,
          failed: refundResults.failed,
          errors: refundResults.errors
        },
        notifications: {
          sent: validatedData.notifyAttendees,
          recipientCount: event.tickets.length
        }
      }
    });

  } catch (error: any) {
    console.error('Error cancelling event:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'event-cancel', operation: 'cancel', severity: 'critical' },
      extra: { eventId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to cancel event',
        details: error.message
      },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handleCancelEvent, {
  permissions: ['events.delete_own']
});