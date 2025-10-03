import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { ticketTransferService } from '@/lib/services/ticket-transfer.service';
import { emailService } from '@/lib/services/email';
import { logError } from '@/lib/monitoring/sentry';
import { prisma } from '@/lib/prisma';

async function handleDeclineTransfer(request: NextRequest, context: any) {
  const { user, params } = context;
  const transferId = params.transferId;

  try {
    // Get transfer details before declining
    const transferData = await ticketTransferService.getTransferById(transferId);

    if (!transferData) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Decline the transfer
    await ticketTransferService.declineTransfer({
      transferId,
      userId: user.id,
      reason: 'Declined by recipient'
    });

    // Get full details for email
    const ticket = await prisma.ticket.findUnique({
      where: { id: transferData.ticketId },
      include: {
        order: {
          include: {
            event: true
          }
        }
      }
    });

    // Send notification to original owner
    try {
      const fromUser = await prisma.user.findUnique({
        where: { id: transferData.fromUserId }
      });

      if (fromUser && ticket && ticket.order?.event) {
        const eventDate = new Date(ticket.order.event.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const eventTime = new Date(ticket.order.event.startDate).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });

        await emailService.sendTransferDeclinedEmail({
          senderEmail: fromUser.email,
          senderName: `${fromUser.firstName} ${fromUser.lastName}`.trim() || fromUser.email,
          recipientEmail: user.email || '',
          recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Recipient',
          eventName: ticket.order.event.name,
          eventDate,
          eventTime,
          venueName: ticket.order.event.venue?.name || 'TBD',
          ticketNumber: ticket.ticketNumber,
          reason: 'Declined by recipient'
        });
      }
    } catch (emailError) {
      console.error('Failed to send decline notification:', emailError);
      // Don't fail the decline if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Transfer declined successfully'
    });

  } catch (error: any) {
    console.error('Error declining transfer:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'ticket-transfer', operation: 'decline', severity: 'medium' },
      extra: { transferId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to decline transfer',
        details: error.message
      },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handleDeclineTransfer, {
  permissions: ['tickets.view_own']
});
