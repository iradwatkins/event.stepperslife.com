import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { billingService } from '@/lib/services/billing.service';
import { logError } from '@/lib/monitoring/sentry';
import { z } from 'zod';

const updateAccountSchema = z.object({
  platformFeeFixed: z.number().min(0).optional(),
  platformFeePercent: z.number().min(0).max(100).optional(),
  payoutSchedule: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND']).optional(),
  minimumPayout: z.number().min(0).optional()
});

async function handleGetAccount(request: NextRequest, context: any) {
  const { user } = context;

  try {
    const account = await billingService.getBillingAccount(user.id);

    if (!account) {
      return NextResponse.json(
        { error: 'Billing account not found' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      id: account.id,
      platformFeeFixed: Number(account.platformFeeFixed),
      platformFeePercent: Number(account.platformFeePercent),
      negotiatedRate: account.negotiatedRate,
      creditBalance: Number(account.creditBalance),
      lifetimeCredits: Number(account.lifetimeCredits),
      pendingBalance: Number(account.pendingBalance),
      availableBalance: Number(account.availableBalance),
      payoutSchedule: account.payoutSchedule,
      minimumPayout: Number(account.minimumPayout),
      status: account.status,
      totalRevenue: Number(account.totalRevenue),
      totalFees: Number(account.totalFees),
      totalPayouts: Number(account.totalPayouts),
      transactionCount: account.transactionCount,
      createdAt: account.createdAt,
      recentTransactions: account.transactions?.slice(0, 10) || [],
      recentPayouts: account.payouts?.slice(0, 5) || [],
      subscription: account.subscription
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get billing account error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'billing-api', operation: 'get-account' }
    });

    return NextResponse.json(
      { error: 'Failed to load billing account' },
      { status: 500 }
    );
  }
}

async function handleUpdateAccount(request: NextRequest, context: any) {
  const { user } = context;

  try {
    const body = await request.json();
    const validatedData = updateAccountSchema.parse(body);

    // Only admins can update fee rates
    if ((validatedData.platformFeeFixed !== undefined || validatedData.platformFeePercent !== undefined) && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can update fee rates' },
        { status: 403 }
      );
    }

    const account = await billingService.updateBillingAccount(user.id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'Billing account updated successfully',
      account: {
        id: account.id,
        platformFeeFixed: Number(account.platformFeeFixed),
        platformFeePercent: Number(account.platformFeePercent),
        payoutSchedule: account.payoutSchedule,
        minimumPayout: Number(account.minimumPayout)
      }
    });

  } catch (error) {
    console.error('Update billing account error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'billing-api', operation: 'update-account' }
    });

    return NextResponse.json(
      { error: 'Failed to update billing account' },
      { status: 500 }
    );
  }
}

// GET: Fetch billing account details
export async function GET(request: NextRequest) {
  return withAuth(handleGetAccount, {
    permissions: ['billing.view']
  })(request, {});
}

// PUT: Update billing account settings
export async function PUT(request: NextRequest) {
  return withAuth(handleUpdateAccount, {
    permissions: ['billing.manage']
  })(request, {});
}