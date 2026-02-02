'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Input } from '@/components/ui';
import { User, Building, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

  // WordPress form state
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400">Manage your account and integrations</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-primary/10 border border-primary/30 text-primary'
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Account Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Account</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Organization Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Building className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Organization</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Company Name</label>
            <p className="text-white">{tenant?.name}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Plan</label>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm capitalize">
                {tenant?.plan}
              </span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm capitalize">
                {tenant?.status}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* WordPress Integration */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">WordPress Integration</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="WordPress Site URL"
            type="url"
            placeholder="https://yourblog.com"
            value={wpUrl}
            onChange={(e) => {
              setWpUrl(e.target.value);
              setVerified(null);
            }}
          />
          <Input
            label="Username"
            type="text"
            placeholder="admin"
            value={wpUsername}
            onChange={(e) => {
              setWpUsername(e.target.value);
              setVerified(null);
            }}
          />
          <Input
            label="Application Password"
            type="password"
            placeholder="Enter new password to update"
            value={wpPassword}
            onChange={(e) => {
              setWpPassword(e.target.value);
              setVerified(null);
            }}
            helperText={integration?.wordpress_base_url ? 'Leave blank to keep existing password' : ''}
          />

          {verified === true && (
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              <span>Connection verified</span>
            </div>
          )}

          {verified === false && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>Connection failed</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={verifyWordPress}
              disabled={verifying || !wpUrl || !wpUsername || !wpPassword}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Connection'
              )}
            </Button>
            <Button
              onClick={saveWordPress}
              disabled={isSaving || !wpUrl || !wpUsername}
              isLoading={isSaving}
            >
              Save Credentials
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
