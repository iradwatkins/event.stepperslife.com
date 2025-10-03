import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { payoutService } from '@/lib/services/payout.service';
import { logError } from '@/lib/monitoring/sentry';

async function handleGetPayouts(request: NextRequest, context: any) {
  const { user } = context;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const payouts = await payoutService.getPayoutHistory(user.id, limit);
    const eligibility = await payoutService.checkPayoutEligibility(user.id);

    return NextResponse.json({
      payouts,
      eligibility,
      nextPayoutEstimate: eligibility.eligible ? 'Within 24 hours' : eligibility.reason
    });

  } catch (error) {
    console.error('Get payouts error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'payout-api', operation: 'get-payouts' }
    });

    return NextResponse.json(
      { error: 'Failed to load payout history' },
      { status: 500 }
    );
  }
}

// GET: Fetch payout history
export async function GET(request: NextRequest) {
  return withAuth(handleGetPayouts, {
    permissions: ['billing.view']
  })(request, {});
}