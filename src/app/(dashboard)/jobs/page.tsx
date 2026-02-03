import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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

  const formatJobType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const runningCount = jobs.filter(j => j.status === 'running' || j.status === 'pending').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workflow Jobs</h1>
          <p className="text-gray-500 mt-1">Monitor your automated content workflows</p>
        </div>
        {tenantUser && (
          <form action="/api/webhook/trigger" method="POST">
            <input type="hidden" name="tenant_id" value={tenantUser.tenant_id} />
            <input type="hidden" name="event" value="manual_trigger" />
            <button
              type="submit"
              className="btn-glow inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Trigger Workflow
            </button>
          </form>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">Total Jobs</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{jobs.length}</div>
        </div>

        <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">Completed</span>
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div className="text-3xl font-bold stat-green">{completedCount}</div>
        </div>

        <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">Running</span>
            <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div className="text-3xl font-bold stat-yellow">{runningCount}</div>
        </div>

        <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">Failed</span>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <div className="text-3xl font-bold text-red-500">{failedCount}</div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card-hover bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Job History</h3>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-gray-500 mb-2">No jobs yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Jobs will appear here once your automated workflows start running.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Complete Onboarding
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Started</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Finished</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Result</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {job.status === 'completed' ? (
                          <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                          </svg>
                        ) : job.status === 'failed' ? (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        ) : job.status === 'running' ? (
                          <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'completed' ? 'status-completed' :
                          job.status === 'failed' ? 'status-failed' :
                          job.status === 'running' ? 'status-running' : 'status-pending'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 font-medium">{formatJobType(job.job_type)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-500">
                        {new Date(job.started_at).toLocaleString('nl-NL')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-500">
                        {job.finished_at ? new Date(job.finished_at).toLocaleString('nl-NL') : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {job.blog_post_url ? (
                        <a
                          href={job.blog_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium"
                        >
                          View Post &rarr;
                        </a>
                      ) : job.error ? (
                        <span className="text-red-500 text-sm">{job.error}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
