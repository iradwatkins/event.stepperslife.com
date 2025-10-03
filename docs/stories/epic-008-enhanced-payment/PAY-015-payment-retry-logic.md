# PAY-015: Payment Retry Logic

**Epic:** EPIC-008 - Enhanced Payment Processing
**Story Points:** 3
**Priority:** Medium
**Sprint:** TBD
**Status:** Ready for Development

---

## User Story

**As a** platform automatically recovering from transient payment failures
**I want to** implement intelligent retry logic with exponential backoff
**So that I** can maximize successful payments and reduce false negatives from temporary issues

---

## Acceptance Criteria

### 1. Retry-Eligible Failure Detection
- [ ] System categorizes payment failures into retryable vs. non-retryable
- [ ] Retryable: Network timeouts, temporary API errors, rate limits
- [ ] Non-retryable: Insufficient funds, card declined, invalid card
- [ ] Failure categorization logged with error code and reason
- [ ] Retry decision made immediately based on error type
- [ ] User notified differently based on retry eligibility

### 2. Exponential Backoff Strategy
- [ ] Retry schedule: 1 minute, 5 minutes, 15 minutes, 1 hour, 4 hours
- [ ] Maximum 5 retry attempts per payment
- [ ] Each retry logged with attempt number and timestamp
- [ ] Backoff multiplier configurable (default: 2x)
- [ ] Jitter added to prevent thundering herd (±10% random variance)
- [ ] Retry abandoned after 24 hours regardless of attempts

### 3. Job Queue Implementation
- [ ] Failed payments queued in BullMQ/Redis queue
- [ ] Job includes: order ID, payment details, attempt count, next retry time
- [ ] Queue workers process retry jobs at scheduled times
- [ ] Failed jobs move to dead letter queue after max retries
- [ ] Queue monitoring dashboard shows pending retries
- [ ] Queue metrics: Success rate, retry distribution, queue depth

### 4. Idempotency Protection
- [ ] Each payment attempt uses unique idempotency key
- [ ] Idempotency key format: {orderId}-retry-{attemptNumber}
- [ ] Duplicate payment prevention via Square's idempotency
- [ ] Idempotency keys stored for 24 hours (Square requirement)
- [ ] Retry logic checks for existing successful payment before retry
- [ ] No duplicate charges even if retry job runs twice

### 5. User Notifications
- [ ] Immediate notification on payment failure (non-retryable)
- [ ] "Processing your payment..." message for retryable failures
- [ ] Email notification after final retry failure
- [ ] Success notification if retry succeeds
- [ ] Retry status visible in order details page
- [ ] "Payment retrying" badge on dashboard orders list

### 6. Manual Retry Option
- [ ] User can manually retry failed payment from order page
- [ ] Manual retry button available for 48 hours after failure
- [ ] Manual retry bypasses automatic backoff schedule
- [ ] Manual retry prompts for new payment method option
- [ ] Manual retry success cancels automatic retries
- [ ] Manual retry tracked separately in analytics

### 7. Failure Analysis
- [ ] Dashboard shows failed payment reasons breakdown
- [ ] Failure categories: Card declined, network error, timeout, etc.
- [ ] Retry success rate by failure type
- [ ] Average retries until success
- [ ] Most common non-retryable failures
- [ ] Trending failure patterns (hourly, daily)

### 8. Rate Limiting Protection
- [ ] Square API rate limits respected (500 requests/sec)
- [ ] Retry jobs throttled to stay under limits
- [ ] Rate limit errors trigger longer backoff (5x multiplier)
- [ ] Batch retry processing with delays between jobs
- [ ] Circuit breaker pattern for persistent API issues
- [ ] Alert when rate limit threshold reached (80%)

### 9. Webhook Retry for Failed Deliveries
- [ ] Payment confirmation webhooks retried if delivery fails
- [ ] Webhook retry schedule: 1min, 5min, 30min, 2hr, 6hr
- [ ] Maximum 5 webhook retry attempts
- [ ] Webhook signature regenerated for each retry
- [ ] Failed webhooks logged for manual investigation
- [ ] Alert admin on critical webhook failures (3+ consecutive)

### 10. Dead Letter Queue Management
- [ ] Failed payments after max retries moved to DLQ
- [ ] Admin dashboard displays DLQ items
- [ ] Admin can manually process DLQ items
- [ ] DLQ retention: 7 days before permanent archive
- [ ] DLQ items exportable to CSV for analysis
- [ ] Option to bulk retry DLQ items (admin action)

### 11. Circuit Breaker for Persistent Failures
- [ ] Circuit breaker trips after 10 consecutive failures
- [ ] When tripped, all payments fail fast (no retry)
- [ ] Circuit breaker auto-resets after 5 minutes
- [ ] Half-open state allows limited retries to test recovery
- [ ] Alert sent when circuit breaker trips
- [ ] Status page shows circuit breaker state

### 12. Monitoring and Alerts
- [ ] Alert when retry success rate drops below 50%
- [ ] Alert when queue depth exceeds 100 jobs
- [ ] Alert on dead letter queue growth (>10 items/hour)
- [ ] Alert on circuit breaker trips
- [ ] Dashboard shows real-time retry metrics
- [ ] Weekly summary report: Total retries, success rate, failure reasons

---

## Technical Specifications

### BullMQ Queue Implementation

```typescript
// lib/queues/payment-retry.queue.ts
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { squareClient } from '@/lib/payments/square.config';
import { prisma } from '@/lib/database/prisma';
import { sendEmail } from '@/lib/services/email';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface PaymentRetryJob {
  orderId: string;
  amount: number;
  currency: string;
  paymentSourceId: string;
  attemptNumber: number;
  originalError: string;
  customerId?: string;
}

// Create retry queue
export const paymentRetryQueue = new Queue<PaymentRetryJob>('payment-retry', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: false, // Keep failed jobs for analysis
  },
});

// Exponential backoff calculator
function calculateBackoff(attemptNumber: number): number {
  const baseDelay = 60 * 1000; // 1 minute in milliseconds
  const multiplier = 2;
  const maxDelay = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  // Exponential: 1min, 2min, 4min, 8min, 16min...
  let delay = baseDelay * Math.pow(multiplier, attemptNumber - 1);

  // Cap at max delay
  delay = Math.min(delay, maxDelay);

  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  delay += jitter;

  return Math.round(delay);
}

// Payment retry worker
export const paymentRetryWorker = new Worker<PaymentRetryJob>(
  'payment-retry',
  async (job: Job<PaymentRetryJob>) => {
    const { orderId, amount, currency, paymentSourceId, attemptNumber, customerId } = job.data;

    console.log(`Retry attempt ${attemptNumber} for order ${orderId}`);

    try {
      // Check if payment already succeeded (prevent duplicates)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (order?.status === 'PAID') {
        console.log(`Order ${orderId} already paid, skipping retry`);
        return { success: true, reason: 'already_paid' };
      }

      // Create idempotency key with retry attempt number
      const idempotencyKey = `${orderId}-retry-${attemptNumber}`;

      // Attempt payment
      const paymentResult = await squareClient.paymentsApi.createPayment({
        sourceId: paymentSourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency: currency as 'USD',
        },
        referenceId: orderId,
        customerId,
      });

      if (paymentResult.result.payment?.status === 'APPROVED') {
        // Payment succeeded!
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            squarePaymentId: paymentResult.result.payment.id,
          },
        });

        // Log retry success
        await prisma.paymentRetryLog.create({
          data: {
            orderId,
            attemptNumber,
            status: 'SUCCESS',
            squarePaymentId: paymentResult.result.payment.id,
          },
        });

        // Notify user
        await notifyPaymentSuccess(orderId, attemptNumber);

        return { success: true };
      } else {
        throw new Error(`Payment not approved: ${paymentResult.result.payment?.status}`);
      }
    } catch (error: any) {
      console.error(`Retry ${attemptNumber} failed for order ${orderId}:`, error);

      // Log retry failure
      await prisma.paymentRetryLog.create({
        data: {
          orderId,
          attemptNumber,
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      // Categorize error
      const errorCategory = categorizeError(error);

      if (!errorCategory.retryable || attemptNumber >= 5) {
        // Final failure - notify user
        await notifyFinalFailure(orderId, attemptNumber, error.message);
        throw new Error('Max retries reached or non-retryable error');
      }

      // Schedule next retry
      const nextDelay = calculateBackoff(attemptNumber + 1);
      await paymentRetryQueue.add(
        'retry-payment',
        {
          ...job.data,
          attemptNumber: attemptNumber + 1,
        },
        { delay: nextDelay }
      );

      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection: redis,
    concurrency: 10, // Process 10 retries concurrently
    limiter: {
      max: 50, // Max 50 jobs per second
      duration: 1000,
    },
  }
);

// Error categorization
interface ErrorCategory {
  retryable: boolean;
  reason: string;
  backoffMultiplier: number;
}

function categorizeError(error: any): ErrorCategory {
  const errorCode = error.code || error.statusCode;
  const errorMessage = error.message?.toLowerCase() || '';

  // Network/timeout errors - retryable
  if (
    errorCode === 'ECONNRESET' ||
    errorCode === 'ETIMEDOUT' ||
    errorMessage.includes('timeout')
  ) {
    return { retryable: true, reason: 'network_timeout', backoffMultiplier: 1 };
  }

  // Rate limit - retryable with longer backoff
  if (errorCode === 429 || errorMessage.includes('rate limit')) {
    return { retryable: true, reason: 'rate_limit', backoffMultiplier: 5 };
  }

  // Square API temporary errors - retryable
  if (errorCode >= 500 && errorCode < 600) {
    return { retryable: true, reason: 'server_error', backoffMultiplier: 2 };
  }

  // Card declined - NOT retryable
  if (
    errorMessage.includes('declined') ||
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('invalid card')
  ) {
    return { retryable: false, reason: 'card_declined', backoffMultiplier: 1 };
  }

  // Default: non-retryable
  return { retryable: false, reason: 'unknown', backoffMultiplier: 1 };
}

// Queue payment for retry
export async function queuePaymentRetry(
  orderId: string,
  amount: number,
  paymentSourceId: string,
  error: any,
  customerId?: string
): Promise<void> {
  const errorCategory = categorizeError(error);

  if (!errorCategory.retryable) {
    console.log(`Error not retryable for order ${orderId}: ${errorCategory.reason}`);
    await notifyFinalFailure(orderId, 0, error.message);
    return;
  }

  // Add to retry queue
  const delay = calculateBackoff(1);
  await paymentRetryQueue.add(
    'retry-payment',
    {
      orderId,
      amount,
      currency: 'USD',
      paymentSourceId,
      attemptNumber: 1,
      originalError: error.message,
      customerId,
    },
    { delay }
  );

  console.log(`Queued retry for order ${orderId}, first attempt in ${delay}ms`);

  // Notify user
  await notifyRetryScheduled(orderId);
}

// Notification helpers
async function notifyRetryScheduled(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, event: true },
  });

  if (!order) return;

  await sendEmail({
    to: order.user.email,
    subject: 'Processing Your Payment',
    template: 'payment-retry-scheduled',
    data: {
      userName: order.user.name,
      eventTitle: order.event.title,
      amount: order.totalAmount,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`,
    },
  });
}

async function notifyPaymentSuccess(orderId: string, attemptNumber: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, event: true },
  });

  if (!order) return;

  await sendEmail({
    to: order.user.email,
    subject: 'Payment Successful',
    template: 'payment-retry-success',
    data: {
      userName: order.user.name,
      eventTitle: order.event.title,
      amount: order.totalAmount,
      attemptNumber,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`,
    },
  });
}

async function notifyFinalFailure(
  orderId: string,
  attemptNumber: number,
  errorMessage: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, event: true },
  });

  if (!order) return;

  await sendEmail({
    to: order.user.email,
    subject: 'Payment Failed',
    template: 'payment-final-failure',
    data: {
      userName: order.user.name,
      eventTitle: order.event.title,
      amount: order.totalAmount,
      attemptNumber,
      errorMessage,
      retryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}/retry`,
    },
  });
}

// Manual retry API
export async function manualRetryPayment(
  orderId: string,
  paymentSourceId: string
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  try {
    const idempotencyKey = `${orderId}-manual-retry-${Date.now()}`;

    const paymentResult = await squareClient.paymentsApi.createPayment({
      sourceId: paymentSourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(order.totalAmount * 100)),
        currency: 'USD',
      },
      referenceId: orderId,
      customerId: order.user.squareCustomerId,
    });

    if (paymentResult.result.payment?.status === 'APPROVED') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          squarePaymentId: paymentResult.result.payment.id,
        },
      });

      // Cancel any pending automatic retries
      await paymentRetryQueue.obliterate({ force: true });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Manual retry failed:', error);
    throw error;
  }
}
```

---

## Database Schema

```prisma
// prisma/schema.prisma additions

model PaymentRetryLog {
  id              String   @id @default(uuid())
  orderId         String
  attemptNumber   Int
  status          String   // SUCCESS, FAILED, PENDING
  errorMessage    String?
  squarePaymentId String?
  createdAt       DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([status])
  @@index([createdAt])
}
```

---

## Dependencies

### Technical Dependencies
- BullMQ (job queue)
- Redis (queue storage)
- Square Payments API
- Next.js 14+
- Prisma ORM

### Story Dependencies
- PAY-001: Square Payments Setup (prerequisite)
- ORD-001: Order management (prerequisite)

---

## Testing Requirements

### Unit Tests
- Test exponential backoff calculation
- Test error categorization logic
- Test idempotency key generation
- Test jitter application
- Test max retry enforcement

### Integration Tests
- Test complete retry flow (failure → queue → retry → success)
- Test duplicate payment prevention
- Test webhook retry mechanism
- Test circuit breaker behavior
- Test dead letter queue processing

### Load Tests
- Test queue performance under load (1000+ retries)
- Test rate limiting behavior
- Test concurrent retry processing
- Test Redis performance

---

## Monitoring & Analytics

### Key Metrics
- Retry success rate (% retries resulting in successful payment)
- Average retries until success
- Failure reason breakdown
- Queue depth over time
- Circuit breaker trips per day

### Alerts
- Alert when retry success rate < 50%
- Alert when queue depth > 100
- Alert on circuit breaker trip
- Alert on DLQ growth rate

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests passing
- [ ] Load tests completed
- [ ] Queue monitoring dashboard configured
- [ ] Alerts configured
- [ ] Documentation complete
- [ ] Product owner approval

---

## Notes

### Best Practices
- Always use idempotency keys
- Categorize errors correctly
- Add jitter to prevent thundering herd
- Monitor queue depth and alert proactively
- Provide manual retry option for users

### Future Enhancements
- Machine learning for retry prediction
- Dynamic backoff based on error type
- Priority queue for high-value orders
- Smart retry scheduling based on historical success patterns