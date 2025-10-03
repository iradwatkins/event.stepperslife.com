import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmEmail: z.string().email('Valid email required'),
  reason: z.string().optional()
});

async function handleDeleteAccount(request: NextRequest, context: any) {
  const { user } = context;

  try {
    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    // Confirm email matches
    if (validatedData.confirmEmail !== user.email) {
      return NextResponse.json(
        { error: 'Email confirmation does not match your account email' },
        { status: 400 }
      );
    }

    // Check for active events or orders
    const activeEvents = await prisma.event.count({
      where: {
        organizerId: user.id,
        status: {
          in: ['DRAFT', 'PUBLISHED']
        },
        deletedAt: null
      }
    });

    if (activeEvents > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with active events',
          details: `You have ${activeEvents} active event(s). Please cancel or complete them first.`
        },
        { status: 400 }
      );
    }

    // Check for upcoming tickets
    const upcomingTickets = await prisma.ticket.count({
      where: {
        userId: user.id,
        status: 'VALID',
        event: {
          startDate: {
            gte: new Date()
          }
        }
      }
    });

    if (upcomingTickets > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with upcoming tickets',
          details: `You have ${upcomingTickets} upcoming ticket(s). Please wait for events to complete or request refunds.`
        },
        { status: 400 }
      );
    }

    // Perform soft delete
    await prisma.$transaction(async (tx) => {
      // Soft delete user
      await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
          metadata: {
            ...(typeof user.metadata === 'object' && user.metadata !== null ? user.metadata : {}),
            deletionReason: validatedData.reason || 'User requested deletion',
            deletedAt: new Date().toISOString()
          }
        }
      });

      // Invalidate all sessions
      await tx.session.deleteMany({
        where: { userId: user.id }
      });

      // Log account deletion
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'ACCOUNT_DELETED',
          entityType: 'user',
          entityId: user.id,
          metadata: {
            email: user.email,
            reason: validatedData.reason || 'User requested deletion',
            timestamp: new Date().toISOString()
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Your account has been successfully deleted. All sessions have been terminated.'
    });

  } catch (error: any) {
    console.error('Error deleting account:', error);
    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email },
      tags: { component: 'account-deletion', severity: 'high' },
      extra: { errorMessage: error.message }
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to delete account',
        details: error.message
      },
      { status: 400 }
    );
  }
}

export const POST = withAuth(handleDeleteAccount, {
  permissions: ['profile.edit_own']
});