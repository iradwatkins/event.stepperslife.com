# MKT-012: Advanced Analytics Dashboard

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** advanced marketing analytics with attribution modeling, funnel visualization, and predictive insights
**So that** I can understand campaign performance, optimize ROI, and make data-driven marketing decisions

---

## Acceptance Criteria

### AC1: Marketing Attribution Modeling
**Given** I have multiple marketing touchpoints
**When** I view attribution reports
**Then** I see first-touch, last-touch, and multi-touch attribution models
**And** I can compare attribution models side-by-side
**And** I see which channels drive the most conversions
**And** I can customize attribution windows (7, 14, 30, 90 days)

### AC2: Campaign ROI Tracking
**Given** I run marketing campaigns
**When** I view campaign analytics
**Then** I see cost per acquisition (CPA), return on ad spend (ROAS), and overall ROI
**And** I can track revenue attributed to each campaign
**And** I see profit margins after marketing costs
**And** I receive alerts for underperforming campaigns

### AC3: Funnel Visualization & Analysis
**Given** I want to understand the customer journey
**When** I view the conversion funnel
**Then** I see each stage: awareness, consideration, purchase, retention
**And** I see drop-off rates at each stage
**And** I can identify bottlenecks and optimization opportunities
**And** I can segment funnels by source, campaign, or audience

### AC4: Customer Lifetime Value (LTV)
**Given** I analyze customer value
**When** I view LTV metrics
**Then** I see predicted lifetime value per customer
**And** I see LTV by acquisition channel and segment
**And** I can compare LTV to customer acquisition cost (CAC)
**And** I receive insights on high-value customer characteristics

### AC5: Cohort Analysis
**Given** I want to analyze user behavior over time
**When** I create a cohort analysis
**Then** I can group users by acquisition date, first event, or custom criteria
**And** I see retention rates over time per cohort
**And** I can compare revenue per cohort
**And** I identify which cohorts have the highest engagement

### AC6: Predictive Analytics
**Given** I plan future campaigns
**When** I access predictive insights
**Then** I see forecasted ticket sales and revenue
**And** I receive recommendations for optimal campaign timing
**And** I see predicted impact of marketing spend changes
**And** AI identifies trends and anomalies in campaign data

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model MarketingAttribution {
  id                String              @id @default(cuid())
  orderId           String              @unique
  userId            String
  touchpoints       Json                // Array of touchpoint data
  firstTouch        Json                // First touchpoint details
  lastTouch         Json                // Last touchpoint details
  multiTouch        Json                // Multi-touch attribution weights
  attributionWindow Int                 @default(30) // Days
  revenue           Decimal             @db.Decimal(10, 2)
  createdAt         DateTime            @default(now())

  order             Order               @relation(fields: [orderId], references: [id])
  user              User                @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}

model MarketingTouchpoint {
  id                String              @id @default(cuid())
  userId            String
  sessionId         String
  source            String              // organic, paid, email, social, referral
  medium            String?             // cpc, email, social, referral
  campaign          String?
  content           String?
  term              String?
  landingPage       String
  timestamp         DateTime            @default(now())
  eventId           String?

  user              User                @relation(fields: [userId], references: [id])
  event             Event?              @relation(fields: [eventId], references: [id])

  @@index([userId, timestamp])
  @@index([sessionId])
  @@index([source, campaign])
}

model CampaignAnalytics {
  id                String              @id @default(cuid())
  campaignId        String
  date              DateTime
  impressions       Int                 @default(0)
  clicks            Int                 @default(0)
  conversions       Int                 @default(0)
  revenue           Decimal             @default(0) @db.Decimal(10, 2)
  cost              Decimal             @default(0) @db.Decimal(10, 2)
  ctr               Float               @default(0) // Click-through rate
  cpa               Decimal             @default(0) @db.Decimal(10, 2) // Cost per acquisition
  roas              Float               @default(0) // Return on ad spend
  roi               Float               @default(0) // Return on investment

  campaign          Campaign            @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
  @@index([campaignId, date])
}

model ConversionFunnel {
  id                String              @id @default(cuid())
  organizerId       String
  name              String
  stages            Json                // Array of funnel stages
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  organizer         User                @relation(fields: [organizerId], references: [id])
  analytics         FunnelAnalytics[]

  @@index([organizerId])
}

model FunnelAnalytics {
  id                String              @id @default(cuid())
  funnelId          String
  date              DateTime
  stageMetrics      Json                // Metrics per stage
  totalUsers        Int
  completedUsers    Int
  conversionRate    Float
  avgTimeToConvert  Int?                // Minutes

  funnel            ConversionFunnel    @relation(fields: [funnelId], references: [id], onDelete: Cascade)

  @@unique([funnelId, date])
  @@index([funnelId, date])
}

model CustomerLTV {
  id                String              @id @default(cuid())
  userId            String              @unique
  predictedLTV      Decimal             @db.Decimal(10, 2)
  actualRevenue     Decimal             @db.Decimal(10, 2)
  acquisitionCost   Decimal             @db.Decimal(10, 2)
  acquisitionSource String
  acquisitionDate   DateTime
  lastPurchase      DateTime?
  purchaseCount     Int                 @default(0)
  avgOrderValue     Decimal             @db.Decimal(10, 2)
  churnProbability  Float               @default(0)
  updatedAt         DateTime            @updatedAt

  user              User                @relation(fields: [userId], references: [id])

  @@index([predictedLTV])
  @@index([acquisitionSource])
}

model CohortAnalysis {
  id                String              @id @default(cuid())
  organizerId       String
  name              String
  cohortType        CohortType
  cohortDate        DateTime
  userCount         Int
  metrics           Json                // Time-series metrics
  createdAt         DateTime            @default(now())

  organizer         User                @relation(fields: [organizerId], references: [id])

  @@index([organizerId, cohortDate])
}

model PredictiveInsight {
  id                String              @id @default(cuid())
  organizerId       String
  insightType       InsightType
  prediction        Json                // Prediction data
  confidence        Float               // 0-1
  generatedAt       DateTime            @default(now())
  validUntil        DateTime

  organizer         User                @relation(fields: [organizerId], references: [id])

  @@index([organizerId, insightType, validUntil])
}

model ChannelPerformance {
  id                String              @id @default(cuid())
  organizerId       String
  channel           String
  date              DateTime
  users             Int                 @default(0)
  sessions          Int                 @default(0)
  conversions       Int                 @default(0)
  revenue           Decimal             @default(0) @db.Decimal(10, 2)
  cost              Decimal             @default(0) @db.Decimal(10, 2)
  roi               Float               @default(0)

  organizer         User                @relation(fields: [organizerId], references: [id])

  @@unique([organizerId, channel, date])
  @@index([organizerId, date])
}

enum CohortType {
  ACQUISITION_DATE
  FIRST_PURCHASE
  FIRST_EVENT
  CUSTOM
}

enum InsightType {
  SALES_FORECAST
  CHURN_PREDICTION
  CAMPAIGN_OPTIMIZATION
  TREND_DETECTION
  ANOMALY_DETECTION
}
```

### TypeScript Interfaces

```typescript
// types/advanced-analytics.ts

export interface AttributionModel {
  type: 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'TIME_DECAY' | 'POSITION_BASED';
  touchpoints: AttributionTouchpoint[];
  totalRevenue: number;
}

export interface AttributionTouchpoint {
  source: string;
  medium?: string;
  campaign?: string;
  timestamp: Date;
  credit: number; // Attribution credit (0-1)
  revenue: number; // Revenue attributed
}

export interface CampaignROI {
  campaignId: string;
  campaignName: string;
  totalCost: number;
  totalRevenue: number;
  conversions: number;
  cpa: number;
  roas: number;
  roi: number;
  profitMargin: number;
}

export interface FunnelStage {
  name: string;
  users: number;
  dropoff: number;
  dropoffRate: number;
  conversionRate: number;
  avgTimeInStage: number; // Minutes
}

export interface FunnelAnalysis {
  stages: FunnelStage[];
  totalUsers: number;
  completedUsers: number;
  overallConversionRate: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface LTVMetrics {
  avgLTV: number;
  avgCAC: number;
  ltvCacRatio: number;
  paybackPeriod: number; // Months
  byChannel: Record<string, ChannelLTV>;
  bySegment: Record<string, number>;
}

export interface ChannelLTV {
  channel: string;
  avgLTV: number;
  avgCAC: number;
  customerCount: number;
}

export interface CohortMetrics {
  cohortName: string;
  cohortDate: Date;
  userCount: number;
  retention: number[]; // Retention by period
  revenue: number[];
  engagement: number[];
}

export interface PredictiveForecast {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  name: string;
  impact: number; // -1 to 1
  description: string;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changePercent: number;
  significance: number; // 0-1
  anomalies: Anomaly[];
}

export interface Anomaly {
  date: Date;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
}
```

### API Routes

```typescript
// app/api/analytics/attribution/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { AnalyticsService } from '@/lib/services/analytics.service';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const model = searchParams.get('model') || 'LAST_TOUCH';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const attribution = await AnalyticsService.getAttribution({
    organizerId: session.user.id,
    model: model as any,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return NextResponse.json(attribution);
}

// app/api/analytics/campaigns/roi/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roi = await AnalyticsService.getCampaignROI(session.user.id);
  return NextResponse.json(roi);
}

// app/api/analytics/funnel/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const analysis = await AnalyticsService.analyzeFunnel({
    organizerId: session.user.id,
    stages: body.stages,
    startDate: body.startDate,
    endDate: body.endDate,
    segment: body.segment,
  });

  return NextResponse.json(analysis);
}

// app/api/analytics/ltv/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ltv = await AnalyticsService.getLTVMetrics(session.user.id);
  return NextResponse.json(ltv);
}

// app/api/analytics/cohorts/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cohortType = searchParams.get('type') || 'ACQUISITION_DATE';

  const cohorts = await AnalyticsService.getCohortAnalysis({
    organizerId: session.user.id,
    cohortType: cohortType as any,
  });

  return NextResponse.json(cohorts);
}

// app/api/analytics/predictions/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const predictions = await AnalyticsService.getPredictiveInsights(session.user.id);
  return NextResponse.json(predictions);
}
```

### Service Layer

```typescript
// lib/services/analytics.service.ts

import { prisma } from '@/lib/prisma';
import { AttributionModel, FunnelAnalysis, LTVMetrics } from '@/types/advanced-analytics';
import { OpenAIService } from './openai.service';

export class AnalyticsService {
  static async trackTouchpoint(data: {
    userId: string;
    sessionId: string;
    source: string;
    medium?: string;
    campaign?: string;
    landingPage: string;
    eventId?: string;
  }) {
    return prisma.marketingTouchpoint.create({
      data,
    });
  }

  static async getAttribution(params: {
    organizerId: string;
    model: 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'TIME_DECAY' | 'POSITION_BASED';
    startDate?: Date;
    endDate?: Date;
  }): Promise<AttributionModel> {
    const orders = await prisma.order.findMany({
      where: {
        event: { organizerId: params.organizerId },
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      include: {
        attribution: {
          include: {
            user: true,
          },
        },
      },
    });

    const touchpoints: any[] = [];

    for (const order of orders) {
      if (!order.attribution) continue;

      const orderTouchpoints = order.attribution.touchpoints as any[];
      const revenue = Number(order.totalAmount);

      for (const tp of orderTouchpoints) {
        let credit = 0;

        switch (params.model) {
          case 'FIRST_TOUCH':
            credit = tp === orderTouchpoints[0] ? 1 : 0;
            break;
          case 'LAST_TOUCH':
            credit = tp === orderTouchpoints[orderTouchpoints.length - 1] ? 1 : 0;
            break;
          case 'LINEAR':
            credit = 1 / orderTouchpoints.length;
            break;
          case 'TIME_DECAY':
            const position = orderTouchpoints.indexOf(tp);
            const decay = Math.pow(0.5, orderTouchpoints.length - position - 1);
            credit = decay / orderTouchpoints.reduce((sum, _, i) =>
              sum + Math.pow(0.5, orderTouchpoints.length - i - 1), 0);
            break;
          case 'POSITION_BASED':
            if (tp === orderTouchpoints[0] || tp === orderTouchpoints[orderTouchpoints.length - 1]) {
              credit = 0.4;
            } else {
              credit = 0.2 / (orderTouchpoints.length - 2);
            }
            break;
        }

        const existing = touchpoints.find(
          t => t.source === tp.source && t.campaign === tp.campaign
        );

        if (existing) {
          existing.credit += credit;
          existing.revenue += revenue * credit;
        } else {
          touchpoints.push({
            source: tp.source,
            medium: tp.medium,
            campaign: tp.campaign,
            timestamp: new Date(tp.timestamp),
            credit,
            revenue: revenue * credit,
          });
        }
      }
    }

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return {
      type: params.model,
      touchpoints,
      totalRevenue,
    };
  }

  static async getCampaignROI(organizerId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { organizerId },
      include: {
        analytics: true,
      },
    });

    return campaigns.map(campaign => {
      const totalCost = campaign.analytics.reduce(
        (sum, a) => sum + Number(a.cost),
        0
      );
      const totalRevenue = campaign.analytics.reduce(
        (sum, a) => sum + Number(a.revenue),
        0
      );
      const conversions = campaign.analytics.reduce(
        (sum, a) => sum + a.conversions,
        0
      );

      const cpa = conversions > 0 ? totalCost / conversions : 0;
      const roas = totalCost > 0 ? totalRevenue / totalCost : 0;
      const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        totalCost,
        totalRevenue,
        conversions,
        cpa,
        roas,
        roi,
        profitMargin: totalRevenue - totalCost,
      };
    });
  }

  static async analyzeFunnel(params: {
    organizerId: string;
    stages: string[];
    startDate?: Date;
    endDate?: Date;
    segment?: string;
  }): Promise<FunnelAnalysis> {
    // Define funnel stages and track user progression
    const stages = [
      { name: 'Awareness', event: 'page_view' },
      { name: 'Consideration', event: 'event_view' },
      { name: 'Intent', event: 'add_to_cart' },
      { name: 'Purchase', event: 'purchase' },
    ];

    const stageMetrics = await Promise.all(
      stages.map(async (stage, index) => {
        // Count users at this stage
        const users = 1000; // Mock data
        const prevUsers = index > 0 ? stages[index - 1] : null;
        const dropoff = prevUsers ? 200 : 0; // Mock
        const dropoffRate = prevUsers ? (dropoff / 1000) * 100 : 0;

        return {
          name: stage.name,
          users,
          dropoff,
          dropoffRate,
          conversionRate: (users / 1000) * 100,
          avgTimeInStage: 30, // minutes
        };
      })
    );

    // Identify bottlenecks
    const bottlenecks = stageMetrics
      .filter(s => s.dropoffRate > 30)
      .map(s => s.name);

    // Generate recommendations using AI
    const recommendations = await OpenAIService.generateFunnelRecommendations({
      stages: stageMetrics,
      bottlenecks,
    });

    return {
      stages: stageMetrics,
      totalUsers: stageMetrics[0]?.users || 0,
      completedUsers: stageMetrics[stageMetrics.length - 1]?.users || 0,
      overallConversionRate:
        stageMetrics[0]?.users > 0
          ? (stageMetrics[stageMetrics.length - 1]?.users / stageMetrics[0].users) * 100
          : 0,
      bottlenecks,
      recommendations,
    };
  }

  static async getLTVMetrics(organizerId: string): Promise<LTVMetrics> {
    const ltvData = await prisma.customerLTV.findMany({
      where: {
        user: {
          events: {
            some: {
              organizerId,
            },
          },
        },
      },
    });

    const avgLTV =
      ltvData.reduce((sum, l) => sum + Number(l.predictedLTV), 0) / ltvData.length;
    const avgCAC =
      ltvData.reduce((sum, l) => sum + Number(l.acquisitionCost), 0) / ltvData.length;

    const byChannel = ltvData.reduce((acc: any, l) => {
      if (!acc[l.acquisitionSource]) {
        acc[l.acquisitionSource] = {
          channel: l.acquisitionSource,
          totalLTV: 0,
          totalCAC: 0,
          count: 0,
        };
      }
      acc[l.acquisitionSource].totalLTV += Number(l.predictedLTV);
      acc[l.acquisitionSource].totalCAC += Number(l.acquisitionCost);
      acc[l.acquisitionSource].count += 1;
      return acc;
    }, {});

    const byChannelFormatted = Object.values(byChannel).map((c: any) => ({
      channel: c.channel,
      avgLTV: c.totalLTV / c.count,
      avgCAC: c.totalCAC / c.count,
      customerCount: c.count,
    }));

    return {
      avgLTV,
      avgCAC,
      ltvCacRatio: avgCAC > 0 ? avgLTV / avgCAC : 0,
      paybackPeriod: avgCAC > 0 ? Math.ceil((avgCAC / avgLTV) * 12) : 0,
      byChannel: byChannelFormatted.reduce((acc: any, c) => {
        acc[c.channel] = c;
        return acc;
      }, {}),
      bySegment: {},
    };
  }

  static async getCohortAnalysis(params: {
    organizerId: string;
    cohortType: 'ACQUISITION_DATE' | 'FIRST_PURCHASE' | 'FIRST_EVENT' | 'CUSTOM';
  }) {
    const cohorts = await prisma.cohortAnalysis.findMany({
      where: {
        organizerId: params.organizerId,
        cohortType: params.cohortType,
      },
      orderBy: {
        cohortDate: 'desc',
      },
    });

    return cohorts;
  }

  static async getPredictiveInsights(organizerId: string) {
    // Check for existing valid predictions
    const existing = await prisma.predictiveInsight.findMany({
      where: {
        organizerId,
        validUntil: { gte: new Date() },
      },
    });

    if (existing.length > 0) {
      return existing;
    }

    // Generate new predictions using AI
    const salesForecast = await this.generateSalesForecast(organizerId);
    const churnPrediction = await this.generateChurnPrediction(organizerId);

    const insights = await prisma.predictiveInsight.createMany({
      data: [
        {
          organizerId,
          insightType: 'SALES_FORECAST',
          prediction: salesForecast,
          confidence: 0.85,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        {
          organizerId,
          insightType: 'CHURN_PREDICTION',
          prediction: churnPrediction,
          confidence: 0.78,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    return prisma.predictiveInsight.findMany({
      where: {
        organizerId,
        validUntil: { gte: new Date() },
      },
    });
  }

  private static async generateSalesForecast(organizerId: string) {
    // Use historical data to predict future sales
    return {
      metric: 'ticket_sales',
      predictedValue: 5000,
      timeframe: '30_days',
      confidence: 0.85,
    };
  }

  private static async generateChurnPrediction(organizerId: string) {
    // Predict which users are likely to churn
    return {
      metric: 'churn_rate',
      predictedValue: 0.15,
      timeframe: '30_days',
      confidence: 0.78,
    };
  }
}
```

---

## Testing Requirements

### Unit Tests
- Attribution credit calculation
- ROI and ROAS formulas
- Funnel drop-off calculation
- LTV prediction algorithm
- Cohort retention calculation

### Integration Tests
- Complete attribution flow
- Campaign ROI tracking
- Funnel analysis workflow
- LTV calculation with real data
- Predictive insights generation

### E2E Tests
- View attribution models comparison
- Analyze campaign ROI dashboard
- Explore conversion funnel with segments
- Review LTV by channel
- Access predictive forecasts

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- [PAY-001: Square Payment Integration](../epic-003-payment/PAY-001-square-payment-integration.md)
- MKT-010: AI-Powered Audience Segmentation

### After
- None (final analytics story)

---

## Definition of Done

- [ ] Prisma schema includes all analytics models
- [ ] Attribution modeling (all 5 models)
- [ ] Campaign ROI calculation
- [ ] Funnel visualization and analysis
- [ ] LTV metrics and prediction
- [ ] Cohort analysis
- [ ] Predictive insights with AI
- [ ] Analytics dashboard UI
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify dashboards
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Use data visualization library (Chart.js, Recharts)
- Implement caching for expensive analytics queries
- Consider data warehouse for large datasets
- Use background jobs for analytics calculations
- Store aggregated metrics for performance
- Implement export to CSV/PDF
- Add scheduled reports via email