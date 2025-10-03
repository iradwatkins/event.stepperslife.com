# MKT-010: AI-Powered Audience Segmentation

**Epic:** [EPIC-018: Advanced Marketing Automation](../epics/EPIC-018-advanced-marketing.md)
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started
**Assignee:** TBD
**Sprint:** TBD

---

## User Story

**As an** event organizer
**I want** AI-powered audience segmentation that automatically groups users based on behavior and predictive analytics
**So that** I can target the right audiences with personalized marketing and increase conversion rates

---

## Acceptance Criteria

### AC1: Machine Learning Audience Clustering
**Given** I have user and event data
**When** I run AI segmentation analysis
**Then** the system automatically creates audience segments based on behavior patterns
**And** I see segment characteristics (demographics, interests, spending habits)
**And** segments update automatically as user behavior changes
**And** I can view segment size and growth trends

### AC2: Predictive Purchase Likelihood
**Given** a user interacts with events
**When** the system analyzes their behavior
**Then** it predicts their likelihood to purchase tickets (high, medium, low)
**And** I can create campaigns targeting high-likelihood users
**And** predictions improve over time with more data
**And** I see prediction accuracy metrics

### AC3: Behavioral Segmentation
**Given** I want to segment by behavior
**When** I create a behavioral segment
**Then** I can segment by: attendance frequency, ticket spending, event preferences, browsing patterns, or engagement level
**And** segments update in real-time based on user actions
**And** I can combine multiple behavioral criteria
**And** I see historical behavior trends per segment

### AC4: Lookalike Audience Generation
**Given** I have a high-performing segment
**When** I request a lookalike audience
**Then** the AI finds similar users who match the segment's characteristics
**And** I can adjust the similarity threshold
**And** I see match confidence scores
**And** I can export lookalike audiences to ad platforms

### AC5: Automatic Segment Updates
**Given** segments are active
**When** user behavior changes
**Then** users automatically move between segments
**And** I receive notifications of significant segment changes
**And** workflows adjust to user's new segment
**And** I can view segment transition history

### AC6: Segment Performance Analytics
**Given** I use segments for campaigns
**When** I view segment analytics
**Then** I see conversion rates per segment
**And** I see revenue and LTV per segment
**And** I see engagement metrics per segment
**And** I receive segment optimization recommendations

---

## Technical Specifications

### Database Schema (Prisma)

```prisma
model AudienceSegment {
  id              String              @id @default(cuid())
  organizerId     String
  name            String
  description     String?
  type            SegmentType
  criteria        Json                // Segmentation rules
  mlModelId       String?             // For AI-generated segments
  isAutoUpdate    Boolean             @default(true)
  memberCount     Int                 @default(0)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  organizer       User                @relation(fields: [organizerId], references: [id])
  members         SegmentMember[]
  analytics       SegmentAnalytics[]
  campaigns       Campaign[]

  @@index([organizerId, type])
  @@index([mlModelId])
}

model SegmentMember {
  id              String              @id @default(cuid())
  segmentId       String
  userId          String
  addedAt         DateTime            @default(now())
  addedBy         MemberSource        @default(AUTO)
  score           Float?              // Relevance score for AI segments
  metadata        Json?               // Additional segment-specific data

  segment         AudienceSegment     @relation(fields: [segmentId], references: [id], onDelete: Cascade)
  user            User                @relation(fields: [userId], references: [id])

  @@unique([segmentId, userId])
  @@index([segmentId, score])
  @@index([userId])
}

model UserBehaviorProfile {
  id                    String    @id @default(cuid())
  userId                String    @unique
  attendanceFrequency   Float     @default(0) // Events per month
  avgTicketSpend        Decimal   @default(0) @db.Decimal(10, 2)
  preferredCategories   String[]  // Event categories
  preferredDays         String[]  // Day of week preferences
  browserDevice         String?
  lastEventDate         DateTime?
  totalEventsAttended   Int       @default(0)
  totalSpent            Decimal   @default(0) @db.Decimal(10, 2)
  engagementScore       Float     @default(0) // 0-100
  purchaseLikelihood    Float     @default(0) // 0-1 probability
  churnRisk             Float     @default(0) // 0-1 probability
  lifetimeValue         Decimal   @default(0) @db.Decimal(10, 2)
  updatedAt             DateTime  @updatedAt

  user                  User      @relation(fields: [userId], references: [id])

  @@index([purchaseLikelihood])
  @@index([engagementScore])
}

model MLSegmentModel {
  id              String              @id @default(cuid())
  name            String
  modelType       MLModelType
  version         String
  accuracy        Float?
  parameters      Json
  trainingData    Json?
  trainedAt       DateTime
  isActive        Boolean             @default(true)

  segments        AudienceSegment[]

  @@index([modelType, isActive])
}

model SegmentAnalytics {
  id                String              @id @default(cuid())
  segmentId         String
  date              DateTime
  memberCount       Int
  newMembers        Int
  churnedMembers    Int
  conversions       Int
  revenue           Decimal             @default(0) @db.Decimal(10, 2)
  engagementRate    Float
  avgLTV            Decimal             @default(0) @db.Decimal(10, 2)

  segment           AudienceSegment     @relation(fields: [segmentId], references: [id], onDelete: Cascade)

  @@unique([segmentId, date])
  @@index([segmentId, date])
}

model LookalikeAudience {
  id                String              @id @default(cuid())
  sourceSegmentId   String
  name              String
  similarityScore   Float               @default(0.8)
  memberCount       Int                 @default(0)
  status            LookalikeStatus     @default(PENDING)
  createdAt         DateTime            @default(now())

  members           LookalikeMember[]

  @@index([sourceSegmentId])
}

model LookalikeMember {
  id                String              @id @default(cuid())
  lookalikeId       String
  userId            String
  matchScore        Float               // 0-1 similarity score

  lookalike         LookalikeAudience   @relation(fields: [lookalikeId], references: [id], onDelete: Cascade)
  user              User                @relation(fields: [userId], references: [id])

  @@unique([lookalikeId, userId])
  @@index([lookalikeId, matchScore])
}

enum SegmentType {
  MANUAL
  RULE_BASED
  BEHAVIORAL
  PREDICTIVE
  LOOKALIKE
}

enum MemberSource {
  MANUAL
  AUTO
  IMPORT
  AI
}

enum MLModelType {
  CLUSTERING
  CLASSIFICATION
  REGRESSION
  NEURAL_NETWORK
}

enum LookalikeStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### TypeScript Interfaces

```typescript
// types/ai-segmentation.ts

export interface SegmentCriteria {
  behavioral?: BehavioralCriteria;
  demographic?: DemographicCriteria;
  transactional?: TransactionalCriteria;
  predictive?: PredictiveCriteria;
}

export interface BehavioralCriteria {
  attendanceFrequency?: { min?: number; max?: number };
  eventCategories?: string[];
  engagementScore?: { min?: number; max?: number };
  lastEventDays?: number; // Days since last event
  browsingBehavior?: string[];
}

export interface PredictiveCriteria {
  purchaseLikelihood?: { min?: number; max?: number };
  churnRisk?: { min?: number; max?: number };
  lifetimeValue?: { min?: number; max?: number };
}

export interface SegmentInsights {
  segmentId: string;
  memberCount: number;
  demographics: {
    avgAge?: number;
    genderDistribution?: Record<string, number>;
    locationDistribution?: Record<string, number>;
  };
  behavior: {
    avgAttendanceFrequency: number;
    avgTicketSpend: number;
    topEventCategories: string[];
    engagementScore: number;
  };
  performance: {
    conversionRate: number;
    avgRevenue: number;
    avgLTV: number;
    churnRate: number;
  };
  recommendations: SegmentRecommendation[];
}

export interface SegmentRecommendation {
  type: 'TARGETING' | 'CONTENT' | 'TIMING' | 'PRICING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  expectedImpact: string;
}

export interface MLClusteringResult {
  clusterId: string;
  clusterName: string;
  memberCount: number;
  centroid: number[];
  characteristics: string[];
  suggestedName: string;
}

export interface PurchasePrediction {
  userId: string;
  likelihood: number; // 0-1
  confidence: number; // 0-1
  factors: PredictionFactor[];
  recommendedActions: string[];
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1
  description: string;
}
```

### API Routes

```typescript
// app/api/marketing/segments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { SegmentationService } from '@/lib/services/segmentation.service';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const segments = await SegmentationService.listSegments(session.user.id);
  return NextResponse.json(segments);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const segment = await SegmentationService.createSegment({
    organizerId: session.user.id,
    ...body,
  });

  return NextResponse.json(segment, { status: 201 });
}

// app/api/marketing/segments/[segmentId]/insights/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { segmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const insights = await SegmentationService.getSegmentInsights(
    params.segmentId,
    session.user.id
  );

  return NextResponse.json(insights);
}

// app/api/marketing/segments/ai/cluster/route.ts

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const clusters = await SegmentationService.performAIClustering({
    organizerId: session.user.id,
    numClusters: body.numClusters || 'auto',
    features: body.features,
  });

  return NextResponse.json(clusters);
}

// app/api/marketing/segments/[segmentId]/lookalike/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: { segmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const lookalike = await SegmentationService.createLookalikeAudience({
    sourceSegmentId: params.segmentId,
    organizerId: session.user.id,
    similarityThreshold: body.similarityThreshold || 0.8,
  });

  return NextResponse.json(lookalike);
}

// app/api/users/[userId]/predictions/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const predictions = await SegmentationService.getUserPredictions(params.userId);
  return NextResponse.json(predictions);
}
```

### Service Layer

```typescript
// lib/services/segmentation.service.ts

import { prisma } from '@/lib/prisma';
import { OpenAIService } from './openai.service';
import { MLService } from './ml.service';
import { SegmentInsights, PurchasePrediction } from '@/types/ai-segmentation';

export class SegmentationService {
  static async performAIClustering(params: {
    organizerId: string;
    numClusters: number | 'auto';
    features?: string[];
  }) {
    // Fetch user behavior profiles
    const profiles = await prisma.userBehaviorProfile.findMany({
      include: {
        user: {
          include: {
            orders: true,
            ticketHolders: true,
          },
        },
      },
    });

    // Prepare feature matrix
    const features = this.prepareFeatureMatrix(profiles, params.features);

    // Perform K-means clustering
    const clusters = await MLService.performClustering({
      data: features,
      numClusters: params.numClusters,
      algorithm: 'kmeans',
    });

    // Create segments from clusters
    const segments = await Promise.all(
      clusters.map(async (cluster, index) => {
        const segment = await prisma.audienceSegment.create({
          data: {
            organizerId: params.organizerId,
            name: cluster.suggestedName || `AI Segment ${index + 1}`,
            description: `Auto-generated segment: ${cluster.characteristics.join(', ')}`,
            type: 'BEHAVIORAL',
            criteria: cluster.characteristics,
            memberCount: cluster.members.length,
          },
        });

        // Add members to segment
        await prisma.segmentMember.createMany({
          data: cluster.members.map((userId: string) => ({
            segmentId: segment.id,
            userId,
            addedBy: 'AI',
            score: 1.0,
          })),
        });

        return segment;
      })
    );

    return segments;
  }

  static async updateBehaviorProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          include: {
            event: true,
          },
        },
        ticketHolders: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!user) return;

    // Calculate behavioral metrics
    const totalOrders = user.orders.length;
    const totalSpent = user.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgSpend = totalOrders > 0 ? totalSpent / totalOrders : 0;

    const eventCategories = [
      ...new Set(user.orders.map(o => o.event?.category).filter(Boolean)),
    ];

    const lastEvent = user.orders.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore({
      totalOrders,
      totalSpent,
      daysSinceLastEvent: lastEvent
        ? Math.floor((Date.now() - lastEvent.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    });

    // Predict purchase likelihood using ML
    const purchaseLikelihood = await this.predictPurchaseLikelihood(userId);

    // Update or create profile
    await prisma.userBehaviorProfile.upsert({
      where: { userId },
      update: {
        attendanceFrequency: totalOrders / 12, // Events per month
        avgTicketSpend: avgSpend,
        preferredCategories: eventCategories,
        totalEventsAttended: totalOrders,
        totalSpent,
        engagementScore,
        purchaseLikelihood,
        lastEventDate: lastEvent?.createdAt,
      },
      create: {
        userId,
        attendanceFrequency: totalOrders / 12,
        avgTicketSpend: avgSpend,
        preferredCategories: eventCategories,
        totalEventsAttended: totalOrders,
        totalSpent,
        engagementScore,
        purchaseLikelihood,
        lastEventDate: lastEvent?.createdAt,
      },
    });
  }

  static async createLookalikeAudience(params: {
    sourceSegmentId: string;
    organizerId: string;
    similarityThreshold: number;
  }) {
    // Get source segment members and their profiles
    const sourceMembers = await prisma.segmentMember.findMany({
      where: { segmentId: params.sourceSegmentId },
      include: {
        user: {
          include: {
            behaviorProfile: true,
          },
        },
      },
    });

    // Calculate average profile of source segment
    const avgProfile = this.calculateAverageProfile(
      sourceMembers.map(m => m.user.behaviorProfile).filter(Boolean)
    );

    // Find similar users
    const allProfiles = await prisma.userBehaviorProfile.findMany({
      where: {
        userId: {
          notIn: sourceMembers.map(m => m.userId),
        },
      },
    });

    const similarUsers = allProfiles
      .map(profile => ({
        profile,
        similarity: this.calculateCosineSimilarity(avgProfile, profile),
      }))
      .filter(u => u.similarity >= params.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);

    // Create lookalike audience
    const lookalike = await prisma.lookalikeAudience.create({
      data: {
        sourceSegmentId: params.sourceSegmentId,
        name: `Lookalike - ${params.sourceSegmentId}`,
        similarityScore: params.similarityThreshold,
        memberCount: similarUsers.length,
        status: 'COMPLETED',
        members: {
          create: similarUsers.map(u => ({
            userId: u.profile.userId,
            matchScore: u.similarity,
          })),
        },
      },
    });

    return lookalike;
  }

  static async getSegmentInsights(
    segmentId: string,
    organizerId: string
  ): Promise<SegmentInsights> {
    const segment = await prisma.audienceSegment.findFirst({
      where: { id: segmentId, organizerId },
      include: {
        members: {
          include: {
            user: {
              include: {
                behaviorProfile: true,
                orders: true,
              },
            },
          },
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    // Calculate insights using OpenAI
    const recommendations = await OpenAIService.generateSegmentRecommendations(segment);

    return {
      segmentId,
      memberCount: segment.memberCount,
      demographics: this.calculateDemographics(segment.members),
      behavior: this.calculateBehaviorMetrics(segment.members),
      performance: this.calculatePerformanceMetrics(segment.analytics),
      recommendations,
    };
  }

  private static calculateEngagementScore(data: any): number {
    let score = 0;

    // Order frequency (0-40 points)
    score += Math.min(data.totalOrders * 5, 40);

    // Spending (0-30 points)
    score += Math.min((data.totalSpent / 1000) * 10, 30);

    // Recency (0-30 points)
    if (data.daysSinceLastEvent !== null) {
      score += Math.max(30 - data.daysSinceLastEvent / 3, 0);
    }

    return Math.min(score, 100);
  }

  private static async predictPurchaseLikelihood(userId: string): Promise<number> {
    // Use ML model to predict purchase likelihood
    // For now, return a mock value
    return Math.random();
  }

  private static prepareFeatureMatrix(profiles: any[], features?: string[]): number[][] {
    // Convert profiles to feature vectors
    return profiles.map(profile => [
      profile.attendanceFrequency,
      Number(profile.avgTicketSpend),
      profile.engagementScore,
      profile.totalEventsAttended,
    ]);
  }

  private static calculateCosineSimilarity(profile1: any, profile2: any): number {
    // Calculate cosine similarity between two behavior profiles
    const vector1 = [
      profile1.attendanceFrequency,
      Number(profile1.avgTicketSpend),
      profile1.engagementScore,
    ];
    const vector2 = [
      profile2.attendanceFrequency,
      Number(profile2.avgTicketSpend),
      profile2.engagementScore,
    ];

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const mag1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
  }

  private static calculateAverageProfile(profiles: any[]) {
    const sum = profiles.reduce(
      (acc, p) => ({
        attendanceFrequency: acc.attendanceFrequency + p.attendanceFrequency,
        avgTicketSpend: acc.avgTicketSpend + Number(p.avgTicketSpend),
        engagementScore: acc.engagementScore + p.engagementScore,
      }),
      { attendanceFrequency: 0, avgTicketSpend: 0, engagementScore: 0 }
    );

    const count = profiles.length || 1;
    return {
      attendanceFrequency: sum.attendanceFrequency / count,
      avgTicketSpend: sum.avgTicketSpend / count,
      engagementScore: sum.engagementScore / count,
    };
  }

  private static calculateDemographics(members: any[]) {
    // Calculate demographic distribution
    return {
      avgAge: 0,
      genderDistribution: {},
      locationDistribution: {},
    };
  }

  private static calculateBehaviorMetrics(members: any[]) {
    const profiles = members.map(m => m.user.behaviorProfile).filter(Boolean);
    const count = profiles.length || 1;

    return {
      avgAttendanceFrequency:
        profiles.reduce((sum, p) => sum + p.attendanceFrequency, 0) / count,
      avgTicketSpend:
        profiles.reduce((sum, p) => sum + Number(p.avgTicketSpend), 0) / count,
      topEventCategories: [],
      engagementScore:
        profiles.reduce((sum, p) => sum + p.engagementScore, 0) / count,
    };
  }

  private static calculatePerformanceMetrics(analytics: any[]) {
    const count = analytics.length || 1;
    return {
      conversionRate:
        analytics.reduce((sum, a) => sum + a.conversions, 0) /
        analytics.reduce((sum, a) => sum + a.memberCount, 0) * 100,
      avgRevenue: analytics.reduce((sum, a) => sum + Number(a.revenue), 0) / count,
      avgLTV: analytics.reduce((sum, a) => sum + Number(a.avgLTV), 0) / count,
      churnRate:
        analytics.reduce((sum, a) => sum + a.churnedMembers, 0) /
        analytics.reduce((sum, a) => sum + a.memberCount, 0) * 100,
    };
  }
}
```

---

## Testing Requirements

### Unit Tests
- Behavior profile calculation
- Engagement score algorithm
- Cosine similarity calculation
- Feature matrix preparation
- Purchase likelihood prediction

### Integration Tests
- AI clustering workflow
- Lookalike audience creation
- Segment auto-update on user action
- Segment insights generation
- Profile sync with orders

### E2E Tests
- Run AI clustering and create segments
- View segment insights and recommendations
- Create lookalike audience from high-value segment
- User moves between segments based on behavior
- Export segment to ad platform

---

## Dependencies

### Before
- [AUTH-001: User Authentication](../epic-001-auth/AUTH-001-user-authentication.md)
- [PAY-001: Square Payment Integration](../epic-003-payment/PAY-001-square-payment-integration.md)

### After
- MKT-011: Dynamic Personalization Engine
- MKT-012: Advanced Analytics Dashboard

---

## Definition of Done

- [ ] Prisma schema includes all AI segmentation models
- [ ] ML clustering algorithm implemented
- [ ] Behavioral profile calculation
- [ ] Purchase likelihood prediction model
- [ ] Lookalike audience generation
- [ ] Automatic segment updates
- [ ] Segment insights dashboard
- [ ] API routes tested and documented
- [ ] OpenAI integration for recommendations
- [ ] Unit tests achieve >80% coverage
- [ ] Integration tests pass
- [ ] E2E tests verify user flows
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Use scikit-learn or TensorFlow.js for ML models
- Consider batch processing for large datasets
- Implement caching for frequently accessed segments
- Use webhooks to update profiles in real-time
- Store ML model versions for reproducibility
- Consider privacy implications of behavioral tracking
- Implement data anonymization for ML training