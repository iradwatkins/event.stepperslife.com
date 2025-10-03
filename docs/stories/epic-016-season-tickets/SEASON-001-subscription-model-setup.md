# SEASON-001: Subscription Model Setup

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 8
**Priority:** High
**Status:** Not Started

---

## User Story

**As an** event organizer
**I want** a comprehensive subscription and season pass system
**So that** I can sell recurring memberships, season passes, and offer exclusive benefits to loyal customers

---

## Acceptance Criteria

### 1. Database Schema
- [ ] Subscription tiers table (Monthly, Annual, Season)
- [ ] Season pass table with series linking
- [ ] Member benefits catalog table
- [ ] Subscription payment history
- [ ] Pass usage tracking table
- [ ] Blackout dates and restrictions
- [ ] Member metadata storage
- [ ] Subscription status management (active, paused, cancelled)

### 2. Subscription Types
- [ ] Monthly membership
- [ ] Annual membership
- [ ] Single season pass
- [ ] Multi-season pass
- [ ] Custom duration subscriptions
- [ ] Family/Group subscriptions
- [ ] VIP/Premium tiers
- [ ] Trial period subscriptions

### 3. Recurring Billing Integration
- [ ] Stripe Subscriptions API integration
- [ ] Automatic payment collection
- [ ] Failed payment handling
- [ ] Dunning management (retry logic)
- [ ] Payment method update flow
- [ ] Proration for upgrades/downgrades
- [ ] Subscription cancellation handling
- [ ] Refund and credit management

### 4. Member Benefits System
- [ ] Benefit catalog (discounts, early access, exclusive events)
- [ ] Automatic benefit application
- [ ] Benefit expiration tracking
- [ ] Usage limits per benefit
- [ ] Stackable vs exclusive benefits
- [ ] Benefit redemption history
- [ ] Benefit value tracking
- [ ] Custom benefit rules engine

### 5. Access Control
- [ ] Season pass validation at checkout
- [ ] Event access verification
- [ ] Blackout date enforcement
- [ ] Capacity limits for pass holders
- [ ] Guest privileges
- [ ] Transfer restrictions
- [ ] Concurrent use prevention
- [ ] Audit trail for access

### 6. Member Portal
- [ ] Subscription dashboard
- [ ] Pass usage history
- [ ] Upcoming included events
- [ ] Payment history and invoices
- [ ] Benefits overview
- [ ] Subscription management (pause, cancel, upgrade)
- [ ] Auto-renewal toggle
- [ ] Family member management

### 7. Admin Management
- [ ] Subscription plan builder
- [ ] Benefit assignment interface
- [ ] Member search and filtering
- [ ] Manual subscription adjustments
- [ ] Revenue reporting
- [ ] Churn analytics
- [ ] Member lifecycle tracking
- [ ] Bulk operations support

### 8. Testing & Quality
- [ ] Unit tests for subscription logic (>85% coverage)
- [ ] Integration tests with Stripe
- [ ] Payment failure scenarios tested
- [ ] Proration calculations verified
- [ ] Access control tests
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model SubscriptionPlan {
  id                String   @id @default(cuid())
  name              String
  description       String?
  type              String   // 'monthly', 'annual', 'season', 'custom'
  price             Float
  billingInterval   String   // 'month', 'year', 'season'
  trialDays         Int      @default(0)
  maxMembers        Int      @default(1) // For family plans
  stripeProductId   String?
  stripePriceId     String?
  active            Boolean  @default(true)
  benefits          SubscriptionBenefit[]
  subscriptions     Subscription[]
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([type, active])
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId               String
  plan                 SubscriptionPlan @relation(fields: [planId], references: [id])
  stripeSubscriptionId String?  @unique
  stripeCustomerId     String?
  status               String   // 'active', 'past_due', 'cancelled', 'paused', 'trialing'
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAt             DateTime?
  canceledAt           DateTime?
  trialStart           DateTime?
  trialEnd             DateTime?
  autoRenew            Boolean  @default(true)
  members              SubscriptionMember[]
  usage                PassUsage[]
  payments             SubscriptionPayment[]
  metadata             Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([userId, status])
  @@index([status, currentPeriodEnd])
}

model SubscriptionMember {
  id             String   @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  userId         String?
  user           User?    @relation(fields: [userId], references: [id])
  email          String
  name           String
  relationship   String?  // 'primary', 'spouse', 'child', 'guest'
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())

  @@index([subscriptionId, active])
}

model SeasonPass {
  id                String   @id @default(cuid())
  subscriptionId    String?
  subscription      Subscription? @relation(fields: [subscriptionId], references: [id])
  name              String
  description       String?
  season            String   // 'Spring 2025', 'Summer 2025', etc.
  startDate         DateTime
  endDate           DateTime
  totalEvents       Int
  eventsAttended    Int      @default(0)
  eventsRemaining   Int
  blackoutDates     Json?    // Array of dates
  eventSeries       EventSeries[]
  usage             PassUsage[]
  active            Boolean  @default(true)
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([season, active])
}

model EventSeries {
  id             String   @id @default(cuid())
  name           String
  description    String?
  seasonPassId   String?
  seasonPass     SeasonPass? @relation(fields: [seasonPassId], references: [id])
  events         Event[]
  startDate      DateTime
  endDate        DateTime
  frequency      String?  // 'weekly', 'bi-weekly', 'monthly'
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model SubscriptionBenefit {
  id             String   @id @default(cuid())
  planId         String
  plan           SubscriptionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  type           String   // 'discount', 'early_access', 'exclusive_event', 'free_guest'
  name           String
  description    String
  value          Float?   // Discount percentage or monetary value
  usageLimit     Int?     // Max uses per period
  stackable      Boolean  @default(false)
  rules          Json?    // Custom rules
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([planId, active])
}

model PassUsage {
  id             String   @id @default(cuid())
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
  seasonPassId   String?
  seasonPass     SeasonPass? @relation(fields: [seasonPassId], references: [id])
  eventId        String
  event          Event    @relation(fields: [eventId], references: [id])
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  orderId        String?
  order          Order?   @relation(fields: [orderId], references: [id])
  checkedIn      Boolean  @default(false)
  checkedInAt    DateTime?
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([subscriptionId, eventId])
  @@index([userId, eventId])
}

model SubscriptionPayment {
  id                 String   @id @default(cuid())
  subscriptionId     String
  subscription       Subscription @relation(fields: [subscriptionId], references: [id])
  stripeInvoiceId    String   @unique
  stripePaymentIntentId String?
  amount             Float
  currency           String   @default("usd")
  status             String   // 'pending', 'paid', 'failed', 'refunded'
  failureReason      String?
  attemptCount       Int      @default(1)
  paidAt             DateTime?
  dueDate            DateTime
  metadata           Json?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([subscriptionId, status])
  @@index([status, dueDate])
}
```

### Subscription Service
```typescript
// lib/services/subscription.service.ts
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const prisma = new PrismaClient();

export class SubscriptionService {
  // Create subscription
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<Subscription> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

    if (!user || !plan) {
      throw new Error('User or plan not found');
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: plan.stripePriceId! }],
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
      metadata: {
        userId,
        planId,
      },
    });

    // Create database subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
      include: { plan: true },
    });

    return subscription;
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      if (!cancelAtPeriodEnd) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        cancelAt: cancelAtPeriodEnd ? subscription.currentPeriodEnd : new Date(),
        canceledAt: new Date(),
        autoRenew: false,
      },
    });
  }

  // Upgrade/Downgrade subscription
  async changeSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string
  ): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!subscription || !newPlan) {
      throw new Error('Subscription or plan not found');
    }

    // Update Stripe subscription
    if (subscription.stripeSubscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPlan.stripePriceId!,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { planId: newPlanId },
      include: { plan: true },
    });
  }

  // Pause subscription
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: {
          behavior: 'keep_as_draft',
        },
      });
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'paused' },
    });
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: null,
      });
    }

    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'active' },
    });
  }

  // Check if user can access event with subscription
  async canAccessEvent(
    userId: string,
    eventId: string
  ): Promise<{ canAccess: boolean; subscriptionId?: string; reason?: string }> {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        plan: { include: { benefits: true } },
      },
    });

    if (!activeSubscription) {
      return { canAccess: false, reason: 'No active subscription' };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { series: true },
    });

    if (!event) {
      return { canAccess: false, reason: 'Event not found' };
    }

    // Check if event is part of included series
    if (event.series) {
      const seasonPass = await prisma.seasonPass.findFirst({
        where: {
          subscriptionId: activeSubscription.id,
          eventSeries: { some: { id: event.series.id } },
          active: true,
        },
      });

      if (seasonPass) {
        // Check blackout dates
        const blackoutDates = seasonPass.blackoutDates as string[] || [];
        const eventDate = event.startDate.toISOString().split('T')[0];
        if (blackoutDates.includes(eventDate)) {
          return {
            canAccess: false,
            reason: 'Event is on a blackout date',
          };
        }

        // Check remaining events
        if (seasonPass.eventsRemaining <= 0) {
          return {
            canAccess: false,
            reason: 'Season pass events exhausted',
          };
        }

        return {
          canAccess: true,
          subscriptionId: activeSubscription.id,
        };
      }
    }

    return { canAccess: false, reason: 'Event not included in subscription' };
  }

  // Apply subscription discount
  async applySubscriptionDiscount(
    userId: string,
    orderTotal: number
  ): Promise<{ discountAmount: number; discountPercentage: number }> {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        plan: {
          include: {
            benefits: {
              where: {
                type: 'discount',
                active: true,
              },
            },
          },
        },
      },
    });

    if (!activeSubscription || activeSubscription.plan.benefits.length === 0) {
      return { discountAmount: 0, discountPercentage: 0 };
    }

    // Apply highest discount
    const highestDiscount = Math.max(
      ...activeSubscription.plan.benefits.map((b) => b.value || 0)
    );

    const discountAmount = (orderTotal * highestDiscount) / 100;

    return {
      discountAmount,
      discountPercentage: highestDiscount,
    };
  }
}
```

### Webhook Handler
```typescript
// app/api/webhooks/stripe-subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'cancelled',
      canceledAt: new Date(),
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (subscription) {
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent as string,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'paid',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        dueDate: new Date(invoice.due_date! * 1000),
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (subscription) {
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'failed',
        failureReason: invoice.last_finalization_error?.message,
        dueDate: new Date(invoice.due_date! * 1000),
      },
    });

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'past_due' },
    });
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('SubscriptionService', () => {
  it('should create subscription', async () => {
    const subscription = await service.createSubscription(userId, planId, paymentMethodId);
    expect(subscription).toHaveProperty('id');
  });

  it('should cancel subscription', async () => {
    const cancelled = await service.cancelSubscription(subscriptionId);
    expect(cancelled.status).toBe('cancelled');
  });

  it('should check event access', async () => {
    const result = await service.canAccessEvent(userId, eventId);
    expect(result).toHaveProperty('canAccess');
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Database schema deployed
- [ ] Stripe Subscriptions integrated
- [ ] Member benefits system functional
- [ ] Access control working
- [ ] Webhook handlers tested
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] Documentation complete

---

## Dependencies

- AUTH-001: User authentication (prerequisite)
- PAY-001: Payment integration (prerequisite)
- EVENT-001: Event management (prerequisite)

---

## Estimated Timeline

**Total Duration:** 8-10 weeks
**Story Points:** 8