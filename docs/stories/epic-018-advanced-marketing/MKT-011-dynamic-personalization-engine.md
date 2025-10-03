# MKT-011: Dynamic Personalization Engine

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** dynamic content personalization that adapts emails, landing pages, and recommendations based on individual user data
**So that** I can increase engagement, conversion rates, and provide a personalized experience for each user

---

## Acceptance Criteria

### AC1: Dynamic Email Content
**Given** I create a marketing email
**When** I use personalization variables
**Then** the email content dynamically adapts to each recipient's data (name, event preferences, past purchases, location)
**And** I can use conditional content blocks based on user segments
**And** I can preview how the email looks for different users
**And** personalization tokens are replaced correctly in all emails

### AC2: Personalized Event Recommendations
**Given** a user views the events page
**When** the system generates recommendations
**Then** it shows events based on their past attendance, preferences, and behavior
**And** recommendations update in real-time as preferences change
**And** I can see the reasoning behind each recommendation
**And** recommendations improve over time with user feedback

### AC3: Custom Landing Pages per Segment
**Given** I create a campaign for a specific segment
**When** users click the campaign link
**Then** they see a landing page customized for their segment
**And** the page includes personalized content, images, and offers
**And** I can A/B test different personalization strategies
**And** landing pages load quickly with dynamic content

### AC4: Dynamic Pricing Display
**Given** a user views event pricing
**When** the system checks their eligibility
**Then** it displays personalized pricing (loyalty discounts, segment-specific offers, early bird pricing)
**And** users see why they received the discount
**And** pricing updates reflect in real-time
**And** discounts are automatically applied at checkout

### AC5: Personalized Subject Lines & CTAs
**Given** I create an email campaign
**When** I enable smart personalization
**Then** the system generates personalized subject lines based on user data
**And** CTAs adapt to user's stage in the funnel (browse vs. purchase)
**And** I can see predicted open and click rates
**And** the system learns from past campaign performance

### AC6: Multivariate Testing
**Given** I want to optimize personalization
**When** I set up a multivariate test
**Then** I can test combinations of: subject lines, content blocks, images, CTAs, personalization strategies
**And** the system automatically distributes traffic
**And** I see performance metrics for each variant
**And** the winning variant is selected automatically

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model PersonalizationRule {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  description     String?
  ruleType        RuleType
  conditions      Json                // Matching conditions
  content         Json                // Personalized content
  priority        Int                 @default(0)
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  organizer       User                @relation(fields: [organizerId], references: [id])
  analytics       PersonalizationAnalytics[]

  @@index([organizerId, ruleType, isActive])
}

model PersonalizationTemplate {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  type            TemplateType
  baseContent     String              @db.Text
  variables       Json                // Available personalization variables
  conditionalBlocks Json              // Conditional content logic
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  organizer       User                @relation(fields: [organizerId], references: [id])
  campaigns       Campaign[]

  @@index([organizerId, type])
}

model UserRecommendation {
  id              String              @id @default(cuid())
  userId          String
  eventId         String
  score           Float               // 0-1 relevance score
  reason          String[]            // Recommendation factors
  viewedAt        DateTime?
  clickedAt       DateTime?
  convertedAt     DateTime?
  createdAt       DateTime            @default(now())

  user            User                @relation(fields: [userId], references: [id])
  event           Event               @relation(fields: [eventId], references: [id])

  @@unique([userId, eventId])
  @@index([userId, score])
  @@index([eventId])
}

model PersonalizedOffer {
  id              String              @id @default(cuid())
  userId          String
  eventId         String?
  offerType       OfferType
  discountAmount  Decimal             @default(0) @db.Decimal(10, 2)
  discountPercent Int?
  reason          String              // Why user received this offer
  validFrom       DateTime
  validUntil      DateTime
  usedAt          DateTime?
  isActive        Boolean             @default(true)

  user            User                @relation(fields: [userId], references: [id])
  event           Event?              @relation(fields: [eventId], references: [id])

  @@index([userId, isActive, validUntil])
  @@index([eventId, validUntil])
}

model LandingPageVariant {
  id              String              @id @default(cuid())
  campaignId      String
  segmentId       String?
  name            String
  content         Json                // Page structure and content
  heroImage       String?
  ctaText         String
  ctaUrl          String
  views           Int                 @default(0)
  clicks          Int                 @default(0)
  conversions     Int                 @default(0)
  isActive        Boolean             @default(true)

  campaign        Campaign            @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  segment         AudienceSegment?    @relation(fields: [segmentId], references: [id])

  @@index([campaignId, segmentId])
}

model MultivariateTest {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  testType        TestType
  variants        Json                // Array of variant configurations
  trafficSplit    Json                // Percentage allocation
  startDate       DateTime
  endDate         DateTime?
  status          TestStatus          @default(RUNNING)
  winningVariant  String?
  results         Json?

  organizer       User                @relation(fields: [organizerId], references: [id])

  @@index([organizerId, status])
}

model PersonalizationAnalytics {
  id              String              @id @default(cuid())
  ruleId          String
  date            DateTime
  impressions     Int                 @default(0)
  clicks          Int                 @default(0)
  conversions     Int                 @default(0)
  revenue         Decimal             @default(0) @db.Decimal(10, 2)
  avgEngagement   Float               @default(0)

  rule            PersonalizationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@unique([ruleId, date])
  @@index([ruleId, date])
}

enum RuleType {
  EMAIL_CONTENT
  LANDING_PAGE
  PRICING
  RECOMMENDATION
  CTA
  SUBJECT_LINE
}

enum TemplateType {
  EMAIL
  LANDING_PAGE
  SMS
  PUSH_NOTIFICATION
}

enum OfferType {
  LOYALTY_DISCOUNT
  SEGMENT_OFFER
  EARLY_BIRD
  FLASH_SALE
  REFERRAL_CREDIT
  WIN_BACK
}

enum TestType {
  SUBJECT_LINE
  EMAIL_CONTENT
  LANDING_PAGE
  CTA
  PERSONALIZATION
}

enum TestStatus {
  DRAFT
  RUNNING
  PAUSED
  COMPLETED
}
```

### TypeScript Interfaces

```typescript
// types/personalization.ts

export interface PersonalizationContext {
  userId: string;
  segmentIds: string[];
  behaviorProfile?: UserBehaviorProfile;
  recentEvents?: Event[];
  preferences?: UserPreferences;
  location?: string;
  device?: string;
}

export interface DynamicContent {
  baseContent: string;
  personalizedContent: string;
  variablesUsed: string[];
  conditionalBlocks: ConditionalBlock[];
}

export interface ConditionalBlock {
  condition: string; // e.g., "user.totalSpent > 500"
  content: string;
  priority: number;
}

export interface RecommendationEngine {
  collaborative: CollaborativeFiltering;
  contentBased: ContentBasedFiltering;
  hybrid: HybridRecommendation;
}

export interface RecommendationResult {
  eventId: string;
  event: Event;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface PersonalizedEmail {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  personalizationApplied: PersonalizationApplied[];
}

export interface PersonalizationApplied {
  type: 'VARIABLE' | 'CONDITIONAL' | 'DYNAMIC_CONTENT';
  field: string;
  originalValue?: string;
  personalizedValue: string;
}

export interface SmartCTA {
  text: string;
  url: string;
  style: 'primary' | 'secondary' | 'urgent';
  reasoning: string;
}
```

### API Routes

```typescript
// app/api/personalization/recommend/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PersonalizationService } from '@/lib/services/personalization.service';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');

  const recommendations = await PersonalizationService.getRecommendations({
    userId: session.user.id,
    limit,
    category: category || undefined,
  });

  return NextResponse.json(recommendations);
}

// app/api/personalization/render/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const rendered = await PersonalizationService.renderPersonalizedContent({
    userId: session.user.id,
    templateId: body.templateId,
    context: body.context,
  });

  return NextResponse.json(rendered);
}

// app/api/personalization/offers/route.ts

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const offers = await PersonalizationService.getPersonalizedOffers(session.user.id);
  return NextResponse.json(offers);
}

// app/api/personalization/landing/[variantId]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  const session = await getServerSession(authOptions);

  const landing = await PersonalizationService.getLandingPageVariant({
    variantId: params.variantId,
    userId: session?.user?.id,
  });

  // Track view
  await PersonalizationService.trackLandingPageView(params.variantId);

  return NextResponse.json(landing);
}

// app/api/personalization/multivariate/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const test = await PersonalizationService.createMultivariateTest({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(test, { status: 201 });
}
```

### Service Layer

```typescript
// lib/services/personalization.service.ts

import { prisma } from '@/lib/prisma';
import { PersonalizationContext, RecommendationResult } from '@/types/personalization';
import Handlebars from 'handlebars';

export class PersonalizationService {
  static async getRecommendations(params: {
    userId: string;
    limit: number;
    category?: string;
  }): Promise<RecommendationResult[]> {
    // Get user behavior profile
    const profile = await prisma.userBehaviorProfile.findUnique({
      where: { userId: params.userId },
    });

    if (!profile) {
      return this.getPopularEvents(params.limit, params.category);
    }

    // Collaborative filtering: users with similar behavior
    const similarUsers = await this.findSimilarUsers(params.userId);

    // Get events attended by similar users
    const collaborativeRecs = await this.getCollaborativeRecommendations({
      userId: params.userId,
      similarUsers,
      limit: params.limit,
    });

    // Content-based: events matching user preferences
    const contentRecs = await this.getContentBasedRecommendations({
      userId: params.userId,
      profile,
      limit: params.limit,
    });

    // Hybrid: combine both approaches
    const recommendations = this.mergeRecommendations(
      collaborativeRecs,
      contentRecs,
      params.limit
    );

    // Store recommendations
    await this.storeRecommendations(params.userId, recommendations);

    return recommendations;
  }

  static async renderPersonalizedContent(params: {
    userId: string;
    templateId: string;
    context?: any;
  }) {
    const template = await prisma.personalizationTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Get personalization context
    const context = await this.getPersonalizationContext(params.userId);

    // Compile template with Handlebars
    const compiled = Handlebars.compile(template.baseContent);

    // Render with user data
    const rendered = compiled({
      user: context.user,
      profile: context.behaviorProfile,
      preferences: context.preferences,
      ...params.context,
    });

    return {
      content: rendered,
      variablesUsed: this.extractVariables(template.baseContent),
    };
  }

  static async getPersonalizedOffers(userId: string) {
    const offers = await prisma.personalizedOffer.findMany({
      where: {
        userId,
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        usedAt: null,
      },
      include: {
        event: true,
      },
    });

    return offers;
  }

  static async generatePersonalizedSubjectLine(params: {
    userId: string;
    baseSubject: string;
    eventId?: string;
  }): Promise<string> {
    const context = await this.getPersonalizationContext(params.userId);
    const profile = context.behaviorProfile;

    let subject = params.baseSubject;

    // Add user's name
    if (context.user?.name) {
      subject = subject.replace('{{name}}', context.user.name.split(' ')[0]);
    }

    // Add urgency for high-engagement users
    if (profile && profile.engagementScore > 70) {
      subject = `🔥 ${subject}`;
    }

    // Add location for local events
    if (params.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: params.eventId },
      });

      if (event && context.user?.city && event.location?.includes(context.user.city)) {
        subject += ` in ${context.user.city}`;
      }
    }

    return subject;
  }

  static async createPersonalizedOffer(params: {
    userId: string;
    eventId?: string;
    offerType: string;
  }) {
    const profile = await prisma.userBehaviorProfile.findUnique({
      where: { userId: params.userId },
    });

    let discountPercent = 10; // Default
    let reason = 'Special offer just for you';

    if (profile) {
      // Loyalty discount for frequent attendees
      if (profile.totalEventsAttended >= 5) {
        discountPercent = 15;
        reason = `Thanks for attending ${profile.totalEventsAttended} events!`;
      }

      // Win-back offer for churned users
      const daysSinceLastEvent = profile.lastEventDate
        ? Math.floor(
            (Date.now() - profile.lastEventDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      if (daysSinceLastEvent && daysSinceLastEvent > 90) {
        discountPercent = 20;
        reason = "We miss you! Here's 20% off your next event";
      }
    }

    return prisma.personalizedOffer.create({
      data: {
        userId: params.userId,
        eventId: params.eventId,
        offerType: params.offerType as any,
        discountPercent,
        reason,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }

  static async createMultivariateTest(data: any) {
    return prisma.multivariateTest.create({
      data: {
        organizerId: data.organizerId,
        name: data.name,
        testType: data.testType,
        variants: data.variants,
        trafficSplit: data.trafficSplit,
        startDate: new Date(),
        status: 'RUNNING',
      },
    });
  }

  static async trackLandingPageView(variantId: string) {
    await prisma.landingPageVariant.update({
      where: { id: variantId },
      data: {
        views: { increment: 1 },
      },
    });
  }

  private static async getPersonalizationContext(
    userId: string
  ): Promise<PersonalizationContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        behaviorProfile: true,
        segmentMembers: {
          include: {
            segment: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId,
      user,
      segmentIds: user.segmentMembers.map(m => m.segmentId),
      behaviorProfile: user.behaviorProfile || undefined,
    };
  }

  private static async findSimilarUsers(userId: string, limit = 10) {
    // Find users with similar behavior profiles
    const userProfile = await prisma.userBehaviorProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) return [];

    const allProfiles = await prisma.userBehaviorProfile.findMany({
      where: {
        userId: { not: userId },
      },
    });

    // Calculate similarity and return top matches
    return allProfiles
      .map(profile => ({
        userId: profile.userId,
        similarity: this.calculateProfileSimilarity(userProfile, profile),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private static calculateProfileSimilarity(profile1: any, profile2: any): number {
    // Simplified cosine similarity
    const categories1 = new Set(profile1.preferredCategories);
    const categories2 = new Set(profile2.preferredCategories);
    const intersection = [...categories1].filter(c => categories2.has(c)).length;
    const union = new Set([...categories1, ...categories2]).size;

    return union > 0 ? intersection / union : 0;
  }

  private static async getCollaborativeRecommendations(params: any) {
    // Get events attended by similar users but not by current user
    return [];
  }

  private static async getContentBasedRecommendations(params: any) {
    // Get events matching user's preferred categories
    const events = await prisma.event.findMany({
      where: {
        category: {
          in: params.profile.preferredCategories,
        },
        startDate: {
          gte: new Date(),
        },
      },
      take: params.limit,
    });

    return events.map(event => ({
      eventId: event.id,
      event,
      score: 0.8,
      reasons: ['Matches your interests'],
      confidence: 0.85,
    }));
  }

  private static mergeRecommendations(
    collaborative: any[],
    contentBased: any[],
    limit: number
  ): RecommendationResult[] {
    // Merge and deduplicate recommendations
    const merged = [...collaborative, ...contentBased];
    const unique = merged.reduce((acc, rec) => {
      if (!acc.find((r: any) => r.eventId === rec.eventId)) {
        acc.push(rec);
      }
      return acc;
    }, []);

    return unique.slice(0, limit);
  }

  private static async storeRecommendations(userId: string, recommendations: any[]) {
    await prisma.userRecommendation.createMany({
      data: recommendations.map(rec => ({
        userId,
        eventId: rec.eventId,
        score: rec.score,
        reason: rec.reasons,
      })),
      skipDuplicates: true,
    });
  }

  private static async getPopularEvents(limit: number, category?: string) {
    const events = await prisma.event.findMany({
      where: {
        category: category || undefined,
        startDate: { gte: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return events.map(event => ({
      eventId: event.id,
      event,
      score: 0.5,
      reasons: ['Popular event'],
      confidence: 0.6,
    }));
  }

  private static extractVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = template.matchAll(regex);
    return Array.from(matches, m => m[1]);
  }
}
```

---

## Testing Requirements

### Unit Tests
- Template rendering with Handlebars
- Variable extraction and replacement
- Recommendation score calculation
- Profile similarity algorithm
- Offer discount logic

### Integration Tests
- Complete personalization flow
- Recommendation generation and storage
- Multivariate test setup
- Landing page variant selection
- Offer redemption

### E2E Tests
- User receives personalized email
- View personalized event recommendations
- Access custom landing page with segment-specific content
- Receive and apply personalized offer
- A/B test variant assignment

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- MKT-010: AI-Powered Audience Segmentation

### After
- MKT-012: Advanced Analytics Dashboard

---

## Definition of Done

- [ ] Prisma schema includes all personalization models
- [ ] Dynamic content rendering with Handlebars
- [ ] Recommendation engine (collaborative + content-based)
- [ ] Personalized offers system
- [ ] Custom landing pages per segment
- [ ] Dynamic pricing display
- [ ] Smart subject line generation
- [ ] Multivariate testing framework
- [ ] API routes tested and documented
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify personalization
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Cache personalization context for performance
- Use Redis for real-time recommendation serving
- Implement recommendation feedback loop
- Consider GDPR implications of personalization
- Store personalization logs for debugging
- Use CDN for personalized landing pages
- Implement fallback for missing user data