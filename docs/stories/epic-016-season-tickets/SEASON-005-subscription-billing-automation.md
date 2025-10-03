# SEASON-005: Subscription Billing Automation

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As an** event organizer
**I want** automated recurring billing for season passes and subscriptions
**So that** revenue is collected automatically without manual intervention and subscribers have seamless renewal experiences

---

## Acceptance Criteria

### 1. Automated Recurring Billing
- [ ] Annual subscription auto-billing
- [ ] Seasonal subscription auto-billing
- [ ] Monthly recurring billing option
- [ ] Quarterly billing option
- [ ] Custom billing cycle configuration
- [ ] Automatic payment collection on schedule
- [ ] Billing cycle alignment (calendar vs anniversary)
- [ ] Billing retry logic for failed payments

### 2. Stripe Subscription Integration
- [ ] Create Stripe subscription on sign-up
- [ ] Sync subscription status with Stripe
- [ ] Handle Stripe webhook events
- [ ] Manage Stripe customer objects
- [ ] Payment method management via Stripe
- [ ] Subscription metadata synchronization
- [ ] Invoice generation through Stripe
- [ ] Tax calculation integration

### 3. Pro-Rated Billing
- [ ] Calculate pro-rated amount for mid-cycle joins
- [ ] Pro-rate for tier upgrades
- [ ] Pro-rate for tier downgrades
- [ ] Handle partial period billing
- [ ] Credit unused portion on downgrades
- [ ] Apply credits to next invoice
- [ ] Pro-ration preview before confirmation
- [ ] Handle timezone considerations

### 4. Auto-Renewal Management
- [ ] Enable/disable auto-renewal toggle
- [ ] Auto-renewal status display
- [ ] Renewal date display and countdown
- [ ] Pre-renewal notification emails (30/7 days)
- [ ] Renewal confirmation emails
- [ ] Failed renewal handling
- [ ] Renewal grace period (7 days)
- [ ] Reactivation after cancellation

### 5. Invoice Generation & Delivery
- [ ] Automatic invoice creation
- [ ] Invoice PDF generation
- [ ] Invoice email delivery
- [ ] Invoice download from portal
- [ ] Invoice numbering system
- [ ] Invoice line item breakdown
- [ ] Tax and fee itemization
- [ ] Payment receipt attachment

### 6. Billing Notifications
- [ ] Upcoming payment reminders (3 days before)
- [ ] Payment success confirmations
- [ ] Payment failure alerts
- [ ] Invoice delivery notifications
- [ ] Renewal reminder emails
- [ ] Payment method expiration warnings
- [ ] Billing issue resolution emails
- [ ] Receipt delivery

### 7. Payment Failure Handling
- [ ] Automatic retry schedule (Day 1, 3, 7)
- [ ] Payment method update prompts
- [ ] Dunning email sequence
- [ ] Subscription suspension after failures
- [ ] Grace period management
- [ ] Reactivation workflow
- [ ] Failed payment analytics
- [ ] Recovery campaign automation

### 8. Testing & Quality
- [ ] Unit tests for billing logic (>90% coverage)
- [ ] Integration tests with Stripe
- [ ] Pro-ration calculation tests
- [ ] Webhook handling tests
- [ ] Edge case testing (leap years, timezone changes)
- [ ] Load testing for batch billing
- [ ] Security audit passed
- [ ] PCI compliance verified

---

## Technical Specifications

### Database Schema Updates
```prisma
// prisma/schema.prisma

model BillingCycle {
  id                String   @id @default(cuid())
  subscriptionId    String   @unique
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  frequency         String   // 'monthly', 'quarterly', 'annual', 'seasonal'
  interval          Int      @default(1) // Every N intervals
  anchorDate        DateTime // Date that determines billing cycle
  nextBillingDate   DateTime
  lastBillingDate   DateTime?
  billingDayOfMonth Int?     // 1-28 for monthly
  timezone          String   @default("America/New_York")
  autoRenew         Boolean  @default(true)
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([nextBillingDate])
}

model Invoice {
  id                  String   @id @default(cuid())
  invoiceNumber       String   @unique
  subscriptionId      String
  subscription        Subscription @relation(fields: [subscriptionId], references: [id])
  stripeInvoiceId     String?  @unique
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  status              String   // 'draft', 'open', 'paid', 'void', 'uncollectible'
  subtotal            Float
  taxAmount           Float    @default(0)
  discountAmount      Float    @default(0)
  total               Float
  amountPaid          Float    @default(0)
  amountDue           Float
  currency            String   @default("usd")
  billingPeriodStart  DateTime
  billingPeriodEnd    DateTime
  dueDate             DateTime
  paidAt              DateTime?
  voidedAt            DateTime?
  attemptCount        Int      @default(0)
  nextAttemptAt       DateTime?
  pdfUrl              String?
  lineItems           InvoiceLineItem[]
  payments            InvoicePayment[]
  metadata            Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([userId, status])
  @@index([status, dueDate])
  @@index([stripeInvoiceId])
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int      @default(1)
  unitAmount  Float
  amount      Float
  proration   Boolean  @default(false)
  periodStart DateTime?
  periodEnd   DateTime?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([invoiceId])
}

model InvoicePayment {
  id                      String   @id @default(cuid())
  invoiceId               String
  invoice                 Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  stripePaymentIntentId   String?  @unique
  amount                  Float
  currency                String   @default("usd")
  status                  String   // 'pending', 'succeeded', 'failed', 'cancelled'
  paymentMethod           String?  // 'card', 'bank_account', 'paypal'
  failureCode             String?
  failureMessage          String?
  paidAt                  DateTime?
  metadata                Json?
  createdAt               DateTime @default(now())

  @@index([invoiceId, status])
}

model BillingNotification {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
  type           String   // 'upcoming_payment', 'payment_success', 'payment_failed', 'renewal_reminder'
  status         String   // 'pending', 'sent', 'failed'
  scheduledFor   DateTime
  sentAt         DateTime?
  channel        String   // 'email', 'sms', 'push'
  metadata       Json?
  createdAt      DateTime @default(now())

  @@index([status, scheduledFor])
  @@index([userId, type])
}

// Update Subscription model
model Subscription {
  // ... existing fields
  billingCycle   BillingCycle?
  invoices       Invoice[]
  notifications  BillingNotification[]
  // ... rest of fields
}
```

### TypeScript Interfaces
```typescript
// types/billing.types.ts

export interface BillingCycleConfig {
  frequency: 'monthly' | 'quarterly' | 'annual' | 'seasonal';
  interval: number;
  anchorDate: Date;
  timezone?: string;
  autoRenew?: boolean;
}

export interface ProrationCalculation {
  originalAmount: number;
  proratedAmount: number;
  unusedAmount: number;
  daysUsed: number;
  daysInPeriod: number;
  proratedPercentage: number;
}

export interface InvoiceData {
  subscriptionId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  lineItems: InvoiceLineItemData[];
  dueDate: Date;
}

export interface InvoiceLineItemData {
  description: string;
  quantity: number;
  unitAmount: number;
  proration?: boolean;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface BillingNotificationConfig {
  type: 'upcoming_payment' | 'payment_success' | 'payment_failed' | 'renewal_reminder';
  daysBeforeEvent?: number;
  channel: 'email' | 'sms' | 'push';
}
```

### Billing Service
```typescript
// lib/services/billing.service.ts
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { EmailService } from './email';
import { PDFService } from './pdf.service';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const emailService = new EmailService();
const pdfService = new PDFService();

export class BillingService {
  // Create billing cycle
  async createBillingCycle(
    subscriptionId: string,
    config: BillingCycleConfig
  ): Promise<BillingCycle> {
    const nextBillingDate = this.calculateNextBillingDate(
      config.anchorDate,
      config.frequency,
      config.interval
    );

    return await prisma.billingCycle.create({
      data: {
        subscriptionId,
        frequency: config.frequency,
        interval: config.interval,
        anchorDate: config.anchorDate,
        nextBillingDate,
        timezone: config.timezone || 'America/New_York',
        autoRenew: config.autoRenew ?? true,
        billingDayOfMonth: config.anchorDate.getDate(),
      },
    });
  }

  // Process billing for subscription
  async processBilling(subscriptionId: string): Promise<Invoice> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        billingCycle: true,
        plan: true,
        user: true,
      },
    });

    if (!subscription || !subscription.billingCycle) {
      throw new Error('Subscription or billing cycle not found');
    }

    const { billingCycle, plan } = subscription;

    // Calculate billing period
    const billingPeriodStart = billingCycle.nextBillingDate;
    const billingPeriodEnd = this.calculateNextBillingDate(
      billingPeriodStart,
      billingCycle.frequency,
      billingCycle.interval
    );

    // Create invoice
    const invoice = await this.createInvoice({
      subscriptionId,
      billingPeriodStart,
      billingPeriodEnd,
      lineItems: [
        {
          description: `${plan.name} - ${this.formatPeriod(billingPeriodStart, billingPeriodEnd)}`,
          quantity: 1,
          unitAmount: plan.price,
        },
      ],
      dueDate: billingPeriodStart,
    });

    // Create Stripe invoice
    if (subscription.stripeCustomerId) {
      await this.createStripeInvoice(invoice, subscription);
    }

    // Update billing cycle
    await prisma.billingCycle.update({
      where: { id: billingCycle.id },
      data: {
        lastBillingDate: billingPeriodStart,
        nextBillingDate: billingPeriodEnd,
      },
    });

    // Schedule notifications
    await this.schedulePaymentNotification(subscription.userId, invoice.id);

    return invoice;
  }

  // Create invoice
  async createInvoice(data: InvoiceData): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const taxAmount = await this.calculateTax(data.subscriptionId, subtotal);
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId: data.subscriptionId,
        userId: (await prisma.subscription.findUnique({ where: { id: data.subscriptionId } }))!.userId,
        status: 'open',
        subtotal,
        taxAmount,
        total,
        amountDue: total,
        billingPeriodStart: data.billingPeriodStart,
        billingPeriodEnd: data.billingPeriodEnd,
        dueDate: data.dueDate,
        lineItems: {
          create: data.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            amount: item.unitAmount * item.quantity,
            proration: item.proration || false,
            periodStart: item.periodStart,
            periodEnd: item.periodEnd,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    // Generate PDF
    const pdfUrl = await pdfService.generateInvoicePDF(invoice);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });

    return invoice;
  }

  // Create Stripe invoice
  private async createStripeInvoice(
    invoice: Invoice,
    subscription: Subscription
  ): Promise<void> {
    try {
      const stripeInvoice = await stripe.invoices.create({
        customer: subscription.stripeCustomerId!,
        subscription: subscription.stripeSubscriptionId!,
        collection_method: 'charge_automatically',
        due_date: Math.floor(invoice.dueDate.getTime() / 1000),
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
        },
      });

      // Add line items
      for (const item of invoice.lineItems) {
        await stripe.invoiceItems.create({
          customer: subscription.stripeCustomerId!,
          invoice: stripeInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_amount: Math.round(item.unitAmount * 100),
        });
      }

      // Finalize and send
      await stripe.invoices.finalizeInvoice(stripeInvoice.id);
      await stripe.invoices.sendInvoice(stripeInvoice.id);

      // Update invoice with Stripe ID
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { stripeInvoiceId: stripeInvoice.id },
      });
    } catch (error) {
      console.error('Failed to create Stripe invoice:', error);
      throw error;
    }
  }

  // Calculate pro-ration
  calculateProration(
    originalAmount: number,
    periodStart: Date,
    periodEnd: Date,
    joinDate: Date
  ): ProrationCalculation {
    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUsed = Math.ceil(
      (periodEnd.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysUsed;

    const proratedAmount = (originalAmount / totalDays) * daysRemaining;
    const unusedAmount = originalAmount - proratedAmount;
    const proratedPercentage = (daysRemaining / totalDays) * 100;

    return {
      originalAmount,
      proratedAmount,
      unusedAmount,
      daysUsed,
      daysInPeriod: totalDays,
      proratedPercentage,
    };
  }

  // Handle payment success
  async handlePaymentSuccess(invoiceId: string, stripePaymentIntentId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: { include: { user: true } } },
    });

    if (!invoice) return;

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        amountPaid: invoice.total,
        amountDue: 0,
        paidAt: new Date(),
      },
    });

    // Record payment
    await prisma.invoicePayment.create({
      data: {
        invoiceId,
        stripePaymentIntentId,
        amount: invoice.total,
        status: 'succeeded',
        paidAt: new Date(),
      },
    });

    // Send confirmation email
    await emailService.sendPaymentConfirmation(
      invoice.subscription.user.email,
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        pdfUrl: invoice.pdfUrl,
      }
    );
  }

  // Handle payment failure
  async handlePaymentFailure(
    invoiceId: string,
    failureCode: string,
    failureMessage: string
  ): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { subscription: { include: { user: true } } },
    });

    if (!invoice) return;

    const attemptCount = invoice.attemptCount + 1;
    const maxAttempts = 3;

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        attemptCount,
        nextAttemptAt:
          attemptCount < maxAttempts
            ? this.calculateNextRetryDate(attemptCount)
            : null,
      },
    });

    // Record failed payment
    await prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: invoice.total,
        status: 'failed',
        failureCode,
        failureMessage,
      },
    });

    // Send failure notification
    await emailService.sendPaymentFailureNotification(
      invoice.subscription.user.email,
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        failureReason: failureMessage,
        attemptsRemaining: maxAttempts - attemptCount,
      }
    );

    // Suspend subscription if max attempts reached
    if (attemptCount >= maxAttempts) {
      await this.suspendSubscription(invoice.subscriptionId);
    }
  }

  // Schedule payment notification
  private async schedulePaymentNotification(
    userId: string,
    invoiceId: string
  ): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) return;

    // Schedule reminder 3 days before
    const reminderDate = new Date(invoice.dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3);

    await prisma.billingNotification.create({
      data: {
        userId,
        subscriptionId: invoice.subscriptionId,
        type: 'upcoming_payment',
        status: 'pending',
        scheduledFor: reminderDate,
        channel: 'email',
      },
    });
  }

  // Calculate next billing date
  private calculateNextBillingDate(
    anchorDate: Date,
    frequency: string,
    interval: number
  ): Date {
    const nextDate = new Date(anchorDate);

    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3 * interval);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
      case 'seasonal':
        nextDate.setMonth(nextDate.getMonth() + 4 * interval); // Approx 4 months per season
        break;
    }

    return nextDate;
  }

  // Calculate next retry date
  private calculateNextRetryDate(attemptCount: number): Date {
    const retryDays = [1, 3, 7];
    const daysToAdd = retryDays[attemptCount - 1] || 7;
    const nextRetry = new Date();
    nextRetry.setDate(nextRetry.getDate() + daysToAdd);
    return nextRetry;
  }

  // Generate invoice number
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate tax
  private async calculateTax(subscriptionId: string, amount: number): Promise<number> {
    // TODO: Integrate with tax calculation service
    return 0;
  }

  // Format period
  private formatPeriod(start: Date, end: Date): string {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  // Suspend subscription
  private async suspendSubscription(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'past_due' },
    });
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('BillingService', () => {
  it('should create billing cycle', async () => {
    const cycle = await service.createBillingCycle(subscriptionId, config);
    expect(cycle.nextBillingDate).toBeDefined();
  });

  it('should calculate proration correctly', async () => {
    const proration = service.calculateProration(100, periodStart, periodEnd, joinDate);
    expect(proration.proratedAmount).toBeCloseTo(66.67, 2);
  });

  it('should process billing and create invoice', async () => {
    const invoice = await service.processBilling(subscriptionId);
    expect(invoice.status).toBe('open');
    expect(invoice.lineItems).toHaveLength(1);
  });

  it('should handle payment success', async () => {
    await service.handlePaymentSuccess(invoiceId, paymentIntentId);
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    expect(invoice.status).toBe('paid');
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Billing automation implemented
- [ ] Stripe integration complete
- [ ] Pro-ration logic working
- [ ] Invoice generation functional
- [ ] Payment failure handling implemented
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Security audit passed
- [ ] Documentation complete

---

## Dependencies

- SEASON-001: Subscription model setup (prerequisite)
- PAY-001: Payment integration (prerequisite)
- NOTIFY-001: Notification system (prerequisite)

---

## Estimated Timeline

**Total Duration:** 3 weeks
**Story Points:** 5