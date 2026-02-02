'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import StepWebsiteBasics from '@/components/onboarding/StepWebsiteBasics';
import StepProductsServices from '@/components/onboarding/StepProductsServices';
import StepTargetAudience from '@/components/onboarding/StepTargetAudience';
import StepToneOfVoice from '@/components/onboarding/StepToneOfVoice';
import StepKeywords from '@/components/onboarding/StepKeywords';
import StepInternalLinks from '@/components/onboarding/StepInternalLinks';
import StepFullHtml from '@/components/onboarding/StepFullHtml';
import StepWordPress from '@/components/onboarding/StepWordPress';
import StepReview from '@/components/onboarding/StepReview';
import type { OnboardingData, WebsiteProfile } from '@/types/database';

const STEPS = [
  { id: 1, name: 'Website Basics', component: StepWebsiteBasics },
  { id: 2, name: 'Products & Services', component: StepProductsServices },
  { id: 3, name: 'Target Audience', component: StepTargetAudience },
  { id: 4, name: 'Tone of Voice', component: StepToneOfVoice },
  { id: 5, name: 'Keywords', component: StepKeywords },
  { id: 6, name: 'Internal Links', component: StepInternalLinks },
  { id: 7, name: 'Website HTML', component: StepFullHtml },
  { id: 8, name: 'WordPress', component: StepWordPress },
  { id: 9, name: 'Review', component: StepReview },
];

const initialData: OnboardingData = {
  website_url: '',
  company_name: '',
  industry: '',
  products_services: [],
  target_audience: '',
  tone_of_voice: 'professional',
  do_not_say: [],
  seed_keywords: [],
  competitors: [],
  geo_targets: [],
  languages: ['en'],
  internal_links: [],
  full_html: '',
  wordpress_base_url: '',
  wordpress_username: '',
  wordpress_app_password: '',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (tenantUser) {
        setTenantId(tenantUser.tenant_id);

        const { data: profile } = await supabase
          .from('website_profiles')
          .select('*')
          .eq('tenant_id', tenantUser.tenant_id)
          .single();

        const { data: integration } = await supabase
          .from('integrations')
          .select('*')
          .eq('tenant_id', tenantUser.tenant_id)
          .single();

        if (profile) {
          setFormData({
            website_url: profile.website_url || '',
            company_name: profile.company_name || '',
            industry: profile.industry || '',
            products_services: profile.products_services || [],
            target_audience: profile.target_audience || '',
            tone_of_voice: profile.tone_of_voice || 'professional',
            do_not_say: profile.do_not_say || [],
            seed_keywords: profile.seed_keywords || [],
            competitors: profile.competitors || [],
            geo_targets: profile.geo_targets || [],
            languages: profile.languages || ['en'],
            internal_links: profile.internal_links || [],
            full_html: profile.full_html || '',
            wordpress_base_url: integration?.wordpress_base_url || '',
            wordpress_username: integration?.wordpress_username || '',
            wordpress_app_password: '',
          });
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const updateFormData = (data: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const saveProgress = async () => {
    if (!tenantId) return;
    setIsSaving(true);

    const supabase = createClient();

    const profileData: Partial<WebsiteProfile> = {
      website_url: formData.website_url,
      company_name: formData.company_name,
      industry: formData.industry,
      products_services: formData.products_services,
      target_audience: formData.target_audience,
      tone_of_voice: formData.tone_of_voice,
      do_not_say: formData.do_not_say,
      seed_keywords: formData.seed_keywords,
      competitors: formData.competitors,
      geo_targets: formData.geo_targets,
      languages: formData.languages,
      internal_links: formData.internal_links,
      full_html: formData.full_html,
      last_updated: new Date().toISOString(),
    };

    await supabase
      .from('website_profiles')
      .update(profileData)
      .eq('tenant_id', tenantId);

    setIsSaving(false);
  };

  const handleNext = async () => {
    await saveProgress();
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!tenantId) return;
    setIsSaving(true);

    const supabase = createClient();

    // Save final profile data
    await supabase
      .from('website_profiles')
      .update({
        ...formData,
        onboarding_completed: true,
        last_updated: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId);

    // Save WordPress integration if provided
    if (formData.wordpress_base_url && formData.wordpress_username && formData.wordpress_app_password) {
      const response = await fetch('/api/wordpress/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          wordpress_base_url: formData.wordpress_base_url,
          wordpress_username: formData.wordpress_username,
          wordpress_app_password: formData.wordpress_app_password,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save WordPress credentials');
      }
    }

    // Trigger n8n webhook
    await fetch('/api/webhook/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        event: 'profile_activated',
      }),
    });

    setIsSaving(false);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all
                  ${currentStep === step.id
                    ? 'bg-primary text-dark'
                    : currentStep > step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-dark-200 text-gray-500'
                  }
                `}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-full h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-primary' : 'bg-dark-200'
                  }`}
                  style={{ width: '40px' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <p className="text-white font-medium">{STEPS[currentStep - 1].name}</p>
          <p className="text-sm text-gray-400">Step {currentStep} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CurrentStepComponent
          data={formData}
          updateData={updateFormData}
          tenantId={tenantId}
        />
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {isSaving && (
          <span className="text-sm text-gray-400">Saving...</span>
        )}

        {currentStep === STEPS.length ? (
          <Button onClick={handleComplete} isLoading={isSaving}>
            Complete & Activate
          </Button>
        ) : (
          <Button onClick={handleNext} isLoading={isSaving} className="flex items-center gap-2">
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
