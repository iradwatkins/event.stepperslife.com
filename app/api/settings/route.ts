import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * GET /api/settings
 * Fetch platform settings (public access, but sensitive fields hidden for non-admins)
 */
export async function GET() {
  try {
    const session = await auth();

    // Fetch settings (there's only one row with id='1')
    const settings = await prisma.platformSettings.findUnique({
      where: { id: '1' },
    });

    if (!settings) {
      // Return defaults if no settings exist
      return NextResponse.json({
        platformName: 'Stepperslife Events',
        platformDomain: 'events.stepperslife.com',
        platformDescription: 'Your premier destination for discovering and hosting amazing events in the stepping community.',
        primaryColor: '#3b82f6',
        secondaryColor: '#06b6d4',
        platformFeePercent: 2.5,
        emailFromName: 'Stepperslife Events',
        emailFromAddress: 'noreply@stepperslife.com',
      });
    }

    // Return all settings (admins can see everything)
    if (session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json(settings);
    }

    // Non-admins get public settings only
    return NextResponse.json({
      platformName: settings.platformName,
      platformDomain: settings.platformDomain,
      platformDescription: settings.platformDescription,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update platform settings (Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication and authorization
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate and sanitize input
    const allowedFields = [
      'platformName',
      'platformDomain',
      'platformDescription',
      'primaryColor',
      'secondaryColor',
      'logoUrl',
      'faviconUrl',
      'platformFeePercent',
      'emailFromName',
      'emailFromAddress',
      'emailReplyTo',
    ];

    const updateData: any = {};

    // Only include allowed fields that were provided
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate platformFeePercent
    if (updateData.platformFeePercent !== undefined) {
      const fee = parseFloat(updateData.platformFeePercent);
      if (isNaN(fee) || fee < 0 || fee > 100) {
        return NextResponse.json(
          { error: 'Platform fee must be between 0 and 100' },
          { status: 400 }
        );
      }
      updateData.platformFeePercent = fee;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (updateData.emailFromAddress && !emailRegex.test(updateData.emailFromAddress)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    if (updateData.emailReplyTo && !emailRegex.test(updateData.emailReplyTo)) {
      return NextResponse.json(
        { error: 'Invalid reply-to email format' },
        { status: 400 }
      );
    }

    // Validate color format (hex colors)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (updateData.primaryColor && !colorRegex.test(updateData.primaryColor)) {
      return NextResponse.json(
        { error: 'Primary color must be a valid hex color (e.g., #3b82f6)' },
        { status: 400 }
      );
    }

    if (updateData.secondaryColor && !colorRegex.test(updateData.secondaryColor)) {
      return NextResponse.json(
        { error: 'Secondary color must be a valid hex color (e.g., #06b6d4)' },
        { status: 400 }
      );
    }

    // Update settings (upsert to handle if row doesn't exist)
    const updatedSettings = await prisma.platformSettings.upsert({
      where: { id: '1' },
      update: updateData,
      create: {
        id: '1',
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings,
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
