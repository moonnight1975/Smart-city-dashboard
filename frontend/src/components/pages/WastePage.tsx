'use client';

import { useEffect, useState } from 'react';
import { Trash2, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';

export default function WastePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/metrics/waste`)
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
          <h1 className="page-title">Waste Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Smart bin sensor data and collection operations.</p>
        </div>
        <button className="btn-secondary"><RotateCcw size={16} /> Sync</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.collection_rate}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collection Efficiency</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.bins_full}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bins at Critical Level (&gt;90%)</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, height: 400 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Bin Fill Levels</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="bin_id" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0a1121', border: '1px solid #1e293b' }} />
            <Bar dataKey="fill_level" radius={[4,4,0,0]}>
              {metrics.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill_level > 80 ? '#ef4444' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
