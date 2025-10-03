# SEASON-008: Renewal & Retention Management

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As an** event organizer
**I want** automated renewal reminders and retention campaigns
**So that** I can maximize subscription renewals, reduce churn, and win back lapsed members

---

## Acceptance Criteria

### 1. Auto-Renewal Reminder System
- [ ] 60-day advance renewal reminder email
- [ ] 30-day renewal reminder email
- [ ] 7-day final renewal reminder email
- [ ] Auto-renewal enabled confirmation
- [ ] Auto-renewal disabled warning
- [ ] Payment method expiration check (30 days before)
- [ ] Renewal confirmation email after success
- [ ] Customizable reminder schedule per tier

### 2. Early Renewal Incentives
- [ ] Early renewal discount configuration (% or $ off)
- [ ] Tiered early renewal rewards (60-day: 20%, 30-day: 10%)
- [ ] Bonus benefit for early renewals
- [ ] Extended subscription period bonus
- [ ] Gift with early renewal
- [ ] Limited-time early renewal campaigns
- [ ] Renewal incentive tracking
- [ ] ROI calculation for incentives

### 3. Lapsed Member Win-Back Campaigns
- [ ] Automated win-back email sequence (7, 14, 30, 60 days post-cancellation)
- [ ] Special win-back discount offers
- [ ] Personalized re-engagement messaging
- [ ] Survey for cancellation reasons
- [ ] Win-back success tracking
- [ ] A/B testing for win-back messaging
- [ ] Win-back conversion rate analytics
- [ ] Reactivation fee waiver options

### 4. Upgrade/Downgrade Management
- [ ] Tier upgrade workflow
- [ ] Tier downgrade workflow
- [ ] Pro-rated billing for tier changes
- [ ] Benefit adjustment on tier change
- [ ] Upgrade incentive campaigns
- [ ] Downgrade save offers (retention)
- [ ] Tier change confirmation emails
- [ ] Upgrade/downgrade analytics

### 5. At-Risk Member Intervention
- [ ] At-risk member identification (low engagement score)
- [ ] Automated intervention email campaigns
- [ ] Personalized retention offers
- [ ] Re-engagement event invitations
- [ ] One-on-one outreach triggers
- [ ] Benefit usage reminders
- [ ] Pause subscription option (retention tool)
- [ ] Success rate tracking for interventions

### 6. Renewal Analytics Dashboard
- [ ] Renewal rate by tier
- [ ] Renewal rate by cohort
- [ ] Time-to-renewal analytics
- [ ] Early renewal adoption rate
- [ ] Renewal campaign effectiveness
- [ ] At-risk member count
- [ ] Win-back success rate
- [ ] Lifetime value by renewal count

### 7. Payment Method Management
- [ ] Payment method expiration detection
- [ ] Proactive payment method update reminders
- [ ] One-click payment method update
- [ ] Backup payment method option
- [ ] Failed payment recovery workflow
- [ ] Payment method update confirmation
- [ ] Grace period for payment updates
- [ ] Automatic retry with backup method

### 8. Testing & Quality
- [ ] Unit tests for renewal logic (>90% coverage)
- [ ] Integration tests for email campaigns
- [ ] A/B test framework for campaigns
- [ ] Email deliverability testing
- [ ] Campaign performance tracking
- [ ] Edge case testing (timezone, date boundaries)
- [ ] Security audit for automated emails
- [ ] Documentation complete

---

## Technical Specifications

### Database Schema Updates
```prisma
// prisma/schema.prisma

model RenewalCampaign {
  id                String   @id @default(cuid())
  name              String
  type              String   // 'auto_renewal_reminder', 'early_renewal', 'win_back', 'at_risk'
  targetTier        String?  // Optional tier targeting
  triggerDaysBefore Int?     // Days before expiration to trigger
  triggerDaysAfter  Int?     // Days after cancellation to trigger
  discountType      String?  // 'percentage', 'fixed_amount'
  discountValue     Float?
  bonusBenefit      String?
  emailTemplateId   String
  active            Boolean  @default(true)
  priority          Int      @default(0)
  startDate         DateTime?
  endDate           DateTime?
  executions        CampaignExecution[]
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([type, active])
  @@index([active, priority])
}

model CampaignExecution {
  id                String   @id @default(cuid())
  campaignId        String
  campaign          RenewalCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId    String?
  subscription      Subscription? @relation(fields: [subscriptionId], references: [id])
  status            String   // 'scheduled', 'sent', 'opened', 'clicked', 'converted', 'failed'
  scheduledFor      DateTime
  sentAt            DateTime?
  openedAt          DateTime?
  clickedAt         DateTime?
  convertedAt       DateTime?
  failureReason     String?
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([campaignId, status])
  @@index([userId, status])
  @@index([status, scheduledFor])
}

model RenewalOffer {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  offerType      String   // 'early_renewal', 'win_back', 'retention', 'upgrade_incentive'
  discountType   String   // 'percentage', 'fixed_amount', 'bonus_benefit'
  discountValue  Float
  bonusBenefit   String?
  validFrom      DateTime
  validUntil     DateTime
  claimed        Boolean  @default(false)
  claimedAt      DateTime?
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([userId, claimed])
  @@index([offerType, validUntil])
}

model CancellationFeedback {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId   String
  subscription     Subscription @relation(fields: [subscriptionId], references: [id])
  primaryReason    String   // 'too_expensive', 'not_using', 'technical_issues', 'moving', 'other'
  secondaryReasons String[] // Additional reasons
  feedback         String?  // Free-form feedback
  wouldReturn      Boolean?
  suggestedPrice   Float?
  rating           Int?     // 1-5 stars
  metadata         Json?
  createdAt        DateTime @default(now())

  @@index([primaryReason])
  @@index([wouldReturn])
}

model RetentionIntervention {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  interventionType String // 'at_risk_email', 'personal_outreach', 'special_offer', 'pause_option'
  riskLevel      String   // 'low', 'medium', 'high'
  status         String   // 'pending', 'sent', 'successful', 'failed'
  offerExtended  String?
  outcome        String?  // 'renewed', 'upgraded', 'paused', 'cancelled'
  executedAt     DateTime?
  resolvedAt     DateTime?
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId, status])
  @@index([riskLevel, status])
  @@index([interventionType])
}

// Update Subscription model
model Subscription {
  // ... existing fields
  campaignExecutions  CampaignExecution[]
  cancellationFeedback CancellationFeedback[]
  interventions       RetentionIntervention[]
  // ... rest of fields
}
```

### TypeScript Interfaces
```typescript
// types/renewal.types.ts

export interface RenewalCampaignConfig {
  name: string;
  type: 'auto_renewal_reminder' | 'early_renewal' | 'win_back' | 'at_risk';
  targetTier?: string;
  triggerDaysBefore?: number;
  triggerDaysAfter?: number;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  bonusBenefit?: string;
  emailTemplateId: string;
  priority?: number;
}

export interface RenewalOfferConfig {
  userId: string;
  offerType: 'early_renewal' | 'win_back' | 'retention' | 'upgrade_incentive';
  discountType: 'percentage' | 'fixed_amount' | 'bonus_benefit';
  discountValue: number;
  bonusBenefit?: string;
  validDays: number;
}

export interface WinBackSequence {
  day7: boolean;
  day14: boolean;
  day30: boolean;
  day60: boolean;
}

export interface RetentionMetrics {
  renewalRate: number;
  earlyRenewalRate: number;
  atRiskCount: number;
  interventionSuccessRate: number;
  winBackSuccessRate: number;
  averageRetentionCost: number;
}

export interface CancellationFeedbackData {
  primaryReason: string;
  secondaryReasons?: string[];
  feedback?: string;
  wouldReturn?: boolean;
  suggestedPrice?: number;
  rating?: number;
}
```

### Renewal Service
```typescript
// lib/services/renewal.service.ts
import { PrismaClient } from '@prisma/client';
import { EmailService } from './email';
import { AnalyticsService } from './analytics.service';

const prisma = new PrismaClient();
const emailService = new EmailService();
const analyticsService = new AnalyticsService();

export class RenewalService {
  // Schedule renewal reminders
  async scheduleRenewalReminders(): Promise<void> {
    const campaigns = await prisma.renewalCampaign.findMany({
      where: {
        type: 'auto_renewal_reminder',
        active: true,
      },
    });

    for (const campaign of campaigns) {
      await this.executeCampaign(campaign);
    }
  }

  // Execute campaign
  private async executeCampaign(campaign: RenewalCampaign): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (campaign.triggerDaysBefore || 0));

    // Find subscriptions expiring on target date
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lt: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
        tier: campaign.targetTier ? { name: campaign.targetTier } : undefined,
      },
      include: { user: true, tier: true },
    });

    for (const subscription of subscriptions) {
      // Check if already executed for this user
      const existingExecution = await prisma.campaignExecution.findFirst({
        where: {
          campaignId: campaign.id,
          userId: subscription.userId,
          status: { in: ['sent', 'scheduled'] },
        },
      });

      if (existingExecution) continue;

      // Schedule execution
      await prisma.campaignExecution.create({
        data: {
          campaignId: campaign.id,
          userId: subscription.userId,
          subscriptionId: subscription.id,
          status: 'scheduled',
          scheduledFor: new Date(),
        },
      });

      // Send email
      await this.sendRenewalEmail(subscription, campaign);
    }
  }

  // Send renewal email
  private async sendRenewalEmail(
    subscription: Subscription,
    campaign: RenewalCampaign
  ): Promise<void> {
    const daysUntilExpiration = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await emailService.sendRenewalReminder(subscription.user.email, {
      userName: subscription.user.name,
      tierName: subscription.tier?.name || 'Basic',
      expirationDate: subscription.currentPeriodEnd,
      daysUntilExpiration,
      autoRenewEnabled: subscription.autoRenew,
      renewalLink: `${process.env.NEXT_PUBLIC_APP_URL}/member-portal/renewal`,
    });

    // Update execution status
    await prisma.campaignExecution.updateMany({
      where: {
        campaignId: campaign.id,
        userId: subscription.userId,
        status: 'scheduled',
      },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  // Create early renewal offer
  async createEarlyRenewalOffer(config: RenewalOfferConfig): Promise<RenewalOffer> {
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + config.validDays);

    const offer = await prisma.renewalOffer.create({
      data: {
        userId: config.userId,
        offerType: config.offerType,
        discountType: config.discountType,
        discountValue: config.discountValue,
        bonusBenefit: config.bonusBenefit,
        validFrom,
        validUntil,
      },
    });

    // Send offer email
    await emailService.sendEarlyRenewalOffer(config.userId, offer);

    return offer;
  }

  // Handle cancellation with feedback
  async handleCancellation(
    subscriptionId: string,
    feedback: CancellationFeedbackData
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Save cancellation feedback
    await prisma.cancellationFeedback.create({
      data: {
        userId: subscription.userId,
        subscriptionId,
        primaryReason: feedback.primaryReason,
        secondaryReasons: feedback.secondaryReasons || [],
        feedback: feedback.feedback,
        wouldReturn: feedback.wouldReturn,
        suggestedPrice: feedback.suggestedPrice,
        rating: feedback.rating,
      },
    });

    // Record churn event
    await prisma.churnEvent.create({
      data: {
        userId: subscription.userId,
        subscriptionId,
        churnDate: new Date(),
        churnType: 'voluntary',
        churnReason: feedback.primaryReason,
        tier: subscription.tier?.name || 'Basic',
        daysActive: Math.ceil(
          (Date.now() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
        totalRevenue: await this.calculateTotalRevenue(subscriptionId),
      },
    });

    // Cancel subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        canceledAt: new Date(),
        autoRenew: false,
      },
    });

    // Schedule win-back sequence
    await this.scheduleWinBackSequence(subscription.userId);
  }

  // Schedule win-back sequence
  private async scheduleWinBackSequence(userId: string): Promise<void> {
    const winBackCampaigns = await prisma.renewalCampaign.findMany({
      where: {
        type: 'win_back',
        active: true,
      },
      orderBy: { triggerDaysAfter: 'asc' },
    });

    for (const campaign of winBackCampaigns) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + (campaign.triggerDaysAfter || 7));

      await prisma.campaignExecution.create({
        data: {
          campaignId: campaign.id,
          userId,
          status: 'scheduled',
          scheduledFor: scheduledDate,
        },
      });
    }
  }

  // Identify at-risk members
  async identifyAtRiskMembers(): Promise<void> {
    const atRiskMembers = await prisma.memberEngagementScore.findMany({
      where: {
        riskLevel: { in: ['medium', 'high'] },
        renewalProbability: { lt: 0.6 },
      },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'active' },
              take: 1,
            },
          },
        },
      },
    });

    for (const member of atRiskMembers) {
      const subscription = member.user.subscriptions[0];
      if (!subscription) continue;

      // Check if intervention already exists
      const existingIntervention = await prisma.retentionIntervention.findFirst({
        where: {
          userId: member.userId,
          status: { in: ['pending', 'sent'] },
        },
      });

      if (existingIntervention) continue;

      // Create intervention
      await this.createRetentionIntervention(
        member.userId,
        subscription.id,
        member.riskLevel
      );
    }
  }

  // Create retention intervention
  private async createRetentionIntervention(
    userId: string,
    subscriptionId: string,
    riskLevel: string
  ): Promise<void> {
    const intervention = await prisma.retentionIntervention.create({
      data: {
        userId,
        subscriptionId,
        interventionType: 'at_risk_email',
        riskLevel,
        status: 'pending',
      },
    });

    // Send intervention email
    await emailService.sendAtRiskIntervention(userId, riskLevel);

    // Update status
    await prisma.retentionIntervention.update({
      where: { id: intervention.id },
      data: {
        status: 'sent',
        executedAt: new Date(),
      },
    });

    // Create retention offer if high risk
    if (riskLevel === 'high') {
      await this.createEarlyRenewalOffer({
        userId,
        offerType: 'retention',
        discountType: 'percentage',
        discountValue: 20,
        validDays: 14,
      });
    }
  }

  // Handle tier upgrade
  async handleTierUpgrade(
    subscriptionId: string,
    newTierId: string
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { tier: true, plan: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newTier = await prisma.benefitTier.findUnique({
      where: { id: newTierId },
    });

    if (!newTier) {
      throw new Error('Tier not found');
    }

    // Calculate pro-rated amount
    // TODO: Implement pro-ration logic

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { tierId: newTierId },
    });

    // Send confirmation email
    await emailService.sendTierChangeConfirmation(
      subscription.user.email,
      'upgrade',
      newTier.name
    );

    // Log activity
    await prisma.memberActivity.create({
      data: {
        userId: subscription.userId,
        activityType: 'subscription_change',
        description: `Upgraded to ${newTier.name} tier`,
      },
    });
  }

  // Get retention metrics
  async getRetentionMetrics(): Promise<RetentionMetrics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate renewal rate
    const expiringSubscriptions = await prisma.subscription.count({
      where: {
        currentPeriodEnd: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
    });

    const renewedSubscriptions = await prisma.subscription.count({
      where: {
        currentPeriodEnd: {
          gte: thirtyDaysAgo,
          lte: now,
        },
        status: 'active',
        autoRenew: true,
      },
    });

    const renewalRate = expiringSubscriptions > 0
      ? (renewedSubscriptions / expiringSubscriptions) * 100
      : 0;

    // Calculate early renewal rate
    const earlyRenewals = await prisma.renewalOffer.count({
      where: {
        offerType: 'early_renewal',
        claimed: true,
        claimedAt: { gte: thirtyDaysAgo },
      },
    });

    const earlyRenewalRate = expiringSubscriptions > 0
      ? (earlyRenewals / expiringSubscriptions) * 100
      : 0;

    // At-risk count
    const atRiskCount = await prisma.memberEngagementScore.count({
      where: { riskLevel: 'high' },
    });

    // Intervention success rate
    const interventions = await prisma.retentionIntervention.findMany({
      where: {
        executedAt: { gte: thirtyDaysAgo },
      },
    });

    const successfulInterventions = interventions.filter(
      (i) => i.outcome === 'renewed' || i.outcome === 'upgraded'
    ).length;

    const interventionSuccessRate = interventions.length > 0
      ? (successfulInterventions / interventions.length) * 100
      : 0;

    // Win-back success rate
    const winBackCampaigns = await prisma.campaignExecution.findMany({
      where: {
        campaign: { type: 'win_back' },
        sentAt: { gte: thirtyDaysAgo },
      },
    });

    const winBackConversions = winBackCampaigns.filter(
      (c) => c.status === 'converted'
    ).length;

    const winBackSuccessRate = winBackCampaigns.length > 0
      ? (winBackConversions / winBackCampaigns.length) * 100
      : 0;

    return {
      renewalRate,
      earlyRenewalRate,
      atRiskCount,
      interventionSuccessRate,
      winBackSuccessRate,
      averageRetentionCost: 0, // TODO: Calculate
    };
  }

  // Helper: Calculate total revenue
  private async calculateTotalRevenue(subscriptionId: string): Promise<number> {
    const result = await prisma.invoice.aggregate({
      where: {
        subscriptionId,
        status: 'paid',
      },
      _sum: { total: true },
    });

    return result._sum.total || 0;
  }
}
```

### API Routes
```typescript
// app/api/renewals/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { RenewalService } from '@/lib/services/renewal.service';

const renewalService = new RenewalService();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId, feedback } = await req.json();

  await renewalService.handleCancellation(subscriptionId, feedback);

  return NextResponse.json({ success: true });
}

// app/api/renewals/upgrade/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId, newTierId } = await req.json();

  await renewalService.handleTierUpgrade(subscriptionId, newTierId);

  return NextResponse.json({ success: true });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('RenewalService', () => {
  it('should schedule renewal reminders', async () => {
    await service.scheduleRenewalReminders();
    const executions = await prisma.campaignExecution.findMany({
      where: { status: 'scheduled' },
    });
    expect(executions.length).toBeGreaterThan(0);
  });

  it('should create early renewal offer', async () => {
    const offer = await service.createEarlyRenewalOffer(config);
    expect(offer.discountValue).toBe(20);
  });

  it('should handle cancellation with feedback', async () => {
    await service.handleCancellation(subscriptionId, feedback);
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    expect(subscription.status).toBe('cancelled');
  });

  it('should identify at-risk members', async () => {
    await service.identifyAtRiskMembers();
    const interventions = await prisma.retentionIntervention.findMany({
      where: { status: 'pending' },
    });
    expect(interventions.length).toBeGreaterThan(0);
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Renewal reminder system implemented
- [ ] Early renewal incentives working
- [ ] Win-back campaigns automated
- [ ] Upgrade/downgrade flows functional
- [ ] At-risk intervention system active
- [ ] Renewal analytics dashboard complete
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Email templates created
- [ ] Documentation complete

---

## Dependencies

- SEASON-001: Subscription model setup (prerequisite)
- SEASON-006: Season holder portal (prerequisite)
- SEASON-007: Season holder analytics (prerequisite)
- NOTIFY-001: Notification system (prerequisite)

---

## Estimated Timeline

**Total Duration:** 3 weeks
**Story Points:** 5