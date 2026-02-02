/**
 * In-memory rate limiter using sliding window algorithm
 * For production with multiple instances, use Upstash Redis instead
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store (resets on server restart)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now - windowMs;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Rate limit configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // Standard API endpoints
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // AI endpoints (expensive Claude API calls)
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // Authentication endpoints (prevent brute force)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Webhook endpoints (n8n)
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
  },
} as const;

export type RateLimitType = keyof typeof rateLimitConfigs;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp when the window resets
  retryAfter?: number; // Seconds until rate limit resets (only if blocked)
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param type - Type of rate limit to apply
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'standard'
): RateLimitResult {
  // Check if rate limiting is enabled
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return {
      allowed: true,
      remaining: 999,
      resetAt: Date.now() + 60000,
    };
  }

  const config = rateLimitConfigs[type];
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `${type}:${identifier}`;

  // Cleanup old entries periodically
  cleanup(config.windowMs);

  // Get or create entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (entry.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = entry.timestamps[0];
    const resetAt = oldestTimestamp + config.windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  // Add current request timestamp
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

/**
 * Get rate limit type based on pathname
 */
export function getRateLimitType(pathname: string): RateLimitType {
  if (pathname.startsWith('/api/ai/')) {
    return 'ai';
  }
  if (pathname.startsWith('/api/auth/')) {
    return 'auth';
  }
  if (pathname.includes('/webhook/')) {
    return 'webhook';
  }
  return 'standard';
}

/**
 * Create rate limit headers for response
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
