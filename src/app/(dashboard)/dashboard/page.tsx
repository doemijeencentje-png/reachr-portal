import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import Link from 'next/link';
import { FileText, Briefcase, Settings, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get tenant data
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  let profile = null;
  let jobs: { id: string; job_type: string; status: string; blog_post_url: string | null; started_at: string }[] = [];

  if (tenantUser) {
    const { data: profileData } = await supabase
      .from('website_profiles')
      .select('*')
      .eq('tenant_id', tenantUser.tenant_id)
      .single();
    profile = profileData;

    const { data: jobsData } = await supabase
      .from('workflow_jobs')
      .select('*')
      .eq('tenant_id', tenantUser.tenant_id)
      .order('started_at', { ascending: false })
      .limit(5);
    jobs = jobsData || [];
  }

  // Calculate profile completeness
  const calculateCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.website_url,
      profile.company_name,
      profile.industry,
      profile.products_services?.length > 0,
      profile.target_audience,
      profile.tone_of_voice,
      profile.seed_keywords?.length > 0,
      profile.internal_links?.length > 0,
      profile.full_html,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Welcome back!</h2>
        {!profile?.onboarding_completed && (
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Complete Onboarding
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completeness */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Profile Completeness</h3>
            <span className={`text-2xl font-bold ${completeness === 100 ? 'text-primary' : 'text-yellow-500'}`}>
              {completeness}%
            </span>
          </div>
          <div className="w-full bg-dark-300 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${completeness === 100 ? 'bg-primary' : 'bg-yellow-500'}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <Link href="/onboarding" className="text-sm text-primary hover:text-primary-light flex items-center gap-1">
              Complete your profile <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </Card>

        {/* Active Jobs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Jobs</h3>
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {jobs.filter(j => j.status === 'running' || j.status === 'pending').length}
          </p>
          <Link href="/jobs" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            View all jobs <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        {/* Posts Created */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Posts Created</h3>
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {jobs.filter(j => j.status === 'completed' && j.job_type === 'create_post').length}
          </p>
          <p className="text-sm text-gray-400">Total blog posts published</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/onboarding"
            className="flex items-center gap-3 p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <p className="font-medium text-white">Edit Profile</p>
              <p className="text-sm text-gray-400">Update your website info</p>
            </div>
          </Link>
          <Link
            href="/jobs"
            className="flex items-center gap-3 p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <Briefcase className="w-6 h-6 text-primary" />
            <div>
              <p className="font-medium text-white">View Jobs</p>
              <p className="text-sm text-gray-400">Monitor your workflows</p>
            </div>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <p className="font-medium text-white">Settings</p>
              <p className="text-sm text-gray-400">Manage integrations</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Jobs</h3>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 bg-dark-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {job.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : job.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <div>
                    <p className="font-medium text-white capitalize">
                      {job.job_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(job.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    job.status === 'completed'
                      ? 'bg-primary/20 text-primary'
                      : job.status === 'failed'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
