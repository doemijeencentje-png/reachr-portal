import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';
import { transitionContent } from '@/lib/content-state-machine';

/**
 * POST /api/content/offline
 *
 * Called by n8n after taking a post offline due to poor performance.
 * Guarded transition: evaluating/taking_offline → offline.
 */
export async function POST(req: NextRequest) {
  try {
    const security = await checkApiSecurity(req, { rateLimitType: 'webhook' });
    if (!security.authorized) {
      return security.response!;
    }

    const { contentItemId, reason, views, threshold } = await req.json();

    if (!contentItemId) {
      return NextResponse.json(
        { error: 'contentItemId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // First transition to taking_offline (from evaluating)
    const { error: takedownError } = await transitionContent(
      supabase,
      contentItemId,
      'taking_offline'
    );

    if (takedownError) {
      return NextResponse.json(
        { error: takedownError },
        { status: 409 }
      );
    }

    // Then transition to offline
    const { data: updated, error: offlineError } = await transitionContent(
      supabase,
      contentItemId,
      'offline',
      {
        last_error: reason || `Performance below threshold: ${views} < ${threshold}`,
      }
    );

    if (offlineError) {
      return NextResponse.json(
        { error: offlineError },
        { status: 409 }
      );
    }

    const contentItem = updated as Record<string, unknown>;

    // Update topic log to mark as failed
    await supabase
      .from('topic_logs')
      .update({
        success: false,
        views_achieved: views,
      })
      .eq('content_item_id', contentItemId);

    // Log the workflow run
    await supabase.from('workflow_runs').insert({
      tenant_id: contentItem.tenant_id,
      run_type: 'takedown',
      status: 'completed',
      content_item_id: contentItemId,
      result_summary: `Taken offline: ${views} views < ${threshold} threshold`,
      triggered_by: 'n8n',
    });

    return NextResponse.json({
      success: true,
      contentItem: {
        id: contentItem.id,
        status: contentItem.status,
        topic: contentItem.topic,
      },
      performance: {
        views,
        threshold,
        reason,
      },
    });
  } catch (error) {
    console.error('Content offline API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
