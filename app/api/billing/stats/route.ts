import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { billingService } from '@/lib/services/billing.service';
import { logError } from '@/lib/monitoring/sentry';

async function handleGetStats(request: NextRequest, context: any) {
  const { user } = context;

  try {
    const { searchParams } = new URL(request.url);

    // Parse date range from query params (default: last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    if (startParam) {
      startDate.setTime(new Date(startParam).getTime());
    }
    if (endParam) {
      endDate.setTime(new Date(endParam).getTime());
    }

    const stats = await billingService.getBillingStats({
      userId: user.id,
      startDate,
      endDate
    });

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      stats
    });

  } catch (error) {
    console.error('Get billing stats error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'billing-api', operation: 'get-stats' }
    });

    return NextResponse.json(
      { error: 'Failed to load billing statistics' },
      { status: 500 }
    );
  }
}

// GET: Fetch billing statistics
export async function GET(request: NextRequest) {
  return withAuth(handleGetStats, {
    permissions: ['billing.view']
  })(request, {});
}