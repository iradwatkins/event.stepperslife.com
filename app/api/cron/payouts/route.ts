import { NextRequest, NextResponse } from 'next/server';
import { payoutService } from '@/lib/services/payout.service';
import { logError } from '@/lib/monitoring/sentry';

/**
 * Cron job endpoint for processing daily payouts
 * Should be called by a cron service (Vercel Cron, GitHub Actions, etc.)
 *
 * Security: Verify cron secret or use Vercel Cron authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting daily payout processing...');

    const results = await payoutService.processDailyPayouts();

    console.log('[CRON] Payout processing complete:', results);

    // Log any errors to Sentry
    if (results.errors.length > 0) {
      for (const error of results.errors) {
        logError(new Error(`Payout failed for user ${error.userId}: ${error.error}`), {
          tags: { component: 'payout-cron', operation: 'process-payouts', severity: 'high' },
          extra: { userId: error.userId, error: error.error }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily payouts processed',
      results: {
        processed: results.processed,
        failed: results.failed,
        totalAmount: results.totalAmount,
        errorCount: results.errors.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON] Payout processing error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      tags: { component: 'payout-cron', operation: 'process-payouts', severity: 'critical' }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payouts',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}