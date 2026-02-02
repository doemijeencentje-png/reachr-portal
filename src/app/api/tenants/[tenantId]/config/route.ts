import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';
import { decrypt } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  // Security check: rate limiting, IP whitelist, API key
  const security = await checkApiSecurity(request, { rateLimitType: 'standard' });
  if (!security.authorized) {
    return security.response!;
  }

  const { tenantId } = await params;

  try {
    const supabase = createAdminClient();

    // Fetch tenant
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

    // Fetch website profile
    const { data: profile, error: profileError } = await supabase
      .from('website_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch integrations
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (integrationError) {
      console.error('Error fetching integration:', integrationError);
    }

    // Decrypt WordPress password if present
    let wordpressPassword = null;
    if (integration?.wordpress_app_password_encrypted) {
      try {
        wordpressPassword = decrypt(integration.wordpress_app_password_encrypted);
      } catch (e) {
        console.error('Failed to decrypt WordPress password:', e);
      }
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status,
      },
      profile: profile || null,
      integration: integration ? {
        wordpress_base_url: integration.wordpress_base_url,
        wordpress_username: integration.wordpress_username,
        wordpress_app_password: wordpressPassword,
        ga4_property_id: integration.ga4_property_id,
        gsc_site_url: integration.gsc_site_url,
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
