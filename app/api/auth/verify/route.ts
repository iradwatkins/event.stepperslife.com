import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email';

// Validation schema
const verifySchema = z.object({
  token: z.string().min(1, 'Token is required')
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = verifySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      });

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Clean up token
      await prisma.verificationToken.delete({
        where: { token }
      });

      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Update user in transaction
    await prisma.$transaction(async (tx) => {
      // Verify user email
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          isVerified: true
        }
      });

      // Delete verification token
      await tx.verificationToken.delete({
        where: { token }
      });

      // Log verification
      await tx.auditLog.create({
        data: {
          action: 'EMAIL_VERIFIED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          metadata: {
            email: user.email,
            verifiedAt: new Date()
          }
        }
      });
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json(
      {
        message: 'Email verified successfully! You can now log in.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verification error:', error);

    await prisma.auditLog.create({
      data: {
        action: 'VERIFICATION_ERROR',
        entityType: 'SYSTEM',
        entityId: 'verification',
        metadata: {
          error: String(error),
          timestamp: new Date()
        }
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}

// GET method for clicking verification links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      // Redirect to error page
      return NextResponse.redirect(
        new URL('/auth/verify?status=invalid', process.env.NEXTAUTH_URL!)
      );
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      });

      return NextResponse.redirect(
        new URL('/auth/verify?status=expired', process.env.NEXTAUTH_URL!)
      );
    }

    // Find and verify user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/verify?status=error', process.env.NEXTAUTH_URL!)
      );
    }

    if (user.emailVerified) {
      // Already verified, clean up token
      await prisma.verificationToken.delete({
        where: { token }
      });

      return NextResponse.redirect(
        new URL('/auth/verify?status=already-verified', process.env.NEXTAUTH_URL!)
      );
    }

    // Verify user
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          isVerified: true
        }
      });

      await tx.verificationToken.delete({
        where: { token }
      });

      await tx.auditLog.create({
        data: {
          action: 'EMAIL_VERIFIED',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
          metadata: {
            email: user.email,
            method: 'GET',
            verifiedAt: new Date()
          }
        }
      });
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth/verify?status=success', process.env.NEXTAUTH_URL!)
    );

  } catch (error) {
    console.error('Verification error:', error);

    return NextResponse.redirect(
      new URL('/auth/verify?status=error', process.env.NEXTAUTH_URL!)
    );
  }
}