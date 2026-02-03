'use client';

import type { OnboardingData } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function StepTargetAudience({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Target Audience</h2>
        <p className="text-gray-500">
          Describe your ideal customers so we can tailor content to their needs.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Audience Description
        </label>
        <textarea
          placeholder="Describe your ideal customers...

For example:
- Small to medium business owners looking to improve their online presence
- Marketing managers at tech companies who need to scale content production
- E-commerce store owners who want to drive organic traffic
- Demographics: Age 30-50, decision-makers, budget-conscious
- Pain points: Not enough time to create content, struggling with SEO rankings"
          value={data.target_audience}
          onChange={(e) => updateData({ target_audience: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none h-64"
        />
        <p className="mt-2 text-sm text-gray-500">
          Be as detailed as possible. Include demographics, pain points, goals, and motivations.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-[var(--primary-dark)] mb-2">Tips for a good description:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Who makes the purchasing decisions?</li>
          <li>• What problems are they trying to solve?</li>
          <li>• What industry or niche are they in?</li>
          <li>• What is their budget range?</li>
          <li>• How do they find solutions like yours?</li>
        </ul>
      </div>
    </div>
  );
}
