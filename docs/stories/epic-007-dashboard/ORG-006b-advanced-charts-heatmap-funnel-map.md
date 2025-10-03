# ORG-006b: Advanced Charts (Heatmap, Funnel, Map)

**Parent Story:** ORG-006 - Sales Analytics Charts
**Epic:** EPIC-007 - Organizer Dashboard & Analytics
**Story Points:** 2
**Priority:** Medium
**Status:** Ready for Development

## User Story

As an **event organizer**
I want to **visualize advanced sales patterns through heatmaps, funnels, and geographic maps**
So that **I can identify optimal sales times, conversion bottlenecks, and geographic reach**

## Acceptance Criteria

### AC1: Hourly Sales Heatmap
- [ ] 7x24 grid showing day of week (rows) vs hour of day (columns)
- [ ] Color intensity represents sales volume:
  - Light blue: Low sales (0-25th percentile)
  - Medium blue: Moderate sales (25-75th percentile)
  - Dark blue: High sales (75-100th percentile)
  - White/gray: No sales
- [ ] Cell hover shows:
  - Day and hour: "Monday, 8:00 PM"
  - Sales count: "45 tickets"
  - Revenue: "$2,250"
  - Percentage of total: "8.5%"
- [ ] Cell click drills down to transactions for that hour
- [ ] Color scale legend displayed below chart
- [ ] Time displayed in organizer's timezone
- [ ] Empty state: "Need at least 7 days of data for heatmap"

### AC2: Conversion Funnel Visualization
- [ ] Vertical funnel chart showing 5 stages:
  1. **Event Page Views** (widest bar)
  2. **Checkout Started** (narrower)
  3. **Payment Info Entered**
  4. **Payment Attempted**
  5. **Tickets Purchased** (narrowest)
- [ ] Each stage shows:
  - Count: "1,250 users"
  - Percentage of previous stage: "-20%"
  - Conversion rate from top: "45%"
- [ ] Color-coded drop-off zones (red for high drop-off, green for good)
- [ ] Click on stage filters timeline chart to show only that funnel stage
- [ ] Compare mode: Overlay previous period's funnel (dotted outline)
- [ ] Insights badge: "Highest drop-off at Payment Info stage (-35%)"
- [ ] Empty state if no conversion tracking data available

### AC3: Geographic Sales Map
- [ ] Interactive map using Mapbox or Google Maps
- [ ] Markers/pins at buyer locations (from IP geolocation or billing address)
- [ ] Marker clustering for dense areas
- [ ] Marker size proportional to sales volume
- [ ] Marker color by revenue (gradient from yellow to red)
- [ ] On marker click, show popup:
  - City, State/Province, Country
  - Total sales: "125 tickets"
  - Total revenue: "$6,250"
  - Top ticket type purchased
- [ ] Zoom controls and pan functionality
- [ ] Filter by country dropdown (shows top 10 countries)
- [ ] List view toggle showing table of cities sorted by sales
- [ ] Heatmap overlay option (density map instead of markers)
- [ ] Privacy compliance: Round coordinates to ~1km radius (no exact addresses)

### AC4: Export Functionality
- [ ] **Export as Image (PNG):**
  - Button above each chart: "Download as PNG"
  - Downloads chart at 2x resolution for clarity
  - Includes chart title, date range, and branding
- [ ] **Export as CSV:**
  - Exports underlying data in tabular format
  - Filename: `{chartType}_data_{date}.csv`
  - Includes headers and formatted values
- [ ] **Export All Charts:**
  - Single button to download all charts as ZIP
  - Includes PDF report with all visualizations
- [ ] **Share Link:**
  - Generate shareable link with current filters applied
  - Link expires after 7 days
  - Optional password protection

### AC5: Chart Customization
- [ ] Color scheme selector:
  - Default (blue gradient)
  - Colorblind-friendly (orange/blue)
  - Grayscale (for printing)
  - Custom (color picker)
- [ ] Chart height adjustment: Small (300px), Medium (400px), Large (600px)
- [ ] Toggle chart animations on/off
- [ ] Toggle grid lines on/off
- [ ] Toggle legend position: Top, Bottom, Left, Right, None
- [ ] Preferences saved per user in localStorage

## Technical Implementation

### Heatmap Chart Component

**File:** `/components/analytics/SalesHeatmap.tsx`
```typescript
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';

interface HeatmapData {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  sales: number;
  revenue: number;
}

interface SalesHeatmapProps {
  data: HeatmapData[];
}

export function SalesHeatmap({ data }: SalesHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create color scale
  const maxSales = max(data, (d) => d.sales) || 1;
  const colorScale = scaleLinear<string>()
    .domain([0, maxSales * 0.25, maxSales * 0.75, maxSales])
    .range(['#f0f9ff', '#7dd3fc', '#0ea5e9', '#0369a1']);

  const getCellData = (day: number, hour: number) => {
    return data.find((d) => d.day === day && d.hour === hour);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Sales Heatmap (by Day & Hour)</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-medium text-gray-600"></th>
              {hours.map((hour) => (
                <th key={hour} className="p-2 text-xs font-medium text-gray-600">
                  {hour}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dayIndex) => (
              <tr key={day}>
                <td className="p-2 text-sm font-medium text-gray-700">{day}</td>
                {hours.map((hour) => {
                  const cellData = getCellData(dayIndex, hour);
                  const sales = cellData?.sales || 0;
                  const revenue = cellData?.revenue || 0;
                  const bgColor = sales > 0 ? colorScale(sales) : '#f3f4f6';

                  return (
                    <td
                      key={hour}
                      className="p-0 border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500"
                      style={{ backgroundColor: bgColor }}
                    >
                      <HeatmapCell
                        day={day}
                        hour={hour}
                        sales={sales}
                        revenue={revenue}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HeatmapLegend colorScale={colorScale} maxValue={maxSales} />
    </div>
  );
}

function HeatmapCell({ day, hour, sales, revenue }: any) {
  return (
    <Tooltip
      content={
        <div>
          <p className="font-semibold">{day}, {hour}:00</p>
          <p>Sales: {sales} tickets</p>
          <p>Revenue: ${revenue.toFixed(2)}</p>
        </div>
      }
    >
      <div className="w-12 h-10 flex items-center justify-center text-xs">
        {sales > 0 && <span className="font-medium">{sales}</span>}
      </div>
    </Tooltip>
  );
}
```

### Conversion Funnel Component

**File:** `/components/analytics/ConversionFunnel.tsx`
```typescript
interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const maxCount = stages[0]?.count || 1;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const width = (stage.count / maxCount) * 100;
          const dropOff = index > 0 ? stages[index - 1].count - stage.count : 0;
          const dropOffRate = index > 0 ? (dropOff / stages[index - 1].count) * 100 : 0;

          return (
            <div key={stage.name}>
              {/* Stage Bar */}
              <div className="relative">
                <div
                  className="h-16 bg-gradient-to-r from-blue-500 to-blue-400 rounded flex items-center justify-between px-4 text-white transition-all hover:shadow-lg cursor-pointer"
                  style={{ width: `${width}%` }}
                >
                  <div>
                    <p className="font-semibold">{stage.name}</p>
                    <p className="text-sm opacity-90">{stage.count.toLocaleString()} users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stage.conversionRate}%</p>
                    <p className="text-xs opacity-90">conversion</p>
                  </div>
                </div>
              </div>

              {/* Drop-off Indicator */}
              {index < stages.length - 1 && dropOffRate > 0 && (
                <div className="flex items-center gap-2 mt-2 ml-4 text-sm">
                  <ArrowDownIcon className="w-4 h-4 text-red-500" />
                  <span className={dropOffRate > 30 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {dropOff.toLocaleString()} users dropped (-{dropOffRate.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <FunnelInsights stages={stages} />
    </div>
  );
}

function FunnelInsights({ stages }: { stages: FunnelStage[] }) {
  // Find stage with highest drop-off
  let maxDropOffIndex = 0;
  let maxDropOffRate = 0;

  for (let i = 1; i < stages.length; i++) {
    const dropOffRate = ((stages[i - 1].count - stages[i].count) / stages[i - 1].count) * 100;
    if (dropOffRate > maxDropOffRate) {
      maxDropOffRate = dropOffRate;
      maxDropOffIndex = i;
    }
  }

  return (
    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
      <div className="flex items-start gap-2">
        <LightBulbIcon className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Insight</p>
          <p className="text-sm text-amber-800">
            Highest drop-off at <strong>{stages[maxDropOffIndex].name}</strong> stage
            ({maxDropOffRate.toFixed(1)}% abandonment). Consider optimizing this step.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Geographic Map Component

**File:** `/components/analytics/GeographicMap.tsx`
```typescript
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  sales: number;
  revenue: number;
}

interface GeographicMapProps {
  locations: LocationData[];
}

export function GeographicMap({ locations }: GeographicMapProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const maxRevenue = Math.max(...locations.map((l) => l.revenue));

  const getMarkerSize = (revenue: number) => {
    return 5 + (revenue / maxRevenue) * 20; // 5px to 25px
  };

  const getMarkerColor = (revenue: number) => {
    const intensity = revenue / maxRevenue;
    if (intensity > 0.75) return '#dc2626'; // Red
    if (intensity > 0.5) return '#f59e0b'; // Amber
    if (intensity > 0.25) return '#fbbf24'; // Yellow
    return '#60a5fa'; // Blue
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Geographic Sales Map</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="w-4 h-4" />
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <MapContainer
          center={[39.8283, -98.5795]} // Center of USA
          zoom={4}
          style={{ height: '500px', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MarkerClusterGroup>
            {locations.map((location, index) => (
              <CircleMarker
                key={index}
                center={[location.lat, location.lng]}
                radius={getMarkerSize(location.revenue)}
                fillColor={getMarkerColor(location.revenue)}
                color="white"
                weight={2}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold">{location.city}, {location.state}</p>
                    <p className="text-sm text-gray-600">{location.country}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">Sales: {location.sales} tickets</p>
                      <p className="text-sm">Revenue: ${location.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      ) : (
        <LocationsList locations={locations} />
      )}
    </div>
  );
}

function LocationsList({ locations }: { locations: LocationData[] }) {
  const sorted = [...locations].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="max-h-[500px] overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th className="text-left p-2">Location</th>
            <th className="text-right p-2">Sales</th>
            <th className="text-right p-2">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((location, index) => (
            <tr key={index} className="border-t hover:bg-gray-50">
              <td className="p-2">
                <p className="font-medium">{location.city}, {location.state}</p>
                <p className="text-sm text-gray-600">{location.country}</p>
              </td>
              <td className="text-right p-2">{location.sales}</td>
              <td className="text-right p-2">${location.revenue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Backend Data Aggregation

**File:** `/lib/services/analytics.service.ts` (continued)
```typescript
async getHeatmapData(organizerId: string, dateRange: DateRange) {
  const orders = await prisma.order.findMany({
    where: {
      organizerId,
      status: 'COMPLETED',
      createdAt: { gte: dateRange.start, lte: dateRange.end },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      items: { select: { quantity: true } },
    },
  });

  // Aggregate by day and hour
  const heatmapData: Map<string, { sales: number; revenue: number }> = new Map();

  orders.forEach((order) => {
    const day = order.createdAt.getDay(); // 0-6
    const hour = order.createdAt.getHours(); // 0-23
    const key = `${day}-${hour}`;

    const existing = heatmapData.get(key) || { sales: 0, revenue: 0 };
    existing.sales += order.items.reduce((sum, item) => sum + item.quantity, 0);
    existing.revenue += order.totalAmount;
    heatmapData.set(key, existing);
  });

  // Convert to array format
  return Array.from(heatmapData.entries()).map(([key, data]) => {
    const [day, hour] = key.split('-').map(Number);
    return { day, hour, ...data };
  });
}

async getConversionFunnel(organizerId: string, dateRange: DateRange) {
  const [views, checkouts, payments, purchases] = await Promise.all([
    // Get event page views from analytics
    this.getEventPageViews(organizerId, dateRange),
    // Get checkout started count
    this.getCheckoutStarted(organizerId, dateRange),
    // Get payment info entered
    this.getPaymentInfoEntered(organizerId, dateRange),
    // Get completed purchases
    this.getCompletedPurchases(organizerId, dateRange),
  ]);

  return [
    { name: 'Event Page Views', count: views, conversionRate: 100 },
    { name: 'Checkout Started', count: checkouts, conversionRate: (checkouts / views) * 100 },
    { name: 'Payment Info Entered', count: payments, conversionRate: (payments / views) * 100 },
    { name: 'Tickets Purchased', count: purchases, conversionRate: (purchases / views) * 100 },
  ];
}
```

## Testing Requirements

### Unit Tests
```typescript
describe('SalesHeatmap', () => {
  it('renders 7x24 grid', () => {
    render(<SalesHeatmap data={mockHeatmapData} />);
    expect(screen.getAllByRole('row')).toHaveLength(8); // 7 days + header
  });

  it('applies correct color scale', () => {
    // Test color intensity based on sales volume
  });
});
```

### E2E Tests
```typescript
test('organizer views advanced charts', async ({ page }) => {
  await page.goto('/dashboard/analytics');

  // Test heatmap
  await expect(page.locator('[data-testid="sales-heatmap"]')).toBeVisible();

  // Test funnel
  await expect(page.locator('[data-testid="conversion-funnel"]')).toBeVisible();

  // Test map
  await expect(page.locator('[data-testid="geographic-map"]')).toBeVisible();

  // Test export functionality
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-chart-button"]');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
```

## Dependencies

- [ ] Mapbox or Leaflet for maps
- [ ] D3.js for heatmap color scales
- [ ] IP geolocation service (MaxMind or similar)
- [ ] Chart export library (html2canvas or similar)

## Performance Requirements

- [ ] Map renders < 500ms with 1000+ markers
- [ ] Heatmap renders < 200ms
- [ ] Funnel calculations < 100ms
- [ ] Export to PNG < 2 seconds

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Three advanced charts implemented
- [ ] Export functionality working
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved