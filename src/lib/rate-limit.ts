import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limit configurations for different endpoint types.
 * Uses Upstash Redis in production, falls back to in-memory for local dev.
 */

export const rateLimitConfigs = {
  standard: { requests: 100, window: '60 s' as const },
  ai:       { requests: 10,  window: '60 s' as const },
  auth:     { requests: 5,   window: '60 s' as const },
  webhook:  { requests: 50,  window: '60 s' as const },
} as const;

export type RateLimitType = keyof typeof rateLimitConfigs;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// Singleton limiters per type
const limiters = new Map<RateLimitType, Ratelimit>();

function getOrCreateLimiter(type: RateLimitType): Ratelimit {
  const existing = limiters.get(type);
  if (existing) return existing;

  const config = rateLimitConfigs[type];

  const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  const limiter = new Ratelimit({
    redis: hasRedis
      ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
      : Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `reachr:ratelimit:${type}`,
    ephemeralCache: hasRedis ? undefined : new Map(),
  });

  limiters.set(type, limiter);
  return limiter;
}

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis in production, ephemeral cache in dev.
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'standard'
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return {
      allowed: true,
      remaining: 999,
      resetAt: Date.now() + 60000,
    };
  }

  try {
    const limiter = getOrCreateLimiter(type);
    const key = `${type}:${identifier}`;
    const result = await limiter.limit(key);

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (err) {
    // If Redis is down, fail open (allow the request) but log
    console.error('Rate limiter error (failing open):', err);
    return {
      allowed: true,
      remaining: -1,
      resetAt: Date.now() + 60000,
    };
  }
}

/**
 * Get rate limit type based on pathname.
 */
export function getRateLimitType(pathname: string): RateLimitType {
  if (pathname.startsWith('/api/ai/')) return 'ai';
  if (pathname.startsWith('/api/auth/')) return 'auth';
  if (pathname.includes('/webhook/')) return 'webhook';
  return 'standard';
}

/**
 * Create rate limit headers for response.
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}
