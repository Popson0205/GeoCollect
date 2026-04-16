// portal/src/app/projects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const S = {
  shell: { display: 'flex', minHeight: '100vh', background: '#f1f5f9' } as React.CSSProperties,
  sidebar: {
    width: '240px', flexShrink: 0, background: '#0f172a',
    display: 'flex', flexDirection: 'column' as const,
    padding: '0', position: 'sticky' as const, top: 0, height: '100vh',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logoIcon: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'linear-gradient(135deg,#3b82f6,#10b981)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { color: 'white', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.2px' },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  navLabel: { color: '#475569', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '8px 10px 4px' },
  navItem: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
    color: active ? 'white' : '#94a3b8',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    fontSize: '13px', fontWeight: active ? 600 : 400,
    textDecoration: 'none', transition: 'all 0.15s',
    border: 'none', width: '100%', textAlign: 'left' as const,
  }),
  sidebarBottom: { padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0 },
  topbar: {
    background: 'white', borderBottom: '1px solid #e2e8f0',
    padding: '0 28px', height: '56px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky' as const, top: 0, zIndex: 10,
  },
  content: { padding: '28px', flex: 1 },
  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' },
  pageSubtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: {
    background: 'white', borderRadius: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    padding: '20px', cursor: 'pointer', transition: 'all 0.15s',
    textDecoration: 'none', display: 'block', color: 'inherit',
    border: '1px solid transparent',
  },
  skeletonCard: {
    background: 'white', borderRadius: '14px', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  skeleton: (w: string, h: string): React.CSSProperties => ({
    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
    borderRadius: '6px', width: w, height: h,
  }),
  emptyState: {
    background: 'white', borderRadius: '16px', padding: '60px 40px',
    textAlign: 'center' as const, gridColumn: '1/-1',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
};

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} style={S.navItem(!!active)}>
      {icon}
      {label}
    </Link>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('gc_user');
    if (u) setUser(JSON.parse(u));
    api.getProjects()
      .then(setProjects)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    router.push('/login');
  };

  const initials = user?.full_name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase() || 'U';

  return (
    <div style={S.shell}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <div style={S.logoText}>GeoCollect</div>
            <div style={{ color: '#475569', fontSize: '10px', fontWeight: 500 }}>Portal</div>
          </div>
        </div>

        <nav style={S.nav}>
          <div style={S.navLabel}>Workspace</div>
          <NavItem href="/projects" active label="Projects" icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
          }/>
        </nav>

        <div style={S.sidebarBottom}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', marginBottom: '4px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                <div style={{ color: '#475569', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.role?.replace(/_/g,' ')}</div>
              </div>
            </div>
          )}
          <button onClick={logout} style={{ ...S.navItem(false), color: '#ef4444' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            <span style={{ color: '#94a3b8' }}>Portal</span>
            <span style={{ margin: '0 6px', color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Projects</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Content */}
        <div style={S.content}>
          <div style={S.pageHeader}>
            <h1 style={S.pageTitle}>Projects</h1>
            <p style={S.pageSubtitle}>Select a project to explore its geospatial data</p>
          </div>

          <div style={S.grid}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} style={S.skeletonCard}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={S.skeleton('40px','40px')} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...S.skeleton('60%','14px'), marginBottom: '8px' }} />
                      <div style={S.skeleton('40%','11px')} />
                    </div>
                  </div>
                  <div style={{ ...S.skeleton('100%','1px'), marginBottom: '12px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={S.skeleton('60px','22px')} />
                    <div style={S.skeleton('80px','22px')} />
                  </div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>No projects yet</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Projects will appear here once they're assigned to you.</p>
              </div>
            ) : (
              projects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} style={S.card}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="m9 18 6-6-6-6"/></svg>
                  </div>

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 14px' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                      {Number(p.feature_count || 0).toLocaleString()} features
                    </span>
                    {p.last_submission && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                        Last: {new Date(p.last_submission).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
      `}</style>
    </div>
  );
}
