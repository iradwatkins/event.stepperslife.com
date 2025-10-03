import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { emailService } from '@/lib/services/email';

// Registration validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  businessName: z.string().optional(),
  taxId: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, phone, password, businessName, taxId } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and affiliate profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with ATTENDEE role
      // NOTE: Affiliate is no longer a user role - it's a separate Affiliate table record
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          phone,
          role: 'ATTENDEE', // Default role - affiliate status is in Affiliate table
          status: 'PENDING_VERIFICATION',
          isVerified: false,
        },
      });

      // Create affiliate profile
      const affiliate = await tx.affiliate.create({
        data: {
          userId: user.id,
          businessName,
          taxId,
          status: 'PENDING',
        },
      });

      return { user, affiliate };
    });

    // Send welcome email
    try {
      await emailService.sendAffiliateWelcomeEmail({
        to: result.user.email,
        firstName: result.user.firstName,
        affiliateId: result.affiliate.id,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for verification instructions.',
      data: {
        userId: result.user.id,
        affiliateId: result.affiliate.id,
        email: result.user.email,
        status: result.affiliate.status,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Affiliate registration error:', error);

    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
