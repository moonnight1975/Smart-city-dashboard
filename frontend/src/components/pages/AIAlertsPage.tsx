'use client';

import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, ChevronDown, ChevronUp, Shield, Eye, Clock, Target, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, width: 36, textAlign: 'right' }}>{value}%</div>
    </div>
  );
}

export default function AIAlertsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/ai/predictions`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader2 className="animate-spin text-accent-purple" size={32} />
    </div>
  );

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Predictive Intelligence</h1>
        <p style={{ color: 'var(--text-muted)' }}>AI-driven forecast models for pre-emptive urban incident management.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {data.systems.map((sys: any) => (
          <div key={sys.name} className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{sys.name} Model</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: sys.status === 'Critical' ? '#ef4444' : sys.status === 'Warning' ? '#f59e0b' : '#10b981' }}>{sys.status}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${sys.status === 'Critical' ? '#ef4444' : sys.status === 'Warning' ? '#f59e0b' : '#10b981'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
              {sys.health}%
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-title">Active AI Predictions</div>
          {data.predictions.map((pred: any) => (
            <div key={pred.id} className="glass-card" style={{ overflow: 'hidden', borderLeft: `3px solid ${pred.risk_level === 'Critical' ? '#ef4444' : pred.risk_level === 'Warning' ? '#f59e0b' : '#3b82f6'}` }}>
              <div 
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setExpanded(expanded === pred.id ? null : pred.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{pred.id}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{pred.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> {pred.target}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {pred.timeframe}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ width: 120 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textAlign: 'right' }}>Probability</div>
                    <ConfidenceBar value={pred.probability} color={pred.risk_level === 'Critical' ? '#ef4444' : pred.risk_level === 'Warning' ? '#f59e0b' : '#3b82f6'} />
                  </div>
                  {expanded === pred.id ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
              </div>

              {expanded === pred.id && (
                <div style={{ padding: '0 20px 20px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Brain size={14} /> Contributing Factors</div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {pred.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> Automated Recommendation</div>
                      <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, fontSize: 13, color: '#a7f3d0' }}>
                        {pred.recommendation}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>Execute Action</button>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>City Risk Forecast (24h)</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.risk_timeline}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a1121', border: '1px solid #1e293b' }} />
                  <Area type="monotone" dataKey="risk_score" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#riskGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>AI Engine Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Prediction Accuracy</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{data.metrics.accuracy}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Anomalies Detected (24h)</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{data.metrics.anomalies_detected}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Automated Actions</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{data.metrics.automated_actions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
