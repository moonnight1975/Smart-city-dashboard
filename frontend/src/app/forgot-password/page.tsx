'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

const CityMap = dynamic(() => import('@/components/CityMap'), { ssr: false });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock backend request
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Pane - Map Visualization */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="lg-flex">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <CityMap markers={[]} height="100%" className="auth-map" style={{ width: '100%', height: '100%', borderRadius: 0, border: 'none' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(2, 6, 17, 0.4), var(--bg-primary))', zIndex: 1 }} />
      </div>

      {/* Right Pane - Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', zIndex: 10, position: 'relative' }}>
        
        <div style={{ width: '100%', maxWidth: 400 }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 32, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={16} /> Back to login
          </Link>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif", marginBottom: 8 }}>Reset password</h2>
            <p style={{ color: 'var(--text-muted)' }}>Enter your email address and we&apos;ll send you a link to reset your password.</p>
          </div>

          {success ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: 8 }}>
              <h3 style={{ color: 'var(--accent-green)', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Check your email</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                We&apos;ve sent password reset instructions to <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !email}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: 14, marginTop: 8 }}
              >
                {loading ? <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Send reset instructions'}
              </button>
            </form>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
