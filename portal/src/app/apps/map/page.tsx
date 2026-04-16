// portal/src/app/apps/map/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function MapViewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultLayer = searchParams.get('layer');

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(defaultLayer || '');
  const [features, setFeatures] = useState<any>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    setLoadingFeatures(true);
    setFeatures(null);
    api.getProjectFeatures(selectedId)
      .then(setFeatures)
      .finally(() => setLoadingFeatures(false));
  }, [selectedId]);

  const selected = projects.find(p => p.id === selectedId);

  return (
    <AppShell activeApp="map" title="Map Viewer">
      <div style={{ display: 'flex', height: 'calc(100vh - 52px)', position: 'relative' }}>

        {/* Layer sidebar */}
        <div style={{
          width: sidebarOpen ? '280px' : '0',
          flexShrink: 0, background: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', transition: 'width 0.2s ease',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Feature Layers
            </div>
            {loadingProjects ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ height: '44px', background: '#f8fafc', borderRadius: '8px' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {projects.map(p => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    background: selectedId === p.id ? '#eff6ff' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { if (selectedId !== p.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (selectedId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedId === p.id ? '#3b82f6' : '#cbd5e1', flexShrink: 0, transition: 'background 0.15s' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: selectedId === p.id ? 600 : 400, color: selectedId === p.id ? '#1d4ed8' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{Number(p.feature_count || 0).toLocaleString()} features</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected layer info */}
          {selected && (
            <div style={{ padding: '16px', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Active Layer</div>
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{selected.name}</div>
                {selected.description && <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', lineHeight: 1.5 }}>{selected.description}</div>}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: '100px' }}>
                    {loadingFeatures ? '...' : `${(features?.features?.length ?? 0).toLocaleString()} features`}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: selected.status === 'active' ? '#2563eb' : '#64748b', background: selected.status === 'active' ? '#eff6ff' : '#f8fafc', padding: '2px 8px', borderRadius: '100px' }}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle sidebar button */}
        <button onClick={() => setSidebarOpen(v => !v)} style={{
          position: 'absolute', left: sidebarOpen ? '268px' : '0', top: '50%', transform: 'translateY(-50%)',
          zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 8px 8px 0',
          width: '20px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)', transition: 'left 0.2s ease', color: '#64748b',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? <path d="m15 18-6-6 6-6"/> : <path d="m9 18 6-6-6-6"/>}
          </svg>
        </button>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loadingFeatures && (
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'white', borderRadius: '100px', padding: '8px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Loading layer...
            </div>
          )}
          {!selectedId ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/></svg>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Select a layer to view on the map</p>
            </div>
          ) : (
            <MapViewer features={features} />
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
