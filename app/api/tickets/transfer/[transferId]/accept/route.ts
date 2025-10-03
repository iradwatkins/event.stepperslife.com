import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { ticketTransferService } from '@/lib/services/ticket-transfer.service';
import { emailService } from '@/lib/services/email';
import { logError } from '@/lib/monitoring/sentry';
import { prisma } from '@/lib/prisma';

async function handleAcceptTransfer(request: NextRequest, context: any) {
  const { user, params } = context;
  const transferId = params.transferId;

  try {
    // Accept the transfer
    const result = await ticketTransferService.acceptTransfer({
      transferId,
      userId: user.id
    });

    // Send confirmation email to recipient
    try {
      await emailService.sendTransferAcceptedToRecipient({
        recipientEmail: user.email,
        recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        eventName: result.ticket.order.event.name,
        eventDate: new Date(result.ticket.order.event.startDate).toLocaleDateString(),
        ticketNumber: result.ticket.ticketNumber,
        qrCode: result.newQrCode
      });
    } catch (emailError) {
      console.error('Failed to send recipient confirmation:', emailError);
    }

    // Send notification to original owner
    try {
      const fromUser = await prisma.user.findUnique({
        where: { id: result.transfer.fromUserId }
      });

      if (fromUser) {
        await emailService.sendTransferAcceptedToSender({
          senderEmail: fromUser.email,
          senderName: `${fromUser.firstName || ''} ${fromUser.lastName || ''}`.trim() || fromUser.email,
          recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          recipientEmail: user.email,
          eventName: result.ticket.order.event.name
        });
      }
    } catch (emailError) {
      console.error('Failed to send sender notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: result.ticket.id,
        ticketNumber: result.ticket.ticketNumber,
        qrCode: result.newQrCode,
        event: {
          name: result.ticket.order.event.name,
          date: result.ticket.order.event.startDate
        }
      }
    });

  } catch (error: any) {
    console.error('Error accepting transfer:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'ticket-transfer', operation: 'accept', severity: 'high' },
      extra: { transferId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to accept transfer',
        details: error.message
      },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handleAcceptTransfer, {
  permissions: ['tickets.view_own']
});