-- Reachr - Content Workflow Schema
-- Migration 002: Adds tables for AI content generation and monitoring
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql

-- ============================================
-- 1. CONTENT ITEMS
-- Stores all generated blog posts and their state
-- ============================================
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  slug TEXT,
  content TEXT,                           -- The full article HTML/markdown
  meta_description TEXT,                  -- SEO meta description
  sources JSONB DEFAULT '[]',             -- [{url, title, quote_used}]
  internal_links_used JSONB DEFAULT '[]', -- Which internal links were included

  -- Topic info
  topic TEXT,                             -- The chosen topic
  topic_angle TEXT,                       -- Specific angle/approach
  keywords_targeted JSONB DEFAULT '[]',   -- Which keywords this targets

  -- WordPress sync
  wp_post_id INTEGER,                     -- Post ID in WordPress
  wp_post_url TEXT,                       -- Full URL to the post

  -- State machine
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Generated but not published
    'publishing',      -- Currently being published to WordPress
    'published',       -- Live on WordPress
    'monitoring',      -- In 72-hour monitoring window
    'evaluating',      -- Being evaluated after monitoring
    'optimizing',      -- Being optimized by AI
    'optimized',       -- Successfully optimized
    'taking_offline',  -- Being removed from WordPress
    'offline',         -- Removed due to poor performance
    'failed'           -- Something went wrong
  )),

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  monitoring_ends_at TIMESTAMPTZ,         -- published_at + 72 hours
  evaluated_at TIMESTAMPTZ,
  optimized_at TIMESTAMPTZ,

  -- Performance metrics (captured at 72h)
  views_at_72h INTEGER,
  referrers JSONB,                        -- [{source, count}]

  -- Versioning
  version INTEGER DEFAULT 1,              -- Increases with each optimization
  previous_version_id UUID,               -- Link to previous version if optimized

  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0
);

-- ============================================
-- 2. TOPIC LOGS
-- Anti-duplication: tracks all topics used per tenant
-- ============================================
CREATE TABLE topic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Topic info
  topic TEXT NOT NULL,
  topic_angle TEXT,
  keywords JSONB DEFAULT '[]',

  -- Outcome
  success BOOLEAN,                        -- true = ≥ threshold views, false = failed
  views_achieved INTEGER,

  -- Links
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,

  -- Timing
  used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent exact duplicates
  UNIQUE(tenant_id, topic)
);

-- ============================================
-- 3. WORKFLOW RUNS
-- Tracks each execution of the daily workflow per tenant
-- ============================================
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Run info
  run_type TEXT CHECK (run_type IN (
    'daily_creation',     -- Regular daily content creation
    'retry_creation',     -- Retry after failed post
    'monitoring_check',   -- Hourly monitoring check
    'optimization',       -- Optimization run
    'takedown'           -- Taking post offline
  )),

  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN (
    'running',
    'completed',
    'failed',
    'skipped'            -- E.g., if tenant is paused
  )),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,

  -- Results
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  result_summary TEXT,                    -- Human-readable summary
  error_details TEXT,

  -- Metadata
  triggered_by TEXT DEFAULT 'cron'        -- 'cron', 'manual', 'retry', 'webhook'
);

-- ============================================
-- 4. UPDATE INTEGRATIONS TABLE
-- Add fields for stats provider and Slack
-- ============================================
ALTER TABLE integrations
ADD COLUMN IF NOT EXISTS stats_provider TEXT CHECK (stats_provider IN ('ga4', 'jetpack', 'matomo', 'plausible')),
ADD COLUMN IF NOT EXISTS jetpack_site_id TEXT,
ADD COLUMN IF NOT EXISTS matomo_site_id TEXT,
ADD COLUMN IF NOT EXISTS matomo_url TEXT,
ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS slack_channel TEXT;

-- ============================================
-- 5. UPDATE TENANTS TABLE
-- Add workflow control fields
-- ============================================
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS workflow_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS workflow_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS posts_per_week INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS performance_threshold INTEGER DEFAULT 6,    -- Views needed to pass
ADD COLUMN IF NOT EXISTS monitoring_hours INTEGER DEFAULT 72;        -- Hours to monitor

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX idx_content_items_tenant_id ON content_items(tenant_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_monitoring ON content_items(status, monitoring_ends_at)
  WHERE status = 'monitoring';
CREATE INDEX idx_topic_logs_tenant_id ON topic_logs(tenant_id);
CREATE INDEX idx_topic_logs_topic ON topic_logs(tenant_id, topic);
CREATE INDEX idx_workflow_runs_tenant_id ON workflow_runs(tenant_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- Content Items: Users can view/manage content for their tenants
CREATE POLICY "Users can view own content" ON content_items
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own content" ON content_items
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own content" ON content_items
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- Topic Logs: Users can view topic history for their tenants
CREATE POLICY "Users can view own topics" ON topic_logs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own topics" ON topic_logs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- Workflow Runs: Users can view workflow history for their tenants
CREATE POLICY "Users can view own workflow runs" ON workflow_runs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

-- ============================================
-- 8. SERVICE ROLE POLICIES
-- Allow n8n/backend to manage all data
-- ============================================

-- Content Items: Service role can do everything
CREATE POLICY "Service role full access content" ON content_items
  FOR ALL USING (auth.role() = 'service_role');

-- Topic Logs: Service role can do everything
CREATE POLICY "Service role full access topics" ON topic_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Workflow Runs: Service role can do everything
CREATE POLICY "Service role full access runs" ON workflow_runs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to get unused topics for a tenant
CREATE OR REPLACE FUNCTION get_unused_topics(p_tenant_id UUID)
RETURNS TABLE(used_topic TEXT, used_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT topic, topic_logs.used_at
  FROM topic_logs
  WHERE tenant_id = p_tenant_id
  ORDER BY topic_logs.used_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if topic was used
CREATE OR REPLACE FUNCTION is_topic_used(p_tenant_id UUID, p_topic TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM topic_logs
    WHERE tenant_id = p_tenant_id
    AND LOWER(topic) = LOWER(p_topic)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content items ready for evaluation
CREATE OR REPLACE FUNCTION get_items_to_evaluate()
RETURNS SETOF content_items AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM content_items
  WHERE status = 'monitoring'
  AND monitoring_ends_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active tenants for daily run
CREATE OR REPLACE FUNCTION get_active_tenants_for_workflow()
RETURNS TABLE(
  tenant_id UUID,
  tenant_name TEXT,
  posts_per_week INTEGER,
  performance_threshold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.posts_per_week,
    t.performance_threshold
  FROM tenants t
  WHERE t.status = 'active'
  AND t.workflow_enabled = TRUE
  AND t.workflow_paused = FALSE
  AND EXISTS (
    SELECT 1 FROM website_profiles wp
    WHERE wp.tenant_id = t.id
    AND wp.onboarding_completed = TRUE
  )
  AND EXISTS (
    SELECT 1 FROM integrations i
    WHERE i.tenant_id = t.id
    AND i.wordpress_base_url IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE!
-- ============================================
-- After running this migration:
-- 1. content_items: Stores all AI-generated blog posts
-- 2. topic_logs: Prevents topic duplication per tenant
-- 3. workflow_runs: Tracks each workflow execution
-- 4. integrations: Now has stats provider and Slack fields
-- 5. tenants: Now has workflow control fields
