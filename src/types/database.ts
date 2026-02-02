export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  // Workflow settings (from migration 002)
  workflow_enabled?: boolean;
  workflow_paused?: boolean;
  posts_per_week?: number;
  performance_threshold?: number;
  monitoring_hours?: number;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface ProductService {
  name: string;
  description: string;
  features: string[];
}

export interface InternalLink {
  url: string;
  anchor_text: string;
  priority: number;
}

export interface Competitor {
  url: string;
  name: string;
}

export interface WebsiteProfile {
  id: string;
  tenant_id: string;
  website_url: string | null;
  company_name: string | null;
  industry: string | null;
  products_services: ProductService[];
  target_audience: string | null;
  tone_of_voice: 'professional' | 'casual' | 'friendly' | 'expert' | 'playful';
  do_not_say: string[];
  seed_keywords: string[];
  competitors: Competitor[];
  internal_links: InternalLink[];
  geo_targets: string[];
  languages: string[];
  full_html: string | null;
  onboarding_completed: boolean;
  last_updated: string;
}

export interface Integration {
  id: string;
  tenant_id: string;
  wordpress_base_url: string | null;
  wordpress_username: string | null;
  wordpress_app_password_encrypted: string | null;
  ga4_property_id: string | null;
  gsc_site_url: string | null;
  webhook_url: string | null;
  created_at: string;
  // Stats provider (from migration 002)
  stats_provider?: 'ga4' | 'jetpack' | 'matomo' | 'plausible' | null;
  jetpack_site_id?: string | null;
  matomo_site_id?: string | null;
  matomo_url?: string | null;
  slack_webhook_url?: string | null;
  slack_channel?: string | null;
}

export interface WorkflowJob {
  id: string;
  tenant_id: string;
  job_type: 'create_post' | 'monitor' | 'optimize' | 'delete';
  status: 'pending' | 'running' | 'completed' | 'failed';
  blog_post_url: string | null;
  metrics: {
    views?: number;
    created_at?: string;
    last_checked?: string;
  } | null;
  started_at: string;
  finished_at: string | null;
  error: string | null;
}

// Onboarding form data
export interface OnboardingData {
  // Step 1: Website Basics
  website_url: string;
  company_name: string;
  industry: string;

  // Step 2: Products & Services
  products_services: ProductService[];

  // Step 3: Target Audience
  target_audience: string;

  // Step 4: Tone of Voice
  tone_of_voice: WebsiteProfile['tone_of_voice'];
  do_not_say: string[];

  // Step 5: Keywords & Competition
  seed_keywords: string[];
  competitors: Competitor[];
  geo_targets: string[];
  languages: string[];

  // Step 6: Internal Links
  internal_links: InternalLink[];

  // Step 7: Full HTML
  full_html: string;

  // Step 8: WordPress Integration
  wordpress_base_url: string;
  wordpress_username: string;
  wordpress_app_password: string;
}

// API Response types
export interface TenantConfig {
  tenant: Tenant;
  profile: WebsiteProfile;
  integration: Integration;
}

export interface TopicSeedPack {
  primary_topics: string[];
  secondary_topics: string[];
  forbidden_topics: string[];
  brand_voice_rules: {
    tone: string;
    do_not_say: string[];
    example_phrases: string[];
  };
}

// ============================================
// Content Workflow Types (from migration 002)
// ============================================

export type ContentStatus =
  | 'draft'
  | 'publishing'
  | 'published'
  | 'monitoring'
  | 'evaluating'
  | 'optimizing'
  | 'optimized'
  | 'taking_offline'
  | 'offline'
  | 'failed';

export interface ContentSource {
  url: string;
  title: string;
  quoteUsed?: string;
  relevance?: string;
}

export interface Referrer {
  source: string;
  count: number;
}

export interface ContentItem {
  id: string;
  tenant_id: string;

  // Content
  title: string;
  slug: string | null;
  content: string | null;
  meta_description: string | null;
  sources: ContentSource[];
  internal_links_used: string[];

  // Topic info
  topic: string | null;
  topic_angle: string | null;
  keywords_targeted: string[];

  // WordPress sync
  wp_post_id: number | null;
  wp_post_url: string | null;

  // State machine
  status: ContentStatus;

  // Timing
  created_at: string;
  published_at: string | null;
  monitoring_ends_at: string | null;
  evaluated_at: string | null;
  optimized_at: string | null;

  // Performance metrics
  views_at_72h: number | null;
  referrers: Referrer[] | null;

  // Versioning
  version: number;
  previous_version_id: string | null;

  // Error tracking
  last_error: string | null;
  error_count: number;
}

export interface TopicLog {
  id: string;
  tenant_id: string;
  topic: string;
  topic_angle: string | null;
  keywords: string[];
  success: boolean | null;
  views_achieved: number | null;
  content_item_id: string | null;
  used_at: string;
}

export type WorkflowRunType =
  | 'daily_creation'
  | 'retry_creation'
  | 'monitoring_check'
  | 'optimization'
  | 'takedown';

export type WorkflowRunStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface WorkflowRun {
  id: string;
  tenant_id: string;
  run_type: WorkflowRunType;
  status: WorkflowRunStatus;
  started_at: string;
  finished_at: string | null;
  content_item_id: string | null;
  result_summary: string | null;
  error_details: string | null;
  triggered_by: 'cron' | 'manual' | 'retry' | 'webhook';
}

// ============================================
// AI API Types
// ============================================

export interface ResearchRequest {
  tenantId: string;
}

export interface ResearchResponse {
  success: boolean;
  research: {
    topic: string;
    angle: string;
    keywords: string[];
    sources: ContentSource[];
    reasoning: string;
  };
  tenantId: string;
}

export interface GenerateRequest {
  tenantId: string;
  topic: string;
  angle?: string;
  keywords?: string[];
  sources?: ContentSource[];
}

export interface GenerateResponse {
  success: boolean;
  contentItem: {
    id: string;
    title: string;
    slug: string;
    metaDescription: string;
    content: string;
    sources: ContentSource[];
    internalLinks: string[];
  };
  tenantId: string;
}

export interface EvaluateRequest {
  contentItemId: string;
  views: number;
  referrers?: Referrer[];
}

export interface EvaluateResponse {
  success: boolean;
  evaluation: {
    contentItemId: string;
    decision: 'optimize' | 'takedown';
    views: number;
    threshold: number;
    referrers: Referrer[];
    reason: string;
  };
}

export interface OptimizeRequest {
  contentItemId: string;
  performanceData?: {
    views: number;
    referrers: Referrer[];
  };
}

export interface OptimizeResponse {
  success: boolean;
  contentItem: {
    id: string;
    title: string;
    slug: string;
    metaDescription: string;
    content: string;
    version: number;
  };
  changes: {
    explanation: string;
    areas: string[];
  };
  tenantId: string;
}
