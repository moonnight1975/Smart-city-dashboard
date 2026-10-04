'use client';

import { useEffect, useState } from 'react';
import { Droplets, Activity, RotateCcw, Loader2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';

export default function WaterPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/metrics/water`)
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
          <h1 className="page-title">Water Grid</h1>
          <p style={{ color: 'var(--text-muted)' }}>Reservoir levels and pipeline pressure telemetry.</p>
        </div>
        <button className="btn-secondary"><RotateCcw size={16} /> Sync</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={20} color="#06b6d4" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>{metrics.status}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.reservoir_level_pct}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reservoir Storage Capacity</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.pressure_faults}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Pressure Faults</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, height: 400 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Network Pressure by Zone (PSI)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="zone" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0a1121', border: '1px solid #1e293b' }} />
            <Bar dataKey="pressure_psi" radius={[4,4,0,0]}>
              {metrics.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.pressure_psi < 40 ? '#ef4444' : '#06b6d4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
