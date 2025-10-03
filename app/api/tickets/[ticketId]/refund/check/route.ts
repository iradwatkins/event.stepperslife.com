import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { refundService } from '@/lib/services/refund.service';
import { logError } from '@/lib/monitoring/sentry';

async function handleCheckRefundEligibility(request: NextRequest, context: any) {
  const { user, params } = context;
  const ticketId = params.ticketId;

  try {
    const eligibility = await refundService.checkRefundEligibility({
      ticketId,
      userId: user.id
    });

    return NextResponse.json({
      ...eligibility
    });

  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'refund', operation: 'check-eligibility' },
      extra: { ticketId }
    });

    return NextResponse.json(
      { error: 'Failed to check refund eligibility' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleCheckRefundEligibility, {
  permissions: ['tickets.view_own']
});