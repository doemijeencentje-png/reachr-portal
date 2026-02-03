'use client';

import { useState } from 'react';
import { Input } from '@/components/ui';
import { X } from 'lucide-react';
import type { OnboardingData, WebsiteProfile } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const TONE_OPTIONS: { value: WebsiteProfile['tone_of_voice']; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, authoritative, trustworthy' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, approachable, conversational' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, helpful, encouraging' },
  { value: 'expert', label: 'Expert', description: 'Technical, knowledgeable, detailed' },
  { value: 'playful', label: 'Playful', description: 'Fun, witty, engaging' },
];

export default function StepToneOfVoice({ data, updateData }: StepProps) {
  const [newPhrase, setNewPhrase] = useState('');

  const addDoNotSay = () => {
    if (!newPhrase.trim()) return;
    updateData({
      do_not_say: [...data.do_not_say, newPhrase.trim()],
    });
    setNewPhrase('');
  };

  const removeDoNotSay = (index: number) => {
    updateData({
      do_not_say: data.do_not_say.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Tone of Voice</h2>
        <p className="text-gray-500">
          Set the personality and style for your content.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select your brand voice
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateData({ tone_of_voice: option.value })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.tone_of_voice === option.value
                  ? 'tone-selected border-[var(--primary)]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <p className={`font-medium ${data.tone_of_voice === option.value ? 'text-[var(--primary-dark)]' : 'text-gray-900'}`}>
                {option.label}
              </p>
              <p className="text-sm text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Do Not Say List
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Add words or phrases that should never appear in your content.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {data.do_not_say.map((phrase, index) => (
            <span
              key={index}
              className="tag-glow inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm border border-red-200"
            >
              {phrase}
              <button
                onClick={() => removeDoNotSay(index)}
                className="hover:text-red-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g., 'cheap', 'best in the world', 'guaranteed'"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDoNotSay())}
            className="bg-gray-50 border-gray-300"
          />
          <button
            onClick={addDoNotSay}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-[var(--primary-dark)] mb-2">Common phrases to avoid:</h3>
        <div className="flex flex-wrap gap-2">
          {['cheap', 'best', 'guaranteed results', '#1', 'world-class', 'game-changing'].map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                if (!data.do_not_say.includes(phrase)) {
                  updateData({ do_not_say: [...data.do_not_say, phrase] });
                }
              }}
              className="px-2 py-1 text-xs bg-white text-gray-600 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              + {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
