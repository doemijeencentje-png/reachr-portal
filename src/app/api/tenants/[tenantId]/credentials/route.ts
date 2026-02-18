import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/tenants/[tenantId]/credentials
 *
 * Secure endpoint for n8n to retrieve WordPress credentials.
 * Requires HMAC signature + timestamp (anti-replay).
 * Never returns credentials via GET or without HMAC.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const security = await checkApiSecurity(request, {
    rateLimitType: 'webhook',
    requireHmac: true,
  });
  if (!security.authorized) {
    return security.response!;
  }

  const { tenantId } = await params;

  try {
    const supabase = createAdminClient();

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        { error: 'Tenant is not active' },
        { status: 403 }
      );
    }

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('wordpress_base_url, wordpress_username, wordpress_app_password_encrypted')
      .eq('tenant_id', tenantId)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    if (!integration.wordpress_app_password_encrypted) {
      return NextResponse.json(
        { error: 'No WordPress credentials configured' },
        { status: 404 }
      );
    }

    let wordpressPassword: string;
    try {
      wordpressPassword = decrypt(integration.wordpress_app_password_encrypted);
    } catch (e) {
      console.error('Failed to decrypt WordPress password for tenant:', tenantId, e);
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      wordpress_base_url: integration.wordpress_base_url,
      wordpress_username: integration.wordpress_username,
      wordpress_app_password: wordpressPassword,
    });
  } catch (error) {
    console.error('Error in /api/tenants/[tenantId]/credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
