import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
// Make sure ANTHROPIC_API_KEY is set in .env.local
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model to use
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// Helper function to call Claude with structured output
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
) {
  const response = await anthropic.messages.create({
    model: options?.model || DEFAULT_MODEL,
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

// Helper to parse JSON from Claude's response
export function parseJsonFromResponse<T>(response: string): T | null {
  try {
    // Try to find JSON in the response (sometimes Claude adds explanation text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch {
    console.error('Failed to parse JSON from Claude response:', response);
    return null;
  }
}
