# SEASON-003: Flexible Payment Plans

**Epic:** EPIC-016 Season Tickets & Subscriptions
**Story Points:** 5
**Priority:** High
**Status:** Not Started

---

## User Story

**As a** season pass buyer
**I want** flexible payment options including full payment and installment plans
**So that** I can choose a payment method that fits my budget and cash flow

---

## Acceptance Criteria

### 1. Payment Plan Options
- [ ] Full payment upfront option
- [ ] Monthly installment plans (3, 6, 12 months)
- [ ] Quarterly installment plans
- [ ] Custom payment schedules for VIP passes
- [ ] Clear pricing breakdown for each option
- [ ] Interest/fee calculations displayed upfront
- [ ] Payment plan eligibility rules
- [ ] Minimum purchase requirements for installments

### 2. Auto-Payment Setup
- [ ] Automatic payment method configuration
- [ ] Payment schedule calendar view
- [ ] Payment date preferences (1st, 15th of month)
- [ ] Payment method backup option
- [ ] Payment reminders 3 days before charge
- [ ] Auto-payment toggle on/off
- [ ] Failed payment retry logic (3 attempts)
- [ ] Grace period configuration (7 days)

### 3. Payment Plan Management
- [ ] View payment schedule dashboard
- [ ] Upcoming payment amount and date
- [ ] Payment history with receipts
- [ ] Early payoff option with calculation
- [ ] Payment method update flow
- [ ] Payment plan modification (if allowed)
- [ ] Payment skip option (one-time, if eligible)
- [ ] Payment pause during emergencies

### 4. Payment Status Tracking
- [ ] Real-time payment status (pending, processing, completed, failed)
- [ ] Payment confirmation emails
- [ ] Failed payment notifications (email + SMS)
- [ ] Balance remaining calculation
- [ ] Paid-to-date tracking
- [ ] Next payment due indicator
- [ ] Payment plan completion percentage
- [ ] Days until paid-off counter

### 5. Failed Payment Handling
- [ ] Automatic retry schedule (Day 1, 3, 7)
- [ ] Payment method validation before retry
- [ ] Email notification on each failure
- [ ] SMS alert for critical failures
- [ ] Account suspension warning (after 2 failures)
- [ ] Grace period countdown timer
- [ ] Payment method update prompts
- [ ] Manual payment rescue option

### 6. Collections & Recovery
- [ ] Account suspension after 3 failed payments
- [ ] Pass access revocation process
- [ ] Re-activation fee calculation
- [ ] Past-due balance collection
- [ ] Payment arrangement negotiation
- [ ] Refund policy enforcement
- [ ] Account recovery workflow
- [ ] Collections agency integration (future)

### 7. Testing & Quality
- [ ] Unit tests for payment calculations (>90% coverage)
- [ ] Integration tests with Stripe Billing
- [ ] Failed payment scenario testing
- [ ] Payment plan edge cases covered
- [ ] Auto-retry logic verified
- [ ] Email/SMS notifications tested
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## Technical Specifications

### Database Schema Updates
```prisma
// prisma/schema.prisma

model PaymentPlan {
  id                   String   @id @default(cuid())
  subscriptionId       String   @unique
  subscription         Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  planType             String   // 'full', 'monthly', 'quarterly', 'custom'
  totalAmount          Float
  installmentAmount    Float
  installmentCount     Int
  installmentsPaid     Int      @default(0)
  installmentsRemaining Int
  paymentFrequency     String   // 'monthly', 'quarterly', 'custom'
  nextPaymentDate      DateTime
  paymentDay           Int      // Day of month (1-28)
  interestRate         Float    @default(0)
  totalWithInterest    Float
  status               String   // 'active', 'completed', 'suspended', 'cancelled'
  autoPayEnabled       Boolean  @default(true)
  gracePeriodDays      Int      @default(7)
  payments             InstallmentPayment[]
  metadata             Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([status, nextPaymentDate])
}

model InstallmentPayment {
  id                    String   @id @default(cuid())
  paymentPlanId         String
  paymentPlan           PaymentPlan @relation(fields: [paymentPlanId], references: [id], onDelete: Cascade)
  installmentNumber     Int
  scheduledDate         DateTime
  amount                Float
  status                String   // 'pending', 'processing', 'paid', 'failed', 'cancelled'
  stripePaymentIntentId String?  @unique
  stripeInvoiceId       String?
  paidAt                DateTime?
  failedAt              DateTime?
  failureReason         String?
  attemptCount          Int      @default(0)
  maxAttempts           Int      @default(3)
  lastAttemptAt         DateTime?
  nextRetryAt           DateTime?
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([paymentPlanId, status])
  @@index([status, scheduledDate])
  @@index([status, nextRetryAt])
}

model PaymentMethod {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripePaymentMethodId String @unique
  type              String   // 'card', 'bank_account', 'paypal'
  last4             String?
  brand             String?
  expiryMonth       Int?
  expiryYear        Int?
  isDefault         Boolean  @default(false)
  isBackup          Boolean  @default(false)
  status            String   @default("active") // 'active', 'expired', 'failed'
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId, isDefault])
}
```

### TypeScript Interfaces
```typescript
// types/payment-plan.types.ts

export interface PaymentPlanConfig {
  planType: 'full' | 'monthly' | 'quarterly' | 'custom';
  totalAmount: number;
  installmentCount: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'custom';
  paymentDay: number; // 1-28
  interestRate?: number;
}

export interface InstallmentSchedule {
  installmentNumber: number;
  scheduledDate: Date;
  amount: number;
  description: string;
}

export interface PaymentPlanSummary {
  totalAmount: number;
  installmentAmount: number;
  installmentCount: number;
  totalWithInterest: number;
  savings: number; // If paying full
  schedule: InstallmentSchedule[];
}

export interface PaymentRetryConfig {
  maxAttempts: number;
  retrySchedule: number[]; // Days between retries [1, 3, 7]
  gracePeriodDays: number;
}
```

### Payment Plan Service
```typescript
// lib/services/payment-plan.service.ts
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { EmailService } from './email';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const emailService = new EmailService();

export class PaymentPlanService {
  // Create payment plan
  async createPaymentPlan(
    subscriptionId: string,
    config: PaymentPlanConfig
  ): Promise<PaymentPlan> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate installments
    const interestRate = config.interestRate || 0;
    const totalWithInterest = config.totalAmount * (1 + interestRate / 100);
    const installmentAmount = totalWithInterest / config.installmentCount;

    // Create payment plan
    const paymentPlan = await prisma.paymentPlan.create({
      data: {
        subscriptionId,
        planType: config.planType,
        totalAmount: config.totalAmount,
        installmentAmount,
        installmentCount: config.installmentCount,
        installmentsRemaining: config.installmentCount,
        paymentFrequency: config.paymentFrequency,
        nextPaymentDate: this.calculateNextPaymentDate(config.paymentDay),
        paymentDay: config.paymentDay,
        interestRate,
        totalWithInterest,
        status: 'active',
      },
    });

    // Create installment schedule
    await this.createInstallmentSchedule(paymentPlan);

    // Setup Stripe subscription if auto-pay enabled
    if (paymentPlan.autoPayEnabled) {
      await this.setupStripeSubscription(paymentPlan, subscription);
    }

    return paymentPlan;
  }

  // Create installment schedule
  private async createInstallmentSchedule(paymentPlan: PaymentPlan) {
    const installments: InstallmentPayment[] = [];
    let scheduledDate = new Date(paymentPlan.nextPaymentDate);

    for (let i = 1; i <= paymentPlan.installmentCount; i++) {
      await prisma.installmentPayment.create({
        data: {
          paymentPlanId: paymentPlan.id,
          installmentNumber: i,
          scheduledDate,
          amount: paymentPlan.installmentAmount,
          status: 'pending',
        },
      });

      // Calculate next scheduled date
      scheduledDate = this.calculateNextScheduledDate(
        scheduledDate,
        paymentPlan.paymentFrequency,
        paymentPlan.paymentDay
      );
    }
  }

  // Process payment
  async processInstallmentPayment(installmentId: string): Promise<void> {
    const installment = await prisma.installmentPayment.findUnique({
      where: { id: installmentId },
      include: {
        paymentPlan: {
          include: {
            subscription: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!installment || installment.status !== 'pending') {
      return;
    }

    try {
      // Update status to processing
      await prisma.installmentPayment.update({
        where: { id: installmentId },
        data: {
          status: 'processing',
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      // Get payment method
      const paymentMethod = await this.getActivePaymentMethod(
        installment.paymentPlan.subscription.userId
      );

      if (!paymentMethod) {
        throw new Error('No active payment method');
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(installment.amount * 100),
        currency: 'usd',
        customer: installment.paymentPlan.subscription.stripeCustomerId!,
        payment_method: paymentMethod.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          installmentId: installment.id,
          paymentPlanId: installment.paymentPlanId,
          installmentNumber: installment.installmentNumber,
        },
      });

      // Update installment as paid
      await prisma.installmentPayment.update({
        where: { id: installmentId },
        data: {
          status: 'paid',
          stripePaymentIntentId: paymentIntent.id,
          paidAt: new Date(),
        },
      });

      // Update payment plan
      await prisma.paymentPlan.update({
        where: { id: installment.paymentPlanId },
        data: {
          installmentsPaid: { increment: 1 },
          installmentsRemaining: { decrement: 1 },
        },
      });

      // Send confirmation email
      await emailService.sendPaymentConfirmation(
        installment.paymentPlan.subscription.user.email,
        {
          amount: installment.amount,
          installmentNumber: installment.installmentNumber,
          remainingBalance: this.calculateRemainingBalance(installment.paymentPlan),
        }
      );
    } catch (error: any) {
      await this.handlePaymentFailure(installmentId, error.message);
    }
  }

  // Handle payment failure
  private async handlePaymentFailure(installmentId: string, reason: string) {
    const installment = await prisma.installmentPayment.findUnique({
      where: { id: installmentId },
      include: {
        paymentPlan: {
          include: {
            subscription: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!installment) return;

    const attemptCount = installment.attemptCount;
    const maxAttempts = installment.maxAttempts;

    // Update installment
    await prisma.installmentPayment.update({
      where: { id: installmentId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        failureReason: reason,
        nextRetryAt:
          attemptCount < maxAttempts
            ? this.calculateNextRetryDate(attemptCount)
            : null,
      },
    });

    // Send failure notification
    await emailService.sendPaymentFailureNotification(
      installment.paymentPlan.subscription.user.email,
      {
        amount: installment.amount,
        failureReason: reason,
        attemptsRemaining: maxAttempts - attemptCount,
        nextRetryDate: this.calculateNextRetryDate(attemptCount),
      }
    );

    // Suspend account if max attempts reached
    if (attemptCount >= maxAttempts) {
      await this.suspendPaymentPlan(installment.paymentPlanId);
    }
  }

  // Suspend payment plan
  private async suspendPaymentPlan(paymentPlanId: string) {
    await prisma.paymentPlan.update({
      where: { id: paymentPlanId },
      data: { status: 'suspended' },
    });

    // TODO: Suspend subscription access
  }

  // Calculate next payment date
  private calculateNextPaymentDate(paymentDay: number): Date {
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth(), paymentDay);

    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }

  // Calculate next scheduled date
  private calculateNextScheduledDate(
    currentDate: Date,
    frequency: string,
    paymentDay: number
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    nextDate.setDate(paymentDay);
    return nextDate;
  }

  // Calculate next retry date
  private calculateNextRetryDate(attemptCount: number): Date {
    const retryDays = [1, 3, 7];
    const daysToAdd = retryDays[attemptCount] || 7;
    const nextRetry = new Date();
    nextRetry.setDate(nextRetry.getDate() + daysToAdd);
    return nextRetry;
  }

  // Get active payment method
  private async getActivePaymentMethod(userId: string) {
    return await prisma.paymentMethod.findFirst({
      where: {
        userId,
        status: 'active',
        isDefault: true,
      },
    });
  }

  // Calculate remaining balance
  private calculateRemainingBalance(paymentPlan: PaymentPlan): number {
    return paymentPlan.installmentAmount * paymentPlan.installmentsRemaining;
  }

  // Setup Stripe subscription for auto-pay
  private async setupStripeSubscription(
    paymentPlan: PaymentPlan,
    subscription: Subscription
  ) {
    // Implementation depends on Stripe setup
    // This would create a Stripe subscription with the installment schedule
  }
}
```

### API Routes
```typescript
// app/api/subscriptions/[subscriptionId]/payment-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { PaymentPlanService } from '@/lib/services/payment-plan.service';

const paymentPlanService = new PaymentPlanService();

export async function POST(
  req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const paymentPlan = await paymentPlanService.createPaymentPlan(
    params.subscriptionId,
    body
  );

  return NextResponse.json(paymentPlan);
}

// app/api/payment-plans/[planId]/installments/[installmentId]/pay/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { planId: string; installmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await paymentPlanService.processInstallmentPayment(params.installmentId);

  return NextResponse.json({ success: true });
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('PaymentPlanService', () => {
  it('should create payment plan with correct installments', async () => {
    const plan = await service.createPaymentPlan(subscriptionId, config);
    expect(plan.installmentCount).toBe(6);
    expect(plan.installmentAmount).toBeCloseTo(50);
  });

  it('should process installment payment successfully', async () => {
    await service.processInstallmentPayment(installmentId);
    const installment = await prisma.installmentPayment.findUnique({ where: { id: installmentId } });
    expect(installment.status).toBe('paid');
  });

  it('should handle payment failures with retry logic', async () => {
    await service.handlePaymentFailure(installmentId, 'Card declined');
    const installment = await prisma.installmentPayment.findUnique({ where: { id: installmentId } });
    expect(installment.nextRetryAt).toBeDefined();
  });

  it('should suspend account after max failed attempts', async () => {
    // Simulate 3 failed attempts
    for (let i = 0; i < 3; i++) {
      await service.handlePaymentFailure(installmentId, 'Card declined');
    }
    const plan = await prisma.paymentPlan.findUnique({ where: { id: planId } });
    expect(plan.status).toBe('suspended');
  });
});
```

### Integration Tests
```typescript
describe('Payment Plan Integration', () => {
  it('should create Stripe subscription for auto-pay', async () => {
    const plan = await service.createPaymentPlan(subscriptionId, autoPayConfig);
    expect(plan.autoPayEnabled).toBe(true);
    // Verify Stripe subscription created
  });

  it('should send payment confirmation email', async () => {
    await service.processInstallmentPayment(installmentId);
    // Verify email sent
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Payment plan database schema deployed
- [ ] Auto-payment processing functional
- [ ] Failed payment handling with retries implemented
- [ ] Payment status tracking working
- [ ] Email/SMS notifications configured
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests with Stripe passing
- [ ] Security audit completed
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