import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';

/**
 * POST /api/content/offline
 *
 * Called by n8n after taking a post offline due to poor performance.
 * Updates the content_item status to 'offline' and logs the failure.
 */
export async function POST(req: NextRequest) {
  try {
    // Security check: rate limiting, IP whitelist, API key
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

    // Get content item
    const { data: contentItem } = await supabase
      .from('content_items')
      .select('tenant_id, topic')
      .eq('id', contentItemId)
      .single();

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    // Update content item to offline
    const { data: updated, error: updateError } = await supabase
      .from('content_items')
      .update({
        status: 'offline',
        last_error: reason || `Performance below threshold: ${views} < ${threshold}`,
      })
      .eq('id', contentItemId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update content item', details: updateError.message },
        { status: 500 }
      );
    }

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
        id: updated.id,
        status: updated.status,
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
