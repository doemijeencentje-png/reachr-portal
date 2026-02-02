'use client';

import type { OnboardingData } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function StepFullHtml({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Website HTML</h2>
        <p className="text-gray-400">
          Paste your homepage HTML so we can analyze your site structure and style.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full HTML Content
        </label>
        <textarea
          placeholder="Paste your homepage HTML here...

You can get this by:
1. Opening your website in a browser
2. Right-click anywhere on the page
3. Select 'View Page Source' or 'Inspect'
4. Copy all the HTML code"
          value={data.full_html}
          onChange={(e) => updateData({ full_html: e.target.value })}
          className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none h-80"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.full_html.length.toLocaleString()} characters
          </p>
          {data.full_html.length > 0 && (
            <button
              onClick={() => updateData({ full_html: '' })}
              className="text-sm text-red-500 hover:text-red-400"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary mb-2">Why do we need this?</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Analyze your current content structure</li>
          <li>• Match your existing writing style</li>
          <li>• Understand your navigation and layout</li>
          <li>• Identify existing internal links</li>
          <li>• Extract metadata and schema information</li>
        </ul>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-500 mb-1">Privacy Note</h3>
        <p className="text-sm text-gray-400">
          This HTML is only used to analyze your site structure and style.
          It&apos;s stored securely and never shared with third parties.
        </p>
      </div>
    </div>
  );
}
