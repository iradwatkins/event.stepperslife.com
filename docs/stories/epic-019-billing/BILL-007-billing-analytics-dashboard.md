# BILL-007: Billing Analytics Dashboard

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 5
**Priority:** P2 (Medium)
**Status:** Ready for Development

## User Story

**As a** platform administrator
**I want** to view comprehensive billing analytics and revenue metrics
**So that** I can make data-driven decisions about pricing, promotions, and business growth

## Acceptance Criteria

### Primary Criteria
- [ ] Real-time revenue dashboard with key metrics
- [ ] Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR) tracking
- [ ] Churn rate and retention metrics
- [ ] Revenue trends by time period (daily, weekly, monthly)
- [ ] Revenue breakdown by source (transaction fees, subscriptions)
- [ ] Top organizers by revenue
- [ ] Subscription metrics (new, active, canceled, churned)
- [ ] Average Order Value (AOV) and Customer Lifetime Value (CLV)

### Revenue Metrics
- [ ] Total revenue (all sources)
- [ ] Platform fee revenue
- [ ] Subscription revenue (MRR, ARR)
- [ ] Net revenue (after refunds and chargebacks)
- [ ] Revenue growth rate (MoM, YoY)
- [ ] Revenue per organizer
- [ ] Revenue by event type

### Subscription Metrics
- [ ] Active subscriptions by tier
- [ ] New subscriptions (by period)
- [ ] Canceled subscriptions
- [ ] Churn rate (monthly, annual)
- [ ] Trial conversion rate
- [ ] Upgrade/downgrade rate
- [ ] Average subscription tenure
- [ ] Expansion MRR (upgrades)
- [ ] Contraction MRR (downgrades)

### Organizer Metrics
- [ ] Top 10 organizers by revenue
- [ ] Organizer lifetime value (LTV)
- [ ] New organizer acquisition rate
- [ ] Organizer retention rate
- [ ] Average events per organizer
- [ ] Average revenue per organizer

### Chart Visualizations
- [ ] Revenue trend line chart (with forecasting)
- [ ] Revenue breakdown pie chart
- [ ] MRR growth bar chart
- [ ] Churn rate line chart
- [ ] Subscription tier distribution chart
- [ ] Cohort analysis heatmap

## Technical Specifications

### Analytics Service

**File:** `lib/services/billing-analytics.service.ts`

```typescript
interface RevenueMetrics {
  // Current period
  totalRevenue: number
  platformFeeRevenue: number
  subscriptionRevenue: number
  netRevenue: number // After refunds

  // Growth
  revenueGrowthMoM: number // Month-over-Month %
  revenueGrowthYoY: number // Year-over-Year %

  // Averages
  averageOrderValue: number
  averageRevenuePerOrganizer: number
}

interface SubscriptionMetrics {
  // Current state
  totalActiveSubscriptions: number
  subscriptionsByTier: Record<SubscriptionTier, number>

  // MRR/ARR
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  expansionMRR: number // From upgrades
  contractionMRR: number // From downgrades
  newMRR: number // From new subscriptions
  churnedMRR: number // From cancellations

  // Conversion
  trialConversionRate: number
  upgradeRate: number
  downgradeRate: number

  // Churn
  churnRate: number // % of subscribers who canceled
  retentionRate: number // 100 - churnRate
  averageTenure: number // Average subscription length in months
}

interface OrganizerMetrics {
  totalOrganizers: number
  activeOrganizers: number // Organizers with events in last 30 days
  newOrganizers: number // Organizers who joined in period

  topOrganizersByRevenue: Array<{
    organizerId: string
    name: string
    revenue: number
    eventCount: number
    subscriptionTier: SubscriptionTier
  }>

  lifetimeValue: number // Average LTV per organizer
  acquisitionRate: number // New organizers per month
  retentionRate: number // % still active after 12 months
}

interface CohortAnalysis {
  cohorts: Array<{
    cohortMonth: string // "2025-01"
    subscribersAtStart: number
    retentionByMonth: Record<number, number> // Month 0, 1, 2, etc.
  }>
}

class BillingAnalyticsService {
  /**
   * Get revenue metrics for period
   */
  async getRevenueMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueMetrics>

  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<SubscriptionMetrics>

  /**
   * Get organizer metrics
   */
  async getOrganizerMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<OrganizerMetrics>

  /**
   * Get revenue trend data for chart
   */
  async getRevenueTrend(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<Array<{
    date: string
    totalRevenue: number
    platformFeeRevenue: number
    subscriptionRevenue: number
  }>>

  /**
   * Get MRR trend
   */
  async getMRRTrend(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    month: string
    mrr: number
    newMRR: number
    expansionMRR: number
    contractionMRR: number
    churnedMRR: number
  }>>

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(
    startMonth: string,
    endMonth: string
  ): Promise<CohortAnalysis>

  /**
   * Calculate Customer Lifetime Value (CLV)
   */
  async calculateCLV(
    tier?: SubscriptionTier
  ): Promise<{
    averageCLV: number
    averageTenure: number
    averageRevenuePerMonth: number
  }>

  /**
   * Forecast revenue (simple linear regression)
   */
  async forecastRevenue(
    monthsAhead: number
  ): Promise<Array<{
    month: string
    forecastedRevenue: number
    confidence: number // 0-1
  }>>

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<{
    revenue: RevenueMetrics
    subscriptions: SubscriptionMetrics
    organizers: OrganizerMetrics
    alerts: Array<{
      type: 'warning' | 'info' | 'success'
      message: string
    }>
  }>
}
```

### Database Views (For Performance)

**View:** `vw_revenue_daily`

```sql
CREATE MATERIALIZED VIEW vw_revenue_daily AS
SELECT
  DATE(transaction_date) as date,
  COUNT(*) as transaction_count,
  SUM(gross_amount) as gross_revenue,
  SUM(platform_revenue) as platform_fee_revenue,
  SUM(organizer_revenue) as organizer_revenue,
  SUM(processing_fee) as processing_fees,
  SUM(tax_amount) as tax_collected
FROM revenue_transactions
WHERE status != 'REVERSED'
GROUP BY DATE(transaction_date)
ORDER BY date DESC;

CREATE UNIQUE INDEX ON vw_revenue_daily (date);

-- Refresh daily at midnight
CREATE OR REPLACE FUNCTION refresh_revenue_daily()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vw_revenue_daily;
END;
$$ LANGUAGE plpgsql;
```

**View:** `vw_mrr_monthly`

```sql
CREATE MATERIALIZED VIEW vw_mrr_monthly AS
SELECT
  DATE_TRUNC('month', s.created_at) as month,
  COUNT(*) FILTER (WHERE s.status = 'ACTIVE') as active_subscriptions,
  COUNT(*) FILTER (WHERE s.created_at >= DATE_TRUNC('month', s.created_at)) as new_subscriptions,
  COUNT(*) FILTER (WHERE s.canceled_at >= DATE_TRUNC('month', s.canceled_at)) as canceled_subscriptions,

  -- MRR calculation
  SUM(
    CASE s.tier
      WHEN 'BASIC' THEN 10.00
      WHEN 'PRO' THEN 50.00
      WHEN 'ENTERPRISE' THEN 200.00 -- Estimate
      ELSE 0
    END
  ) FILTER (WHERE s.status = 'ACTIVE') as mrr,

  -- Churn rate
  ROUND(
    COUNT(*) FILTER (WHERE s.canceled_at >= DATE_TRUNC('month', s.canceled_at))::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE s.status = 'ACTIVE'), 0) * 100,
    2
  ) as churn_rate

FROM subscriptions s
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY month DESC;

CREATE UNIQUE INDEX ON vw_mrr_monthly (month);
```

**View:** `vw_top_organizers`

```sql
CREATE MATERIALIZED VIEW vw_top_organizers AS
SELECT
  rt.organizer_id,
  u.name as organizer_name,
  COUNT(DISTINCT rt.event_id) as event_count,
  COUNT(DISTINCT rt.order_id) as order_count,
  SUM(rt.organizer_revenue) as total_revenue,
  SUM(rt.platform_revenue) as platform_fee_paid,
  s.tier as subscription_tier,
  MAX(rt.transaction_date) as last_transaction_date
FROM revenue_transactions rt
JOIN users u ON rt.organizer_id = u.id
LEFT JOIN subscriptions s ON rt.organizer_id = s.user_id AND s.status = 'ACTIVE'
WHERE rt.status != 'REVERSED'
  AND rt.transaction_date >= NOW() - INTERVAL '12 months'
GROUP BY rt.organizer_id, u.name, s.tier
ORDER BY total_revenue DESC
LIMIT 100;

CREATE UNIQUE INDEX ON vw_top_organizers (organizer_id);
```

### API Endpoints

**GET /api/admin/analytics/dashboard**
```typescript
// Get dashboard summary
Query: {
  startDate?: string // Default: 30 days ago
  endDate?: string // Default: today
}

Response: {
  revenue: {
    totalRevenue: number
    platformFeeRevenue: number
    subscriptionRevenue: number
    revenueGrowthMoM: number
    averageOrderValue: number
  }
  subscriptions: {
    activeSubscriptions: number
    mrr: number
    arr: number
    churnRate: number
    trialConversionRate: number
  }
  organizers: {
    totalOrganizers: number
    activeOrganizers: number
    newOrganizers: number
    lifetimeValue: number
  }
  alerts: Array<{
    type: string
    message: string
  }>
}
```

**GET /api/admin/analytics/revenue-trend**
```typescript
// Get revenue trend data
Query: {
  startDate: string
  endDate: string
  groupBy: 'day' | 'week' | 'month'
}

Response: {
  data: Array<{
    date: string
    totalRevenue: number
    platformFeeRevenue: number
    subscriptionRevenue: number
  }>
}
```

**GET /api/admin/analytics/mrr-trend**
```typescript
// Get MRR trend
Query: {
  months: number // Last N months
}

Response: {
  data: Array<{
    month: string
    mrr: number
    newMRR: number
    expansionMRR: number
    contractionMRR: number
    churnedMRR: number
    netMRR: number
  }>
}
```

**GET /api/admin/analytics/subscription-breakdown**
```typescript
// Get subscription tier breakdown
Response: {
  byTier: {
    FREE: number
    BASIC: number
    PRO: number
    ENTERPRISE: number
  }
  total: number
  distribution: {
    FREE: number // Percentage
    BASIC: number
    PRO: number
    ENTERPRISE: number
  }
}
```

**GET /api/admin/analytics/top-organizers**
```typescript
// Get top organizers by revenue
Query: {
  limit: number // Default: 10
  period: 'month' | 'quarter' | 'year' | 'all-time'
}

Response: {
  organizers: Array<{
    organizerId: string
    name: string
    revenue: number
    eventCount: number
    subscriptionTier: SubscriptionTier
    lifetimeValue: number
  }>
}
```

**GET /api/admin/analytics/cohort-analysis**
```typescript
// Get cohort retention analysis
Query: {
  startMonth: string // "2024-01"
  months: number // Number of months to analyze
}

Response: {
  cohorts: Array<{
    cohortMonth: string
    subscribersAtStart: number
    retentionByMonth: Record<number, number>
  }>
}
```

**GET /api/admin/analytics/forecast**
```typescript
// Get revenue forecast
Query: {
  monthsAhead: number // Default: 6
}

Response: {
  forecast: Array<{
    month: string
    forecastedRevenue: number
    confidence: number
  }>
  model: {
    type: string // "linear_regression"
    accuracy: number
  }
}
```

## UI/UX Specifications

### Analytics Dashboard

```tsx
<AnalyticsDashboard>
  {/* Key Metrics Cards */}
  <MetricsGrid>
    <MetricCard>
      <Label>Total Revenue</Label>
      <Value>$125,430</Value>
      <Change positive>+12.5% from last month</Change>
    </MetricCard>

    <MetricCard>
      <Label>MRR</Label>
      <Value>$15,200</Value>
      <Change positive>+5.2%</Change>
    </MetricCard>

    <MetricCard>
      <Label>Active Subscriptions</Label>
      <Value>342</Value>
      <Change positive>+18</Change>
    </MetricCard>

    <MetricCard>
      <Label>Churn Rate</Label>
      <Value>3.2%</Value>
      <Change negative>+0.5%</Change>
      <Alert>Above target (3%)</Alert>
    </MetricCard>
  </MetricsGrid>

  {/* Revenue Trend Chart */}
  <ChartCard title="Revenue Trend">
    <TimeRangePicker
      options={['7d', '30d', '90d', '1y']}
      selected="30d"
    />
    <LineChart
      data={revenueTrend}
      lines={[
        { key: 'totalRevenue', label: 'Total Revenue', color: 'blue' },
        { key: 'platformFeeRevenue', label: 'Platform Fees', color: 'green' },
        { key: 'subscriptionRevenue', label: 'Subscriptions', color: 'purple' }
      ]}
    />
  </ChartCard>

  {/* MRR Breakdown */}
  <ChartCard title="MRR Movement">
    <BarChart
      data={mrrTrend}
      stacked
      bars={[
        { key: 'newMRR', label: 'New MRR', color: 'green' },
        { key: 'expansionMRR', label: 'Expansion', color: 'lightgreen' },
        { key: 'contractionMRR', label: 'Contraction', color: 'orange' },
        { key: 'churnedMRR', label: 'Churned', color: 'red' }
      ]}
    />
  </ChartCard>

  {/* Subscription Tier Distribution */}
  <ChartCard title="Subscription Distribution">
    <PieChart
      data={subscriptionBreakdown}
      segments={[
        { key: 'FREE', label: 'Free', value: 1250, color: 'gray' },
        { key: 'BASIC', label: 'Basic', value: 180, color: 'blue' },
        { key: 'PRO', label: 'Pro', value: 142, color: 'purple' },
        { key: 'ENTERPRISE', label: 'Enterprise', value: 20, color: 'gold' }
      ]}
    />
  </ChartCard>

  {/* Top Organizers Table */}
  <TableCard title="Top Organizers">
    <Table>
      <thead>
        <tr>
          <th>Organizer</th>
          <th>Events</th>
          <th>Revenue</th>
          <th>Tier</th>
          <th>LTV</th>
        </tr>
      </thead>
      <tbody>
        {topOrganizers.map(org => (
          <tr key={org.id}>
            <td><Link to={`/organizers/${org.id}`}>{org.name}</Link></td>
            <td>{org.eventCount}</td>
            <td>${org.revenue.toLocaleString()}</td>
            <td><Badge tier={org.tier}>{org.tier}</Badge></td>
            <td>${org.lifetimeValue.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </TableCard>

  {/* Cohort Analysis Heatmap */}
  <ChartCard title="Cohort Retention Analysis">
    <CohortHeatmap data={cohortAnalysis} />
    <Legend>
      <span>0% ⬜</span>
      <span>50% 🟦</span>
      <span>100% 🟩</span>
    </Legend>
  </ChartCard>
</AnalyticsDashboard>
```

### Revenue Forecast Chart

```tsx
<ForecastChart>
  <LineChart
    data={historicalAndForecast}
    lines={[
      {
        key: 'actual',
        label: 'Actual Revenue',
        color: 'blue',
        style: 'solid'
      },
      {
        key: 'forecast',
        label: 'Forecasted Revenue',
        color: 'blue',
        style: 'dashed',
        confidenceInterval: true
      }
    ]}
  />
  <Note>
    Forecast based on linear regression of last 12 months.
    Confidence interval: 80%
  </Note>
</ForecastChart>
```

### Alerts Section

```tsx
<AlertsSection>
  <Alert type="warning">
    <Icon>⚠️</Icon>
    <Message>
      Churn rate increased to 3.2% (target: 3.0%)
    </Message>
    <Action onClick={() => navigate('/analytics/churn')}>
      Investigate
    </Action>
  </Alert>

  <Alert type="info">
    <Icon>ℹ️</Icon>
    <Message>
      Trial conversion rate is 78% this month (+5% from average)
    </Message>
  </Alert>

  <Alert type="success">
    <Icon>✓</Icon>
    <Message>
      MRR grew by 5.2% last month, on track for 60% annual growth
    </Message>
  </Alert>
</AlertsSection>
```

## Metrics Calculation Methods

### Monthly Recurring Revenue (MRR)
```typescript
MRR = Σ(active_subscriptions) * monthly_price

// Example:
// 180 Basic subscriptions * $10 = $1,800
// 142 Pro subscriptions * $50 = $7,100
// 20 Enterprise subscriptions * $200 = $4,000
// Total MRR = $12,900
```

### Annual Recurring Revenue (ARR)
```typescript
ARR = MRR * 12
```

### Churn Rate
```typescript
Churn Rate = (canceled_subscriptions / total_active_subscriptions_at_start) * 100

// Example: 10 cancellations / 342 active = 2.92% monthly churn
```

### Customer Lifetime Value (CLV)
```typescript
CLV = (Average Revenue Per User * Gross Margin) / Churn Rate

// Example:
// ARPU = $35/month (blended average across tiers)
// Gross Margin = 80%
// Churn Rate = 3% monthly
// CLV = ($35 * 0.80) / 0.03 = $933
```

### MRR Movement
```typescript
Net New MRR = New MRR + Expansion MRR - Contraction MRR - Churned MRR

// Example:
// New MRR (new subscriptions): +$500
// Expansion MRR (upgrades): +$300
// Contraction MRR (downgrades): -$100
// Churned MRR (cancellations): -$200
// Net New MRR = $500
```

## Integration Points

### 1. Revenue Distribution System (BILL-003)
- Query revenue transactions for metrics
- Aggregate platform fees and organizer revenue
- Calculate net revenue after refunds

### 2. Subscription Billing (BILL-002)
- Query subscription data for MRR/ARR
- Track subscription lifecycle events
- Calculate churn and retention

### 3. Admin Dashboard
- Embed analytics dashboard
- Show key metrics on main admin page
- Link to detailed analytics pages

### 4. Email Reports
- Daily revenue summary to admins
- Weekly MRR report
- Monthly executive summary
- Alerts for unusual patterns

## Business Intelligence Tools

### Export Integrations
- **Tableau:** Connect to PostgreSQL views for deeper analysis
- **Google Sheets:** Schedule CSV exports for stakeholder reports
- **Metabase:** Open-source BI tool for custom dashboards
- **Looker:** Enterprise BI integration (future)

## Testing Requirements

### Unit Tests
- MRR calculation accuracy
- Churn rate calculation
- CLV calculation
- Forecast algorithm accuracy

### Integration Tests
- Dashboard data accuracy vs raw data
- Materialized view refresh
- API endpoint performance
- Chart data generation

### Performance Tests
- Dashboard load time < 2 seconds
- Complex queries < 5 seconds
- Materialized view refresh < 1 minute
- API response times < 1 second

## Performance Optimization

### Caching Strategy
- Dashboard summary: Cache for 5 minutes
- Revenue trends: Cache for 15 minutes
- Top organizers: Cache for 1 hour
- Cohort analysis: Cache for 24 hours

### Query Optimization
- Use materialized views for expensive aggregations
- Refresh views nightly for daily metrics
- Index all date and foreign key columns
- Partition large tables by date

## Security Considerations

- Admin-only access to analytics dashboard
- Audit log for analytics queries
- No PII exposure in aggregate metrics
- Rate limit analytics API endpoints

## Monitoring & Alerts

### System Alerts
- Materialized view refresh failures
- Slow query performance (> 5 seconds)
- API endpoint errors
- Cache misses > 20%

### Business Alerts
- MRR decline > 5%
- Churn rate > 5%
- Revenue decline > 10%
- Trial conversion rate < 60%

## Documentation Requirements

- [ ] Analytics dashboard user guide
- [ ] Metrics definitions glossary
- [ ] API documentation
- [ ] Data model documentation
- [ ] Export integration guides

## Dependencies

- BILL-001: Flat-Fee Transaction Billing
- BILL-002: White-Label Subscription Billing
- BILL-003: Revenue Distribution System
- Chart library (Recharts or Chart.js)
- Date library (date-fns)

## Definition of Done

- [ ] Analytics service implemented
- [ ] Database views created and optimized
- [ ] All API endpoints deployed
- [ ] Dashboard UI complete with charts
- [ ] Metrics calculations accurate and tested
- [ ] Caching strategy implemented
- [ ] Performance optimizations complete
- [ ] All tests passing
- [ ] Documentation published
- [ ] Monitoring configured
- [ ] Admin training completed

## Notes

**Real-Time vs Batch:** Use materialized views for historical data (refreshed nightly) and real-time queries for current day metrics.

**Forecasting:** Start with simple linear regression. Consider more advanced models (ARIMA, Prophet) as data grows.

**Cohort Analysis:** Essential for understanding subscriber behavior over time. Helps identify successful acquisition channels and retention strategies.

**Alerts:** Configure intelligent alerts that consider seasonality and trends, not just absolute thresholds.

**Privacy:** Aggregate metrics only. Never expose individual customer data without proper access controls.