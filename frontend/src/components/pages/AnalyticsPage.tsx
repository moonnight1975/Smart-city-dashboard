'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Activity, Zap, Loader2 } from 'lucide-react';
import {
  ComposedChart, Bar, Line, Area, AreaChart, BarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Cell
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/analytics`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
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
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">City Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Historical trends and correlation across urban operations.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {data.kpis.map((kpi: any) => (
          <div key={kpi.label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: kpi.color, fontFamily: "'Instrument Serif', sans-serif" }}>{kpi.value}</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{kpi.unit}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              {kpi.positive ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
              <span style={{ fontSize: 12, color: kpi.positive ? '#10b981' : '#ef4444', fontWeight: 600 }}>{kpi.trend}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs last week</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{kpi.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 24 }}>
        
        {/* Main Correlation Chart */}
        <div className="glass-card" style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8' } } as any}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ margin: 0 }}>Weekly System Correlation</div>
          </div>
          <div style={{ padding: 20, height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.weekly_trends} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0a1121', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                
                <Bar yAxisId="left" dataKey="complaints" name="New Complaints" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="left" dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="airQuality" name="AQI" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#0a1121', strokeWidth: 2 }} />
                <Line yAxisId="right" type="monotone" dataKey="traffic" name="Traffic" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#0a1121', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints by Area */}
        <div className="glass-card" style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 4' } } as any}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)' }}>
            <div className="section-title" style={{ margin: 0 }}>Complaints by Area</div>
          </div>
          <div style={{ padding: 20, height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.complaints_by_area} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="area" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#0a1121', border: '1px solid #1e293b', borderRadius: 8 }} />
                <Bar dataKey="count" name="Complaints" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {data.complaints_by_area.map((_: any, i: number) => <Cell key={i} fill={`hsl(${260 + i * 15}, 70%, 60%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
