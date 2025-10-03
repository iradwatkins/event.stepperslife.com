# ORG-006a: Core Charts (Timeline, Distribution)

**Parent Story:** ORG-006 - Sales Analytics Charts
**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 3
**Priority:** Medium
**Status:** Ready for Development

## User Story

As an **event organizer**
I want to **visualize my sales data through timeline and distribution charts**
So that **I can understand sales patterns and ticket type performance**

## Acceptance Criteria

### AC1: Sales Timeline Line Chart
- [ ] X-axis: Time periods (hourly, daily, weekly, monthly based on date range)
- [ ] Y-axis: Revenue (primary) and Tickets Sold (secondary)
- [ ] Dual Y-axis chart with two lines:
  - Blue line: Revenue (left Y-axis, $)
  - Green line: Tickets Sold (right Y-axis, count)
- [ ] Data points on hover show:
  - Date/time
  - Revenue: $1,250.00
  - Tickets: 25
  - Average price: $50.00
- [ ] Chart updates based on global date range filter
- [ ] Smooth line interpolation (no jagged edges)
- [ ] Grid lines for readability
- [ ] Responsive: Adjusts to container width, maintains aspect ratio

### AC2: Ticket Type Distribution Bar Chart
- [ ] Horizontal bar chart showing ticket types
- [ ] X-axis: Number of tickets sold
- [ ] Y-axis: Ticket type names (e.g., "General Admission", "VIP", "Early Bird")
- [ ] Bars color-coded by ticket type (consistent across dashboard)
- [ ] Shows percentage of total sales next to each bar: "250 (42%)"
- [ ] Bars sorted by quantity (highest to lowest)
- [ ] On hover: Shows full breakdown:
  - Ticket type name
  - Quantity sold
  - Percentage of total
  - Revenue from this type: $12,500
- [ ] Empty state if no tickets sold: "No ticket sales data yet"
- [ ] Maximum 10 ticket types displayed, rest grouped as "Other"

### AC3: Revenue Breakdown Pie Chart
- [ ] Circular pie chart showing revenue by ticket type
- [ ] Each slice color-matched to ticket type in bar chart
- [ ] Slice size proportional to revenue percentage
- [ ] Labels show percentage on slice (if space allows)
- [ ] Legend below chart lists all ticket types with colors
- [ ] On hover: Shows:
  - Ticket type name
  - Revenue: $5,000
  - Percentage: 25%
  - Tickets sold: 100
- [ ] Center of pie shows total revenue: "$20,000"
- [ ] Animated slice separation on hover (pulls out slightly)
- [ ] Minimum slice size: 2% (smaller slices grouped into "Other")

### AC4: Chart Filtering & Date Range
- [ ] All charts respond to global date range selector
- [ ] Additional filter: Event selector dropdown
  - "All Events" (default)
  - Individual event selection
  - Multi-event selection (checkbox)
- [ ] Granularity selector for timeline chart:
  - Auto (based on date range)
  - Hourly (for ranges < 7 days)
  - Daily (for ranges < 90 days)
  - Weekly (for ranges < 365 days)
  - Monthly (for ranges >= 365 days)
- [ ] Compare mode toggle: Overlay previous period data (dotted line)
- [ ] Filter state persists in URL query params

### AC5: Chart Interactions
- [ ] **Zoom:** Click and drag on timeline chart to zoom into date range
- [ ] **Pan:** Shift + drag to pan through zoomed data
- [ ] **Reset Zoom:** Button to reset to original view
- [ ] **Legend Toggle:** Click legend item to show/hide that data series
- [ ] **Tooltip:** Follows mouse cursor, shows context data
- [ ] **Click Event:** Clicking data point navigates to detailed view
- [ ] **Export:** Button to download chart as PNG image

### AC6: Loading & Error States
- [ ] Skeleton loader while fetching data (shimmer animation)
- [ ] Loading spinner for chart re-renders (< 500ms)
- [ ] Error state with retry button if data fetch fails
- [ ] Empty state with illustration if no data available
- [ ] Partial data warning if some events have incomplete data

## Technical Implementation

### Chart Library Selection
Use **Recharts** (React-specific, lightweight) or **Chart.js with react-chartjs-2**

**File:** `/components/analytics/SalesTimelineChart.tsx`
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesTimelineChartProps {
  data: Array<{
    date: string;
    revenue: number;
    ticketsSold: number;
  }>;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export function SalesTimelineChart({ data, granularity }: SalesTimelineChartProps) {
  const formatXAxis = (value: string) => {
    switch (granularity) {
      case 'hourly':
        return format(new Date(value), 'ha'); // 9am, 10am
      case 'daily':
        return format(new Date(value), 'MMM d'); // Jan 15
      case 'weekly':
        return format(new Date(value), 'MMM d'); // Jan 15
      case 'monthly':
        return format(new Date(value), 'MMM yyyy'); // Jan 2025
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Sales Timeline</h3>
        <ChartControls onExport={handleExport} />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="left"
            stroke="#3b82f6"
            tickFormatter={(value) => `$${value}`}
            label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#10b981"
            label={{ value: 'Tickets Sold', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ticketsSold"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Tickets Sold"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  const revenue = payload[0]?.value || 0;
  const tickets = payload[1]?.value || 0;
  const avgPrice = tickets > 0 ? revenue / tickets : 0;

  return (
    <div className="bg-white p-3 border rounded shadow-lg">
      <p className="font-semibold mb-2">{format(new Date(label), 'PPP')}</p>
      <p className="text-blue-600">Revenue: ${revenue.toFixed(2)}</p>
      <p className="text-green-600">Tickets: {tickets}</p>
      <p className="text-gray-600">Avg: ${avgPrice.toFixed(2)}</p>
    </div>
  );
}
```

**File:** `/components/analytics/TicketDistributionChart.tsx`
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TicketDistributionChartProps {
  data: Array<{
    ticketType: string;
    quantity: number;
    revenue: number;
    percentage: number;
    color: string;
  }>;
}

export function TicketDistributionChart({ data }: TicketDistributionChartProps) {
  // Sort by quantity descending
  const sortedData = [...data].sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Ticket Type Distribution</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="ticketType" width={90} />
          <Tooltip content={<DistributionTooltip />} />
          <Bar
            dataKey="quantity"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
            label={{ position: 'right', formatter: (value: number, entry: any) => `${value} (${entry.percentage}%)` }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DistributionTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 border rounded shadow-lg">
      <p className="font-semibold mb-2">{data.ticketType}</p>
      <p>Quantity: {data.quantity}</p>
      <p>Percentage: {data.percentage}%</p>
      <p>Revenue: ${data.revenue.toFixed(2)}</p>
    </div>
  );
}
```

**File:** `/components/analytics/RevenueBreakdownChart.tsx`
```typescript
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueBreakdownChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    ticketsSold: number;
  }>;
  totalRevenue: number;
}

export function RevenueBreakdownChart({ data, totalRevenue }: RevenueBreakdownChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            dataKey="value"
            activeIndex={0}
            activeShape={renderActiveShape}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<RevenueTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-center mt-4">
        <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
        <p className="text-gray-600">Total Revenue</p>
      </div>
    </div>
  );
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null; // Hide labels for slices < 5%

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function RevenueTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 border rounded shadow-lg">
      <p className="font-semibold mb-2">{data.name}</p>
      <p>Revenue: ${data.value.toFixed(2)}</p>
      <p>Percentage: {((data.value / data.totalRevenue) * 100).toFixed(1)}%</p>
      <p>Tickets: {data.ticketsSold}</p>
    </div>
  );
}
```

### Backend API

**File:** `/app/api/analytics/charts/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizerId = searchParams.get('organizerId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const granularity = searchParams.get('granularity') || 'daily';
  const eventId = searchParams.get('eventId'); // Optional filter

  const chartData = await analyticsService.getChartData({
    organizerId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    granularity,
    eventId,
  });

  return NextResponse.json(chartData);
}
```

**File:** `/lib/services/analytics.service.ts`
```typescript
export class AnalyticsService {
  async getChartData(params: ChartDataParams) {
    const [timeline, distribution, breakdown] = await Promise.all([
      this.getSalesTimeline(params),
      this.getTicketDistribution(params),
      this.getRevenueBreakdown(params),
    ]);

    return {
      timeline,
      distribution,
      breakdown,
    };
  }

  private async getSalesTimeline(params: ChartDataParams) {
    const { organizerId, startDate, endDate, granularity } = params;

    // Generate time buckets based on granularity
    const buckets = this.generateTimeBuckets(startDate, endDate, granularity);

    // Aggregate sales data into buckets
    const sales = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        organizerId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Map sales to buckets
    return buckets.map((bucket) => {
      const bucketSales = sales.filter((sale) =>
        isWithinInterval(sale.createdAt, { start: bucket.start, end: bucket.end })
      );

      return {
        date: bucket.start.toISOString(),
        revenue: bucketSales.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0),
        ticketsSold: bucketSales.reduce((sum, s) => sum + s._count.id, 0),
      };
    });
  }

  private async getTicketDistribution(params: ChartDataParams) {
    const result = await prisma.ticket.groupBy({
      by: ['ticketTypeId'],
      where: {
        event: { organizerId: params.organizerId },
        status: 'ACTIVE',
        createdAt: { gte: params.startDate, lte: params.endDate },
      },
      _count: true,
      _sum: {
        price: true,
      },
    });

    const total = result.reduce((sum, r) => sum + r._count, 0);

    return Promise.all(
      result.map(async (r) => {
        const ticketType = await prisma.ticketType.findUnique({
          where: { id: r.ticketTypeId },
        });

        return {
          ticketType: ticketType.name,
          quantity: r._count,
          revenue: r._sum.price || 0,
          percentage: ((r._count / total) * 100).toFixed(1),
          color: ticketType.color || '#3b82f6',
        };
      })
    );
  }
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('SalesTimelineChart', () => {
  it('renders chart with data', () => {
    render(<SalesTimelineChart data={mockData} granularity="daily" />);
    expect(screen.getByText('Sales Timeline')).toBeInTheDocument();
  });

  it('formats X-axis labels based on granularity', () => {
    // Test hourly, daily, weekly, monthly formats
  });
});

describe('AnalyticsService.getSalesTimeline', () => {
  it('generates correct time buckets for daily granularity', async () => {
    const timeline = await analyticsService.getSalesTimeline({
      organizerId: 'org_123',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      granularity: 'daily',
    });

    expect(timeline).toHaveLength(31); // 31 days in January
  });
});
```

### E2E Tests
```typescript
test('organizer views sales charts', async ({ page }) => {
  await page.goto('/dashboard/analytics');

  // Verify charts rendered
  await expect(page.locator('[data-testid="sales-timeline-chart"]')).toBeVisible();
  await expect(page.locator('[data-testid="ticket-distribution-chart"]')).toBeVisible();
  await expect(page.locator('[data-testid="revenue-breakdown-chart"]')).toBeVisible();

  // Test tooltip on hover
  await page.hover('[data-testid="chart-datapoint-0"]');
  await expect(page.locator('.recharts-tooltip-wrapper')).toBeVisible();
});
```

## Performance Requirements

- [ ] Chart rendering: < 300ms
- [ ] Data aggregation query: < 1 second
- [ ] Chart re-render on filter change: < 200ms
- [ ] Smooth animations at 60fps

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Three core charts implemented and functional
- [ ] Charts responsive across devices
- [ ] Unit tests pass (>80% coverage)
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved