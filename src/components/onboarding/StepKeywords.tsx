'use client';

import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { X, Plus, Trash2 } from 'lucide-react';
import type { OnboardingData, Competitor } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const GEO_OPTIONS = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'Netherlands', 'France', 'Spain', 'Italy', 'Belgium', 'Global',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Dutch' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
];

export default function StepKeywords({ data, updateData }: StepProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCompetitor, setNewCompetitor] = useState<Competitor>({ url: '', name: '' });

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    updateData({
      seed_keywords: [...data.seed_keywords, newKeyword.trim()],
    });
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    updateData({
      seed_keywords: data.seed_keywords.filter((_, i) => i !== index),
    });
  };

  const addCompetitor = () => {
    if (!newCompetitor.url || !newCompetitor.name) return;
    updateData({
      competitors: [...data.competitors, newCompetitor],
    });
    setNewCompetitor({ url: '', name: '' });
  };

  const removeCompetitor = (index: number) => {
    updateData({
      competitors: data.competitors.filter((_, i) => i !== index),
    });
  };

  const toggleGeoTarget = (geo: string) => {
    if (data.geo_targets.includes(geo)) {
      updateData({ geo_targets: data.geo_targets.filter((g) => g !== geo) });
    } else {
      updateData({ geo_targets: [...data.geo_targets, geo] });
    }
  };

  const toggleLanguage = (code: string) => {
    if (data.languages.includes(code)) {
      updateData({ languages: data.languages.filter((l) => l !== code) });
    } else {
      updateData({ languages: [...data.languages, code] });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Keywords & Competition</h2>
        <p className="text-gray-500">
          Define your target keywords and competitors for better content targeting.
        </p>
      </div>

      {/* Seed Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seed Keywords
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Add main keywords you want to rank for.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {data.seed_keywords.map((keyword, index) => (
            <span
              key={index}
              className="tag-glow inline-flex items-center gap-1 px-3 py-1 bg-[rgba(0,200,83,0.15)] text-[var(--primary-dark)] rounded-full text-sm"
            >
              {keyword}
              <button onClick={() => removeKeyword(index)} className="hover:text-[var(--primary)]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g., 'SEO services', 'content marketing'"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            className="bg-gray-50 border-gray-300"
          />
          <Button variant="secondary" onClick={addKeyword}>
            Add
          </Button>
        </div>
      </div>

      {/* Competitors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Competitors
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Add competitor websites to analyze their content strategy.
        </p>

        {data.competitors.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.competitors.map((competitor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="text-gray-900 font-medium">{competitor.name}</p>
                  <p className="text-sm text-gray-500">{competitor.url}</p>
                </div>
                <button
                  onClick={() => removeCompetitor(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Competitor name"
            value={newCompetitor.name}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
            className="bg-gray-50 border-gray-300"
          />
          <Input
            placeholder="https://competitor.com"
            value={newCompetitor.url}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
            className="bg-gray-50 border-gray-300"
          />
        </div>
        <Button variant="outline" size="sm" onClick={addCompetitor} className="mt-2">
          <Plus className="w-4 h-4 mr-1" />
          Add Competitor
        </Button>
      </div>

      {/* Geo Targets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Geographic Targets
        </label>
        <div className="flex flex-wrap gap-2">
          {GEO_OPTIONS.map((geo) => (
            <button
              key={geo}
              onClick={() => toggleGeoTarget(geo)}
              className={`tag-glow px-3 py-1 rounded-full text-sm transition-colors ${
                data.geo_targets.includes(geo)
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {geo}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={`tag-glow px-3 py-1 rounded-full text-sm transition-colors ${
                data.languages.includes(lang.code)
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
