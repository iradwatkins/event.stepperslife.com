# MKT-013: Referral & Affiliate Programs

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** referral and affiliate programs that incentivize users to promote my events
**So that** I can leverage word-of-mouth marketing, acquire customers cost-effectively, and grow ticket sales

---

## Acceptance Criteria

### AC1: Referral Link Generation
**Given** I am a registered user
**When** I access my referral dashboard
**Then** I can generate unique referral links for events
**And** links are tracked to my account
**And** I can share links via email, SMS, or social media
**And** I see a preview of how the link appears when shared

### AC2: Referral Tracking & Attribution
**Given** someone uses my referral link
**When** they purchase a ticket
**Then** the purchase is attributed to my referral
**And** I receive a notification of the successful referral
**And** the referral appears in my dashboard with details
**And** attribution is accurate even with cookie expiration

### AC3: Reward System
**Given** I successfully refer customers
**When** they complete purchases
**Then** I receive rewards based on the program rules (discounts, credits, or cash)
**And** rewards are automatically applied to my account
**And** I can view my reward balance and history
**And** I receive notifications when rewards are earned

### AC4: Affiliate Partner Management
**Given** I want to create an affiliate program
**When** I set up the program
**Then** I can invite partners to join
**And** I can set commission rates per partner or tier
**And** partners receive a custom affiliate portal login
**And** I can approve or reject affiliate applications

### AC5: Commission Tracking & Payouts
**Given** affiliates generate sales
**When** I view commission reports
**Then** I see commission owed per affiliate
**And** I can process payouts manually or automatically
**And** affiliates receive payout notifications
**And** all transactions are logged for accounting

### AC6: Fraud Detection
**Given** the referral program is active
**When** suspicious activity occurs
**Then** the system flags potential fraud (self-referrals, bot traffic, stolen cards)
**And** I receive alerts for review
**And** I can block users or invalidate referrals
**And** fraud patterns are analyzed to improve detection

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model ReferralProgram {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  description     String?
  rewardType      RewardType
  rewardAmount    Decimal             @default(0) @db.Decimal(10, 2)
  rewardPercent   Int?                // For percentage-based rewards
  minPurchase     Decimal?            @db.Decimal(10, 2)
  maxRewards      Int?                // Max rewards per user
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  organizer       User                @relation(fields: [organizerId], references: [id])
  referrals       Referral[]

  @@index([organizerId, isActive])
}

model Referral {
  id              String              @id @default(cuid())
  programId       String
  referrerId      String
  referralCode    String              @unique
  referralUrl     String
  clicks          Int                 @default(0)
  conversions     Int                 @default(0)
  revenue         Decimal             @default(0) @db.Decimal(10, 2)
  rewardsPaid     Decimal             @default(0) @db.Decimal(10, 2)
  status          ReferralStatus      @default(ACTIVE)
  createdAt       DateTime            @default(now())
  expiresAt       DateTime?

  program         ReferralProgram     @relation(fields: [programId], references: [id], onDelete: Cascade)
  referrer        User                @relation(fields: [referrerId], references: [id])
  referees        ReferralConversion[]

  @@index([referralCode])
  @@index([referrerId, status])
}

model ReferralConversion {
  id              String              @id @default(cuid())
  referralId      String
  refereeId       String              // User who was referred
  orderId         String?             @unique
  eventId         String
  status          ConversionStatus    @default(PENDING)
  rewardAmount    Decimal             @default(0) @db.Decimal(10, 2)
  convertedAt     DateTime            @default(now())
  paidAt          DateTime?

  referral        Referral            @relation(fields: [referralId], references: [id])
  referee         User                @relation(fields: [refereeId], references: [id])
  order           Order?              @relation(fields: [orderId], references: [id])
  event           Event               @relation(fields: [eventId], references: [id])

  @@index([referralId, status])
  @@index([refereeId])
}

model AffiliateProgram {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  description     String?
  commissionType  CommissionType
  commissionRate  Decimal             @db.Decimal(5, 2) // Percentage
  flatCommission  Decimal?            @db.Decimal(10, 2)
  payoutThreshold Decimal             @default(50) @db.Decimal(10, 2)
  payoutFrequency PayoutFrequency     @default(MONTHLY)
  isActive        Boolean             @default(true)
  requireApproval Boolean             @default(true)
  termsUrl        String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  organizer       User                @relation(fields: [organizerId], references: [id])
  partners        AffiliatePartner[]

  @@index([organizerId, isActive])
}

model AffiliatePartner {
  id              String              @id @default(cuid())
  programId       String
  userId          String
  affiliateCode   String              @unique
  status          PartnerStatus       @default(PENDING)
  commissionRate  Decimal?            @db.Decimal(5, 2) // Override program rate
  totalSales      Int                 @default(0)
  totalRevenue    Decimal             @default(0) @db.Decimal(10, 2)
  totalCommission Decimal             @default(0) @db.Decimal(10, 2)
  paidCommission  Decimal             @default(0) @db.Decimal(10, 2)
  pendingPayout   Decimal             @default(0) @db.Decimal(10, 2)
  joinedAt        DateTime            @default(now())
  approvedAt      DateTime?

  program         AffiliateProgram    @relation(fields: [programId], references: [id], onDelete: Cascade)
  user            User                @relation(fields: [userId], references: [id])
  sales           AffiliateSale[]
  payouts         AffiliatePayout[]

  @@index([programId, status])
  @@index([userId])
  @@index([affiliateCode])
}

model AffiliateSale {
  id              String              @id @default(cuid())
  partnerId       String
  orderId         String              @unique
  eventId         String
  saleAmount      Decimal             @db.Decimal(10, 2)
  commissionRate  Decimal             @db.Decimal(5, 2)
  commissionAmount Decimal            @db.Decimal(10, 2)
  status          SaleStatus          @default(PENDING)
  createdAt       DateTime            @default(now())
  approvedAt      DateTime?

  partner         AffiliatePartner    @relation(fields: [partnerId], references: [id])
  order           Order               @relation(fields: [orderId], references: [id])
  event           Event               @relation(fields: [eventId], references: [id])

  @@index([partnerId, status])
  @@index([orderId])
}

model AffiliatePayout {
  id              String              @id @default(cuid())
  partnerId       String
  amount          Decimal             @db.Decimal(10, 2)
  method          PayoutMethod
  status          PayoutStatus        @default(PENDING)
  salesIncluded   Json                // Array of sale IDs
  requestedAt     DateTime            @default(now())
  processedAt     DateTime?
  paidAt          DateTime?
  transactionId   String?
  notes           String?

  partner         AffiliatePartner    @relation(fields: [partnerId], references: [id])

  @@index([partnerId, status])
}

model ReferralFraudLog {
  id              String              @id @default(cuid())
  referralId      String?
  userId          String?
  fraudType       FraudType
  severity        FraudSeverity
  details         Json
  ipAddress       String?
  userAgent       String?
  isReviewed      Boolean             @default(false)
  action          String?             // Action taken
  createdAt       DateTime            @default(now())

  user            User?               @relation(fields: [userId], references: [id])

  @@index([userId, fraudType])
  @@index([createdAt])
}

enum RewardType {
  DISCOUNT
  CREDIT
  CASH
  FREE_TICKET
}

enum ReferralStatus {
  ACTIVE
  PAUSED
  EXPIRED
  SUSPENDED
}

enum ConversionStatus {
  PENDING
  APPROVED
  PAID
  REJECTED
}

enum CommissionType {
  PERCENTAGE
  FLAT
  TIERED
}

enum PayoutFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
}

enum PartnerStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
}

enum SaleStatus {
  PENDING
  APPROVED
  REJECTED
  REFUNDED
}

enum PayoutMethod {
  BANK_TRANSFER
  PAYPAL
  STRIPE
  CHECK
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum FraudType {
  SELF_REFERRAL
  BOT_TRAFFIC
  STOLEN_CARD
  DUPLICATE_ACCOUNT
  SUSPICIOUS_PATTERN
}

enum FraudSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### TypeScript Interfaces

```typescript
// types/referral-affiliate.ts

export interface ReferralLink {
  code: string;
  url: string;
  shortUrl?: string;
  qrCode?: string;
  eventId?: string;
  expiresAt?: Date;
}

export interface ReferralStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
  totalRewards: number;
  pendingRewards: number;
}

export interface AffiliatePortalData {
  partner: AffiliatePartner;
  stats: AffiliateStats;
  recentSales: AffiliateSale[];
  payouts: AffiliatePayout[];
  links: ReferralLink[];
}

export interface AffiliateStats {
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  paidCommission: number;
  pendingPayout: number;
  conversionRate: number;
  avgOrderValue: number;
}

export interface FraudAlert {
  id: string;
  type: FraudType;
  severity: FraudSeverity;
  description: string;
  userId?: string;
  referralId?: string;
  detectedAt: Date;
  recommendedAction: string;
}

export interface CommissionRule {
  minSales?: number;
  maxSales?: number;
  rate: number; // Percentage
  flatAmount?: number;
}
```

### API Routes

```typescript
// app/api/referrals/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { ReferralService } from '@/lib/services/referral.service';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const referral = await ReferralService.generateReferralLink({
    userId: session.user.id,
    programId: body.programId,
    eventId: body.eventId,
  });

  return NextResponse.json(referral, { status: 201 });
}

// app/api/referrals/[code]/track/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  await ReferralService.trackClick(params.code);
  return NextResponse.json({ success: true });
}

// app/api/referrals/stats/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await ReferralService.getReferralStats(session.user.id);
  return NextResponse.json(stats);
}

// app/api/affiliates/apply/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const application = await ReferralService.applyForAffiliateProgram({
    userId: session.user.id,
    programId: body.programId,
  });

  return NextResponse.json(application, { status: 201 });
}

// app/api/affiliates/portal/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portal = await ReferralService.getAffiliatePortalData(session.user.id);
  return NextResponse.json(portal);
}

// app/api/affiliates/payouts/request/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const payout = await ReferralService.requestPayout({
    userId: session.user.id,
    amount: body.amount,
    method: body.method,
  });

  return NextResponse.json(payout, { status: 201 });
}

// app/api/admin/fraud-alerts/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alerts = await ReferralService.getFraudAlerts();
  return NextResponse.json(alerts);
}
```

### Service Layer

```typescript
// lib/services/referral.service.ts

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { ReferralStats, AffiliatePortalData, FraudAlert } from '@/types/referral-affiliate';

export class ReferralService {
  static async generateReferralLink(params: {
    userId: string;
    programId: string;
    eventId?: string;
  }) {
    const code = nanoid(10);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const url = eventId
      ? `${baseUrl}/events/${params.eventId}?ref=${code}`
      : `${baseUrl}?ref=${code}`;

    const referral = await prisma.referral.create({
      data: {
        programId: params.programId,
        referrerId: params.userId,
        referralCode: code,
        referralUrl: url,
        status: 'ACTIVE',
      },
    });

    return {
      code,
      url,
      referral,
    };
  }

  static async trackClick(code: string) {
    await prisma.referral.update({
      where: { referralCode: code },
      data: {
        clicks: { increment: 1 },
      },
    });
  }

  static async trackConversion(params: {
    referralCode: string;
    orderId: string;
    userId: string;
    eventId: string;
  }) {
    const referral = await prisma.referral.findUnique({
      where: { referralCode: params.referralCode },
      include: { program: true },
    });

    if (!referral || referral.status !== 'ACTIVE') {
      return null;
    }

    // Check for fraud
    const fraudCheck = await this.checkForFraud({
      referralId: referral.id,
      referrerId: referral.referrerId,
      refereeId: params.userId,
      orderId: params.orderId,
    });

    if (fraudCheck.isFraud) {
      await this.logFraud({
        referralId: referral.id,
        userId: params.userId,
        fraudType: fraudCheck.type,
        severity: fraudCheck.severity,
        details: fraudCheck.details,
      });
      return null;
    }

    // Calculate reward
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order) return null;

    let rewardAmount = 0;
    if (referral.program.rewardType === 'CASH' || referral.program.rewardType === 'CREDIT') {
      if (referral.program.rewardPercent) {
        rewardAmount = Number(order.totalAmount) * (referral.program.rewardPercent / 100);
      } else {
        rewardAmount = Number(referral.program.rewardAmount);
      }
    }

    // Create conversion
    const conversion = await prisma.referralConversion.create({
      data: {
        referralId: referral.id,
        refereeId: params.userId,
        orderId: params.orderId,
        eventId: params.eventId,
        rewardAmount,
        status: 'APPROVED',
      },
    });

    // Update referral stats
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        conversions: { increment: 1 },
        revenue: { increment: order.totalAmount },
      },
    });

    // Apply reward to referrer
    await this.applyReward({
      userId: referral.referrerId,
      amount: rewardAmount,
      type: referral.program.rewardType,
    });

    return conversion;
  }

  static async getReferralStats(userId: string): Promise<ReferralStats> {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referees: true,
      },
    });

    const totalClicks = referrals.reduce((sum, r) => sum + r.clicks, 0);
    const totalConversions = referrals.reduce((sum, r) => sum + r.conversions, 0);
    const totalRevenue = referrals.reduce((sum, r) => sum + Number(r.revenue), 0);
    const totalRewards = referrals.reduce((sum, r) => sum + Number(r.rewardsPaid), 0);

    const pendingConversions = await prisma.referralConversion.findMany({
      where: {
        referral: { referrerId: userId },
        status: 'PENDING',
      },
    });

    const pendingRewards = pendingConversions.reduce(
      (sum, c) => sum + Number(c.rewardAmount),
      0
    );

    return {
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalRevenue,
      totalRewards,
      pendingRewards,
    };
  }

  static async applyForAffiliateProgram(params: {
    userId: string;
    programId: string;
  }) {
    const code = `AFF-${nanoid(8).toUpperCase()}`;

    return prisma.affiliatePartner.create({
      data: {
        programId: params.programId,
        userId: params.userId,
        affiliateCode: code,
        status: 'PENDING',
      },
    });
  }

  static async getAffiliatePortalData(userId: string): Promise<AffiliatePortalData> {
    const partner = await prisma.affiliatePartner.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        program: true,
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            order: true,
            event: true,
          },
        },
        payouts: {
          orderBy: { requestedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    const stats: AffiliateStats = {
      totalSales: partner.totalSales,
      totalRevenue: Number(partner.totalRevenue),
      totalCommission: Number(partner.totalCommission),
      paidCommission: Number(partner.paidCommission),
      pendingPayout: Number(partner.pendingPayout),
      conversionRate: 0, // Calculate from click tracking
      avgOrderValue: partner.totalSales > 0
        ? Number(partner.totalRevenue) / partner.totalSales
        : 0,
    };

    return {
      partner,
      stats,
      recentSales: partner.sales,
      payouts: partner.payouts,
      links: [],
    };
  }

  static async requestPayout(params: {
    userId: string;
    amount: number;
    method: string;
  }) {
    const partner = await prisma.affiliatePartner.findFirst({
      where: { userId: params.userId, status: 'ACTIVE' },
      include: { program: true },
    });

    if (!partner) {
      throw new Error('Affiliate partner not found');
    }

    if (Number(partner.pendingPayout) < params.amount) {
      throw new Error('Insufficient balance');
    }

    if (params.amount < Number(partner.program.payoutThreshold)) {
      throw new Error(`Minimum payout is ${partner.program.payoutThreshold}`);
    }

    return prisma.affiliatePayout.create({
      data: {
        partnerId: partner.id,
        amount: params.amount,
        method: params.method as any,
        status: 'PENDING',
        salesIncluded: [],
      },
    });
  }

  private static async checkForFraud(params: {
    referralId: string;
    referrerId: string;
    refereeId: string;
    orderId: string;
  }) {
    // Self-referral check
    if (params.referrerId === params.refereeId) {
      return {
        isFraud: true,
        type: 'SELF_REFERRAL',
        severity: 'HIGH',
        details: { reason: 'User referred themselves' },
      };
    }

    // Check for duplicate accounts (same IP, device)
    // Check for bot patterns
    // Check for stolen cards

    return {
      isFraud: false,
      type: null,
      severity: null,
      details: {},
    };
  }

  private static async logFraud(params: any) {
    await prisma.referralFraudLog.create({
      data: {
        referralId: params.referralId,
        userId: params.userId,
        fraudType: params.fraudType,
        severity: params.severity,
        details: params.details,
      },
    });
  }

  private static async applyReward(params: {
    userId: string;
    amount: number;
    type: string;
  }) {
    // Apply reward based on type (credit, cash, discount)
    if (params.type === 'CREDIT') {
      // Add to user's credit balance
    }
  }

  static async getFraudAlerts(): Promise<FraudAlert[]> {
    const logs = await prisma.referralFraudLog.findMany({
      where: { isReviewed: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map(log => ({
      id: log.id,
      type: log.fraudType as any,
      severity: log.severity as any,
      description: `Detected ${log.fraudType} activity`,
      userId: log.userId || undefined,
      referralId: log.referralId || undefined,
      detectedAt: log.createdAt,
      recommendedAction: this.getRecommendedAction(log.fraudType),
    }));
  }

  private static getRecommendedAction(fraudType: string): string {
    const actions: Record<string, string> = {
      SELF_REFERRAL: 'Block user and invalidate referral',
      BOT_TRAFFIC: 'Review IP and block if confirmed',
      STOLEN_CARD: 'Refund transaction and suspend account',
      DUPLICATE_ACCOUNT: 'Merge accounts or suspend duplicate',
      SUSPICIOUS_PATTERN: 'Flag for manual review',
    };
    return actions[fraudType] || 'Review and take appropriate action';
  }
}
```

---

## Testing Requirements

### Unit Tests
- Referral code generation
- Commission calculation
- Fraud detection logic
- Reward calculation
- Payout threshold validation

### Integration Tests
- Complete referral flow (click to conversion)
- Affiliate application and approval
- Commission tracking and payout
- Fraud detection and logging
- Reward application

### E2E Tests
- Generate and share referral link
- Complete purchase via referral link
- View referral dashboard and stats
- Apply for affiliate program
- Request payout as affiliate

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- [PAY-001: Square Payment Integration](../epic-003-payment/PAY-001-square-payment-integration.md)

### After
- MKT-014: Influencer Marketing Tools

---

## Definition of Done

- [ ] Prisma schema includes all referral/affiliate models
- [ ] Referral link generation and tracking
- [ ] Conversion attribution system
- [ ] Reward calculation and application
- [ ] Affiliate portal with dashboard
- [ ] Commission tracking and payouts
- [ ] Fraud detection system
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify flows
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Use short URLs for better sharing (bit.ly integration)
- Implement cookie-based tracking with 30-day window
- Consider tiered commission structures
- Store affiliate agreements and terms
- Implement automated payout processing
- Use webhooks for payment confirmation
- Add QR codes for offline referrals