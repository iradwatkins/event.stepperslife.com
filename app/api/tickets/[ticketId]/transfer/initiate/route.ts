import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { ticketTransferService } from '@/lib/services/ticket-transfer.service';
import { emailService } from '@/lib/services/email';
import { logError } from '@/lib/monitoring/sentry';
import { z } from 'zod';

const transferRequestSchema = z.object({
  toEmail: z.string().email('Valid email required'),
  message: z.string().max(500).optional()
});

async function handleInitiateTransfer(request: NextRequest, context: any) {
  const { user, params } = context;
  const ticketId = params.ticketId;

  try {
    const body = await request.json();
    const validatedData = transferRequestSchema.parse(body);

    // Initiate the transfer
    const transferInfo = await ticketTransferService.initiateTransfer({
      ticketId,
      fromUserId: user.id,
      toEmail: validatedData.toEmail,
      message: validatedData.message
    });

    // Send transfer notification email to recipient
    try {
      const transferUrl = `${process.env.NEXTAUTH_URL}/tickets/transfer/accept?transferId=${transferInfo.id}`;

      await emailService.sendTransferInitiationEmail({
        recipientEmail: validatedData.toEmail,
        senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        senderEmail: user.email,
        eventName: transferInfo.ticket.order.event.name,
        eventDate: new Date(transferInfo.ticket.order.event.startDate).toLocaleDateString(),
        eventTime: new Date(transferInfo.ticket.order.event.startDate).toLocaleTimeString(),
        venueName: transferInfo.ticket.order.event.venue?.name || 'TBD',
        message: validatedData.message || '',
        transferUrl,
        expiresAt: transferInfo.expiresAt
      });
    } catch (emailError) {
      console.error('Failed to send transfer initiation email:', emailError);
      // Don't fail the transfer if email fails
    }

    return NextResponse.json({
      success: true,
      transfer: {
        id: transferInfo.id,
        status: transferInfo.status,
        toEmail: transferInfo.toEmail,
        expiresAt: transferInfo.expiresAt
      }
    });

  } catch (error: any) {
    console.error('Error initiating transfer:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'ticket-transfer', operation: 'initiate', severity: 'high' },
      extra: { ticketId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to initiate transfer',
        details: error.message
      },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handleInitiateTransfer, {
  permissions: ['tickets.view_own']
});