'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShieldAlert size={32} color="var(--accent-red)" />
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif", marginBottom: 16 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          You don&apos;t have permission to view this page or perform this action. Please contact your system administrator if you believe this is an error.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Go Back
          </Link>
          <Link href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
            Sign In with different account
          </Link>
        </div>
      </div>
    </div>
  );
}
