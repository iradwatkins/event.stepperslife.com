# BILL-002: White-Label Subscription Billing

**Epic:** EPIC-019 - Platform Billing & Revenue
**Story Points:** 8
**Priority:** P1 (High)
**Status:** Ready for Development

## User Story

**As an** event organizer
**I want** to subscribe to white-label features with recurring monthly billing
**So that** I can brand my event pages and ticketing experience under my own domain

## Acceptance Criteria

### Primary Criteria
- [ ] Three subscription tiers available: Basic ($10/mo), Pro ($50/mo), Enterprise (custom)
- [ ] Recurring monthly billing via Stripe Billing/Subscriptions
- [ ] Immediate feature access upon successful payment
- [ ] Automatic subscription renewal with payment retry logic
- [ ] Clear tier comparison UI showing feature differences
- [ ] Upgrade/downgrade flow with proration
- [ ] Cancellation flow with end-of-period access
- [ ] Failed payment handling with grace period and dunning

### Subscription Management Criteria
- [ ] Free trial: 14 days for Pro tier (optional)
- [ ] Payment method management (add/remove/update cards)
- [ ] Billing history and invoice downloads
- [ ] Automatic email notifications for billing events
- [ ] Subscription status clearly displayed in dashboard
- [ ] Prevent feature access when subscription inactive

### Financial Compliance Criteria
- [ ] Revenue recognition: Monthly subscription revenue
- [ ] Proration calculations for mid-cycle changes
- [ ] Tax calculation per subscriber location (sales tax/VAT)
- [ ] Invoice generation with proper tax display
- [ ] PCI compliance: Use Stripe hosted payment forms
- [ ] Refund handling for subscription cancellations

## Technical Specifications

### Subscription Service

**File:** `lib/services/subscription.service.ts`

```typescript
enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED'
}

interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price: number // Monthly price in cents
  stripePriceId: string
  features: string[]
  limits: {
    customDomain: boolean
    removeSteppersLifeBranding: boolean
    customEmailDomain: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
    apiAccess: boolean
    maxEventsPerMonth: number | null // null = unlimited
    maxTicketsPerEvent: number | null
  }
}

interface Subscription {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripeSubscriptionId: string
  stripeCustomerId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialStart?: Date
  trialEnd?: Date
  createdAt: Date
  updatedAt: Date
}

class SubscriptionService {
  /**
   * Create new subscription (with trial if eligible)
   */
  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    paymentMethodId: string,
    enableTrial: boolean = false
  ): Promise<Subscription>

  /**
   * Upgrade subscription with proration
   */
  async upgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier
  ): Promise<Subscription>

  /**
   * Downgrade subscription (takes effect at period end)
   */
  async downgradeSubscription(
    subscriptionId: string,
    newTier: SubscriptionTier
  ): Promise<Subscription>

  /**
   * Cancel subscription (access continues until period end)
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Subscription>

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription>

  /**
   * Check if user has access to feature
   */
  hasFeatureAccess(subscription: Subscription, feature: string): boolean

  /**
   * Handle webhook from Stripe
   */
  async handleWebhook(event: Stripe.Event): Promise<void>

  /**
   * Calculate proration amount for upgrade/downgrade
   */
  async calculateProration(
    subscriptionId: string,
    newTier: SubscriptionTier
  ): Promise<{
    proratedAmount: number
    immediateCharge: number
    creditApplied: number
  }>
}
```

### Database Schema

**Table:** `subscriptions`

```sql
CREATE TYPE subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM (
  'ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED',
  'INCOMPLETE', 'INCOMPLETE_EXPIRED'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Subscription details
  tier subscription_tier NOT NULL DEFAULT 'FREE',
  status subscription_status NOT NULL DEFAULT 'ACTIVE',

  -- Stripe integration
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255),

  -- Billing cycle
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,

  -- Trial
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,

  -- Payment
  last_payment_date TIMESTAMP,
  last_payment_amount DECIMAL(10,2),
  next_billing_date TIMESTAMP,

  -- Metadata
  metadata JSONB, -- Store additional subscription data

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_active_subscription UNIQUE (user_id)
    WHERE status IN ('ACTIVE', 'TRIAL', 'PAST_DUE')
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

**Table:** `subscription_invoices`

```sql
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV-2025-001234
  stripe_invoice_id VARCHAR(255) UNIQUE,

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL, -- draft, open, paid, void, uncollectible
  paid BOOLEAN DEFAULT FALSE,

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- PDF
  pdf_url TEXT,
  hosted_invoice_url TEXT, -- Stripe hosted invoice page

  -- Metadata
  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_user ON subscription_invoices(user_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_date ON subscription_invoices(invoice_date);
```

**Table:** `subscription_events`

```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),

  -- Event details
  event_type VARCHAR(100) NOT NULL, -- created, upgraded, downgraded, canceled, etc.
  from_tier subscription_tier,
  to_tier subscription_tier,

  -- Financial impact
  proration_amount DECIMAL(10,2),
  immediate_charge DECIMAL(10,2),
  credit_applied DECIMAL(10,2),

  -- Metadata
  reason TEXT,
  triggered_by UUID REFERENCES users(id), -- User who triggered the event
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_date ON subscription_events(created_at);
```

### Subscription Plans Configuration

**File:** `lib/config/subscription-plans.ts`

```typescript
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    price: 0,
    stripePriceId: '', // No Stripe price for free tier
    features: [
      'Basic event creation',
      'Standard ticketing',
      'SteppersLife branding',
      'Email support'
    ],
    limits: {
      customDomain: false,
      removeSteppersLifeBranding: false,
      customEmailDomain: false,
      advancedAnalytics: false,
      prioritySupport: false,
      apiAccess: false,
      maxEventsPerMonth: 5,
      maxTicketsPerEvent: 100
    }
  },

  BASIC: {
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    price: 1000, // $10.00 in cents
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID!,
    features: [
      'All Free features',
      'Remove SteppersLife branding',
      'Custom event URL',
      'Basic analytics',
      'Priority email support'
    ],
    limits: {
      customDomain: false,
      removeSteppersLifeBranding: true,
      customEmailDomain: false,
      advancedAnalytics: false,
      prioritySupport: true,
      apiAccess: false,
      maxEventsPerMonth: 20,
      maxTicketsPerEvent: 500
    }
  },

  PRO: {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    price: 5000, // $50.00 in cents
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      'All Basic features',
      'Custom domain (yourevents.com)',
      'Custom email domain',
      'Advanced analytics & reporting',
      'API access',
      'White-label mobile tickets',
      'Priority phone support',
      '14-day free trial'
    ],
    limits: {
      customDomain: true,
      removeSteppersLifeBranding: true,
      customEmailDomain: true,
      advancedAnalytics: true,
      prioritySupport: true,
      apiAccess: true,
      maxEventsPerMonth: null, // Unlimited
      maxTicketsPerEvent: null // Unlimited
    }
  },

  ENTERPRISE: {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    price: 0, // Custom pricing - contact sales
    stripePriceId: '', // Created per customer
    features: [
      'All Pro features',
      'Dedicated account manager',
      'Custom feature development',
      'SLA guarantees',
      'Advanced security features',
      'Custom integrations',
      'On-premise deployment option',
      'Custom contract terms'
    ],
    limits: {
      customDomain: true,
      removeSteppersLifeBranding: true,
      customEmailDomain: true,
      advancedAnalytics: true,
      prioritySupport: true,
      apiAccess: true,
      maxEventsPerMonth: null,
      maxTicketsPerEvent: null
    }
  }
}
```

### API Endpoints

**POST /api/subscriptions/create**
```typescript
// Create new subscription
Request: {
  tier: SubscriptionTier
  paymentMethodId: string // Stripe payment method ID
  enableTrial?: boolean
}

Response: {
  subscription: Subscription
  invoice: {
    id: string
    amount: number
    status: string
    hostedInvoiceUrl: string
  }
}
```

**POST /api/subscriptions/:id/upgrade**
```typescript
// Upgrade subscription with proration
Request: {
  newTier: SubscriptionTier
}

Response: {
  subscription: Subscription
  proration: {
    proratedAmount: number
    immediateCharge: number
    creditApplied: number
  }
}
```

**POST /api/subscriptions/:id/downgrade**
```typescript
// Downgrade (takes effect at period end)
Request: {
  newTier: SubscriptionTier
}

Response: {
  subscription: Subscription
  effectiveDate: string // When downgrade takes effect
}
```

**POST /api/subscriptions/:id/cancel**
```typescript
// Cancel subscription
Request: {
  immediately: boolean // true = cancel now, false = end of period
  reason?: string
}

Response: {
  subscription: Subscription
  accessUntil: string // When access ends
  refundAmount?: number // If immediate cancellation with refund
}
```

**GET /api/subscriptions/current**
```typescript
// Get current user's subscription
Response: {
  subscription: Subscription
  plan: SubscriptionPlan
  usage: {
    eventsThisMonth: number
    eventsLimit: number | null
  }
  nextInvoice: {
    date: string
    amount: number
  }
}
```

**POST /api/webhooks/stripe/subscription**
```typescript
// Stripe webhook handler
// Handles events:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_succeeded
// - invoice.payment_failed
```

## Integration Points

### 1. Stripe Billing Integration
- Create Stripe Customer on user signup
- Create Stripe Subscription with price ID
- Handle payment method updates
- Process webhook events
- Generate hosted invoice pages

### 2. White-Label Features (EPIC-011)
- Check subscription tier before allowing custom domain
- Disable features when subscription inactive
- Show/hide branding based on subscription
- Gate API access by subscription tier

### 3. Payment Processing
- Use Stripe Checkout for initial subscription
- Stripe Customer Portal for self-service management
- Payment retry logic for failed payments
- Dunning emails for past-due subscriptions

### 4. User Dashboard
- Display current subscription status
- Show next billing date and amount
- Provide upgrade/downgrade buttons
- Show billing history
- Allow payment method updates

### 5. Email Notifications
- Subscription created confirmation
- Payment successful receipt
- Payment failed notification (with retry info)
- Subscription upgraded/downgraded confirmation
- Trial ending reminder (3 days before)
- Subscription canceled confirmation

## Business Rules

### Trial Period
- **Eligibility:** New Pro subscribers only
- **Duration:** 14 days
- **Payment:** Credit card required, not charged until trial ends
- **Cancellation:** Can cancel during trial with no charge
- **Features:** Full Pro tier access during trial

### Proration Logic
- **Upgrade:** Immediate charge for prorated difference
  - Example: Upgrade from Basic ($10) to Pro ($50) on day 15 of 30
  - Prorated charge: ($50 - $10) * (15 / 30) = $20
- **Downgrade:** Credit applied, takes effect next billing cycle
- **Same billing cycle:** Changes take effect immediately

### Payment Failure Handling
1. **Day 0:** Payment fails, subscription status = PAST_DUE
2. **Day 0-7:** Retry payment 3 times (day 1, 3, 7)
3. **Day 7:** Send final warning email
4. **Day 10:** Subscription canceled, features disabled

### Cancellation Policy
- **End of period:** Access continues until current period ends
- **Immediate:** Access revoked immediately, partial refund calculated
- **No refunds:** For subscriptions older than 30 days (configurable)
- **Reactivation:** Can reactivate before period end with no charge

### Feature Access Control
```typescript
// Middleware to check subscription access
function requireSubscriptionTier(minTier: SubscriptionTier) {
  return async (req, res, next) => {
    const subscription = await getSubscription(req.user.id)

    if (!subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Active subscription required' })
    }

    const tierOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE']
    const userTierIndex = tierOrder.indexOf(subscription.tier)
    const requiredTierIndex = tierOrder.indexOf(minTier)

    if (userTierIndex < requiredTierIndex) {
      return res.status(403).json({
        error: `${minTier} subscription required`,
        currentTier: subscription.tier
      })
    }

    next()
  }
}
```

## UI/UX Specifications

### Tier Comparison Page
```tsx
// Component: components/billing/TierComparison.tsx
<div className="grid grid-cols-4 gap-4">
  <TierCard tier="FREE" current={false} />
  <TierCard tier="BASIC" current={false} />
  <TierCard tier="PRO" current={true} popular={true} />
  <TierCard tier="ENTERPRISE" current={false} />
</div>
```

Features to highlight:
- Current tier badge
- "Popular" badge on Pro tier
- Feature comparison table
- Clear CTA buttons (Upgrade/Downgrade/Current Plan)
- Monthly vs Annual pricing toggle (future)

### Subscription Management Dashboard
- Current plan display with status badge
- Next billing date and amount
- Usage metrics (events created this month)
- Quick actions: Upgrade, Cancel, Update Payment
- Billing history table with invoice downloads

### Upgrade Flow
1. Select new tier
2. Show proration calculation
3. Confirm payment method
4. Process upgrade
5. Show success with new features unlocked

### Cancellation Flow
1. Ask for cancellation reason (survey)
2. Offer discount/downgrade alternative
3. Confirm cancellation
4. Show access end date
5. Send confirmation email

## Testing Requirements

### Unit Tests
- Subscription creation with various tiers
- Proration calculations (upgrade/downgrade)
- Feature access control logic
- Trial period expiration handling
- Payment failure retry logic

### Integration Tests
- Stripe webhook event handling
- Subscription lifecycle (create → upgrade → cancel)
- Payment method updates
- Invoice generation
- Email notifications triggered correctly

### E2E Tests
- User subscribes to Pro with trial
- User upgrades from Basic to Pro
- User downgrades from Pro to Basic
- Payment fails and subscription goes past due
- User cancels subscription

## Performance Requirements

- Subscription status check: < 50ms (cached)
- Webhook processing: < 500ms
- Proration calculation: < 100ms
- Invoice generation: < 2 seconds
- Dashboard load: < 1 second

## Security Considerations

- Use Stripe hosted payment pages (PCI compliance)
- Verify webhook signatures from Stripe
- Encrypt customer IDs and subscription IDs
- Rate limit subscription API endpoints
- Audit log all subscription changes

## Monitoring & Alerts

### Metrics to Track
- Monthly Recurring Revenue (MRR)
- Churn rate by tier
- Trial conversion rate
- Failed payment rate
- Average revenue per user (ARPU)

### Alerts
- Failed payment rate > 5%
- Churn rate spike (> 10% increase)
- Webhook processing failures
- Subscription creation failures

## Documentation Requirements

- [ ] Subscription tier comparison documentation
- [ ] API documentation for subscription endpoints
- [ ] Stripe webhook setup guide
- [ ] Proration calculation examples
- [ ] Feature gating implementation guide

## Dependencies

- Stripe Billing API integration
- EPIC-011: White-Label Features (parallel development)
- BILL-003: Revenue Distribution (for subscription revenue tracking)
- Email service (SendGrid/AWS SES) configured

## Definition of Done

- [ ] All three tiers configurable in Stripe
- [ ] Subscription service implemented and tested
- [ ] Database schema created with all tables
- [ ] API endpoints deployed and documented
- [ ] Stripe webhook handler operational
- [ ] Proration logic tested and accurate
- [ ] Trial period functionality working
- [ ] Feature access control middleware deployed
- [ ] UI components for subscription management complete
- [ ] Email notifications configured
- [ ] Payment failure handling with dunning
- [ ] All tests passing (unit, integration, E2E)
- [ ] Monitoring and metrics dashboards configured
- [ ] Documentation published

## Notes

**Revenue Recognition:** Subscription revenue is recognized monthly. Use accrual accounting to match revenue with the service period.

**Tax Compliance:** Collect sales tax / VAT based on customer location. Use Stripe Tax for automatic calculation.

**Refund Policy:** Clearly communicate refund policy in terms of service. Prorated refunds for immediate cancellations within first 30 days.

**Enterprise Tier:** Requires manual sales process. Create custom Stripe products per enterprise customer with negotiated pricing.