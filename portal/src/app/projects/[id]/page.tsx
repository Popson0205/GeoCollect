// portal/src/app/projects/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import dynamic from 'next/dynamic';
import AttributeTable from '@/components/AttributeTable';
import WidgetGrid from '@/components/WidgetGrid';
import DownloadCentre from '@/components/DownloadCentre';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

type Tab = 'map' | 'table' | 'widgets' | 'download';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'map', label: 'Map View',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  },
  {
    key: 'table', label: 'Attribute Table',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>,
  },
  {
    key: 'widgets', label: 'Dashboard',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    key: 'download', label: 'Download',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  },
];

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [features, setFeatures] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('map');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const u = localStorage.getItem('gc_user');
    if (u) setUser(JSON.parse(u));
    Promise.all([
      api.getProjectFeatures(id),
      api.getPortalConfig(id),
    ]).then(([fc, cfg]) => {
      setFeatures(fc);
      setConfig(cfg);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // Get project name from projects list if available
    api.getProjects().then((projects: any[]) => {
      const p = projects.find((p: any) => p.id === id);
      if (p) setProjectName(p.name);
    }).catch(() => {});
  }, [id]);

  const logout = () => {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    router.push('/login');
  };

  const featureCount = features?.features?.length ?? 0;
  const initials = user?.full_name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: '240px', flexShrink: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>GeoCollect</div>
            <div style={{ color: '#475569', fontSize: '10px', fontWeight: 500 }}>Portal</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ color: '#475569', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 10px 4px' }}>Navigation</div>
          <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: '#94a3b8', fontSize: '13px', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            All Projects
          </Link>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <div style={{ color: '#475569', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px' }}>Views</div>

          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', color: tab === t.key ? 'white' : '#94a3b8', background: tab === t.key ? 'rgba(59,130,246,0.15)' : 'transparent', fontSize: '13px', fontWeight: tab === t.key ? 600 : 400, border: 'none', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', marginBottom: '4px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                <div style={{ color: '#475569', fontSize: '10px' }}>{user.role?.replace(/_/g,' ')}</div>
              </div>
            </div>
          )}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', background: 'transparent', fontSize: '13px', border: 'none', width: '100%', textAlign: 'left' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Link href="/projects" style={{ color: '#94a3b8', textDecoration: 'none' }}>Projects</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{projectName || 'Project'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>{TABS.find(t => t.key === tab)?.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!loading && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                {featureCount.toLocaleString()} features loaded
              </span>
            )}
          </div>
        </div>

        {/* Tab pills (mobile-friendly secondary nav) */}
        <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '0 24px', display: 'flex', gap: '0', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '12px 16px', fontSize: '13px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#2563eb' : '#64748b', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: '-1px' }}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: '#64748b', fontSize: '13px' }}>Loading project data...</span>
            </div>
          ) : (
            <>
              {tab === 'map' && (
                <div style={{ height: 'calc(100vh - 113px)' }}>
                  <MapViewer features={features} />
                </div>
              )}
              {tab === 'table' && (
                <div style={{ padding: '24px', height: 'calc(100vh - 113px)', overflow: 'auto' }}>
                  <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <AttributeTable features={features?.features ?? []} />
                  </div>
                </div>
              )}
              {tab === 'widgets' && (
                <div style={{ padding: '24px', height: 'calc(100vh - 113px)', overflow: 'auto' }}>
                  <WidgetGrid config={config} features={features?.features ?? []} projectId={id} />
                </div>
              )}
              {tab === 'download' && (
                <div style={{ padding: '24px', height: 'calc(100vh - 113px)', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
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
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
      `}</style>
    </div>
  );
}
