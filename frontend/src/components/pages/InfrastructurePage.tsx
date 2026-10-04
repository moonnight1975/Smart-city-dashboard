'use client';

import { useEffect, useState } from 'react';
import { HardHat, Activity, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';

export default function InfrastructurePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/metrics/infrastructure`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader2 className="animate-spin text-accent-cyan" size={32} />
    </div>
  );

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Infrastructure Projects</h1>
          <p style={{ color: 'var(--text-muted)' }}>City development and active civil works tracking.</p>
        </div>
        <button className="btn-secondary"><RotateCcw size={16} /> Sync</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardHat size={20} color="#8b5cf6" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>{metrics.status}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.active_projects}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Capital Projects</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.maintenance_alerts}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Urgent Maintenance Alerts</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, height: 400 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Project Completion Progress (%)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="project" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0a1121', border: '1px solid #1e293b' }} />
            <Bar dataKey="progress" radius={[4,4,0,0]}>
              {metrics.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#10b981' : entry.progress > 50 ? '#f59e0b' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
