# BILL-006: Subscription Tier Management

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 5
**Priority:** P1 (High)
**Status:** Ready for Development

## User Story

**As an** event organizer
**I want** to upgrade or downgrade my subscription tier with proper billing adjustments
**So that** I can access features appropriate to my current needs and budget

## Acceptance Criteria

### Primary Criteria
- [ ] Clear tier comparison UI showing all features and pricing
- [ ] One-click upgrade with immediate feature access
- [ ] Downgrade scheduling (takes effect at period end)
- [ ] Automatic proration calculation for mid-cycle changes
- [ ] Trial period support (14 days for Pro tier)
- [ ] Cancellation flow with retention offers
- [ ] Feature gating based on active subscription tier
- [ ] Usage limit enforcement (events/month, tickets/event)

### Upgrade Flow
- [ ] Select target tier from comparison page
- [ ] Show proration amount and immediate charge
- [ ] Confirm payment method
- [ ] Process upgrade immediately
- [ ] Grant access to new tier features instantly
- [ ] Send confirmation email with invoice
- [ ] Update next billing amount to new tier price

### Downgrade Flow
- [ ] Select lower tier
- [ ] Show confirmation: "Downgrade takes effect on [date]"
- [ ] List features that will be lost
- [ ] Offer discount to stay on current tier (optional)
- [ ] Schedule downgrade for end of current period
- [ ] Send confirmation email
- [ ] Reminder email 3 days before downgrade takes effect

### Cancellation Flow
- [ ] Cancellation reason survey (optional)
- [ ] Offer discount or downgrade as alternative
- [ ] Confirm cancellation
- [ ] Access continues until period end
- [ ] Send confirmation with access end date
- [ ] Option to reactivate before period end
- [ ] Automatic feature revocation at period end

## Technical Specifications

### Subscription Tier Management Service

**File:** `lib/services/subscription-tier-management.service.ts`

```typescript
enum TierChangeType {
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE',
  REACTIVATE = 'REACTIVATE',
  CANCEL = 'CANCEL'
}

interface TierChangeRequest {
  id: string
  subscriptionId: string
  userId: string
  fromTier: SubscriptionTier
  toTier: SubscriptionTier
  changeType: TierChangeType
  status: 'pending' | 'scheduled' | 'completed' | 'canceled'

  // Financial
  proratedAmount: number
  immediateCharge: number
  creditApplied: number

  // Schedule
  requestedAt: Date
  scheduledFor?: Date
  completedAt?: Date

  // Metadata
  reason?: string
  metadata: any
}

interface UsageLimits {
  maxEventsPerMonth: number | null
  maxTicketsPerEvent: number | null
  currentEventsThisMonth: number
  resetDate: Date
}

class SubscriptionTierManagementService {
  /**
   * Upgrade subscription to higher tier
   */
  async upgradeSubscription(
    subscriptionId: string,
    targetTier: SubscriptionTier
  ): Promise<{
    subscription: Subscription
    tierChange: TierChangeRequest
    invoice: Invoice
  }>

  /**
   * Downgrade subscription (scheduled for period end)
   */
  async downgradeSubscription(
    subscriptionId: string,
    targetTier: SubscriptionTier,
    reason?: string
  ): Promise<{
    subscription: Subscription
    tierChange: TierChangeRequest
    effectiveDate: Date
  }>

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false,
    reason?: string
  ): Promise<{
    subscription: Subscription
    tierChange: TierChangeRequest
    accessUntil: Date
    refundAmount?: number
  }>

  /**
   * Reactivate canceled subscription (before period end)
   */
  async reactivateSubscription(
    subscriptionId: string
  ): Promise<Subscription>

  /**
   * Check if user has feature access
   */
  hasFeatureAccess(
    subscription: Subscription,
    feature: keyof SubscriptionPlan['limits']
  ): boolean

  /**
   * Check usage limits
   */
  async checkUsageLimits(
    userId: string,
    limitType: 'events' | 'tickets'
  ): Promise<UsageLimits>

  /**
   * Enforce usage limits
   */
  async enforceUsageLimit(
    userId: string,
    limitType: 'events' | 'tickets',
    requestedAmount: number
  ): Promise<{
    allowed: boolean
    remaining: number
    upgradeRequired?: SubscriptionTier
  }>

  /**
   * Calculate proration for tier change
   */
  async calculateProration(
    subscription: Subscription,
    targetTier: SubscriptionTier,
    changeDate: Date = new Date()
  ): Promise<{
    currentTierPrice: number
    targetTierPrice: number
    daysRemaining: number
    totalDays: number
    proratedAmount: number
    immediateCharge: number
    creditApplied: number
  }>

  /**
   * Get tier upgrade recommendations
   */
  async getTierRecommendations(
    userId: string
  ): Promise<{
    currentTier: SubscriptionTier
    recommendedTier?: SubscriptionTier
    reason: string
    potentialSavings?: number
  }>

  /**
   * Process scheduled tier changes (cron job)
   */
  async processScheduledTierChanges(): Promise<void>
}
```

### Database Schema

**Table:** `tier_change_requests`

```sql
CREATE TYPE tier_change_type AS ENUM (
  'UPGRADE', 'DOWNGRADE', 'REACTIVATE', 'CANCEL'
);

CREATE TABLE tier_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Change details
  from_tier subscription_tier NOT NULL,
  to_tier subscription_tier,
  change_type tier_change_type NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  -- Financial
  prorated_amount DECIMAL(10,2),
  immediate_charge DECIMAL(10,2),
  credit_applied DECIMAL(10,2),

  -- Schedule
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMP,
  completed_at TIMESTAMP,
  canceled_at TIMESTAMP,

  -- Metadata
  reason TEXT,
  retention_offer_shown BOOLEAN DEFAULT FALSE,
  retention_offer_accepted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tier_change_requests_subscription ON tier_change_requests(subscription_id);
CREATE INDEX idx_tier_change_requests_user ON tier_change_requests(user_id);
CREATE INDEX idx_tier_change_requests_status ON tier_change_requests(status);
CREATE INDEX idx_tier_change_requests_scheduled ON tier_change_requests(scheduled_for);
```

**Table:** `subscription_usage`

```sql
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),

  -- Usage tracking
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Counters
  events_created INTEGER DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,

  -- Limits (copied from plan for historical tracking)
  events_limit INTEGER,
  tickets_limit INTEGER,

  -- Flags
  limit_exceeded BOOLEAN DEFAULT FALSE,
  limit_exceeded_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_period UNIQUE (user_id, period_start)
);

CREATE INDEX idx_subscription_usage_user ON subscription_usage(user_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);
CREATE INDEX idx_subscription_usage_exceeded ON subscription_usage(limit_exceeded);
```

**Table:** `feature_access_log`

```sql
CREATE TABLE feature_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),

  -- Feature access attempt
  feature_name VARCHAR(100) NOT NULL,
  access_granted BOOLEAN NOT NULL,
  denial_reason VARCHAR(255),

  -- Tier info at time of access
  current_tier subscription_tier,
  required_tier subscription_tier,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_access_log_user ON feature_access_log(user_id);
CREATE INDEX idx_feature_access_log_feature ON feature_access_log(feature_name);
CREATE INDEX idx_feature_access_log_date ON feature_access_log(created_at);
```

### Proration Calculation Logic

```typescript
/**
 * Calculate proration for mid-cycle tier change
 *
 * Example:
 * - Current tier: Basic ($10/mo)
 * - Target tier: Pro ($50/mo)
 * - Current period: Jan 1 - Jan 31 (31 days)
 * - Change date: Jan 16 (16 days remaining)
 *
 * Calculation:
 * - Already paid: $10 for full month
 * - Pro rate for remaining period: $50 * (16/31) = $25.81
 * - Credit for unused Basic: $10 * (16/31) = $5.16
 * - Immediate charge: $25.81 - $5.16 = $20.65
 * - Next invoice: $50 (full Pro price)
 */
function calculateProration(
  subscription: Subscription,
  targetTier: SubscriptionTier,
  changeDate: Date
): ProrationResult {
  const currentPlan = SUBSCRIPTION_PLANS[subscription.tier]
  const targetPlan = SUBSCRIPTION_PLANS[targetTier]

  // Calculate days in billing period
  const periodStart = subscription.currentPeriodStart
  const periodEnd = subscription.currentPeriodEnd
  const totalDays = differenceInDays(periodEnd, periodStart)
  const daysRemaining = differenceInDays(periodEnd, changeDate)

  // Calculate unused credit from current tier
  const currentTierDailyRate = currentPlan.price / totalDays
  const creditApplied = currentTierDailyRate * daysRemaining

  // Calculate prorated cost for target tier
  const targetTierDailyRate = targetPlan.price / totalDays
  const proratedAmount = targetTierDailyRate * daysRemaining

  // Immediate charge = prorated cost - credit
  const immediateCharge = Math.max(0, proratedAmount - creditApplied)

  return {
    currentTierPrice: currentPlan.price,
    targetTierPrice: targetPlan.price,
    daysRemaining,
    totalDays,
    proratedAmount,
    creditApplied,
    immediateCharge
  }
}
```

### Feature Gating Middleware

```typescript
/**
 * Middleware to check feature access
 */
function requireFeature(feature: keyof SubscriptionPlan['limits']) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id
    const subscription = await getActiveSubscription(userId)

    if (!subscription) {
      return res.status(403).json({
        error: 'Active subscription required',
        feature,
        upgradeUrl: '/dashboard/billing/upgrade'
      })
    }

    const plan = SUBSCRIPTION_PLANS[subscription.tier]
    const hasAccess = plan.limits[feature]

    if (!hasAccess) {
      // Log denial for analytics
      await logFeatureAccessDenial(userId, feature, subscription.tier)

      return res.status(403).json({
        error: `${feature} requires higher subscription tier`,
        currentTier: subscription.tier,
        requiredTier: getMinimumTierForFeature(feature),
        upgradeUrl: '/dashboard/billing/upgrade'
      })
    }

    // Log successful access
    await logFeatureAccess(userId, feature, true)

    next()
  }
}

// Usage in routes:
router.post('/events/:id/custom-domain',
  requireFeature('customDomain'),
  setCustomDomain
)
```

### Usage Limit Enforcement

```typescript
/**
 * Check and enforce usage limits
 */
async function enforceEventCreationLimit(userId: string): Promise<void> {
  const subscription = await getActiveSubscription(userId)
  const plan = SUBSCRIPTION_PLANS[subscription.tier]

  // If unlimited, allow
  if (plan.limits.maxEventsPerMonth === null) {
    return
  }

  // Get current month usage
  const usage = await getMonthlyUsage(userId)

  if (usage.eventsCreated >= plan.limits.maxEventsPerMonth) {
    throw new UsageLimitExceededError({
      limit: plan.limits.maxEventsPerMonth,
      current: usage.eventsCreated,
      resetDate: usage.periodEnd,
      upgradeRequired: getNextTierWithUnlimitedEvents(subscription.tier)
    })
  }

  // Increment counter
  await incrementUsageCounter(userId, 'events_created')
}
```

### API Endpoints

**POST /api/subscriptions/:id/upgrade**
```typescript
// Upgrade subscription
Request: {
  targetTier: SubscriptionTier
}

Response: {
  subscription: Subscription
  tierChange: TierChangeRequest
  proration: {
    immediateCharge: number
    creditApplied: number
    nextInvoiceAmount: number
  }
  invoice: {
    id: string
    amount: number
    paidAt: string
  }
  featuresUnlocked: string[]
}
```

**POST /api/subscriptions/:id/downgrade**
```typescript
// Schedule downgrade
Request: {
  targetTier: SubscriptionTier
  reason?: string
}

Response: {
  subscription: Subscription
  tierChange: TierChangeRequest
  effectiveDate: string
  featuresWillLose: string[]
  retentionOffer?: {
    discountPercent: number
    validUntil: string
  }
}
```

**POST /api/subscriptions/:id/cancel**
```typescript
// Cancel subscription
Request: {
  immediately: boolean
  reason?: string
  feedback?: string
}

Response: {
  subscription: Subscription
  accessUntil: string
  refundAmount?: number
  reactivateUrl: string
}
```

**POST /api/subscriptions/:id/reactivate**
```typescript
// Reactivate canceled subscription
Response: {
  subscription: Subscription
  message: string
}
```

**GET /api/subscriptions/tier-comparison**
```typescript
// Get tier comparison data
Response: {
  currentTier?: SubscriptionTier
  tiers: Array<{
    tier: SubscriptionTier
    name: string
    price: number
    features: string[]
    limits: SubscriptionPlan['limits']
    isCurrent: boolean
    canUpgrade: boolean
    canDowngrade: boolean
    popular?: boolean
  }>
}
```

**GET /api/subscriptions/usage**
```typescript
// Get current usage
Response: {
  subscription: Subscription
  usage: {
    eventsCreated: number
    eventsLimit: number | null
    ticketsSold: number
    ticketsLimit: number | null
    periodStart: string
    periodEnd: string
    resetDate: string
  }
  limits: {
    events: {
      remaining: number | 'unlimited'
      percentUsed: number
    }
    tickets: {
      remaining: number | 'unlimited'
      percentUsed: number
    }
  }
}
```

**POST /api/subscriptions/check-feature-access**
```typescript
// Check if user has access to feature
Request: {
  feature: string
}

Response: {
  hasAccess: boolean
  currentTier: SubscriptionTier
  requiredTier?: SubscriptionTier
  upgradeUrl?: string
}
```

## Integration Points

### 1. Subscription Billing (BILL-002)
- Use Stripe subscription update API
- Handle proration automatically via Stripe
- Update subscription record in database
- Generate invoices for upgrades

### 2. White-Label Features (EPIC-011)
- Enable/disable features based on tier
- Show upgrade prompts for locked features
- Revoke access when subscription downgrades/cancels

### 3. Event Management
- Enforce event creation limits
- Show usage warnings when approaching limits
- Block event creation when limit exceeded

### 4. Email Notifications
- Upgrade confirmation with feature list
- Downgrade scheduled notification
- Cancellation confirmation
- Usage limit warning (80%, 90%, 100%)
- Tier recommendation emails

### 5. Analytics
- Track tier change patterns
- Measure feature adoption by tier
- Calculate customer lifetime value (CLV) by tier
- Identify upgrade/downgrade triggers

## Business Rules

### Upgrade Rules
- **Immediate effect:** Features unlocked instantly
- **Proration:** Charged prorated difference immediately
- **Access:** All higher tier features available right away
- **Billing:** Next invoice at new tier price

### Downgrade Rules
- **Scheduled:** Takes effect at end of current period
- **Access:** Current tier features remain until period end
- **Billing:** No immediate refund
- **Next invoice:** Lower tier price
- **Retention:** Show offer to stay (10-20% discount)

### Cancellation Rules
- **Default:** Access until end of period
- **Immediate:** Prorated refund (if within 30 days)
- **Reactivation window:** Can reactivate until period end
- **Data retention:** Account data retained for 90 days
- **Auto-downgrade:** Revert to FREE tier after cancellation

### Usage Limit Rules
- **Soft limit:** Warning at 80% and 90%
- **Hard limit:** Block action at 100%
- **Reset:** Beginning of each month (1st day)
- **Overage:** No overage charges, upgrade required
- **Grandfathering:** Existing events not affected by downgrade

### Trial Period Rules
- **Duration:** 14 days for Pro tier only
- **Payment:** Credit card required, no charge during trial
- **Access:** Full Pro tier features
- **End:** Auto-convert to paid unless canceled
- **Notification:** Reminder 3 days before trial ends

### Retention Offers
- **Trigger:** Downgrade or cancel request
- **Offer:** 10-20% discount for 3-6 months
- **Eligibility:** Active subscribers with >3 months tenure
- **Limit:** One retention offer per year

## UI/UX Specifications

### Tier Comparison Page

```tsx
<TierComparison>
  <TierCard tier="FREE">
    <Price>$0/month</Price>
    <FeatureList>
      ✓ 5 events per month
      ✓ 100 tickets per event
      ✓ Basic analytics
      ✓ Email support
    </FeatureList>
    <Button disabled>Current Plan</Button>
  </TierCard>

  <TierCard tier="BASIC">
    <Price>$10/month</Price>
    <Badge>Most Popular</Badge>
    <FeatureList>
      ✓ 20 events per month
      ✓ 500 tickets per event
      ✓ Remove SteppersLife branding
      ✓ Priority support
    </FeatureList>
    <Button onClick={() => upgrade('BASIC')}>Upgrade</Button>
  </TierCard>

  <TierCard tier="PRO" featured>
    <Price>$50/month</Price>
    <Badge color="blue">14-day trial</Badge>
    <FeatureList>
      ✓ Unlimited events
      ✓ Unlimited tickets
      ✓ Custom domain
      ✓ Advanced analytics
      ✓ API access
      ✓ Phone support
    </FeatureList>
    <Button variant="primary" onClick={() => upgrade('PRO')}>
      Start Free Trial
    </Button>
  </TierCard>

  <TierCard tier="ENTERPRISE">
    <Price>Custom</Price>
    <FeatureList>
      ✓ All Pro features
      ✓ Dedicated account manager
      ✓ Custom integrations
      ✓ SLA guarantees
    </FeatureList>
    <Button onClick={() => contactSales()}>Contact Sales</Button>
  </TierCard>
</TierComparison>
```

### Upgrade Flow Modal

```tsx
<UpgradeModal tier="PRO">
  <ModalHeader>
    <h2>Upgrade to Pro</h2>
    <p>Unlock advanced features for your events</p>
  </ModalHeader>

  <FeaturesUnlocked>
    <Feature icon="✓" name="Custom Domain" />
    <Feature icon="✓" name="Unlimited Events" />
    <Feature icon="✓" name="Advanced Analytics" />
    <Feature icon="✓" name="API Access" />
  </FeaturesUnlocked>

  <ProrationSummary>
    <Row>
      <Label>Pro plan (prorated)</Label>
      <Value>$25.81</Value>
    </Row>
    <Row>
      <Label>Unused Basic credit</Label>
      <Value>-$5.16</Value>
    </Row>
    <Divider />
    <Row bold>
      <Label>Charge today</Label>
      <Value>$20.65</Value>
    </Row>
    <Row>
      <Label>Next invoice (Feb 1)</Label>
      <Value>$50.00</Value>
    </Row>
  </ProrationSummary>

  <PaymentMethod card={savedCard} />

  <Actions>
    <Button variant="secondary" onClick={cancel}>Cancel</Button>
    <Button variant="primary" onClick={confirmUpgrade}>
      Upgrade Now
    </Button>
  </Actions>
</UpgradeModal>
```

### Usage Dashboard

```tsx
<UsageDashboard>
  <UsageCard>
    <Label>Events This Month</Label>
    <Progress value={8} max={20} />
    <Text>8 of 20 events used</Text>
    <Warning show={8 >= 16}>
      You're approaching your limit. Upgrade to Pro for unlimited events.
    </Warning>
  </UsageCard>

  <UsageCard>
    <Label>Tickets Per Event</Label>
    <Text>Up to 500 tickets per event</Text>
    <InfoText>Upgrade to Pro for unlimited tickets</InfoText>
  </UsageCard>

  <UsageCard>
    <Label>Next Reset</Label>
    <Text>February 1, 2025</Text>
  </UsageCard>
</UsageDashboard>
```

### Cancellation Flow

```tsx
<CancellationFlow>
  <Step1_Reason>
    <h3>We're sorry to see you go</h3>
    <p>Help us improve by telling us why you're canceling:</p>
    <RadioGroup>
      <Radio value="too-expensive">Too expensive</Radio>
      <Radio value="not-enough-features">Not enough features</Radio>
      <Radio value="switching-provider">Switching to another provider</Radio>
      <Radio value="no-longer-needed">No longer needed</Radio>
      <Radio value="other">Other</Radio>
    </RadioGroup>
    <Textarea placeholder="Additional feedback (optional)" />
    <Button onClick={nextStep}>Continue</Button>
  </Step1_Reason>

  <Step2_RetentionOffer>
    <h3>Wait! We have a special offer for you</h3>
    <OfferCard>
      <Badge>Limited Time</Badge>
      <h4>Stay on Pro for 20% off</h4>
      <Price>
        <strike>$50/month</strike> $40/month
      </Price>
      <Text>Valid for the next 6 months</Text>
      <Button variant="primary" onClick={acceptOffer}>
        Accept Offer
      </Button>
    </OfferCard>
    <TextButton onClick={nextStep}>
      No thanks, continue canceling
    </TextButton>
  </Step2_RetentionOffer>

  <Step3_Confirmation>
    <h3>Confirm Cancellation</h3>
    <Alert type="warning">
      Your Pro subscription will be canceled. You'll have access until
      January 31, 2025. After that, you'll be downgraded to the Free plan.
    </Alert>
    <FeaturesList>
      <h4>You'll lose access to:</h4>
      <Feature>Custom domain</Feature>
      <Feature>Advanced analytics</Feature>
      <Feature>Unlimited events</Feature>
      <Feature>API access</Feature>
    </FeaturesList>
    <Actions>
      <Button variant="secondary" onClick={cancel}>
        Never Mind
      </Button>
      <Button variant="danger" onClick={confirmCancel}>
        Cancel Subscription
      </Button>
    </Actions>
  </Step3_Confirmation>
</CancellationFlow>
```

## Testing Requirements

### Unit Tests
- Proration calculation accuracy
- Feature access logic
- Usage limit enforcement
- Tier change validation
- Retention offer eligibility

### Integration Tests
- Upgrade flow with Stripe
- Downgrade scheduling
- Cancellation with reactivation
- Trial conversion to paid
- Usage counter increments

### E2E Tests
- User upgrades from Basic to Pro
- User downgrades from Pro to Basic at period end
- User cancels subscription and reactivates
- User hits usage limit and upgrades
- Trial period expires and converts

## Performance Requirements

- Tier comparison page load: < 1 second
- Upgrade processing: < 3 seconds
- Feature access check: < 50ms (cached)
- Usage limit check: < 100ms
- Proration calculation: < 100ms

## Security Considerations

- Validate tier transitions (no invalid tier changes)
- Prevent race conditions in usage counters
- Audit log all tier changes
- Verify payment method before upgrade
- Rate limit tier change API endpoints

## Monitoring & Alerts

### Metrics to Track
- Upgrade rate by source tier
- Downgrade rate by source tier
- Trial conversion rate
- Cancellation rate and reasons
- Average time on each tier
- Feature usage by tier

### Alerts
- High cancellation rate spike
- Low trial conversion rate
- Usage limit exceeded frequently
- Tier change processing failures

## Documentation Requirements

- [ ] Tier comparison guide for organizers
- [ ] Proration explanation
- [ ] Usage limits documentation
- [ ] Feature access matrix
- [ ] Cancellation policy

## Dependencies

- BILL-002: White-Label Subscription Billing (must complete first)
- EPIC-011: White-Label Features (parallel development)
- Stripe subscription management integration

## Definition of Done

- [ ] Subscription tier management service implemented
- [ ] Database schema created
- [ ] Proration calculation tested
- [ ] Feature gating middleware deployed
- [ ] Usage limit enforcement working
- [ ] All API endpoints deployed
- [ ] Tier comparison UI complete
- [ ] Upgrade/downgrade flows working
- [ ] Cancellation flow with retention offers
- [ ] Email notifications configured
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Documentation published

## Notes

**Proration:** Use Stripe's built-in proration for simplicity and accuracy.

**Feature Access:** Cache subscription tier in session/JWT for fast feature access checks.

**Usage Limits:** Use distributed counters (Redis) for high-concurrency scenarios.

**Retention:** A/B test different retention offer amounts to optimize retention rate vs. revenue impact.

**Graceful Degradation:** When downgrading, don't delete data (custom domains, etc.). Just disable access until they upgrade again.