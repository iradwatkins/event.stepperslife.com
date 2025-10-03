# ORG-006: Sales Analytics Charts

**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 5
**Priority:** High
**Status:** Ready for Development

## User Story
As an **event organizer**
I want to **analyze sales patterns with visual charts**
So that **I can identify trends, optimize pricing, and make data-driven decisions about my events**

## Acceptance Criteria

### AC1: Sales Timeline Chart (Line Chart)
- [ ] Line chart showing ticket sales over time
- [ ] X-axis: Time (hourly, daily, weekly, monthly views)
- [ ] Y-axis: Number of tickets sold or revenue
- [ ] Multiple lines for comparison: Current event vs previous similar events
- [ ] Toggle between ticket count and revenue view
- [ ] Hover tooltips show exact values and timestamps
- [ ] Zoom and pan functionality for detailed analysis
- [ ] Highlight peak sales periods

### AC2: Ticket Type Distribution (Bar Chart)
- [ ] Vertical bar chart showing sales by ticket type
- [ ] Bars show quantity sold and revenue for each type
- [ ] Color-coded bars (VIP, General, Early Bird, etc.)
- [ ] Stacked option to show revenue breakdown
- [ ] Comparison mode: multiple events side-by-side
- [ ] Sort by: Revenue, Quantity, Alphabetical
- [ ] Percentage labels on bars

### AC3: Revenue Breakdown (Pie/Donut Chart)
- [ ] Pie or donut chart showing revenue distribution
- [ ] Segments: By ticket type, by payment method, by discount code
- [ ] Percentage and dollar amount labels
- [ ] Click segment to drill down into details
- [ ] Legend with color key
- [ ] Option to show top 5 and group others as "Other"
- [ ] Export chart as PNG/SVG

### AC4: Hourly Sales Heatmap
- [ ] Heatmap showing sales intensity by day and hour
- [ ] Rows: Days of the week
- [ ] Columns: Hours of the day (0-23)
- [ ] Color intensity represents sales volume
- [ ] Helps identify optimal email/marketing times
- [ ] Aggregated data across all events or per event
- [ ] Tooltip shows exact sales count for each cell

### AC5: Conversion Funnel Chart
- [ ] Funnel chart showing conversion stages:
  1. Event page views
  2. Ticket selection
  3. Checkout initiated
  4. Payment completed
- [ ] Show conversion rate at each stage
- [ ] Highlight drop-off points
- [ ] Compare conversion rates across events
- [ ] Identify bottlenecks in purchase flow

### AC6: Cumulative Sales Chart (Area Chart)
- [ ] Area chart showing cumulative tickets sold over time
- [ ] Goal line overlay showing target capacity
- [ ] Projection line showing estimated sellout date
- [ ] Shaded area under curve
- [ ] Multiple events comparison
- [ ] "Days until event" marker
- [ ] Velocity indicator (sales rate)

### AC7: Sales Velocity Gauge
- [ ] Gauge chart showing current sales rate
- [ ] Ranges: Slow, Moderate, Fast, Very Fast
- [ ] Compare to historical average
- [ ] "On track to sell out" indicator
- [ ] Forecast: Expected total sales by event date
- [ ] Alert if velocity drops below threshold

### AC8: Geographic Sales Map
- [ ] Map visualization showing buyer locations (if captured)
- [ ] Heatmap overlay showing concentration areas
- [ ] Markers for top cities
- [ ] Zoom and pan functionality
- [ ] Filter by ticket type or date range
- [ ] Export location data as CSV

### AC9: Interactive Dashboard
- [ ] All charts on single dashboard page
- [ ] Global filters apply to all charts:
  - Date range selector
  - Event selector (single or compare multiple)
  - Ticket type filter
- [ ] Responsive grid layout
- [ ] Drag-and-drop to rearrange charts
- [ ] Save custom dashboard layouts
- [ ] Export all charts as PDF report

## Technical Implementation

### Frontend Components
```typescript
// /components/dashboard/analytics/SalesAnalyticsCharts.tsx
interface SalesAnalyticsChartsProps {
  eventId?: string; // Optional: null for all events
  dateRange: DateRange;
}

interface SalesData {
  timeline: TimelineDataPoint[];
  ticketTypeDistribution: TicketTypeData[];
  revenueBreakdown: RevenueSegment[];
  hourlyHeatmap: HeatmapData[][];
  conversionFunnel: FunnelStage[];
  cumulativeSales: CumulativeData[];
  salesVelocity: VelocityData;
  geographicSales: GeoPoint[];
}

interface TimelineDataPoint {
  timestamp: Date;
  ticketsSold: number;
  revenue: number;
  eventName?: string; // For comparison
}

interface TicketTypeData {
  ticketTypeName: string;
  quantitySold: number;
  revenue: number;
  percentOfTotal: number;
  color: string;
}

// Component Structure
- SalesAnalyticsCharts (container)
  - AnalyticsDashboard
    - GlobalFilters
      - DateRangeSelector
      - EventSelector (multi-select)
      - TicketTypeFilter
    - ChartsGrid (responsive grid)
      - SalesTimelineChart (Recharts LineChart)
      - TicketTypeBarChart (Recharts BarChart)
      - RevenueBreakdownChart (Recharts PieChart)
      - HourlySalesHeatmap (D3 or Nivo)
      - ConversionFunnelChart (Custom or Recharts)
      - CumulativeSalesChart (Recharts AreaChart)
      - SalesVelocityGauge (Custom gauge)
      - GeographicSalesMap (Mapbox or Google Maps)
    - ExportButton (PDF report generator)
```

### Backend API
```typescript
// /app/api/dashboard/analytics/sales/route.ts
GET /api/dashboard/analytics/sales
  ?organizerId={id}
  &eventId={id|all}
  &startDate={date}
  &endDate={date}

Response: {
  success: true,
  data: {
    timeline: [
      {
        timestamp: "2025-09-01T00:00:00Z",
        ticketsSold: 45,
        revenue: 2250.00
      },
      ...
    ],
    ticketTypeDistribution: [
      {
        ticketTypeName: "VIP",
        quantitySold: 120,
        revenue: 9000.00,
        percentOfTotal: 35.5,
        color: "#2563EB"
      },
      ...
    ],
    revenueBreakdown: [
      {
        category: "VIP Tickets",
        value: 9000.00,
        percent: 35.5
      },
      ...
    ],
    hourlyHeatmap: [
      [0, 2, 5, 8, 12, ...], // Monday
      [1, 3, 4, 9, 15, ...], // Tuesday
      ...
    ],
    conversionFunnel: [
      { stage: "Page Views", count: 5000, rate: 1.0 },
      { stage: "Ticket Selection", count: 2500, rate: 0.5 },
      { stage: "Checkout", count: 1500, rate: 0.6 },
      { stage: "Purchase", count: 1200, rate: 0.8 }
    ],
    cumulativeSales: [
      {
        date: "2025-09-01",
        cumulative: 45,
        target: 500,
        projected: 480
      },
      ...
    ],
    salesVelocity: {
      current: 12.5, // tickets per day
      average: 10.2,
      status: "FAST",
      forecast: {
        totalSales: 485,
        selloutDate: "2025-10-15"
      }
    },
    geographicSales: [
      {
        city: "New York",
        state: "NY",
        country: "USA",
        lat: 40.7128,
        lng: -74.0060,
        count: 45,
        revenue: 2250.00
      },
      ...
    ]
  }
}
```

### Chart Components (Recharts)
```typescript
// /components/dashboard/analytics/charts/SalesTimelineChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesTimelineChartProps {
  data: TimelineDataPoint[];
  dataKey: 'ticketsSold' | 'revenue';
  compareEvents?: boolean;
}

export function SalesTimelineChart({ data, dataKey, compareEvents }: SalesTimelineChartProps) {
  const [view, setView] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');

  // Aggregate data based on view
  const aggregatedData = useMemo(() => {
    return aggregateByPeriod(data, view);
  }, [data, view]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Sales Timeline</h3>
        <div className="view-selector">
          <button onClick={() => setView('hourly')}>Hourly</button>
          <button onClick={() => setView('daily')}>Daily</button>
          <button onClick={() => setView('weekly')}>Weekly</button>
          <button onClick={() => setView('monthly')}>Monthly</button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={aggregatedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => formatDate(value, view)}
          />
          <YAxis
            tickFormatter={(value) =>
              dataKey === 'revenue' ? `$${value}` : value
            }
          />
          <Tooltip
            formatter={(value: number) =>
              dataKey === 'revenue' ? `$${value.toFixed(2)}` : value
            }
            labelFormatter={(label) => formatDate(label, view)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={dataKey === 'revenue' ? 'Revenue' : 'Tickets Sold'}
          />
          {compareEvents && (
            <Line
              type="monotone"
              dataKey="comparisonValue"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Comparison Event"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// /components/dashboard/analytics/charts/TicketTypeBarChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function TicketTypeBarChart({ data }: { data: TicketTypeData[] }) {
  const [dataKey, setDataKey] = useState<'quantitySold' | 'revenue'>('revenue');

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Ticket Type Distribution</h3>
        <div className="toggle">
          <button onClick={() => setDataKey('revenue')}>Revenue</button>
          <button onClick={() => setDataKey('quantitySold')}>Quantity</button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ticketTypeName" />
          <YAxis
            tickFormatter={(value) =>
              dataKey === 'revenue' ? `$${value}` : value
            }
          />
          <Tooltip
            formatter={(value: number) =>
              dataKey === 'revenue' ? `$${value.toFixed(2)}` : value
            }
          />
          <Legend />
          <Bar
            dataKey={dataKey}
            fill="#2563EB"
            radius={[8, 8, 0, 0]}
            label={{ position: 'top', formatter: (value: number) =>
              dataKey === 'revenue' ? `$${value}` : value
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// /components/dashboard/analytics/charts/ConversionFunnelChart.tsx
export function ConversionFunnelChart({ data }: { data: FunnelStage[] }) {
  return (
    <div className="funnel-chart">
      {data.map((stage, index) => (
        <div
          key={stage.stage}
          className="funnel-stage"
          style={{
            width: `${stage.rate * 100}%`,
            backgroundColor: `hsl(${220 + index * 20}, 70%, 60%)`
          }}
        >
          <div className="stage-label">{stage.stage}</div>
          <div className="stage-count">{stage.count.toLocaleString()}</div>
          <div className="stage-rate">{(stage.rate * 100).toFixed(1)}%</div>
          {index > 0 && (
            <div className="dropoff">
              {((data[index - 1].count - stage.count) / data[index - 1].count * 100).toFixed(1)}% drop-off
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// /components/dashboard/analytics/charts/SalesVelocityGauge.tsx
export function SalesVelocityGauge({ data }: { data: VelocityData }) {
  const percentage = Math.min((data.current / (data.average * 2)) * 100, 100);

  return (
    <div className="velocity-gauge">
      <h3>Sales Velocity</h3>
      <div className="gauge-container">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Gauge background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          {/* Gauge value arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={getVelocityColor(data.status)}
            strokeWidth="20"
            strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
          />
        </svg>
        <div className="gauge-value">
          <div className="current">{data.current.toFixed(1)}</div>
          <div className="unit">tickets/day</div>
          <div className="status">{data.status}</div>
        </div>
      </div>
      <div className="forecast">
        <p>Projected: {data.forecast.totalSales} tickets</p>
        {data.forecast.selloutDate && (
          <p>Sellout: {format(new Date(data.forecast.selloutDate), 'MMM dd')}</p>
        )}
      </div>
    </div>
  );
}
```

### Analytics Service
```typescript
// /lib/services/analytics.service.ts
export class AnalyticsService {
  async getSalesAnalytics(
    organizerId: string,
    eventId: string | null,
    dateRange: DateRange
  ): Promise<SalesData> {
    const whereClause = {
      organizerId,
      ...(eventId && { eventId }),
      status: 'COMPLETED',
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end
      }
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { ticketType: true }
        },
        user: { select: { city: true, state: true, country: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return {
      timeline: this.calculateTimeline(orders),
      ticketTypeDistribution: this.calculateTicketTypeDistribution(orders),
      revenueBreakdown: this.calculateRevenueBreakdown(orders),
      hourlyHeatmap: this.calculateHourlyHeatmap(orders),
      conversionFunnel: await this.calculateConversionFunnel(eventId),
      cumulativeSales: this.calculateCumulativeSales(orders),
      salesVelocity: this.calculateSalesVelocity(orders),
      geographicSales: this.calculateGeographicSales(orders)
    };
  }

  private calculateTimeline(orders: Order[]): TimelineDataPoint[] {
    // Group orders by day
    const grouped = groupBy(orders, (order) =>
      startOfDay(order.createdAt).toISOString()
    );

    return Object.entries(grouped).map(([date, orders]) => ({
      timestamp: new Date(date),
      ticketsSold: orders.reduce((sum, o) =>
        sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
      ),
      revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    }));
  }

  private calculateTicketTypeDistribution(orders: Order[]): TicketTypeData[] {
    const typeMap = new Map<string, { quantity: number; revenue: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = typeMap.get(item.ticketType.name) || { quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        typeMap.set(item.ticketType.name, existing);
      });
    });

    const totalRevenue = Array.from(typeMap.values())
      .reduce((sum, t) => sum + t.revenue, 0);

    return Array.from(typeMap.entries()).map(([name, data], index) => ({
      ticketTypeName: name,
      quantitySold: data.quantity,
      revenue: data.revenue,
      percentOfTotal: (data.revenue / totalRevenue) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }

  private calculateSalesVelocity(orders: Order[]): VelocityData {
    const firstSale = orders[0]?.createdAt;
    const lastSale = orders[orders.length - 1]?.createdAt;

    if (!firstSale || !lastSale) {
      return { current: 0, average: 0, status: 'SLOW', forecast: { totalSales: 0 } };
    }

    const daysSinceFirst = differenceInDays(new Date(), firstSale);
    const totalTickets = orders.reduce((sum, o) =>
      sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
    );

    const currentVelocity = totalTickets / daysSinceFirst;

    // Calculate forecast
    const event = await prisma.event.findUnique({
      where: { id: orders[0].eventId },
      select: { startDateTime: true, capacity: true }
    });

    const daysUntilEvent = differenceInDays(event.startDateTime, new Date());
    const projectedTotal = Math.min(
      totalTickets + (currentVelocity * daysUntilEvent),
      event.capacity
    );

    const status = currentVelocity < 5 ? 'SLOW' :
                   currentVelocity < 15 ? 'MODERATE' :
                   currentVelocity < 30 ? 'FAST' : 'VERY_FAST';

    return {
      current: currentVelocity,
      average: currentVelocity, // Could calculate from historical data
      status,
      forecast: {
        totalSales: Math.round(projectedTotal),
        selloutDate: projectedTotal >= event.capacity
          ? addDays(new Date(), (event.capacity - totalTickets) / currentVelocity)
          : undefined
      }
    };
  }
}
```

## UI/UX Design

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Sales Analytics                                             │
│                                                              │
│ Filters: [Event: Summer Dance ▼] [Date: Last 30 days ▼]   │
│                                                              │
│ ┌─────────────────────┐ ┌─────────────────────┐           │
│ │ Sales Timeline      │ │ Cumulative Sales    │           │
│ │ [Hourly Daily Week] │ │ [Area Chart]        │           │
│ │ [Line Chart]        │ │                     │           │
│ │                     │ │  Goal: 500 ────────│           │
│ │    📈              │ │  Current: 387 ─────│           │
│ └─────────────────────┘ └─────────────────────┘           │
│                                                              │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│ │ Ticket Type│ │ Revenue    │ │ Sales      │              │
│ │ [Bar Chart]│ │ Breakdown  │ │ Velocity   │              │
│ │            │ │ [Pie Chart]│ │ [Gauge]    │              │
│ │  ████      │ │    🥧      │ │    🎯      │              │
│ └────────────┘ └────────────┘ └────────────┘              │
│                                                              │
│ ┌─────────────────────┐ ┌─────────────────────┐           │
│ │ Conversion Funnel   │ │ Hourly Heatmap      │           │
│ │ [Funnel Chart]      │ │ [D3 Heatmap]        │           │
│ │  Views: 5000        │ │ Mon ██░░░░░░░░      │           │
│ │  Selection: 2500    │ │ Tue ███░░░░░░░      │           │
│ │  Checkout: 1500     │ │ Wed ████░░░░░░      │           │
│ │  Purchase: 1200     │ │ ...                 │           │
│ └─────────────────────┘ └─────────────────────┘           │
│                                                              │
│ [Export PDF Report] [Save Dashboard Layout]                │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### Dependencies
- **EPIC-003**: Order and payment data
- **EPIC-004**: Ticket type data
- **EPIC-002**: Event data
- **Analytics tracking**: Page views, funnel stages

### Data Sources
- Orders table (completed sales)
- Analytics events (page views, clicks)
- User locations (if consented)
- Event capacity and settings

## Performance Requirements

- **Chart rendering**: < 500ms per chart
- **Dashboard load**: < 3 seconds with all charts
- **Data aggregation**: < 2 seconds for 100k orders
- **Real-time updates**: < 1 second latency

### Optimization
- Pre-aggregate data in background jobs
- Cache chart data (TTL: 5 minutes)
- Lazy load charts as user scrolls
- Virtualize large datasets

## Testing Requirements

### Unit Tests
```typescript
describe('AnalyticsService', () => {
  it('calculates sales timeline correctly', async () => {
    const timeline = await analyticsService.calculateTimeline(orders);
    expect(timeline).toHaveLength(30); // 30 days
    expect(timeline[0].ticketsSold).toBe(45);
  });

  it('calculates sales velocity correctly', () => {
    // Test velocity calculation
  });
});
```

### Integration Tests
- [ ] Test analytics API with various filters
- [ ] Test data aggregation performance
- [ ] Test chart data formatting
- [ ] Test export functionality

### E2E Tests
```typescript
test('organizer views sales analytics', async ({ page }) => {
  await page.goto('/dashboard/analytics/sales');

  // Verify charts loaded
  await expect(page.locator('.recharts-wrapper')).toHaveCount(6);

  // Test filter
  await page.selectOption('[data-testid="event-selector"]', 'evt_123');
  await expect(page.locator('.sales-timeline-chart')).toBeVisible();

  // Test export
  const downloadPromise = page.waitForEvent('download');
  await page.click('text=Export PDF Report');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/analytics.*\.pdf/);
});
```

## Security Considerations

- [ ] Verify organizer owns events before showing analytics
- [ ] Anonymize buyer data in geographic charts
- [ ] Rate limit analytics API (30 req/min)
- [ ] Sanitize filters to prevent injection attacks

## Accessibility

- [ ] Chart data available in table format
- [ ] ARIA labels for all charts
- [ ] Keyboard navigation for interactive charts
- [ ] Screen reader announces data points
- [ ] High contrast mode

## Success Metrics

- **Target**: 70% of organizers view analytics weekly
- **Target**: Average session duration >4 minutes
- **Target**: 50% use date range filters
- **Target**: 30% export reports

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All 8 chart types implemented
- [ ] Charts responsive on all devices
- [ ] Export functionality works
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

- Use Recharts for standard charts (line, bar, pie)
- Consider D3.js for advanced visualizations (heatmap)
- Monitor chart rendering performance with large datasets
- Consider adding predictive analytics (ML forecasting)