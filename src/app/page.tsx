import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if onboarding is completed
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantUser) {
      const { data: profile } = await supabase
        .from('website_profiles')
        .select('onboarding_completed')
        .eq('tenant_id', tenantUser.tenant_id)
        .single();

      if (profile?.onboarding_completed) {
        redirect('/dashboard');
      } else {
        redirect('/onboarding');
      }
    }

    redirect('/dashboard');
  }

  redirect('/login');
}
