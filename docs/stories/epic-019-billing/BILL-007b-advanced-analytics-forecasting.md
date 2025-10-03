# BILL-007b: Advanced Analytics & Forecasting

**Parent Story:** BILL-007 - Billing Analytics Dashboard
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 2
**Priority:** Low
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** advanced analytics (CLV, cohorts, forecasting)
**So that** I can predict future revenue and optimize customer retention

## Acceptance Criteria

### AC1: Customer Lifetime Value (CLV) Calculation
- [ ] **CLV formula:** (Average monthly revenue per customer * Gross margin) / Churn rate
  - Example: ($29 * 0.80) / 0.05 = $464 CLV
- [ ] **CLV by tier:**
  - Pro tier CLV
  - Enterprise tier CLV
  - Comparison chart showing relative value
- [ ] **CLV trend:**
  - Track CLV changes over time
  - Alert if CLV declining
- [ ] **Payback period:**
  - Time to recover customer acquisition cost
  - Formula: CAC / Average monthly revenue
  - Display: "Payback in 3.5 months"

### AC2: Cohort Retention Analysis
- [ ] **Cohort definition:** Group users by signup month
- [ ] **Retention table:**
  - Rows: Cohorts (Jan 2025, Feb 2025, etc.)
  - Columns: Months since signup (Month 0, 1, 2, ... 12)
  - Cells: Retention percentage (e.g., 85% retained after 3 months)
- [ ] **Retention chart:**
  - Line chart with one line per cohort
  - Shows retention curve over 12 months
  - Highlights best/worst performing cohorts
- [ ] **Cohort insights:**
  - Average retention rate across all cohorts
  - Cohorts with >90% retention (green)
  - Cohorts with <50% retention (red, needs attention)

### AC3: Revenue Forecasting
- [ ] **Linear regression model:**
  - Predict next 6 months of MRR based on historical data
  - Uses last 12 months of data for training
  - Displays confidence interval (±10%)
- [ ] **Forecast chart:**
  - Line chart showing:
    - Historical MRR (solid line)
    - Forecasted MRR (dashed line)
    - Confidence band (shaded area)
- [ ] **Scenario modeling:**
  - Optimistic scenario: +20% growth rate
  - Expected scenario: Current growth rate
  - Pessimistic scenario: -10% growth rate
- [ ] **Forecast accuracy:**
  - Compare previous forecasts to actual results
  - Display MAPE (Mean Absolute Percentage Error)
  - Show: "Forecast accuracy: 92%"

### AC4: Financial Report Export
- [ ] **Monthly financial report (PDF):**
  - Cover page: Company logo, date range
  - Executive summary: Key metrics (MRR, ARR, churn, growth)
  - Charts: MRR trend, subscriber growth, revenue breakdown
  - Tables: Top 10 customers by revenue, churn analysis
  - Appendix: Detailed transaction log
- [ ] **CSV export:**
  - All raw data for custom analysis
  - Columns: Date, Metric, Value, Tier
  - Filename: `financial_report_2025-01.csv`
- [ ] **QuickBooks integration:**
  - Export revenue data to QuickBooks format
  - Maps platform accounts to QuickBooks chart of accounts
  - Includes: Revenue, expenses, net income
- [ ] **Scheduled reports:**
  - Auto-generate monthly report on 1st of month
  - Email to finance team
  - Upload to secure S3 bucket

### AC5: Dashboard Summary View
- [ ] **Top-level metrics (big numbers):**
  - MRR: $15,450 (+12%)
  - ARR: $185,400
  - Active subscribers: 532 (+25 this month)
  - Churn rate: 3.2% (below target)
  - CLV: $485
- [ ] **Quick insights:**
  - "Your MRR grew 12% last month. Keep it up!"
  - "3 Enterprise customers at risk of churn."
  - "Forecasted MRR for next month: $17,200"
- [ ] **Action items:**
  - "Reach out to high-churn cohort from Oct 2024"
  - "5 trials ending this week—send upgrade reminders"

## Technical Implementation

**File:** `/lib/services/forecasting.service.ts`
```typescript
import * as tf from '@tensorflow/tfjs';
import SimpleLinearRegression from 'ml-regression-simple-linear';

export class ForecastingService {
  /**
   * Forecast MRR for next N months using linear regression
   */
  async forecastMRR(months: number = 6): Promise<ForecastResult> {
    // Get historical MRR data
    const historical = await billingAnalyticsService.getMRRTrend(12);

    // Prepare data for regression
    const X = historical.map((_, i) => i); // Month index
    const Y = historical.map((d) => d.mrr); // MRR values

    // Train simple linear regression model
    const regression = new SimpleLinearRegression(X, Y);

    // Generate forecast
    const forecast: ForecastData[] = [];
    const lastMonthIndex = X.length - 1;

    for (let i = 1; i <= months; i++) {
      const monthIndex = lastMonthIndex + i;
      const predictedMRR = regression.predict(monthIndex);

      // Calculate confidence interval (±10%)
      const confidenceLower = predictedMRR * 0.9;
      const confidenceUpper = predictedMRR * 1.1;

      forecast.push({
        month: format(addMonths(new Date(), i), 'MMM yyyy'),
        predictedMRR,
        confidenceLower,
        confidenceUpper,
      });
    }

    return {
      forecast,
      slope: regression.slope, // Growth rate
      intercept: regression.intercept,
      r2: regression.score(X, Y), // Model accuracy
    };
  }

  /**
   * Calculate Customer Lifetime Value (CLV)
   */
  async calculateCLV(tier: string): Promise<number> {
    const plan = PLANS.find((p) => p.id === tier);
    if (!plan) return 0;

    // Get average monthly revenue for this tier
    const avgMonthlyRevenue = plan.price;

    // Get gross margin (assume 80%)
    const grossMargin = 0.80;

    // Get churn rate for this tier
    const churnRate = await this.getChurnRateByTier(tier);

    // CLV formula
    const clv = (avgMonthlyRevenue * grossMargin) / churnRate;

    return clv;
  }

  /**
   * Generate cohort retention analysis
   */
  async getCohortRetention(): Promise<CohortData[]> {
    const cohorts: CohortData[] = [];

    // Get cohorts from last 12 months
    for (let i = 11; i >= 0; i--) {
      const cohortMonth = subMonths(new Date(), i);
      const cohortStart = startOfMonth(cohortMonth);
      const cohortEnd = endOfMonth(cohortMonth);

      // Get users who signed up in this cohort
      const cohortUsers = await prisma.user.findMany({
        where: {
          createdAt: { gte: cohortStart, lte: cohortEnd },
        },
        select: { id: true },
      });

      const cohortSize = cohortUsers.length;

      // Calculate retention for each subsequent month
      const retention: number[] = [100]; // Month 0 is always 100%

      for (let month = 1; month <= 12; month++) {
        const retentionDate = addMonths(cohortEnd, month);

        // Count how many are still active
        const activeCount = await prisma.subscription.count({
          where: {
            userId: { in: cohortUsers.map((u) => u.id) },
            status: 'active',
            createdAt: { lte: retentionDate },
          },
        });

        const retentionPercent = (activeCount / cohortSize) * 100;
        retention.push(retentionPercent);
      }

      cohorts.push({
        cohortMonth: format(cohortMonth, 'MMM yyyy'),
        cohortSize,
        retention,
      });
    }

    return cohorts;
  }

  /**
   * Export financial report as PDF
   */
  async exportFinancialReport(startDate: Date, endDate: Date): Promise<Buffer> {
    const data = await this.gatherReportData(startDate, endDate);

    // Generate PDF using pdfkit or puppeteer
    const pdf = await this.generatePDF(data);

    return pdf;
  }

  private async gatherReportData(startDate: Date, endDate: Date) {
    const [mrr, arr, churn, growth] = await Promise.all([
      billingAnalyticsService.calculateMRR(endDate),
      billingAnalyticsService.calculateARR(endDate),
      billingAnalyticsService.calculateChurnRate(startDate, endDate),
      billingAnalyticsService.getSubscriberGrowth(12),
    ]);

    return { mrr, arr, churn, growth };
  }
}
```

**File:** `/components/billing/analytics/ForecastChart.tsx`
```typescript
export function ForecastChart() {
  const { data } = useSWR('/api/billing/analytics/forecast', fetcher);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Revenue Forecast (6 Months)</h3>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data?.combined}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip />
          <Legend />

          {/* Historical MRR */}
          <Line
            type="monotone"
            dataKey="actualMRR"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Actual MRR"
          />

          {/* Forecasted MRR */}
          <Line
            type="monotone"
            dataKey="forecastedMRR"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Forecasted MRR"
          />

          {/* Confidence band */}
          <Area
            type="monotone"
            dataKey="confidenceBand"
            fill="#3b82f6"
            fillOpacity={0.2}
            stroke="none"
            name="Confidence Interval"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <MetricCard
          label="Forecasted MRR (6 months)"
          value={formatCurrency(data?.forecast[5]?.predictedMRR)}
        />
        <MetricCard
          label="Growth Rate"
          value={`${data?.growthRate?.toFixed(1)}%`}
          color="green"
        />
        <MetricCard
          label="Model Accuracy"
          value={`${(data?.accuracy * 100)?.toFixed(0)}%`}
        />
      </div>
    </div>
  );
}
```

## Testing Requirements

```typescript
describe('ForecastingService', () => {
  it('forecasts MRR using linear regression', async () => {
    const forecast = await forecastingService.forecastMRR(6);
    expect(forecast.forecast).toHaveLength(6);
    expect(forecast.forecast[0].predictedMRR).toBeGreaterThan(0);
  });

  it('calculates CLV correctly', async () => {
    const clv = await forecastingService.calculateCLV('pro');
    // $29 * 0.80 / 0.05 = $464
    expect(clv).toBeCloseTo(464, 0);
  });

  it('generates cohort retention table', async () => {
    const cohorts = await forecastingService.getCohortRetention();
    expect(cohorts.length).toBeGreaterThan(0);
    expect(cohorts[0].retention[0]).toBe(100); // Month 0 always 100%
  });
});
```

## Dependencies

- [ ] TensorFlow.js for machine learning (forecasting)
- [ ] ml-regression for linear regression
- [ ] pdfkit or puppeteer for PDF generation
- [ ] Chart.js or Recharts for visualizations

## Performance Requirements

- [ ] Forecast calculation: < 2 seconds
- [ ] Cohort analysis: < 3 seconds for 12 cohorts
- [ ] PDF generation: < 5 seconds
- [ ] Dashboard load: < 3 seconds (all metrics)

## Definition of Done

- [ ] CLV calculation working
- [ ] Cohort retention analysis complete
- [ ] Revenue forecasting accurate
- [ ] Financial reports exportable
- [ ] Dashboard summary view implemented
- [ ] Unit tests pass (>80% coverage)
- [ ] Code reviewed and approved