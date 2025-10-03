/**
 * Ticket Transfer Service
 *
 * Handles ticket transfers between users including transfer initiation,
 * acceptance/decline, QR code regeneration, and expiration management.
 *
 * @module TicketTransferService
 */

import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

export enum TransferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface TransferEligibility {
  eligible: boolean;
  reason?: string;
}

export interface TransferInfo {
  id: string;
  status: TransferStatus;
  ticket: any;
  fromUser: any;
  toEmail: string;
  toUser?: any;
  message?: string;
  expiresAt: Date;
  initiatedAt: Date;
}

export class TicketTransferService {
  /**
   * Check if ticket is eligible for transfer
   */
  async checkTransferEligibility(params: {
    ticketId: string;
    userId: string;
  }): Promise<TransferEligibility> {
    const { ticketId, userId } = params;

    // Get ticket with event details
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

    // Check ticket status
    if (ticket.status !== 'VALID') {
      return {
        eligible: false,
        reason: `Ticket cannot be transferred (status: ${ticket.status})`
      };
    }

    // Check if already checked in
    if (ticket.checkedInAt) {
      return {
        eligible: false,
        reason: 'Ticket has already been used for check-in'
      };
    }

    // Check if event already started or passed
    const now = new Date();
    const eventDate = new Date(ticket.order.event.startDate);
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEvent < 0) {
      return {
        eligible: false,
        reason: 'Event has already occurred'
      };
    }

    // No transfers within 24 hours of event
    if (hoursUntilEvent < 24) {
      return {
        eligible: false,
        reason: 'Transfers not allowed within 24 hours of event'
      };
    }

    // Check if there's already a pending transfer
    const pendingTransfer = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE "ticketId" = ${ticketId}
      AND status = 'PENDING'
      LIMIT 1
    `;

    if (pendingTransfer && pendingTransfer.length > 0) {
      return {
        eligible: false,
        reason: 'A transfer is already pending for this ticket'
      };
    }

    // Count previous transfers for this ticket
    const transferCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM ticket_transfers
      WHERE "ticketId" = ${ticketId}
      AND status = 'ACCEPTED'
    `;

    const count = transferCount[0]?.count || 0;
    if (count >= 3) {
      return {
        eligible: false,
        reason: 'Maximum transfer limit reached (3 transfers per ticket)'
      };
    }

    return {
      eligible: true
    };
  }

  /**
   * Initiate ticket transfer
   */
  async initiateTransfer(params: {
    ticketId: string;
    fromUserId: string;
    toEmail: string;
    message?: string;
  }): Promise<TransferInfo> {
    const { ticketId, fromUserId, toEmail, message } = params;

    // Check eligibility
    const eligibility = await this.checkTransferEligibility({
      ticketId,
      userId: fromUserId
    });

    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Transfer not allowed');
    }

    // Prevent transfer to self
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId }
    });

    if (fromUser?.email.toLowerCase() === toEmail.toLowerCase()) {
      throw new Error('Cannot transfer ticket to yourself');
    }

    // Get ticket with full details
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
      throw new Error('Ticket not found');
    }

    // Check if recipient user exists
    const toUser = await prisma.user.findUnique({
      where: { email: toEmail.toLowerCase() }
    });

    // Create transfer record
    // Calculate expiration (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const transfer = await prisma.$executeRaw`
      INSERT INTO ticket_transfers (
        id, "ticketId", "fromUserId", "toEmail", "toUserId",
        status, message, "oldQrCode", "expiresAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${ticketId},
        ${fromUserId},
        ${toEmail.toLowerCase()},
        ${toUser?.id || null},
        'PENDING',
        ${message || null},
        ${ticket.qrCode},
        ${expiresAt}
      )
    `;

    // Get the created transfer
    const createdTransfer = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE "ticketId" = ${ticketId}
      AND status = 'PENDING'
      ORDER BY "initiatedAt" DESC
      LIMIT 1
    `;

    const transferRecord = createdTransfer[0];

    return {
      id: transferRecord.id,
      status: TransferStatus.PENDING,
      ticket,
      fromUser,
      toEmail,
      toUser: toUser || undefined,
      message: message || undefined,
      expiresAt,
      initiatedAt: new Date()
    };
  }

  /**
   * Accept ticket transfer
   */
  async acceptTransfer(params: {
    transferId: string;
    userId: string;
  }): Promise<any> {
    const { transferId, userId } = params;

    // Get transfer with full details
    const transfers = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;

    if (!transfers || transfers.length === 0) {
      throw new Error('Transfer not found');
    }

    const transfer = transfers[0];

    // Check if transfer is still pending
    if (transfer.status !== 'PENDING') {
      throw new Error(`Transfer cannot be accepted (status: ${transfer.status})`);
    }

    // Check if transfer has expired
    if (new Date() > new Date(transfer.expiresAt)) {
      // Mark as expired
      await prisma.$executeRaw`
        UPDATE ticket_transfers
        SET status = 'EXPIRED'
        WHERE id = ${transferId}
      `;
      throw new Error('Transfer has expired');
    }

    // Verify user matches recipient
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email.toLowerCase() !== transfer.toEmail.toLowerCase()) {
      throw new Error('Unauthorized to accept this transfer');
    }

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: transfer.ticketId },
      include: {
        order: {
          include: {
            event: true
          }
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Use transaction for atomic update
    return await prisma.$transaction(async (tx) => {
      // Generate new QR code
      const newQrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
      const newValidationCode = `VAL-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;

      // Update ticket with new owner and QR code
      await tx.ticket.update({
        where: { id: transfer.ticketId },
        data: {
          userId: userId,
          holderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          holderEmail: user.email,
          qrCode: newQrCode,
          validationCode: newValidationCode,
          status: TicketStatus.VALID
        }
      });

      // Update transfer record
      await tx.$executeRaw`
        UPDATE ticket_transfers
        SET status = 'ACCEPTED',
            "acceptedAt" = NOW(),
            "toUserId" = ${userId},
            "newQrCode" = ${newQrCode}
        WHERE id = ${transferId}
      `;

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'TICKET_TRANSFERRED',
          entityType: 'TICKET',
          entityId: transfer.ticketId,
          userId: userId,
          metadata: {
            fromUserId: transfer.fromUserId,
            toUserId: userId,
            transferId: transferId,
            oldQrCode: transfer.oldQrCode,
            newQrCode: newQrCode
          }
        }
      });

      return {
        transfer,
        ticket,
        newQrCode,
        user
      };
    });
  }

  /**
   * Decline ticket transfer
   */
  async declineTransfer(params: {
    transferId: string;
    userId: string;
    reason?: string;
  }): Promise<void> {
    const { transferId, userId, reason } = params;

    // Get transfer
    const transfers = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;

    if (!transfers || transfers.length === 0) {
      throw new Error('Transfer not found');
    }

    const transfer = transfers[0];

    // Verify user matches recipient
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email.toLowerCase() !== transfer.toEmail.toLowerCase()) {
      throw new Error('Unauthorized to decline this transfer');
    }

    // Check if transfer is still pending
    if (transfer.status !== 'PENDING') {
      throw new Error(`Transfer cannot be declined (status: ${transfer.status})`);
    }

    // Update transfer record
    await prisma.$executeRaw`
      UPDATE ticket_transfers
      SET status = 'DECLINED',
          "declinedAt" = NOW()
      WHERE id = ${transferId}
    `;
  }

  /**
   * Cancel transfer (by sender)
   */
  async cancelTransfer(params: {
    transferId: string;
    userId: string;
  }): Promise<void> {
    const { transferId, userId } = params;

    // Get transfer
    const transfers = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;

    if (!transfers || transfers.length === 0) {
      throw new Error('Transfer not found');
    }

    const transfer = transfers[0];

    // Verify user is the sender
    if (transfer.fromUserId !== userId) {
      throw new Error('Unauthorized to cancel this transfer');
    }

    // Check if transfer is still pending
    if (transfer.status !== 'PENDING') {
      throw new Error(`Transfer cannot be cancelled (status: ${transfer.status})`);
    }

    // Update transfer record
    await prisma.$executeRaw`
      UPDATE ticket_transfers
      SET status = 'CANCELLED'
      WHERE id = ${transferId}
    `;
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(transferId: string): Promise<any> {
    const transfers = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE id = ${transferId}
      LIMIT 1
    `;

    return transfers && transfers.length > 0 ? transfers[0] : null;
  }

  /**
   * Get ticket transfers
   */
  async getTicketTransfers(ticketId: string): Promise<any[]> {
    return await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE "ticketId" = ${ticketId}
      ORDER BY "initiatedAt" DESC
    `;
  }

  /**
   * Process expired transfers (for cron job)
   */
  async processExpiredTransfers(): Promise<{
    processed: number;
    errors: string[];
  }> {
    const now = new Date();

    // Find expired pending transfers
    const expiredTransfers = await prisma.$queryRaw<any[]>`
      SELECT * FROM ticket_transfers
      WHERE status = 'PENDING'
      AND "expiresAt" < ${now}
    `;

    const errors: string[] = [];
    let processed = 0;

    for (const transfer of expiredTransfers) {
      try {
        await prisma.$executeRaw`
          UPDATE ticket_transfers
          SET status = 'EXPIRED'
          WHERE id = ${transfer.id}
        `;
        processed++;
      } catch (error) {
        errors.push(`Failed to expire transfer ${transfer.id}: ${error}`);
      }
    }

    return { processed, errors };
  }
}

export const ticketTransferService = new TicketTransferService();