import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkApiSecurity } from '@/lib/api-security';
import { jobStatusSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // Security check: rate limiting, IP whitelist, API key
  const security = await checkApiSecurity(request, { rateLimitType: 'webhook' });
  if (!security.authorized) {
    return security.response!;
  }

  try {
    const body = await request.json();

    // Validate input
    const result = jobStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 }
      );
    }

    const { tenant_id, job_type, status, blog_post_url, metrics, error } = result.data;

    const supabase = createAdminClient();

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Create or update job
    const jobData = {
      tenant_id,
      job_type,
      status,
      blog_post_url: blog_post_url || null,
      metrics: metrics || null,
      error: error || null,
      finished_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    };

    const { data: job, error: jobError } = await supabase
      .from('workflow_jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      job_id: job.id,
    });
  } catch (error) {
    console.error('Error in /api/jobs/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
