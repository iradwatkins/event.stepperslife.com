import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/monitoring/sentry';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

interface AnalyticsParams {
  period?: 'day' | 'week' | 'month' | 'all';
  startDate?: string;
  endDate?: string;
}

async function handleGetEventAnalytics(request: NextRequest, context: any) {
  const { user, params } = context;
  const eventId = params.eventId;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify user has access to this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerId: true,
        name: true,
        startDate: true,
        createdAt: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const canView =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      event.organizerId === user.id;

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate date range based on period
    let dateRange: { start: Date; end: Date };
    const now = new Date();

    switch (period) {
      case 'day':
        dateRange = {
          start: startOfDay(startDate ? new Date(startDate) : now),
          end: endOfDay(endDate ? new Date(endDate) : now)
        };
        break;
      case 'week':
        dateRange = {
          start: startOfWeek(startDate ? new Date(startDate) : now),
          end: endOfWeek(endDate ? new Date(endDate) : now)
        };
        break;
      case 'month':
        dateRange = {
          start: startOfMonth(startDate ? new Date(startDate) : now),
          end: endOfMonth(endDate ? new Date(endDate) : now)
        };
        break;
      default:
        dateRange = {
          start: event.createdAt,
          end: now
        };
    }

    // Get comprehensive analytics data
    const analytics = await Promise.all([
      // Ticket sales over time
      getTicketSalesOverTime(eventId, dateRange),

      // Revenue analytics
      getRevenueAnalytics(eventId),

      // Check-in analytics
      getCheckInAnalytics(eventId),

      // Ticket type breakdown
      getTicketTypeBreakdown(eventId),

      // Geographic distribution
      getGeographicDistribution(eventId),

      // Customer demographics
      getCustomerDemographics(eventId),

      // Peak times analysis
      getPeakTimesAnalysis(eventId, dateRange),

      // Conversion funnel
      getConversionFunnel(eventId)
    ]);

    const [
      ticketSalesOverTime,
      revenueAnalytics,
      checkInAnalytics,
      ticketTypeBreakdown,
      geographicDistribution,
      customerDemographics,
      peakTimesAnalysis,
      conversionFunnel
    ] = analytics;

    return NextResponse.json({
      success: true,
      eventId,
      eventName: event.name,
      period,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      analytics: {
        ticketSalesOverTime,
        revenueAnalytics,
        checkInAnalytics,
        ticketTypeBreakdown,
        geographicDistribution,
        customerDemographics,
        peakTimesAnalysis,
        conversionFunnel
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);

    logError(error instanceof Error ? error : new Error(String(error)), {
      user: { id: user.id, email: user.email, role: user.role },
      tags: { component: 'analytics-api', operation: 'get-analytics' },
      extra: { eventId }
    });

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

async function getTicketSalesOverTime(eventId: string, dateRange: { start: Date; end: Date }) {
  const salesData = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('day', "createdAt") as date,
      COUNT(*) as tickets_sold,
      SUM("faceValue") as revenue
    FROM tickets
    WHERE "eventId" = ${eventId}
      AND "createdAt" >= ${dateRange.start}
      AND "createdAt" <= ${dateRange.end}
      AND status = 'VALID'
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY date
  ` as Array<{ date: Date; tickets_sold: bigint; revenue: number }>;

  return salesData.map(item => ({
    date: format(item.date, 'yyyy-MM-dd'),
    ticketsSold: Number(item.tickets_sold),
    revenue: Number(item.revenue)
  }));
}

async function getRevenueAnalytics(eventId: string) {
  const revenueData = await prisma.order.aggregate({
    where: {
      eventId,
      status: 'COMPLETED'
    },
    _sum: {
      total: true,
      fees: true,
      taxes: true
    },
    _avg: {
      total: true
    },
    _count: true
  });

  const refundData = await prisma.refund.aggregate({
    where: {
      order: {
        eventId
      },
      status: 'COMPLETED'
    },
    _sum: {
      amount: true
    }
  });

  return {
    totalRevenue: Number(revenueData._sum.total || 0),
    totalFees: Number(revenueData._sum.fees || 0),
    totalTaxes: Number(revenueData._sum.taxes || 0),
    averageOrderValue: Number(revenueData._avg.total || 0),
    totalOrders: revenueData._count,
    totalRefunds: Number(refundData._sum.amount || 0),
    netRevenue: Number(revenueData._sum.total || 0) - Number(refundData._sum.amount || 0)
  };
}

async function getCheckInAnalytics(eventId: string) {
  const checkInData = await prisma.ticket.groupBy({
    by: ['checkedIn'],
    where: { eventId },
    _count: true
  });

  const totalTickets = checkInData.reduce((sum, item) => sum + item._count, 0);
  const checkedInCount = checkInData.find(item => item.checkedIn)?._count || 0;

  // Hourly check-in distribution
  const hourlyCheckIns = await prisma.$queryRaw`
    SELECT
      EXTRACT(hour FROM "checkedInAt") as hour,
      COUNT(*) as count
    FROM tickets
    WHERE "eventId" = ${eventId}
      AND "checkedIn" = true
      AND "checkedInAt" IS NOT NULL
    GROUP BY hour
    ORDER BY hour
  ` as Array<{ hour: number; count: bigint }>;

  return {
    totalTickets,
    checkedInCount,
    notCheckedInCount: totalTickets - checkedInCount,
    checkInRate: totalTickets > 0 ? (checkedInCount / totalTickets) * 100 : 0,
    hourlyDistribution: hourlyCheckIns.map(item => ({
      hour: item.hour,
      count: Number(item.count)
    }))
  };
}

async function getTicketTypeBreakdown(eventId: string) {
  const ticketTypeData = await prisma.ticketType.findMany({
    where: { eventId },
    include: {
      _count: {
        select: {
          tickets: {
            where: { status: 'VALID' }
          }
        }
      }
    }
  });

  return ticketTypeData.map(ticketType => ({
    id: ticketType.id,
    name: ticketType.name,
    price: Number(ticketType.price),
    totalAvailable: ticketType.quantity,
    sold: ticketType._count.tickets,
    revenue: Number(ticketType.price) * ticketType._count.tickets,
    sellThroughRate: (ticketType._count.tickets / ticketType.quantity) * 100
  }));
}

async function getGeographicDistribution(eventId: string) {
  // This would typically analyze buyer locations based on billing addresses
  // For now, returning mock data structure
  return [
    { region: 'Local (Same City)', count: 45, percentage: 60 },
    { region: 'Regional (Same State)', count: 20, percentage: 27 },
    { region: 'National', count: 8, percentage: 11 },
    { region: 'International', count: 2, percentage: 2 }
  ];
}

async function getCustomerDemographics(eventId: string) {
  const orders = await prisma.order.findMany({
    where: {
      eventId,
      status: 'COMPLETED'
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      user: {
        select: {
          dateOfBirth: true,
          createdAt: true
        }
      }
    }
  });

  // Analyze first-time vs returning customers
  const uniqueEmails = new Set();
  const firstTimeCustomers = [];
  const returningCustomers = [];

  for (const order of orders) {
    if (uniqueEmails.has(order.email)) {
      returningCustomers.push(order);
    } else {
      firstTimeCustomers.push(order);
      uniqueEmails.add(order.email);
    }
  }

  return {
    totalCustomers: uniqueEmails.size,
    firstTimeCustomers: firstTimeCustomers.length,
    returningCustomers: returningCustomers.length,
    customerRetentionRate: uniqueEmails.size > 0 ?
      (returningCustomers.length / uniqueEmails.size) * 100 : 0
  };
}

async function getPeakTimesAnalysis(eventId: string, dateRange: { start: Date; end: Date }) {
  const peakTimes = await prisma.$queryRaw`
    SELECT
      EXTRACT(hour FROM "createdAt") as hour,
      EXTRACT(dow FROM "createdAt") as day_of_week,
      COUNT(*) as orders
    FROM orders
    WHERE "eventId" = ${eventId}
      AND "createdAt" >= ${dateRange.start}
      AND "createdAt" <= ${dateRange.end}
      AND status = 'COMPLETED'
    GROUP BY hour, day_of_week
    ORDER BY orders DESC
    LIMIT 10
  ` as Array<{ hour: number; day_of_week: number; orders: bigint }>;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return peakTimes.map(item => ({
    hour: item.hour,
    dayOfWeek: dayNames[item.day_of_week],
    orderCount: Number(item.orders)
  }));
}

async function getConversionFunnel(eventId: string) {
  // This would typically track page views, cart additions, checkout starts, and completions
  // For now, returning estimated funnel data based on orders
  const totalOrders = await prisma.order.count({
    where: { eventId }
  });

  const completedOrders = await prisma.order.count({
    where: {
      eventId,
      status: 'COMPLETED'
    }
  });

  // Estimated funnel (in production, track actual page views and interactions)
  const estimatedViews = Math.round(completedOrders * 10); // Rough estimate
  const estimatedCartAdds = Math.round(completedOrders * 2);

  return {
    stages: [
      { stage: 'Page Views', count: estimatedViews, conversionRate: 100 },
      { stage: 'Started Purchase', count: estimatedCartAdds, conversionRate: (estimatedCartAdds / estimatedViews) * 100 },
      { stage: 'Initiated Checkout', count: totalOrders, conversionRate: (totalOrders / estimatedCartAdds) * 100 },
      { stage: 'Completed Purchase', count: completedOrders, conversionRate: (completedOrders / totalOrders) * 100 }
    ],
    overallConversion: estimatedViews > 0 ? (completedOrders / estimatedViews) * 100 : 0
  };
}

// GET: Get event analytics
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const params = await context.params;
  return withAuth(handleGetEventAnalytics, {
    permissions: ['events.view_own']
  })(request, { params });
}