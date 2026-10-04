'use client';

import Link from 'next/link';
import { Clock, LogIn } from 'lucide-react';

export default function SessionExpiredPage() {
  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Clock size={32} color="var(--accent-orange)" />
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif", marginBottom: 16 }}>Session Expired</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Your security token has expired due to inactivity. For your security, please sign in again to continue using the MetroCity AI command center.
        </p>

        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          <LogIn size={16} /> Sign In Again
        </Link>
      </div>
    </div>
  );
}
