import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
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

  let profile = null;
  let jobs: { id: string; job_type: string; status: string; started_at: string }[] = [];
  let contentItems: { id: string; title: string; status: string; views_at_72h: number | null; published_at: string | null }[] = [];

  if (tenantUser) {
    const [profileRes, jobsRes, contentRes] = await Promise.all([
      supabase.from('website_profiles').select('*').eq('tenant_id', tenantUser.tenant_id).single(),
      supabase.from('workflow_jobs').select('*').eq('tenant_id', tenantUser.tenant_id).order('started_at', { ascending: false }).limit(5),
      supabase.from('content_items').select('*').eq('tenant_id', tenantUser.tenant_id).order('created_at', { ascending: false }).limit(5),
    ]);

    profile = profileRes.data;
    jobs = jobsRes.data || [];
    contentItems = contentRes.data || [];
  }

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
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const completeness = calculateCompleteness();
  const publishedPosts = contentItems.filter(item => item.status !== 'draft').length;
  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending').length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Welcome back!</h1>
        <Link
          href="/onboarding"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#00C853',
            color: 'white',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(0, 200, 83, 0.3)',
            transition: 'all 0.2s',
          }}
        >
          Complete Onboarding
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Profile Completeness */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Profile Completeness</span>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: completeness >= 100 ? '#00C853' : '#F59E0B',
              textShadow: completeness >= 100 ? '0 0 20px rgba(0, 200, 83, 0.5)' : 'none',
            }}>
              {completeness}%
            </span>
          </div>
          <div style={{
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            margin: '1rem 0',
          }}>
            <div style={{
              height: '100%',
              width: `${completeness}%`,
              backgroundColor: completeness >= 100 ? '#00C853' : '#F59E0B',
              borderRadius: '4px',
              transition: 'width 0.5s',
              boxShadow: completeness >= 100 ? '0 0 10px rgba(0, 200, 83, 0.5)' : '0 0 10px rgba(245, 158, 11, 0.4)',
            }} />
          </div>
          <Link
            href="/onboarding"
            style={{ color: '#00C853', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}
          >
            Complete your profile →
          </Link>
        </div>

        {/* Active Jobs */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Active Jobs</span>
            <svg style={{ width: '20px', height: '20px', color: '#00C853' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{activeJobs}</div>
          <Link
            href="/jobs"
            style={{ color: '#6b7280', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            View all jobs →
          </Link>
        </div>

        {/* Posts Created */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Posts Created</span>
            <svg style={{ width: '20px', height: '20px', color: '#00C853' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{publishedPosts}</div>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total blog posts published</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <Link
            href="/onboarding"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(0, 200, 83, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg style={{ width: '20px', height: '20px', color: '#00C853' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#111827' }}>Edit Profile</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Update your website info</div>
            </div>
          </Link>

          <Link
            href="/jobs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(0, 200, 83, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg style={{ width: '20px', height: '20px', color: '#00C853' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#111827' }}>View Jobs</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Monitor your workflows</div>
            </div>
          </Link>

          <Link
            href="/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(0, 200, 83, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg style={{ width: '20px', height: '20px', color: '#00C853' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: '#111827' }}>Settings</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Manage integrations</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Jobs */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Recent Jobs</h3>
        {jobs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {job.status === 'completed' ? (
                    <svg style={{ width: '20px', height: '20px', color: '#00C853' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : job.status === 'failed' ? (
                    <svg style={{ width: '20px', height: '20px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  ) : (
                    <svg style={{ width: '20px', height: '20px', color: '#F59E0B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  )}
                  <div>
                    <div style={{ fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>
                      {job.job_type.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(job.started_at).toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: job.status === 'completed' ? 'rgba(0, 200, 83, 0.15)' :
                    job.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' :
                    job.status === 'running' ? 'rgba(245, 158, 11, 0.15)' : '#e5e7eb',
                  color: job.status === 'completed' ? '#00A844' :
                    job.status === 'failed' ? '#dc2626' :
                    job.status === 'running' ? '#d97706' : '#4b5563',
                }}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.75rem', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <p>No jobs yet. Complete your profile to start generating content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
