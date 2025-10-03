/**
 * Refund Service
 *
 * Handles ticket refund processing including eligibility checks,
 * refund calculations, Square API integration, and ticket invalidation.
 *
 * @module RefundService
 */

import { prisma } from '@/lib/prisma';
import { SquareClient, SquareEnvironment } from 'square';
import { RefundReason, RefundStatus, TicketStatus } from '@prisma/client';
import { billingService } from './billing.service';

export interface RefundPolicy {
  enabled: boolean;
  windowDays?: number;
  windowHours?: number;
  feePercentage: number;
  flatFee?: number;
  noRefundPeriodHours?: number;
}

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  refundAmount?: number;
  cancellationFee?: number;
  originalAmount?: number;
  policy?: RefundPolicy;
}

export interface RefundCalculation {
  eligible: boolean;
  originalAmount: number;
  cancellationFee: number;
  refundAmount: number;
  platformFeeRefund: number;
  breakdown: {
    ticketPrice: number;
    minusCancellationFee: number;
    finalRefund: number;
  };
}

export class RefundService {
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
   * Get default refund policy (can be overridden per event)
   */
  getDefaultPolicy(): RefundPolicy {
    return {
      enabled: true,
      windowDays: 7,
      feePercentage: 10,
      noRefundPeriodHours: 24
    };
  }

  /**
   * Check if ticket is eligible for refund
   */
  async checkRefundEligibility(params: {
    ticketId: string;
    userId: string;
  }): Promise<RefundEligibility> {
    const { ticketId, userId } = params;

    // Get ticket with order and event
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        order: {
          include: {
            event: true
          }
        }
      }
    });

    if (!ticket) {
      return {
        eligible: false,
        reason: 'Ticket not found'
      };
    }

    // Verify ownership
    if (ticket.userId !== userId) {
      return {
        eligible: false,
        reason: 'You do not own this ticket'
      };
    }

    // Check if already refunded or cancelled
    if (ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') {
      return {
        eligible: false,
        reason: 'Ticket already refunded or cancelled'
      };
    }

    // Check if already checked in
    if (ticket.status === 'USED') {
      return {
        eligible: false,
        reason: 'Ticket already used for check-in'
      };
    }

    // Get refund policy (for now, use default - in future, get from event)
    const policy = this.getDefaultPolicy();

    if (!policy.enabled) {
      return {
        eligible: false,
        reason: 'This event has a no-refund policy'
      };
    }

    // Calculate hours until event
    const now = new Date();
    const eventDate = new Date(ticket.order.event.startDate);
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check if event already passed
    if (hoursUntilEvent < 0) {
      return {
        eligible: false,
        reason: 'Event has already occurred'
      };
    }

    // Check no-refund period
    if (policy.noRefundPeriodHours && hoursUntilEvent < policy.noRefundPeriodHours) {
      return {
        eligible: false,
        reason: `Refunds not available within ${policy.noRefundPeriodHours} hours of event`
      };
    }

    // Check refund window
    if (policy.windowDays) {
      const windowHours = policy.windowDays * 24;
      if (hoursUntilEvent > windowHours) {
        return {
          eligible: false,
          reason: `Refunds only available within ${policy.windowDays} days of event`
        };
      }
    }

    // Calculate refund amount
    const calculation = this.calculateRefund({
      ticketPrice: Number(ticket.faceValue),
      policy,
      hoursUntilEvent
    });

    return {
      eligible: true,
      refundAmount: calculation.refundAmount,
      cancellationFee: calculation.cancellationFee,
      originalAmount: calculation.originalAmount,
      policy
    };
  }

  /**
   * Calculate refund amount based on policy
   */
  calculateRefund(params: {
    ticketPrice: number;
    policy: RefundPolicy;
    hoursUntilEvent: number;
  }): RefundCalculation {
    const { ticketPrice, policy } = params;

    // Calculate cancellation fee
    let cancellationFee = 0;
    if (policy.feePercentage > 0) {
      cancellationFee = ticketPrice * (policy.feePercentage / 100);
    }
    if (policy.flatFee) {
      cancellationFee += policy.flatFee;
    }

    // Calculate final refund amount
    const refundAmount = ticketPrice - cancellationFee;

    // Platform fee will be refunded separately to organizer
    const platformFeeRefund = 0.75; // Hardcoded for now

    return {
      eligible: true,
      originalAmount: ticketPrice,
      cancellationFee,
      refundAmount,
      platformFeeRefund,
      breakdown: {
        ticketPrice,
        minusCancellationFee: -cancellationFee,
        finalRefund: refundAmount
      }
    };
  }

  /**
   * Process refund for a ticket
   */
  async processRefund(params: {
    ticketId: string;
    userId: string;
    reason?: RefundReason;
    reasonText?: string;
  }): Promise<any> {
    const { ticketId, userId, reason, reasonText } = params;

    // Check eligibility first
    const eligibility = await this.checkRefundEligibility({ ticketId, userId });

    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Refund not eligible');
    }

    // Get full ticket with payment info
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        order: {
          include: {
            event: {
              include: {
                organizer: true
              }
            },
            payment: true
          }
        }
      }
    });

    if (!ticket || !ticket.order.payment) {
      throw new Error('Payment information not found');
    }

    const payment = ticket.order.payment;
    const event = ticket.order.event;

    // Use transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Create refund record
      const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const refund = await tx.refund.create({
        data: {
          orderId: ticket.orderId,
          paymentId: payment.id,
          amount: eligibility.refundAmount!,
          reason: reason || RefundReason.CUSTOMER_REQUEST,
          reasonText: reasonText || 'Customer requested refund',
          status: RefundStatus.PROCESSING
        }
      });

      // Process Square refund
      try {
        const refundResult = await this.squareClient.refunds.refundPayment({
          idempotencyKey: `refund-${refund.id}-${Date.now()}`,
          amountMoney: {
            amount: BigInt(Math.round(eligibility.refundAmount! * 100)),
            currency: 'USD'
          },
          paymentId: payment.squarePaymentId!,
          reason: reasonText || 'Customer requested refund'
        });

        // Update refund with Square ID
        await tx.refund.update({
          where: { id: refund.id },
          data: {
            squareRefundId: refundResult.refund?.id,
            status: RefundStatus.COMPLETED,
            processedAt: new Date()
          }
        });

        // Mark ticket as CANCELLED
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.CANCELLED
          }
        });

        // Update ticket type sold count (return to inventory)
        await tx.ticketType.update({
          where: { id: ticket.ticketTypeId },
          data: {
            sold: {
              decrement: 1
            }
          }
        });

        // Refund platform fee to organizer
        // Deduct from their pending balance
        try {
          await billingService.refundPlatformFee({
            orderId: ticket.orderId,
            organizerId: event.organizerId,
            refundAmount: eligibility.refundAmount!,
            platformFeeAmount: 0.75 // Platform fee
          });
        } catch (error) {
          console.error('Failed to refund platform fee:', error);
          // Don't fail the refund if billing adjustment fails
        }

        return {
          refund,
          ticket,
          refundAmount: eligibility.refundAmount,
          squareRefundId: refundResult.refund?.id
        };

      } catch (error: any) {
        console.error('Square refund failed:', error);

        // Mark refund as failed
        await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: RefundStatus.FAILED,
            reasonText: `Refund failed: ${error.message}`
          }
        });

        throw new Error(`Payment refund failed: ${error.message}`);
      }
    });
  }

  /**
   * Get refunds for an order
   */
  async getOrderRefunds(orderId: string): Promise<any[]> {
    return await prisma.refund.findMany({
      where: { orderId },
      include: {
        order: {
          include: {
            event: true
          }
        },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: string): Promise<any> {
    return await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        order: {
          include: {
            event: true,
            tickets: true
          }
        },
        payment: true
      }
    });
  }
}

export const refundService = new RefundService();