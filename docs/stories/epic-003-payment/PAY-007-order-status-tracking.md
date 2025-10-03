# PAY-007: Order Status Tracking & Lifecycle Management

**Epic**: EPIC-003 - Payment Processing Foundation
**Story Points**: 2
**Priority**: High
**Status**: Ready for Development

---

## User Story

**As a** Ticket Buyer
**I want to** track my order status from purchase through completion
**So that** I know when my tickets are confirmed and ready to use

**As an** Event Organizer
**I want to** monitor order statuses for my events in real-time
**So that** I can understand sales progress and troubleshoot any issues

**As a** Platform Administrator
**I want to** comprehensive order lifecycle tracking with webhooks
**So that** payments are reconciled correctly and orders never get stuck in limbo

---

## Business Context

Order status tracking provides:
- Transparency for buyers (order confirmation, payment processing)
- Operational visibility for organizers (sales tracking, failed orders)
- System reliability (detecting stuck orders, handling async payments)
- Financial accuracy (reconciling payments with order completion)
- Support efficiency (quick status lookup for customer inquiries)

Poor status tracking leads to:
- Customer confusion and support tickets
- Lost revenue from undetected failed orders
- Inventory management issues (overselling or underselling)
- Difficult troubleshooting and reconciliation

---

## Acceptance Criteria

### 1. Order State Machine

- [ ] System implements well-defined order states:
  - **PENDING**: Order created, payment not yet initiated
  - **PROCESSING**: Payment in progress (async payment methods)
  - **COMPLETED**: Payment successful, tickets issued
  - **FAILED**: Payment failed (retryable)
  - **CANCELLED**: User cancelled order before completion
  - **REFUNDED**: Order completed but later refunded
  - **DISPUTED**: Payment disputed by cardholder
  - **EXPIRED**: Pending order timed out (15 minutes)

- [ ] State transitions follow strict rules:
  ```
  PENDING → PROCESSING → COMPLETED
  PENDING → EXPIRED
  PROCESSING → FAILED → PENDING (retry)
  PROCESSING → FAILED → CANCELLED (abandon)
  COMPLETED → REFUNDED
  COMPLETED → DISPUTED
  ```

- [ ] Invalid state transitions are rejected with error
- [ ] State transitions are atomic (database transaction)
- [ ] All transitions logged with timestamp and reason

### 2. Real-Time Status Updates

- [ ] Order status updates immediately upon payment completion
- [ ] Webhook handlers process Square payment events asynchronously
- [ ] Users see status updates without page refresh (WebSocket or polling)
- [ ] Dashboard displays real-time order counts by status
- [ ] Status changes trigger email notifications
- [ ] Status history preserved for audit trail

### 3. Webhook Integration with Square

- [ ] System registers webhook endpoints with Square
- [ ] Webhook handler validates Square signature for security
- [ ] Handles these Square webhook events:
  - `payment.created`: Order → PROCESSING
  - `payment.updated`: Check payment status
  - `payment.completed`: Order → COMPLETED
  - `payment.failed`: Order → FAILED
  - `refund.created`: Order → REFUNDED
  - `dispute.created`: Order → DISPUTED

- [ ] Webhook processing is idempotent (duplicate webhooks handled safely)
- [ ] Failed webhook processing retried with exponential backoff
- [ ] Webhook events logged for debugging
- [ ] Webhook endpoint secured (signature verification, rate limiting)

### 4. Automatic Timeout Handling

- [ ] Background job checks for stuck PENDING orders every 5 minutes
- [ ] Orders in PENDING state > 15 minutes automatically EXPIRED
- [ ] Expired orders release ticket inventory
- [ ] Users notified of expired orders via email
- [ ] Expired orders can be re-attempted by user (new order)
- [ ] Processing timeout: orders in PROCESSING > 30 minutes flagged for review

### 5. User-Facing Status Display

- [ ] Checkout confirmation page shows current order status
- [ ] Order status page accessible via unique URL (e.g., /orders/[orderId])
- [ ] Status page shows:
  - Current status with visual indicator
  - Order details (event, tickets, amount)
  - Payment method
  - Estimated completion time (if processing)
  - Next steps based on status
  - Support contact link

- [ ] Status display updates automatically (no manual refresh needed)
- [ ] User can access order history from account dashboard
- [ ] Mobile-responsive status page

### 6. Organizer Dashboard Integration

- [ ] Organizers see order status breakdown:
  - Total orders
  - Completed (revenue confirmed)
  - Processing (pending revenue)
  - Failed (lost sales)

- [ ] Filter orders by status
- [ ] Sort by date, amount, status
- [ ] Export order list with statuses to CSV
- [ ] Visual charts showing status distribution
- [ ] Alert badge for failed orders requiring attention

### 7. Administrator Tools

- [ ] Admin panel lists all orders with filters
- [ ] Ability to manually update order status (with reason required)
- [ ] View full order history timeline
- [ ] Search orders by ID, user email, event name, status
- [ ] Bulk actions: retry failed payments, cancel stuck orders
- [ ] Webhook event log viewer
- [ ] Alert system for anomalies (many stuck orders, high failure rate)

### 8. Status-Based Actions

- [ ] COMPLETED orders trigger ticket generation (QR codes)
- [ ] COMPLETED orders send confirmation email with tickets
- [ ] FAILED orders send retry instructions to user
- [ ] REFUNDED orders invalidate tickets
- [ ] DISPUTED orders flag for manual review
- [ ] EXPIRED orders release reserved inventory

---

## Technical Requirements

### Database Schema

```sql
-- Order Status Enum
CREATE TYPE order_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'DISPUTED',
  'EXPIRED'
);

-- Update Orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status order_status NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS square_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Order Status History
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES users(id), -- NULL for system changes
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB -- Additional context (webhook ID, error details, etc.)
);

-- Webhook Event Log
CREATE TABLE webhook_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL, -- Square webhook event ID
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(500) NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  received_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status, created_at);
CREATE INDEX idx_orders_expires_at ON orders(expires_at) WHERE status = 'PENDING';
CREATE INDEX idx_order_history_order_id ON order_status_history(order_id, changed_at DESC);
CREATE INDEX idx_webhook_processed ON webhook_event_log(processed, received_at);
```

### Order State Machine Service

```typescript
// lib/services/order-state-machine.ts

import { OrderStatus } from '@prisma/client';
import prisma from '@/lib/prisma/client';

// Valid state transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'EXPIRED', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  FAILED: ['PENDING', 'CANCELLED'], // Can retry or abandon
  COMPLETED: ['REFUNDED', 'DISPUTED'],
  CANCELLED: [], // Terminal state
  REFUNDED: [], // Terminal state
  DISPUTED: ['COMPLETED', 'REFUNDED'], // Can be resolved
  EXPIRED: ['PENDING'] // Can create new order
};

export class OrderStateMachine {
  /**
   * Transition order to new status with validation
   */
  async transitionTo(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Get current order with lock
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true }
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Validate transition
      const validNextStates = VALID_TRANSITIONS[order.status];
      if (!validNextStates.includes(newStatus)) {
        throw new Error(
          `Invalid state transition: ${order.status} → ${newStatus}`
        );
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          statusUpdatedAt: new Date(),
          ...(newStatus === 'PENDING' && {
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
          }),
          ...(newStatus === 'FAILED' && reason && {
            failureReason: reason
          })
        }
      });

      // Record history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          reason,
          changedBy: userId,
          metadata: metadata || {}
        }
      });
    });

    // Trigger side effects after transaction commits
    await this.handleStatusChange(orderId, newStatus);
  }

  /**
   * Handle side effects of status changes
   */
  private async handleStatusChange(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<void> {
    switch (newStatus) {
      case 'COMPLETED':
        // Generate tickets
        await this.generateTickets(orderId);
        // Send confirmation email
        await this.sendConfirmationEmail(orderId);
        break;

      case 'FAILED':
        // Send retry instructions
        await this.sendFailureEmail(orderId);
        break;

      case 'REFUNDED':
        // Invalidate tickets
        await this.invalidateTickets(orderId);
        // Send refund confirmation
        await this.sendRefundEmail(orderId);
        break;

      case 'EXPIRED':
        // Release inventory
        await this.releaseInventory(orderId);
        // Send expiration notice
        await this.sendExpirationEmail(orderId);
        break;

      case 'DISPUTED':
        // Alert admin
        await this.alertAdminDispute(orderId);
        break;
    }
  }

  // Placeholder methods for side effects
  private async generateTickets(orderId: string): Promise<void> {
    // Implementation in ticket service
  }

  private async sendConfirmationEmail(orderId: string): Promise<void> {
    // Implementation in email service
  }

  private async sendFailureEmail(orderId: string): Promise<void> {
    // Implementation in email service
  }

  private async invalidateTickets(orderId: string): Promise<void> {
    // Implementation in ticket service
  }

  private async sendRefundEmail(orderId: string): Promise<void> {
    // Implementation in email service
  }

  private async releaseInventory(orderId: string): Promise<void> {
    // Implementation in inventory service
  }

  private async sendExpirationEmail(orderId: string): Promise<void> {
    // Implementation in email service
  }

  private async alertAdminDispute(orderId: string): Promise<void> {
    // Implementation in notification service
  }

  /**
   * Get order status history
   */
  async getStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    return await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { changedAt: 'desc' },
      include: {
        changedBy: {
          select: { name: true, email: true }
        }
      }
    });
  }
}

export const orderStateMachine = new OrderStateMachine();
```

### Square Webhook Handler

```typescript
// app/api/webhooks/square/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { orderStateMachine } from '@/lib/services/order-state-machine';
import prisma from '@/lib/prisma/client';

const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-signature');

    // Verify webhook signature
    if (!verifySquareSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventId = event.event_id || event.merchant_id + '_' + Date.now();

    // Check if already processed (idempotency)
    const existing = await prisma.webhookEventLog.findUnique({
      where: { eventId }
    });

    if (existing?.processed) {
      console.log(`Webhook ${eventId} already processed`);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Log webhook event
    await prisma.webhookEventLog.create({
      data: {
        eventId,
        eventType: event.type,
        payload: event,
        signature: signature || '',
        processed: false
      }
    });

    // Process webhook
    await processWebhookEvent(event);

    // Mark as processed
    await prisma.webhookEventLog.update({
      where: { eventId },
      data: { processed: true, processedAt: new Date() }
    });

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

function verifySquareSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function processWebhookEvent(event: any): Promise<void> {
  const eventType = event.type;
  const paymentId = event.data?.object?.payment?.id;

  if (!paymentId) {
    console.warn('Webhook event missing payment ID', event);
    return;
  }

  // Find order by Square payment ID
  const order = await prisma.order.findFirst({
    where: { squarePaymentId: paymentId }
  });

  if (!order) {
    console.warn(`Order not found for payment ${paymentId}`);
    return;
  }

  // Handle event type
  switch (eventType) {
    case 'payment.created':
      await orderStateMachine.transitionTo(
        order.id,
        'PROCESSING',
        'Payment initiated',
        undefined,
        { webhookEventId: event.event_id }
      );
      break;

    case 'payment.updated':
      const status = event.data?.object?.payment?.status;
      if (status === 'COMPLETED') {
        await orderStateMachine.transitionTo(
          order.id,
          'COMPLETED',
          'Payment completed',
          undefined,
          { webhookEventId: event.event_id }
        );
      } else if (status === 'FAILED') {
        await orderStateMachine.transitionTo(
          order.id,
          'FAILED',
          'Payment failed',
          undefined,
          { webhookEventId: event.event_id }
        );
      }
      break;

    case 'refund.created':
      await orderStateMachine.transitionTo(
        order.id,
        'REFUNDED',
        'Refund processed',
        undefined,
        { webhookEventId: event.event_id, refundId: event.data?.object?.refund?.id }
      );
      break;

    case 'dispute.created':
      await orderStateMachine.transitionTo(
        order.id,
        'DISPUTED',
        'Payment disputed by cardholder',
        undefined,
        { webhookEventId: event.event_id, disputeId: event.data?.object?.dispute?.id }
      );
      break;

    default:
      console.log(`Unhandled webhook event type: ${eventType}`);
  }
}
```

### Background Job: Expire Pending Orders

```typescript
// lib/jobs/expire-pending-orders.ts

import { orderStateMachine } from '@/lib/services/order-state-machine';
import prisma from '@/lib/prisma/client';

export async function expirePendingOrders(): Promise<void> {
  const now = new Date();

  // Find expired pending orders
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now }
    },
    select: { id: true }
  });

  console.log(`Found ${expiredOrders.length} expired orders`);

  // Transition each to EXPIRED
  for (const order of expiredOrders) {
    try {
      await orderStateMachine.transitionTo(
        order.id,
        'EXPIRED',
        'Order expired after 15 minutes'
      );
    } catch (error) {
      console.error(`Failed to expire order ${order.id}:`, error);
    }
  }
}

// Run every 5 minutes via cron job
// Vercel cron: /api/cron/expire-orders
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('OrderStateMachine', () => {
  test('allows valid state transition', async () => {
    await orderStateMachine.transitionTo('order123', 'PROCESSING');
    const order = await prisma.order.findUnique({ where: { id: 'order123' } });
    expect(order?.status).toBe('PROCESSING');
  });

  test('rejects invalid state transition', async () => {
    await expect(
      orderStateMachine.transitionTo('order123', 'REFUNDED') // from PENDING
    ).rejects.toThrow('Invalid state transition');
  });

  test('records status history', async () => {
    await orderStateMachine.transitionTo('order123', 'PROCESSING', 'Payment started');
    const history = await orderStateMachine.getStatusHistory('order123');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].toStatus).toBe('PROCESSING');
  });
});

describe('Webhook Handler', () => {
  test('verifies Square signature correctly', () => {
    const body = JSON.stringify({ test: 'data' });
    const signature = generateTestSignature(body);
    expect(verifySquareSignature(body, signature)).toBe(true);
  });

  test('handles duplicate webhooks idempotently', async () => {
    await processWebhook(testWebhookEvent);
    await processWebhook(testWebhookEvent); // Same event
    // Should not throw, should be idempotent
  });
});

describe('expirePendingOrders', () => {
  test('expires orders older than 15 minutes', async () => {
    const oldOrder = await createTestOrder({
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 20 * 60 * 1000)
    });

    await expirePendingOrders();

    const updated = await prisma.order.findUnique({ where: { id: oldOrder.id } });
    expect(updated?.status).toBe('EXPIRED');
  });
});
```

### Integration Tests
- Test full order lifecycle with Square sandbox webhooks
- Verify status transitions trigger correct side effects
- Test webhook signature verification with real Square signatures
- Validate concurrent status updates don't cause race conditions
- Test background job execution

---

## Monitoring & Alerts

### Metrics to Track
- Orders by status (real-time dashboard)
- Average time in each status
- Expiration rate (% of orders that expire)
- Failure rate by event
- Webhook processing latency
- Stuck orders (processing > 30 minutes)

### Alert Conditions
- More than 10 orders stuck in PROCESSING
- Webhook processing failure rate > 5%
- High expiration rate (> 20%)
- Disputed orders (immediate alert)

---

## Definition of Done

- [ ] Order status enum and schema implemented
- [ ] OrderStateMachine service with validation
- [ ] Webhook handler with signature verification
- [ ] Background job for expiring pending orders
- [ ] User-facing order status page
- [ ] Organizer dashboard status filtering
- [ ] Admin panel order management tools
- [ ] Status history tracking working
- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests with Square webhooks passing
- [ ] Webhook idempotency verified
- [ ] Status-based email notifications sending
- [ ] Monitoring dashboard configured
- [ ] Documentation updated
- [ ] Code review completed
- [ ] QA testing all status transitions

---

## Notes

- Square webhook documentation: https://developer.squareup.com/docs/webhooks/overview
- Implement webhook retry mechanism for failed processing
- Consider real-time status updates via WebSocket for better UX
- Plan for status-based analytics and reporting
- Future: Add customer-facing order timeline visualization