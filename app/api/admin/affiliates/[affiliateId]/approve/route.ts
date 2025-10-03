import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email';
import { z } from 'zod';

/**
 * Validation schema for approval request
 */
const approvalSchema = z.object({
  notes: z.string().optional()
});

/**
 * POST /api/admin/affiliates/[affiliateId]/approve
 *
 * Approves an affiliate application
 *
 * Request Body:
 * - notes (optional): Internal notes about the approval
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have ADMIN or SUPER_ADMIN role
 * @returns Updated affiliate profile with approval details
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

    // Authorization check - only admins can approve affiliates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = approvalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { notes } = validationResult.data;
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

    // Check if already approved
    if (affiliate.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Affiliate is already approved' },
        { status: 400 }
      );
    }

    // Update affiliate and user status in a transaction
    const updatedAffiliate = await prisma.$transaction(async (tx) => {
      // Update affiliate status
      const updated = await tx.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'APPROVED',
          approvedBy: session.user.id,
          approvedAt: new Date()
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

      // Update user status if still pending verification
      if (affiliate.user.status === 'PENDING_VERIFICATION') {
        await tx.user.update({
          where: { id: affiliate.userId },
          data: {
            status: 'ACTIVE',
            isVerified: true
          }
        });
      }

      // Log the approval in audit log
      await tx.auditLog.create({
        data: {
          action: 'AFFILIATE_APPROVED',
          entityType: 'Affiliate',
          entityId: affiliateId,
          userId: session.user.id,
          newValues: {
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date().toISOString(),
            notes
          }
        }
      });

      return updated;
    });

    // Send approval email (non-blocking)
    const dashboardUrl = `${process.env.NEXTAUTH_URL || 'https://events.stepperslife.com'}/dashboard/affiliate`;

    try {
      await emailService.sendAffiliateApprovalEmail({
        to: updatedAffiliate.user.email,
        firstName: updatedAffiliate.user.firstName,
        affiliateId: updatedAffiliate.id,
        dashboardUrl
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate approved successfully',
      data: updatedAffiliate
    });

  } catch (error) {
    console.error('Error approving affiliate:', error);

    return NextResponse.json(
      { error: 'Failed to approve affiliate. Please try again.' },
      { status: 500 }
    );
  }
}
