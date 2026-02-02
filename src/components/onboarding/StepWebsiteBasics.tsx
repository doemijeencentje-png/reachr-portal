'use client';

import { Input } from '@/components/ui';
import type { OnboardingData } from '@/types/database';

const INDUSTRIES = [
  'Technology',
  'E-commerce',
  'Healthcare',
  'Finance',
  'Education',
  'Real Estate',
  'Marketing',
  'Legal',
  'Consulting',
  'Manufacturing',
  'Retail',
  'Travel',
  'Food & Beverage',
  'Other',
];

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function StepWebsiteBasics({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Website Basics</h2>
        <p className="text-gray-400">Tell us about your website and company.</p>
      </div>

      <Input
        label="Website URL"
        type="url"
        placeholder="https://yourwebsite.com"
        value={data.website_url}
        onChange={(e) => updateData({ website_url: e.target.value })}
        helperText="Enter your main website URL"
      />

      <Input
        label="Company Name"
        type="text"
        placeholder="Your Company"
        value={data.company_name}
        onChange={(e) => updateData({ company_name: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Industry
        </label>
        <select
          value={data.industry}
          onChange={(e) => updateData({ industry: e.target.value })}
          className="w-full px-4 py-2.5 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Select an industry</option>
          {INDUSTRIES.map((industry) => (
            <option key={industry} value={industry.toLowerCase()}>
              {industry}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
