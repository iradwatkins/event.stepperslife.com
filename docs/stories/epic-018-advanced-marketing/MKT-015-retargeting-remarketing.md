# MKT-015: Retargeting & Remarketing

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** retargeting and remarketing tools that re-engage visitors who didn't convert
**So that** I can recover abandoned carts, bring back interested users, and increase overall conversion rates

---

## Acceptance Criteria

### AC1: Facebook Pixel Integration
**Given** I want to track visitors on Facebook
**When** I install the Facebook Pixel
**Then** the pixel fires on all key pages (home, event, checkout)
**And** I can track custom events (view event, add to cart, purchase)
**And** pixel data syncs to Facebook Ads Manager
**And** I can create retargeting audiences based on pixel events

### AC2: Google Ads Remarketing Tags
**Given** I want to retarget on Google
**When** I install Google Ads remarketing tags
**Then** tags fire on all pages and track conversions
**And** I can create remarketing lists in Google Ads
**And** tags capture event-specific data for dynamic remarketing
**And** conversion tracking is accurate and verified

### AC3: Abandoned Cart Recovery
**Given** a user adds tickets to cart but doesn't complete purchase
**When** they abandon the cart
**Then** they receive an email reminder within 1 hour
**And** the email includes cart contents and a direct checkout link
**And** a second email is sent after 24 hours with a discount offer
**And** abandoned carts are tracked in analytics

### AC4: Browse Abandonment Tracking
**Given** a user views events but doesn't add to cart
**When** they leave without action
**Then** I can retarget them with ads for events they viewed
**And** they receive an email with similar event recommendations
**And** browse behavior is tracked for segmentation
**And** retargeting ads show event-specific content

### AC5: Dynamic Remarketing Ads
**Given** I want to show personalized ads
**When** users see remarketing ads
**Then** ads display the specific events they viewed
**And** ads include event images, dates, and pricing
**And** ads update automatically based on inventory
**And** I can A/B test different ad creatives

### AC6: Cross-Platform Retargeting
**Given** I run retargeting campaigns
**When** I coordinate across platforms
**Then** users see consistent messaging on Facebook, Google, Instagram, and display networks
**And** I can cap frequency across all platforms
**And** I track which platform drives conversions
**And** budget allocation optimizes based on performance

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model PixelEvent {
  id              String              @id @default(cuid())
  userId          String?
  sessionId       String
  eventType       PixelEventType
  eventData       Json
  pageUrl         String
  eventId         String?
  orderId         String?
  platform        RetargetPlatform
  timestamp       DateTime            @default(now())

  user            User?               @relation(fields: [userId], references: [id])
  event           Event?              @relation(fields: [eventId], references: [id])
  order           Order?              @relation(fields: [orderId], references: [id])

  @@index([userId, eventType])
  @@index([sessionId, timestamp])
  @@index([eventId])
}

model AbandonedCart {
  id              String              @id @default(cuid())
  userId          String?
  sessionId       String
  email           String?
  cartData        Json                // Items in cart
  totalAmount     Decimal             @db.Decimal(10, 2)
  eventId         String
  abandonedAt     DateTime            @default(now())
  recoveredAt     DateTime?
  orderId         String?             @unique
  remindersSent   Int                 @default(0)
  lastReminderAt  DateTime?

  user            User?               @relation(fields: [userId], references: [id])
  event           Event               @relation(fields: [eventId], references: [id])
  order           Order?              @relation(fields: [orderId], references: [id])

  @@index([userId, abandonedAt])
  @@index([email, abandonedAt])
  @@index([sessionId])
}

model BrowseAbandon {
  id              String              @id @default(cuid())
  userId          String?
  sessionId       String
  email           String?
  eventsViewed    String[]            // Event IDs
  categories      String[]
  lastViewedAt    DateTime            @default(now())
  reminderSent    Boolean             @default(false)
  reminderSentAt  DateTime?

  user            User?               @relation(fields: [userId], references: [id])

  @@index([userId, lastViewedAt])
  @@index([sessionId])
}

model RetargetingAudience {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  platform        RetargetPlatform
  audienceType    AudienceType
  criteria        Json                // Audience definition
  size            Int                 @default(0)
  externalId      String?             // Platform-specific audience ID
  syncStatus      SyncStatus          @default(PENDING)
  lastSyncAt      DateTime?
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())

  organizer       User                @relation(fields: [organizerId], references: [id])
  campaigns       RetargetCampaign[]

  @@index([organizerId, platform])
  @@index([platform, externalId])
}

model RetargetCampaign {
  id              String              @id @default(cuid())
  organizerId     String
  audienceId      String
  name            String
  platform        RetargetPlatform
  adCreative      Json                // Ad content and images
  budget          Decimal             @db.Decimal(10, 2)
  bidStrategy     String
  startDate       DateTime
  endDate         DateTime?
  status          CampaignStatus      @default(DRAFT)
  metrics         Json?               // Impressions, clicks, conversions

  organizer       User                @relation(fields: [organizerId], references: [id])
  audience        RetargetingAudience @relation(fields: [audienceId], references: [id])

  @@index([organizerId, status])
  @@index([audienceId])
}

model DynamicAdTemplate {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  platform        RetargetPlatform
  template        Json                // Ad template with variables
  eventId         String?
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())

  organizer       User                @relation(fields: [organizerId], references: [id])
  event           Event?              @relation(fields: [eventId], references: [id])

  @@index([organizerId, platform])
}

model RetargetingAnalytics {
  id              String              @id @default(cuid())
  campaignId      String?
  platform        RetargetPlatform
  date            DateTime
  impressions     Int                 @default(0)
  clicks          Int                 @default(0)
  conversions     Int                 @default(0)
  spend           Decimal             @default(0) @db.Decimal(10, 2)
  revenue         Decimal             @default(0) @db.Decimal(10, 2)
  ctr             Float               @default(0)
  cpc             Decimal             @default(0) @db.Decimal(10, 2)
  roas            Float               @default(0)

  campaign        RetargetCampaign?   @relation(fields: [campaignId], references: [id])

  @@unique([campaignId, platform, date])
  @@index([platform, date])
}

model FrequencyCap {
  id              String              @id @default(cuid())
  organizerId     String
  userId          String
  platform        RetargetPlatform
  impressions     Int                 @default(0)
  period          Int                 @default(7) // Days
  maxImpressions  Int                 @default(10)
  resetAt         DateTime

  organizer       User                @relation("OrganizerFrequencyCaps", fields: [organizerId], references: [id])
  user            User                @relation("UserFrequencyCaps", fields: [userId], references: [id])

  @@unique([userId, platform, organizerId])
  @@index([userId, resetAt])
}

enum PixelEventType {
  PAGE_VIEW
  VIEW_EVENT
  ADD_TO_CART
  INITIATE_CHECKOUT
  PURCHASE
  SEARCH
  LEAD
}

enum RetargetPlatform {
  FACEBOOK
  GOOGLE
  INSTAGRAM
  TIKTOK
  LINKEDIN
  DISPLAY_NETWORK
}

enum AudienceType {
  ABANDONED_CART
  BROWSE_ABANDON
  EVENT_VIEWERS
  PAST_PURCHASERS
  ENGAGED_USERS
  CUSTOM
}

enum SyncStatus {
  PENDING
  SYNCING
  SYNCED
  FAILED
}
```

### TypeScript Interfaces

```typescript
// types/retargeting.ts

export interface PixelConfiguration {
  facebook: {
    pixelId: string;
    accessToken?: string;
    testCode?: string;
  };
  google: {
    conversionId: string;
    conversionLabel?: string;
  };
  tiktok?: {
    pixelId: string;
  };
}

export interface AbandonedCartData {
  sessionId: string;
  userId?: string;
  email?: string;
  items: CartItem[];
  totalAmount: number;
  eventId: string;
  abandonedAt: Date;
}

export interface CartItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  price: number;
}

export interface RetargetingAudienceConfig {
  name: string;
  platform: RetargetPlatform;
  type: AudienceType;
  criteria: AudienceCriteria;
}

export interface AudienceCriteria {
  events?: string[]; // Event IDs
  dateRange?: { start: Date; end: Date };
  excludePurchasers?: boolean;
  minViewTime?: number; // Seconds
  categories?: string[];
}

export interface DynamicAdConfig {
  headline: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  variables: Record<string, string>; // e.g., {{event_name}}, {{event_date}}
}

export interface RetargetingMetrics {
  platform: RetargetPlatform;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

export interface CrossPlatformCampaign {
  name: string;
  message: string;
  platforms: RetargetPlatform[];
  budget: Record<RetargetPlatform, number>;
  frequencyCap: number;
  startDate: Date;
  endDate?: Date;
}
```

### API Routes

```typescript
// app/api/retargeting/pixel/facebook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { RetargetingService } from '@/lib/services/retargeting.service';

export async function POST(request: NextRequest) {
  const body = await request.json();

  await RetargetingService.trackPixelEvent({
    platform: 'FACEBOOK',
    eventType: body.eventType,
    eventData: body.eventData,
    sessionId: body.sessionId,
    userId: body.userId,
    eventId: body.eventId,
  });

  return NextResponse.json({ success: true });
}

// app/api/retargeting/abandoned-carts/route.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const carts = await RetargetingService.getAbandonedCarts({
    organizerId: session.user.id,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return NextResponse.json(carts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const cart = await RetargetingService.trackAbandonedCart({
    sessionId: body.sessionId,
    userId: body.userId,
    email: body.email,
    cartData: body.cartData,
    totalAmount: body.totalAmount,
    eventId: body.eventId,
  });

  return NextResponse.json(cart, { status: 201 });
}

// app/api/retargeting/audiences/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const audience = await RetargetingService.createAudience({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(audience, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const audiences = await RetargetingService.listAudiences(session.user.id);
  return NextResponse.json(audiences);
}

// app/api/retargeting/audiences/[audienceId]/sync/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { audienceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await RetargetingService.syncAudience({
    audienceId: params.audienceId,
    organizerId: session.user.id,
  });

  return NextResponse.json(result);
}

// app/api/retargeting/campaigns/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const campaign = await RetargetingService.createCampaign({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(campaign, { status: 201 });
}

// app/api/retargeting/analytics/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const platform = searchParams.get('platform');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const analytics = await RetargetingService.getAnalytics({
    organizerId: session.user.id,
    platform: platform as any,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return NextResponse.json(analytics);
}
```

### Service Layer

```typescript
// lib/services/retargeting.service.ts

import { prisma } from '@/lib/prisma';
import { FacebookAdsAPI } from '@/lib/integrations/facebook-ads';
import { GoogleAdsAPI } from '@/lib/integrations/google-ads';
import { EmailService } from './email.service';

export class RetargetingService {
  static async trackPixelEvent(data: any) {
    return prisma.pixelEvent.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        eventType: data.eventType,
        eventData: data.eventData,
        pageUrl: data.pageUrl || '',
        eventId: data.eventId,
        orderId: data.orderId,
        platform: data.platform,
      },
    });
  }

  static async trackAbandonedCart(data: AbandonedCartData) {
    const cart = await prisma.abandonedCart.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        email: data.email,
        cartData: data.cartData,
        totalAmount: data.totalAmount,
        eventId: data.eventId,
      },
    });

    // Schedule reminder emails
    await this.scheduleAbandonedCartReminders(cart.id);

    return cart;
  }

  static async getAbandonedCarts(params: {
    organizerId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.abandonedCart.findMany({
      where: {
        event: { organizerId: params.organizerId },
        abandonedAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        recoveredAt: null,
      },
      include: {
        event: true,
        user: true,
      },
      orderBy: { abandonedAt: 'desc' },
    });
  }

  static async scheduleAbandonedCartReminders(cartId: string) {
    // Schedule email after 1 hour
    setTimeout(async () => {
      await this.sendAbandonedCartEmail(cartId, 1);
    }, 60 * 60 * 1000);

    // Schedule second email after 24 hours
    setTimeout(async () => {
      await this.sendAbandonedCartEmail(cartId, 2);
    }, 24 * 60 * 60 * 1000);
  }

  static async sendAbandonedCartEmail(cartId: string, reminderNumber: number) {
    const cart = await prisma.abandonedCart.findUnique({
      where: { id: cartId },
      include: { event: true },
    });

    if (!cart || cart.recoveredAt || !cart.email) {
      return;
    }

    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${cart.sessionId}`;
    const discount = reminderNumber === 2 ? 10 : 0; // 10% off on second reminder

    await EmailService.sendAbandonedCartEmail({
      to: cart.email,
      cartData: cart.cartData,
      event: cart.event,
      checkoutUrl,
      discount,
    });

    await prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });
  }

  static async createAudience(config: RetargetingAudienceConfig & { organizerId: string }) {
    const audience = await prisma.retargetingAudience.create({
      data: {
        organizerId: config.organizerId,
        name: config.name,
        platform: config.platform,
        audienceType: config.type,
        criteria: config.criteria,
      },
    });

    // Build audience and sync to platform
    await this.buildAndSyncAudience(audience.id);

    return audience;
  }

  static async buildAndSyncAudience(audienceId: string) {
    const audience = await prisma.retargetingAudience.findUnique({
      where: { id: audienceId },
    });

    if (!audience) return;

    // Build audience based on criteria
    const userIds = await this.buildAudienceUserList(audience.criteria);

    // Sync to platform
    let externalId: string | null = null;

    if (audience.platform === 'FACEBOOK') {
      externalId = await FacebookAdsAPI.createCustomAudience({
        name: audience.name,
        userIds,
      });
    } else if (audience.platform === 'GOOGLE') {
      externalId = await GoogleAdsAPI.createRemarketingList({
        name: audience.name,
        userIds,
      });
    }

    await prisma.retargetingAudience.update({
      where: { id: audienceId },
      data: {
        size: userIds.length,
        externalId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      },
    });
  }

  static async syncAudience(params: { audienceId: string; organizerId: string }) {
    await this.buildAndSyncAudience(params.audienceId);
    return { success: true };
  }

  static async createCampaign(data: any) {
    return prisma.retargetCampaign.create({
      data: {
        organizerId: data.organizerId,
        audienceId: data.audienceId,
        name: data.name,
        platform: data.platform,
        adCreative: data.adCreative,
        budget: data.budget,
        bidStrategy: data.bidStrategy || 'LOWEST_COST',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'DRAFT',
      },
    });
  }

  static async getAnalytics(params: {
    organizerId: string;
    platform?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.retargetingAnalytics.findMany({
      where: {
        campaign: { organizerId: params.organizerId },
        platform: params.platform as any,
        date: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  static async checkFrequencyCap(
    userId: string,
    platform: RetargetPlatform,
    organizerId: string
  ): Promise<boolean> {
    const cap = await prisma.frequencyCap.findUnique({
      where: {
        userId_platform_organizerId: {
          userId,
          platform,
          organizerId,
        },
      },
    });

    if (!cap) {
      // Create new cap
      await prisma.frequencyCap.create({
        data: {
          userId,
          platform,
          organizerId,
          impressions: 1,
          resetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return true;
    }

    // Check if reset needed
    if (cap.resetAt < new Date()) {
      await prisma.frequencyCap.update({
        where: { id: cap.id },
        data: {
          impressions: 1,
          resetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return true;
    }

    // Check if under cap
    if (cap.impressions < cap.maxImpressions) {
      await prisma.frequencyCap.update({
        where: { id: cap.id },
        data: { impressions: { increment: 1 } },
      });
      return true;
    }

    return false;
  }

  private static async buildAudienceUserList(criteria: any): Promise<string[]> {
    // Build user list based on criteria
    let query: any = {};

    if (criteria.type === 'ABANDONED_CART') {
      const carts = await prisma.abandonedCart.findMany({
        where: {
          recoveredAt: null,
          abandonedAt: {
            gte: criteria.dateRange?.start,
            lte: criteria.dateRange?.end,
          },
        },
        select: { userId: true, email: true },
      });
      return carts.map(c => c.userId || c.email).filter(Boolean);
    }

    if (criteria.type === 'EVENT_VIEWERS') {
      const events = await prisma.pixelEvent.findMany({
        where: {
          eventType: 'VIEW_EVENT',
          eventId: { in: criteria.events },
          timestamp: {
            gte: criteria.dateRange?.start,
            lte: criteria.dateRange?.end,
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      return events.map(e => e.userId).filter(Boolean);
    }

    return [];
  }

  static async listAudiences(organizerId: string) {
    return prisma.retargetingAudience.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

## Testing Requirements

### Unit Tests
- Pixel event tracking
- Abandoned cart detection
- Frequency cap logic
- Audience building criteria
- ROAS calculation

### Integration Tests
- Complete retargeting flow
- Facebook Pixel integration
- Google Ads integration
- Abandoned cart email sequence
- Audience sync to platforms

### E2E Tests
- Track user journey with pixel
- Abandon cart and receive email
- View retargeting ads
- Complete purchase from retarget
- Frequency cap enforcement

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- [PAY-001: Square Payment Integration](../epic-003-payment/PAY-001-square-payment-integration.md)
- MKT-001: Email Campaign Management

### After
- MKT-016: Marketing Compliance & Consent

---

## Definition of Done

- [ ] Prisma schema includes all retargeting models
- [ ] Facebook Pixel integration
- [ ] Google Ads remarketing tags
- [ ] Abandoned cart tracking and recovery
- [ ] Browse abandonment tracking
- [ ] Dynamic remarketing ads
- [ ] Cross-platform coordination
- [ ] Frequency capping
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify flows
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Use GTM for tag management
- Implement server-side tracking for privacy
- Consider iOS14+ tracking limitations
- Use Conversions API for Facebook
- Implement cookie consent integration
- Add retargeting exclusion lists
- Monitor ad fatigue with frequency data