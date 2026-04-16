// portal/src/app/content/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';
import AttributeTable from '@/components/AttributeTable';
import DownloadCentre from '@/components/DownloadCentre';
import { api } from '@/lib/api';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

type Tab = 'map' | 'table' | 'download';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'map', label: 'Map',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  },
  {
    key: 'table', label: 'Data Table',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>,
  },
  {
    key: 'download', label: 'Export',
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  },
];

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [features, setFeatures] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('map');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { router.push('/login'); return; }
    Promise.all([
      api.getProjectFeatures(id),
      api.getProjects(),
    ]).then(([fc, projects]) => {
      setFeatures(fc);
      const p = (projects as any[]).find(p => p.id === id);
      if (p) setProject(p);
    }).finally(() => setLoading(false));
  }, [id]);

  const featureCount = features?.features?.length ?? 0;

  return (
    <AppShell activeApp="content" title={project?.name || 'Feature Layer'}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>

        {/* Layer header bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', flexShrink: 0 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '10px 0 0', color: '#94a3b8' }}>
            <Link href="/home" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <Link href="/content" style={{ color: '#94a3b8', textDecoration: 'none' }}>Content</Link>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{project?.name || '...'}</span>
          </div>

          {/* Layer info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0 0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{project?.name || 'Feature Layer'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Feature Layer</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  {featureCount.toLocaleString()} features
                </span>
                {project?.last_submission && (
                  <>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>·</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Last: {new Date(project.last_submission).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <Link href={`/apps/map?layer=${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#eff6ff', color: '#2563eb', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#dbeafe'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#eff6ff'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/></svg>
                Open in Map
              </Link>
              <Link href={`/apps/dashboard?layer=${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#faf5ff', color: '#7c3aed', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ede9fe'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#faf5ff'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Dashboard
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', marginTop: '8px' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? '#2563eb' : '#64748b',
                background: 'none', border: 'none',
                borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px',
              }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: '#64748b', fontSize: '13px' }}>Loading feature layer...</span>
            </div>
          ) : (
            <>
              {tab === 'map' && <div style={{ height: '100%' }}><MapViewer features={features} /></div>}
              {tab === 'table' && (
                <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
                  <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <AttributeTable features={features?.features ?? []} />
                  </div>
                </div>
              )}
              {tab === 'download' && (
                <div style={{ padding: '32px', height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '560px' }}>
                    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <DownloadCentre projectId={id} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
