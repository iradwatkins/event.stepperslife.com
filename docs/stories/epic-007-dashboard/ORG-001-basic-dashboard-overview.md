# ORG-001: Basic Dashboard Overview

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **view a consolidated overview of all my events and key metrics**
So that **I can quickly understand my business performance and upcoming events at a glance**

## Acceptance Criteria

### AC1: Dashboard Layout
- [ ] Dashboard displays in responsive grid layout (desktop: 3 cols, tablet: 2 cols, mobile: 1 col)
- [ ] Header shows organizer name, greeting, and current date/time
- [ ] Navigation sidebar provides quick access to all sections
- [ ] Dashboard loads within 2 seconds for up to 100 events

### AC2: Event Cards Display
- [ ] Each event displays as a card with: thumbnail image, title, date, venue, ticket sales progress
- [ ] Cards show visual progress bar for ticket sales (sold/capacity)
- [ ] Color-coded status badges (upcoming, ongoing, past, cancelled)
- [ ] Quick action buttons: View Details, Manage, Analytics
- [ ] Events sorted by date (upcoming first, then past)
- [ ] Pagination or infinite scroll for 10+ events

### AC3: Key Metrics Summary
- [ ] **Total Events** card: count of all events (active, upcoming, past)
- [ ] **Total Revenue** card: sum of all net revenue with trend indicator (↑↓)
- [ ] **Total Tickets Sold** card: count across all events with conversion rate
- [ ] **Upcoming Events** card: count of future events in next 30 days
- [ ] Each metric card shows comparison to previous period (e.g., "+15% vs last month")
- [ ] Metrics update in real-time when new sales occur

### AC4: Recent Activity Feed
- [ ] Displays last 10 activities: ticket sales, refunds, check-ins, event updates
- [ ] Each activity shows: icon, description, timestamp, related event
- [ ] Clickable activities navigate to relevant detail page
- [ ] Real-time updates when new activities occur
- [ ] "View All Activity" link to full activity log

### AC5: Upcoming Events Section
- [ ] Shows next 5 upcoming events in chronological order
- [ ] Each event displays: name, date/time, ticket sales status, days until event
- [ ] Visual alert for events happening within 7 days
- [ ] Quick actions: Send Reminder, View Attendees, Edit Event
- [ ] Empty state message when no upcoming events

### AC6: Quick Stats Widget
- [ ] **Average Ticket Price**: calculated across all events
- [ ] **Average Attendance Rate**: tickets sold vs capacity
- [ ] **Top Performing Event**: highest revenue event this month
- [ ] **Check-in Rate**: percentage of tickets checked in vs sold
- [ ] Tooltips explain each metric calculation

### AC7: Date Range Filter
- [ ] Global date range selector (Today, Last 7 days, Last 30 days, Last 90 days, All Time, Custom)
- [ ] Custom date range picker with calendar UI
- [ ] All metrics and charts update based on selected range
- [ ] Selected range persists in user preferences

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/DashboardOverview.tsx
interface DashboardOverviewProps {
  organizerId: string;
  dateRange: DateRange;
}

interface DashboardData {
  metrics: {
    totalEvents: number;
    totalRevenue: number;
    totalTicketsSold: number;
    upcomingEventsCount: number;
    avgTicketPrice: number;
    avgAttendanceRate: number;
    checkInRate: number;
  };
  events: EventCard[];
  recentActivity: Activity[];
  upcomingEvents: Event[];
  trends: {
    revenueTrend: number; // percentage change
    ticketsTrend: number;
    eventsTrend: number;
  };
}

// Component Structure
- DashboardOverview (container)
  - DashboardHeader (greeting, date, notifications)
  - MetricsGrid (key stats cards)
    - MetricCard (reusable)
  - EventsGrid
    - EventCard (individual event)
  - RecentActivityFeed
    - ActivityItem
  - UpcomingEventsSection
    - UpcomingEventCard
  - QuickStatsWidget
```

### Backend API
```typescript
// /app/api/dashboard/overview/route.ts
GET /api/dashboard/overview?organizerId={id}&startDate={date}&endDate={date}

Response: {
  success: true,
  data: {
    metrics: {
      totalEvents: 15,
      totalRevenue: 125000.00,
      totalTicketsSold: 2500,
      upcomingEventsCount: 5,
      avgTicketPrice: 50.00,
      avgAttendanceRate: 0.85,
      checkInRate: 0.92,
      topPerformingEvent: {
        id: "evt_123",
        name: "Summer Dance Festival",
        revenue: 45000
      }
    },
    events: [...],
    recentActivity: [...],
    upcomingEvents: [...],
    trends: {
      revenueTrend: 15.5, // +15.5%
      ticketsTrend: 8.2,
      eventsTrend: 10.0
    }
  }
}
```

### Database Queries
```typescript
// lib/services/dashboard.service.ts
export class DashboardService {
  async getOverviewData(organizerId: string, dateRange: DateRange) {
    // Aggregate metrics from multiple tables
    const [events, orders, tickets, checkIns] = await Promise.all([
      this.getEvents(organizerId, dateRange),
      this.getOrders(organizerId, dateRange),
      this.getTickets(organizerId, dateRange),
      this.getCheckIns(organizerId, dateRange)
    ]);

    // Calculate metrics
    const metrics = this.calculateMetrics(events, orders, tickets, checkIns);
    const trends = await this.calculateTrends(organizerId, dateRange);

    return {
      metrics,
      events: this.formatEventCards(events, orders),
      recentActivity: await this.getRecentActivity(organizerId, 10),
      upcomingEvents: await this.getUpcomingEvents(organizerId, 5),
      trends
    };
  }

  private calculateMetrics(events, orders, tickets, checkIns) {
    return {
      totalEvents: events.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.netAmount, 0),
      totalTicketsSold: tickets.filter(t => t.status === 'ACTIVE').length,
      upcomingEventsCount: events.filter(e =>
        e.startDateTime > new Date() &&
        e.startDateTime <= addDays(new Date(), 30)
      ).length,
      avgTicketPrice: orders.reduce((sum, o) => sum + o.totalAmount, 0) / tickets.length,
      avgAttendanceRate: tickets.length / events.reduce((sum, e) => sum + e.capacity, 0),
      checkInRate: checkIns.length / tickets.length
    };
  }
}
```

### State Management
```typescript
// /lib/hooks/useDashboard.ts
export function useDashboard(organizerId: string) {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [isLoading, setIsLoading] = useState(true);

  const { data, error, mutate } = useSWR(
    `/api/dashboard/overview?organizerId=${organizerId}&startDate=${dateRange.start}&endDate=${dateRange.end}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true
    }
  );

  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/dashboard/${organizerId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      mutate(); // Revalidate data on updates
    };

    return () => ws.close();
  }, [organizerId, mutate]);

  return {
    data,
    error,
    isLoading,
    dateRange,
    setDateRange,
    refresh: mutate
  };
}
```

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Header: "Good morning, Sarah" | Date | Notifications       │
├─────────────────────────────────────────────────────────────┤
│ Sidebar │ Metrics Grid (4 cards)                            │
│         │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐         │
│ • Home  │ │ Total │ │ Total │ │Tickets│ │Coming │         │
│ • Events│ │Events │ │Revenue│ │ Sold  │ │Events │         │
│ • Analytics│ 15   │ │$125k  │ │ 2,500 │ │   5   │         │
│ • Settings│ │ +10% │ │ +15% │ │  +8%  │ │  +2   │         │
│         │ └───────┘ └───────┘ └───────┘ └───────┘         │
│         │                                                    │
│         │ Events Grid (3 cols)                              │
│         │ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│         │ │ Event 1  │ │ Event 2  │ │ Event 3  │          │
│         │ │ [Image]  │ │ [Image]  │ │ [Image]  │          │
│         │ │ Title    │ │ Title    │ │ Title    │          │
│         │ │ Date     │ │ Date     │ │ Date     │          │
│         │ │ Progress │ │ Progress │ │ Progress │          │
│         │ │[Actions] │ │[Actions] │ │[Actions] │          │
│         │ └──────────┘ └──────────┘ └──────────┘          │
│         │                                                    │
│         │ Recent Activity (left) | Upcoming Events (right)  │
│         │ • Ticket sold - 2 min ago | Next Event: Dance Party│
│         │ • Check-in - 5 min ago    | In 3 days            │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Primary**: Blue (#2563EB) for active states
- **Success**: Green (#10B981) for positive trends
- **Warning**: Amber (#F59E0B) for upcoming events
- **Danger**: Red (#EF4444) for negative trends
- **Neutral**: Gray (#6B7280) for secondary information

### Responsive Breakpoints
- **Desktop**: 1280px+ (3-column grid)
- **Tablet**: 768px-1279px (2-column grid)
- **Mobile**: <768px (1-column stack)

## Integration Points

### Dependencies
- **EPIC-002**: Event CRUD operations for event data
- **EPIC-003**: Payment processing for revenue data
- **EPIC-004**: Ticket management for sales data
- **EPIC-006**: Check-in system for attendance data
- **EPIC-019**: Billing system for net revenue calculations

### Data Sources
```typescript
// Events table
SELECT id, name, startDateTime, endDateTime, capacity, status, thumbnailUrl
FROM events
WHERE organizerId = ? AND startDateTime BETWEEN ? AND ?

// Orders aggregation
SELECT
  eventId,
  COUNT(*) as orderCount,
  SUM(totalAmount) as grossRevenue,
  SUM(platformFee) as fees,
  SUM(totalAmount - platformFee) as netRevenue
FROM orders
WHERE organizerId = ? AND status = 'COMPLETED' AND createdAt BETWEEN ? AND ?
GROUP BY eventId

// Tickets sold
SELECT eventId, COUNT(*) as ticketsSold
FROM tickets
WHERE organizerId = ? AND status = 'ACTIVE'
GROUP BY eventId

// Check-ins
SELECT eventId, COUNT(*) as checkInCount
FROM checkIns
WHERE organizerId = ? AND checkedInAt BETWEEN ? AND ?
GROUP BY eventId
```

## Performance Requirements

### Load Time Targets
- **Initial page load**: < 2 seconds
- **Data refresh**: < 500ms
- **Real-time updates**: < 100ms latency
- **Chart rendering**: < 300ms

### Optimization Strategies
1. **Database Indexing**
   - Index on organizerId, startDateTime, status
   - Composite index on (organizerId, startDateTime, status)
   - Index on orders.organizerId, orders.createdAt

2. **Caching**
   - Redis cache for dashboard data (TTL: 60 seconds)
   - Browser cache for static assets
   - CDN for images

3. **Data Aggregation**
   - Pre-calculate metrics in background jobs
   - Materialized views for complex queries
   - Incremental updates for real-time data

4. **Frontend Optimization**
   - Code splitting for dashboard components
   - Lazy loading for event cards
   - Virtual scrolling for large event lists
   - Memoization for expensive calculations

## Testing Requirements

### Unit Tests
```typescript
describe('DashboardService', () => {
  it('calculates total revenue correctly', async () => {
    const data = await dashboardService.getOverviewData(organizerId, dateRange);
    expect(data.metrics.totalRevenue).toBe(expectedRevenue);
  });

  it('calculates attendance rate correctly', async () => {
    // Test metric calculations
  });

  it('filters events by date range', async () => {
    // Test date filtering
  });
});

describe('DashboardOverview Component', () => {
  it('renders all metric cards', () => {
    render(<DashboardOverview organizerId={id} dateRange={range} />);
    expect(screen.getByText('Total Events')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('updates when date range changes', async () => {
    // Test date range filter
  });
});
```

### Integration Tests
- [ ] Test dashboard data loading from API
- [ ] Test real-time updates via WebSocket
- [ ] Test date range filtering
- [ ] Test navigation from dashboard to detail pages

### E2E Tests
```typescript
test('organizer views dashboard overview', async ({ page }) => {
  await page.goto('/dashboard');

  // Verify metrics loaded
  await expect(page.locator('[data-testid="total-events"]')).toBeVisible();
  await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();

  // Verify events grid
  await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();

  // Test date range filter
  await page.click('[data-testid="date-range-selector"]');
  await page.click('text=Last 30 days');
  await expect(page.locator('[data-testid="total-revenue"]')).toContainText('$');
});
```

### Performance Tests
- [ ] Load test with 100+ events
- [ ] Stress test with 10,000+ tickets
- [ ] Real-time update latency test
- [ ] Mobile performance test

## Security Considerations

### Authorization
- [ ] Verify organizer owns all events being displayed
- [ ] Prevent cross-organizer data leakage
- [ ] Role-based access (ORGANIZER role required)

### Data Protection
- [ ] Sanitize all user inputs
- [ ] Validate date ranges (prevent excessive queries)
- [ ] Rate limit API requests (10 req/min per user)
- [ ] Encrypt sensitive financial data

## Accessibility (WCAG 2.1 AA)

- [ ] Semantic HTML structure (header, main, nav, section)
- [ ] ARIA labels for all interactive elements
- [ ] Keyboard navigation support (Tab, Enter, Escape)
- [ ] Screen reader announcements for real-time updates
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus indicators visible on all interactive elements
- [ ] Alternative text for charts/graphs

## Localization

- [ ] All text strings externalized (i18n)
- [ ] Number formatting based on locale (currency, decimals)
- [ ] Date/time formatting based on locale
- [ ] Right-to-left (RTL) support for Arabic/Hebrew

## Success Metrics

### User Engagement
- **Target**: 90% of organizers visit dashboard within 24 hours of login
- **Target**: Average session duration > 3 minutes
- **Target**: 70% of users interact with date range filter

### Performance
- **Target**: Page load time < 2 seconds (p95)
- **Target**: Real-time update latency < 100ms
- **Target**: Zero failed data loads (p99)

### Business Impact
- **Target**: 50% increase in organizer dashboard usage
- **Target**: 30% decrease in support tickets about event status
- **Target**: 20% increase in event creation rate (due to better insights)

## Documentation Requirements

- [ ] User guide: "Understanding Your Dashboard"
- [ ] Developer docs: Dashboard API reference
- [ ] Video tutorial: "Dashboard Overview Tour"
- [ ] FAQ: Common dashboard questions

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation completed
- [ ] QA sign-off received
- [ ] Product Owner acceptance
- [ ] Deployed to staging and production

## Notes

- Consider adding customizable widgets for advanced users
- Future enhancement: AI-powered insights and recommendations
- Consider dashboard templates for different organizer types
- Monitor real-time update performance under load