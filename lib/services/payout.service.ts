/**
 * Payout Service
 *
 * Handles automated payout processing to organizers on scheduled intervals.
 * Manages daily/weekly/monthly payout batches with Square integration.
 *
 * @module PayoutService
 */

import { prisma } from '@/lib/prisma';
import { SquareClient, SquareEnvironment } from 'square';

export interface PayoutEligibility {
  eligible: boolean;
  reason?: string;
  pendingAmount: number;
  minimumRequired: number;
}

export class PayoutService {
  private squareClient: SquareClient;

  constructor() {
    this.squareClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox
    });
  }

  /**
   * Check if organizer is eligible for payout
   */
  async checkPayoutEligibility(userId: string): Promise<PayoutEligibility> {
    const account = await prisma.billingAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      return {
        eligible: false,
        reason: 'Billing account not found',
        pendingAmount: 0,
        minimumRequired: 25.00
      };
    }

    if (account.status !== 'ACTIVE') {
      return {
        eligible: false,
        reason: `Account is ${account.status}`,
        pendingAmount: Number(account.pendingBalance),
        minimumRequired: Number(account.minimumPayout)
      };
    }

    const pendingAmount = Number(account.pendingBalance);
    const minimumRequired = Number(account.minimumPayout);

    if (pendingAmount < minimumRequired) {
      return {
        eligible: false,
        reason: `Pending balance ($${pendingAmount.toFixed(2)}) below minimum ($${minimumRequired.toFixed(2)})`,
        pendingAmount,
        minimumRequired
      };
    }

    return {
      eligible: true,
      pendingAmount,
      minimumRequired
    };
  }

  /**
   * Process payout for a single organizer
   */
  async processPayoutForOrganizer(params: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<any> {
    const { userId, periodStart, periodEnd } = params;

    // Check eligibility
    const eligibility = await this.checkPayoutEligibility(userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Not eligible for payout');
    }

    const account = await prisma.billingAccount.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });

    if (!account) {
      throw new Error('Billing account not found');
    }

    // Get transactions for this period
    const transactions = await prisma.platformTransaction.findMany({
      where: {
        billingAccountId: account.id,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        type: {
          in: ['PLATFORM_FEE', 'REFUND']
        }
      }
    });

    const totalSales = transactions
      .filter(t => t.type === 'PLATFORM_FEE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalFees = transactions
      .filter(t => t.type === 'PLATFORM_FEE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Generate payout number
    const payoutNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate fiscal month
    const fiscalMonth = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}`;

    // Create payout record
    const payout = await prisma.$transaction(async (tx) => {
      // Create payout record
      const payoutRecord = await tx.payoutRecord.create({
        data: {
          billingAccountId: account.id,
          payoutNumber,
          amount: eligibility.pendingAmount,
          status: 'PENDING',
          scheduledFor: new Date(),
          periodStart,
          periodEnd,
          fiscalMonth,
          transactionCount: transactions.length,
          totalSales,
          totalFees
        }
      });

      // Move pending balance to available (in real implementation, this happens after Square confirms)
      await tx.billingAccount.update({
        where: { id: account.id },
        data: {
          pendingBalance: 0,
          availableBalance: {
            increment: eligibility.pendingAmount
          },
          totalPayouts: {
            increment: eligibility.pendingAmount
          }
        }
      });

      return payoutRecord;
    });

    // In production, initiate Square payout here
    // For now, we'll simulate it
    console.log(`Payout ${payoutNumber} created for ${account.user.email}: $${eligibility.pendingAmount.toFixed(2)}`);

    return payout;
  }

  /**
   * Process all eligible payouts (cron job)
   */
  async processDailyPayouts(): Promise<{
    processed: number;
    failed: number;
    totalAmount: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    const now = new Date();
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 1); // Yesterday

    // Find all accounts eligible for daily payouts
    const eligibleAccounts = await prisma.billingAccount.findMany({
      where: {
        status: 'ACTIVE',
        payoutSchedule: 'DAILY',
        pendingBalance: {
          gte: 0
        }
      },
      include: {
        user: true
      }
    });

    const results = {
      processed: 0,
      failed: 0,
      totalAmount: 0,
      errors: [] as Array<{ userId: string; error: string }>
    };

    for (const account of eligibleAccounts) {
      try {
        const eligibility = await this.checkPayoutEligibility(account.userId);

        if (!eligibility.eligible) {
          continue; // Skip if not eligible
        }

        const payout = await this.processPayoutForOrganizer({
          userId: account.userId,
          periodStart,
          periodEnd
        });

        results.processed++;
        results.totalAmount += eligibility.pendingAmount;

      } catch (error) {
        console.error(`Payout failed for user ${account.userId}:`, error);
        results.failed++;
        results.errors.push({
          userId: account.userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  /**
   * Get payout history for organizer
   */
  async getPayoutHistory(userId: string, limit: number = 20): Promise<any[]> {
    const account = await prisma.billingAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      return [];
    }

    const payouts = await prisma.payoutRecord.findMany({
      where: {
        billingAccountId: account.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return payouts.map(payout => ({
      id: payout.id,
      payoutNumber: payout.payoutNumber,
      amount: Number(payout.amount),
      status: payout.status,
      scheduledFor: payout.scheduledFor,
      completedAt: payout.completedAt,
      periodStart: payout.periodStart,
      periodEnd: payout.periodEnd,
      transactionCount: payout.transactionCount,
      totalSales: Number(payout.totalSales),
      totalFees: Number(payout.totalFees),
      createdAt: payout.createdAt
    }));
  }

  /**
   * Retry failed payout
   */
  async retryPayout(payoutId: string): Promise<any> {
    const payout = await prisma.payoutRecord.findUnique({
      where: { id: payoutId },
      include: {
        billingAccount: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'FAILED') {
      throw new Error('Only failed payouts can be retried');
    }

    if (payout.retryCount >= payout.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    // Update retry count and status
    const updatedPayout = await prisma.payoutRecord.update({
      where: { id: payoutId },
      data: {
        status: 'PENDING',
        retryCount: {
          increment: 1
        },
        failedAt: null,
        failureReason: null
      }
    });

    // In production, retry Square payout here
    console.log(`Retrying payout ${payout.payoutNumber} (attempt ${updatedPayout.retryCount})`);

    return updatedPayout;
  }

  /**
   * Cancel pending payout
   */
  async cancelPayout(payoutId: string, reason: string): Promise<any> {
    const payout = await prisma.payoutRecord.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new Error('Only pending payouts can be cancelled');
    }

    // Return funds to pending balance
    await prisma.$transaction(async (tx) => {
      await tx.payoutRecord.update({
        where: { id: payoutId },
        data: {
          status: 'CANCELLED',
          failureReason: reason
        }
      });

      await tx.billingAccount.update({
        where: { id: payout.billingAccountId },
        data: {
          pendingBalance: {
            increment: Number(payout.amount)
          },
          availableBalance: {
            decrement: Number(payout.amount)
          }
        }
      });
    });

    return payout;
  }

  /**
   * Get payout statistics for admin dashboard
   */
  async getPayoutStatistics(params: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const { startDate, endDate } = params;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const payouts = await prisma.payoutRecord.findMany({ where });

    const totalPayouts = payouts.length;
    const totalAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const completedPayouts = payouts.filter(p => p.status === 'COMPLETED').length;
    const failedPayouts = payouts.filter(p => p.status === 'FAILED').length;
    const pendingPayouts = payouts.filter(p => p.status === 'PENDING').length;

    return {
      totalPayouts,
      totalAmount,
      completedPayouts,
      failedPayouts,
      pendingPayouts,
      averagePayoutAmount: totalPayouts > 0 ? totalAmount / totalPayouts : 0,
      successRate: totalPayouts > 0 ? (completedPayouts / totalPayouts) * 100 : 0
    };
  }
}

// Export singleton instance
export const payoutService = new PayoutService();