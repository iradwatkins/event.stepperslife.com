# API-002: Webhook System

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 5
**Priority:** High
**Status:** To Do

## User Story

**As a** third-party developer
**I want** to receive real-time event notifications via webhooks
**So that** I can react to platform events and keep my systems synchronized

## Description

Implement a robust webhook delivery system that sends HTTP POST requests to registered endpoints when specific events occur. The system should include automatic retries, signature verification, delivery tracking, and a management interface for configuring webhook endpoints.

## Acceptance Criteria

### 1. Webhook Registration & Management
- [ ] API endpoint to register webhook URLs
- [ ] Support for multiple webhook endpoints per user/organization
- [ ] Event type filtering (subscribe to specific events)
- [ ] Webhook endpoint validation (URL format, SSL requirement)
- [ ] Enable/disable webhooks without deletion
- [ ] Secret key generation for signature verification

### 2. Event Types & Payloads
- [ ] `purchase.completed` - Ticket purchase successful
- [ ] `purchase.failed` - Payment failed
- [ ] `checkin.completed` - Attendee checked in
- [ ] `refund.issued` - Refund processed
- [ ] `event.cancelled` - Event cancelled
- [ ] `event.updated` - Event details changed
- [ ] `ticket.transferred` - Ticket ownership transferred
- [ ] `order.updated` - Order status changed

### 3. Webhook Delivery System
- [ ] Asynchronous webhook delivery (queue-based)
- [ ] Automatic retry logic with exponential backoff
- [ ] Retry attempts: 3 retries (immediate, 1min, 5min, 15min)
- [ ] Timeout: 10 seconds per delivery attempt
- [ ] Circuit breaker for consistently failing endpoints
- [ ] Delivery status tracking and logging

### 4. Security & Verification
- [ ] HMAC-SHA256 signature in webhook headers
- [ ] Timestamp-based replay attack prevention
- [ ] TLS/SSL requirement for webhook endpoints
- [ ] IP whitelist support (optional)
- [ ] Signature verification examples in documentation

### 5. Webhook Management Dashboard
- [ ] UI to add/edit/delete webhook endpoints
- [ ] Test webhook delivery with sample payload
- [ ] View delivery history and status
- [ ] Retry failed deliveries manually
- [ ] View webhook logs and error messages
- [ ] Webhook health status indicators

### 6. Monitoring & Debugging
- [ ] Delivery success/failure metrics
- [ ] Average delivery time tracking
- [ ] Failed delivery alerts
- [ ] Webhook payload inspection
- [ ] Request/response logging (last 30 days)
- [ ] Webhook debugging tools

## Technical Requirements

### Webhook Registration Schema
```typescript
interface Webhook {
  id: string;
  organizerId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

type WebhookEvent =
  | 'purchase.completed'
  | 'purchase.failed'
  | 'checkin.completed'
  | 'refund.issued'
  | 'event.cancelled'
  | 'event.updated'
  | 'ticket.transferred'
  | 'order.updated';
```

### Webhook Payload Structure
```json
{
  "id": "evt_1234567890",
  "type": "purchase.completed",
  "created": 1678901234,
  "data": {
    "object": {
      "id": "order_abc123",
      "eventId": "evt_456",
      "userId": "user_789",
      "amount": 9900,
      "currency": "USD",
      "tickets": [
        {
          "id": "tkt_001",
          "type": "General Admission",
          "price": 9900
        }
      ],
      "status": "completed"
    }
  },
  "livemode": true
}
```

### Webhook Headers
```http
POST /webhook-endpoint HTTP/1.1
Host: your-domain.com
Content-Type: application/json
X-Steppers-Signature: sha256=5d41402abc4b2a76b9719d911017c592
X-Steppers-Event: purchase.completed
X-Steppers-Delivery: evt_1234567890
X-Steppers-Timestamp: 1678901234
User-Agent: SteppersLife-Webhooks/1.0
```

### Signature Verification Example
```typescript
// Server-side verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number
): boolean {
  // Reject if timestamp is too old (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

### Webhook Delivery Service
```typescript
class WebhookDeliveryService {
  private queue: Queue;
  private maxRetries = 3;
  private retryDelays = [0, 60, 300, 900]; // seconds

  async sendWebhook(event: WebhookEvent) {
    const webhooks = await this.getActiveWebhooks(event.type);

    for (const webhook of webhooks) {
      await this.queue.add('webhook-delivery', {
        webhookId: webhook.id,
        event,
        attempt: 0
      });
    }
  }

  async deliverWebhook(job: WebhookJob) {
    const { webhookId, event, attempt } = job.data;

    try {
      const webhook = await this.getWebhook(webhookId);
      const payload = this.buildPayload(event);
      const signature = this.generateSignature(payload, webhook.secret);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Steppers-Signature': signature,
          'X-Steppers-Event': event.type,
          'X-Steppers-Delivery': event.id,
          'X-Steppers-Timestamp': Date.now().toString()
        },
        body: JSON.stringify(payload),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await this.logDelivery(webhookId, event.id, 'success');
    } catch (error) {
      await this.handleFailure(webhookId, event, attempt, error);
    }
  }

  private async handleFailure(
    webhookId: string,
    event: WebhookEvent,
    attempt: number,
    error: Error
  ) {
    await this.logDelivery(webhookId, event.id, 'failed', error.message);

    if (attempt < this.maxRetries) {
      const delay = this.retryDelays[attempt + 1];
      await this.queue.add(
        'webhook-delivery',
        { webhookId, event, attempt: attempt + 1 },
        { delay: delay * 1000 }
      );
    } else {
      // Circuit breaker: disable after 10 consecutive failures
      const failures = await this.getConsecutiveFailures(webhookId);
      if (failures >= 10) {
        await this.disableWebhook(webhookId);
        await this.notifyWebhookDisabled(webhookId);
      }
    }
  }
}
```

### Database Schema
```prisma
model Webhook {
  id           String   @id @default(cuid())
  organizerId  String
  url          String
  events       String[] // Array of event types
  secret       String
  isActive     Boolean  @default(true)
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organizer    User     @relation(fields: [organizerId], references: [id])
  deliveries   WebhookDelivery[]

  @@index([organizerId])
  @@index([isActive])
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  eventId     String
  eventType   String
  status      String   // success, failed, pending
  attempt     Int      @default(0)
  statusCode  Int?
  error       String?
  payload     Json
  createdAt   DateTime @default(now())

  webhook     Webhook  @relation(fields: [webhookId], references: [id])

  @@index([webhookId, createdAt])
  @@index([status])
}
```

## Implementation Details

### Phase 1: Core Webhook System (Day 1-2)
1. Create database schema for webhooks
2. Implement webhook registration API
3. Create webhook delivery service
4. Set up message queue (Bull/BullMQ)
5. Implement signature generation

### Phase 2: Delivery & Retry Logic (Day 3-4)
1. Implement retry mechanism with exponential backoff
2. Add circuit breaker logic
3. Create delivery logging system
4. Implement timeout handling
5. Add webhook health monitoring

### Phase 3: Management Interface (Day 5-6)
1. Create webhook management UI
2. Build delivery history view
3. Add test webhook functionality
4. Implement manual retry feature
5. Create webhook debugging tools

### Phase 4: Security & Documentation (Day 7-8)
1. Implement signature verification
2. Add replay attack prevention
3. Create webhook documentation
4. Add code examples for verification
5. Write integration guides

### File Structure
```
/lib/webhooks/
├── webhook.service.ts        # Webhook business logic
├── delivery.service.ts       # Delivery and retry logic
├── signature.service.ts      # Signature generation/verification
├── webhook.queue.ts          # Queue configuration
└── webhook.types.ts          # TypeScript types

/app/api/webhooks/
├── route.ts                  # List/create webhooks
├── [webhookId]/route.ts      # Get/update/delete webhook
├── [webhookId]/test/route.ts # Test webhook delivery
└── [webhookId]/logs/route.ts # Delivery logs

/app/dashboard/webhooks/
├── page.tsx                  # Webhook management
├── [webhookId]/page.tsx      # Webhook details
└── components/
    ├── WebhookForm.tsx
    ├── DeliveryLog.tsx
    └── TestWebhook.tsx
```

## Dependencies
- Prior: API-005 (API Authentication Keys)
- Related: API-008 (Developer Dashboard)
- Integrates: All event triggers (purchase, check-in, etc.)

## Testing Checklist

### Webhook Registration
- [ ] Create webhook with valid URL
- [ ] Reject invalid URLs (non-HTTPS, malformed)
- [ ] Support multiple webhooks per user
- [ ] Filter events correctly
- [ ] Generate secure secret keys

### Delivery System
- [ ] Successful delivery to working endpoint
- [ ] Retry failed deliveries with backoff
- [ ] Respect timeout limits
- [ ] Log all delivery attempts
- [ ] Circuit breaker activates after failures

### Security
- [ ] Signature verification works correctly
- [ ] Replay attacks are prevented
- [ ] Timestamps are validated
- [ ] HTTPS is enforced
- [ ] Secrets are stored securely

### Management
- [ ] UI displays all webhooks
- [ ] Test delivery sends sample payload
- [ ] Delivery history shows correct data
- [ ] Manual retry works
- [ ] Webhook can be disabled/enabled

## Performance Metrics
- Webhook delivery time: < 5 seconds (95th percentile)
- Queue processing rate: > 100 webhooks/second
- Retry delay accuracy: ±5 seconds
- Delivery success rate: > 95%

## Success Metrics
- Webhook adoption: > 30% of API users
- Average delivery success rate: > 98%
- Average delivery time: < 2 seconds
- Failed delivery resolution time: < 15 minutes
- Developer satisfaction: > 4.5/5

## Additional Resources
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Webhook Best Practices](https://www.svix.com/resources/guides/webhook-security-guide/)
- [HMAC Signature Verification](https://www.okta.com/identity-101/hmac/)

## Notes
- Consider using Svix or Hookdeck for managed webhook infrastructure
- Implement webhook replay functionality for debugging
- Add webhook testing tools (webhook.site integration)
- Consider rate limiting webhook deliveries per endpoint
- Plan for webhook versioning strategy