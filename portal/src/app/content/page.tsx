// portal/src/app/content/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const GEOM_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Point:      { bg: '#eff6ff', color: '#2563eb', label: 'Point' },
  LineString: { bg: '#f0fdf4', color: '#16a34a', label: 'Line' },
  Polygon:    { bg: '#fdf4ff', color: '#9333ea', label: 'Polygon' },
  Multi:      { bg: '#fff7ed', color: '#ea580c', label: 'Multi' },
};

export default function ContentPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { router.push('/login'); return; }
    api.getProjects()
      .then(setProjects)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell activeApp="content" title="Content">
      <div style={{ padding: '28px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Content</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Your feature layers and datasets</p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search layers..."
              style={{ paddingLeft: '36px', paddingRight: '14px', paddingTop: '9px', paddingBottom: '9px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', background: 'white', width: '240px', color: '#0f172a' }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Feature Layers', value: projects.length, color: '#3b82f6' },
              { label: 'Total Features', value: projects.reduce((a, p) => a + Number(p.feature_count || 0), 0).toLocaleString(), color: '#10b981' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '10px', padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{s.value}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', width: '65%', marginBottom: '10px' }} />
                <div style={{ height: '11px', background: '#f1f5f9', borderRadius: '4px', width: '45%', marginBottom: '20px' }} />
                <div style={{ height: '1px', background: '#f8fafc', marginBottom: '14px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ height: '22px', background: '#f1f5f9', borderRadius: '100px', width: '60px' }} />
                  <div style={{ height: '22px', background: '#f1f5f9', borderRadius: '100px', width: '80px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{search ? 'No results found' : 'No feature layers yet'}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{search ? 'Try a different search term.' : 'Feature layers appear here when you submit form data.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map(p => {
              const geom = GEOM_COLORS['Point']; // default; could be derived from form schema
              return (
                <Link key={p.id} href={`/content/${p.id}`} style={{
                  background: 'white', borderRadius: '14px', padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textDecoration: 'none',
                  display: 'block', border: '1px solid transparent', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#bfdbfe'; el.style.boxShadow = '0 4px 16px rgba(59,130,246,0.1)'; el.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'transparent'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; el.style.transform = 'none'; }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="m9 18 6-6-6-6"/></svg>
                  </div>

                  <div style={{ height: '1px', background: '#f8fafc', margin: '0 0 14px' }} />

                  {/* Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: geom.bg, color: geom.color, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px' }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
                      Feature Layer
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px' }}>
                      {Number(p.feature_count || 0).toLocaleString()} features
                    </span>
                    {p.last_submission && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                        {new Date(p.last_submission).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
