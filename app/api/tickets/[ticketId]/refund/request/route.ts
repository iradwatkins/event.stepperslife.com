import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { refundService } from '@/lib/services/refund.service';
import { emailService } from '@/lib/services/email';
import { logError } from '@/lib/monitoring/sentry';
import { RefundReason } from '@prisma/client';
import { z } from 'zod';

const refundRequestSchema = z.object({
  reason: z.nativeEnum(RefundReason).optional(),
  reasonText: z.string().optional()
});

async function handleProcessRefund(request: NextRequest, context: any) {
  const { user, params } = context;
  const ticketId = params.ticketId;

  try {
    const body = await request.json();
    const validatedData = refundRequestSchema.parse(body);

    // Process the refund
    const result = await refundService.processRefund({
      ticketId,
      userId: user.id,
      reason: validatedData.reason,
      reasonText: validatedData.reasonText
    });

    // Send refund confirmation email
    try {
      await emailService.sendRefundConfirmation({
        userEmail: user.email,
        userName: user.firstName || 'Customer',
        eventName: result.ticket.order.event.name,
        eventDate: new Date(result.ticket.order.event.startDate).toLocaleDateString(),
        originalAmount: Number(result.ticket.faceValue),
        refundAmount: result.refundAmount,
        cancellationFee: Number(result.ticket.faceValue) - result.refundAmount,
        ticketNumber: result.ticket.ticketNumber
      });
    } catch (emailError) {
      console.error('Failed to send refund confirmation email:', emailError);
      // Don't fail the refund if email fails
    }

    // Send notification to organizer
    try {
      const organizerEmail = result.ticket.order.event.organizer?.email;
      if (organizerEmail) {
        await emailService.sendOrganizerRefundNotification({
          organizerEmail,
          eventName: result.ticket.order.event.name,
          ticketNumber: result.ticket.ticketNumber,
          refundAmount: result.refundAmount,
          customerName: `${user.firstName} ${user.lastName}`.trim() || user.email
        });
      }
    } catch (emailError) {
      console.error('Failed to send organizer notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: result.refund.id,
        amount: result.refundAmount,
        squareRefundId: result.squareRefundId,
        status: result.refund.status
      },
      ticket: {
        id: result.ticket.id,
        status: result.ticket.status
      }
    });

  } catch (error: any) {
    console.error('Error processing refund:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'refund', operation: 'process-refund', severity: 'high' },
      extra: { ticketId, errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to process refund',
        details: error.message
      },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handleProcessRefund, {
  permissions: ['tickets.view_own']
});