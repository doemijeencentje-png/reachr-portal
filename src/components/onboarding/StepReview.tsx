'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import type { OnboardingData } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

interface ReviewSection {
  title: string;
  items: { label: string; value: string | boolean; required?: boolean }[];
}

export default function StepReview({ data }: StepProps) {
  const sections: ReviewSection[] = [
    {
      title: 'Website Basics',
      items: [
        { label: 'Website URL', value: data.website_url, required: true },
        { label: 'Company Name', value: data.company_name, required: true },
        { label: 'Industry', value: data.industry, required: true },
      ],
    },
    {
      title: 'Products & Services',
      items: [
        {
          label: 'Products/Services',
          value: data.products_services.length > 0
            ? data.products_services.map((p) => p.name).join(', ')
            : '',
          required: true,
        },
      ],
    },
    {
      title: 'Target Audience',
      items: [
        {
          label: 'Description',
          value: data.target_audience.length > 100
            ? data.target_audience.substring(0, 100) + '...'
            : data.target_audience,
          required: true,
        },
      ],
    },
    {
      title: 'Tone of Voice',
      items: [
        { label: 'Tone', value: data.tone_of_voice, required: true },
        { label: 'Do Not Say', value: data.do_not_say.join(', ') || 'None specified' },
      ],
    },
    {
      title: 'Keywords & Competition',
      items: [
        {
          label: 'Seed Keywords',
          value: data.seed_keywords.join(', ') || '',
          required: true,
        },
        {
          label: 'Competitors',
          value: data.competitors.length > 0
            ? data.competitors.map((c) => c.name).join(', ')
            : 'None specified',
        },
        { label: 'Geo Targets', value: data.geo_targets.join(', ') || 'None specified' },
        { label: 'Languages', value: data.languages.join(', ') || 'en' },
      ],
    },
    {
      title: 'Internal Links',
      items: [
        {
          label: 'Links',
          value: data.internal_links.length > 0
            ? `${data.internal_links.length} link(s) configured`
            : 'None specified',
        },
      ],
    },
    {
      title: 'Website HTML',
      items: [
        {
          label: 'HTML Content',
          value: data.full_html ? `${data.full_html.length.toLocaleString()} characters` : '',
        },
      ],
    },
    {
      title: 'WordPress Integration',
      items: [
        { label: 'Site URL', value: data.wordpress_base_url },
        { label: 'Username', value: data.wordpress_username },
        { label: 'Password', value: data.wordpress_app_password ? '••••••••' : '' },
      ],
    },
  ];

  const calculateCompleteness = () => {
    const requiredFields = [
      data.website_url,
      data.company_name,
      data.industry,
      data.products_services.length > 0,
      data.target_audience,
      data.tone_of_voice,
      data.seed_keywords.length > 0,
    ];
    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Review & Activate</h2>
        <p className="text-gray-400">
          Review your profile settings before activating automated content generation.
        </p>
      </div>

      {/* Completeness Score */}
      <div className="p-4 bg-dark-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Profile Completeness</span>
          <span className={`text-2xl font-bold ${completeness === 100 ? 'text-primary' : 'text-yellow-500'}`}>
            {completeness}%
          </span>
        </div>
        <div className="w-full bg-dark-300 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              completeness === 100 ? 'bg-primary' : 'bg-yellow-500'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="mt-2 text-sm text-yellow-500">
            Complete all required fields for best results.
          </p>
        )}
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="p-4 bg-dark-200 rounded-lg">
            <h3 className="text-sm font-medium text-primary mb-3">{section.title}</h3>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-start justify-between">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white text-right max-w-xs truncate">
                      {item.value || (
                        <span className="text-gray-500 italic">Not provided</span>
                      )}
                    </span>
                    {item.required && (
                      item.value ? (
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary mb-2">What happens next?</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Your profile will be activated for automated content generation</li>
          <li>• Our AI will analyze your website and competitors</li>
          <li>• Blog posts will be generated and published to your WordPress site</li>
          <li>• You can monitor progress from your dashboard</li>
        </ul>
      </div>
    </div>
  );
}
