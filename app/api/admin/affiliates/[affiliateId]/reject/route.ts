import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email';
import { z } from 'zod';

/**
 * Validation schema for rejection request
 */
const rejectionSchema = z.object({
  reason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
  internalNotes: z.string().optional()
});

/**
 * POST /api/admin/affiliates/[affiliateId]/reject
 *
 * Rejects an affiliate application
 *
 * Request Body:
 * - reason (required): User-facing reason for rejection (min 10 chars)
 * - internalNotes (optional): Internal admin notes (not sent to user)
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have ADMIN or SUPER_ADMIN role
 * @returns Updated affiliate profile with rejection details
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ affiliateId: string }> }
) {
  try {
    const params = await context.params;

    // Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorization check - only admins can reject affiliates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = rejectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { reason, internalNotes } = validationResult.data;
    const { affiliateId } = params;

    // Fetch affiliate with user details
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (affiliate.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot reject an approved affiliate. Consider suspending instead.' },
        { status: 400 }
      );
    }

    // Update affiliate status and user account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update affiliate status to inactive
      const updatedAffiliate = await tx.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'INACTIVE',
          suspensionReason: reason
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Update user status to inactive if they were pending
      if (affiliate.user.status === 'PENDING_VERIFICATION') {
        await tx.user.update({
          where: { id: affiliate.userId },
          data: {
            status: 'INACTIVE'
          }
        });
      }

      // Log the rejection in audit log
      await tx.auditLog.create({
        data: {
          action: 'AFFILIATE_REJECTED',
          entityType: 'Affiliate',
          entityId: affiliateId,
          userId: session.user.id,
          newValues: {
            status: 'INACTIVE',
            reason,
            internalNotes,
            rejectedBy: session.user.id,
            rejectedAt: new Date().toISOString()
          }
        }
      });

      return updatedAffiliate;
    });

    // Send rejection email (non-blocking)
    try {
      await emailService.sendAffiliateRejectionEmail({
        to: result.user.email,
        firstName: result.user.firstName,
        reason
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate application rejected',
      data: result
    });

  } catch (error) {
    console.error('Error rejecting affiliate:', error);

    return NextResponse.json(
      { error: 'Failed to reject affiliate. Please try again.' },
      { status: 500 }
    );
  }
}
