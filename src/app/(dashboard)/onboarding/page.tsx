'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  { id: 1, name: 'Website', description: 'Basic information' },
  { id: 2, name: 'Products', description: 'Your offering' },
  { id: 3, name: 'Audience', description: 'Who you reach' },
  { id: 4, name: 'Tone', description: 'Your voice' },
  { id: 5, name: 'Keywords', description: 'SEO focus' },
  { id: 6, name: 'Links', description: 'Internal links' },
  { id: 7, name: 'HTML', description: 'Website code' },
  { id: 8, name: 'WordPress', description: 'Integration' },
  { id: 9, name: 'Review', description: 'Verify' },
];

const STEP_COMPONENTS = [
  StepWebsiteBasics,
  StepProductsServices,
  StepTargetAudience,
  StepToneOfVoice,
  StepKeywords,
  StepInternalLinks,
  StepFullHtml,
  StepWordPress,
  StepReview,
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

const STORAGE_KEY = 'reachr_onboarding_data';
const STEP_STORAGE_KEY = 'reachr_onboarding_step';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // Load saved step from localStorage on mount
  useEffect(() => {
    const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (step >= 1 && step <= STEPS.length) {
        setCurrentStep(step);
      }
    }
  }, []);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STEP_STORAGE_KEY, currentStep.toString());
  }, [currentStep]);

  // Save form data to localStorage whenever it changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Don't save password to localStorage for security
      const dataToSave = { ...formData, wordpress_app_password: '' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      // Show auto-saved indicator briefly
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [formData]);

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

        // First, try to load from localStorage (most recent unsaved changes)
        const savedData = localStorage.getItem(STORAGE_KEY);
        let localData: OnboardingData | null = null;

        if (savedData) {
          try {
            localData = JSON.parse(savedData);
          } catch (e) {
            console.error('Failed to parse saved data', e);
          }
        }

        // Then load from database
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

        // Merge: localStorage takes priority for non-empty values, then database
        const dbData: OnboardingData = {
          website_url: profile?.website_url || '',
          company_name: profile?.company_name || '',
          industry: profile?.industry || '',
          products_services: profile?.products_services || [],
          target_audience: profile?.target_audience || '',
          tone_of_voice: profile?.tone_of_voice || 'professional',
          do_not_say: profile?.do_not_say || [],
          seed_keywords: profile?.seed_keywords || [],
          competitors: profile?.competitors || [],
          geo_targets: profile?.geo_targets || [],
          languages: profile?.languages || ['en'],
          internal_links: profile?.internal_links || [],
          full_html: profile?.full_html || '',
          wordpress_base_url: integration?.wordpress_base_url || '',
          wordpress_username: integration?.wordpress_username || '',
          wordpress_app_password: '',
        };

        // Use localStorage data if it has more content, otherwise use database
        if (localData) {
          const mergedData: OnboardingData = { ...initialData };

          // For each field, use localStorage if it has content, otherwise use database
          (Object.keys(initialData) as (keyof OnboardingData)[]).forEach((key) => {
            const localValue = localData![key];
            const dbValue = dbData[key];

            // Check if localStorage has meaningful content
            const localHasContent = Array.isArray(localValue)
              ? localValue.length > 0
              : typeof localValue === 'string'
                ? localValue.length > 0
                : !!localValue;

            if (localHasContent) {
              (mergedData as Record<string, unknown>)[key] = localValue;
            } else {
              (mergedData as Record<string, unknown>)[key] = dbValue;
            }
          });

          setFormData(mergedData);
        } else {
          setFormData(dbData);
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

    await supabase
      .from('website_profiles')
      .update({
        ...formData,
        onboarding_completed: true,
        last_updated: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId);

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

    await fetch('/api/webhook/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        event: 'profile_activated',
      }),
    });

    // Clear localStorage after successful completion
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_STORAGE_KEY);

    setIsSaving(false);
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #00C853',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = STEP_COMPONENTS[currentStep - 1];

  // Check if each step has data filled in
  const isStepCompleted = (stepId: number): boolean => {
    switch (stepId) {
      case 1: // Website
        return !!(formData.website_url && formData.company_name && formData.industry);
      case 2: // Products
        return formData.products_services.length > 0 && formData.products_services.some(p => p.name);
      case 3: // Audience
        return !!formData.target_audience && formData.target_audience.length > 10;
      case 4: // Tone
        return !!formData.tone_of_voice;
      case 5: // Keywords
        return formData.seed_keywords.length > 0;
      case 6: // Links
        return formData.internal_links.length > 0;
      case 7: // HTML
        return !!formData.full_html && formData.full_html.length > 100;
      case 8: // WordPress
        return !!(formData.wordpress_base_url && formData.wordpress_username);
      case 9: // Review
        return false; // Review step is never "completed" with a checkmark
      default:
        return false;
    }
  };

  // Calculate progress based on completed steps
  const completedSteps = STEPS.filter(step => isStepCompleted(step.id)).length;
  const progress = (completedSteps / (STEPS.length - 1)) * 100; // -1 because Review doesn't count

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Profile Setup</h1>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>Step {currentStep} of {STEPS.length} - {STEPS[currentStep - 1].name}</p>
        </div>

        {/* Progress Circle */}
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#00C853"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progress) / 100}
              style={{ transition: 'all 0.5s', filter: 'drop-shadow(0 0 6px rgba(0, 200, 83, 0.5))' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
        {/* Steps sidebar */}
        <div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: '96px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {STEPS.map((step) => {
                const isCompleted = isStepCompleted(step.id);
                const isCurrent = currentStep === step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      border: isCurrent ? '1px solid rgba(0, 200, 83, 0.3)' : '1px solid transparent',
                      backgroundColor: isCurrent ? 'rgba(0, 200, 83, 0.1)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      backgroundColor: isCurrent ? '#00C853' : isCompleted ? 'rgba(0, 200, 83, 0.15)' : '#f3f4f6',
                      color: isCurrent ? '#ffffff' : isCompleted ? '#00C853' : '#6b7280',
                      boxShadow: isCurrent ? '0 0 20px rgba(0, 200, 83, 0.5)' : 'none',
                    }}>
                      {isCompleted ? (
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: isCurrent ? '#00A844' : '#374151',
                      }}>
                        {step.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            {/* Step header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                {STEPS[currentStep - 1].name}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{STEPS[currentStep - 1].description}</p>
            </div>

            {/* Step content */}
            <div style={{ padding: '24px' }}>
              <CurrentStepComponent
                data={formData}
                updateData={updateFormData}
                tenantId={tenantId}
              />
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                color: currentStep === 1 ? '#9ca3af' : '#4b5563',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1,
                transition: 'color 0.2s',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {autoSaved && !isSaving && (
                <span style={{
                  fontSize: '0.75rem',
                  color: '#00C853',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: 0.8,
                  transition: 'opacity 0.3s',
                }}>
                  <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Auto-saved
                </span>
              )}
              {isSaving && (
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #00C853',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Saving...
                </span>
              )}

              {currentStep === STEPS.length ? (
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#00C853',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                    boxShadow: '0 0 30px rgba(0, 200, 83, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSaving ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete & Activate
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#00C853',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.5 : 1,
                    boxShadow: '0 0 30px rgba(0, 200, 83, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSaving ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
