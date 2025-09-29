import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Cache utilities
export class CacheService {
  private redis: Redis

  constructor(redisInstance: Redis) {
    this.redis = redisInstance
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized)
      } else {
        await this.redis.set(key, serialized)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string | string[]): Promise<number> {
    try {
      return await this.redis.del(...(Array.isArray(key) ? key : [key]))
    } catch (error) {
      console.error('Redis DEL error:', error)
      return 0
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttlSeconds)
      return result === 1
    } catch (error) {
      console.error('Redis EXPIRE error:', error)
      return false
    }
  }

  async flushPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0
      return await this.redis.del(...keys)
    } catch (error) {
      console.error('Redis FLUSH PATTERN error:', error)
      return 0
    }
  }

  // Increment a counter
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key)
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  }

  // Add to a set
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members)
    } catch (error) {
      console.error('Redis SADD error:', error)
      return 0
    }
  }

  // Get set members
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key)
    } catch (error) {
      console.error('Redis SMEMBERS error:', error)
      return []
    }
  }

  // Remove from set
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.srem(key, ...members)
    } catch (error) {
      console.error('Redis SREM error:', error)
      return 0
    }
  }
}

export const cache = new CacheService(redis)

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  event: (id: string) => `event:${id}`,
  events: (page: number, limit: number, filters?: string) =>
    `events:${page}:${limit}${filters ? `:${filters}` : ''}`,
  userEvents: (userId: string) => `user:${userId}:events`,
  eventTickets: (eventId: string) => `event:${eventId}:tickets`,
  userTickets: (userId: string) => `user:${userId}:tickets`,
  session: (token: string) => `session:${token}`,
  rateLimit: (identifier: string) => `rate_limit:${identifier}`,
} as const