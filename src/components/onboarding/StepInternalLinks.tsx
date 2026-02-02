'use client';

import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';
import type { OnboardingData, InternalLink } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function StepInternalLinks({ data, updateData }: StepProps) {
  const [newLink, setNewLink] = useState<InternalLink>({
    url: '',
    anchor_text: '',
    priority: 5,
  });

  const addLink = () => {
    if (!newLink.url || !newLink.anchor_text) return;
    updateData({
      internal_links: [...data.internal_links, newLink],
    });
    setNewLink({ url: '', anchor_text: '', priority: 5 });
  };

  const removeLink = (index: number) => {
    updateData({
      internal_links: data.internal_links.filter((_, i) => i !== index),
    });
  };

  const updateLinkPriority = (index: number, priority: number) => {
    const updated = data.internal_links.map((link, i) =>
      i === index ? { ...link, priority } : link
    );
    updateData({ internal_links: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Internal Links</h2>
        <p className="text-gray-400">
          Add important pages that should be linked to in your content.
        </p>
      </div>

      {/* Existing Links */}
      {data.internal_links.length > 0 && (
        <div className="space-y-3">
          {data.internal_links.map((link, index) => (
            <div
              key={index}
              className="p-4 bg-dark-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">{link.anchor_text}</p>
                  <p className="text-sm text-gray-400">{link.url}</p>
                </div>
                <button
                  onClick={() => removeLink(index)}
                  className="text-red-500 hover:text-red-400 ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Priority: {link.priority}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={link.priority}
                  onChange={(e) => updateLinkPriority(index, parseInt(e.target.value))}
                  className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Link */}
      <div className="p-4 border-2 border-dashed border-dark-300 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Add New Link</h3>
        <div className="space-y-3">
          <Input
            placeholder="Page URL (e.g., /services/seo)"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
          />
          <Input
            placeholder="Anchor text (e.g., our SEO services)"
            value={newLink.anchor_text}
            onChange={(e) => setNewLink({ ...newLink, anchor_text: e.target.value })}
          />
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Priority: {newLink.priority}/10 (higher = more important)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newLink.priority}
              onChange={(e) => setNewLink({ ...newLink, priority: parseInt(e.target.value) })}
              className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <Button variant="outline" onClick={addLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </div>
      </div>

      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary mb-2">Tips:</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Add your most important service/product pages</li>
          <li>• Include contact and about pages</li>
          <li>• Use natural anchor text that describes the page</li>
          <li>• Higher priority links will be used more frequently</li>
        </ul>
      </div>
    </div>
  );
}
