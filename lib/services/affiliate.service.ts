/**
 * Affiliate Service
 *
 * Core business logic for affiliate operations including:
 * - Dashboard statistics
 * - Sales tracking
 * - Commission calculations
 * - Performance analytics
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface AffiliateDashboardData {
  profile: {
    id: string;
    userId: string;
    businessName: string | null;
    status: string;
    approvedAt: Date | null;
    totalSales: number;
    totalRevenue: number;
    totalCommission: number;
    totalPaidOut: number;
    pendingPayout: number;
    stripeConnectStatus: 'NOT_CONNECTED' | 'CONNECTED' | 'PENDING';
  };
  trackingLinks: Array<{
    id: string;
    eventId: string;
    eventName: string;
    linkCode: string;
    trackingUrl: string;
    clicks: number;
    conversions: number;
    totalSales: number;
    isActive: boolean;
  }>;
  recentSales: Array<{
    id: string;
    eventName: string;
    saleDate: Date;
    ticketCount: number;
    amount: number;
    commission: number;
    status: string;
    saleType: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    startDate: Date;
    coverImage: string | null;
    commissionRate: number;
    commissionType: string;
    available: boolean;
  }>;
  stats: {
    clickThroughRate: number;
    conversionRate: number;
    averageOrderValue: number;
    averageCommission: number;
  };
}

// ============================================================================
// AFFILIATE DASHBOARD
// ============================================================================

/**
 * Get comprehensive dashboard data for an affiliate
 *
 * @param userId - The user ID of the affiliate
 * @returns Complete dashboard data including stats, links, sales, and events
 * @throws Error if user is not an affiliate or not approved
 */
export async function getAffiliateDashboard(
  userId: string
): Promise<AffiliateDashboardData> {
  // Fetch affiliate profile with basic stats
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!affiliate) {
    throw new Error('Affiliate profile not found');
  }

  // Calculate pending payout (approved but not yet paid)
  const pendingPayout = Number(affiliate.totalCommission) - Number(affiliate.totalPaidOut);

  // Check Stripe Connect status
  const stripeConnectStatus = affiliate.stripeConnectId
    ? 'CONNECTED'
    : 'NOT_CONNECTED';

  // Fetch tracking links with statistics
  const trackingLinks = await getAffiliateTrackingLinks(affiliate.id);

  // Fetch recent sales (last 10)
  const recentSales = await getRecentAffiliateSales(affiliate.id, 10);

  // Fetch upcoming events
  const upcomingEvents = await getUpcomingEventsForAffiliate(affiliate.id);

  // Calculate performance statistics
  const stats = await calculateAffiliateStats(affiliate.id);

  return {
    profile: {
      id: affiliate.id,
      userId: affiliate.userId,
      businessName: affiliate.businessName,
      status: affiliate.status,
      approvedAt: affiliate.approvedAt,
      totalSales: affiliate.totalSales,
      totalRevenue: Number(affiliate.totalRevenue),
      totalCommission: Number(affiliate.totalCommission),
      totalPaidOut: Number(affiliate.totalPaidOut),
      pendingPayout,
      stripeConnectStatus
    },
    trackingLinks,
    recentSales,
    upcomingEvents,
    stats
  };
}

// ============================================================================
// TRACKING LINKS
// ============================================================================

/**
 * Get all active tracking links for an affiliate
 *
 * @param affiliateId - The affiliate ID
 * @returns Array of tracking links with statistics
 */
async function getAffiliateTrackingLinks(affiliateId: string) {
  const links = await prisma.affiliateLink.findMany({
    where: {
      affiliateId,
      isActive: true,
      // Only show links for events that haven't ended
      event: {
        endDate: {
          gte: new Date()
        }
      }
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10 // Limit to 10 most recent active links
  });

  return links.map(link => ({
    id: link.id,
    eventId: link.eventId,
    eventName: link.event.name,
    linkCode: link.linkCode,
    trackingUrl: link.trackingUrl,
    clicks: link.clicks,
    conversions: link.conversions,
    totalSales: Number(link.totalSales),
    isActive: link.isActive
  }));
}

// ============================================================================
// SALES HISTORY
// ============================================================================

/**
 * Get recent sales for an affiliate
 *
 * @param affiliateId - The affiliate ID
 * @param limit - Number of sales to return
 * @returns Array of recent sales
 */
async function getRecentAffiliateSales(affiliateId: string, limit: number = 10) {
  const sales = await prisma.affiliateSale.findMany({
    where: { affiliateId },
    include: {
      event: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      saleDate: 'desc'
    },
    take: limit
  });

  return sales.map(sale => ({
    id: sale.id,
    eventName: sale.event.name,
    saleDate: sale.saleDate,
    ticketCount: sale.ticketCount,
    amount: Number(sale.total),
    commission: Number(sale.commissionAmount),
    status: sale.settlementStatus,
    saleType: sale.saleType
  }));
}

// ============================================================================
// UPCOMING EVENTS
// ============================================================================

/**
 * Get upcoming events available for promotion
 *
 * @param affiliateId - The affiliate ID
 * @returns Array of upcoming events with commission info
 */
async function getUpcomingEventsForAffiliate(affiliateId: string) {
  // Get events that:
  // 1. Start in the future
  // 2. Are published
  // 3. Affiliate has not yet created a link for (or link is inactive)

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1); // Tomorrow onwards

  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: futureDate
      },
      status: 'PUBLISHED',
      // Only show events where affiliate hasn't created active link
      affiliateLinks: {
        none: {
          affiliateId,
          isActive: true
        }
      }
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      coverImage: true
    },
    orderBy: {
      startDate: 'asc'
    },
    take: 5 // Show next 5 upcoming events
  });

  // For now, return default commission (10%)
  // In AFF-006, this will come from EventAffiliateConfig
  return events.map(event => ({
    id: event.id,
    name: event.name,
    startDate: event.startDate,
    coverImage: event.coverImage,
    commissionRate: 10, // Default 10%
    commissionType: 'PERCENTAGE',
    available: true
  }));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate performance statistics for an affiliate
 *
 * @param affiliateId - The affiliate ID
 * @returns Performance metrics
 */
async function calculateAffiliateStats(affiliateId: string) {
  // Get total clicks from all links
  const clicksResult = await prisma.affiliateLink.aggregate({
    where: { affiliateId },
    _sum: {
      clicks: true,
      conversions: true
    }
  });

  const totalClicks = clicksResult._sum.clicks || 0;
  const totalConversions = clicksResult._sum.conversions || 0;

  // Get sales statistics
  const salesResult = await prisma.affiliateSale.aggregate({
    where: { affiliateId },
    _avg: {
      total: true,
      commissionAmount: true
    },
    _count: true
  });

  const totalSalesCount = salesResult._count;
  const avgOrderValue = Number(salesResult._avg.total || 0);
  const avgCommission = Number(salesResult._avg.commissionAmount || 0);

  // Calculate rates
  const clickThroughRate = totalClicks > 0
    ? (totalConversions / totalClicks) * 100
    : 0;

  const conversionRate = totalClicks > 0
    ? (totalSalesCount / totalClicks) * 100
    : 0;

  return {
    clickThroughRate: Number(clickThroughRate.toFixed(2)),
    conversionRate: Number(conversionRate.toFixed(2)),
    averageOrderValue: Number(avgOrderValue.toFixed(2)),
    averageCommission: Number(avgCommission.toFixed(2))
  };
}

// ============================================================================
// COMMISSION CALCULATIONS
// ============================================================================

/**
 * Calculate commission for a sale
 *
 * @param commissionType - PERCENTAGE or FIXED_AMOUNT
 * @param commissionValue - The commission rate/amount
 * @param saleAmount - The total sale amount
 * @returns Calculated commission amount
 */
export function calculateCommission(
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT',
  commissionValue: number,
  saleAmount: number
): number {
  if (commissionType === 'PERCENTAGE') {
    return (saleAmount * commissionValue) / 100;
  }

  return commissionValue;
}

/**
 * Preview commission calculation
 *
 * @param commissionType - PERCENTAGE or FIXED_AMOUNT
 * @param commissionValue - The commission rate/amount
 * @param sampleAmount - Sample sale amount for preview
 * @returns Formatted preview string
 */
export function previewCommission(
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT',
  commissionValue: number,
  sampleAmount: number = 100
): {
  sampleAmount: number;
  commission: number;
  description: string;
} {
  const commission = calculateCommission(commissionType, commissionValue, sampleAmount);

  const description = commissionType === 'PERCENTAGE'
    ? `${commissionValue}% of each sale`
    : `$${commissionValue.toFixed(2)} per ticket`;

  return {
    sampleAmount,
    commission: Number(commission.toFixed(2)),
    description
  };
}

// ============================================================================
// AFFILIATE VALIDATION
// ============================================================================

/**
 * Check if a user is an approved affiliate
 *
 * @param userId - The user ID to check
 * @returns True if user is an approved affiliate
 */
export async function isApprovedAffiliate(userId: string): Promise<boolean> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId },
    select: { status: true }
  });

  return affiliate?.status === 'APPROVED';
}

/**
 * Get affiliate by user ID
 *
 * @param userId - The user ID
 * @returns Affiliate profile or null
 */
export async function getAffiliateByUserId(userId: string) {
  return await prisma.affiliate.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      }
    }
  });
}
