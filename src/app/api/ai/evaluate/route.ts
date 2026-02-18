import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';
import { transitionContent } from '@/lib/content-state-machine';

interface EvaluationResult {
  contentItemId: string;
  decision: 'optimize' | 'takedown';
  views: number;
  threshold: number;
  referrers: { source: string; count: number }[];
  reason: string;
}

/**
 * POST /api/ai/evaluate
 *
 * Evaluates a content item after monitoring window expires.
 * Decision: optimize (>= threshold views) or takedown (< threshold views).
 * Pure decision logic — no Claude call.
 */
export async function POST(req: NextRequest) {
  try {
    const security = await checkApiSecurity(req, { rateLimitType: 'standard' });
    if (!security.authorized) {
      return security.response!;
    }

    const { contentItemId, views, referrers } = await req.json();

    if (!contentItemId) {
      return NextResponse.json(
        { error: 'contentItemId is required' },
        { status: 400 }
      );
    }

    if (typeof views !== 'number') {
      return NextResponse.json(
        { error: 'views (number) is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Get the content item with tenant threshold
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .select('*, tenants!inner(performance_threshold, name)')
      .eq('id', contentItemId)
      .single();

    if (contentError || !contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      );
    }

    const threshold = contentItem.tenants?.performance_threshold || 6;

    // 2. Guarded transition: monitoring → evaluating
    const { error: transitionError } = await transitionContent(
      supabase,
      contentItemId,
      'evaluating',
      {
        views_at_72h: views,
        referrers: referrers || [],
        evaluated_at: new Date().toISOString(),
      }
    );

    if (transitionError) {
      return NextResponse.json(
        { error: transitionError },
        { status: 409 }
      );
    }

    // 3. Make the decision
    const decision = views >= threshold ? 'optimize' : 'takedown';

    const reason = decision === 'optimize'
      ? `Post heeft ${views} views (drempel: ${threshold}). Kwalificeert voor optimalisatie.`
      : `Post heeft slechts ${views} views (drempel: ${threshold}). Wordt offline gehaald.`;

    // 4. Log the workflow run
    await supabase.from('workflow_runs').insert({
      tenant_id: contentItem.tenant_id,
      run_type: 'monitoring_check',
      status: 'completed',
      content_item_id: contentItemId,
      result_summary: `${decision.toUpperCase()}: ${views} views vs ${threshold} threshold`,
      triggered_by: 'n8n',
    });

    // 5. Update topic log with success/failure
    await supabase
      .from('topic_logs')
      .update({
        success: decision === 'optimize',
        views_achieved: views,
      })
      .eq('content_item_id', contentItemId);

    const result: EvaluationResult = {
      contentItemId,
      decision,
      views,
      threshold,
      referrers: referrers || [],
      reason,
    };

    return NextResponse.json({
      success: true,
      evaluation: result,
    });
  } catch (error) {
    console.error('Evaluate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/evaluate
 *
 * Gets all content items that need evaluation (monitoring period ended).
 */
export async function GET(req: NextRequest) {
  try {
    const security = await checkApiSecurity(req, { rateLimitType: 'standard' });
    if (!security.authorized) {
      return security.response!;
    }

    const supabase = createAdminClient();

    const { data: items, error } = await supabase
      .from('content_items')
      .select(`
        id,
        tenant_id,
        title,
        wp_post_id,
        published_at,
        monitoring_ends_at,
        tenants!inner(name, performance_threshold)
      `)
      .eq('status', 'monitoring')
      .lte('monitoring_ends_at', new Date().toISOString());

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch items', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      itemsToEvaluate: items || [],
      count: items?.length || 0,
    });
  } catch (error) {
    console.error('Evaluate GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
