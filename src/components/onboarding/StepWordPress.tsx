'use client';

import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import type { OnboardingData } from '@/types/database';

interface StepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  tenantId: string | null;
}

export default function StepWordPress({ data, updateData, tenantId }: StepProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const verifyConnection = async () => {
    if (!data.wordpress_base_url || !data.wordpress_username || !data.wordpress_app_password) {
      setError('Please fill in all fields');
      return;
    }

    setVerifying(true);
    setError('');
    setVerified(null);

    try {
      const response = await fetch('/api/wordpress/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordpress_base_url: data.wordpress_base_url,
          wordpress_username: data.wordpress_username,
          wordpress_app_password: data.wordpress_app_password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVerified(true);
      } else {
        setVerified(false);
        setError(result.error || 'Connection failed');
      }
    } catch {
      setVerified(false);
      setError('Failed to verify connection');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">WordPress Integration</h2>
        <p className="text-gray-400">
          Connect your WordPress site to automatically publish generated content.
        </p>
      </div>

      <Input
        label="WordPress Site URL"
        type="url"
        placeholder="https://yourblog.com"
        value={data.wordpress_base_url}
        onChange={(e) => {
          updateData({ wordpress_base_url: e.target.value });
          setVerified(null);
        }}
        helperText="Your WordPress site URL (without /wp-admin)"
      />

      <Input
        label="Username"
        type="text"
        placeholder="admin"
        value={data.wordpress_username}
        onChange={(e) => {
          updateData({ wordpress_username: e.target.value });
          setVerified(null);
        }}
        helperText="Your WordPress admin username"
      />

      <Input
        label="Application Password"
        type="password"
        placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
        value={data.wordpress_app_password}
        onChange={(e) => {
          updateData({ wordpress_app_password: e.target.value });
          setVerified(null);
        }}
        helperText="Generate this in WordPress under Users → Profile → Application Passwords"
      />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {verified === true && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg text-primary">
          <CheckCircle className="w-5 h-5" />
          <span>Connection verified successfully!</span>
        </div>
      )}

      {verified === false && !error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
          <XCircle className="w-5 h-5" />
          <span>Connection failed. Please check your credentials.</span>
        </div>
      )}

      <Button
        onClick={verifyConnection}
        disabled={verifying || !data.wordpress_base_url || !data.wordpress_username || !data.wordpress_app_password}
        variant={verified ? 'secondary' : 'primary'}
      >
        {verifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : verified ? (
          'Re-verify Connection'
        ) : (
          'Verify Connection'
        )}
      </Button>

      <div className="bg-dark-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary mb-2">How to get an Application Password:</h3>
        <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
          <li>Log in to your WordPress admin dashboard</li>
          <li>Go to Users → Profile</li>
          <li>Scroll down to &quot;Application Passwords&quot;</li>
          <li>Enter a name (e.g., &quot;Reachr&quot;) and click &quot;Add New&quot;</li>
          <li>Copy the generated password (spaces are optional)</li>
        </ol>
        <a
          href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:text-primary-light"
        >
          Learn more about Application Passwords
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-500 mb-1">Security Note</h3>
        <p className="text-sm text-gray-400">
          Your application password is encrypted before storage.
          We never store plain-text credentials.
        </p>
      </div>
    </div>
  );
}
