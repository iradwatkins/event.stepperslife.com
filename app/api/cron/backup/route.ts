import { NextRequest, NextResponse } from 'next/server';
import { backupService } from '@/lib/backup/backup.service';
import { logMessage, logError } from '@/lib/monitoring/sentry';

// This endpoint is designed to be called by cron jobs or scheduled tasks
export async function POST(request: NextRequest) {
  // Verify the request is from a trusted source (cron job)
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    logMessage('Automated backup started', 'info', {
      tags: { source: 'cron', operation: 'scheduled-backup' }
    });

    const result = await backupService.runFullBackup();

    logMessage('Automated backup completed successfully', 'info', {
      tags: { source: 'cron', operation: 'scheduled-backup' },
      extra: result
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled backup completed successfully',
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      tags: { source: 'cron', operation: 'scheduled-backup' },
      level: 'error'
    });

    // Return success to prevent cron retries for known failures
    // The error is already logged for investigation
    return NextResponse.json({
      success: false,
      message: 'Scheduled backup failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint for the cron job
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'healthy',
    service: 'backup-cron',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
}