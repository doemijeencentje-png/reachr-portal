import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 529];

function isRetryable(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return RETRYABLE_STATUS_CODES.includes(error.status);
  }
  if (error instanceof Error && error.message.includes('fetch')) {
    return true; // Network errors
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: options?.model || DEFAULT_MODEL,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock ? textBlock.text : '';
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRIES && isRetryable(error)) {
        const backoffMs = RETRY_BASE_MS * Math.pow(2, attempt); // 1s, 2s
        const jitter = Math.random() * 500;
        console.warn(
          `Claude API attempt ${attempt + 1} failed, retrying in ${backoffMs + jitter}ms:`,
          error instanceof Error ? error.message : error
        );
        await sleep(backoffMs + jitter);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export function parseJsonFromResponse<T>(response: string): T | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch {
    console.error('Failed to parse JSON from Claude response:', response.slice(0, 200));
    return null;
  }
}
