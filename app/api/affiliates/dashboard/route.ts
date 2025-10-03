import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { getAffiliateDashboard } from '@/lib/services/affiliate.service';

/**
 * GET /api/affiliates/dashboard
 *
 * Returns comprehensive dashboard data for the authenticated affiliate
 *
 * @requires Authentication - User must be logged in
 * @requires Authorization - User must have AFFILIATE role and be APPROVED
 * @returns Dashboard data including profile, stats, tracking links, sales, and events
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "profile": {
 *       "id": "aff-123",
 *       "userId": "user-456",
 *       "businessName": "John's Marketing",
 *       "status": "APPROVED",
 *       "approvedAt": "2025-01-01T00:00:00.000Z",
 *       "totalSales": 45,
 *       "totalRevenue": 3250.00,
 *       "totalCommission": 487.50,
 *       "totalPaidOut": 362.50,
 *       "pendingPayout": 125.00,
 *       "stripeConnectStatus": "CONNECTED"
 *     },
 *     "trackingLinks": [...],
 *     "recentSales": [...],
 *     "upcomingEvents": [...],
 *     "stats": {
 *       "clickThroughRate": 15.5,
 *       "conversionRate": 3.2,
 *       "averageOrderValue": 72.22,
 *       "averageCommission": 10.83
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please log in to access your dashboard.'
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // AUTHORIZATION
    // ========================================================================

    // Check if user has an affiliate account
    // NOTE: Affiliate is no longer a user role - it's an assignment/status
    const affiliateAccount = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    });

    if (!affiliateAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. You must be registered as an affiliate to access this resource.'
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // FETCH DASHBOARD DATA
    // ========================================================================

    const dashboardData = await getAffiliateDashboard(session.user.id);

    // ========================================================================
    // ADDITIONAL STATUS CHECKS
    // ========================================================================

    // If affiliate is pending, return limited data with message
    if (dashboardData.profile.status === 'PENDING') {
      return NextResponse.json({
        success: true,
        message: 'Your affiliate application is pending review. We\'ll notify you once approved.',
        data: {
          profile: dashboardData.profile,
          trackingLinks: [],
          recentSales: [],
          upcomingEvents: [],
          stats: {
            clickThroughRate: 0,
            conversionRate: 0,
            averageOrderValue: 0,
            averageCommission: 0
          }
        }
      });
    }

    // If affiliate is suspended or banned, return error
    if (dashboardData.profile.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your affiliate account has been suspended. Please contact support for assistance.',
          data: {
            profile: dashboardData.profile
          }
        },
        { status: 403 }
      );
    }

    if (dashboardData.profile.status === 'BANNED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your affiliate account has been permanently banned.',
          data: {
            profile: dashboardData.profile
          }
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    console.error('Error fetching affiliate dashboard:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === 'Affiliate profile not found') {
        return NextResponse.json(
          {
            success: false,
            error: 'Affiliate profile not found. Please complete your registration.'
          },
          { status: 404 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load dashboard. Please try again later.'
      },
      { status: 500 }
    );
  }
}
