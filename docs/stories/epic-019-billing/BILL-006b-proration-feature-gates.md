# BILL-006b: Proration & Feature Gates

**Parent Story:** BILL-006 - Subscription Tier Management
**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 3
**Priority:** Medium
**Status:** Ready for Development

## User Story

**As a** platform operator
**I want** prorated billing and feature access controls based on subscription tier
**So that** organizers pay fairly and only access features they're entitled to

## Acceptance Criteria

### AC1: Proration Calculation Service
- [ ] **Upgrade proration:**
  - Calculate unused days in current billing period
  - Credit prorated amount from current tier
  - Charge prorated amount for new tier
  - Formula: `(DaysRemaining / TotalDaysInPeriod) * (NewPrice - OldPrice)`
- [ ] **Downgrade proration:**
  - No immediate charge
  - Credit applied to next billing cycle
  - Downgrade effective at end of current period
- [ ] **Mid-cycle changes:**
  - Immediate access to upgraded features
  - Downgraded features locked at end of period
- [ ] **Annual to monthly (or vice versa):**
  - Calculate remaining value of annual subscription
  - Apply credit to new monthly billing

### AC2: Feature Gate Middleware
- [ ] **Server-side middleware:**
  - Check subscription tier before processing requests
  - Reject requests for unavailable features: HTTP 403
  - Include upgrade prompt in error response
- [ ] **Feature flags per tier:**
  ```typescript
  const FEATURE_GATES = {
    free: ['basic_analytics', 'community_support'],
    pro: ['basic_analytics', 'advanced_analytics', 'custom_branding', 'email_support'],
    enterprise: ['basic_analytics', 'advanced_analytics', 'custom_branding', 'white_label', 'priority_support', 'api_access']
  };
  ```
- [ ] **Usage limit enforcement:**
  - Track events created per month
  - Block event creation when limit reached
  - Show upgrade prompt: "You've reached your limit of 3 events. Upgrade to create more."
- [ ] **Real-time feature checks:**
  - Check on every protected route/action
  - Cache tier in session for performance
  - Invalidate cache on subscription change

### AC3: Usage Limit Enforcement
- [ ] **Event creation limits:**
  - Free: 3 events/month, Pro: 20 events/month, Enterprise: Unlimited
  - Counter resets on billing cycle date
  - Block event creation API when limit reached
  - Grace period: 1 event over limit with warning
- [ ] **Ticket capacity limits:**
  - Free: 100 tickets/event, Pro: 500 tickets/event, Enterprise: Unlimited
  - Validation during event creation
  - Cannot increase capacity beyond tier limit
- [ ] **Feature access limits:**
  - Custom branding: Pro and Enterprise only
  - Advanced analytics: Pro and Enterprise only
  - API access: Enterprise only
  - White-label: Enterprise only

### AC4: Tier-Based Access Control
- [ ] **Route protection:**
  ```typescript
  // Middleware example
  export async function checkFeatureAccess(
    feature: string,
    userId: string
  ): Promise<boolean> {
    const subscription = await getSubscription(userId);
    const allowedFeatures = FEATURE_GATES[subscription.tier];
    return allowedFeatures.includes(feature);
  }
  ```
- [ ] **UI component hiding:**
  - Hide upgrade-only features in UI for lower tiers
  - Show "Upgrade" badge on locked features
  - Click on locked feature shows upgrade modal
- [ ] **Graceful degradation:**
  - If user downgrades mid-event, active events unaffected
  - New events created under new tier limits
  - Analytics data retained but access limited

### AC5: Upgrade Prompts & Upsells
- [ ] **Contextual upgrade prompts:**
  - At usage limit: "You've used 3/3 events. Upgrade to Pro for 20 events/month."
  - On locked feature click: "Custom branding is available on Pro and Enterprise plans."
  - In analytics view: "Unlock advanced charts with Pro."
- [ ] **Upgrade modal:**
  - Shows benefit of upgrading
  - Comparison: Current tier vs Recommended tier
  - Prorated charge displayed
  - "Upgrade Now" CTA button
- [ ] **Trial incentives:**
  - "Try Pro free for 14 days"
  - No credit card required for trial
  - Auto-downgrade at trial end if no payment method

## Technical Implementation

**File:** `/lib/services/subscription.service.ts`
```typescript
export class SubscriptionService {
  async calculateProration(params: {
    userId: string;
    currentPlanId: string;
    newPlanId: string;
    billingCycle: 'monthly' | 'annual';
  }): Promise<ProrationResult> {
    const { userId, currentPlanId, newPlanId, billingCycle } = params;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const currentBillingPeriodEnd = subscription.currentPeriodEnd;
    const daysRemaining = differenceInDays(currentBillingPeriodEnd, new Date());
    const totalDays = differenceInDays(currentBillingPeriodEnd, subscription.currentPeriodStart);

    const currentPlan = PLANS.find((p) => p.id === currentPlanId);
    const newPlan = PLANS.find((p) => p.id === newPlanId);

    // Calculate prorated credit
    const currentDailyRate = currentPlan.price / totalDays;
    const proratedCredit = currentDailyRate * daysRemaining;

    // Calculate prorated charge
    const newDailyRate = newPlan.price / totalDays;
    const proratedCharge = newDailyRate * daysRemaining;

    const netCharge = proratedCharge - proratedCredit;

    return {
      proratedCredit,
      proratedCharge,
      netCharge: Math.max(0, netCharge), // No negative charges
      daysRemaining,
      immediateCharge: netCharge > 0 ? netCharge : 0,
    };
  }

  async upgradePlan(params: {
    userId: string;
    newPlanId: string;
    billingCycle: 'monthly' | 'annual';
  }): Promise<Subscription> {
    const { userId, newPlanId, billingCycle } = params;

    const currentSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // Calculate proration
    const proration = await this.calculateProration({
      userId,
      currentPlanId: currentSubscription.planId,
      newPlanId,
      billingCycle,
    });

    // Charge prorated amount
    if (proration.immediateCharge > 0) {
      await paymentService.charge({
        userId,
        amount: proration.immediateCharge,
        description: `Upgrade to ${newPlanId} (prorated)`,
      });
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        planId: newPlanId,
        billingCycle,
        updatedAt: new Date(),
      },
    });

    // Invalidate feature cache
    await this.invalidateFeatureCache(userId);

    return updatedSubscription;
  }
}
```

**File:** `/lib/middleware/feature-gate.ts`
```typescript
export async function requireFeature(feature: string) {
  return async (req: NextRequest) => {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await checkFeatureAccess(feature, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Feature not available on your plan',
          upgradeRequired: true,
          feature,
        },
        { status: 403 }
      );
    }

    return null; // Allow request to proceed
  };
}

export async function checkUsageLimit(userId: string, limit: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const usage = await getUsageForCurrentPeriod(userId, subscription.currentPeriodStart);

  const limits = {
    free: { events: 3, ticketsPerEvent: 100 },
    pro: { events: 20, ticketsPerEvent: 500 },
    enterprise: { events: Infinity, ticketsPerEvent: Infinity },
  };

  return usage[limit] < limits[subscription.tier][limit];
}
```

**Usage example:**
```typescript
// In API route
export async function POST(request: Request) {
  // Check feature access
  const canCreateEvent = await checkUsageLimit(userId, 'events');
  if (!canCreateEvent) {
    return NextResponse.json(
      {
        error: 'Event limit reached',
        upgradePrompt: 'Upgrade to Pro to create 20 events per month',
      },
      { status: 403 }
    );
  }

  // Proceed with event creation
}
```

## Testing Requirements

```typescript
describe('SubscriptionService.calculateProration', () => {
  it('calculates correct prorated charge on upgrade', async () => {
    const proration = await subscriptionService.calculateProration({
      userId: 'user_123',
      currentPlanId: 'free',
      newPlanId: 'pro',
      billingCycle: 'monthly',
    });

    // If 15 days remaining in 30-day period:
    // Prorated charge = ($29 / 30) * 15 = $14.50
    expect(proration.immediateCharge).toBeCloseTo(14.50, 2);
  });

  it('applies credit on downgrade', async () => {
    const proration = await subscriptionService.calculateProration({
      userId: 'user_123',
      currentPlanId: 'pro',
      newPlanId: 'free',
      billingCycle: 'monthly',
    });

    expect(proration.immediateCharge).toBe(0); // No charge, only credit
    expect(proration.proratedCredit).toBeGreaterThan(0);
  });
});

describe('Feature gates', () => {
  it('blocks access to pro feature for free user', async () => {
    const hasAccess = await checkFeatureAccess('custom_branding', 'free_user_id');
    expect(hasAccess).toBe(false);
  });

  it('allows access to pro feature for pro user', async () => {
    const hasAccess = await checkFeatureAccess('custom_branding', 'pro_user_id');
    expect(hasAccess).toBe(true);
  });

  it('blocks event creation when limit reached', async () => {
    // Mock user with 3 events already created (free tier limit)
    const canCreate = await checkUsageLimit('free_user_id', 'events');
    expect(canCreate).toBe(false);
  });
});
```

## Definition of Done

- [ ] Proration calculation accurate
- [ ] Feature gate middleware implemented
- [ ] Usage limits enforced
- [ ] Tier-based access control working
- [ ] Upgrade prompts contextual
- [ ] Unit tests pass (>85% coverage)
- [ ] Integration tests pass
- [ ] Code reviewed and approved