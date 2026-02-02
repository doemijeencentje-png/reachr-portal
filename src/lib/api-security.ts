import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest, getClientIp } from './security';
import {
  checkRateLimit,
  getRateLimitType,
  createRateLimitHeaders,
  RateLimitType,
} from './rate-limit';

export interface ApiSecurityOptions {
  requireHmac?: boolean;
  rateLimitType?: RateLimitType;
}

export interface ApiSecurityResult {
  authorized: boolean;
  response?: NextResponse;
  clientIp: string | null;
}

/**
 * Comprehensive API security check
 * Combines rate limiting, IP whitelist, API key, and HMAC verification
 */
export async function checkApiSecurity(
  req: NextRequest,
  options: ApiSecurityOptions = {}
): Promise<ApiSecurityResult> {
  const clientIp = getClientIp(req.headers);
  const pathname = req.nextUrl.pathname;

  // 1. Rate limiting
  const rateLimitType = options.rateLimitType || getRateLimitType(pathname);
  const rateLimitResult = checkRateLimit(clientIp || 'unknown', rateLimitType);

  if (!rateLimitResult.allowed) {
    const response = NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 }
    );

    // Add rate limit headers
    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return { authorized: false, response, clientIp };
  }

  // 2. Get body for HMAC verification (if needed)
  let body: string | undefined;
  if (options.requireHmac && req.method !== 'GET') {
    try {
      body = await req.text();
    } catch {
      // Body might already be consumed
    }
  }

  // 3. Verify request (IP whitelist, API key, HMAC)
  const verifyResult = verifyRequest({
    headers: req.headers,
    body,
    requireHmac: options.requireHmac,
  });

  if (!verifyResult.valid) {
    // Log suspicious activity
    console.warn(`API security check failed: ${verifyResult.error}`, {
      ip: clientIp,
      path: pathname,
      method: req.method,
    });

    const response = NextResponse.json(
      { error: verifyResult.error },
      { status: verifyResult.statusCode || 401 }
    );

    // Still add rate limit headers to show remaining requests
    const headers = createRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return { authorized: false, response, clientIp };
  }

  return { authorized: true, clientIp };
}

/**
 * Helper to add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  clientIp: string | null,
  pathname: string
): NextResponse {
  const rateLimitType = getRateLimitType(pathname);
  const rateLimitResult = checkRateLimit(clientIp || 'unknown', rateLimitType);
  const headers = createRateLimitHeaders(rateLimitResult);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Wrapper for API route handlers with security built-in
 * Usage:
 *   export const POST = withApiSecurity(async (req, { clientIp }) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   }, { requireHmac: true });
 */
export function withApiSecurity(
  handler: (
    req: NextRequest,
    context: { clientIp: string | null }
  ) => Promise<NextResponse>,
  options: ApiSecurityOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const securityResult = await checkApiSecurity(req, options);

    if (!securityResult.authorized) {
      return securityResult.response!;
    }

    const response = await handler(req, { clientIp: securityResult.clientIp });

    // Add rate limit headers to successful response
    return addRateLimitHeaders(
      response,
      securityResult.clientIp,
      req.nextUrl.pathname
    );
  };
}
