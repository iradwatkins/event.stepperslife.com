# BILL-007a: Core Metrics (MRR, ARR, Churn)

**Parent Story:** BILL-007 - Billing Analytics Dashboard
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 3
**Priority:** Medium
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** to track key subscription metrics (MRR, ARR, churn rate)
**So that** I can monitor business health and make data-driven decisions

## Acceptance Criteria

### AC1: Monthly Recurring Revenue (MRR) Calculation
- [ ] **MRR formula:** Sum of all active subscriptions' monthly values
  - Monthly plans: Use monthly price directly
  - Annual plans: Divide annual price by 12
  - Example: 10 Pro users ($29/mo) + 3 Enterprise ($99/mo) = $587 MRR
- [ ] **MRR breakdown by tier:**
  - Free tier: $0 MRR
  - Pro tier: Count * $29
  - Enterprise tier: Count * $99
- [ ] **MRR trend chart:**
  - Line chart showing MRR over last 12 months
  - Month-over-month growth percentage
  - Annotations for key events (new tier launch, price changes)
- [ ] **New MRR vs Churned MRR:**
  - Green: New MRR from new subscriptions
  - Red: Churned MRR from cancellations
  - Net MRR growth = New - Churned

### AC2: Annual Recurring Revenue (ARR) Calculation
- [ ] **ARR formula:** MRR * 12
- [ ] **ARR projection:**
  - Based on current MRR
  - Assumes churn rate remains constant
  - Shows: "Projected ARR: $150,000 (at current growth rate)"
- [ ] **ARR by customer segment:**
  - New customers (< 3 months)
  - Established customers (3-12 months)
  - Long-term customers (12+ months)
- [ ] **ARR chart:**
  - Bar chart comparing ARR year-over-year
  - Growth rate badge: "+45% YoY"

### AC3: Churn Rate Calculation
- [ ] **Customer churn formula:** (Customers lost / Total customers at start) * 100
- [ ] **Revenue churn formula:** (MRR lost / MRR at start) * 100
- [ ] **Time periods:**
  - Monthly churn rate
  - Quarterly churn rate
  - Annual churn rate
- [ ] **Churn breakdown:**
  - Voluntary churn: User-initiated cancellations
  - Involuntary churn: Failed payments
  - By tier: Free → Pro churn, Pro → Free churn, Enterprise churn
- [ ] **Churn trend chart:**
  - Line chart showing churn rate over 12 months
  - Target churn rate line (e.g., 5% monthly)
  - Alert if churn exceeds threshold

### AC4: Subscriber Growth Metrics
- [ ] **Total active subscribers:**
  - Count by tier (Free, Pro, Enterprise)
  - Pie chart showing distribution
- [ ] **New subscribers:**
  - Count of new signups per month
  - Conversion rate: Trial → Paid
  - Activation rate: Signup → First event created
- [ ] **Subscriber growth chart:**
  - Stacked area chart showing cumulative subscribers
  - Layers: Free (bottom), Pro (middle), Enterprise (top)
- [ ] **Net subscriber change:**
  - Formula: New subscribers - Churned subscribers
  - Month-over-month comparison

### AC5: Revenue Trend Analysis
- [ ] **Revenue by source:**
  - Subscription revenue (MRR)
  - Transaction fees (per-ticket fees)
  - One-time charges (setup fees, etc.)
- [ ] **Revenue trend chart:**
  - Dual-axis line chart:
    - Left axis: Total revenue ($)
    - Right axis: Number of transactions
  - Stacked bars: Subscription vs Transaction revenue
- [ ] **Key metrics summary:**
  - Average Revenue Per User (ARPU): Total revenue / Active subscribers
  - Revenue per transaction: Transaction fees / Number of orders
  - Gross margin: (Revenue - Costs) / Revenue

## Technical Implementation

**File:** `/lib/services/billing-analytics.service.ts`
```typescript
export class BillingAnalyticsService {
  /**
   * Calculate Monthly Recurring Revenue (MRR)
   */
  async calculateMRR(date: Date = new Date()): Promise<MRRResult> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: { lte: date },
      },
    });

    let totalMRR = 0;
    const breakdown: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };

    subscriptions.forEach((sub) => {
      const monthlyValue = this.getMonthlyValue(sub);
      totalMRR += monthlyValue;
      breakdown[sub.tier] += monthlyValue;
    });

    // Calculate MRR growth
    const lastMonthMRR = await this.calculateMRR(subMonths(date, 1));
    const mrrGrowth = totalMRR - lastMonthMRR.totalMRR;
    const mrrGrowthPercent = (mrrGrowth / lastMonthMRR.totalMRR) * 100;

    return {
      totalMRR,
      breakdown,
      mrrGrowth,
      mrrGrowthPercent,
      date,
    };
  }

  /**
   * Calculate Annual Recurring Revenue (ARR)
   */
  async calculateARR(date: Date = new Date()): Promise<number> {
    const mrr = await this.calculateMRR(date);
    return mrr.totalMRR * 12;
  }

  /**
   * Calculate churn rate for a given period
   */
  async calculateChurnRate(
    startDate: Date,
    endDate: Date
  ): Promise<ChurnResult> {
    // Get subscribers at start of period
    const subscribersAtStart = await prisma.subscription.count({
      where: {
        status: 'active',
        createdAt: { lte: startDate },
      },
    });

    // Get MRR at start of period
    const mrrAtStart = await this.calculateMRR(startDate);

    // Get churned subscribers (canceled during period)
    const churnedSubscribers = await prisma.subscription.count({
      where: {
        status: 'canceled',
        canceledAt: { gte: startDate, lte: endDate },
      },
    });

    // Calculate MRR lost from churned subscribers
    const churnedSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'canceled',
        canceledAt: { gte: startDate, lte: endDate },
      },
    });

    const mrrLost = churnedSubscriptions.reduce((sum, sub) => {
      return sum + this.getMonthlyValue(sub);
    }, 0);

    // Calculate churn rates
    const customerChurnRate = (churnedSubscribers / subscribersAtStart) * 100;
    const revenueChurnRate = (mrrLost / mrrAtStart.totalMRR) * 100;

    return {
      customerChurnRate,
      revenueChurnRate,
      churnedSubscribers,
      mrrLost,
      period: { start: startDate, end: endDate },
    };
  }

  /**
   * Get subscriber growth over time
   */
  async getSubscriberGrowth(months: number = 12): Promise<GrowthData[]> {
    const data: GrowthData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const startOfMonth = startOfMonth(date);
      const endOfMonth = endOfMonth(date);

      const subscribersByTier = await prisma.subscription.groupBy({
        by: ['tier'],
        where: {
          status: 'active',
          createdAt: { lte: endOfMonth },
        },
        _count: true,
      });

      data.push({
        month: format(date, 'MMM yyyy'),
        free: subscribersByTier.find((s) => s.tier === 'free')?._count || 0,
        pro: subscribersByTier.find((s) => s.tier === 'pro')?._count || 0,
        enterprise: subscribersByTier.find((s) => s.tier === 'enterprise')?._count || 0,
      });
    }

    return data;
  }

  /**
   * Get MRR trend over time
   */
  async getMRRTrend(months: number = 12): Promise<MRRTrendData[]> {
    const data: MRRTrendData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const mrr = await this.calculateMRR(endOfMonth(date));

      data.push({
        month: format(date, 'MMM yyyy'),
        mrr: mrr.totalMRR,
        growth: mrr.mrrGrowthPercent,
      });
    }

    return data;
  }

  /**
   * Helper: Get monthly value of a subscription
   */
  private getMonthlyValue(subscription: Subscription): number {
    const plan = PLANS.find((p) => p.id === subscription.tier);
    if (!plan) return 0;

    return subscription.billingCycle === 'annual'
      ? plan.annualPrice / 12
      : plan.price;
  }
}

export const billingAnalyticsService = new BillingAnalyticsService();
```

**File:** `/components/billing/analytics/MRRChart.tsx`
```typescript
export function MRRChart() {
  const { data } = useSWR('/api/billing/analytics/mrr-trend', fetcher);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Monthly Recurring Revenue</h3>
        <Badge variant="success">+{data?.latestGrowth}%</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Current MRR"
          value={formatCurrency(data?.currentMRR)}
          trend={data?.mrrGrowthPercent}
        />
        <MetricCard
          label="New MRR"
          value={formatCurrency(data?.newMRR)}
          color="green"
        />
        <MetricCard
          label="Churned MRR"
          value={formatCurrency(data?.churnedMRR)}
          color="red"
        />
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data?.trend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Line type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Testing Requirements

```typescript
describe('BillingAnalyticsService', () => {
  describe('calculateMRR', () => {
    it('calculates MRR correctly for monthly subscriptions', async () => {
      // Create 10 Pro subscriptions at $29/month
      const mrr = await billingAnalyticsService.calculateMRR();
      expect(mrr.totalMRR).toBe(290);
    });

    it('converts annual subscriptions to monthly value', async () => {
      // Create 1 annual Pro subscription at $278/year
      const mrr = await billingAnalyticsService.calculateMRR();
      expect(mrr.totalMRR).toBeCloseTo(23.17, 2); // $278 / 12
    });
  });

  describe('calculateChurnRate', () => {
    it('calculates customer churn rate correctly', async () => {
      // Start: 100 subscribers, End: 95 subscribers (5 churned)
      const churn = await billingAnalyticsService.calculateChurnRate(
        startOfMonth(new Date()),
        endOfMonth(new Date())
      );

      expect(churn.customerChurnRate).toBe(5); // 5%
    });

    it('calculates revenue churn separately from customer churn', async () => {
      // If high-value customers churn, revenue churn > customer churn
    });
  });
});
```

## API Endpoints

```typescript
// GET /api/billing/analytics/mrr
// Returns current MRR and breakdown

// GET /api/billing/analytics/mrr-trend?months=12
// Returns MRR trend over time

// GET /api/billing/analytics/churn?period=monthly
// Returns churn rate for specified period

// GET /api/billing/analytics/subscriber-growth?months=12
// Returns subscriber count over time
```

## Definition of Done

- [ ] MRR calculation accurate
- [ ] ARR derived from MRR
- [ ] Churn rate tracking working
- [ ] Subscriber growth metrics calculated
- [ ] Charts render correctly
- [ ] Unit tests pass (>85% coverage)
- [ ] API endpoints documented
- [ ] Code reviewed and approved