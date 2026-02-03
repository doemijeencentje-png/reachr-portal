'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TenantData {
  id: string;
  name: string;
  plan: string;
  status: string;
}

interface IntegrationData {
  wordpress_base_url: string | null;
  wordpress_username: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [integration, setIntegration] = useState<IntegrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        setUser({ email: authUser.email || '' });

        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', authUser.id)
          .single();

        if (tenantUser) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantUser.tenant_id)
            .single();

          if (tenantData) {
            setTenant(tenantData);
          }

          const { data: integrationData } = await supabase
            .from('integrations')
            .select('wordpress_base_url, wordpress_username')
            .eq('tenant_id', tenantUser.tenant_id)
            .single();

          if (integrationData) {
            setIntegration(integrationData);
            setWpUrl(integrationData.wordpress_base_url || '');
            setWpUsername(integrationData.wordpress_username || '');
          }
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const verifyWordPress = async () => {
    setVerifying(true);
    setVerified(null);
    setMessage(null);

    try {
      const response = await fetch('/api/wordpress/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordpress_base_url: wpUrl,
          wordpress_username: wpUsername,
          wordpress_app_password: wpPassword,
        }),
      });

      const result = await response.json();
      setVerified(result.success);

      if (!result.success) {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setVerified(false);
      setMessage({ type: 'error', text: 'Failed to verify connection' });
    } finally {
      setVerifying(false);
    }
  };

  const saveWordPress = async () => {
    if (!tenant) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/wordpress/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          wordpress_base_url: wpUrl,
          wordpress_username: wpUsername,
          wordpress_app_password: wpPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'WordPress credentials saved successfully' });
        setWpPassword('');
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save credentials' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and integrations</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 mb-6 ${
          message.type === 'success'
            ? 'bg-[rgba(0,200,83,0.1)] border border-[rgba(0,200,83,0.3)] text-[var(--primary-dark)]'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Account Settings */}
      <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[rgba(0,200,83,0.15)] rounded-lg flex items-center justify-center text-[var(--primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Account</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <p className="text-gray-900 font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Organization Settings */}
      <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[rgba(0,200,83,0.15)] rounded-lg flex items-center justify-center text-[var(--primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Company Name</label>
            <p className="text-gray-900 font-medium">{tenant?.name}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Plan</label>
              <span className="px-3 py-1 status-completed rounded-full text-sm capitalize font-medium">
                {tenant?.plan}
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Status</label>
              <span className="px-3 py-1 status-completed rounded-full text-sm capitalize font-medium">
                {tenant?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WordPress Integration */}
      <div className="card-hover bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[rgba(0,200,83,0.15)] rounded-lg flex items-center justify-center text-[var(--primary)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">WordPress Integration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WordPress Site URL</label>
            <input
              type="url"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 transition-all hover:border-gray-400"
              placeholder="https://yourblog.com"
              value={wpUrl}
              onChange={(e) => {
                setWpUrl(e.target.value);
                setVerified(null);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 transition-all hover:border-gray-400"
              placeholder="admin"
              value={wpUsername}
              onChange={(e) => {
                setWpUsername(e.target.value);
                setVerified(null);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Application Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 transition-all hover:border-gray-400"
              placeholder="Enter new password to update"
              value={wpPassword}
              onChange={(e) => {
                setWpPassword(e.target.value);
                setVerified(null);
              }}
            />
            {integration?.wordpress_base_url && (
              <p className="mt-1 text-sm text-gray-500">Leave blank to keep existing password</p>
            )}
          </div>

          {verified === true && (
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span className="font-medium">Connection verified</span>
            </div>
          )}

          {verified === false && (
            <div className="flex items-center gap-2 text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="font-medium">Connection failed</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={verifyWordPress}
              disabled={verifying || !wpUrl || !wpUsername || !wpPassword}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Connection'
              )}
            </button>
            <button
              onClick={saveWordPress}
              disabled={isSaving || !wpUrl || !wpUsername}
              className="btn-glow px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
