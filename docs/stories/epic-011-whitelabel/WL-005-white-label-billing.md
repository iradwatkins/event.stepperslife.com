# WL-005: White-Label Subscription Billing System

**Epic:** EPIC-011: White-Label Features
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** platform owner
**I want to** bill white-label clients monthly subscription fees based on their chosen tier
**So that** I can monetize the white-label offering and sustain platform operations

### Acceptance Criteria

1. **Subscription Tiers**
   - [ ] Basic tier: $10/month (1 custom domain, 5 events/month, basic theming)
   - [ ] Pro tier: $50/month (3 custom domains, unlimited events, full theming, custom CSS)
   - [ ] Enterprise tier: Custom pricing (unlimited everything, dedicated support, SLA)
   - [ ] Clear tier comparison page
   - [ ] Upgrade/downgrade between tiers
   - [ ] Annual billing option (2 months free)

2. **Stripe Subscription Integration**
   - [ ] Create Stripe customer on tenant signup
   - [ ] Subscribe to selected plan
   - [ ] Automatic monthly billing
   - [ ] Payment method management
   - [ ] Invoice generation and delivery
   - [ ] Failed payment retry logic
   - [ ] Payment receipt emails

3. **Usage Tracking & Metering**
   - [ ] Track events created per month
   - [ ] Track custom domains in use
   - [ ] Track active user count
   - [ ] Track API requests (if applicable)
   - [ ] Usage dashboard for tenant admins
   - [ ] Usage alerts at 80% and 100% of limits

4. **Billing Management**
   - [ ] View current subscription status
   - [ ] View billing history
   - [ ] Download invoices
   - [ ] Update payment method
   - [ ] View upcoming invoice preview
   - [ ] Manage billing contacts
   - [ ] Tax ID/VAT number support

5. **Subscription Lifecycle**
   - [ ] Trial period (14 days free)
   - [ ] Subscription activation after trial
   - [ ] Upgrade plan (prorated billing)
   - [ ] Downgrade plan (effective next billing cycle)
   - [ ] Pause subscription (retain data, disable access)
   - [ ] Cancel subscription (grace period)
   - [ ] Reactivate cancelled subscription

6. **Feature Gating**
   - [ ] Enforce event creation limits (Basic tier)
   - [ ] Enforce custom domain limits
   - [ ] Disable custom CSS on Basic tier
   - [ ] Soft limits with upgrade prompts
   - [ ] Hard limits with clear messaging
   - [ ] Feature comparison tooltips

7. **Failed Payment Handling**
   - [ ] Email notification on payment failure
   - [ ] Retry payment 3 times (days 1, 3, 5)
   - [ ] Grace period (7 days total)
   - [ ] Account suspension after grace period
   - [ ] Data retention during suspension (30 days)
   - [ ] Account deletion after 30 days suspension

8. **Invoicing & Receipts**
   - [ ] Automatic invoice generation
   - [ ] Email invoice on successful payment
   - [ ] PDF invoice download
   - [ ] Invoice includes: line items, tax, total, payment method
   - [ ] Receipts for one-time charges
   - [ ] Tax calculation (if applicable)

---

## Technical Requirements

### Database Schema

```prisma
// prisma/schema.prisma

model Subscription {
  id                String             @id @default(cuid())
  tenantId          String             @unique
  tenant            Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  stripeCustomerId      String         @unique
  stripeSubscriptionId  String         @unique
  stripePriceId         String

  plan              SubscriptionPlan
  status            SubscriptionStatus @default(TRIALING)

  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  trialEnd              DateTime?
  cancelAt              DateTime?
  canceledAt            DateTime?

  // Usage tracking
  eventsUsed            Int            @default(0)
  eventsLimit           Int
  domainsUsed           Int            @default(0)
  domainsLimit          Int

  // Billing
  defaultPaymentMethodId String?
  lastPaymentAt         DateTime?
  lastPaymentAmount     Decimal?
  failedPaymentAttempts Int            @default(0)

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  invoices          Invoice[]
  usageRecords      UsageRecord[]

  @@index([tenantId])
  @@index([status])
  @@index([stripeCustomerId])
}

enum SubscriptionPlan {
  BASIC
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  TRIALING          // In free trial
  ACTIVE            // Active subscription
  PAST_DUE          // Payment failed, in grace period
  CANCELED          // User cancelled
  UNPAID            // Payment failed, grace period expired
  PAUSED            // Temporarily paused by user
  INCOMPLETE        // Subscription creation incomplete
}

model Invoice {
  id                String   @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  stripeInvoiceId   String   @unique
  invoiceNumber     String   @unique

  status            InvoiceStatus
  amountDue         Decimal
  amountPaid        Decimal
  tax               Decimal?
  total             Decimal

  currency          String   @default("usd")

  billingReason     String?  // subscription_create, subscription_cycle, manual, etc.

  hostedInvoiceUrl  String?  // Stripe-hosted invoice page
  invoicePdfUrl     String?  // PDF download link

  periodStart       DateTime
  periodEnd         DateTime

  dueDate           DateTime?
  paidAt            DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  lineItems         InvoiceLineItem[]

  @@index([subscriptionId])
  @@index([status])
}

enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  description String
  quantity    Int
  unitAmount  Decimal
  amount      Decimal

  periodStart DateTime?
  periodEnd   DateTime?

  @@index([invoiceId])
}

model UsageRecord {
  id              String       @id @default(cuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  metric          UsageMetric
  quantity        Int
  timestamp       DateTime     @default(now())

  metadata        Json?

  @@index([subscriptionId, metric])
  @@index([timestamp])
}

enum UsageMetric {
  EVENTS_CREATED
  CUSTOM_DOMAIN_ADDED
  ACTIVE_USERS
  API_REQUESTS
}
```

### Stripe Integration Service

```typescript
// lib/services/subscription.service.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface CreateSubscriptionParams {
  tenantId: string;
  plan: SubscriptionPlan;
  paymentMethodId?: string;
  email: string;
  trialDays?: number;
}

class SubscriptionService {
  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const { tenantId, plan, paymentMethodId, email, trialDays = 14 } = params;

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { tenantId },
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Get price ID for plan
    const priceId = this.getPriceId(plan);

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Save to database
    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        plan,
        status: 'TRIALING',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        eventsLimit: this.getEventLimit(plan),
        domainsLimit: this.getDomainLimit(plan),
        defaultPaymentMethodId: paymentMethodId,
      },
    });

    return subscription;
  }

  async upgradeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPriceId = this.getPriceId(newPlan);

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Prorate immediately
    });

    // Update database
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        plan: newPlan,
        stripePriceId: newPriceId,
        eventsLimit: this.getEventLimit(newPlan),
        domainsLimit: this.getDomainLimit(newPlan),
      },
    });

    // Send confirmation email
    await this.sendUpgradeConfirmation(subscription.tenantId, newPlan);
  }

  async downgradeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPriceId = this.getPriceId(newPlan);

    // Schedule downgrade for end of current period
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'none', // No proration for downgrades
      billing_cycle_anchor: 'unchanged', // Apply at end of period
    });

    // Note in database (will take effect at period end)
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        // Store pending downgrade info in metadata
        metadata: {
          pendingDowngrade: {
            plan: newPlan,
            effectiveAt: subscription.currentPeriodEnd,
          },
        },
      },
    });

    // Send notification email
    await this.sendDowngradeNotification(
      subscription.tenantId,
      newPlan,
      subscription.currentPeriodEnd
    );
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelImmediately: boolean = false
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (cancelImmediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAt: subscription.currentPeriodEnd,
        },
      });
    }

    // Send cancellation confirmation
    await this.sendCancellationConfirmation(
      subscription.tenantId,
      cancelImmediately ? new Date() : subscription.currentPeriodEnd
    );
  }

  async handlePaymentFailed(stripeSubscriptionId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const failedAttempts = subscription.failedPaymentAttempts + 1;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
        failedPaymentAttempts: failedAttempts,
      },
    });

    // Send failed payment email
    await this.sendPaymentFailedEmail(subscription.tenantId, failedAttempts);

    // If 3 failed attempts, suspend account
    if (failedAttempts >= 3) {
      await this.suspendAccount(subscription.tenantId);
    }
  }

  async handlePaymentSucceeded(stripeInvoiceId: string): Promise<void> {
    const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeInvoice.subscription as string },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        lastPaymentAt: new Date(),
        lastPaymentAmount: stripeInvoice.amount_paid / 100,
        failedPaymentAttempts: 0,
      },
    });

    // Create invoice record
    await this.createInvoiceRecord(stripeInvoice);

    // Send payment receipt
    await this.sendPaymentReceipt(subscription.tenantId, stripeInvoice);
  }

  async trackUsage(
    tenantId: string,
    metric: UsageMetric,
    quantity: number = 1
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) return;

    // Create usage record
    await prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        metric,
        quantity,
      },
    });

    // Update current usage counters
    if (metric === 'EVENTS_CREATED') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { eventsUsed: { increment: quantity } },
      });

      // Check if approaching limit
      const usage = subscription.eventsUsed + quantity;
      const limit = subscription.eventsLimit;

      if (usage >= limit * 0.8 && usage < limit) {
        await this.sendUsageWarning(tenantId, 'events', 80);
      } else if (usage >= limit) {
        await this.sendUsageLimitReached(tenantId, 'events');
      }
    }
  }

  async checkFeatureAccess(
    tenantId: string,
    feature: string
  ): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) return false;
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
      return false;
    }

    // Check feature against plan
    const features = this.getPlanFeatures(subscription.plan);
    return features.includes(feature);
  }

  private getPriceId(plan: SubscriptionPlan): string {
    const priceIds = {
      BASIC: process.env.STRIPE_PRICE_BASIC!,
      PRO: process.env.STRIPE_PRICE_PRO!,
      ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    return priceIds[plan];
  }

  private getEventLimit(plan: SubscriptionPlan): number {
    const limits = {
      BASIC: 5,
      PRO: -1, // unlimited
      ENTERPRISE: -1,
    };
    return limits[plan];
  }

  private getDomainLimit(plan: SubscriptionPlan): number {
    const limits = {
      BASIC: 1,
      PRO: 3,
      ENTERPRISE: -1, // unlimited
    };
    return limits[plan];
  }

  private getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features = {
      BASIC: ['custom_domain', 'basic_theming', 'email_support'],
      PRO: [
        'custom_domain',
        'multiple_domains',
        'full_theming',
        'custom_css',
        'priority_support',
        'analytics',
      ],
      ENTERPRISE: [
        'custom_domain',
        'unlimited_domains',
        'full_theming',
        'custom_css',
        'dedicated_support',
        'analytics',
        'sla',
        'custom_integration',
      ],
    };

    return features[plan];
  }

  private async suspendAccount(tenantId: string): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'SUSPENDED' },
    });

    await this.sendAccountSuspendedEmail(tenantId);
  }

  private async createInvoiceRecord(stripeInvoice: Stripe.Invoice): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeInvoice.subscription as string },
    });

    if (!subscription) return;

    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: stripeInvoice.id,
        invoiceNumber: stripeInvoice.number!,
        status: stripeInvoice.status!.toUpperCase() as InvoiceStatus,
        amountDue: stripeInvoice.amount_due / 100,
        amountPaid: stripeInvoice.amount_paid / 100,
        tax: stripeInvoice.tax ? stripeInvoice.tax / 100 : null,
        total: stripeInvoice.total / 100,
        billingReason: stripeInvoice.billing_reason,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
        invoicePdfUrl: stripeInvoice.invoice_pdf,
        periodStart: new Date(stripeInvoice.period_start * 1000),
        periodEnd: new Date(stripeInvoice.period_end * 1000),
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : null,
        lineItems: {
          create: stripeInvoice.lines.data.map((line) => ({
            description: line.description || '',
            quantity: line.quantity || 1,
            unitAmount: line.price?.unit_amount ? line.price.unit_amount / 100 : 0,
            amount: line.amount / 100,
            periodStart: line.period?.start
              ? new Date(line.period.start * 1000)
              : null,
            periodEnd: line.period?.end ? new Date(line.period.end * 1000) : null,
          })),
        },
      },
    });
  }

  // Email notification methods
  private async sendPaymentFailedEmail(tenantId: string, attempt: number) {
    // Implementation
  }

  private async sendPaymentReceipt(tenantId: string, invoice: Stripe.Invoice) {
    // Implementation
  }

  private async sendUsageWarning(tenantId: string, resource: string, percentage: number) {
    // Implementation
  }

  private async sendUsageLimitReached(tenantId: string, resource: string) {
    // Implementation
  }

  private async sendUpgradeConfirmation(tenantId: string, plan: SubscriptionPlan) {
    // Implementation
  }

  private async sendDowngradeNotification(
    tenantId: string,
    plan: SubscriptionPlan,
    effectiveDate: Date
  ) {
    // Implementation
  }

  private async sendCancellationConfirmation(tenantId: string, effectiveDate: Date) {
    // Implementation
  }

  private async sendAccountSuspendedEmail(tenantId: string) {
    // Implementation
  }
}

export default new SubscriptionService();
```

### Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe-billing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import subscriptionService from '@/lib/services/subscription.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await subscriptionService.handlePaymentSucceeded(
          (event.data.object as Stripe.Invoice).id
        );
        break;

      case 'invoice.payment_failed':
        await subscriptionService.handlePaymentFailed(
          (event.data.object as Stripe.Invoice).subscription as string
        );
        break;

      case 'customer.subscription.updated':
        // Handle subscription changes
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
```

---

## API Endpoints

### GET /api/admin/subscription
Get current subscription details

### POST /api/admin/subscription
Create new subscription

### PATCH /api/admin/subscription/upgrade
Upgrade to higher tier

### PATCH /api/admin/subscription/downgrade
Downgrade to lower tier

### POST /api/admin/subscription/cancel
Cancel subscription

### GET /api/admin/subscription/invoices
Get billing history

### GET /api/admin/subscription/usage
Get current usage metrics

### POST /api/admin/subscription/payment-method
Update payment method

---

## UI Components

### Subscription Management Dashboard

```tsx
// app/dashboard/billing/page.tsx

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Pro Plan</h2>
              <Badge>Active</Badge>
            </div>
            <p className="text-gray-600 mt-1">$50/month</p>
            <p className="text-sm text-gray-500 mt-2">
              Next billing date: February 15, 2025
            </p>
          </div>
          <Button variant="outline">Change Plan</Button>
        </div>

        {/* Usage Metrics */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Events Created</span>
              <span className="text-gray-600">Unlimited</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Custom Domains</span>
              <span className="text-gray-600">2 of 3 used</span>
            </div>
            <Progress value={66} />
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Payment Method</h3>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
              VISA
            </div>
            <div>
              <p className="font-medium">•••• 4242</p>
              <p className="text-sm text-gray-600">Expires 12/2025</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Billing History</h3>
        <InvoiceList />
      </Card>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- Subscription creation
- Plan upgrades/downgrades
- Usage tracking
- Feature access checks

### Integration Tests
- Stripe webhook handling
- Payment flow
- Failed payment retry
- Cancellation flow

### Manual Tests
- Test with Stripe test mode
- Verify email notifications
- Test all subscription states
- Verify proration calculations

---

## Security Considerations

1. **Webhook Verification**
   - Verify Stripe signature
   - Idempotent webhook processing

2. **Payment Security**
   - Never store card details
   - Use Stripe.js for PCI compliance
   - Secure payment method updates

3. **Access Control**
   - Enforce feature gates
   - Prevent usage beyond limits
   - Graceful degradation

---

## Dependencies

- **Stripe SDK**: Payment processing
- **Webhook endpoint**: Secure webhook handling
- **Email service**: Billing notifications

---

## Success Metrics

- Subscription conversion rate > 70% after trial
- Payment success rate > 98%
- Churn rate < 5% monthly
- Average revenue per user (ARPU) growth
- Customer lifetime value (LTV) tracking

---

## Notes

- Consider usage-based pricing for Enterprise
- Add referral program for growth
- Implement failed payment dunning
- Consider annual discounts
- Plan for tax compliance (Stripe Tax)