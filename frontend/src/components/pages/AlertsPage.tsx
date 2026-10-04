'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, Info, Megaphone, Send, Loader2 } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/metrics/alerts`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data.alerts || []);
        setLoading(false);
      });
  }, []);

  const handleSend = () => {
    if (broadcast.trim()) {
      setSent(true);
      setTimeout(() => { setSent(false); setBroadcast(''); }, 2000);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader2 className="animate-spin text-accent-cyan" size={32} />
    </div>
  );

  const getIcon = (type: string) => {
    if (type === 'critical') return <AlertTriangle size={18} color="#ef4444" />;
    if (type === 'warning') return <Bell size={18} color="#f59e0b" />;
    return <Info size={18} color="#3b82f6" />;
  };

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">City Alerts & Notifications</h1>
        <p style={{ color: 'var(--text-muted)' }}>Centralized event stream and citizen broadcast console.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Critical', count: alerts.filter(a => a.type === 'critical').length, color: '#ef4444', icon: AlertTriangle },
          { label: 'Warnings', count: alerts.filter(a => a.type === 'warning').length, color: '#f59e0b', icon: Bell },
          { label: 'Info', count: alerts.filter(a => a.type === 'info').length, color: '#3b82f6', icon: Info },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={s.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Live Alert Stream</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ marginTop: 2 }}>{getIcon(alert.type)}</div>
                <div>
                  <div style={{ fontSize: 14, color: '#f8fafc', marginBottom: 4 }}>{alert.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.time}</div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No recent alerts.</div>}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20, height: 'fit-content' }}>
          <div className="section-title" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Megaphone size={16} /> Broadcast Emergency
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Message</label>
              <textarea 
                className="input-field" 
                rows={4} 
                placeholder="Enter alert message to broadcast to all citizens..."
                value={broadcast}
                onChange={e => setBroadcast(e.target.value)}
              />
            </div>
            
            <button 
              className="btn-primary" 
              onClick={handleSend}
              disabled={!broadcast.trim()}
              style={{ width: '100%', justifyContent: 'center', background: '#ef4444' }}
            >
              {sent ? <><CheckCircle size={16} /> Sent</> : <><Send size={16} /> Broadcast Alert</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
