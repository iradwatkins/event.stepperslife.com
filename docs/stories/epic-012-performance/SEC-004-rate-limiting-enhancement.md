# SEC-004: Rate Limiting Enhancement

**Epic:** EPIC-012 Performance & Security
**Story Points:** 3
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** platform administrator
**I want** enhanced rate limiting on all API endpoints
**So that** we prevent abuse, DDoS attacks, and ensure fair resource usage (100 req/min standard, 1000 req/min premium)

---

## Acceptance Criteria

### Functional Requirements
- [ ] Per-user rate limiting based on authentication
- [ ] IP-based rate limiting for anonymous users
- [ ] Tiered rate limits (standard, premium, admin)
- [ ] Endpoint-specific rate limit configurations
- [ ] Rate limit bypass for trusted IPs/services
- [ ] Custom rate limit headers in responses
- [ ] Graceful error messages when limited
- [ ] Rate limit reset information provided
- [ ] Distributed rate limiting across instances
- [ ] Rate limit monitoring and analytics

### Rate Limit Tiers
- [ ] **Anonymous**: 20 requests/minute
- [ ] **Standard User**: 100 requests/minute
- [ ] **Premium User**: 1000 requests/minute
- [ ] **Admin**: Unlimited (monitored)
- [ ] **Trusted Services**: Unlimited

### Technical Requirements
- [ ] Redis-based rate limiter with sliding window
- [ ] Token bucket algorithm for burst handling
- [ ] Configurable limits per endpoint
- [ ] Rate limit state synchronized across instances
- [ ] Failed authentication attempts tracking
- [ ] Audit logging of rate limit violations
- [ ] API to check current rate limit status

---

## Technical Specifications

### Rate Limiter Configuration

```typescript
// lib/rate-limit/config.ts
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export const rateLimitConfigs = {
  // Authentication endpoints - strict
  'POST:/api/auth/login': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    skipSuccessfulRequests: false,
  },
  'POST:/api/auth/register': {
    windowMs: 60 * 1000,
    maxRequests: 3,
  },
  'POST:/api/auth/reset-password': {
    windowMs: 60 * 1000,
    maxRequests: 3,
  },

  // Payment endpoints - moderate
  'POST:/api/events/*/purchase': {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  'POST:/api/webhooks/square': {
    windowMs: 60 * 1000,
    maxRequests: 1000, // High limit for webhook provider
  },

  // Public endpoints - generous
  'GET:/api/events/public': {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
  'GET:/api/events/search': {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },

  // Admin endpoints - monitored but unlimited
  'POST:/api/admin/*': {
    windowMs: 60 * 1000,
    maxRequests: 10000,
  },

  // Default fallback
  default: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
} as const;

export function getRateLimitConfig(
  method: string,
  path: string
): RateLimitConfig {
  const key = `${method}:${path}`;

  // Check exact match
  if (key in rateLimitConfigs) {
    return rateLimitConfigs[key as keyof typeof rateLimitConfigs] as RateLimitConfig;
  }

  // Check wildcard matches
  for (const [pattern, config] of Object.entries(rateLimitConfigs)) {
    if (pattern !== 'default' && matchesPattern(key, pattern)) {
      return config as RateLimitConfig;
    }
  }

  return rateLimitConfigs.default as RateLimitConfig;
}

function matchesPattern(key: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '[^/]+').replace(/\//g, '\\/') + '$'
  );
  return regex.test(key);
}
```

### Redis Rate Limiter Implementation

```typescript
// lib/rate-limit/redis-limiter.ts
import { RedisClient } from '@/lib/cache/redis.config';
import { Logger } from '@/lib/monitoring/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class RedisRateLimiter {
  private redis = RedisClient.getInstance();
  private logger = new Logger('RedisRateLimiter');

  async checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use sliding window algorithm
      const multi = this.redis.multi();

      // Remove old entries
      multi.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      multi.zcard(key);

      // Add current request
      multi.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry
      multi.expire(key, Math.ceil(windowMs / 1000));

      const results = await multi.exec();
      const currentCount = (results?.[1]?.[1] as number) || 0;

      const allowed = currentCount < maxRequests;
      const remaining = Math.max(0, maxRequests - currentCount - 1);
      const resetAt = new Date(now + windowMs);

      // Calculate retry-after if exceeded
      let retryAfter: number | undefined;
      if (!allowed) {
        const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        if (oldestEntry && oldestEntry[1]) {
          const oldestTimestamp = parseInt(oldestEntry[1]);
          retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
        }
      }

      // Log rate limit violations
      if (!allowed) {
        this.logger.warn('Rate limit exceeded', {
          key,
          currentCount,
          maxRequests,
          windowMs,
        });
      }

      return {
        allowed,
        remaining,
        resetAt,
        retryAfter,
      };
    } catch (error) {
      this.logger.error('Rate limit check failed', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: 999,
        resetAt: new Date(Date.now() + 60000),
      };
    }
  }

  async resetLimit(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.info('Rate limit reset', { key });
    } catch (error) {
      this.logger.error('Failed to reset rate limit', error);
    }
  }

  async getStatus(key: string): Promise<{ count: number; resetAt?: Date }> {
    try {
      const count = await this.redis.zcard(key);
      const ttl = await this.redis.ttl(key);

      return {
        count,
        resetAt: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit status', error);
      return { count: 0 };
    }
  }
}
```

### Rate Limit Middleware

```typescript
// lib/middleware/rate-limit.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RedisRateLimiter } from '@/lib/rate-limit/redis-limiter';
import { getRateLimitConfig } from '@/lib/rate-limit/config';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { AuditEventType, AuditSeverity } from '@/lib/audit/types';

export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const session = await getServerSession();
  const limiter = new RedisRateLimiter();
  const auditLogger = new AuditLogger();

  // Generate rate limit key
  const rateLimitKey = await generateRateLimitKey(request, session);

  // Get rate limit configuration
  const config = getRateLimitConfig(
    request.method,
    request.nextUrl.pathname
  );

  // Apply user tier multiplier
  const maxRequests = applyTierMultiplier(
    config.maxRequests,
    session?.user?.tier || 'standard'
  );

  // Check rate limit
  const result = await limiter.checkLimit(
    rateLimitKey,
    maxRequests,
    config.windowMs
  );

  // Set rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', maxRequests.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

  if (!result.allowed) {
    if (result.retryAfter) {
      headers.set('Retry-After', result.retryAfter.toString());
    }

    // Audit log rate limit violation
    await auditLogger.log({
      eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      severity: AuditSeverity.WARNING,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      action: `Rate limit exceeded: ${request.method} ${request.nextUrl.pathname}`,
      outcome: 'failure',
      method: request.method,
      path: request.nextUrl.pathname,
      correlationId: crypto.randomUUID(),
      details: {
        rateLimitKey,
        maxRequests,
        windowMs: config.windowMs,
      },
    });

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Allow request - add headers to response later
  return null; // null means continue to handler
}

async function generateRateLimitKey(
  request: NextRequest,
  session: any
): Promise<string> {
  const method = request.method;
  const path = request.nextUrl.pathname;

  // Use user ID if authenticated
  if (session?.user?.id) {
    return `ratelimit:user:${session.user.id}:${method}:${path}`;
  }

  // Use IP address for anonymous users
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  return `ratelimit:ip:${ip}:${method}:${path}`;
}

function applyTierMultiplier(baseLimit: number, tier: string): number {
  const multipliers = {
    anonymous: 0.2,   // 20% of base
    standard: 1.0,    // 100% of base
    premium: 10.0,    // 1000% of base
    admin: 100.0,     // Effectively unlimited
  };

  return Math.floor(baseLimit * (multipliers[tier as keyof typeof multipliers] || 1.0));
}

// Bypass for trusted IPs/services
const TRUSTED_IPS = (process.env.TRUSTED_IPS || '').split(',').filter(Boolean);

function isTrustedIP(ip: string): boolean {
  return TRUSTED_IPS.includes(ip);
}
```

### Token Bucket Algorithm (Alternative)

```typescript
// lib/rate-limit/token-bucket.ts
import { RedisClient } from '@/lib/cache/redis.config';

export class TokenBucket {
  private redis = RedisClient.getInstance();

  async consume(
    key: string,
    capacity: number,
    refillRate: number,
    refillInterval: number
  ): Promise<boolean> {
    const now = Date.now();

    // Get current state
    const state = await this.redis.hgetall(key);
    let tokens = parseFloat(state.tokens || capacity.toString());
    let lastRefill = parseInt(state.lastRefill || now.toString());

    // Calculate refill
    const timePassed = now - lastRefill;
    const intervalsElapsed = Math.floor(timePassed / refillInterval);
    tokens = Math.min(capacity, tokens + intervalsElapsed * refillRate);

    // Try to consume
    if (tokens >= 1) {
      tokens -= 1;

      await this.redis
        .multi()
        .hset(key, 'tokens', tokens.toString())
        .hset(key, 'lastRefill', now.toString())
        .expire(key, Math.ceil((refillInterval * capacity) / 1000))
        .exec();

      return true;
    }

    return false;
  }
}
```

### Rate Limit Status API

```typescript
// app/api/rate-limit/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RedisRateLimiter } from '@/lib/rate-limit/redis-limiter';

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limiter = new RedisRateLimiter();
  const endpoints = [
    'GET:/api/events',
    'POST:/api/events/*/purchase',
    'GET:/api/events/search',
  ];

  const statuses = await Promise.all(
    endpoints.map(async (endpoint) => {
      const key = `ratelimit:user:${session.user.id}:${endpoint}`;
      const status = await limiter.getStatus(key);
      return { endpoint, ...status };
    })
  );

  return NextResponse.json({
    userId: session.user.id,
    tier: session.user.tier || 'standard',
    endpoints: statuses,
  });
}
```

---

## Implementation Details

### Failed Login Attempt Tracking

```typescript
// lib/rate-limit/failed-login-tracker.ts
import { RedisRateLimiter } from './redis-limiter';

export class FailedLoginTracker {
  private limiter = new RedisRateLimiter();

  async trackFailedAttempt(email: string, ip: string): Promise<void> {
    const emailKey = `failed-login:email:${email}`;
    const ipKey = `failed-login:ip:${ip}`;

    await Promise.all([
      this.limiter.checkLimit(emailKey, 5, 15 * 60 * 1000), // 5 attempts per 15 min
      this.limiter.checkLimit(ipKey, 20, 15 * 60 * 1000), // 20 attempts per 15 min
    ]);
  }

  async isBlocked(email: string, ip: string): Promise<boolean> {
    const emailKey = `failed-login:email:${email}`;
    const ipKey = `failed-login:ip:${ip}`;

    const [emailStatus, ipStatus] = await Promise.all([
      this.limiter.getStatus(emailKey),
      this.limiter.getStatus(ipKey),
    ]);

    return emailStatus.count >= 5 || ipStatus.count >= 20;
  }

  async resetAttempts(email: string, ip: string): Promise<void> {
    const emailKey = `failed-login:email:${email}`;
    const ipKey = `failed-login:ip:${ip}`;

    await Promise.all([
      this.limiter.resetLimit(emailKey),
      this.limiter.resetLimit(ipKey),
    ]);
  }
}
```

### Integration with Next.js Middleware

```typescript
// middleware.ts
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit.middleware';

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Continue to next middleware or handler
  return NextResponse.next();
}
```

---

## Testing Requirements

### Rate Limit Tests

```typescript
describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RedisRateLimiter();

    for (let i = 0; i < 5; i++) {
      const result = await limiter.checkLimit('test-key', 10, 60000);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests exceeding limit', async () => {
    const limiter = new RedisRateLimiter();

    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      await limiter.checkLimit('test-key', 10, 60000);
    }

    // Next request should be blocked
    const result = await limiter.checkLimit('test-key', 10, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset after window expires', async () => {
    const limiter = new RedisRateLimiter();
    const windowMs = 1000; // 1 second

    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('test-key', 5, windowMs);
    }

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should allow again
    const result = await limiter.checkLimit('test-key', 5, windowMs);
    expect(result.allowed).toBe(true);
  });

  it('should apply tier multipliers correctly', async () => {
    const baseLimit = 100;

    expect(applyTierMultiplier(baseLimit, 'standard')).toBe(100);
    expect(applyTierMultiplier(baseLimit, 'premium')).toBe(1000);
    expect(applyTierMultiplier(baseLimit, 'anonymous')).toBe(20);
  });
});
```

---

## Infrastructure Requirements

### Redis Configuration
- Use existing Redis cluster from PERF-002
- Dedicated keyspace for rate limiting
- TTL management for automatic cleanup

### Environment Variables
```env
RATE_LIMIT_ENABLED=true
TRUSTED_IPS=127.0.0.1,10.0.0.0/8
RATE_LIMIT_BYPASS_TOKEN=<secure-token>
```

---

## Monitoring and Alerting

### Key Metrics
- Rate limit violations per endpoint
- Most rate-limited users/IPs
- Average remaining quota
- Failed login attempts

### Alerts
- Critical: >100 rate limit violations/minute (DDoS)
- Critical: >50 failed login attempts from single IP
- Warning: Premium user hitting rate limits
- Info: Daily rate limit summary

---

## Dependencies
- ioredis (from PERF-002)
- Redis cluster

## Related Stories
- PERF-002: Redis Caching
- SEC-001: Security Hardening
- SEC-002: Security Audit Logging

---

**Notes:**
- Fail open if Redis is unavailable
- Monitor rate limiter performance impact (<5ms)
- Consider implementing DDoS protection at CDN level
- Test rate limiting under load