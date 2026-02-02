import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Onboarding schemas
export const websiteBasicsSchema = z.object({
  website_url: z.string().url('Please enter a valid URL'),
  company_name: z.string().min(2, 'Company name is required'),
  industry: z.string().min(1, 'Please select an industry'),
});

export const productServiceSchema = z.object({
  name: z.string().min(1, 'Product/service name is required'),
  description: z.string().min(10, 'Please provide a description'),
  features: z.array(z.string()).min(1, 'Add at least one feature'),
});

export const productsServicesSchema = z.object({
  products_services: z.array(productServiceSchema).min(1, 'Add at least one product or service'),
});

export const targetAudienceSchema = z.object({
  target_audience: z.string().min(20, 'Please describe your target audience in detail'),
});

export const toneOfVoiceSchema = z.object({
  tone_of_voice: z.enum(['professional', 'casual', 'friendly', 'expert', 'playful']),
  do_not_say: z.array(z.string()),
});

export const competitorSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  name: z.string().min(1, 'Competitor name is required'),
});

export const keywordsCompetitionSchema = z.object({
  seed_keywords: z.array(z.string()).min(3, 'Add at least 3 seed keywords'),
  competitors: z.array(competitorSchema),
  geo_targets: z.array(z.string()).min(1, 'Select at least one geo target'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
});

export const internalLinkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  anchor_text: z.string().min(1, 'Anchor text is required'),
  priority: z.number().min(1).max(10),
});

export const internalLinksSchema = z.object({
  internal_links: z.array(internalLinkSchema),
});

export const fullHtmlSchema = z.object({
  full_html: z.string().min(100, 'Please paste your website HTML'),
});

export const wordpressIntegrationSchema = z.object({
  wordpress_base_url: z.string().url('Please enter a valid WordPress URL'),
  wordpress_username: z.string().min(1, 'Username is required'),
  wordpress_app_password: z.string().min(1, 'Application password is required'),
});

// API schemas
export const jobStatusSchema = z.object({
  tenant_id: z.string().uuid(),
  job_type: z.enum(['create_post', 'monitor', 'optimize', 'delete']),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  blog_post_url: z.string().url().optional(),
  metrics: z.object({
    views: z.number().optional(),
    created_at: z.string().optional(),
    last_checked: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
});

// Types derived from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type WebsiteBasicsInput = z.infer<typeof websiteBasicsSchema>;
export type ProductServiceInput = z.infer<typeof productServiceSchema>;
export type ProductsServicesInput = z.infer<typeof productsServicesSchema>;
export type TargetAudienceInput = z.infer<typeof targetAudienceSchema>;
export type ToneOfVoiceInput = z.infer<typeof toneOfVoiceSchema>;
export type KeywordsCompetitionInput = z.infer<typeof keywordsCompetitionSchema>;
export type InternalLinksInput = z.infer<typeof internalLinksSchema>;
export type FullHtmlInput = z.infer<typeof fullHtmlSchema>;
export type WordpressIntegrationInput = z.infer<typeof wordpressIntegrationSchema>;
export type JobStatusInput = z.infer<typeof jobStatusSchema>;
