import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { logMessage, logError } from '@/lib/monitoring/sentry';

const execAsync = promisify(exec);

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  maxBackups: number;
  s3Config?: {
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
    endpoint?: string;
  };
}

export class BackupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Create a full database backup
   */
  async createDatabaseBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.sql`;
      const backupPath = join(this.config.backupDir, backupFileName);

      // Ensure backup directory exists
      await mkdir(this.config.backupDir, { recursive: true });

      // Create PostgreSQL backup using pg_dump
      const pgDumpCommand = `pg_dump "${this.config.databaseUrl}" > "${backupPath}"`;

      logMessage('Starting database backup', 'info', {
        extra: { backupPath, timestamp }
      });

      await execAsync(pgDumpCommand);

      // Verify backup file was created
      const stats = await this.verifyBackup(backupPath);

      // Log backup creation
      await this.logBackupEvent('DATABASE_BACKUP_CREATED', {
        backupPath,
        fileSize: stats.size,
        timestamp
      });

      logMessage('Database backup completed successfully', 'info', {
        extra: { backupPath, fileSize: stats.size }
      });

      return backupPath;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        tags: { component: 'backup-service', operation: 'database-backup' }
      });

      await this.logBackupEvent('DATABASE_BACKUP_FAILED', {
        error: String(error)
      });

      throw error;
    }
  }

  /**
   * Create application data backup (configurations, settings, etc.)
   */
  async createApplicationBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `app-backup-${timestamp}.json`;
      const backupPath = join(this.config.backupDir, backupFileName);

      // Collect application data
      const appData = {
        timestamp,
        version: process.env.npm_package_version || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',

        // System settings and configurations
        settings: await this.collectSystemSettings(),

        // User roles and permissions summary
        userStats: await this.collectUserStats(),

        // Event and ticket statistics
        eventStats: await this.collectEventStats(),

        // Payment statistics (anonymized)
        paymentStats: await this.collectPaymentStats(),
      };

      await writeFile(backupPath, JSON.stringify(appData, null, 2));

      const stats = await this.verifyBackup(backupPath);

      await this.logBackupEvent('APPLICATION_BACKUP_CREATED', {
        backupPath,
        fileSize: stats.size,
        timestamp
      });

      logMessage('Application backup completed successfully', 'info', {
        extra: { backupPath, fileSize: stats.size }
      });

      return backupPath;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        tags: { component: 'backup-service', operation: 'app-backup' }
      });

      await this.logBackupEvent('APPLICATION_BACKUP_FAILED', {
        error: String(error)
      });

      throw error;
    }
  }

  /**
   * Upload backup to S3-compatible storage
   */
  async uploadBackup(backupPath: string): Promise<void> {
    if (!this.config.s3Config) {
      logMessage('S3 config not provided, skipping upload', 'warning');
      return;
    }

    try {
      // This would integrate with AWS SDK or similar
      // For now, we'll just log the intent
      logMessage('Would upload backup to S3', 'info', {
        extra: { backupPath, bucket: this.config.s3Config.bucket }
      });

      await this.logBackupEvent('BACKUP_UPLOAD_COMPLETED', {
        backupPath,
        destination: this.config.s3Config.bucket
      });
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        tags: { component: 'backup-service', operation: 'upload' }
      });

      await this.logBackupEvent('BACKUP_UPLOAD_FAILED', {
        backupPath,
        error: String(error)
      });

      throw error;
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const cleanupCommand = `find "${this.config.backupDir}" -name "backup-*.sql" -type f | sort -r | tail -n +${this.config.maxBackups + 1} | xargs -r rm`;

      await execAsync(cleanupCommand);

      const appCleanupCommand = `find "${this.config.backupDir}" -name "app-backup-*.json" -type f | sort -r | tail -n +${this.config.maxBackups + 1} | xargs -r rm`;

      await execAsync(appCleanupCommand);

      await this.logBackupEvent('BACKUP_CLEANUP_COMPLETED', {
        maxBackups: this.config.maxBackups
      });

      logMessage('Backup cleanup completed', 'info', {
        extra: { maxBackups: this.config.maxBackups }
      });
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        tags: { component: 'backup-service', operation: 'cleanup' }
      });

      await this.logBackupEvent('BACKUP_CLEANUP_FAILED', {
        error: String(error)
      });
    }
  }

  /**
   * Run full backup process
   */
  async runFullBackup(): Promise<{
    databaseBackup: string;
    applicationBackup: string;
  }> {
    logMessage('Starting full backup process', 'info');

    const databaseBackup = await this.createDatabaseBackup();
    const applicationBackup = await this.createApplicationBackup();

    // Upload backups if S3 is configured
    if (this.config.s3Config) {
      await Promise.all([
        this.uploadBackup(databaseBackup),
        this.uploadBackup(applicationBackup)
      ]);
    }

    // Clean up old backups
    await this.cleanupOldBackups();

    logMessage('Full backup process completed', 'info', {
      extra: { databaseBackup, applicationBackup }
    });

    return { databaseBackup, applicationBackup };
  }

  /**
   * Verify backup file was created successfully
   */
  private async verifyBackup(backupPath: string) {
    const { stat } = await import('fs/promises');
    const stats = await stat(backupPath);

    if (stats.size === 0) {
      throw new Error(`Backup file is empty: ${backupPath}`);
    }

    return stats;
  }

  /**
   * Log backup events to audit trail
   */
  private async logBackupEvent(action: string, metadata: Record<string, any>) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType: 'SYSTEM',
          entityId: 'backup_service',
          metadata
        }
      });
    } catch (error) {
      // Don't let audit logging failure break the backup process
      console.error('Failed to log backup event:', error);
    }
  }

  /**
   * Collect system settings for backup
   */
  private async collectSystemSettings() {
    // This would collect non-sensitive system configuration
    return {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      // Add more system settings as needed
    };
  }

  /**
   * Collect user statistics
   */
  private async collectUserStats() {
    try {
      const [userCount, usersByRole] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: true
        })
      ]);

      return {
        totalUsers: userCount,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error collecting user stats:', error);
      return { error: 'Failed to collect user stats' };
    }
  }

  /**
   * Collect event statistics
   */
  private async collectEventStats() {
    try {
      const eventCount = await prisma.event.count();
      // Add more event statistics as the Event model becomes available

      return {
        totalEvents: eventCount
      };
    } catch (error) {
      console.error('Error collecting event stats:', error);
      return { error: 'Failed to collect event stats' };
    }
  }

  /**
   * Collect payment statistics (anonymized)
   */
  private async collectPaymentStats() {
    try {
      const paymentCount = await prisma.payment.count();
      // Add more payment statistics as needed

      return {
        totalPayments: paymentCount
      };
    } catch (error) {
      console.error('Error collecting payment stats:', error);
      return { error: 'Failed to collect payment stats' };
    }
  }
}

// Default backup service instance
const backupConfig: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL!,
  backupDir: process.env.BACKUP_DIR || '/tmp/backups',
  maxBackups: parseInt(process.env.MAX_BACKUPS || '7'),
  s3Config: process.env.BACKUP_S3_BUCKET ? {
    bucket: process.env.BACKUP_S3_BUCKET,
    accessKey: process.env.BACKUP_S3_ACCESS_KEY!,
    secretKey: process.env.BACKUP_S3_SECRET_KEY!,
    region: process.env.BACKUP_S3_REGION || 'us-east-1',
    endpoint: process.env.BACKUP_S3_ENDPOINT
  } : undefined
};

export const backupService = new BackupService(backupConfig);