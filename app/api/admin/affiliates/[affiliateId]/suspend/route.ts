import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Validation schema for suspension request
 */
const suspensionSchema = z.object({
  reason: z.string()
    .min(10, 'Suspension reason must be at least 10 characters')
    .max(500, 'Suspension reason must be less than 500 characters'),
  permanent: z.boolean().default(false)
});

/**
 * POST /api/admin/affiliates/[affiliateId]/suspend
 *
 * Suspends an active affiliate account
 *
 * Request Body:
 * - reason (required): Reason for suspension (min 10 chars)
 * - permanent (optional): Whether suspension is permanent (BANNED) or temporary (SUSPENDED)
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have ADMIN or SUPER_ADMIN role
 * @returns Updated affiliate profile with suspension details
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

    // Authorization check - only admins can suspend affiliates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = suspensionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { reason, permanent } = validationResult.data;
    const { affiliateId } = params;

    // Fetch affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
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

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Update affiliate status in a transaction
    const updatedAffiliate = await prisma.$transaction(async (tx) => {
      // Update affiliate status
      const updated = await tx.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: permanent ? 'BANNED' : 'SUSPENDED',
          suspendedAt: new Date(),
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

      // Update user account status
      await tx.user.update({
        where: { id: affiliate.userId },
        data: {
          status: permanent ? 'BANNED' : 'SUSPENDED'
        }
      });

      // Log the suspension in audit log
      await tx.auditLog.create({
        data: {
          action: permanent ? 'AFFILIATE_BANNED' : 'AFFILIATE_SUSPENDED',
          entityType: 'Affiliate',
          entityId: affiliateId,
          userId: session.user.id,
          newValues: {
            status: permanent ? 'BANNED' : 'SUSPENDED',
            reason,
            suspendedBy: session.user.id,
            suspendedAt: new Date().toISOString(),
            permanent
          }
        }
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Affiliate ${permanent ? 'banned' : 'suspended'} successfully`,
      data: updatedAffiliate
    });

  } catch (error) {
    console.error('Error suspending affiliate:', error);

    return NextResponse.json(
      { error: 'Failed to suspend affiliate. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/affiliates/[affiliateId]/suspend
 *
 * Reactivates a suspended affiliate account
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have ADMIN or SUPER_ADMIN role
 * @returns Updated affiliate profile with reactivation details
 */
export async function DELETE(
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

    // Authorization check
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { affiliateId } = params;

    // Fetch affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Check if affiliate is suspended
    if (affiliate.status !== 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Affiliate is not currently suspended' },
        { status: 400 }
      );
    }

    // Reactivate affiliate
    const updatedAffiliate = await prisma.$transaction(async (tx) => {
      const updated = await tx.affiliate.update({
        where: { id: affiliateId },
        data: {
          status: 'APPROVED',
          suspendedAt: null,
          suspensionReason: null
        }
      });

      await tx.user.update({
        where: { id: affiliate.userId },
        data: {
          status: 'ACTIVE'
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'AFFILIATE_REACTIVATED',
          entityType: 'Affiliate',
          entityId: affiliateId,
          userId: session.user.id,
          newValues: {
            status: 'APPROVED',
            reactivatedBy: session.user.id,
            reactivatedAt: new Date().toISOString()
          }
        }
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Affiliate reactivated successfully',
      data: updatedAffiliate
    });

  } catch (error) {
    console.error('Error reactivating affiliate:', error);

    return NextResponse.json(
      { error: 'Failed to reactivate affiliate. Please try again.' },
      { status: 500 }
    );
  }
}
