import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email';
import * as crypto from 'crypto';

// Rate limiting store (in-memory for now, consider Redis for production)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

/**
 * POST /api/auth/verify/resend
 * Resends verification email to user
 *
 * Request body:
 * - email: string (user's email address)
 *
 * Responses:
 * - 200: Email sent successfully
 * - 400: Invalid request (missing email, invalid format)
 * - 404: User not found
 * - 429: Too many requests (rate limited)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email presence
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email address is required'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    // Rate limiting check
    const normalizedEmail = email.toLowerCase();
    const lastRequestTime = rateLimitMap.get(normalizedEmail);
    const now = Date.now();

    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW - (now - lastRequestTime)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting another verification email`
        },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        isVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No account found with this email address'
        },
        { status: 404 }
      );
    }

    // If user is already verified, return success without sending email
    if (user.isVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Your email is already verified. You can log in now.'
        },
        { status: 200 }
      );
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    // Build verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3004';
    const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationUrl
    );

    if (!emailSent) {
      // Clean up token if email fails
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedEmail,
            token,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send verification email. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Update rate limit map
    rateLimitMap.set(normalizedEmail, now);

    // Clean up old rate limit entries (keep map size reasonable)
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.delete(key);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in resend verification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}
