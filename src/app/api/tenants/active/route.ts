import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  // Security check: rate limiting, IP whitelist, API key
  const security = await checkApiSecurity(request, { rateLimitType: 'standard' });
  if (!security.authorized) {
    return security.response!;
  }

  try {
    const supabase = createAdminClient();

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching tenants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tenant_ids: tenants.map((t) => t.id),
      count: tenants.length,
    });
  } catch (error) {
    console.error('Error in /api/tenants/active:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
