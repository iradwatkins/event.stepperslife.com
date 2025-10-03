# ORG-003: Revenue Tracking

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **track revenue by event, date range, and ticket type**
So that **I can understand my earnings, identify profitable events, and plan future pricing strategies**

## Acceptance Criteria

### AC1: Revenue Overview
- [ ] Display total gross revenue, platform fees, and net revenue
- [ ] Show revenue breakdown by event in sortable table
- [ ] Display revenue trends over time with line chart
- [ ] Compare current period vs previous period (percentage change)
- [ ] Filter by date range (custom, today, week, month, quarter, year)

### AC2: Revenue Breakdown by Ticket Type
- [ ] Pie chart showing revenue distribution by ticket type
- [ ] Table listing each ticket type with: count sold, revenue, average price
- [ ] Sortable by revenue, quantity, or ticket name
- [ ] Filter by specific event or all events
- [ ] Export ticket type breakdown as CSV

### AC3: Gross vs Net Revenue
- [ ] Clear visual distinction between gross and net revenue
- [ ] Breakdown of deductions: platform fee, payment processing fee, refunds
- [ ] Detailed fee calculation explanation
- [ ] Historical comparison of fee percentages
- [ ] Projected vs actual revenue (if forecast available)

### AC4: Revenue Trends
- [ ] Line chart showing revenue over time (daily, weekly, monthly views)
- [ ] Overlay multiple events for comparison
- [ ] Highlight peak revenue periods
- [ ] Moving average trendline
- [ ] Forecast projection based on historical data

### AC5: Top Performing Events
- [ ] Ranked list of events by revenue
- [ ] Display metrics: total revenue, tickets sold, average ticket price, ROI
- [ ] Visual badges for top 3 performers
- [ ] Click to view detailed event analytics
- [ ] Compare performance against average

### AC6: Payment Method Breakdown
- [ ] Revenue split by payment method (credit card, digital wallet, etc.)
- [ ] Processing fees by payment method
- [ ] Success rate by payment method
- [ ] Average transaction value by method

### AC7: Refund Impact Analysis
- [ ] Total refunded amount and percentage
- [ ] Refund rate over time
- [ ] Reasons for refunds (if captured)
- [ ] Net revenue after refunds
- [ ] Comparison to industry benchmarks

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/RevenueTracking.tsx
interface RevenueTrackingProps {
  organizerId: string;
  dateRange: DateRange;
}

interface RevenueData {
  overview: {
    grossRevenue: number;
    platformFees: number;
    processingFees: number;
    refunds: number;
    netRevenue: number;
    previousPeriodNetRevenue: number;
    changePercent: number;
  };
  byEvent: EventRevenue[];
  byTicketType: TicketTypeRevenue[];
  trends: RevenueTrend[];
  paymentMethods: PaymentMethodBreakdown[];
  refundAnalysis: RefundAnalysis;
}

interface EventRevenue {
  eventId: string;
  eventName: string;
  grossRevenue: number;
  netRevenue: number;
  ticketsSold: number;
  averageTicketPrice: number;
  platformFee: number;
  processingFee: number;
  refunds: number;
}

interface TicketTypeRevenue {
  ticketTypeId: string;
  ticketTypeName: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
  percentOfTotal: number;
}

// Component Structure
- RevenueTracking (container)
  - RevenueOverview (summary cards)
    - GrossRevenueCard
    - FeesBreakdownCard
    - NetRevenueCard
  - RevenueTrendsChart (Recharts line chart)
  - EventRevenueTable (sortable table)
  - TicketTypeBreakdown (pie chart + table)
  - PaymentMethodBreakdown (bar chart)
  - RefundAnalysis (metrics + trend)
  - ExportButton (CSV/Excel export)
```

### Backend API
```typescript
// /app/api/dashboard/revenue/route.ts
GET /api/dashboard/revenue
  ?organizerId={id}
  &startDate={date}
  &endDate={date}
  &eventId={id} (optional)

Response: {
  success: true,
  data: {
    overview: {
      grossRevenue: 125000.00,
      platformFees: 6250.00, // 5% platform fee
      processingFees: 3625.00, // ~2.9% processing fee
      refunds: 2500.00,
      netRevenue: 112625.00,
      previousPeriodNetRevenue: 98000.00,
      changePercent: 14.9
    },
    byEvent: [
      {
        eventId: "evt_123",
        eventName: "Summer Dance Festival",
        grossRevenue: 45000.00,
        netRevenue: 40500.00,
        ticketsSold: 500,
        averageTicketPrice: 90.00,
        platformFee: 2250.00,
        processingFee: 1305.00,
        refunds: 945.00
      },
      ...
    ],
    byTicketType: [...],
    trends: [...],
    paymentMethods: [...],
    refundAnalysis: {...}
  }
}
```

### Database Service
```typescript
// /lib/services/revenue.service.ts
export class RevenueService {
  async getRevenueData(
    organizerId: string,
    startDate: Date,
    endDate: Date,
    eventId?: string
  ): Promise<RevenueData> {
    // Build base query
    const whereClause = {
      organizerId,
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(eventId && { eventId })
    };

    // Fetch all orders with related data
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        event: { select: { name: true } },
        items: {
          include: {
            ticketType: { select: { name: true } }
          }
        },
        refunds: true,
        payment: { select: { paymentMethod: true } }
      }
    });

    // Calculate overview
    const overview = this.calculateOverview(orders);

    // Calculate previous period for comparison
    const previousPeriod = await this.getPreviousPeriodRevenue(
      organizerId,
      startDate,
      endDate
    );
    overview.previousPeriodNetRevenue = previousPeriod;
    overview.changePercent = ((overview.netRevenue - previousPeriod) / previousPeriod) * 100;

    // Group by event
    const byEvent = this.groupByEvent(orders);

    // Group by ticket type
    const byTicketType = this.groupByTicketType(orders);

    // Calculate trends
    const trends = await this.calculateTrends(orders, startDate, endDate);

    // Payment method breakdown
    const paymentMethods = this.groupByPaymentMethod(orders);

    // Refund analysis
    const refundAnalysis = await this.analyzeRefunds(orders);

    return {
      overview,
      byEvent,
      byTicketType,
      trends,
      paymentMethods,
      refundAnalysis
    };
  }

  private calculateOverview(orders: Order[]): Overview {
    const grossRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformFees = orders.reduce((sum, o) => sum + o.platformFee, 0);
    const processingFees = orders.reduce((sum, o) => sum + o.processingFee, 0);
    const refunds = orders.reduce((sum, o) => {
      return sum + o.refunds.reduce((rs, r) => rs + r.amount, 0);
    }, 0);

    return {
      grossRevenue,
      platformFees,
      processingFees,
      refunds,
      netRevenue: grossRevenue - platformFees - processingFees - refunds,
      previousPeriodNetRevenue: 0, // Calculated separately
      changePercent: 0
    };
  }

  private groupByEvent(orders: Order[]): EventRevenue[] {
    const eventMap = new Map<string, EventRevenue>();

    orders.forEach(order => {
      const existing = eventMap.get(order.eventId) || {
        eventId: order.eventId,
        eventName: order.event.name,
        grossRevenue: 0,
        netRevenue: 0,
        ticketsSold: 0,
        averageTicketPrice: 0,
        platformFee: 0,
        processingFee: 0,
        refunds: 0
      };

      existing.grossRevenue += order.totalAmount;
      existing.platformFee += order.platformFee;
      existing.processingFee += order.processingFee;
      existing.refunds += order.refunds.reduce((sum, r) => sum + r.amount, 0);
      existing.netRevenue = existing.grossRevenue - existing.platformFee - existing.processingFee - existing.refunds;
      existing.ticketsSold += order.items.reduce((sum, i) => sum + i.quantity, 0);

      eventMap.set(order.eventId, existing);
    });

    // Calculate averages
    eventMap.forEach(event => {
      event.averageTicketPrice = event.grossRevenue / event.ticketsSold;
    });

    return Array.from(eventMap.values())
      .sort((a, b) => b.grossRevenue - a.grossRevenue);
  }

  private async calculateTrends(
    orders: Order[],
    startDate: Date,
    endDate: Date
  ): Promise<RevenueTrend[]> {
    const days = differenceInDays(endDate, startDate);
    const groupBy = days <= 31 ? 'day' : days <= 90 ? 'week' : 'month';

    const trends: RevenueTrend[] = [];

    // Group orders by time period
    const grouped = orders.reduce((acc, order) => {
      const key = this.getTimePeriodKey(order.createdAt, groupBy);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    // Calculate revenue for each period
    Object.entries(grouped).forEach(([period, orders]) => {
      const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const netRevenue = orders.reduce((sum, o) =>
        sum + o.totalAmount - o.platformFee - o.processingFee, 0
      );

      trends.push({
        period,
        date: new Date(period),
        grossRevenue: revenue,
        netRevenue,
        orderCount: orders.length
      });
    });

    return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
```

### Chart Components
```typescript
// /components/dashboard/charts/RevenueTrendsChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueTrendsChartProps {
  data: RevenueTrend[];
  showGross?: boolean;
  showNet?: boolean;
}

export function RevenueTrendsChart({ data, showGross = true, showNet = true }: RevenueTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="period"
          tickFormatter={(value) => format(new Date(value), 'MMM dd')}
        />
        <YAxis
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
          labelFormatter={(label) => format(new Date(label), 'PPP')}
        />
        <Legend />
        {showGross && (
          <Line
            type="monotone"
            dataKey="grossRevenue"
            stroke="#2563EB"
            strokeWidth={2}
            name="Gross Revenue"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
        {showNet && (
          <Line
            type="monotone"
            dataKey="netRevenue"
            stroke="#10B981"
            strokeWidth={2}
            name="Net Revenue"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// /components/dashboard/charts/TicketTypeBreakdown.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function TicketTypeBreakdown({ data }: { data: TicketTypeRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="revenue"
          nameKey="ticketTypeName"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Revenue Tracking                                            │
│                                                              │
│ Date Range: [Last 30 days ▼]  Event: [All Events ▼]       │
│                                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │  GROSS   │ │  FEES    │ │ REFUNDS  │ │   NET    │       │
│ │ $125,000 │ │  $9,875  │ │  $2,500  │ │ $112,625 │       │
│ │  +12.5%  │ │   7.9%   │ │   2.0%   │ │  +14.9%  │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│ Revenue Trends                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │          📈 Line Chart (Recharts)                      │ │
│ │  $50k   ╱╲                                             │ │
│ │  $40k  ╱  ╲        ╱╲                                  │ │
│ │  $30k ╱    ╲      ╱  ╲     ╱╲                         │ │
│ │  $20k       ╲    ╱    ╲   ╱  ╲                        │ │
│ │  $10k        ╲__╱      ╲_╱    ╲                       │ │
│ │       Sep  Oct  Nov  Dec  Jan  Feb                    │ │
│ │       ━━ Gross Revenue  ━━ Net Revenue                │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Revenue by Event          │  Ticket Type Breakdown         │
│ ┌────────────────────────┐│ ┌──────────────────────────┐  │
│ │ Event Name      Revenue││ │   🥧 Pie Chart           │  │
│ │ Summer Dance   $45,000 ││ │                          │  │
│ │ Winter Gala    $38,000 ││ │   VIP: 35%               │  │
│ │ Spring Concert $27,000 ││ │   General: 45%           │  │
│ └────────────────────────┘│ │   Early Bird: 20%        │  │
│                            │ └──────────────────────────┘  │
│                            │  [Export CSV]                 │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### Dependencies
- **EPIC-003**: Payment processing data (orders, payments)
- **EPIC-019**: Billing system for fee calculations
- **EPIC-002**: Event data
- **EPIC-004**: Ticket types

### Data Sources
```sql
-- Revenue overview query
SELECT
  SUM(totalAmount) as grossRevenue,
  SUM(platformFee) as platformFees,
  SUM(processingFee) as processingFees,
  SUM(COALESCE(r.refundAmount, 0)) as totalRefunds
FROM orders o
LEFT JOIN (
  SELECT orderId, SUM(amount) as refundAmount
  FROM refunds
  GROUP BY orderId
) r ON o.id = r.orderId
WHERE o.organizerId = ?
  AND o.status = 'COMPLETED'
  AND o.createdAt BETWEEN ? AND ?;
```

## Performance Requirements

- **Page load**: < 2 seconds
- **Chart rendering**: < 500ms
- **Data export**: < 3 seconds for 10,000 orders
- **Real-time updates**: < 1 second after payment completion

## Testing Requirements

### Unit Tests
```typescript
describe('RevenueService', () => {
  it('calculates net revenue correctly', async () => {
    const data = await revenueService.getRevenueData(organizerId, startDate, endDate);
    expect(data.overview.netRevenue).toBe(
      data.overview.grossRevenue -
      data.overview.platformFees -
      data.overview.processingFees -
      data.overview.refunds
    );
  });

  it('groups revenue by event correctly', () => {
    // Test event grouping logic
  });
});
```

### Integration Tests
- [ ] Test revenue data fetching from API
- [ ] Test fee calculations
- [ ] Test date range filtering
- [ ] Test export functionality

### E2E Tests
```typescript
test('organizer views revenue tracking', async ({ page }) => {
  await page.goto('/dashboard/revenue');

  // Verify revenue cards loaded
  await expect(page.locator('[data-testid="gross-revenue"]')).toBeVisible();

  // Test date range filter
  await page.click('[data-testid="date-range-selector"]');
  await page.click('text=Last 30 days');

  // Verify charts rendered
  await expect(page.locator('.recharts-wrapper')).toBeVisible();
});
```

## Security Considerations

- [ ] Verify organizer owns all events in query
- [ ] Prevent SQL injection in date range queries
- [ ] Sanitize export file names
- [ ] Rate limit API requests (10 req/min)
- [ ] Encrypt revenue data at rest

## Accessibility

- [ ] Chart data available in table format for screen readers
- [ ] ARIA labels for all charts
- [ ] Keyboard navigation for chart tooltips
- [ ] High contrast colors for chart lines
- [ ] Text alternatives for visual data

## Success Metrics

- **Target**: 85% of organizers view revenue tracking weekly
- **Target**: Average session duration >3 minutes
- **Target**: 40% export revenue data monthly
- **Target**: <1% data accuracy issues

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Charts render correctly on all screen sizes
- [ ] Export functionality works for large datasets
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Accessibility audit passed
- [ ] Code reviewed and approved
- [ ] QA sign-off received
- [ ] Product Owner acceptance

## Notes

- Consider adding revenue forecasting based on historical data
- Future: Integrate with accounting software (QuickBooks, Xero)
- Monitor chart library performance with large datasets
- Consider adding revenue goals and targets