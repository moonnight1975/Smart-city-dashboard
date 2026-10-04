'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, MapPin } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import dynamic from 'next/dynamic';

const CityMap = dynamic(() => import('@/components/CityMap'), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppStore();
  
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcqwaoobymicskftstmu.supabase.co';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ycKKA4OU0nBoD6BaWOx2eg_s0i9_6FN';

      const endpoint = isSignUp ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';

      const payload: any = { email, password };
      if (isSignUp) {
        payload.data = { full_name: name };
      }

      const res = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error_description || data.msg || data.message || 'Authentication failed');
      }

      if (isSignUp) {
        setSuccess('Registration successful! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        // Supabase returns { user: {...}, access_token: "..." }
        const userPayload = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email,
          role: data.user.user_metadata?.role || 'admin',
          status: 'Active'
        };

        login(userPayload, data.access_token);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Left Pane - Map Visualization */}
      <div style={{ flex: 1, position: 'relative', display: 'none' }} className="lg-flex">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <CityMap markers={[]} height="100%" className="auth-map" style={{ width: '100%', height: '100%', borderRadius: 0, border: 'none' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(2, 6, 17, 0.4), var(--bg-primary))', zIndex: 1 }} />
        
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Instrument Serif', sans-serif", letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MetroCity AI
            </h1>
          </div>
          <div>
            <h2 style={{ fontSize: 42, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif", lineHeight: 1.1, marginBottom: 16, maxWidth: 500 }}>
              Geospatial Intelligence for Smarter Cities
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 450, lineHeight: 1.5 }}>
              Enterprise-grade urban analytics, real-time spatial monitoring, and AI-driven predictions for modern municipal governance.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', zIndex: 10, position: 'relative' }}>
        
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="lg-hidden" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color="white" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Instrument Serif', sans-serif" }}>MetroCity AI</h1>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif", marginBottom: 8 }}>
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {isSignUp ? 'Register to access the command center.' : 'Sign in to access the command center.'}
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: 8, color: 'var(--accent-red)', fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 8, color: 'var(--accent-green)', fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@metrocity.gov"
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 16px', paddingRight: 40, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Remember me</span>
                </label>
                <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: 14, marginTop: 8 }}
            >
              {loading ? <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontWeight: 600, marginLeft: 8, cursor: 'pointer' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
          
        </div>
      </div>
      
      {/* Inline styles for utilities to keep it clean */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
          .lg-hidden { display: none !important; }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
