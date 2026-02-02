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
        <h2 className="text-xl font-semibold text-white mb-2">Tone of Voice</h2>
        <p className="text-gray-400">
          Set the personality and style for your content.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select your brand voice
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateData({ tone_of_voice: option.value })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                data.tone_of_voice === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-dark-300 hover:border-dark-200'
              }`}
            >
              <p className={`font-medium ${data.tone_of_voice === option.value ? 'text-primary' : 'text-white'}`}>
                {option.label}
              </p>
              <p className="text-sm text-gray-400">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Do Not Say List
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Add words or phrases that should never appear in your content.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {data.do_not_say.map((phrase, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
            >
              {phrase}
              <button
                onClick={() => removeDoNotSay(index)}
                className="hover:text-red-300"
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
          />
          <button
            onClick={addDoNotSay}
            className="px-4 py-2 bg-dark-200 text-white rounded-lg hover:bg-dark-300 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary mb-2">Common phrases to avoid:</h3>
        <div className="flex flex-wrap gap-2">
          {['cheap', 'best', 'guaranteed results', '#1', 'world-class', 'game-changing'].map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                if (!data.do_not_say.includes(phrase)) {
                  updateData({ do_not_say: [...data.do_not_say, phrase] });
                }
              }}
              className="px-2 py-1 text-xs bg-dark-300 text-gray-400 rounded hover:bg-dark-100 transition-colors"
            >
              + {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
