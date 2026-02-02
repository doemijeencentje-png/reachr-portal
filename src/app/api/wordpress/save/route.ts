import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

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
    const { tenant_id, wordpress_base_url, wordpress_username, wordpress_app_password } = body;

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

    // Encrypt the password
    const encryptedPassword = encrypt(wordpress_app_password);

    // Use admin client to update integrations
    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
      .from('integrations')
      .update({
        wordpress_base_url,
        wordpress_username,
        wordpress_app_password_encrypted: encryptedPassword,
      })
      .eq('tenant_id', tenant_id);

    if (updateError) {
      console.error('Error saving WordPress credentials:', updateError);
      return NextResponse.json(
        { error: 'Failed to save credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WordPress credentials saved successfully',
    });
  } catch (error) {
    console.error('Error in /api/wordpress/save:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
