const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export interface WebhookPayload {
  event: 'profile_activated' | 'profile_updated' | 'manual_trigger';
  tenant_id: string;
  timestamp: string;
  config_url: string;
}

export async function triggerN8nWebhook(
  tenantId: string,
  event: WebhookPayload['event'] = 'profile_activated'
): Promise<{ success: boolean; error?: string }> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return { success: false, error: 'Webhook URL not configured' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const payload: WebhookPayload = {
    event,
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    config_url: `${baseUrl}/api/tenants/${tenantId}/config`,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to trigger n8n webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Re-export security functions for backwards compatibility
// New code should import directly from '@/lib/security'
export { verifyPortalApiKey, verifyRequest } from './security';
