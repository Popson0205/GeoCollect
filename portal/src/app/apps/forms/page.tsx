// portal/src/app/apps/forms/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const FIELD_URL = process.env.NEXT_PUBLIC_FIELD_URL || 'https://geocollect-field.onrender.com';

const GEOM_STYLES: Record<string, { bg: string; color: string }> = {
  Point:      { bg: '#eff6ff', color: '#2563eb' },
  LineString: { bg: '#f0fdf4', color: '#16a34a' },
  Polygon:    { bg: '#fdf4ff', color: '#9333ea' },
  Multi:      { bg: '#fff7ed', color: '#ea580c' },
};

export default function FormsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { router.push('/login'); return; }

    api.getProjects().then(async (projs: any[]) => {
      setProjects(projs);
      // Load forms for all projects in parallel
      const allForms = await Promise.all(
        projs.map(p =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/projects/${p.id}/forms`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('gc_token')}` },
          }).then(r => r.json()).then((fs: any[]) => fs.map(f => ({ ...f, project_name: p.name, project_id: p.id }))).catch(() => [])
        )
      );
      setForms(allForms.flat().filter(f => f.is_published));
    }).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, []);

  const filtered = forms.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.project_name?.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = async (token: string, id: string) => {
    const url = `${FIELD_URL}/s/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppShell activeApp="forms" title="Survey Forms">
      <div style={{ padding: '28px 40px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Survey Forms</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Published forms available for data collection</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms..."
              style={{ paddingLeft: '36px', paddingRight: '14px', paddingTop: '9px', paddingBottom: '9px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', background: 'white', width: '220px', color: '#0f172a' }}
              onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', width: '65%', marginBottom: '8px' }} />
                <div style={{ height: '11px', background: '#f1f5f9', borderRadius: '4px', width: '40%', marginBottom: '20px' }} />
                <div style={{ height: '36px', background: '#f1f5f9', borderRadius: '8px' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{search ? 'No results found' : 'No published forms yet'}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{search ? 'Try a different search.' : 'Forms published in Studio will appear here.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map(f => {
              const geom = GEOM_STYLES[f.geometry_type] || GEOM_STYLES.Point;
              const shareUrl = f.share_token ? `${FIELD_URL}/s/${f.share_token}` : null;
              return (
                <div key={f.id} style={{ background: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid transparent', transition: 'all 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#bbf7d0'; el.style.boxShadow = '0 4px 16px rgba(16,185,129,0.1)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'transparent'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.project_name}</div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#f8fafc', margin: '0 0 14px' }} />

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', background: geom.bg, color: geom.color }}>{f.geometry_type}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', background: '#f0fdf4', color: '#16a34a' }}>v{f.version}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '100px', background: '#f0fdf4', color: '#16a34a' }}>Published</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', padding: '3px 8px' }}>{f.schema?.fields?.length ?? 0} fields</span>
                  </div>

                  {shareUrl ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', background: '#059669', color: 'white', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#047857'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#059669'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Open Form
                      </a>
                      <button onClick={() => copyLink(f.share_token, f.id)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', color: copied === f.id ? '#059669' : '#64748b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' }}>
                        {copied === f.id ? (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
                        ) : (
                          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No share link available</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
