# BILL-002a: Subscription Plan Setup & Database Schema

**Epic:** EPIC-019 - Platform Billing & Revenue
**Parent Story:** BILL-002 - White-Label Subscription Billing
**Story Points:** 3
**Priority:** P1 (High)
**Status:** Ready for Development

## Parent Story Context

This is **Part 1 of 3** of the White-Label Subscription Billing story (BILL-002). This sub-story focuses on establishing the foundation for subscription billing by creating the database schema, subscription plan configuration, and basic CRUD operations for managing subscription plans and tiers.

**Total Parent Story Points:** 8
**This Sub-Story:** 3 points

**Sibling Stories:**
- BILL-002b: Stripe Billing Integration (3 points) - Depends on this
- BILL-002c: Subscription Lifecycle Management (2 points) - Depends on BILL-002b

## User Story

**As a** platform administrator
**I want** to configure subscription plans with different tiers and pricing
**So that** organizers can choose the right subscription level for their needs

## Acceptance Criteria

### Primary Criteria
- [ ] Database schema created for subscriptions, plans, and events
- [ ] Four subscription tiers defined: FREE, BASIC ($10/mo), PRO ($50/mo), ENTERPRISE (custom)
- [ ] Feature gates configured for each tier
- [ ] Usage limits defined per tier (events/month, tickets/event)
- [ ] Subscription plan CRUD API endpoints functional
- [ ] Plan configuration stored in database (not hardcoded)
- [ ] Admin UI for managing subscription plans
- [ ] Feature access middleware implemented and tested

### Data Model Criteria
- [ ] Subscription table with proper foreign keys
- [ ] Subscription events table for audit trail
- [ ] Invoice tracking table created
- [ ] Proper indexes for performance
- [ ] Constraints for data integrity
- [ ] Enum types for tier and status

### Feature Gate Criteria
- [ ] Custom domain access control
- [ ] Branding removal control
- [ ] Analytics feature gating
- [ ] API access control
- [ ] Event and ticket limit enforcement
- [ ] Support tier prioritization

## Technical Specifications

### Database Schema

**Table: `subscriptions`**

```sql
CREATE TYPE subscription_tier AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE subscription_status AS ENUM (
  'ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED',
  'INCOMPLETE', 'INCOMPLETE_EXPIRED'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Subscription details
  tier subscription_tier NOT NULL DEFAULT 'FREE',
  status subscription_status NOT NULL DEFAULT 'ACTIVE',

  -- Stripe integration (populated in BILL-002b)
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Billing cycle
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,

  -- Trial
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,

  -- Payment tracking
  last_payment_date TIMESTAMP,
  last_payment_amount DECIMAL(10,2),
  next_billing_date TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Ensure only one active subscription per user
  CONSTRAINT unique_user_active_subscription UNIQUE (user_id)
    WHERE status IN ('ACTIVE', 'TRIAL', 'PAST_DUE')
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

**Table: `subscription_plans`**

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL UNIQUE,

  -- Plan details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0, -- In cents
  price_annual INTEGER DEFAULT 0, -- For future use

  -- Stripe integration
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_annual VARCHAR(255),
  stripe_product_id VARCHAR(255),

  -- Feature flags
  features JSONB NOT NULL DEFAULT '{}',

  -- Limits
  max_events_per_month INTEGER, -- NULL = unlimited
  max_tickets_per_event INTEGER, -- NULL = unlimited

  -- Feature access
  custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
  remove_branding BOOLEAN NOT NULL DEFAULT FALSE,
  custom_email_domain BOOLEAN NOT NULL DEFAULT FALSE,
  advanced_analytics BOOLEAN NOT NULL DEFAULT FALSE,
  priority_support BOOLEAN NOT NULL DEFAULT FALSE,
  api_access BOOLEAN NOT NULL DEFAULT FALSE,

  -- Trial settings
  trial_days INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(active);
```

**Table: `subscription_events`**

```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(100) NOT NULL, -- created, upgraded, downgraded, canceled, renewed, etc.
  from_tier subscription_tier,
  to_tier subscription_tier,
  from_status subscription_status,
  to_status subscription_status,

  -- Financial impact
  proration_amount DECIMAL(10,2),
  immediate_charge DECIMAL(10,2),
  credit_applied DECIMAL(10,2),

  -- Context
  reason TEXT,
  triggered_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_date ON subscription_events(created_at);
CREATE INDEX idx_subscription_events_user ON subscription_events(triggered_by);
```

**Table: `subscription_invoices`**

```sql
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- SUB-INV-2025-001234
  stripe_invoice_id VARCHAR(255) UNIQUE,

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
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

  -- Billing period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Links
  pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_user ON subscription_invoices(user_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_date ON subscription_invoices(invoice_date);
CREATE INDEX idx_subscription_invoices_number ON subscription_invoices(invoice_number);
```

### Prisma Schema Updates

```prisma
enum SubscriptionTier {
  FREE
  BASIC
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  TRIAL
  PAST_DUE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
}

model Subscription {
  id                    String              @id @default(uuid())
  userId                String              @map("user_id")
  tier                  SubscriptionTier    @default(FREE)
  status                SubscriptionStatus  @default(ACTIVE)

  stripeSubscriptionId  String?             @unique @map("stripe_subscription_id")
  stripeCustomerId      String?             @map("stripe_customer_id")
  stripePriceId         String?             @map("stripe_price_id")

  currentPeriodStart    DateTime            @map("current_period_start")
  currentPeriodEnd      DateTime            @map("current_period_end")
  cancelAtPeriodEnd     Boolean             @default(false) @map("cancel_at_period_end")
  canceledAt            DateTime?           @map("canceled_at")

  trialStart            DateTime?           @map("trial_start")
  trialEnd              DateTime?           @map("trial_end")

  lastPaymentDate       DateTime?           @map("last_payment_date")
  lastPaymentAmount     Decimal?            @db.Decimal(10, 2) @map("last_payment_amount")
  nextBillingDate       DateTime?           @map("next_billing_date")

  metadata              Json                @default("{}")

  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")

  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  events                SubscriptionEvent[]
  invoices              SubscriptionInvoice[]

  @@unique([userId], where: { status: { in: [ACTIVE, TRIAL, PAST_DUE] } })
  @@index([userId])
  @@index([status])
  @@index([tier])
  @@index([nextBillingDate])
  @@map("subscriptions")
}

model SubscriptionPlan {
  id                    String              @id @default(uuid())
  tier                  SubscriptionTier    @unique
  name                  String
  description           String?
  priceMonthly          Int                 @default(0) @map("price_monthly")
  priceAnnual           Int?                @map("price_annual")

  stripePriceIdMonthly  String?             @map("stripe_price_id_monthly")
  stripePriceIdAnnual   String?             @map("stripe_price_id_annual")
  stripeProductId       String?             @map("stripe_product_id")

  features              Json                @default("{}")
  maxEventsPerMonth     Int?                @map("max_events_per_month")
  maxTicketsPerEvent    Int?                @map("max_tickets_per_event")

  customDomain          Boolean             @default(false) @map("custom_domain")
  removeBranding        Boolean             @default(false) @map("remove_branding")
  customEmailDomain     Boolean             @default(false) @map("custom_email_domain")
  advancedAnalytics     Boolean             @default(false) @map("advanced_analytics")
  prioritySupport       Boolean             @default(false) @map("priority_support")
  apiAccess             Boolean             @default(false) @map("api_access")

  trialDays             Int                 @default(0) @map("trial_days")
  active                Boolean             @default(true)
  displayOrder          Int                 @default(0) @map("display_order")

  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")

  @@index([tier])
  @@index([active])
  @@map("subscription_plans")
}
```

### Subscription Plan Configuration Service

**File:** `lib/services/subscription-plan.service.ts`

```typescript
import { PrismaClient, SubscriptionTier } from '@prisma/client'

const prisma = new PrismaClient()

export class SubscriptionPlanService {
  /**
   * Get all active subscription plans
   */
  async getAllPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' }
    })
  }

  /**
   * Get specific plan by tier
   */
  async getPlanByTier(tier: SubscriptionTier) {
    return prisma.subscriptionPlan.findUnique({
      where: { tier }
    })
  }

  /**
   * Check if user has feature access
   */
  async hasFeatureAccess(
    userId: string,
    feature: keyof Pick<
      SubscriptionPlan,
      'customDomain' | 'removeBranding' | 'customEmailDomain' |
      'advancedAnalytics' | 'prioritySupport' | 'apiAccess'
    >
  ): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false
    }

    const plan = await this.getPlanByTier(subscription.tier)
    return plan?.[feature] ?? false
  }

  /**
   * Check usage limits
   */
  async checkUsageLimit(userId: string, limitType: 'events' | 'tickets'): Promise<{
    allowed: boolean
    limit: number | null
    current: number
  }> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) {
      const freePlan = await this.getPlanByTier('FREE')
      return {
        allowed: false,
        limit: limitType === 'events' ? freePlan?.maxEventsPerMonth : freePlan?.maxTicketsPerEvent,
        current: 0
      }
    }

    const plan = await this.getPlanByTier(subscription.tier)
    const limit = limitType === 'events' ? plan?.maxEventsPerMonth : plan?.maxTicketsPerEvent

    // Get current usage
    const current = await this.getCurrentUsage(userId, limitType)

    return {
      allowed: limit === null || current < limit,
      limit,
      current
    }
  }

  /**
   * Initialize default subscription plans in database
   */
  async seedDefaultPlans() {
    const plans = [
      {
        tier: 'FREE' as SubscriptionTier,
        name: 'Free',
        description: 'Perfect for getting started',
        priceMonthly: 0,
        maxEventsPerMonth: 5,
        maxTicketsPerEvent: 100,
        customDomain: false,
        removeBranding: false,
        customEmailDomain: false,
        advancedAnalytics: false,
        prioritySupport: false,
        apiAccess: false,
        trialDays: 0,
        displayOrder: 1,
        features: ['Basic event creation', 'Standard ticketing', 'Email support']
      },
      {
        tier: 'BASIC' as SubscriptionTier,
        name: 'Basic',
        description: 'Remove branding and expand limits',
        priceMonthly: 1000, // $10.00
        maxEventsPerMonth: 20,
        maxTicketsPerEvent: 500,
        customDomain: false,
        removeBranding: true,
        customEmailDomain: false,
        advancedAnalytics: false,
        prioritySupport: true,
        apiAccess: false,
        trialDays: 0,
        displayOrder: 2,
        features: ['All Free features', 'Remove branding', 'Custom event URLs', 'Priority support']
      },
      {
        tier: 'PRO' as SubscriptionTier,
        name: 'Pro',
        description: 'Full white-label experience',
        priceMonthly: 5000, // $50.00
        maxEventsPerMonth: null,
        maxTicketsPerEvent: null,
        customDomain: true,
        removeBranding: true,
        customEmailDomain: true,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        trialDays: 14,
        displayOrder: 3,
        features: ['All Basic features', 'Custom domain', 'Advanced analytics', 'API access', '14-day trial']
      },
      {
        tier: 'ENTERPRISE' as SubscriptionTier,
        name: 'Enterprise',
        description: 'Custom solutions for large organizations',
        priceMonthly: 0, // Custom pricing
        maxEventsPerMonth: null,
        maxTicketsPerEvent: null,
        customDomain: true,
        removeBranding: true,
        customEmailDomain: true,
        advancedAnalytics: true,
        prioritySupport: true,
        apiAccess: true,
        trialDays: 0,
        displayOrder: 4,
        features: ['All Pro features', 'Dedicated support', 'Custom features', 'SLA guarantees']
      }
    ]

    for (const plan of plans) {
      await prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        update: plan,
        create: plan
      })
    }
  }

  private async getUserSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] }
      }
    })
  }

  private async getCurrentUsage(userId: string, limitType: 'events' | 'tickets'): Promise<number> {
    // Implementation depends on existing Event model
    // This is a placeholder
    return 0
  }
}

export const subscriptionPlanService = new SubscriptionPlanService()
```

## API Endpoints

**GET /api/subscriptions/plans**
```typescript
// Get all available subscription plans
Response: {
  plans: SubscriptionPlan[]
}
```

**GET /api/subscriptions/plans/:tier**
```typescript
// Get specific plan details
Response: {
  plan: SubscriptionPlan
}
```

**POST /api/admin/subscriptions/plans** (Admin only)
```typescript
// Create or update subscription plan
Request: {
  tier: SubscriptionTier
  name: string
  priceMonthly: number
  features: object
  limits: object
}

Response: {
  plan: SubscriptionPlan
}
```

**GET /api/subscriptions/feature-access/:feature**
```typescript
// Check if current user has access to feature
Response: {
  hasAccess: boolean
  currentTier: SubscriptionTier
  requiredTier: SubscriptionTier
}
```

## Testing Requirements

### Unit Tests
- [ ] Subscription plan CRUD operations
- [ ] Feature access checking logic
- [ ] Usage limit validation
- [ ] Tier comparison logic
- [ ] Plan seeding function

### Integration Tests
- [ ] API endpoints return correct data
- [ ] Feature gates block unauthorized access
- [ ] Database constraints enforced
- [ ] Indexes improve query performance

## Dependencies

- Prisma ORM configured
- PostgreSQL database running
- User authentication system (NextAuth)
- Admin RBAC system

## Definition of Done

- [ ] All database tables created with migrations
- [ ] Prisma schema updated and generated
- [ ] Default plans seeded in database
- [ ] Plan service implemented and tested
- [ ] API endpoints functional
- [ ] Feature gate middleware working
- [ ] Admin UI for plan management complete
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Documentation written

## Notes

**Financial Compliance**: Subscription pricing stored in cents to avoid floating-point issues.

**Feature Gates**: Middleware checks subscription status before allowing access to premium features.

**Database Constraints**: Unique constraint ensures users can only have one active subscription at a time.

**Audit Trail**: All subscription changes logged in subscription_events table for compliance.