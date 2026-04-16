// portal/src/app/home/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const APPS = [
  {
    href: '/apps/map',
    label: 'Map Viewer',
    desc: 'Visualise feature layers on an interactive map',
    bg: 'linear-gradient(135deg,#0369a1,#0284c7)',
    shadow: 'rgba(3,105,161,0.3)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    href: '/apps/dashboard',
    label: 'Dashboards',
    desc: 'Build and view analytics widgets for your data',
    bg: 'linear-gradient(135deg,#7c3aed,#9333ea)',
    shadow: 'rgba(124,58,237,0.3)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/apps/forms',
    label: 'Survey Forms',
    desc: 'Access and share published data collection forms',
    bg: 'linear-gradient(135deg,#059669,#10b981)',
    shadow: 'rgba(5,150,105,0.3)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/content',
    label: 'Content',
    desc: 'Browse and manage your feature layers and datasets',
    bg: 'linear-gradient(135deg,#b45309,#d97706)',
    shadow: 'rgba(180,83,9,0.3)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { router.push('/login'); return; }
    const u = localStorage.getItem('gc_user');
    if (u) setUser(JSON.parse(u));
    api.getProjects()
      .then(setProjects)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell activeApp="home">
      <div style={{ padding: '40px 48px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

        {/* Hero greeting */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Welcome to GeoCollect. What would you like to do today?
          </p>
        </div>

        {/* App Launcher */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            Applications
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {APPS.map(app => (
              <Link key={app.href} href={app.href} style={{
                background: 'white', borderRadius: '16px', padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                textDecoration: 'none', display: 'block', border: '1px solid transparent',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-3px)';
                  el.style.boxShadow = `0 12px 32px ${app.shadow}, 0 2px 8px rgba(0,0,0,0.06)`;
                  el.style.borderColor = 'rgba(255,255,255,0.8)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'none';
                  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  el.style.borderColor = 'transparent';
                }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: app.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: `0 4px 12px ${app.shadow}` }}>
                  {app.icon}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{app.label}</div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{app.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Projects */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Recent Projects
            </h2>
            <Link href="/content" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', width: '60%', marginBottom: '8px' }} />
                  <div style={{ height: '11px', background: '#f1f5f9', borderRadius: '4px', width: '40%' }} />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No projects yet. They'll appear here once assigned to you.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {projects.slice(0, 8).map(p => (
                <Link key={p.id} href={`/content/${p.id}`} style={{
                  background: 'white', borderRadius: '12px', padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  border: '1px solid transparent', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#bfdbfe'; el.style.boxShadow = '0 4px 12px rgba(59,130,246,0.1)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'transparent'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {Number(p.feature_count || 0).toLocaleString()} features
                      {p.last_submission ? ` · ${new Date(p.last_submission).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
