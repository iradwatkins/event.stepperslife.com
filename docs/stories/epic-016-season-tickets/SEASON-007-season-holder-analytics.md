# SEASON-007: Season Holder Analytics

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 5
**Priority:** Medium
**Status:** Not Started

---

## User Story

**As an** event organizer
**I want** comprehensive analytics on season pass holders and subscription performance
**So that** I can make data-driven decisions to improve retention, revenue, and member satisfaction

---

## Acceptance Criteria

### 1. Member Engagement Metrics
- [ ] Attendance rate per member (% of available events attended)
- [ ] Average events per member per month
- [ ] Event participation by tier (Basic vs Premium vs VIP)
- [ ] Check-in time distribution (early birds vs last minute)
- [ ] No-show rate tracking
- [ ] Benefit redemption rate
- [ ] Portal login frequency
- [ ] Member activity score (engagement index)

### 2. Revenue Analytics
- [ ] Monthly Recurring Revenue (MRR) tracking
- [ ] Annual Recurring Revenue (ARR) projection
- [ ] Revenue by tier breakdown
- [ ] Average Revenue Per User (ARPU)
- [ ] Customer Lifetime Value (LTV) calculation
- [ ] Revenue growth rate (MoM, YoY)
- [ ] Revenue retention rate
- [ ] Net Revenue Retention (NRR)

### 3. Churn Analysis
- [ ] Churn rate calculation (monthly, quarterly, annual)
- [ ] Churn by tier analysis
- [ ] Churn reason categorization
- [ ] Time-to-churn analytics
- [ ] At-risk member identification
- [ ] Reactivation success rate
- [ ] Involuntary churn (payment failures) tracking
- [ ] Voluntary churn tracking

### 4. Cohort Analysis
- [ ] Sign-up cohorts by season/month
- [ ] Cohort retention curves
- [ ] Cohort revenue analysis
- [ ] Cross-cohort comparison
- [ ] Cohort behavior patterns
- [ ] Cohort lifetime value
- [ ] Acquisition channel by cohort
- [ ] Seasonal cohort performance

### 5. Benefit Utilization Reports
- [ ] Most/least used benefits
- [ ] Benefit redemption by tier
- [ ] ROI per benefit (cost vs value)
- [ ] Benefit usage correlation with retention
- [ ] Discount benefit usage
- [ ] Early access benefit usage
- [ ] Guest benefit usage
- [ ] Benefit value delivered vs cost

### 6. Renewal Prediction Analytics
- [ ] Renewal probability scoring
- [ ] Behavioral indicators for renewal
- [ ] Payment history impact on renewal
- [ ] Engagement score impact on renewal
- [ ] At-risk renewal identification
- [ ] High-value renewal targets
- [ ] Renewal campaign effectiveness
- [ ] Early renewal incentive ROI

### 7. Dashboard & Reporting
- [ ] Executive summary dashboard
- [ ] Real-time KPI widgets
- [ ] Customizable report builder
- [ ] Scheduled email reports
- [ ] Exportable data (CSV, Excel, PDF)
- [ ] Date range filtering
- [ ] Tier comparison views
- [ ] Trend visualization (charts, graphs)

### 8. Testing & Quality
- [ ] Unit tests for analytics calculations (>85% coverage)
- [ ] Data accuracy validation
- [ ] Performance testing for large datasets
- [ ] Query optimization for dashboard load times
- [ ] Report generation testing
- [ ] Export functionality testing
- [ ] Real-time data sync verification
- [ ] Documentation complete

---

## Technical Specifications

### Database Schema Updates
```prisma
// prisma/schema.prisma

model AnalyticsSnapshot {
  id                String   @id @default(cuid())
  snapshotDate      DateTime
  metricType        String   // 'mrr', 'churn_rate', 'active_members', 'arpu'
  value             Float
  previousValue     Float?
  changePercentage  Float?
  tier              String?  // For tier-specific metrics
  metadata          Json?
  createdAt         DateTime @default(now())

  @@unique([snapshotDate, metricType, tier])
  @@index([snapshotDate, metricType])
}

model MemberEngagementScore {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  engagementScore     Float    // 0-100
  attendanceRate      Float
  benefitUsageRate    Float
  portalActivityRate  Float
  lastEventDate       DateTime?
  eventCount          Int      @default(0)
  benefitRedemptions  Int      @default(0)
  portalLogins        Int      @default(0)
  riskLevel           String   // 'low', 'medium', 'high'
  renewalProbability  Float    // 0-1
  calculatedAt        DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([engagementScore])
  @@index([riskLevel])
  @@index([renewalProbability])
}

model CohortAnalysis {
  id                String   @id @default(cuid())
  cohortName        String   // 'Jan 2025', 'Spring 2025'
  cohortStartDate   DateTime
  cohortEndDate     DateTime
  totalMembers      Int
  activeMembers     Int
  churnedMembers    Int
  retentionRate     Float
  totalRevenue      Float
  averageLTV        Float
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([cohortName, cohortStartDate])
  @@index([cohortStartDate])
}

model ChurnEvent {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  churnDate      DateTime
  churnType      String   // 'voluntary', 'involuntary'
  churnReason    String?  // 'too_expensive', 'not_using', 'payment_failed', 'moved_away'
  tier           String
  daysActive     Int
  totalRevenue   Float
  lastEventDate  DateTime?
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([churnDate])
  @@index([churnType])
  @@index([churnReason])
}

model RevenueMetric {
  id           String   @id @default(cuid())
  metricDate   DateTime
  mrr          Float    // Monthly Recurring Revenue
  arr          Float    // Annual Recurring Revenue
  arpu         Float    // Average Revenue Per User
  activeMembers Int
  newMembers   Int
  churnedMembers Int
  reactivatedMembers Int
  upgrades     Int
  downgrades   Int
  netRevenue   Float
  metadata     Json?
  createdAt    DateTime @default(now())

  @@unique([metricDate])
  @@index([metricDate])
}
```

### TypeScript Interfaces
```typescript
// types/analytics.types.ts

export interface EngagementMetrics {
  totalMembers: number;
  activeMembers: number;
  averageAttendanceRate: number;
  averageEventsPerMember: number;
  benefitRedemptionRate: number;
  portalLoginRate: number;
  engagementScore: number;
  byTier: {
    [tier: string]: {
      members: number;
      attendanceRate: number;
      engagementScore: number;
    };
  };
}

export interface RevenueMetrics {
  mrr: number;
  mrrGrowthRate: number;
  arr: number;
  arpu: number;
  ltv: number;
  totalRevenue: number;
  revenueByTier: {
    [tier: string]: number;
  };
  revenueRetentionRate: number;
  netRevenueRetention: number;
}

export interface ChurnMetrics {
  monthlyChurnRate: number;
  annualChurnRate: number;
  voluntaryChurn: number;
  involuntaryChurn: number;
  churnReasons: {
    [reason: string]: number;
  };
  averageTimeToChurn: number;
  atRiskMembers: number;
}

export interface CohortData {
  cohortName: string;
  startDate: Date;
  members: number;
  retentionByMonth: number[];
  revenueByMonth: number[];
  ltv: number;
}

export interface BenefitUtilization {
  benefitId: string;
  benefitName: string;
  totalRedemptions: number;
  redemptionRate: number;
  valueDelivered: number;
  estimatedCost: number;
  roi: number;
  byTier: {
    [tier: string]: {
      redemptions: number;
      rate: number;
    };
  };
}

export interface RenewalPrediction {
  userId: string;
  currentTier: string;
  renewalProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    engagementScore: number;
    attendanceRate: number;
    benefitUsage: number;
    paymentHistory: string;
  };
  recommendedAction: string;
}
```

### Analytics Service
```typescript
// lib/services/analytics.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  // Calculate engagement metrics
  async getEngagementMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<EngagementMetrics> {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodStart: { lte: endDate },
        currentPeriodEnd: { gte: startDate },
      },
      include: {
        tier: true,
        usage: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const totalMembers = activeSubscriptions.length;
    const activeMembers = activeSubscriptions.filter(
      (s) => s.usage.length > 0
    ).length;

    // Calculate attendance rates
    let totalAttendanceRate = 0;
    let totalEvents = 0;

    for (const sub of activeSubscriptions) {
      const availableEvents = await this.getAvailableEventsCount(
        sub.id,
        startDate,
        endDate
      );
      const attendedEvents = sub.usage.filter((u) => u.checkedIn).length;

      if (availableEvents > 0) {
        totalAttendanceRate += (attendedEvents / availableEvents) * 100;
        totalEvents += attendedEvents;
      }
    }

    const averageAttendanceRate = totalMembers > 0 ? totalAttendanceRate / totalMembers : 0;
    const averageEventsPerMember = totalMembers > 0 ? totalEvents / totalMembers : 0;

    // Calculate benefit redemption rate
    const totalBenefits = await prisma.benefitRedemption.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const benefitRedemptionRate = totalMembers > 0 ? totalBenefits / totalMembers : 0;

    // Calculate by tier
    const byTier: any = {};
    const tiers = [...new Set(activeSubscriptions.map((s) => s.tier?.name).filter(Boolean))];

    for (const tierName of tiers) {
      const tierSubs = activeSubscriptions.filter((s) => s.tier?.name === tierName);
      const tierMembers = tierSubs.length;

      let tierAttendanceRate = 0;
      for (const sub of tierSubs) {
        const availableEvents = await this.getAvailableEventsCount(sub.id, startDate, endDate);
        const attendedEvents = sub.usage.filter((u) => u.checkedIn).length;
        if (availableEvents > 0) {
          tierAttendanceRate += (attendedEvents / availableEvents) * 100;
        }
      }

      byTier[tierName] = {
        members: tierMembers,
        attendanceRate: tierMembers > 0 ? tierAttendanceRate / tierMembers : 0,
        engagementScore: 0, // TODO: Calculate
      };
    }

    return {
      totalMembers,
      activeMembers,
      averageAttendanceRate,
      averageEventsPerMember,
      benefitRedemptionRate,
      portalLoginRate: 0, // TODO: Track portal logins
      engagementScore: 0, // TODO: Calculate composite score
      byTier,
    };
  }

  // Calculate revenue metrics
  async getRevenueMetrics(date: Date = new Date()): Promise<RevenueMetrics> {
    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { gte: date },
      },
      include: { plan: true, tier: true },
    });

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const monthlyValue = this.normalizeToMonthly(
        sub.plan.price,
        sub.plan.billingInterval
      );
      mrr += monthlyValue;
    }

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;

    // Calculate LTV (Lifetime Value)
    const averageChurnRate = await this.calculateChurnRate(30); // 30-day churn
    const ltv = averageChurnRate > 0 ? arpu / averageChurnRate : arpu * 12;

    // Get total revenue
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { total: true },
    });

    // Revenue by tier
    const revenueByTier: any = {};
    for (const sub of activeSubscriptions) {
      const tierName = sub.tier?.name || 'Basic';
      const monthlyValue = this.normalizeToMonthly(
        sub.plan.price,
        sub.plan.billingInterval
      );
      revenueByTier[tierName] = (revenueByTier[tierName] || 0) + monthlyValue;
    }

    // Get previous month MRR for growth calculation
    const previousMonthDate = new Date(date);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousMetric = await prisma.revenueMetric.findFirst({
      where: {
        metricDate: {
          gte: new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), 1),
          lt: new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth() + 1, 1),
        },
      },
    });

    const mrrGrowthRate = previousMetric?.mrr
      ? ((mrr - previousMetric.mrr) / previousMetric.mrr) * 100
      : 0;

    return {
      mrr,
      mrrGrowthRate,
      arr,
      arpu,
      ltv,
      totalRevenue: totalRevenue._sum.total || 0,
      revenueByTier,
      revenueRetentionRate: 0, // TODO: Calculate
      netRevenueRetention: 0, // TODO: Calculate
    };
  }

  // Calculate churn metrics
  async getChurnMetrics(days: number = 30): Promise<ChurnMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get churned subscriptions
    const churnedSubs = await prisma.subscription.findMany({
      where: {
        status: 'cancelled',
        canceledAt: { gte: startDate },
      },
      include: { plan: true },
    });

    // Get active subscriptions at start of period
    const activeAtStart = await prisma.subscription.count({
      where: {
        createdAt: { lt: startDate },
        OR: [
          { canceledAt: null },
          { canceledAt: { gte: startDate } },
        ],
      },
    });

    // Calculate churn rate
    const monthlyChurnRate = activeAtStart > 0 ? (churnedSubs.length / activeAtStart) * 100 : 0;
    const annualChurnRate = monthlyChurnRate * 12;

    // Voluntary vs involuntary churn
    const churnEvents = await prisma.churnEvent.findMany({
      where: { churnDate: { gte: startDate } },
    });

    const voluntaryChurn = churnEvents.filter((e) => e.churnType === 'voluntary').length;
    const involuntaryChurn = churnEvents.filter((e) => e.churnType === 'involuntary').length;

    // Churn reasons
    const churnReasons: any = {};
    for (const event of churnEvents) {
      if (event.churnReason) {
        churnReasons[event.churnReason] = (churnReasons[event.churnReason] || 0) + 1;
      }
    }

    // Average time to churn
    const averageTimeToChurn =
      churnEvents.length > 0
        ? churnEvents.reduce((sum, e) => sum + e.daysActive, 0) / churnEvents.length
        : 0;

    // At-risk members
    const atRiskMembers = await prisma.memberEngagementScore.count({
      where: { riskLevel: 'high' },
    });

    return {
      monthlyChurnRate,
      annualChurnRate,
      voluntaryChurn,
      involuntaryChurn,
      churnReasons,
      averageTimeToChurn,
      atRiskMembers,
    };
  }

  // Generate cohort analysis
  async getCohortAnalysis(cohortStartDate: Date): Promise<CohortData> {
    const cohortEndDate = new Date(cohortStartDate);
    cohortEndDate.setMonth(cohortEndDate.getMonth() + 1);

    const cohortName = cohortStartDate.toLocaleString('default', {
      month: 'short',
      year: 'numeric',
    });

    // Get members who joined in this cohort
    const cohortMembers = await prisma.subscription.findMany({
      where: {
        createdAt: { gte: cohortStartDate, lt: cohortEndDate },
      },
    });

    const totalMembers = cohortMembers.length;

    // Calculate retention by month (up to 12 months)
    const retentionByMonth: number[] = [];
    const revenueByMonth: number[] = [];

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(cohortStartDate);
      monthDate.setMonth(monthDate.getMonth() + month);

      const activeInMonth = cohortMembers.filter((m) => {
        return (
          m.currentPeriodEnd >= monthDate &&
          (!m.canceledAt || m.canceledAt > monthDate)
        );
      }).length;

      const retentionRate = totalMembers > 0 ? (activeInMonth / totalMembers) * 100 : 0;
      retentionByMonth.push(retentionRate);

      // Calculate revenue for this month
      const monthRevenue = await this.getCohortRevenueForMonth(
        cohortMembers.map((m) => m.id),
        monthDate
      );
      revenueByMonth.push(monthRevenue);
    }

    // Calculate LTV
    const totalRevenue = revenueByMonth.reduce((sum, r) => sum + r, 0);
    const ltv = totalMembers > 0 ? totalRevenue / totalMembers : 0;

    return {
      cohortName,
      startDate: cohortStartDate,
      members: totalMembers,
      retentionByMonth,
      revenueByMonth,
      ltv,
    };
  }

  // Calculate member engagement score
  async calculateEngagementScore(userId: string): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { usage: true },
    });

    if (!subscription) return;

    // Calculate attendance rate
    const totalEvents = await this.getAvailableEventsCount(subscription.id);
    const attendedEvents = subscription.usage.filter((u) => u.checkedIn).length;
    const attendanceRate = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 0;

    // Calculate benefit usage rate
    const benefits = await prisma.benefitRedemption.count({
      where: { userId },
    });
    const benefitUsageRate = benefits > 0 ? Math.min(benefits * 10, 100) : 0; // Scale to 0-100

    // Calculate portal activity rate
    const portalLogins = await prisma.memberActivity.count({
      where: {
        userId,
        activityType: 'portal_login',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    const portalActivityRate = Math.min(portalLogins * 5, 100); // Scale to 0-100

    // Calculate composite engagement score
    const engagementScore =
      attendanceRate * 0.5 + benefitUsageRate * 0.3 + portalActivityRate * 0.2;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (engagementScore >= 70) riskLevel = 'low';
    else if (engagementScore >= 40) riskLevel = 'medium';
    else riskLevel = 'high';

    // Calculate renewal probability (simple model)
    const renewalProbability = Math.min(engagementScore / 100, 1);

    // Update or create engagement score
    await prisma.memberEngagementScore.upsert({
      where: { userId },
      create: {
        userId,
        engagementScore,
        attendanceRate,
        benefitUsageRate,
        portalActivityRate,
        lastEventDate: subscription.usage[0]?.createdAt,
        eventCount: attendedEvents,
        benefitRedemptions: benefits,
        portalLogins,
        riskLevel,
        renewalProbability,
      },
      update: {
        engagementScore,
        attendanceRate,
        benefitUsageRate,
        portalActivityRate,
        lastEventDate: subscription.usage[0]?.createdAt,
        eventCount: attendedEvents,
        benefitRedemptions: benefits,
        portalLogins,
        riskLevel,
        renewalProbability,
      },
    });
  }

  // Helper methods
  private normalizeToMonthly(amount: number, interval: string): number {
    switch (interval) {
      case 'month':
        return amount;
      case 'year':
        return amount / 12;
      case 'quarter':
        return amount / 3;
      default:
        return amount;
    }
  }

  private async getAvailableEventsCount(
    subscriptionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    // TODO: Implement based on subscription event access rules
    return 10; // Placeholder
  }

  private async getCohortRevenueForMonth(
    subscriptionIds: string[],
    month: Date
  ): Promise<number> {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const result = await prisma.invoice.aggregate({
      where: {
        subscriptionId: { in: subscriptionIds },
        status: 'paid',
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { total: true },
    });

    return result._sum.total || 0;
  }

  private async calculateChurnRate(days: number): Promise<number> {
    const metrics = await this.getChurnMetrics(days);
    return metrics.monthlyChurnRate / 100;
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('AnalyticsService', () => {
  it('should calculate engagement metrics', async () => {
    const metrics = await service.getEngagementMetrics(startDate, endDate);
    expect(metrics.totalMembers).toBeGreaterThanOrEqual(0);
    expect(metrics.averageAttendanceRate).toBeGreaterThanOrEqual(0);
  });

  it('should calculate revenue metrics', async () => {
    const metrics = await service.getRevenueMetrics();
    expect(metrics.mrr).toBeGreaterThanOrEqual(0);
    expect(metrics.arr).toBe(metrics.mrr * 12);
  });

  it('should calculate churn metrics', async () => {
    const metrics = await service.getChurnMetrics(30);
    expect(metrics.monthlyChurnRate).toBeGreaterThanOrEqual(0);
  });

  it('should generate cohort analysis', async () => {
    const cohort = await service.getCohortAnalysis(cohortDate);
    expect(cohort.retentionByMonth).toHaveLength(12);
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Analytics service implemented
- [ ] Engagement metrics calculated
- [ ] Revenue metrics tracked
- [ ] Churn analysis functional
- [ ] Cohort analysis working
- [ ] Analytics dashboard complete
- [ ] Unit tests passing (>85% coverage)
- [ ] Performance optimized
- [ ] Documentation complete

---

## Dependencies

- SEASON-001: Subscription model setup (prerequisite)
- SEASON-004: Member benefits system (prerequisite)
- SEASON-006: Season holder portal (prerequisite)

---

## Estimated Timeline

**Total Duration:** 3 weeks
**Story Points:** 5