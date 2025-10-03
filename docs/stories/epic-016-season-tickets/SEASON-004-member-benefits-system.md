# SEASON-004: Member Benefits System

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 3
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** season pass holder
**I want** exclusive member benefits based on my tier
**So that** I receive value beyond basic access and feel rewarded for my loyalty

---

## Acceptance Criteria

### 1. Benefit Tier System
- [ ] Basic tier definition (standard season pass)
- [ ] Premium tier definition (enhanced benefits)
- [ ] VIP tier definition (all-inclusive benefits)
- [ ] Custom tier creation for special programs
- [ ] Tier upgrade/downgrade rules
- [ ] Tier comparison chart display
- [ ] Tier-based pricing structure
- [ ] Tier inheritance and stacking rules

### 2. Early Access Benefits
- [ ] Early ticket purchase window (24-72 hours before public)
- [ ] Priority seating selection
- [ ] First access to new event announcements
- [ ] Early bird discount exclusivity
- [ ] Pre-sale access for special events
- [ ] Advanced registration for workshops
- [ ] Early access countdown timer
- [ ] Access window configuration per event

### 3. Exclusive Event Benefits
- [ ] Member-only events and workshops
- [ ] VIP meet-and-greet access
- [ ] Behind-the-scenes tours
- [ ] Private networking sessions
- [ ] Exclusive content library access
- [ ] Special venue areas (VIP lounge, backstage)
- [ ] Members-first announcement emails
- [ ] Exclusive merchandise opportunities

### 4. Discount Benefits
- [ ] Percentage-based discounts (5%, 10%, 15%, 20%)
- [ ] Fixed-amount discounts ($5, $10, $25 off)
- [ ] Multi-ticket purchase discounts
- [ ] Food & beverage discounts at events
- [ ] Merchandise store discounts
- [ ] Partner venue discounts
- [ ] Stackable vs non-stackable discount rules
- [ ] Discount expiration dates

### 5. Guest Privileges
- [ ] Complimentary guest tickets per tier
- [ ] Guest ticket allocation per season
- [ ] Guest ticket usage tracking
- [ ] Guest transfer/gifting rules
- [ ] Plus-one benefits for premium tiers
- [ ] Guest registration process
- [ ] Guest benefit restrictions
- [ ] Group booking benefits

### 6. Benefit Tracking & Validation
- [ ] Real-time benefit usage tracking
- [ ] Benefit redemption history
- [ ] Remaining benefits counter
- [ ] Benefit expiration alerts
- [ ] Benefit validation at checkout
- [ ] Benefit eligibility verification
- [ ] Usage limits enforcement
- [ ] Benefit value calculator (ROI for member)

### 7. Benefit Management (Admin)
- [ ] Create/edit/delete benefits
- [ ] Assign benefits to tiers
- [ ] Set benefit rules and restrictions
- [ ] Configure benefit expiration
- [ ] Bulk benefit assignment
- [ ] Benefit analytics and reporting
- [ ] A/B test different benefit packages
- [ ] Seasonal benefit campaigns

### 8. Testing & Quality
- [ ] Unit tests for benefit validation (>85% coverage)
- [ ] Integration tests for benefit application
- [ ] Edge case testing (expiration, stacking, limits)
- [ ] Performance testing for benefit checks
- [ ] Security testing for benefit access
- [ ] User acceptance testing
- [ ] Documentation complete
- [ ] Admin training materials created

---

## Technical Specifications

### Database Schema Updates
```prisma
// prisma/schema.prisma

model BenefitTier {
  id             String   @id @default(cuid())
  name           String   // 'Basic', 'Premium', 'VIP'
  slug           String   @unique
  description    String?
  level          Int      @unique // 1, 2, 3 (higher = better)
  priceMultiplier Float   @default(1.0)
  color          String?  // Brand color for UI
  benefits       TierBenefit[]
  subscriptions  Subscription[]
  active         Boolean  @default(true)
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([level, active])
}

model Benefit {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  description       String
  category          String   // 'access', 'discount', 'exclusive', 'guest', 'priority'
  type              String   // 'early_access', 'percentage_discount', 'free_guest', 'vip_access'
  icon              String?
  tiers             TierBenefit[]
  redemptions       BenefitRedemption[]
  active            Boolean  @default(true)
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([category, active])
}

model TierBenefit {
  id             String   @id @default(cuid())
  tierId         String
  tier           BenefitTier @relation(fields: [tierId], references: [id], onDelete: Cascade)
  benefitId      String
  benefit        Benefit  @relation(fields: [benefitId], references: [id], onDelete: Cascade)
  value          Float?   // Discount percentage, hours early access, number of guests
  unit           String?  // '%', 'hours', 'tickets', 'days'
  usageLimit     Int?     // Max uses per period
  resetPeriod    String?  // 'monthly', 'quarterly', 'annually', 'never'
  stackable      Boolean  @default(false)
  priority       Int      @default(0) // Higher priority applied first
  startDate      DateTime?
  endDate        DateTime?
  rules          Json?    // Custom validation rules
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([tierId, benefitId])
  @@index([tierId, benefitId])
}

model BenefitRedemption {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
  benefitId      String
  benefit        Benefit  @relation(fields: [benefitId], references: [id])
  eventId        String?
  event          Event?   @relation(fields: [eventId], references: [id])
  orderId        String?
  order          Order?   @relation(fields: [orderId], references: [id])
  redeemedValue  Float    // Actual value redeemed (discount amount, etc)
  context        String?  // 'checkout', 'registration', 'access'
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([userId, benefitId])
  @@index([subscriptionId, createdAt])
}

// Update Subscription model
model Subscription {
  // ... existing fields
  tierId         String?
  tier           BenefitTier? @relation(fields: [tierId], references: [id])
  redemptions    BenefitRedemption[]
  // ... rest of fields
}
```

### TypeScript Interfaces
```typescript
// types/benefit.types.ts

export interface BenefitTierConfig {
  name: string;
  slug: string;
  description: string;
  level: number;
  priceMultiplier: number;
  benefits: BenefitAssignment[];
}

export interface BenefitAssignment {
  benefitId: string;
  value?: number;
  unit?: string;
  usageLimit?: number;
  resetPeriod?: 'monthly' | 'quarterly' | 'annually' | 'never';
  stackable?: boolean;
}

export interface BenefitValidationResult {
  isValid: boolean;
  benefit: Benefit;
  tierBenefit: TierBenefit;
  remainingUses?: number;
  discountAmount?: number;
  earlyAccessHours?: number;
  errors?: string[];
}

export interface MemberBenefitsSummary {
  tier: BenefitTier;
  benefits: BenefitWithUsage[];
  totalValueRedeemed: number;
  savingsThisPeriod: number;
}

export interface BenefitWithUsage {
  benefit: Benefit;
  tierBenefit: TierBenefit;
  usedCount: number;
  remainingUses?: number;
  lastUsed?: Date;
  totalValueRedeemed: number;
}
```

### Benefit Service
```typescript
// lib/services/benefit.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BenefitService {
  // Get user's active benefits
  async getUserBenefits(userId: string): Promise<MemberBenefitsSummary | null> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        tier: {
          include: {
            benefits: {
              include: {
                benefit: true,
              },
              where: {
                benefit: { active: true },
              },
            },
          },
        },
      },
    });

    if (!subscription || !subscription.tier) {
      return null;
    }

    // Get usage stats
    const benefitsWithUsage = await Promise.all(
      subscription.tier.benefits.map(async (tb) => {
        const usedCount = await this.getBenefitUsageCount(
          userId,
          tb.benefitId,
          tb.resetPeriod
        );

        const totalValueRedeemed = await this.getBenefitValueRedeemed(
          userId,
          tb.benefitId,
          tb.resetPeriod
        );

        return {
          benefit: tb.benefit,
          tierBenefit: tb,
          usedCount,
          remainingUses: tb.usageLimit ? tb.usageLimit - usedCount : undefined,
          totalValueRedeemed,
        };
      })
    );

    const totalValueRedeemed = benefitsWithUsage.reduce(
      (sum, b) => sum + b.totalValueRedeemed,
      0
    );

    return {
      tier: subscription.tier,
      benefits: benefitsWithUsage,
      totalValueRedeemed,
      savingsThisPeriod: totalValueRedeemed,
    };
  }

  // Validate benefit eligibility
  async validateBenefit(
    userId: string,
    benefitId: string,
    context?: { eventId?: string; orderAmount?: number }
  ): Promise<BenefitValidationResult> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        tier: {
          include: {
            benefits: {
              where: { benefitId },
              include: { benefit: true },
            },
          },
        },
      },
    });

    if (!subscription || !subscription.tier) {
      return {
        isValid: false,
        errors: ['No active subscription'],
      } as any;
    }

    const tierBenefit = subscription.tier.benefits[0];
    if (!tierBenefit) {
      return {
        isValid: false,
        errors: ['Benefit not available for this tier'],
      } as any;
    }

    // Check usage limit
    if (tierBenefit.usageLimit) {
      const usedCount = await this.getBenefitUsageCount(
        userId,
        benefitId,
        tierBenefit.resetPeriod
      );

      if (usedCount >= tierBenefit.usageLimit) {
        return {
          isValid: false,
          benefit: tierBenefit.benefit,
          tierBenefit,
          errors: ['Benefit usage limit reached'],
        };
      }
    }

    // Check date range
    if (tierBenefit.startDate && new Date() < tierBenefit.startDate) {
      return {
        isValid: false,
        benefit: tierBenefit.benefit,
        tierBenefit,
        errors: ['Benefit not yet active'],
      };
    }

    if (tierBenefit.endDate && new Date() > tierBenefit.endDate) {
      return {
        isValid: false,
        benefit: tierBenefit.benefit,
        tierBenefit,
        errors: ['Benefit has expired'],
      };
    }

    // Calculate benefit value
    let discountAmount: number | undefined;
    let earlyAccessHours: number | undefined;

    if (tierBenefit.benefit.category === 'discount' && context?.orderAmount) {
      if (tierBenefit.unit === '%') {
        discountAmount = (context.orderAmount * (tierBenefit.value || 0)) / 100;
      } else {
        discountAmount = tierBenefit.value || 0;
      }
    }

    if (tierBenefit.benefit.category === 'access' && tierBenefit.unit === 'hours') {
      earlyAccessHours = tierBenefit.value || 0;
    }

    return {
      isValid: true,
      benefit: tierBenefit.benefit,
      tierBenefit,
      remainingUses: tierBenefit.usageLimit
        ? tierBenefit.usageLimit - (await this.getBenefitUsageCount(userId, benefitId, tierBenefit.resetPeriod))
        : undefined,
      discountAmount,
      earlyAccessHours,
    };
  }

  // Apply benefit
  async applyBenefit(
    userId: string,
    benefitId: string,
    context: {
      subscriptionId?: string;
      eventId?: string;
      orderId?: string;
      redeemedValue: number;
      metadata?: any;
    }
  ): Promise<BenefitRedemption> {
    // Validate first
    const validation = await this.validateBenefit(userId, benefitId, {
      orderAmount: context.redeemedValue,
    });

    if (!validation.isValid) {
      throw new Error(`Cannot apply benefit: ${validation.errors?.join(', ')}`);
    }

    // Create redemption record
    const redemption = await prisma.benefitRedemption.create({
      data: {
        userId,
        subscriptionId: context.subscriptionId,
        benefitId,
        eventId: context.eventId,
        orderId: context.orderId,
        redeemedValue: context.redeemedValue,
        context: context.eventId ? 'access' : 'checkout',
        metadata: context.metadata,
      },
    });

    return redemption;
  }

  // Get benefit usage count
  private async getBenefitUsageCount(
    userId: string,
    benefitId: string,
    resetPeriod?: string | null
  ): Promise<number> {
    const startDate = this.getResetPeriodStart(resetPeriod);

    return await prisma.benefitRedemption.count({
      where: {
        userId,
        benefitId,
        createdAt: startDate ? { gte: startDate } : undefined,
      },
    });
  }

  // Get total value redeemed
  private async getBenefitValueRedeemed(
    userId: string,
    benefitId: string,
    resetPeriod?: string | null
  ): Promise<number> {
    const startDate = this.getResetPeriodStart(resetPeriod);

    const result = await prisma.benefitRedemption.aggregate({
      where: {
        userId,
        benefitId,
        createdAt: startDate ? { gte: startDate } : undefined,
      },
      _sum: {
        redeemedValue: true,
      },
    });

    return result._sum.redeemedValue || 0;
  }

  // Get reset period start date
  private getResetPeriodStart(resetPeriod?: string | null): Date | undefined {
    if (!resetPeriod || resetPeriod === 'never') return undefined;

    const now = new Date();
    switch (resetPeriod) {
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'annually':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return undefined;
    }
  }

  // Get all available tiers
  async getAvailableTiers(): Promise<BenefitTier[]> {
    return await prisma.benefitTier.findMany({
      where: { active: true },
      include: {
        benefits: {
          include: { benefit: true },
          where: { benefit: { active: true } },
        },
      },
      orderBy: { level: 'asc' },
    });
  }
}
```

### API Routes
```typescript
// app/api/benefits/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { BenefitService } from '@/lib/services/benefit.service';

const benefitService = new BenefitService();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const benefits = await benefitService.getUserBenefits(session.user.id);
  return NextResponse.json(benefits);
}

// app/api/benefits/validate/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { benefitId, context } = await req.json();
  const validation = await benefitService.validateBenefit(
    session.user.id,
    benefitId,
    context
  );

  return NextResponse.json(validation);
}

// app/api/benefits/tiers/route.ts
export async function GET(req: NextRequest) {
  const tiers = await benefitService.getAvailableTiers();
  return NextResponse.json(tiers);
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('BenefitService', () => {
  it('should get user benefits with usage stats', async () => {
    const benefits = await service.getUserBenefits(userId);
    expect(benefits).toHaveProperty('tier');
    expect(benefits.benefits).toBeInstanceOf(Array);
  });

  it('should validate benefit eligibility', async () => {
    const validation = await service.validateBenefit(userId, benefitId);
    expect(validation.isValid).toBe(true);
    expect(validation.discountAmount).toBeGreaterThan(0);
  });

  it('should enforce usage limits', async () => {
    // Use benefit 3 times (limit = 3)
    await service.applyBenefit(userId, benefitId, context1);
    await service.applyBenefit(userId, benefitId, context2);
    await service.applyBenefit(userId, benefitId, context3);

    // 4th attempt should fail
    const validation = await service.validateBenefit(userId, benefitId);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Benefit usage limit reached');
  });

  it('should calculate discount correctly', async () => {
    const validation = await service.validateBenefit(userId, benefitId, {
      orderAmount: 100,
    });
    expect(validation.discountAmount).toBe(15); // 15% of $100
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Benefit tier system implemented
- [ ] Benefit validation logic working
- [ ] Usage tracking functional
- [ ] Admin benefit management UI complete
- [ ] Member benefits display working
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Admin training completed

---

## Dependencies

- SEASON-001: Subscription model setup (prerequisite)
- AUTH-001: User authentication (prerequisite)

---

## Estimated Timeline

**Total Duration:** 2 weeks
**Story Points:** 3