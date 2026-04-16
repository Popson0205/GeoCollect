// portal/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid email or password');
      }
      const data = await res.json();
      // Store token in localStorage so api.ts can send it as Bearer header
      localStorage.setItem('gc_token', data.token);
      localStorage.setItem('gc_user', JSON.stringify(data.user));
      router.push('/projects');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 52%',
        background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '20%', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>GeoCollect</span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: '100px', padding: '6px 14px', marginBottom: '28px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 500 }}>Field Data Collection Platform</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '42px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', margin: '0 0 20px' }}>
            Collect. Visualise.<br /><span style={{ color: '#60a5fa' }}>Decide.</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.7, maxWidth: '380px', margin: 0 }}>
            Access your field projects, explore geospatial data, and export insights — all from one portal.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '32px' }}>
          {[{ value: 'Real-time', label: 'Data sync' }, { value: 'Multi-format', label: 'Export' }, { value: 'Secure', label: 'Access control' }].map(s => (
            <div key={s.label}>
              <div style={{ color: 'white', fontSize: '15px', fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome back</h2>
            <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Sign in to your GeoCollect portal</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', fontSize: '14px', color: '#0f172a', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 44px 12px 42px', fontSize: '14px', color: '#0f172a', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex' }}>
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ color: '#b91c1c', fontSize: '13px', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '32px' }}>
            Access is managed by your organisation administrator.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
