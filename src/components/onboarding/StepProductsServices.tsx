'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { Plus, Trash2, X } from 'lucide-react';
import type { OnboardingData, ProductService } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export default function StepProductsServices({ data, updateData }: StepProps) {
  const [newFeature, setNewFeature] = useState('');
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(
    data.products_services.length > 0 ? 0 : null
  );

  const addProduct = () => {
    const newProduct: ProductService = {
      name: '',
      description: '',
      features: [],
    };
    updateData({
      products_services: [...data.products_services, newProduct],
    });
    setActiveProductIndex(data.products_services.length);
  };

  const removeProduct = (index: number) => {
    const updated = data.products_services.filter((_, i) => i !== index);
    updateData({ products_services: updated });
    if (activeProductIndex === index) {
      setActiveProductIndex(updated.length > 0 ? 0 : null);
    } else if (activeProductIndex !== null && activeProductIndex > index) {
      setActiveProductIndex(activeProductIndex - 1);
    }
  };

  const updateProduct = (index: number, updates: Partial<ProductService>) => {
    const updated = data.products_services.map((product, i) =>
      i === index ? { ...product, ...updates } : product
    );
    updateData({ products_services: updated });
  };

  const addFeature = (productIndex: number) => {
    if (!newFeature.trim()) return;
    const product = data.products_services[productIndex];
    updateProduct(productIndex, {
      features: [...product.features, newFeature.trim()],
    });
    setNewFeature('');
  };

  const removeFeature = (productIndex: number, featureIndex: number) => {
    const product = data.products_services[productIndex];
    updateProduct(productIndex, {
      features: product.features.filter((_, i) => i !== featureIndex),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Products & Services</h2>
        <p className="text-slate-500">
          List your main products or services so we can create relevant content.
        </p>
      </div>

      {/* Product List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.products_services.map((product, index) => (
          <button
            key={index}
            onClick={() => setActiveProductIndex(index)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeProductIndex === index
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {product.name || `Product ${index + 1}`}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={addProduct}>
          <Plus className="w-4 h-4 mr-1" />
          Add Product
        </Button>
      </div>

      {/* Active Product Form */}
      {activeProductIndex !== null && data.products_services[activeProductIndex] && (
        <Card variant="bordered" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900">
              {data.products_services[activeProductIndex].name || 'New Product'}
            </h3>
            <button
              onClick={() => removeProduct(activeProductIndex)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <Input
            label="Product/Service Name"
            placeholder="e.g., Website Design"
            value={data.products_services[activeProductIndex].name}
            onChange={(e) => updateProduct(activeProductIndex, { name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Describe this product or service..."
              value={data.products_services[activeProductIndex].description}
              onChange={(e) => updateProduct(activeProductIndex, { description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Key Features
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {data.products_services[activeProductIndex].features.map((feature, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {feature}
                  <button
                    onClick={() => removeFeature(activeProductIndex, i)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a feature..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature(activeProductIndex))}
              />
              <Button variant="secondary" onClick={() => addFeature(activeProductIndex)}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      {data.products_services.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No products or services added yet.</p>
          <p className="text-sm">Click &quot;Add Product&quot; to get started.</p>
        </div>
      )}
    </div>
  );
}
