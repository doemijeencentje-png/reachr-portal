import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const security = await checkApiSecurity(request, { rateLimitType: 'standard' });
  if (!security.authorized) {
    return security.response!;
  }

  const { tenantId } = await params;

  try {
    const supabase = createAdminClient();

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('website_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (integrationError) {
      console.error('Error fetching integration:', integrationError);
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
        performance_threshold: tenant.performance_threshold,
        monitoring_hours: tenant.monitoring_hours,
        posts_per_week: tenant.posts_per_week,
        workflow_enabled: tenant.workflow_enabled,
        workflow_paused: tenant.workflow_paused,
      },
      profile: profile || null,
      integration: integration ? {
        id: integration.id,
        has_wordpress: !!(integration.wordpress_base_url && integration.wordpress_username && integration.wordpress_app_password_encrypted),
        wordpress_base_url: integration.wordpress_base_url,
        wordpress_username: integration.wordpress_username,
        ga4_property_id: integration.ga4_property_id,
        gsc_site_url: integration.gsc_site_url,
        stats_provider: integration.stats_provider,
        webhook_url: integration.webhook_url,
      } : null,
    });
  } catch (error) {
    console.error('Error in /api/tenants/[tenantId]/config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
