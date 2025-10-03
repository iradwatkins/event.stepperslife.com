# ORG-001b: Metrics Aggregation & Real-time Updates

**Parent Story:** ORG-001 - Basic Dashboard Overview
**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

## User Story

As an **event organizer**
I want to **see real-time metrics and recent activity for my events**
So that **I can monitor my business performance as it happens**

## Acceptance Criteria

### AC1: Key Metrics Cards
- [ ] **Total Events Card:**
  - Displays count of all events (active + upcoming + past)
  - Trend indicator: "+3 vs last period" with up/down arrow
  - Icon: Calendar grid icon
  - Clicking navigates to full events list
- [ ] **Total Revenue Card:**
  - Displays sum of net revenue (after platform fees)
  - Formatted as currency: "$125,450.00"
  - Trend: "+15.5% vs last month" with color (green up, red down)
  - Icon: Dollar sign icon
  - Tooltip explains "Net revenue after platform fees"
- [ ] **Total Tickets Sold Card:**
  - Count of all ACTIVE tickets across all events
  - Conversion rate shown: "2,500 sold (68% conversion)"
  - Trend indicator with comparison period
  - Icon: Ticket icon
- [ ] **Upcoming Events Card:**
  - Count of events starting within next 30 days
  - Sub-text: "Next event in 3 days"
  - Alert badge if event happening within 7 days
  - Icon: Clock icon

### AC2: Metrics Calculation Service
- [ ] Service calculates all 4 key metrics efficiently (single database query where possible)
- [ ] Metrics filtered by current date range selection
- [ ] Trend calculation compares to equivalent previous period:
  - If "Last 30 days" selected, compare to previous 30 days
  - If "This month" selected, compare to last month
  - If custom range, compare to range of same length immediately before
- [ ] Results cached in Redis with 60-second TTL
- [ ] Cache invalidated on new order/ticket/event creation

### AC3: Real-time Updates via WebSocket
- [ ] WebSocket connection established on dashboard mount: `wss://api/ws/dashboard/{organizerId}`
- [ ] Server pushes updates when:
  - New ticket sold (update revenue + tickets sold metrics)
  - New event created (update total events)
  - Ticket refunded (update revenue + tickets sold)
  - Event status changes (update upcoming events count)
- [ ] Client receives update message and invalidates SWR cache
- [ ] Optimistic UI updates before server confirmation
- [ ] Connection auto-reconnects on disconnect (exponential backoff)
- [ ] Visual indicator when data is stale (> 5 minutes since last update)

### AC4: Recent Activity Feed
- [ ] Displays last 10 activities in reverse chronological order
- [ ] Activity types:
  - **Ticket Sale:** "John Doe purchased 2 tickets for Summer Dance Party - $100.00"
  - **Refund:** "Refund issued for Winter Gala - $50.00"
  - **Check-in:** "Sarah Smith checked in at Jazz Night"
  - **Event Created:** "New event created: Hip Hop Battle"
  - **Event Updated:** "Updated event details for Steppers Showcase"
- [ ] Each activity shows:
  - Icon (color-coded by type)
  - Description (user name + action + event name + amount if applicable)
  - Relative timestamp: "2 minutes ago", "1 hour ago", "Yesterday"
  - Clickable link to related entity (event, order, ticket)
- [ ] Real-time updates: New activities fade in at top of feed
- [ ] "View All Activity" link navigates to `/dashboard/activity`
- [ ] Empty state: "No recent activity to display"

### AC5: Date Range Filtering
- [ ] Global date range selector with preset options:
  - Today
  - Last 7 days
  - Last 30 days (default)
  - Last 90 days
  - All Time
  - Custom Range (opens date picker modal)
- [ ] Custom range date picker:
  - Start date and end date inputs
  - Calendar UI for easy selection
  - Validation: End date must be after start date
  - Max range: 2 years
- [ ] Selected range updates URL query params: `?range=30d` or `?from=2025-01-01&to=2025-01-31`
- [ ] All metrics, charts, and feeds update when range changes
- [ ] Selected range persists in localStorage: `dashboard_date_range`
- [ ] Loading state during metrics recalculation

### AC6: Quick Stats Widget
- [ ] **Average Ticket Price:**
  - Formula: Total revenue / Total tickets sold
  - Displayed as: "Avg. Ticket Price: $50.00"
  - Tooltip: "Average across all ticket types and events"
- [ ] **Average Attendance Rate:**
  - Formula: (Tickets sold / Total capacity) * 100
  - Displayed as: "85% Attendance Rate"
  - Progress bar visualization
- [ ] **Top Performing Event:**
  - Event with highest revenue in selected period
  - Shows: Event name, revenue, date
  - Clickable to view event details
- [ ] **Check-in Rate:**
  - Formula: (Checked-in tickets / Sold tickets) * 100
  - Displayed as: "92% Check-in Rate"
  - Color-coded: Green (>90%), Yellow (70-90%), Red (<70%)

## Technical Implementation

### Backend API

**File:** `/app/api/dashboard/metrics/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizerId = searchParams.get('organizerId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Check cache first
  const cacheKey = `dashboard:metrics:${organizerId}:${startDate}:${endDate}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const metrics = await dashboardService.calculateMetrics(
    organizerId,
    new Date(startDate),
    new Date(endDate)
  );

  // Cache for 60 seconds
  await redis.setex(cacheKey, 60, JSON.stringify(metrics));

  return NextResponse.json(metrics);
}
```

**File:** `/lib/services/dashboard.service.ts`
```typescript
export class DashboardService {
  async calculateMetrics(
    organizerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics> {
    // Parallel queries for performance
    const [
      eventsData,
      ordersData,
      ticketsData,
      checkInsData,
      previousPeriodData,
    ] = await Promise.all([
      this.getEventsMetrics(organizerId, startDate, endDate),
      this.getOrdersMetrics(organizerId, startDate, endDate),
      this.getTicketsMetrics(organizerId, startDate, endDate),
      this.getCheckInsMetrics(organizerId, startDate, endDate),
      this.getPreviousPeriodMetrics(organizerId, startDate, endDate),
    ]);

    // Calculate key metrics
    const totalEvents = eventsData.count;
    const totalRevenue = ordersData.netRevenue;
    const totalTicketsSold = ticketsData.soldCount;
    const upcomingEventsCount = eventsData.upcomingCount;

    // Calculate trends
    const revenueTrend = this.calculateTrendPercentage(
      totalRevenue,
      previousPeriodData.revenue
    );
    const ticketsTrend = this.calculateTrendPercentage(
      totalTicketsSold,
      previousPeriodData.tickets
    );
    const eventsTrend = this.calculateTrendPercentage(
      totalEvents,
      previousPeriodData.events
    );

    // Calculate quick stats
    const avgTicketPrice = totalRevenue / totalTicketsSold;
    const avgAttendanceRate = ticketsData.soldCount / eventsData.totalCapacity;
    const checkInRate = checkInsData.count / ticketsData.soldCount;
    const topEvent = await this.getTopPerformingEvent(organizerId, startDate, endDate);

    return {
      metrics: {
        totalEvents,
        totalRevenue,
        totalTicketsSold,
        upcomingEventsCount,
        avgTicketPrice,
        avgAttendanceRate,
        checkInRate,
        topPerformingEvent: topEvent,
      },
      trends: {
        revenueTrend,
        ticketsTrend,
        eventsTrend,
      },
    };
  }

  private async getOrdersMetrics(
    organizerId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await prisma.order.aggregate({
      where: {
        organizerId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalAmount: true,
        platformFee: true,
      },
      _count: true,
    });

    return {
      count: result._count,
      grossRevenue: result._sum.totalAmount || 0,
      platformFees: result._sum.platformFee || 0,
      netRevenue: (result._sum.totalAmount || 0) - (result._sum.platformFee || 0),
    };
  }

  private calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
```

### WebSocket Server

**File:** `/lib/websocket/dashboard.ts`
```typescript
import { WebSocketServer } from 'ws';

export class DashboardWebSocketService {
  private wss: WebSocketServer;
  private connections: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for new orders
    eventEmitter.on('order.completed', (order) => {
      this.broadcastToOrganizer(order.organizerId, {
        type: 'TICKET_SALE',
        data: {
          eventId: order.eventId,
          amount: order.totalAmount,
          ticketCount: order.items.length,
          buyer: order.customer.name,
        },
        timestamp: new Date(),
      });
    });

    // Listen for refunds
    eventEmitter.on('order.refunded', (refund) => {
      this.broadcastToOrganizer(refund.organizerId, {
        type: 'REFUND',
        data: {
          eventId: refund.eventId,
          amount: refund.refundAmount,
        },
        timestamp: new Date(),
      });
    });

    // Listen for check-ins
    eventEmitter.on('ticket.checkedIn', (checkIn) => {
      this.broadcastToOrganizer(checkIn.organizerId, {
        type: 'CHECK_IN',
        data: {
          eventId: checkIn.eventId,
          attendeeName: checkIn.attendeeName,
        },
        timestamp: new Date(),
      });
    });
  }

  private broadcastToOrganizer(organizerId: string, message: any) {
    const connections = this.connections.get(organizerId);
    if (!connections) return;

    const payload = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });

    // Invalidate Redis cache
    redis.del(`dashboard:metrics:${organizerId}:*`);
  }
}
```

### Frontend Hook

**File:** `/lib/hooks/useDashboardMetrics.ts`
```typescript
export function useDashboardMetrics(organizerId: string, dateRange: DateRange) {
  const [isConnected, setIsConnected] = useState(false);

  // Fetch metrics via SWR
  const { data, error, mutate } = useSWR(
    `/api/dashboard/metrics?organizerId=${organizerId}&startDate=${dateRange.start}&endDate=${dateRange.end}`,
    fetcher,
    {
      refreshInterval: 60000, // Fallback polling every 60s
      revalidateOnFocus: true,
    }
  );

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/dashboard/${organizerId}`);

    ws.onopen = () => {
      console.log('Dashboard WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      console.log('Received dashboard update:', update);

      // Revalidate metrics on any update
      mutate();
    };

    ws.onclose = () => {
      console.log('Dashboard WebSocket disconnected');
      setIsConnected(false);

      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        // Recursive reconnect with exponential backoff
      }, 5000);
    };

    return () => ws.close();
  }, [organizerId, mutate]);

  return {
    metrics: data?.metrics,
    trends: data?.trends,
    isLoading: !data && !error,
    error,
    isConnected,
    refresh: mutate,
  };
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('DashboardService.calculateMetrics', () => {
  it('calculates total revenue correctly', async () => {
    const metrics = await dashboardService.calculateMetrics(
      'org_123',
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );
    expect(metrics.metrics.totalRevenue).toBe(125450.00);
  });

  it('calculates trend percentage correctly', () => {
    const trend = dashboardService['calculateTrendPercentage'](150, 100);
    expect(trend).toBe(50); // +50% increase
  });

  it('handles zero previous period', () => {
    const trend = dashboardService['calculateTrendPercentage'](100, 0);
    expect(trend).toBe(100);
  });
});

describe('useDashboardMetrics hook', () => {
  it('fetches metrics on mount', async () => {
    const { result } = renderHook(() =>
      useDashboardMetrics('org_123', { start: '2025-01-01', end: '2025-01-31' })
    );

    await waitFor(() => expect(result.current.metrics).toBeDefined());
  });

  it('updates metrics on WebSocket message', async () => {
    // Mock WebSocket
    // Test that mutate() is called when message received
  });
});
```

### Integration Tests
- [ ] Test WebSocket connection and message handling
- [ ] Test Redis cache hit/miss scenarios
- [ ] Test metrics recalculation on date range change
- [ ] Test concurrent requests (race conditions)

### E2E Tests
```typescript
test('metrics update in real-time when ticket sold', async ({ page }) => {
  await page.goto('/dashboard');

  // Record initial revenue
  const initialRevenue = await page.locator('[data-testid="total-revenue"]').textContent();

  // Simulate ticket purchase in another tab/window
  // (This would be done via API call or Playwright context)

  // Verify revenue updated within 2 seconds
  await expect(page.locator('[data-testid="total-revenue"]'))
    .not.toHaveText(initialRevenue, { timeout: 2000 });
});
```

## Performance Requirements

- [ ] Metrics API response time: < 500ms (p95)
- [ ] WebSocket message latency: < 100ms
- [ ] Redis cache hit rate: > 80%
- [ ] Database query optimization with proper indexes
- [ ] Parallel query execution reduces total time

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Metrics calculation accurate and tested
- [ ] WebSocket real-time updates working
- [ ] Redis caching implemented
- [ ] Unit tests pass (>85% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] QA sign-off received