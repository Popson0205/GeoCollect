// portal/src/components/AppShell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const APPS = [
  {
    key: 'home',
    href: '/home',
    label: 'Home',
    color: '#0f172a',
    bg: 'linear-gradient(135deg,#1e293b,#334155)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    key: 'map',
    href: '/apps/map',
    label: 'Map Viewer',
    color: '#0369a1',
    bg: 'linear-gradient(135deg,#0369a1,#0284c7)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    key: 'dashboard',
    href: '/apps/dashboard',
    label: 'Dashboards',
    color: '#7c3aed',
    bg: 'linear-gradient(135deg,#7c3aed,#9333ea)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: 'forms',
    href: '/apps/forms',
    label: 'Survey Forms',
    color: '#059669',
    bg: 'linear-gradient(135deg,#059669,#10b981)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    key: 'content',
    href: '/content',
    label: 'Content',
    color: '#b45309',
    bg: 'linear-gradient(135deg,#b45309,#d97706)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
];

interface AppShellProps {
  children: React.ReactNode;
  activeApp?: string;
  title?: string;
}

export default function AppShell({ children, activeApp, title }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = localStorage.getItem('gc_user');
    if (u) setUser(JSON.parse(u));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    router.push('/login');
  };

  const initials = user?.full_name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'U';
  const currentApp = APPS.find(a => a.key === activeApp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Navbar ── */}
      <header style={{
        height: '52px', background: '#0f172a', display: 'flex',
        alignItems: 'center', padding: '0 16px', gap: '12px',
        position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
        boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
      }}>

        {/* Waffle / App Switcher */}
        <div ref={switcherRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSwitcherOpen(v => !v)}
            title="App Switcher"
            style={{
              width: '34px', height: '34px', borderRadius: '8px', border: 'none',
              background: switcherOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s', color: '#94a3b8',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = switcherOpen ? 'rgba(255,255,255,0.12)' : 'transparent')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="4" height="4" rx="1"/><rect x="10" y="3" width="4" height="4" rx="1"/>
              <rect x="17" y="3" width="4" height="4" rx="1"/><rect x="3" y="10" width="4" height="4" rx="1"/>
              <rect x="10" y="10" width="4" height="4" rx="1"/><rect x="17" y="10" width="4" height="4" rx="1"/>
              <rect x="3" y="17" width="4" height="4" rx="1"/><rect x="10" y="17" width="4" height="4" rx="1"/>
              <rect x="17" y="17" width="4" height="4" rx="1"/>
            </svg>
          </button>

          {/* App Switcher Overlay */}
          {switcherOpen && (
            <div style={{
              position: 'absolute', top: '42px', left: 0,
              background: 'white', borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)',
              padding: '20px', width: '320px', zIndex: 200,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
                GeoCollect Apps
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {APPS.map(app => (
                  <Link key={app.key} href={app.href} onClick={() => setSwitcherOpen(false)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '14px 8px', borderRadius: '12px', textDecoration: 'none',
                      background: activeApp === app.key ? '#f0f9ff' : 'transparent',
                      border: activeApp === app.key ? '1.5px solid #bae6fd' : '1.5px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (activeApp !== app.key) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (activeApp !== app.key) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: app.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      {app.icon}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>{app.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logo */}
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'linear-gradient(135deg,#3b82f6,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.2px' }}>GeoCollect</span>
        </Link>

        {/* Divider + Active App */}
        {currentApp && (
          <>
            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: currentApp.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentApp.icon && <span style={{ transform: 'scale(0.7)', display: 'flex' }}>{currentApp.icon}</span>}
              </div>
              <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600 }}>{title || currentApp.label}</span>
            </div>
          </>
        )}

        {/* Top nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '8px' }}>
          {APPS.filter(a => a.key !== 'home').map(app => (
            <Link key={app.key} href={app.href}
              style={{
                padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                color: activeApp === app.key ? 'white' : '#64748b',
                background: activeApp === app.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (activeApp !== app.key) (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
              onMouseLeave={e => { if (activeApp !== app.key) (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
            >
              {app.label}
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User Avatar */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white',
              boxShadow: userMenuOpen ? '0 0 0 2px rgba(59,130,246,0.5)' : 'none',
              transition: 'box-shadow 0.15s',
            }}
          >
            {initials}
          </button>

          {userMenuOpen && (
            <div style={{
              position: 'absolute', top: '40px', right: 0,
              background: 'white', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '8px',
              minWidth: '200px', zIndex: 200, border: '1px solid #e2e8f0',
            }}>
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{user?.full_name}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{user?.email}</div>
                <div style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '100px' }}>
                  {user?.role?.replace(/_/g, ' ')}
                </div>
              </div>
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#ef4444', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
