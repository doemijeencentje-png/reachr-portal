import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerN8nWebhook } from '@/lib/n8n';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenant_id, event } = body;

    // Verify user belongs to tenant
    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Trigger webhook
    const result = await triggerN8nWebhook(tenant_id, event || 'manual_trigger');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to trigger webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook triggered successfully',
    });
  } catch (error) {
    console.error('Error in /api/webhook/trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
