# API-006: Rate Limiting (API)

**Epic:** EPIC-013 - API & Developer Tools
**Story Points:** 3
**Priority:** High
**Status:** To Do

## User Story

**As a** platform operator
**I want** API-specific rate limiting with tiered quotas
**So that** I can prevent API abuse while supporting different usage levels

## Description

Implement a comprehensive rate limiting system specifically for API endpoints using Redis-based sliding window algorithm. The system should support tiered quotas (Free, Pro, Enterprise), provide clear rate limit headers, and offer quota management interfaces for administrators.

## Acceptance Criteria

### 1. Tiered Rate Limits
- [ ] **Free Tier:** 100 requests per hour
- [ ] **Pro Tier:** 1,000 requests per hour
- [ ] **Enterprise Tier:** 10,000 requests per hour
- [ ] **Admin Tier:** Unlimited (no rate limiting)
- [ ] Associate tier with API key
- [ ] Support tier upgrades/downgrades

### 2. Rate Limit Headers
- [ ] `X-RateLimit-Limit` - Total requests allowed in window
- [ ] `X-RateLimit-Remaining` - Remaining requests in current window
- [ ] `X-RateLimit-Reset` - Unix timestamp when limit resets
- [ ] `Retry-After` - Seconds until limit resets (when exceeded)
- [ ] Headers included in all API responses

### 3. Rate Limit Enforcement
- [ ] Return 429 status code when limit exceeded
- [ ] Include detailed error message with reset time
- [ ] Block requests until window resets
- [ ] Count both successful and failed requests
- [ ] Exclude certain endpoints from rate limiting (health checks)

### 4. Sliding Window Algorithm
- [ ] Use Redis for distributed rate limiting
- [ ] Implement sliding window counter
- [ ] Accurate rate limit calculation
- [ ] Support for multiple time windows (per second, minute, hour)
- [ ] Atomic operations to prevent race conditions

### 5. Quota Management Interface
- [ ] View current usage vs limit per API key
- [ ] Real-time usage tracking dashboard
- [ ] Historical usage charts
- [ ] Quota increase requests
- [ ] Temporary quota boosts
- [ ] Alert when approaching limit (80%, 90%)

### 6. Bypass & Exemptions
- [ ] Whitelist specific API keys (unlimited access)
- [ ] Exempt specific endpoints (e.g., /health)
- [ ] Temporary rate limit suspension
- [ ] Emergency quota increases
- [ ] IP-based exemptions for internal services

## Technical Requirements

### Rate Limit Configuration
```typescript
// lib/rate-limit/rate-limit.config.ts
export const RATE_LIMIT_TIERS = {
  free: {
    requests: 100,
    window: 3600, // 1 hour in seconds
    burstLimit: 20, // Max requests in 1 minute
  },
  pro: {
    requests: 1000,
    window: 3600,
    burstLimit: 100,
  },
  enterprise: {
    requests: 10000,
    window: 3600,
    burstLimit: 500,
  },
  admin: {
    requests: null, // unlimited
    window: 3600,
    burstLimit: null,
  },
};

export const EXEMPT_ENDPOINTS = [
  '/api/health',
  '/api/status',
  '/api/metrics',
];
```

### Redis-Based Sliding Window
```typescript
// lib/rate-limit/sliding-window.service.ts
import { Redis } from 'ioredis';

export class SlidingWindowRateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async checkLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    current: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const key = `rate_limit:${identifier}`;

    try {
      // Use Redis transaction for atomic operations
      const pipeline = this.redis.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}:${Math.random()}`);

      // Set expiration
      pipeline.expire(key, windowSeconds);

      const results = await pipeline.exec();
      const current = results[1][1] as number;

      const allowed = current < limit;
      const remaining = Math.max(0, limit - current - 1);
      const resetAt = Math.ceil((now + windowSeconds * 1000) / 1000);

      return {
        allowed,
        remaining,
        resetAt,
        current,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: limit,
        resetAt: Math.ceil((now + windowSeconds * 1000) / 1000),
        current: 0,
      };
    }
  }

  async getUsage(identifier: string): Promise<number> {
    const key = `rate_limit:${identifier}`;
    return await this.redis.zcard(key);
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    await this.redis.del(key);
  }
}
```

### Rate Limit Middleware
```typescript
// middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { SlidingWindowRateLimiter } from '@/lib/rate-limit/sliding-window.service';
import { RATE_LIMIT_TIERS, EXEMPT_ENDPOINTS } from '@/lib/rate-limit/rate-limit.config';

export async function rateLimitMiddleware(
  request: NextRequest,
  apiKey: ApiKey
): Promise<NextResponse | null> {
  const limiter = new SlidingWindowRateLimiter();
  const pathname = new URL(request.url).pathname;

  // Check if endpoint is exempt
  if (EXEMPT_ENDPOINTS.some(exempt => pathname.startsWith(exempt))) {
    return null; // Continue without rate limiting
  }

  // Get rate limit tier
  const tier = apiKey.tier || 'free';
  const tierConfig = RATE_LIMIT_TIERS[tier];

  // Skip if admin (unlimited)
  if (tierConfig.requests === null) {
    return null;
  }

  // Check rate limit
  const identifier = `api_key:${apiKey.id}`;
  const result = await limiter.checkLimit(
    identifier,
    tierConfig.requests,
    tierConfig.window
  );

  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', tierConfig.requests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toString());

  // If limit exceeded, return 429
  if (!result.allowed) {
    const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);
    headers.set('Retry-After', retryAfter.toString());

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `You have exceeded the ${tierConfig.requests} requests per hour limit.`,
        retryAfter,
        resetAt: result.resetAt,
        limit: tierConfig.requests,
        current: result.current,
      },
      { status: 429, headers }
    );
  }

  // Continue request with rate limit headers
  request.headers.set('x-rate-limit-headers', JSON.stringify(Object.fromEntries(headers)));
  return null;
}
```

### Rate Limit Response Handler
```typescript
// lib/rate-limit/response-handler.ts
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetAt.toString());
  return response;
}
```

### Database Schema Extension
```prisma
// Add to ApiKey model
model ApiKey {
  // ... existing fields ...
  tier          String   @default("free") // free, pro, enterprise, admin
  rateLimit     Int      // Custom rate limit (overrides tier)
  isExempt      Boolean  @default(false) // Bypass rate limiting
}

model RateLimitLog {
  id            String   @id @default(cuid())
  apiKeyId      String
  endpoint      String
  wasBlocked    Boolean
  requestCount  Int
  limit         Int
  timestamp     DateTime @default(now())

  apiKey        ApiKey   @relation(fields: [apiKeyId], references: [id])

  @@index([apiKeyId, timestamp])
  @@index([timestamp])
}
```

### Usage Dashboard Component
```typescript
// components/rate-limit/UsageChart.tsx
export function RateLimitUsageChart({ apiKeyId }: { apiKeyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rate-limit-usage', apiKeyId],
    queryFn: () => fetch(`/api/api-keys/${apiKeyId}/rate-limit`).then(r => r.json()),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) return <Spinner />;

  const { current, limit, remaining, resetAt, tier } = data;
  const percentage = (current / limit) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rate Limit Usage</h3>
          <p className="text-sm text-gray-500">
            {tier.toUpperCase()} tier: {limit} requests/hour
          </p>
        </div>
        <Badge variant={percentage > 90 ? 'destructive' : 'default'}>
          {current} / {limit}
        </Badge>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Current</p>
          <p className="text-xl font-bold">{current}</p>
        </div>
        <div>
          <p className="text-gray-500">Remaining</p>
          <p className="text-xl font-bold">{remaining}</p>
        </div>
        <div>
          <p className="text-gray-500">Resets In</p>
          <p className="text-xl font-bold">{formatTimeUntil(resetAt)}</p>
        </div>
      </div>

      {percentage > 80 && (
        <Alert variant={percentage > 90 ? 'destructive' : 'warning'}>
          <AlertTitle>Approaching Rate Limit</AlertTitle>
          <AlertDescription>
            You've used {percentage.toFixed(0)}% of your hourly quota.
            Consider upgrading to a higher tier for more requests.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### Quota Increase Request
```typescript
// app/api/api-keys/[keyId]/quota-increase/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reason, requestedLimit, duration } = await request.json();

  // Create quota increase request
  const quotaRequest = await prisma.quotaIncreaseRequest.create({
    data: {
      apiKeyId: params.keyId,
      requestedLimit,
      duration,
      reason,
      status: 'pending',
      requestedBy: session.user.id,
    },
  });

  // Notify admins
  await notifyAdmins('quota-increase-request', {
    apiKeyId: params.keyId,
    requestId: quotaRequest.id,
    user: session.user.email,
  });

  return NextResponse.json(quotaRequest);
}
```

## Implementation Details

### Phase 1: Redis & Core Logic (Day 1)
1. Set up Redis connection
2. Implement sliding window algorithm
3. Create rate limit service
4. Test rate limit calculations
5. Handle edge cases

### Phase 2: Middleware & Headers (Day 2)
1. Build rate limit middleware
2. Add rate limit headers
3. Implement 429 error responses
4. Test with different tiers
5. Add exemption logic

### Phase 3: Dashboard & Monitoring (Day 3)
1. Create usage dashboard
2. Build real-time usage charts
3. Add quota increase requests
4. Implement alerts
5. Test all UI components

### File Structure
```
/lib/rate-limit/
├── rate-limit.config.ts
├── sliding-window.service.ts
├── response-handler.ts
└── types.ts

/middleware/
└── rate-limit.ts

/app/api/api-keys/
├── [keyId]/
│   ├── rate-limit/route.ts
│   ├── quota-increase/route.ts
│   └── reset-limit/route.ts

/app/dashboard/api-keys/
├── [keyId]/
│   ├── components/
│   │   ├── UsageChart.tsx
│   │   ├── QuotaIncreaseForm.tsx
│   │   └── RateLimitSettings.tsx
```

## Dependencies
- Prior: API-005 (API Authentication Keys)
- Related: API-007 (API Monitoring & Analytics)
- Infrastructure: Redis

## Testing Checklist

### Rate Limiting Logic
- [ ] Sliding window algorithm works correctly
- [ ] Limits are enforced accurately
- [ ] Headers are correct
- [ ] 429 responses work
- [ ] Exemptions work correctly

### Tiers
- [ ] Free tier limits work (100/hr)
- [ ] Pro tier limits work (1000/hr)
- [ ] Enterprise tier limits work (10000/hr)
- [ ] Admin tier is unlimited
- [ ] Tier upgrades apply immediately

### Performance
- [ ] Redis operations are fast (< 10ms)
- [ ] No race conditions in counting
- [ ] System handles high concurrency
- [ ] Fail-open when Redis is down

### Monitoring
- [ ] Usage dashboard displays correctly
- [ ] Real-time updates work
- [ ] Alerts trigger at thresholds
- [ ] Historical data is accurate

## Performance Metrics
- Rate limit check time: < 10ms
- Redis operation latency: < 5ms
- Header addition overhead: < 1ms

## Success Metrics
- API abuse incidents: < 1 per month
- False positive rate: < 0.1%
- 429 error rate: < 2% of all requests
- Average tier: Pro or higher

## Additional Resources
- [Redis Rate Limiting](https://redis.io/docs/manual/patterns/rate-limiter/)
- [Sliding Window Algorithm](https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

## Notes
- Consider using Redis Cluster for high availability
- Implement burst protection (max requests per minute)
- Add support for multiple time windows (per second, minute, hour, day)
- Consider tiered pricing model based on API usage
- Monitor Redis memory usage and implement key expiration