# PERF-002: Redis Caching Implementation

**Epic:** EPIC-012 Performance & Security
**Story Points:** 8
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** system architect
**I want** Redis caching implemented across the platform
**So that** we can achieve sub-10ms response times and reduce database load by 90%+

---

## Acceptance Criteria

### Functional Requirements
- [ ] Redis cluster deployed and configured for high availability
- [ ] Cache-aside pattern implemented for all read-heavy operations
- [ ] Session storage migrated from database to Redis
- [ ] API response caching with intelligent invalidation
- [ ] Database query result caching with TTL management
- [ ] Cache warming strategy for frequently accessed data
- [ ] Pub/sub mechanism for cache synchronization across instances
- [ ] Cache hit/miss monitoring and alerting
- [ ] Graceful degradation when Redis is unavailable
- [ ] Cache key namespacing and versioning

### Performance Requirements
- [ ] Cache hit response time: <10ms (p95)
- [ ] Cache hit rate: >90% for cached endpoints
- [ ] Database query reduction: >85%
- [ ] Session retrieval: <5ms (p99)
- [ ] Cache warming completion: <30 seconds on deployment
- [ ] Memory utilization: <80% of allocated Redis memory
- [ ] Eviction rate: <5% during normal operation

### Technical Requirements
- [ ] Redis 7.x cluster with replication
- [ ] Connection pooling and circuit breaker pattern
- [ ] Compression for large cached values (>1KB)
- [ ] TTL strategy per data type
- [ ] Cache invalidation on data mutations
- [ ] Monitoring dashboard for cache metrics
- [ ] Automated failover and recovery

---

## Technical Specifications

### Redis Cluster Architecture

```typescript
// lib/cache/redis.config.ts
import { Redis, Cluster } from 'ioredis';

export const redisConfig = {
  production: {
    cluster: [
      { host: process.env.REDIS_HOST_1, port: 6379 },
      { host: process.env.REDIS_HOST_2, port: 6379 },
      { host: process.env.REDIS_HOST_3, port: 6379 },
    ],
    options: {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        tls: { rejectUnauthorized: false },
      },
      scaleReads: 'slave',
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    },
  },
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    maxRetriesPerRequest: 3,
  },
};

export class RedisClient {
  private static instance: Redis | Cluster;

  static getInstance(): Redis | Cluster {
    if (!this.instance) {
      this.instance = process.env.NODE_ENV === 'production'
        ? new Cluster(redisConfig.production.cluster, redisConfig.production.options)
        : new Redis(redisConfig.development);
    }
    return this.instance;
  }
}
```

### Cache Service Implementation

```typescript
// lib/cache/cache.service.ts
import { RedisClient } from './redis.config';
import { compress, decompress } from './compression';
import { Logger } from '@/lib/monitoring/logger';

export interface CacheOptions {
  ttl?: number; // seconds
  compress?: boolean;
  namespace?: string;
  version?: string;
}

export class CacheService {
  private redis = RedisClient.getInstance();
  private logger = new Logger('CacheService');
  private defaultTTL = 3600; // 1 hour

  private buildKey(key: string, options?: CacheOptions): string {
    const namespace = options?.namespace || 'app';
    const version = options?.version || 'v1';
    return `${namespace}:${version}:${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key, options);
      const startTime = Date.now();

      let value = await this.redis.get(cacheKey);

      if (!value) {
        this.logger.debug(`Cache miss: ${cacheKey}`);
        this.recordMetric('cache_miss', cacheKey);
        return null;
      }

      if (options?.compress) {
        value = await decompress(value);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`Cache hit: ${cacheKey} (${duration}ms)`);
      this.recordMetric('cache_hit', cacheKey, duration);

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error('Cache get error', error);
      return null; // Graceful degradation
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options);
      let serialized = JSON.stringify(value);

      if (options?.compress && serialized.length > 1024) {
        serialized = await compress(serialized);
      }

      const ttl = options?.ttl || this.defaultTTL;
      await this.redis.setex(cacheKey, ttl, serialized);

      this.logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      this.logger.error('Cache set error', error);
      return false;
    }
  }

  async invalidate(pattern: string, options?: CacheOptions): Promise<number> {
    try {
      const searchPattern = this.buildKey(pattern, options);
      const keys = await this.scanKeys(searchPattern);

      if (keys.length === 0) return 0;

      const deleted = await this.redis.del(...keys);
      this.logger.info(`Cache invalidated: ${deleted} keys matching ${searchPattern}`);

      return deleted;
    } catch (error) {
      this.logger.error('Cache invalidation error', error);
      return 0;
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }

  private recordMetric(type: string, key: string, duration?: number): void {
    // Send to monitoring system
  }
}
```

### Cache Strategy Definitions

```typescript
// lib/cache/strategies.ts
import { CacheOptions } from './cache.service';

export const CacheStrategies = {
  // Events - frequently accessed, moderate updates
  events: {
    list: { ttl: 300, compress: true, namespace: 'events' },      // 5 minutes
    detail: { ttl: 600, compress: false, namespace: 'events' },   // 10 minutes
    public: { ttl: 900, compress: true, namespace: 'events' },    // 15 minutes
  },

  // User sessions - short-lived, critical
  sessions: {
    active: { ttl: 3600, compress: false, namespace: 'session' }, // 1 hour
    data: { ttl: 7200, compress: false, namespace: 'session' },   // 2 hours
  },

  // API responses - varies by endpoint
  api: {
    analytics: { ttl: 1800, compress: true, namespace: 'api' },   // 30 minutes
    orders: { ttl: 60, compress: false, namespace: 'api' },       // 1 minute
    public: { ttl: 3600, compress: true, namespace: 'api' },      // 1 hour
  },

  // Database queries - aggressive caching
  queries: {
    aggregates: { ttl: 600, compress: true, namespace: 'db' },    // 10 minutes
    lookups: { ttl: 3600, compress: false, namespace: 'db' },     // 1 hour
    reports: { ttl: 1800, compress: true, namespace: 'db' },      // 30 minutes
  },

  // Static content - long cache
  static: {
    config: { ttl: 86400, compress: false, namespace: 'static' }, // 24 hours
    templates: { ttl: 43200, compress: true, namespace: 'static' }, // 12 hours
  },
} satisfies Record<string, Record<string, CacheOptions>>;
```

### Cache Warming Service

```typescript
// lib/cache/warming.service.ts
import { CacheService } from './cache.service';
import { prisma } from '@/lib/db';
import { Logger } from '@/lib/monitoring/logger';

export class CacheWarmingService {
  private cache = new CacheService();
  private logger = new Logger('CacheWarmingService');

  async warmAll(): Promise<void> {
    const startTime = Date.now();
    this.logger.info('Starting cache warming...');

    await Promise.all([
      this.warmPublicEvents(),
      this.warmEventCategories(),
      this.warmPopularEvents(),
      this.warmStaticConfig(),
    ]);

    const duration = Date.now() - startTime;
    this.logger.info(`Cache warming completed in ${duration}ms`);
  }

  private async warmPublicEvents(): Promise<void> {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED', startTime: { gte: new Date() } },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    await this.cache.set('events:public:list', events, {
      ttl: 900,
      compress: true,
    });
  }

  private async warmEventCategories(): Promise<void> {
    const categories = await prisma.event.groupBy({
      by: ['category'],
      _count: true,
    });

    await this.cache.set('events:categories', categories, { ttl: 3600 });
  }

  private async warmPopularEvents(): Promise<void> {
    const popular = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { orders: { _count: 'desc' } },
      take: 20,
    });

    await this.cache.set('events:popular', popular, { ttl: 1800 });
  }

  private async warmStaticConfig(): Promise<void> {
    const config = {
      eventCategories: ['WORKSHOP', 'SOCIAL', 'COMPETITION', 'OTHER'],
      ticketTypes: ['GENERAL', 'VIP', 'EARLY_BIRD'],
      // ... other static config
    };

    await this.cache.set('config:static', config, { ttl: 86400 });
  }
}
```

---

## Implementation Details

### Session Storage Migration

```typescript
// lib/auth/session.ts
import { CacheService } from '@/lib/cache/cache.service';

export class SessionStore {
  private cache = new CacheService();

  async getSession(sessionId: string): Promise<Session | null> {
    return this.cache.get<Session>(`session:${sessionId}`, {
      ttl: 3600,
      namespace: 'session',
    });
  }

  async setSession(sessionId: string, session: Session): Promise<void> {
    await this.cache.set(`session:${sessionId}`, session, {
      ttl: 3600,
      namespace: 'session',
    });
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.cache.invalidate(`session:${sessionId}`);
  }
}
```

### API Response Caching Middleware

```typescript
// lib/middleware/cache.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from '@/lib/cache/cache.service';
import { hash } from 'crypto';

export function withCache(options: CacheOptions) {
  return async (request: NextRequest, handler: Function) => {
    const cache = new CacheService();
    const cacheKey = generateCacheKey(request);

    // Try cache first
    const cached = await cache.get(cacheKey, options);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // Execute handler
    const response = await handler(request);
    const data = await response.json();

    // Cache response
    await cache.set(cacheKey, data, options);

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  };
}

function generateCacheKey(request: NextRequest): string {
  const url = request.url;
  const method = request.method;
  const userId = request.headers.get('x-user-id') || 'anonymous';

  return hash('sha256', `${method}:${url}:${userId}`);
}
```

---

## Testing Requirements

### Performance Tests
```typescript
describe('Redis Cache Performance', () => {
  it('should achieve <10ms cache hits', async () => {
    const cache = new CacheService();
    await cache.set('test-key', { data: 'test' });

    const start = Date.now();
    await cache.get('test-key');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10);
  });

  it('should handle 1000 concurrent requests', async () => {
    const cache = new CacheService();
    const promises = Array.from({ length: 1000 }, (_, i) =>
      cache.get(`key-${i}`)
    );

    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
```

---

## Infrastructure Requirements

### Redis Cluster Setup
- **Provider:** AWS ElastiCache or Redis Cloud
- **Configuration:** 3-node cluster with replication
- **Memory:** 8GB per node (24GB total)
- **Backup:** Daily snapshots, 7-day retention
- **Monitoring:** CloudWatch metrics, custom dashboards

### Environment Variables
```env
REDIS_HOST_1=cache-node-1.redis.cache.amazonaws.com
REDIS_HOST_2=cache-node-2.redis.cache.amazonaws.com
REDIS_HOST_3=cache-node-3.redis.cache.amazonaws.com
REDIS_PASSWORD=<secure-password>
REDIS_TLS_ENABLED=true
```

---

## Monitoring and Alerting

### Key Metrics
- Cache hit rate (target: >90%)
- Cache response time p95 (target: <10ms)
- Memory utilization (alert: >80%)
- Eviction rate (alert: >5%)
- Connection pool exhaustion
- Cache warming duration

### Alerts
- Critical: Cache hit rate <70%
- Critical: Cache unavailable >2 minutes
- Warning: Memory utilization >80%
- Warning: Eviction rate >5%

---

## Dependencies
- ioredis ^5.3.0
- compression library (zlib or lz4)
- Monitoring integration

## Related Stories
- PERF-001: API Performance Optimization
- PERF-003: CDN Implementation
- SEC-004: Rate Limiting Enhancement

---

**Notes:**
- Cache invalidation strategy must be bulletproof
- Monitor cache memory usage closely
- Plan for cache warming on deployments
- Implement circuit breaker for Redis failures