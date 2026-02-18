import type { ContentStatus } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Allowed state transitions for content items.
 * If a transition is not in this map, it is rejected.
 */
const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft:          ['publishing', 'failed'],
  publishing:     ['published', 'monitoring', 'failed'],
  published:      ['monitoring'],
  monitoring:     ['evaluating'],
  evaluating:     ['optimizing', 'taking_offline'],
  optimizing:     ['optimized', 'failed'],
  optimized:      ['monitoring', 'published'],
  taking_offline: ['offline', 'failed'],
  offline:        ['draft'],
  failed:         ['draft', 'publishing'],
};

export interface TransitionResult {
  valid: boolean;
  error?: string;
}

export function validateTransition(
  from: ContentStatus,
  to: ContentStatus
): TransitionResult {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) {
    return { valid: false, error: `Unknown status: ${from}` };
  }

  if (!allowed.includes(to)) {
    return {
      valid: false,
      error: `Invalid transition: ${from} → ${to}. Allowed from ${from}: [${allowed.join(', ')}]`,
    };
  }

  return { valid: true };
}

/**
 * Atomically transition a content item's status with guard.
 * Fetches current status, validates transition, then updates.
 * Returns the updated row or an error.
 */
export async function transitionContent(
  supabase: SupabaseClient,
  contentItemId: string,
  newStatus: ContentStatus,
  additionalUpdates: Record<string, unknown> = {}
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  // 1. Fetch current status
  const { data: current, error: fetchError } = await supabase
    .from('content_items')
    .select('id, status, tenant_id')
    .eq('id', contentItemId)
    .single();

  if (fetchError || !current) {
    return { data: null, error: 'Content item not found' };
  }

  // 2. Validate transition
  const transition = validateTransition(current.status as ContentStatus, newStatus);
  if (!transition.valid) {
    console.error(`State transition rejected for ${contentItemId}:`, transition.error);
    return { data: null, error: transition.error! };
  }

  // 3. Update with optimistic concurrency (only if status hasn't changed)
  const { data: updated, error: updateError } = await supabase
    .from('content_items')
    .update({
      status: newStatus,
      ...additionalUpdates,
    })
    .eq('id', contentItemId)
    .eq('status', current.status) // Optimistic lock: only update if status hasn't changed
    .select()
    .single();

  if (updateError || !updated) {
    return {
      data: null,
      error: `Failed to update: status may have been changed concurrently (expected ${current.status})`,
    };
  }

  return { data: updated, error: null };
}
