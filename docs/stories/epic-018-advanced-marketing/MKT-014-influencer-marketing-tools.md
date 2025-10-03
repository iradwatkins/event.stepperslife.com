# MKT-014: Influencer Marketing Tools

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** specialized influencer marketing tools to manage partnerships, track performance, and automate payouts
**So that** I can scale influencer campaigns, measure ROI, and grow event awareness through trusted voices

---

## Acceptance Criteria

### AC1: Influencer Partner Portal
**Given** I am an approved influencer
**When** I log into my partner portal
**Then** I see my performance dashboard with metrics (clicks, conversions, revenue)
**And** I can access my custom promo codes and tracking links
**And** I see upcoming events I can promote
**And** I can download promotional assets (images, videos, copy)

### AC2: Custom Promo Code Generation
**Given** I want to create influencer campaigns
**When** I generate a promo code for an influencer
**Then** the code is unique and tracked to the influencer
**And** I can set discount amounts and usage limits
**And** the code is automatically active within specified dates
**And** I can customize the code text for brand alignment

### AC3: Performance Dashboard
**Given** an influencer promotes my events
**When** I view their performance dashboard
**Then** I see clicks, impressions, conversions, and revenue generated
**And** I can compare performance across multiple influencers
**And** I see engagement metrics (likes, shares, comments on influencer posts)
**And** I receive weekly performance summaries via email

### AC4: Media Kit & Asset Library
**Given** I want influencers to have promotion materials
**When** they access the asset library
**Then** they can download event images, videos, logos, and brand guidelines
**And** they see pre-written captions and hashtags
**And** assets are organized by event and campaign
**And** I can control access permissions per influencer

### AC5: Campaign Brief Management
**Given** I launch an influencer campaign
**When** I create a campaign brief
**Then** I can set goals, deliverables, and timelines
**And** influencers receive notifications and can accept or decline
**And** I can track deliverable completion (posts, stories, videos)
**And** briefs include talking points and key messages

### AC6: Automated Payout System
**Given** influencers generate sales
**When** payout conditions are met
**Then** commissions are calculated automatically
**And** influencers receive payout notifications
**And** payments are processed via their preferred method (PayPal, Stripe, bank transfer)
**And** all transactions are logged for tax reporting

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model InfluencerPartner {
  id                String              @id @default(cuid())
  userId            String              @unique
  organizerId       String
  status            InfluencerStatus    @default(PENDING)
  tier              InfluencerTier      @default(MICRO)
  commissionRate    Decimal             @db.Decimal(5, 2)
  bio               String?             @db.Text
  socialMedia       Json                // Links to social profiles
  followerCount     Int?
  engagementRate    Float?
  categories        String[]            // Event categories they promote
  joinedAt          DateTime            @default(now())
  approvedAt        DateTime?

  user              User                @relation(fields: [userId], references: [id])
  organizer         User                @relation("OrganizerInfluencers", fields: [organizerId], references: [id])
  promoCodes        InfluencerPromoCode[]
  campaigns         InfluencerCampaign[]
  content           InfluencerContent[]
  analytics         InfluencerAnalytics[]
  payouts           InfluencerPayout[]

  @@index([organizerId, status, tier])
  @@index([userId])
}

model InfluencerPromoCode {
  id                String              @id @default(cuid())
  partnerId         String
  code              String              @unique
  discountType      DiscountType
  discountValue     Decimal             @db.Decimal(10, 2)
  maxUses           Int?
  usedCount         Int                 @default(0)
  minPurchase       Decimal?            @db.Decimal(10, 2)
  validFrom         DateTime            @default(now())
  validUntil        DateTime
  isActive          Boolean             @default(true)
  eventId           String?

  partner           InfluencerPartner   @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  event             Event?              @relation(fields: [eventId], references: [id])
  orders            Order[]

  @@index([code, isActive])
  @@index([partnerId])
}

model InfluencerCampaign {
  id                String              @id @default(cuid())
  organizerId       String
  name              String
  description       String              @db.Text
  goals             Json                // Campaign objectives
  deliverables      Json                // Expected content (posts, stories, etc.)
  budget            Decimal?            @db.Decimal(10, 2)
  startDate         DateTime
  endDate           DateTime
  status            CampaignStatus      @default(DRAFT)
  createdAt         DateTime            @default(now())

  organizer         User                @relation(fields: [organizerId], references: [id])
  partners          InfluencerPartner[]
  content           InfluencerContent[]
  briefs            CampaignBrief[]

  @@index([organizerId, status])
}

model CampaignBrief {
  id                String              @id @default(cuid())
  campaignId        String
  title             String
  description       String              @db.Text
  deliverables      Json                // What influencer needs to create
  talkingPoints     String[]
  hashtags          String[]
  deadline          DateTime
  compensation      Decimal?            @db.Decimal(10, 2)
  status            BriefStatus         @default(PENDING)
  createdAt         DateTime            @default(now())

  campaign          InfluencerCampaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([campaignId, status])
}

model InfluencerContent {
  id                String              @id @default(cuid())
  partnerId         String
  campaignId        String?
  contentType       ContentType
  platform          SocialPlatform
  postUrl           String?
  caption           String?             @db.Text
  mediaUrls         String[]
  publishedAt       DateTime?
  metrics           Json?               // Likes, shares, comments, views
  status            ContentStatus       @default(PENDING)
  isApproved        Boolean             @default(false)
  createdAt         DateTime            @default(now())

  partner           InfluencerPartner   @relation(fields: [partnerId], references: [id])
  campaign          InfluencerCampaign? @relation(fields: [campaignId], references: [id])

  @@index([partnerId, campaignId])
  @@index([status])
}

model AssetLibrary {
  id                String              @id @default(cuid())
  organizerId       String
  eventId           String?
  name              String
  description       String?
  assetType         AssetType
  fileUrl           String
  fileSize          Int
  mimeType          String
  thumbnailUrl      String?
  tags              String[]
  isPublic          Boolean             @default(false)
  downloadCount     Int                 @default(0)
  createdAt         DateTime            @default(now())

  organizer         User                @relation(fields: [organizerId], references: [id])
  event             Event?              @relation(fields: [eventId], references: [id])

  @@index([organizerId, assetType])
  @@index([eventId])
}

model InfluencerAnalytics {
  id                String              @id @default(cuid())
  partnerId         String
  date              DateTime
  clicks            Int                 @default(0)
  impressions       Int                 @default(0)
  conversions       Int                 @default(0)
  revenue           Decimal             @default(0) @db.Decimal(10, 2)
  commission        Decimal             @default(0) @db.Decimal(10, 2)
  engagement        Json?               // Social media engagement metrics

  partner           InfluencerPartner   @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@unique([partnerId, date])
  @@index([partnerId, date])
}

model InfluencerPayout {
  id                String              @id @default(cuid())
  partnerId         String
  amount            Decimal             @db.Decimal(10, 2)
  method            PayoutMethod
  status            PayoutStatus        @default(PENDING)
  period            Json                // Date range for this payout
  salesIncluded     Json                // Order IDs included
  requestedAt       DateTime            @default(now())
  processedAt       DateTime?
  paidAt            DateTime?
  transactionId     String?
  notes             String?

  partner           InfluencerPartner   @relation(fields: [partnerId], references: [id])

  @@index([partnerId, status])
}

enum InfluencerStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
}

enum InfluencerTier {
  NANO          // 1K-10K followers
  MICRO         // 10K-50K followers
  MID           // 50K-500K followers
  MACRO         // 500K-1M followers
  MEGA          // 1M+ followers
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum BriefStatus {
  PENDING
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  REJECTED
}

enum ContentType {
  POST
  STORY
  REEL
  VIDEO
  BLOG
  LIVE
}

enum SocialPlatform {
  INSTAGRAM
  TIKTOK
  YOUTUBE
  FACEBOOK
  TWITTER
  LINKEDIN
}

enum ContentStatus {
  PENDING
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

enum AssetType {
  IMAGE
  VIDEO
  LOGO
  BANNER
  GUIDE
  TEMPLATE
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}
```

### TypeScript Interfaces

```typescript
// types/influencer-marketing.ts

export interface InfluencerPortalData {
  partner: InfluencerPartner;
  stats: InfluencerStats;
  promoCodes: InfluencerPromoCode[];
  upcomingEvents: Event[];
  campaigns: InfluencerCampaign[];
  assets: AssetLibrary[];
}

export interface InfluencerStats {
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayout: number;
  conversionRate: number;
  avgOrderValue: number;
  lastPayout?: InfluencerPayout;
}

export interface CampaignDeliverables {
  instagram: {
    posts?: number;
    stories?: number;
    reels?: number;
  };
  tiktok: {
    videos?: number;
  };
  youtube: {
    videos?: number;
    shorts?: number;
  };
  blog?: {
    articles?: number;
  };
}

export interface SocialMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves?: number;
  engagementRate: number;
}

export interface CampaignBriefData {
  title: string;
  description: string;
  deliverables: CampaignDeliverables;
  talkingPoints: string[];
  hashtags: string[];
  doNotMention?: string[];
  compensation: number;
  deadline: Date;
  assets: string[]; // Asset IDs
}

export interface InfluencerPerformance {
  partnerId: string;
  partnerName: string;
  tier: string;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  roi: number;
  engagementRate: number;
  contentCount: number;
}
```

### API Routes

```typescript
// app/api/influencers/apply/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { InfluencerService } from '@/lib/services/influencer.service';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const application = await InfluencerService.applyAsInfluencer({
    userId: session.user.id,
    organizerId: body.organizerId,
    bio: body.bio,
    socialMedia: body.socialMedia,
    followerCount: body.followerCount,
    categories: body.categories,
  });

  return NextResponse.json(application, { status: 201 });
}

// app/api/influencers/portal/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portal = await InfluencerService.getPortalData(session.user.id);
  return NextResponse.json(portal);
}

// app/api/influencers/promo-codes/generate/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const promoCode = await InfluencerService.generatePromoCode({
    partnerId: body.partnerId,
    code: body.code,
    discountType: body.discountType,
    discountValue: body.discountValue,
    eventId: body.eventId,
    validUntil: new Date(body.validUntil),
  });

  return NextResponse.json(promoCode, { status: 201 });
}

// app/api/influencers/campaigns/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const campaign = await InfluencerService.createCampaign({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(campaign, { status: 201 });
}

// app/api/influencers/campaigns/[campaignId]/briefs/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const brief = await InfluencerService.createCampaignBrief({
    campaignId: params.campaignId,
    ...body,
  });

  return NextResponse.json(brief, { status: 201 });
}

// app/api/influencers/content/submit/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const content = await InfluencerService.submitContent({
    userId: session.user.id,
    campaignId: body.campaignId,
    contentType: body.contentType,
    platform: body.platform,
    postUrl: body.postUrl,
    caption: body.caption,
    mediaUrls: body.mediaUrls,
  });

  return NextResponse.json(content, { status: 201 });
}

// app/api/influencers/assets/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('eventId');

  const assets = await InfluencerService.getAssets({
    eventId: eventId || undefined,
  });

  return NextResponse.json(assets);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const asset = await InfluencerService.uploadAsset({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(asset, { status: 201 });
}

// app/api/influencers/payouts/request/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const payout = await InfluencerService.requestPayout({
    userId: session.user.id,
    amount: body.amount,
    method: body.method,
  });

  return NextResponse.json(payout, { status: 201 });
}

// app/api/influencers/performance/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const performance = await InfluencerService.getPerformanceReport(session.user.id);
  return NextResponse.json(performance);
}
```

### Service Layer

```typescript
// lib/services/influencer.service.ts

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { InfluencerPortalData, InfluencerStats } from '@/types/influencer-marketing';

export class InfluencerService {
  static async applyAsInfluencer(data: any) {
    return prisma.influencerPartner.create({
      data: {
        userId: data.userId,
        organizerId: data.organizerId,
        status: 'PENDING',
        tier: this.calculateTier(data.followerCount),
        commissionRate: this.getDefaultCommissionRate(data.followerCount),
        bio: data.bio,
        socialMedia: data.socialMedia,
        followerCount: data.followerCount,
        categories: data.categories,
      },
    });
  }

  static async getPortalData(userId: string): Promise<InfluencerPortalData> {
    const partner = await prisma.influencerPartner.findUnique({
      where: { userId },
      include: {
        promoCodes: {
          where: { isActive: true },
        },
        campaigns: {
          where: { status: 'ACTIVE' },
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        payouts: {
          orderBy: { requestedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!partner) {
      throw new Error('Influencer partner not found');
    }

    const stats = await this.calculateStats(partner.id);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        organizerId: partner.organizerId,
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
      take: 10,
    });

    const assets = await prisma.assetLibrary.findMany({
      where: {
        organizerId: partner.organizerId,
        OR: [
          { isPublic: true },
          { eventId: { in: upcomingEvents.map(e => e.id) } },
        ],
      },
    });

    return {
      partner,
      stats,
      promoCodes: partner.promoCodes,
      upcomingEvents,
      campaigns: partner.campaigns,
      assets,
    };
  }

  static async generatePromoCode(data: any) {
    return prisma.influencerPromoCode.create({
      data: {
        partnerId: data.partnerId,
        code: data.code || this.generateCode(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        eventId: data.eventId,
        validUntil: data.validUntil,
        maxUses: data.maxUses,
        minPurchase: data.minPurchase,
      },
    });
  }

  static async createCampaign(data: any) {
    return prisma.influencerCampaign.create({
      data: {
        organizerId: data.organizerId,
        name: data.name,
        description: data.description,
        goals: data.goals,
        deliverables: data.deliverables,
        budget: data.budget,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'DRAFT',
      },
    });
  }

  static async createCampaignBrief(data: CampaignBriefData & { campaignId: string }) {
    return prisma.campaignBrief.create({
      data: {
        campaignId: data.campaignId,
        title: data.title,
        description: data.description,
        deliverables: data.deliverables,
        talkingPoints: data.talkingPoints,
        hashtags: data.hashtags,
        deadline: data.deadline,
        compensation: data.compensation,
        status: 'PENDING',
      },
    });
  }

  static async submitContent(data: any) {
    const partner = await prisma.influencerPartner.findUnique({
      where: { userId: data.userId },
    });

    if (!partner) {
      throw new Error('Influencer partner not found');
    }

    return prisma.influencerContent.create({
      data: {
        partnerId: partner.id,
        campaignId: data.campaignId,
        contentType: data.contentType,
        platform: data.platform,
        postUrl: data.postUrl,
        caption: data.caption,
        mediaUrls: data.mediaUrls,
        status: 'PENDING',
      },
    });
  }

  static async getAssets(params: { eventId?: string }) {
    return prisma.assetLibrary.findMany({
      where: {
        eventId: params.eventId,
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async uploadAsset(data: any) {
    return prisma.assetLibrary.create({
      data: {
        organizerId: data.organizerId,
        eventId: data.eventId,
        name: data.name,
        description: data.description,
        assetType: data.assetType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
      },
    });
  }

  static async requestPayout(params: {
    userId: string;
    amount: number;
    method: string;
  }) {
    const partner = await prisma.influencerPartner.findUnique({
      where: { userId: params.userId },
    });

    if (!partner) {
      throw new Error('Influencer partner not found');
    }

    const stats = await this.calculateStats(partner.id);

    if (stats.pendingPayout < params.amount) {
      throw new Error('Insufficient balance for payout');
    }

    return prisma.influencerPayout.create({
      data: {
        partnerId: partner.id,
        amount: params.amount,
        method: params.method as any,
        status: 'PENDING',
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        salesIncluded: [],
      },
    });
  }

  static async getPerformanceReport(organizerId: string) {
    const partners = await prisma.influencerPartner.findMany({
      where: { organizerId, status: 'ACTIVE' },
      include: {
        analytics: true,
        content: true,
      },
    });

    return Promise.all(
      partners.map(async partner => {
        const stats = await this.calculateStats(partner.id);
        return {
          partnerId: partner.id,
          partnerName: partner.user?.name || 'Unknown',
          tier: partner.tier,
          totalSales: stats.totalConversions,
          totalRevenue: stats.totalRevenue,
          conversionRate: stats.conversionRate,
          roi: stats.totalRevenue / stats.totalCommission,
          engagementRate: partner.engagementRate || 0,
          contentCount: partner.content.length,
        };
      })
    );
  }

  private static async calculateStats(partnerId: string): Promise<InfluencerStats> {
    const analytics = await prisma.influencerAnalytics.findMany({
      where: { partnerId },
    });

    const totalClicks = analytics.reduce((sum, a) => sum + a.clicks, 0);
    const totalImpressions = analytics.reduce((sum, a) => sum + a.impressions, 0);
    const totalConversions = analytics.reduce((sum, a) => sum + a.conversions, 0);
    const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.revenue), 0);
    const totalCommission = analytics.reduce((sum, a) => sum + Number(a.commission), 0);

    const payouts = await prisma.influencerPayout.findMany({
      where: { partnerId, status: 'COMPLETED' },
    });

    const paidOut = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPayout = totalCommission - paidOut;

    return {
      totalClicks,
      totalImpressions,
      totalConversions,
      totalRevenue,
      totalCommission,
      pendingPayout,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      avgOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0,
      lastPayout: payouts[payouts.length - 1],
    };
  }

  private static calculateTier(followerCount?: number): string {
    if (!followerCount) return 'NANO';
    if (followerCount >= 1000000) return 'MEGA';
    if (followerCount >= 500000) return 'MACRO';
    if (followerCount >= 50000) return 'MID';
    if (followerCount >= 10000) return 'MICRO';
    return 'NANO';
  }

  private static getDefaultCommissionRate(followerCount?: number): number {
    const tier = this.calculateTier(followerCount);
    const rates: Record<string, number> = {
      NANO: 5,
      MICRO: 7.5,
      MID: 10,
      MACRO: 12.5,
      MEGA: 15,
    };
    return rates[tier] || 5;
  }

  private static generateCode(): string {
    return `INF-${nanoid(6).toUpperCase()}`;
  }
}
```

---

## Testing Requirements

### Unit Tests
- Commission rate calculation by tier
- Promo code validation
- Stats calculation
- Tier determination logic
- Payout threshold checks

### Integration Tests
- Influencer application and approval
- Campaign creation and brief assignment
- Content submission and approval
- Promo code usage tracking
- Payout processing

### E2E Tests
- Apply as influencer partner
- Access portal and view dashboard
- Generate and use promo code
- Submit content for campaign
- Request and receive payout

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- MKT-013: Referral & Affiliate Programs

### After
- MKT-015: Retargeting & Remarketing

---

## Definition of Done

- [ ] Prisma schema includes all influencer models
- [ ] Influencer partner portal
- [ ] Custom promo code generation
- [ ] Performance dashboard
- [ ] Media kit and asset library
- [ ] Campaign brief management
- [ ] Automated payout system
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify flows
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Integrate with social media APIs for metrics
- Use Cloudflare for asset CDN
- Implement contract/agreement management
- Add influencer discovery features
- Consider tiered commission structures
- Track influencer content compliance
- Use background jobs for payout processing