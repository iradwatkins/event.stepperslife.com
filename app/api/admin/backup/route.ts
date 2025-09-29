import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { backupService } from '@/lib/backup/backup.service';
import { logMessage, logError } from '@/lib/monitoring/sentry';

async function handleBackupRequest(request: NextRequest, context: any) {
  const { user } = context;
  const { searchParams } = new URL(request.url);
  const backupType = searchParams.get('type') || 'full';

  try {
    logMessage('Backup requested by admin', 'info', {
      user: { id: user.id, email: user.email, role: user.role },
      extra: { backupType }
    });

    let result;

    switch (backupType) {
      case 'database':
        result = {
          databaseBackup: await backupService.createDatabaseBackup()
        };
        break;

      case 'application':
        result = {
          applicationBackup: await backupService.createApplicationBackup()
        };
        break;

      case 'full':
      default:
        result = await backupService.runFullBackup();
        break;
    }

    return NextResponse.json({
      success: true,
      message: `${backupType} backup completed successfully`,
      result
    });

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'backup-api', operation: 'manual-backup' },
      extra: { backupType }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Backup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleBackupCleanup(request: NextRequest, context: any) {
  const { user } = context;

  try {
    logMessage('Backup cleanup requested by admin', 'info', {
      user: { id: user.id, email: user.email, role: user.role }
    });

    await backupService.cleanupOldBackups();

    return NextResponse.json({
      success: true,
      message: 'Backup cleanup completed successfully'
    });

  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'backup-api', operation: 'cleanup' }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Backup cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Create backup
export const POST = withAuth(handleBackupRequest, {
  permissions: ['platform.admin']
});

// DELETE: Cleanup old backups
export const DELETE = withAuth(handleBackupCleanup, {
  permissions: ['platform.admin']
});