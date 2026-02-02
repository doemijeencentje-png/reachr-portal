-- SEO OP Client Portal - Initial Database Schema
-- Run this in Supabase SQL Editor

-- 1. Tenants (companies/organizations)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tenant Users (link users to tenants)
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- 3. Website Profiles (onboarding data)
CREATE TABLE website_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  website_url TEXT,
  company_name TEXT,
  industry TEXT,
  products_services JSONB DEFAULT '[]',
  target_audience TEXT,
  tone_of_voice TEXT DEFAULT 'professional' CHECK (tone_of_voice IN ('professional', 'casual', 'friendly', 'expert', 'playful')),
  do_not_say JSONB DEFAULT '[]',
  seed_keywords JSONB DEFAULT '[]',
  competitors JSONB DEFAULT '[]',
  internal_links JSONB DEFAULT '[]',
  geo_targets JSONB DEFAULT '[]',
  languages JSONB DEFAULT '["en"]',
  full_html TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Integrations (WordPress, analytics)
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  wordpress_base_url TEXT,
  wordpress_username TEXT,
  wordpress_app_password_encrypted TEXT,
  ga4_property_id TEXT,
  gsc_site_url TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Workflow Jobs (track n8n jobs)
CREATE TABLE workflow_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_type TEXT CHECK (job_type IN ('create_post', 'monitor', 'optimize', 'delete')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  blog_post_url TEXT,
  metrics JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error TEXT
);

-- Indexes for performance
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_workflow_jobs_tenant_id ON workflow_jobs(tenant_id);
CREATE INDEX idx_workflow_jobs_status ON workflow_jobs(status);

-- Row Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tenants: Users can only see tenants they belong to
CREATE POLICY "Users can view own tenants" ON tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own tenants" ON tenants
  FOR UPDATE USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Tenant Users: Users can see members of their tenants
CREATE POLICY "Users can view tenant members" ON tenant_users
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage tenant members" ON tenant_users
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Website Profiles: Users can manage profiles for their tenants
CREATE POLICY "Users can view own profiles" ON website_profiles
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own profiles" ON website_profiles
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own profiles" ON website_profiles
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- Integrations: Users can manage integrations for their tenants
CREATE POLICY "Users can view own integrations" ON integrations
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own integrations" ON integrations
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own integrations" ON integrations
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- Workflow Jobs: Users can view jobs for their tenants
CREATE POLICY "Users can view own jobs" ON workflow_jobs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own jobs" ON workflow_jobs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- Function to create tenant and link user on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Create a new tenant for the user
  INSERT INTO tenants (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email))
  RETURNING id INTO new_tenant_id;

  -- Link user to tenant as admin
  INSERT INTO tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, NEW.id, 'admin');

  -- Create empty website profile
  INSERT INTO website_profiles (tenant_id)
  VALUES (new_tenant_id);

  -- Create empty integrations record
  INSERT INTO integrations (tenant_id)
  VALUES (new_tenant_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
