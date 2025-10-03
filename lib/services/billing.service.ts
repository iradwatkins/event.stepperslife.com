/**
 * Billing Service
 *
 * Core revenue engine for the platform. Handles platform fee calculation,
 * collection, credit management, and billing account operations.
 *
 * @module BillingService
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface FeeCalculation {
  platformFeeFixed: number;
  platformFeePercent: number;
  platformFeeTotal: number;
  subtotal: number;
  organizerNet: number;
  useCredits: boolean;
  creditBalance: number;
}

export interface BillingAccountConfig {
  platformFeeFixed?: number;
  platformFeePercent?: number;
  negotiatedRate?: boolean;
  payoutSchedule?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ON_DEMAND';
  minimumPayout?: number;
}

export class BillingService {
  /**
   * Get or create billing account for a user
   */
  async getOrCreateBillingAccount(userId: string): Promise<any> {
    let account = await prisma.billingAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      account = await prisma.billingAccount.create({
        data: {
          userId,
          platformFeeFixed: 0.75, // Default $0.75 per ticket
          platformFeePercent: 0.00,
          creditBalance: 0,
          lifetimeCredits: 0,
          pendingBalance: 0,
          availableBalance: 0,
          totalRevenue: 0,
          totalFees: 0,
          totalPayouts: 0,
          transactionCount: 0,
          payoutSchedule: 'DAILY',
          minimumPayout: 25.00,
          status: 'ACTIVE'
        }
      });
    }

    return account;
  }

  /**
   * Calculate platform fees for a ticket purchase
   */
  async calculatePlatformFee(params: {
    organizerId: string;
    subtotal: number;
    quantity: number;
  }): Promise<FeeCalculation> {
    const { organizerId, subtotal, quantity } = params;

    // Get organizer's billing account
    const account = await this.getOrCreateBillingAccount(organizerId);

    // Calculate fees
    const platformFeeFixed = Number(account.platformFeeFixed) * quantity;
    const platformFeePercent = subtotal * (Number(account.platformFeePercent) / 100);
    const platformFeeTotal = platformFeeFixed + platformFeePercent;

    // Calculate net to organizer
    const organizerNet = subtotal - platformFeeTotal;

    // Check if organizer has credits
    const creditBalance = Number(account.creditBalance);
    const useCredits = creditBalance >= platformFeeTotal;

    return {
      platformFeeFixed,
      platformFeePercent,
      platformFeeTotal,
      subtotal,
      organizerNet,
      useCredits,
      creditBalance
    };
  }

  /**
   * Collect platform fee from a ticket sale
   * This is called after successful payment processing
   */
  async collectPlatformFee(params: {
    orderId: string;
    organizerId: string;
    eventId: string;
    subtotal: number;
    quantity: number;
    squarePaymentId?: string;
  }): Promise<void> {
    const { orderId, organizerId, eventId, subtotal, quantity, squarePaymentId } = params;

    // Calculate fees
    const feeCalc = await this.calculatePlatformFee({
      organizerId,
      subtotal,
      quantity
    });

    // Get billing account
    const account = await this.getOrCreateBillingAccount(organizerId);

    // Determine fiscal period
    const now = new Date();
    const fiscalMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fiscalQuarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    await prisma.$transaction(async (tx) => {
      // Deduct from credits or add to pending balance
      if (feeCalc.useCredits) {
        // Use prepaid credits
        await tx.billingAccount.update({
          where: { id: account.id },
          data: {
            creditBalance: {
              decrement: feeCalc.platformFeeTotal
            },
            totalFees: {
              increment: feeCalc.platformFeeTotal
            },
            transactionCount: {
              increment: 1
            }
          }
        });

        // Record credit deduction transaction
        await tx.platformTransaction.create({
          data: {
            billingAccountId: account.id,
            type: 'CREDIT_DEDUCTION',
            amount: feeCalc.platformFeeTotal,
            orderId,
            eventId,
            squarePaymentId,
            creditUsed: true,
            creditAmount: feeCalc.platformFeeTotal,
            status: 'COMPLETED',
            fiscalMonth,
            fiscalQuarter,
            description: `Platform fee paid via credits for order ${orderId}`
          }
        });
      } else {
        // Add to pending balance (will be deducted during payout)
        await tx.billingAccount.update({
          where: { id: account.id },
          data: {
            pendingBalance: {
              increment: feeCalc.organizerNet
            },
            totalRevenue: {
              increment: subtotal
            },
            totalFees: {
              increment: feeCalc.platformFeeTotal
            },
            transactionCount: {
              increment: 1
            }
          }
        });
      }

      // Record platform fee transaction
      await tx.platformTransaction.create({
        data: {
          billingAccountId: account.id,
          type: 'PLATFORM_FEE',
          amount: feeCalc.platformFeeTotal,
          orderId,
          eventId,
          squarePaymentId,
          creditUsed: feeCalc.useCredits,
          creditAmount: feeCalc.useCredits ? feeCalc.platformFeeTotal : null,
          status: 'COMPLETED',
          fiscalMonth,
          fiscalQuarter,
          description: `Platform fee for ${quantity} ticket(s) - Order ${orderId}`
        }
      });
    });
  }

  /**
   * Refund platform fee when ticket is refunded
   */
  async refundPlatformFee(params: {
    orderId: string;
    organizerId: string;
    refundAmount: number;
    platformFeeAmount: number;
  }): Promise<void> {
    const { orderId, organizerId, refundAmount, platformFeeAmount } = params;

    const account = await this.getOrCreateBillingAccount(organizerId);

    // Determine fiscal period
    const now = new Date();
    const fiscalMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fiscalQuarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    await prisma.$transaction(async (tx) => {
      // Check if original fee was paid via credits
      const originalTransaction = await tx.platformTransaction.findFirst({
        where: {
          orderId,
          type: 'PLATFORM_FEE',
          billingAccountId: account.id
        }
      });

      if (originalTransaction?.creditUsed) {
        // Refund to credit balance
        await tx.billingAccount.update({
          where: { id: account.id },
          data: {
            creditBalance: {
              increment: platformFeeAmount
            },
            totalFees: {
              decrement: platformFeeAmount
            }
          }
        });
      } else {
        // Adjust pending balance
        await tx.billingAccount.update({
          where: { id: account.id },
          data: {
            pendingBalance: {
              decrement: refundAmount
            },
            totalRevenue: {
              decrement: refundAmount + platformFeeAmount
            },
            totalFees: {
              decrement: platformFeeAmount
            }
          }
        });
      }

      // Record refund transaction
      await tx.platformTransaction.create({
        data: {
          billingAccountId: account.id,
          type: 'REFUND',
          amount: platformFeeAmount,
          orderId,
          status: 'COMPLETED',
          fiscalMonth,
          fiscalQuarter,
          description: `Platform fee refund for order ${orderId}`
        }
      });
    });
  }

  /**
   * Purchase prepaid credits
   */
  async purchasePrepaidCredits(params: {
    userId: string;
    packageAmount: number;
    discountPercent: number;
    squarePaymentId: string;
    squareOrderId?: string;
  }): Promise<any> {
    const { userId, packageAmount, discountPercent, squarePaymentId, squareOrderId } = params;

    const account = await this.getOrCreateBillingAccount(userId);

    // Calculate purchase price with discount
    const purchasePrice = packageAmount * (1 - discountPercent / 100);

    // Create credit purchase record and update balance
    const purchase = await prisma.$transaction(async (tx) => {
      // Create purchase record
      const creditPurchase = await tx.creditPurchase.create({
        data: {
          billingAccountId: account.id,
          packageAmount,
          purchasePrice,
          discountPercent,
          squarePaymentId,
          squareOrderId,
          status: 'COMPLETED',
          creditsUsed: 0,
          creditsRemaining: packageAmount
        }
      });

      // Update billing account
      await tx.billingAccount.update({
        where: { id: account.id },
        data: {
          creditBalance: {
            increment: packageAmount
          },
          lifetimeCredits: {
            increment: packageAmount
          }
        }
      });

      // Record transaction
      await tx.platformTransaction.create({
        data: {
          billingAccountId: account.id,
          type: 'CREDIT_PURCHASE',
          amount: purchasePrice,
          squarePaymentId,
          status: 'COMPLETED',
          fiscalMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          fiscalQuarter: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
          description: `Prepaid credit purchase - $${packageAmount} (${discountPercent}% discount)`
        }
      });

      return creditPurchase;
    });

    return purchase;
  }

  /**
   * Update billing account configuration
   */
  async updateBillingAccount(
    userId: string,
    config: BillingAccountConfig
  ): Promise<any> {
    const account = await this.getOrCreateBillingAccount(userId);

    const updateData: any = {};

    if (config.platformFeeFixed !== undefined) {
      updateData.platformFeeFixed = config.platformFeeFixed;
      updateData.negotiatedRate = true;
      updateData.rateEffectiveDate = new Date();
    }

    if (config.platformFeePercent !== undefined) {
      updateData.platformFeePercent = config.platformFeePercent;
      updateData.negotiatedRate = true;
      updateData.rateEffectiveDate = new Date();
    }

    if (config.payoutSchedule) {
      updateData.payoutSchedule = config.payoutSchedule;
    }

    if (config.minimumPayout !== undefined) {
      updateData.minimumPayout = config.minimumPayout;
    }

    return await prisma.billingAccount.update({
      where: { id: account.id },
      data: updateData
    });
  }

  /**
   * Get billing account details
   */
  async getBillingAccount(userId: string): Promise<any> {
    return await prisma.billingAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        creditPurchases: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        subscription: true
      }
    });
  }

  /**
   * Get billing statistics for date range
   */
  async getBillingStats(params: {
    userId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    const { userId, startDate, endDate } = params;

    const account = await this.getOrCreateBillingAccount(userId);

    const transactions = await prisma.platformTransaction.findMany({
      where: {
        billingAccountId: account.id,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalFees = transactions
      .filter(t => t.type === 'PLATFORM_FEE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalRefunds = transactions
      .filter(t => t.type === 'REFUND')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const creditPurchases = transactions
      .filter(t => t.type === 'CREDIT_PURCHASE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const creditDeductions = transactions
      .filter(t => t.type === 'CREDIT_DEDUCTION')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalFees,
      totalRefunds,
      netFees: totalFees - totalRefunds,
      creditPurchases,
      creditDeductions,
      transactionCount: transactions.length,
      currentBalance: Number(account.creditBalance),
      pendingPayout: Number(account.pendingBalance)
    };
  }

  /**
   * Suspend billing account (for fraud, chargebacks, etc.)
   */
  async suspendAccount(userId: string, reason: string): Promise<any> {
    const account = await this.getOrCreateBillingAccount(userId);

    return await prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: reason
      }
    });
  }

  /**
   * Reactivate billing account
   */
  async reactivateAccount(userId: string): Promise<any> {
    const account = await this.getOrCreateBillingAccount(userId);

    return await prisma.billingAccount.update({
      where: { id: account.id },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspensionReason: null
      }
    });
  }

  /**
   * Check if account is in good standing
   */
  async isAccountInGoodStanding(userId: string): Promise<boolean> {
    const account = await prisma.billingAccount.findUnique({
      where: { userId }
    });

    if (!account) return false;
    if (account.status === 'SUSPENDED') return false;
    if (account.status === 'CLOSED') return false;

    return true;
  }
}

// Export singleton instance
export const billingService = new BillingService();