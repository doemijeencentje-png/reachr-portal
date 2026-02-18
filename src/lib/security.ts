import { timingSafeEqual, createHmac } from 'crypto';

/**
 * Security utilities for the Reachr Portal
 */

/**
 * Timing-safe string comparison to prevent timing attacks
 * Always takes the same amount of time regardless of where strings differ
 */
export function secureCompare(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  // If lengths differ, still do a comparison to maintain constant time
  if (a.length !== b.length) {
    // Compare a with itself to maintain timing consistency
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verify HMAC signature from n8n requests
 * Expects header format: "sha256=<hex-signature>"
 */
export function verifyHmacSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Parse signature header (format: "sha256=abc123...")
  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const providedSignature = parts[1];
  const expectedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return secureCompare(providedSignature, expectedSignature);
}

/**
 * Check if IP is in the allowed list
 * Returns true if no whitelist is configured (empty = allow all)
 */
export function isIpAllowed(ip: string | null): boolean {
  const allowedIps = process.env.ALLOWED_IPS;

  // No whitelist configured = allow all
  if (!allowedIps || allowedIps.trim() === '') {
    return true;
  }

  if (!ip) {
    return false;
  }

  // Parse comma-separated list
  const whitelist = allowedIps.split(',').map((i) => i.trim());

  // Check exact match
  if (whitelist.includes(ip)) {
    return true;
  }

  // Handle x-forwarded-for which may contain multiple IPs
  // Format: "client, proxy1, proxy2"
  const clientIp = ip.split(',')[0].trim();
  return whitelist.includes(clientIp);
}

/**
 * Get client IP from request headers
 * Handles various proxy setups (Vercel, Cloudflare, etc.)
 */
export function getClientIp(headers: Headers): string | null {
  // Vercel
  const vercelIp = headers.get('x-real-ip');
  if (vercelIp) return vercelIp;

  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Standard proxy header
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return null;
}

/**
 * Verify portal API key with timing-safe comparison
 */
export function verifyPortalApiKey(providedKey: string | null): boolean {
  const expectedKey = process.env.PORTAL_API_KEY;

  if (!providedKey || !expectedKey) {
    return false;
  }

  return secureCompare(providedKey, expectedKey);
}

/**
 * Full request verification for n8n webhooks
 * Checks: API key, HMAC signature (if enabled), IP whitelist
 */
export interface VerifyRequestOptions {
  headers: Headers;
  body?: string;
  requireHmac?: boolean;
}

export interface VerifyRequestResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

const MAX_TIMESTAMP_DRIFT_MS = 60_000;

/**
 * Verify x-timestamp header is within acceptable drift window (anti-replay)
 */
export function verifyTimestamp(headers: Headers): VerifyRequestResult {
  const timestamp = headers.get('x-timestamp');
  if (!timestamp) {
    return { valid: false, error: 'Missing x-timestamp header', statusCode: 400 };
  }

  const requestTime = new Date(timestamp).getTime();
  if (isNaN(requestTime)) {
    return { valid: false, error: 'Invalid x-timestamp format', statusCode: 400 };
  }

  const drift = Math.abs(Date.now() - requestTime);
  if (drift > MAX_TIMESTAMP_DRIFT_MS) {
    return { valid: false, error: 'Request timestamp expired (anti-replay)', statusCode: 403 };
  }

  return { valid: true };
}

export function verifyRequest(options: VerifyRequestOptions): VerifyRequestResult {
  const { headers, body, requireHmac = false } = options;

  // 1. Check IP whitelist
  const clientIp = getClientIp(headers);
  if (!isIpAllowed(clientIp)) {
    return {
      valid: false,
      error: 'IP not allowed',
      statusCode: 403,
    };
  }

  // 2. Verify API key
  const apiKey = headers.get('x-portal-key');
  if (!verifyPortalApiKey(apiKey)) {
    return {
      valid: false,
      error: 'Unauthorized',
      statusCode: 401,
    };
  }

  // 3. Verify HMAC signature (if required and configured)
  const hmacSecret = process.env.HMAC_SECRET;
  if (requireHmac && hmacSecret) {
    // 3a. Anti-replay: check timestamp
    const timestampResult = verifyTimestamp(headers);
    if (!timestampResult.valid) {
      return timestampResult;
    }

    const signature = headers.get('x-signature');

    if (!body) {
      return {
        valid: false,
        error: 'Request body required for HMAC verification',
        statusCode: 400,
      };
    }

    if (!verifyHmacSignature(body, signature, hmacSecret)) {
      return {
        valid: false,
        error: 'Invalid signature',
        statusCode: 401,
      };
    }
  }

  return { valid: true };
}
