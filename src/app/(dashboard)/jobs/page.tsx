import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui';
import { CheckCircle, AlertCircle, Clock, Play, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default async function JobsPage() {
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

  let jobs: {
    id: string;
    job_type: string;
    status: string;
    blog_post_url: string | null;
    metrics: { views?: number; created_at?: string } | null;
    started_at: string;
    finished_at: string | null;
    error: string | null;
  }[] = [];

  if (tenantUser) {
    const { data: jobsData } = await supabase
      .from('workflow_jobs')
      .select('*')
      .eq('tenant_id', tenantUser.tenant_id)
      .order('started_at', { ascending: false });
    jobs = jobsData || [];
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/20 text-primary';
      case 'failed':
        return 'bg-red-500/20 text-red-500';
      case 'running':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const formatJobType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflow Jobs</h2>
          <p className="text-gray-400">Monitor your automated content workflows</p>
        </div>
        {tenantUser && (
          <form action="/api/webhook/trigger" method="POST">
            <input type="hidden" name="tenant_id" value={tenantUser.tenant_id} />
            <input type="hidden" name="event" value="manual_trigger" />
            <Button type="submit" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Trigger Workflow
            </Button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-400">Total Jobs</p>
          <p className="text-2xl font-bold text-white">{jobs.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-primary">
            {jobs.filter(j => j.status === 'completed').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400">Running</p>
          <p className="text-2xl font-bold text-yellow-500">
            {jobs.filter(j => j.status === 'running' || j.status === 'pending').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-500">
            {jobs.filter(j => j.status === 'failed').length}
          </p>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Job History</h3>
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No jobs yet</p>
            <p className="text-sm text-gray-500">
              Jobs will appear here once your automated workflows start running.
            </p>
            <Link href="/onboarding">
              <Button variant="outline" className="mt-4">
                Complete Onboarding
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-300">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Started</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Finished</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Result</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-dark-300 hover:bg-dark-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white">{formatJobType(job.job_type)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-400">
                        {new Date(job.started_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-400">
                        {job.finished_at
                          ? new Date(job.finished_at).toLocaleString()
                          : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {job.blog_post_url ? (
                        <a
                          href={job.blog_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-light"
                        >
                          View Post
                        </a>
                      ) : job.error ? (
                        <span className="text-red-500 text-sm">{job.error}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
