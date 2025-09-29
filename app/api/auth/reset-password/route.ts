import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken, hashPassword, validatePassword } from '@/lib/auth/password';
import { emailService } from '@/lib/services/email';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Request reset schema
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Confirm reset schema
const confirmResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

/**
 * Check rate limiting (3 attempts per hour per IP)
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (limit && now > limit.resetTime) {
    rateLimitStore.delete(ip);
  }

  if (limit && limit.count >= 3 && now <= limit.resetTime) {
    return false;
  }

  if (limit) {
    limit.count++;
  } else {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 3600000 // 1 hour
    });
  }

  return true;
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Handle password reset request
  if (pathname.includes('request')) {
    return handleResetRequest(request);
  }

  // Handle password reset confirmation
  return handleResetConfirmation(request);
}

async function handleResetRequest(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = requestResetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success for security (don't reveal if email exists)
    const successResponse = NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    });

    if (!user) {
      // Log attempt for security monitoring
      await prisma.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_ATTEMPTED',
          entityType: 'USER',
          entityId: 'unknown',
          ipAddress: ip,
          metadata: {
            email,
            reason: 'User not found'
          }
        }
      });

      return successResponse;
    }

    // Generate reset token
    const { token, expires } = generatePasswordResetToken();

    // Store reset token
    await prisma.$transaction(async (tx) => {
      // Delete any existing reset tokens for this user
      await tx.verificationToken.deleteMany({
        where: {
          identifier: user.email,
          expires: { gte: new Date() }
        }
      });

      // Create new reset token
      await tx.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires
        }
      });

      // Log reset request
      await tx.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_REQUESTED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          ipAddress: ip,
          metadata: {
            email: user.email
          }
        }
      });
    });

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetUrl
      );
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);

      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_SEND_FAILED',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            error: String(emailError),
            emailType: 'password_reset'
          }
        }
      });

      // Still return success to user but log the error
    }

    return successResponse;

  } catch (error) {
    console.error('Password reset request error:', error);

    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_ERROR',
        entityType: 'SYSTEM',
        entityId: 'password_reset',
        metadata: {
          error: String(error),
          type: 'request'
        }
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

async function handleResetConfirmation(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = confirmResetSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }));

      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          errors: passwordValidation.errors.map(error => ({
            field: 'password',
            message: error
          }))
        },
        { status: 400 }
      );
    }

    // Find and validate reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 404 }
      );
    }

    if (new Date() > resetToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      });

      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 410 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and delete token
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      // Delete reset token
      await tx.verificationToken.delete({
        where: { token }
      });

      // Log password reset
      await tx.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_COMPLETED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          metadata: {
            email: user.email
          }
        }
      });
    });

    return NextResponse.json({
      message: 'Password reset successfully. You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);

    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_ERROR',
        entityType: 'SYSTEM',
        entityId: 'password_reset',
        metadata: {
          error: String(error),
          type: 'confirmation'
        }
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}