import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';

/**
 * POST /api/content/published
 *
 * Called by n8n after successfully publishing a post to WordPress.
 * Updates the content_item status to 'monitoring' and sets the monitoring window.
 */
export async function POST(req: NextRequest) {
  try {
    // Security check: rate limiting, IP whitelist, API key
    const security = await checkApiSecurity(req, { rateLimitType: 'webhook' });
    if (!security.authorized) {
      return security.response!;
    }

    const { contentItemId, wpPostId, wpPostUrl } = await req.json();

    if (!contentItemId || !wpPostId) {
      return NextResponse.json(
        { error: 'contentItemId and wpPostId are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get tenant's monitoring hours setting
    const { data: contentItem } = await supabase
      .from('content_items')
      .select('tenant_id')
      .eq('id', contentItemId)
      .single();

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('monitoring_hours')
      .eq('id', contentItem.tenant_id)
      .single();

    const monitoringHours = tenant?.monitoring_hours || 72;
    const publishedAt = new Date();
    const monitoringEndsAt = new Date(
      publishedAt.getTime() + monitoringHours * 60 * 60 * 1000
    );

    // Update content item
    const { data: updated, error: updateError } = await supabase
      .from('content_items')
      .update({
        status: 'monitoring',
        wp_post_id: wpPostId,
        wp_post_url: wpPostUrl,
        published_at: publishedAt.toISOString(),
        monitoring_ends_at: monitoringEndsAt.toISOString(),
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

    // Log the workflow run
    await supabase.from('workflow_runs').insert({
      tenant_id: contentItem.tenant_id,
      run_type: 'daily_creation',
      status: 'completed',
      content_item_id: contentItemId,
      result_summary: `Published: ${updated.title}`,
      triggered_by: 'n8n',
    });

    return NextResponse.json({
      success: true,
      contentItem: {
        id: updated.id,
        status: updated.status,
        publishedAt: updated.published_at,
        monitoringEndsAt: updated.monitoring_ends_at,
        wpPostId: updated.wp_post_id,
        wpPostUrl: updated.wp_post_url,
      },
    });
  } catch (error) {
    console.error('Content published API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
