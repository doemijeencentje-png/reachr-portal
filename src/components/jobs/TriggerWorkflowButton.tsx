'use client';

import { useState } from 'react';

export default function TriggerWorkflowButton({ tenantId }: { tenantId: string }) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setResult(null);

    try {
      const response = await fetch('/api/webhook/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          event: 'manual_trigger',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ type: 'success', message: 'Workflow triggered!' });
        setTimeout(() => setResult(null), 3000);
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to trigger workflow' });
      }
    } catch {
      setResult({ type: 'error', message: 'Network error' });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`text-sm font-medium ${result.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {result.message}
        </span>
      )}
      <button
        onClick={handleTrigger}
        disabled={isTriggering}
        className="btn-glow inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
      >
        {isTriggering ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Triggering...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Trigger Workflow
          </>
        )}
      </button>
    </div>
  );
}
