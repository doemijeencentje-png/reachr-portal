export interface SourceToValidate {
  url: string;
  title: string;
  [key: string]: unknown;
}

export interface ValidationResult<T extends SourceToValidate> {
  valid: T[];
  invalid: { source: T; reason: string }[];
}

const FETCH_TIMEOUT_MS = 6_000;

const ACCEPTABLE_CONTENT_TYPES = [
  'text/html',
  'application/xhtml',
  'text/plain',
  'application/json',
  'application/xml',
  'text/xml',
];

function isAcceptableContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return ACCEPTABLE_CONTENT_TYPES.some((t) => lower.includes(t));
}

async function checkUrl(url: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    new URL(url);
  } catch {
    return { ok: false, reason: 'Invalid URL format' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Try HEAD first (lighter)
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Reachr-SourceValidator/1.0' },
      });
    } catch {
      // HEAD blocked by some servers, fallback to GET with range
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Reachr-SourceValidator/1.0',
          'Range': 'bytes=0-0',
        },
      });
    }

    if (response.status < 200 || response.status >= 400) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type');
    if (!isAcceptableContentType(contentType)) {
      return { ok: false, reason: `Unacceptable content-type: ${contentType}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    if (message.includes('abort')) {
      return { ok: false, reason: 'Timeout' };
    }
    return { ok: false, reason: message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Validate an array of sources by checking their URLs are reachable.
 * Returns valid and invalid sources separately.
 */
export async function validateSources<T extends SourceToValidate>(
  sources: T[]
): Promise<ValidationResult<T>> {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const check = await checkUrl(source.url);
      return { source, check };
    })
  );

  const valid: T[] = [];
  const invalid: { source: T; reason: string }[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.check.ok) {
        valid.push(result.value.source);
      } else {
        invalid.push({
          source: result.value.source,
          reason: result.value.check.reason || 'Unknown',
        });
      }
    } else {
      // Promise rejected entirely
      invalid.push({
        source: sources[results.indexOf(result)],
        reason: 'Validation failed',
      });
    }
  }

  return { valid, invalid };
}

export const MIN_VALID_SOURCES = 1;
