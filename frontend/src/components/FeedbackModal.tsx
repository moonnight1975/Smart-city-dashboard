'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Star, X } from 'lucide-react';

type FeedbackCategory = 'UI/UX' | 'Traffic' | 'AQI' | 'Waste' | 'Water' | 'Complaints' | 'Alerts' | 'Admin' | 'Other';

export type FeedbackEntry = {
  id: string;
  createdAt: string;
  category: FeedbackCategory;
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
  email?: string;
  page?: string;
};

const STORAGE_KEY = 'metrocity_feedback_v1';

function safeLoad(): FeedbackEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeSave(next: FeedbackEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getFeedbackStorageKey() {
  return STORAGE_KEY;
}

export default function FeedbackModal({
  open,
  onClose,
  page,
}: {
  open: boolean;
  onClose: () => void;
  page?: string;
}) {
  const categories: FeedbackCategory[] = useMemo(
    () => ['UI/UX', 'Traffic', 'AQI', 'Waste', 'Water', 'Complaints', 'Alerts', 'Admin', 'Other'],
    [],
  );

  const [category, setCategory] = useState<FeedbackCategory>('UI/UX');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setCategory('UI/UX');
    setRating(5);
    setMessage('');
    setEmail('');
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  const canSubmit = message.trim().length >= 8;

  const submit = async () => {
    if (!canSubmit) {
      toast.error('Please add a bit more detail (min 8 chars).');
      return;
    }
    setSubmitting(true);
    try {
      const entry: FeedbackEntry = {
        id: `FDB-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        category,
        rating,
        message: message.trim(),
        email: email.trim() || undefined,
        page,
      };
      const prev = safeLoad();
      safeSave([entry, ...prev].slice(0, 200));
      toast.success('Thanks — feedback saved.');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: 'min(560px, 100%)',
          padding: 20,
          borderRadius: 18,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="#00d4ff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Instrument Serif', sans-serif", fontSize: 16, fontWeight: 800, color: '#f0f6ff' }}>Feedback</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Help improve MetroCity Dashboard</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={16} color="#94a3b8" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="input-field"
              style={{ height: 44 }}
            >
              {categories.map((c) => (
                <option key={c} value={c} style={{ background: '#0d1629' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Rating</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: 44, padding: '0 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.05)' }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v as 1 | 2 | 3 | 4 | 5)}
                  aria-label={`${v} stars`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <Star size={18} color={v <= rating ? '#f59e0b' : '#334155'} fill={v <= rating ? '#f59e0b' : 'transparent'} />
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{rating}/5</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field"
            placeholder="What should we improve? What felt confusing or missing?"
            style={{ minHeight: 120, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#475569' }}>{page ? `Page: ${page}` : ' '}</span>
            <span style={{ fontSize: 11, color: message.trim().length < 8 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
              {message.trim().length}/8+
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Email (optional)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={!canSubmit || submitting} style={{ opacity: !canSubmit || submitting ? 0.7 : 1 }}>
            {submitting ? 'Saving…' : 'Send feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

