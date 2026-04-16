// portal/src/app/apps/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import WidgetGrid from '@/components/WidgetGrid';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultLayer = searchParams.get('layer');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(defaultLayer || '');
  const [features, setFeatures] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { router.push('/login'); return; }
    api.getProjects()
      .then((p: any[]) => { setProjects(p); if (!selectedId && p.length > 0) setSelectedId(p[0].id); })
      .catch(() => router.push('/login'))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingData(true);
    Promise.all([
      api.getProjectFeatures(selectedId),
      api.getPortalConfig(selectedId),
    ]).then(([fc, cfg]) => {
      setFeatures((fc as any)?.features ?? []);
      setConfig(cfg);
    }).finally(() => setLoadingData(false));
  }, [selectedId]);

  const selected = projects.find(p => p.id === selectedId);

  return (
    <AppShell activeApp="dashboard" title="Dashboards">
      <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

        {/* Left panel */}
        <div style={{ width: '240px', flexShrink: 0, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Layer
            </div>
            {loadingProjects ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[...Array(3)].map((_, i) => <div key={i} style={{ height: '40px', background: '#f8fafc', borderRadius: '8px' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {projects.map(p => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px',
                    borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: selectedId === p.id ? '#faf5ff' : 'transparent', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { if (selectedId !== p.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (selectedId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: selectedId === p.id ? '#7c3aed' : '#cbd5e1', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: selectedId === p.id ? 600 : 400, color: selectedId === p.id ? '#6d28d9' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{Number(p.feature_count || 0).toLocaleString()} features</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ background: '#faf5ff', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>{selected.name}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{features.length.toLocaleString()} features loaded</div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
          {!selectedId ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Select a layer to view its dashboard</p>
            </div>
          ) : loadingData ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: '#64748b', fontSize: '13px' }}>Loading dashboard...</span>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>{selected?.name}</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Dashboard · {features.length.toLocaleString()} features</p>
              </div>
              <WidgetGrid config={config} features={features} projectId={selectedId} />
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
