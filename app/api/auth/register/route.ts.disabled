import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateVerificationToken } from '@/lib/auth/password';
import { emailService } from '@/lib/services/email';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Validation schema
const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

/**
 * Check rate limiting (5 attempts per hour per IP)
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  // Clean up expired entries
  if (limit && now > limit.resetTime) {
    rateLimitStore.delete(ip);
  }

  if (limit && limit.count >= 5 && now <= limit.resetTime) {
    return false; // Rate limit exceeded
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
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = registrationSchema.safeParse(body);

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

    const { email, password, firstName, lastName, phone, marketingOptIn } =
      validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const { token, expires } = generateVerificationToken();

    // Create user in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`,
          phone,
          marketingOptIn,
          role: 'ATTENDEE',
          status: 'ACTIVE',
          isVerified: false
        }
      });

      // Create verification token
      await tx.verificationToken.create({
        data: {
          identifier: newUser.email,
          token,
          expires
        }
      });

      // Log registration
      await tx.auditLog.create({
        data: {
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: newUser.id,
          userId: newUser.id,
          ipAddress: ip,
          metadata: {
            email: newUser.email,
            source: 'web'
          }
        }
      });

      return newUser;
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;

    try {
      await emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        verificationUrl
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, log it for retry
      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_SEND_FAILED',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            error: String(emailError),
            emailType: 'verification'
          }
        }
      });
    }

    // Return success response
    return NextResponse.json(
      {
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);

    // Log error
    await prisma.auditLog.create({
      data: {
        action: 'REGISTRATION_ERROR',
        entityType: 'SYSTEM',
        entityId: 'registration',
        metadata: {
          error: String(error),
          timestamp: new Date()
        }
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}