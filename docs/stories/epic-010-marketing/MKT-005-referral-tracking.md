# MKT-005: Referral Tracking & Attribution

**Epic:** EPIC-010: Marketing & Communications
**Story Points:** 5
**Priority:** Medium
**Status:** Ready for Development

---

## User Story

**As an** event organizer
**I want to** track where my ticket sales are coming from
**So that** I can measure marketing effectiveness and optimize my promotional efforts

---

## Acceptance Criteria

### UTM Parameter Tracking
- [ ] System captures UTM parameters from event page URLs
- [ ] System tracks: utm_source, utm_medium, utm_campaign, utm_term, utm_content
- [ ] System stores UTM data with page view timestamp
- [ ] System associates UTM data with subsequent ticket purchase
- [ ] Organizer can view traffic sources in analytics dashboard
- [ ] System persists UTM data across user session
- [ ] System handles missing or partial UTM parameters gracefully

### Referral Link Generation
- [ ] Organizer can generate custom referral links for event
- [ ] System auto-generates links with pre-filled UTM parameters
- [ ] Organizer can specify source, medium, and campaign names
- [ ] System provides shortened link option (via Bitly integration)
- [ ] Organizer can copy link with one click
- [ ] System displays QR code for referral link
- [ ] Organizer can create multiple links for different channels

### Traffic Source Attribution
- [ ] System identifies organic sources (direct, search, social)
- [ ] System detects referrer domain (Google, Facebook, Instagram, etc.)
- [ ] System categorizes traffic into channels: Direct, Organic Search, Paid Search, Social, Email, Referral
- [ ] System stores first-touch attribution (initial visit source)
- [ ] System stores last-touch attribution (source before purchase)
- [ ] Organizer can view multi-touch attribution path
- [ ] System handles unknown/missing referrers

### Cookie-Based Tracking
- [ ] System sets first-party cookie on event page visit
- [ ] Cookie stores UTM parameters and referrer information
- [ ] Cookie persists for 30 days
- [ ] System updates cookie on subsequent visits
- [ ] System associates cookie data with user account after login
- [ ] System respects user privacy preferences (GDPR/CCPA)
- [ ] System provides cookie consent banner

### Analytics Dashboard
- [ ] Dashboard displays top traffic sources by visits
- [ ] Dashboard shows conversion rate per source
- [ ] Dashboard displays revenue by source
- [ ] Organizer can filter by date range
- [ ] Dashboard shows source comparison (period over period)
- [ ] Dashboard displays funnel: Visits → Ticket Views → Add to Cart → Purchase
- [ ] Organizer can export attribution report to CSV

### Campaign Performance
- [ ] Organizer can view performance by campaign name
- [ ] System tracks clicks, views, conversions per campaign
- [ ] Dashboard shows ROI per campaign (if cost data provided)
- [ ] Organizer can compare multiple campaigns side-by-side
- [ ] System identifies best-performing channels
- [ ] Dashboard displays campaign timeline with milestones

### Influencer/Partner Tracking
- [ ] Organizer can create unique referral codes for partners
- [ ] System tracks sales attributed to each partner code
- [ ] Dashboard shows partner performance leaderboard
- [ ] Organizer can set commission rate per partner
- [ ] System calculates commission owed to partners
- [ ] Organizer can export partner payout report

---

## Technical Requirements

### UTM Tracking Implementation
```typescript
// UTM Parameter Capture Service
interface UTMParameters {
  utm_source?: string;      // e.g., "facebook", "newsletter", "google"
  utm_medium?: string;      // e.g., "social", "email", "cpc"
  utm_campaign?: string;    // e.g., "spring_sale", "launch"
  utm_term?: string;        // e.g., "steppers+event" (for paid search)
  utm_content?: string;     // e.g., "banner_ad", "link_1"
}

interface TrafficAttribution {
  id: string;
  eventId: string;
  sessionId: string;
  userId?: string;

  // UTM Parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // Referrer Data
  referrer?: string;
  referrerDomain?: string;
  channel: TrafficChannel;

  // Timestamps
  firstVisitAt: Date;
  lastVisitAt: Date;
  convertedAt?: Date;

  // Attribution
  orderId?: string;
  revenue?: number;

  // Device & Location
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
}

export class UTMTrackingService {
  captureUTMParameters(url: URL): UTMParameters {
    return {
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined,
      utm_term: url.searchParams.get('utm_term') || undefined,
      utm_content: url.searchParams.get('utm_content') || undefined,
    };
  }

  async trackPageView(
    eventId: string,
    sessionId: string,
    request: Request
  ): Promise<void> {
    const url = new URL(request.url);
    const utmParams = this.captureUTMParameters(url);
    const referrer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');

    // Determine traffic channel
    const channel = this.categorizeTrafficChannel(utmParams, referrer);

    // Check for existing session
    let attribution = await prisma.trafficAttribution.findFirst({
      where: { sessionId, eventId },
    });

    if (attribution) {
      // Update last visit
      await prisma.trafficAttribution.update({
        where: { id: attribution.id },
        data: {
          lastVisitAt: new Date(),
          // Update UTM if new ones provided
          ...(utmParams.utm_source && { utmSource: utmParams.utm_source }),
          ...(utmParams.utm_medium && { utmMedium: utmParams.utm_medium }),
          ...(utmParams.utm_campaign && { utmCampaign: utmParams.utm_campaign }),
        },
      });
    } else {
      // Create new attribution record
      attribution = await prisma.trafficAttribution.create({
        data: {
          eventId,
          sessionId,
          utmSource: utmParams.utm_source,
          utmMedium: utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
          utmTerm: utmParams.utm_term,
          utmContent: utmParams.utm_content,
          referrer,
          referrerDomain: this.extractDomain(referrer),
          channel,
          firstVisitAt: new Date(),
          lastVisitAt: new Date(),
          userAgent,
          ipAddress: this.getClientIP(request),
        },
      });
    }

    // Store in cookie for persistence
    this.setAttributionCookie(attribution);
  }

  categorizeTrafficChannel(
    utm: UTMParameters,
    referrer?: string
  ): TrafficChannel {
    // UTM-based categorization
    if (utm.utm_medium === 'cpc' || utm.utm_medium === 'ppc') {
      return 'PAID_SEARCH';
    }
    if (utm.utm_medium === 'social' || utm.utm_source?.match(/facebook|instagram|twitter|linkedin/)) {
      return 'SOCIAL';
    }
    if (utm.utm_medium === 'email') {
      return 'EMAIL';
    }
    if (utm.utm_source) {
      return 'REFERRAL';
    }

    // Referrer-based categorization
    if (!referrer) {
      return 'DIRECT';
    }

    const referrerDomain = this.extractDomain(referrer);

    if (referrerDomain.match(/google|bing|yahoo|duckduckgo/)) {
      return 'ORGANIC_SEARCH';
    }
    if (referrerDomain.match(/facebook|instagram|twitter|linkedin|tiktok/)) {
      return 'SOCIAL';
    }

    return 'REFERRAL';
  }

  async attributeConversion(
    sessionId: string,
    orderId: string,
    revenue: number
  ): Promise<void> {
    await prisma.trafficAttribution.updateMany({
      where: { sessionId },
      data: {
        convertedAt: new Date(),
        orderId,
        revenue,
      },
    });
  }

  private setAttributionCookie(attribution: TrafficAttribution): void {
    const cookieValue = {
      sessionId: attribution.sessionId,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      firstVisitAt: attribution.firstVisitAt.toISOString(),
    };

    cookies().set('attribution', JSON.stringify(cookieValue), {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
}
```

### Referral Link Generator
```typescript
// Referral Link Generator
export class ReferralLinkService {
  generateReferralLink(
    eventId: string,
    params: {
      source: string;
      medium?: string;
      campaign?: string;
      content?: string;
    }
  ): string {
    const baseUrl = `${process.env.APP_URL}/events/${eventId}`;
    const url = new URL(baseUrl);

    url.searchParams.set('utm_source', params.source);
    if (params.medium) url.searchParams.set('utm_medium', params.medium);
    if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
    if (params.content) url.searchParams.set('utm_content', params.content);

    return url.toString();
  }

  async generateShortLink(longUrl: string): Promise<string> {
    // Integration with Bitly or similar service
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BITLY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        long_url: longUrl,
        domain: 'bit.ly',
      }),
    });

    const data = await response.json();
    return data.link;
  }

  async generateQRCode(url: string): Promise<string> {
    const QRCode = require('qrcode');
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrDataUrl;
  }

  async createReferralLink(
    eventId: string,
    organizationId: string,
    params: {
      name: string;
      source: string;
      medium?: string;
      campaign?: string;
      content?: string;
    }
  ): Promise<ReferralLink> {
    const longUrl = this.generateReferralLink(eventId, params);
    const shortUrl = await this.generateShortLink(longUrl);
    const qrCode = await this.generateQRCode(shortUrl);

    return await prisma.referralLink.create({
      data: {
        eventId,
        organizationId,
        name: params.name,
        longUrl,
        shortUrl,
        qrCodeDataUrl: qrCode,
        utmSource: params.source,
        utmMedium: params.medium,
        utmCampaign: params.campaign,
        utmContent: params.content,
      },
    });
  }
}
```

### Analytics Aggregation
```typescript
// Traffic Analytics Service
export class TrafficAnalyticsService {
  async getSourcePerformance(
    eventId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<SourceMetrics[]> {
    const attributions = await prisma.trafficAttribution.groupBy({
      by: ['utmSource', 'channel'],
      where: {
        eventId,
        firstVisitAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      _count: {
        id: true,
        convertedAt: true,
      },
      _sum: {
        revenue: true,
      },
    });

    return attributions.map(attr => ({
      source: attr.utmSource || this.getChannelLabel(attr.channel),
      channel: attr.channel,
      visits: attr._count.id,
      conversions: attr._count.convertedAt,
      conversionRate: (attr._count.convertedAt / attr._count.id) * 100,
      revenue: attr._sum.revenue || 0,
      revenuePerVisit: (attr._sum.revenue || 0) / attr._count.id,
    }));
  }

  async getCampaignPerformance(
    eventId: string,
    campaignName: string
  ): Promise<CampaignMetrics> {
    const attributions = await prisma.trafficAttribution.findMany({
      where: {
        eventId,
        utmCampaign: campaignName,
      },
    });

    const conversions = attributions.filter(a => a.convertedAt);
    const totalRevenue = conversions.reduce((sum, a) => sum + (a.revenue || 0), 0);

    return {
      campaignName,
      totalVisits: attributions.length,
      uniqueVisitors: new Set(attributions.map(a => a.sessionId)).size,
      conversions: conversions.length,
      conversionRate: (conversions.length / attributions.length) * 100,
      revenue: totalRevenue,
      averageOrderValue: totalRevenue / conversions.length,
    };
  }

  async getConversionFunnel(
    eventId: string,
    source?: string
  ): Promise<FunnelMetrics> {
    const whereClause = source
      ? { eventId, utmSource: source }
      : { eventId };

    const totalVisits = await prisma.trafficAttribution.count({
      where: whereClause,
    });

    const viewedTickets = await prisma.trafficAttribution.count({
      where: {
        ...whereClause,
        // Assume we track ticket view events
      },
    });

    const addedToCart = await prisma.trafficAttribution.count({
      where: {
        ...whereClause,
        // Assume we track add-to-cart events
      },
    });

    const conversions = await prisma.trafficAttribution.count({
      where: {
        ...whereClause,
        convertedAt: { not: null },
      },
    });

    return {
      visits: totalVisits,
      ticketViews: viewedTickets,
      addToCart: addedToCart,
      purchases: conversions,
      dropOffRates: {
        visitToView: ((totalVisits - viewedTickets) / totalVisits) * 100,
        viewToCart: ((viewedTickets - addedToCart) / viewedTickets) * 100,
        cartToPurchase: ((addedToCart - conversions) / addedToCart) * 100,
      },
    };
  }
}
```

---

## Database Schema

```prisma
model TrafficAttribution {
  id                String   @id @default(cuid())
  eventId           String
  event             Event @relation(fields: [eventId], references: [id])
  sessionId         String   // Cookie-based session
  userId            String?
  user              User? @relation(fields: [userId], references: [id])

  // UTM Parameters
  utmSource         String?
  utmMedium         String?
  utmCampaign       String?
  utmTerm           String?
  utmContent        String?

  // Referrer
  referrer          String?
  referrerDomain    String?
  channel           TrafficChannel

  // Timestamps
  firstVisitAt      Date
  lastVisitAt       Date
  convertedAt       DateTime?

  // Attribution
  orderId           String?
  order             Order? @relation(fields: [orderId], references: [id])
  revenue           Int?     // In cents

  // Device & Location
  userAgent         String?
  ipAddress         String?
  country           String?
  city              String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([eventId])
  @@index([sessionId])
  @@index([utmSource])
  @@index([utmCampaign])
  @@index([channel])
}

model ReferralLink {
  id                String   @id @default(cuid())
  eventId           String
  event             Event @relation(fields: [eventId], references: [id])
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  name              String   // Internal name
  longUrl           String   @db.Text
  shortUrl          String?
  qrCodeDataUrl     String?  @db.Text

  utmSource         String
  utmMedium         String?
  utmCampaign       String?
  utmContent        String?

  clicks            Int      @default(0)
  conversions       Int      @default(0)
  revenue           Int      @default(0)

  isActive          Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([eventId])
  @@index([organizationId])
}

model PartnerReferral {
  id                String   @id @default(cuid())
  eventId           String
  event             Event @relation(fields: [eventId], references: [id])
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  partnerName       String
  partnerEmail      String
  referralCode      String   @unique
  commissionRate    Float    // Percentage (0-100)

  clicks            Int      @default(0)
  conversions       Int      @default(0)
  revenue           Int      @default(0)
  commissionOwed    Int      @default(0) // In cents

  isActive          Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([eventId])
  @@index([referralCode])
}

enum TrafficChannel {
  DIRECT
  ORGANIC_SEARCH
  PAID_SEARCH
  SOCIAL
  EMAIL
  REFERRAL
  OTHER
}
```

---

## API Endpoints

```typescript
// Tracking (Public)
POST   /api/events/:eventId/track/view      // Track page view with UTM

// Referral Links
POST   /api/events/:eventId/referrals       // Create referral link
GET    /api/events/:eventId/referrals       // List referral links
GET    /api/events/:eventId/referrals/:id   // Get referral link details
PUT    /api/events/:eventId/referrals/:id   // Update referral link
DELETE /api/events/:eventId/referrals/:id   // Delete referral link

// Partner Referrals
POST   /api/events/:eventId/partners        // Create partner referral
GET    /api/events/:eventId/partners        // List partners
GET    /api/events/:eventId/partners/:id    // Get partner details
GET    /api/events/:eventId/partners/:id/payout // Generate payout report

// Analytics
GET    /api/events/:eventId/analytics/sources    // Traffic source performance
GET    /api/events/:eventId/analytics/campaigns  // Campaign performance
GET    /api/events/:eventId/analytics/funnel     // Conversion funnel
GET    /api/events/:eventId/analytics/attribution // Attribution report
```

---

## UI/UX Requirements

### Referral Link Generator
1. **Link Creation Form**
   - Event selector
   - Link name (internal)
   - Source input (e.g., "instagram", "newsletter")
   - Medium dropdown (social, email, cpc, referral, other)
   - Campaign name input
   - Content/variation input (optional)
   - "Generate Link" button

2. **Generated Link Display**
   - Full URL (copyable)
   - Short URL (copyable)
   - QR code image (downloadable)
   - Preview button to test link
   - Social share buttons

### Traffic Analytics Dashboard
1. **Overview Cards**
   - Total visits
   - Total conversions
   - Overall conversion rate
   - Total revenue from tracked sources

2. **Sources Table**
   - Columns: Source, Channel, Visits, Conversions, Conv. Rate, Revenue
   - Sort by any column
   - Filter by channel, date range
   - Export to CSV button

3. **Campaign Performance**
   - Campaign name list with metrics
   - Click to expand for detailed breakdown
   - Period-over-period comparison
   - ROI calculator (if ad spend entered)

4. **Conversion Funnel Visualization**
   - Funnel chart showing: Visits → Views → Cart → Purchase
   - Drop-off rates displayed between stages
   - Filter by source or campaign

5. **Attribution Path**
   - Table showing first-touch and last-touch sources
   - Multi-touch attribution visualization
   - Customer journey map

### Partner Dashboard
1. **Partner Leaderboard**
   - Ranked by conversions or revenue
   - Shows: Partner name, code, clicks, sales, commission
   - Filter by event, date range

2. **Partner Detail View**
   - Performance metrics
   - Commission calculation
   - Generate payout report button
   - Referral link for partner

---

## Third-Party Integrations

### Bitly Link Shortening
- **API Docs:** https://dev.bitly.com/api-reference
- **Endpoint:** `POST https://api-ssl.bitly.com/v4/shorten`
- **Authentication:** Bearer token

### QR Code Generation
- **Library:** `qrcode` (npm package)
- **Docs:** https://www.npmjs.com/package/qrcode

### Google Analytics Integration (Optional)
- Send UTM data to Google Analytics for enhanced tracking
- Use Measurement Protocol for server-side tracking
- **Docs:** https://developers.google.com/analytics/devguides/collection/protocol/v1

---

## Privacy & Compliance

### GDPR/CCPA Compliance
1. **Cookie Consent**
   - Display cookie banner on first visit
   - Explain tracking purpose
   - Allow opt-out
   - Respect Do Not Track header

2. **Data Retention**
   - Store attribution data for 13 months
   - Anonymize IP addresses after 30 days
   - Allow users to request data deletion

3. **Privacy Policy**
   - Document tracking methods
   - Explain data usage
   - Provide contact for inquiries

---

## Testing Requirements

### Unit Tests
- UTM parameter extraction from URLs
- Traffic channel categorization logic
- Referral link generation
- Commission calculation
- Conversion attribution

### Integration Tests
- Page view tracking with UTM parameters
- Cookie persistence across sessions
- Order attribution to traffic source
- Analytics aggregation queries
- Partner payout report generation

### E2E Tests
- User clicks referral link with UTM parameters
- User completes purchase
- Verify attribution recorded correctly
- Check analytics dashboard displays accurate data

---

## Performance Considerations

1. **Cookie Size**
   - Keep attribution cookie under 4KB
   - Store only essential data

2. **Database Queries**
   - Index on eventId, sessionId, utmSource, utmCampaign
   - Use aggregation queries for analytics
   - Cache analytics results for 1 hour

3. **Privacy-Compliant Tracking**
   - Use first-party cookies (not third-party)
   - Hash IP addresses before storage
   - Implement server-side tracking

---

## Dependencies
- **Requires:** Event pages, Checkout flow, Order processing
- **Integrates With:** Analytics dashboard, Marketing campaigns
- **Optional:** Bitly API for link shortening

---

## Notes
- Attribution window: 30 days from first visit
- Support multi-touch attribution in future iteration
- Consider integration with Facebook Pixel, Google Ads for enhanced tracking
- Monitor cookie compliance regulations
- Future: Add influencer marketplace integration