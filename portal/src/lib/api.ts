// portal/src/lib/api.ts
// Typed fetch wrappers for GeoCollect API.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const GEO_API_URL = process.env.NEXT_PUBLIC_GEO_API_URL || 'http://localhost:3002';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Check both cookie and localStorage for compatibility
  const fromStorage = localStorage.getItem('gc_token');
  if (fromStorage) return fromStorage;
  // Fallback: parse gc_token cookie
  const match = document.cookie.match(/(?:^|;\s*)gc_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProjects: () => apiFetch<any[]>('/portal/projects'),
  getProjectFeatures: (id: string, params?: { bbox?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<any>(`/portal/projects/${id}/features${qs ? `?${qs}` : ''}`);
  },
  getPortalConfig: (projectId: string) => apiFetch<any>(`/portal/config/${projectId}`),
  savePortalConfig: (projectId: string, body: any) =>
    apiFetch(`/portal/config/${projectId}`, { method: 'PUT', body: JSON.stringify(body) }),

  // API Keys
  createApiKey: (body: any) => apiFetch('/portal/api-keys', { method: 'POST', body: JSON.stringify(body) }),
  getApiKeys: (projectId: string) => apiFetch<any[]>(`/portal/api-keys?project_id=${projectId}`),
  revokeApiKey: (id: string) => apiFetch(`/portal/api-keys/${id}`, { method: 'DELETE' }),

  // Webhooks
  createWebhook: (body: any) => apiFetch('/portal/webhooks', { method: 'POST', body: JSON.stringify(body) }),
  getWebhooks: (projectId: string) => apiFetch<any[]>(`/portal/webhooks?project_id=${projectId}`),
  deleteWebhook: (id: string) => apiFetch(`/portal/webhooks/${id}`, { method: 'DELETE' }),
  testWebhook: (id: string) => apiFetch(`/portal/webhooks/${id}/test`, { method: 'POST' }),
  getDeliveries: (id: string) => apiFetch<any[]>(`/portal/webhooks/${id}/deliveries`),

  // Scheduled exports
  createScheduledExport: (body: any) => apiFetch('/portal/exports/scheduled', { method: 'POST', body: JSON.stringify(body) }),
  getScheduledExports: (projectId: string) => apiFetch<any[]>(`/portal/exports/scheduled?project_id=${projectId}`),
  deleteScheduledExport: (id: string) => apiFetch(`/portal/exports/scheduled/${id}`, { method: 'DELETE' }),

  // Public share
  getShareForm: (token: string) => apiFetch<any>(`/forms/share/${token}`),

  // Export (via geo-api)
  exportFeatures: (projectId: string, format: string) =>
    fetch(`${GEO_API_URL}/export/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, format }),
    }),
};
