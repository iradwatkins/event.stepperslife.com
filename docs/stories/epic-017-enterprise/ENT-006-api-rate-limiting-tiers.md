# ENT-006: API Rate Limiting & Usage Tiers

**Epic:** EPIC-017 Enterprise Features
**Story Points:** 5
**Priority:** E3 (Expansion)
**Status:** Not Started

---

## User Story

**As an** platform administrator
**I want** tiered API access with rate limiting per organization
**So that** I can ensure fair usage, prevent abuse, and monetize API access appropriately

---

## Acceptance Criteria

### 1. Tiered API Access
- [ ] Starter tier (100 requests/minute)
- [ ] Pro tier (500 requests/minute)
- [ ] Enterprise tier (2,000 requests/minute)
- [ ] Unlimited tier (no rate limits)
- [ ] Custom tier configuration per organization
- [ ] Burst allowance (temporary exceeding of limit)
- [ ] Tier upgrade/downgrade workflow
- [ ] Tier pricing and billing integration

### 2. Rate Limiting per Organization
- [ ] Redis-based rate limiting
- [ ] Per-API-key rate limiting
- [ ] Per-endpoint rate limiting
- [ ] Per-method rate limiting (GET, POST, etc.)
- [ ] Sliding window rate limiting
- [ ] Token bucket algorithm implementation
- [ ] Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] Rate limit exceeded error responses (429)

### 3. API Key Management
- [ ] Generate API keys per organization
- [ ] Multiple API keys per organization
- [ ] Key naming and description
- [ ] Key scopes and permissions
- [ ] Key expiration dates
- [ ] Key rotation capability
- [ ] Revoke API keys
- [ ] Key usage statistics

### 4. Usage Analytics & Billing Integration
- [ ] Real-time usage tracking
- [ ] Daily/weekly/monthly usage reports
- [ ] Usage by endpoint analytics
- [ ] Usage by API key analytics
- [ ] Cost calculation based on usage
- [ ] Overage billing for excess usage
- [ ] Usage alerts and notifications
- [ ] Export usage data for billing

### 5. Webhook Delivery Guarantees
- [ ] Webhook retry logic (exponential backoff)
- [ ] Webhook delivery confirmation
- [ ] Failed webhook logging
- [ ] Webhook replay functionality
- [ ] Webhook signature verification
- [ ] Webhook event filtering
- [ ] Webhook timeout configuration
- [ ] Webhook delivery SLA tracking

### 6. API Documentation Portal
- [ ] Organization-specific API documentation
- [ ] Interactive API explorer (Swagger/OpenAPI)
- [ ] Code examples in multiple languages
- [ ] Authentication guide
- [ ] Rate limit documentation
- [ ] Webhook documentation
- [ ] Changelog and version history
- [ ] API status page

### 7. Testing & Quality
- [ ] Unit tests for rate limiting logic (>85% coverage)
- [ ] Integration tests for API key management
- [ ] Load tests to verify rate limits
- [ ] Security audit for API security
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] API versioning strategy documented
- [ ] Backward compatibility plan

---

## Technical Specifications

### Database Schema
```prisma
// prisma/schema.prisma

model APITier {
  id                String   @id @default(cuid())
  name              String   @unique
  slug              String   @unique
  description       String?

  // Rate Limits
  requestsPerMinute Int
  requestsPerHour   Int
  requestsPerDay    Int
  burstAllowance    Int      @default(0)

  // Features
  webhookDeliveryGuarantee Boolean @default(false)
  prioritySupport   Boolean  @default(false)
  customEndpoints   Boolean  @default(false)

  // Pricing
  monthlyPrice      Float    @default(0)
  overagePricePerRequest Float @default(0)

  // Status
  active            Boolean  @default(true)

  // Relations
  organizations     Organization[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([active])
}

model APIKey {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Key details
  name              String
  key               String   @unique // Hashed API key
  keyPrefix         String   // First 8 chars for identification
  scopes            Json     // Array of allowed permissions
  description       String?

  // Rate limiting
  customRateLimit   Int?     // Override org tier if needed
  burstAllowance    Int?

  // Status
  active            Boolean  @default(true)
  expiresAt         DateTime?
  lastUsedAt        DateTime?

  // Relations
  usage             APIUsage[]
  rateLimitLogs     RateLimitLog[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, active])
  @@index([key])
  @@index([keyPrefix])
}

model APIUsage {
  id                String   @id @default(cuid())
  apiKeyId          String
  apiKey            APIKey   @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Usage details
  date              DateTime
  endpoint          String
  method            String   // GET, POST, PUT, DELETE
  statusCode        Int
  responseTime      Int      // milliseconds
  requestCount      Int      @default(1)

  // Metadata
  ipAddress         String?
  userAgent         String?
  metadata          Json?

  createdAt         DateTime @default(now())

  @@unique([apiKeyId, date, endpoint, method])
  @@index([organizationId, date])
  @@index([apiKeyId, date])
  @@index([endpoint, date])
}

model RateLimitLog {
  id                String   @id @default(cuid())
  apiKeyId          String?
  apiKey            APIKey?  @relation(fields: [apiKeyId], references: [id])
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  // Rate limit details
  endpoint          String
  method            String
  limitType         String   // 'minute', 'hour', 'day'
  limitValue        Int
  currentUsage      Int
  exceeded          Boolean  @default(false)

  // Request details
  ipAddress         String?
  userAgent         String?

  metadata          Json?
  createdAt         DateTime @default(now())

  @@index([organizationId, exceeded, createdAt])
  @@index([apiKeyId, createdAt])
}

model WebhookEndpoint {
  id                String   @id @default(cuid())
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Endpoint details
  url               String
  events            Json     // Array of event types to subscribe to
  secret            String   // For signature verification

  // Configuration
  enabled           Boolean  @default(true)
  retryEnabled      Boolean  @default(true)
  maxRetries        Int      @default(3)
  timeoutSeconds    Int      @default(30)

  // Status
  lastSuccessAt     DateTime?
  lastFailureAt     DateTime?
  consecutiveFailures Int    @default(0)

  // Relations
  deliveries        WebhookDelivery[]

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([organizationId, enabled])
}

model WebhookDelivery {
  id                String   @id @default(cuid())
  webhookEndpointId String
  webhookEndpoint   WebhookEndpoint @relation(fields: [webhookEndpointId], references: [id], onDelete: Cascade)

  // Event details
  event             String   // 'order.created', 'ticket.scanned', etc.
  payload           Json
  attemptNumber     Int      @default(1)

  // Delivery status
  status            String   // 'pending', 'success', 'failed'
  statusCode        Int?
  responseBody      String?
  errorMessage      String?
  deliveredAt       DateTime?

  // Timing
  scheduledFor      DateTime @default(now())
  nextRetryAt       DateTime?

  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([webhookEndpointId, status])
  @@index([status, nextRetryAt])
}

// Update Organization model
model Organization {
  // ... existing fields
  apiTierId         String?
  apiTier           APITier? @relation(fields: [apiTierId], references: [id])
  apiKeys           APIKey[]
  apiUsage          APIUsage[]
  rateLimitLogs     RateLimitLog[]
  webhookEndpoints  WebhookEndpoint[]
  // ... rest of fields
}
```

### Rate Limiting Service
```typescript
// lib/services/rate-limit.service.ts
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis(process.env.REDIS_URL!);
const prisma = new PrismaClient();

export class RateLimitService {
  // Check rate limit using sliding window
  async checkRateLimit(
    apiKeyId: string,
    endpoint: string,
    method: string
  ): Promise<RateLimitResult> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      include: {
        organization: {
          include: { apiTier: true },
        },
      },
    });

    if (!apiKey || !apiKey.active) {
      throw new Error('Invalid or inactive API key');
    }

    const tier = apiKey.organization.apiTier;
    if (!tier) {
      throw new Error('No API tier assigned to organization');
    }

    const limit = apiKey.customRateLimit || tier.requestsPerMinute;
    const burstAllowance = apiKey.burstAllowance || tier.burstAllowance;

    // Redis key for sliding window
    const key = `ratelimit:${apiKeyId}:${endpoint}:${method}`;
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute in milliseconds

    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, now - windowSize);

    // Count requests in current window
    const currentUsage = await redis.zcard(key);

    const allowed = currentUsage < limit + burstAllowance;

    if (allowed) {
      // Add current request to window
      await redis.zadd(key, now, `${now}:${Math.random()}`);
      await redis.expire(key, 60); // Expire key after 1 minute
    } else {
      // Log rate limit exceeded
      await this.logRateLimitExceeded(
        apiKeyId,
        apiKey.organizationId,
        endpoint,
        method,
        limit,
        currentUsage
      );
    }

    const remaining = Math.max(0, limit - currentUsage);
    const resetAt = new Date(now + windowSize);

    return {
      allowed,
      limit,
      remaining,
      resetAt,
      retryAfter: allowed ? 0 : Math.ceil((currentUsage - limit) * (windowSize / limit)),
    };
  }

  // Track API usage
  async trackAPIUsage(
    apiKeyId: string,
    organizationId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Start of day

    await prisma.apiUsage.upsert({
      where: {
        apiKeyId_date_endpoint_method: {
          apiKeyId,
          date,
          endpoint,
          method,
        },
      },
      update: {
        requestCount: { increment: 1 },
        responseTime: responseTime, // Could calculate average
        statusCode,
      },
      create: {
        apiKeyId,
        organizationId,
        date,
        endpoint,
        method,
        statusCode,
        responseTime,
        requestCount: 1,
      },
    });
  }

  // Get usage statistics
  async getUsageStatistics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageStatistics> {
    const usage = await prisma.apiUsage.findMany({
      where: {
        organizationId,
        date: { gte: startDate, lte: endDate },
      },
      include: { apiKey: true },
    });

    const totalRequests = usage.reduce((sum, u) => sum + u.requestCount, 0);
    const avgResponseTime =
      usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length;

    const byEndpoint = usage.reduce((acc, u) => {
      const key = `${u.method} ${u.endpoint}`;
      if (!acc[key]) {
        acc[key] = { count: 0, avgResponseTime: 0 };
      }
      acc[key].count += u.requestCount;
      acc[key].avgResponseTime += u.responseTime;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRequests,
      avgResponseTime,
      byEndpoint,
      usageByDay: usage.map((u) => ({
        date: u.date,
        requests: u.requestCount,
      })),
    };
  }

  // Log rate limit exceeded
  private async logRateLimitExceeded(
    apiKeyId: string,
    organizationId: string,
    endpoint: string,
    method: string,
    limitValue: number,
    currentUsage: number
  ): Promise<void> {
    await prisma.rateLimitLog.create({
      data: {
        apiKeyId,
        organizationId,
        endpoint,
        method,
        limitType: 'minute',
        limitValue,
        currentUsage,
        exceeded: true,
      },
    });
  }
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter: number;
}

interface UsageStatistics {
  totalRequests: number;
  avgResponseTime: number;
  byEndpoint: Record<string, any>;
  usageByDay: Array<{ date: Date; requests: number }>;
}
```

### Webhook Service
```typescript
// lib/services/webhook.service.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

export class WebhookService {
  // Send webhook with retry logic
  async sendWebhook(
    organizationId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        organizationId,
        enabled: true,
        events: { path: '$', array_contains: event },
      },
    });

    for (const endpoint of endpoints) {
      await this.deliverWebhook(endpoint.id, event, payload);
    }
  }

  // Deliver webhook to endpoint
  private async deliverWebhook(
    webhookEndpointId: string,
    event: string,
    payload: any
  ): Promise<void> {
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: webhookEndpointId },
    });

    if (!endpoint) return;

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookEndpointId,
        event,
        payload,
        status: 'pending',
      },
    });

    try {
      const signature = this.generateSignature(payload, endpoint.secret);

      const response = await axios.post(endpoint.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        timeout: endpoint.timeoutSeconds * 1000,
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'success',
          statusCode: response.status,
          responseBody: JSON.stringify(response.data),
          deliveredAt: new Date(),
        },
      });

      await prisma.webhookEndpoint.update({
        where: { id: webhookEndpointId },
        data: {
          lastSuccessAt: new Date(),
          consecutiveFailures: 0,
        },
      });
    } catch (error) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          statusCode: error.response?.status,
        },
      });

      await prisma.webhookEndpoint.update({
        where: { id: webhookEndpointId },
        data: {
          lastFailureAt: new Date(),
          consecutiveFailures: { increment: 1 },
        },
      });

      // Schedule retry if enabled
      if (endpoint.retryEnabled && delivery.attemptNumber < endpoint.maxRetries) {
        await this.scheduleRetry(delivery.id, delivery.attemptNumber + 1);
      }
    }
  }

  // Schedule webhook retry with exponential backoff
  private async scheduleRetry(deliveryId: string, attemptNumber: number): Promise<void> {
    const backoffSeconds = Math.pow(2, attemptNumber) * 60; // 2, 4, 8 minutes
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attemptNumber,
        nextRetryAt,
        status: 'pending',
      },
    });
  }

  // Generate webhook signature
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
}
```

### API Middleware
```typescript
// middleware/rate-limit.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { RateLimitService } from '@/lib/services/rate-limit.service';

const rateLimitService = new RateLimitService();

export async function rateLimitMiddleware(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key required' },
      { status: 401 }
    );
  }

  const endpoint = req.nextUrl.pathname;
  const method = req.method;

  try {
    const result = await rateLimitService.checkRateLimit(apiKey, endpoint, method);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: result.limit,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': result.retryAfter.toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Rate limit check failed' },
      { status: 500 }
    );
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
describe('RateLimitService', () => {
  it('should allow requests within rate limit', async () => {
    const result = await rateLimitService.checkRateLimit(apiKeyId, '/api/events', 'GET');
    expect(result.allowed).toBe(true);
  });

  it('should block requests exceeding rate limit', async () => {
    // Make requests up to limit
    for (let i = 0; i < 100; i++) {
      await rateLimitService.checkRateLimit(apiKeyId, '/api/events', 'GET');
    }
    const result = await rateLimitService.checkRateLimit(apiKeyId, '/api/events', 'GET');
    expect(result.allowed).toBe(false);
  });

  it('should track API usage correctly', async () => {
    await rateLimitService.trackAPIUsage(apiKeyId, orgId, '/api/events', 'GET', 200, 150);
    const stats = await rateLimitService.getUsageStatistics(orgId, startDate, endDate);
    expect(stats.totalRequests).toBeGreaterThan(0);
  });
});

describe('WebhookService', () => {
  it('should send webhook to all subscribed endpoints', async () => {
    await webhookService.sendWebhook(orgId, 'order.created', { orderId: '123' });
    // Verify delivery records created
  });

  it('should retry failed webhooks with exponential backoff', async () => {
    // Simulate failed delivery
    // Verify retry scheduled
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Rate limiting functional
- [ ] API key management operational
- [ ] Usage tracking and analytics complete
- [ ] Webhook delivery system working
- [ ] API documentation portal live
- [ ] Unit tests passing (>85% coverage)
- [ ] Load tests completed
- [ ] Security audit passed
- [ ] Documentation complete

---

## Dependencies

- API-001: Public API foundation (prerequisite)
- ENT-002: Organization management (prerequisite)
- BILL-001: Billing system (prerequisite)

---

## Estimated Timeline

**Total Duration:** 4-5 weeks
**Story Points:** 5