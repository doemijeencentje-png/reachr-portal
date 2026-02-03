'use client';

import { Input } from '@/components/ui';
import type { OnboardingData } from '@/types/database';

const INDUSTRIES = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'e-commerce', label: 'E-commerce', icon: '🛒' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
  { value: 'consulting', label: 'Consulting', icon: '💼' },
  { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'retail', label: 'Retail', icon: '🏪' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'food', label: 'Food & Beverage', icon: '🍽️' },
  { value: 'other', label: 'Other', icon: '📦' },
];

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function StepWebsiteBasics({ data, updateData }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-slate-600">
          Vul de basisinformatie in over je website. Dit helpt ons om relevante content te genereren die past bij jouw merk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Website URL"
            type="url"
            placeholder="https://jouwwebsite.nl"
            value={data.website_url}
            onChange={(e) => updateData({ website_url: e.target.value })}
            helperText="De hoofdpagina van je website"
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Bedrijfsnaam"
            type="text"
            placeholder="Jouw Bedrijf B.V."
            value={data.company_name}
            onChange={(e) => updateData({ company_name: e.target.value })}
            helperText="De officiële naam van je bedrijf"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Industrie
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Selecteer de industrie die het beste bij je bedrijf past
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {INDUSTRIES.map((industry) => (
            <button
              key={industry.value}
              type="button"
              onClick={() => updateData({ industry: industry.value })}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                ${data.industry === industry.value
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {data.industry === industry.value && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-2xl">{industry.icon}</span>
              <span className={`text-sm font-medium text-center ${
                data.industry === industry.value ? 'text-emerald-700' : 'text-slate-700'
              }`}>
                {industry.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Tip</h4>
            <p className="text-sm text-slate-600">
              Zorg ervoor dat je de juiste website URL invult. We gebruiken deze om je website te analyseren en relevante content suggesties te doen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
