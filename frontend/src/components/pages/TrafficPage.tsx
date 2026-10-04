'use client';

import { useEffect, useMemo, useState } from 'react';
import { Car, Navigation, Clock, AlertTriangle, TrendingUp, Camera, Play, Pause, Volume2, VolumeX, RotateCcw, Loader2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(13, 22, 41, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/v2/metrics/traffic`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  const cameras = useMemo(
    () => [
      { id: 'CAM-01', name: 'Main Blvd & 5th', location: 'Downtown', status: 'Live' as const },
      { id: 'CAM-02', name: 'Airport Corridor', location: 'Airport', status: 'Live' as const },
      { id: 'CAM-03', name: 'Harbor Express', location: 'Harbor', status: 'Live' as const },
      { id: 'CAM-04', name: 'Industrial Bypass', location: 'Industrial', status: 'Intermittent' as const },
    ],
    [],
  );

  const DEMO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  const [activeCam, setActiveCam] = useState(cameras[0]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader2 className="animate-spin text-accent-cyan" size={32} />
    </div>
  );

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Traffic Intelligence</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time flow monitoring and congestion prediction.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary"><RotateCcw size={16} /> Sync</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Severe</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.congestion_index}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Citywide Congestion Index</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={20} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.average_speed_kmh} <span style={{ fontSize: 14 }}>km/h</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Average Network Speed</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{metrics.incidents}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Incidents</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        
        {/* Trend Chart */}
        <div className="glass-card" style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8' } } as any}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ margin: 0 }}>Traffic Volume Trend</div>
          </div>
          <div style={{ padding: 20, height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="volume" name="Vehicles" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ r: 4, fill: '#0a1121', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--accent-cyan)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="glass-card" style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 4' } } as any}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title" style={{ margin: 0 }}>CCTV Network</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              LIVE
            </div>
          </div>
          
          <div style={{ padding: 20 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <video 
                src={DEMO_URL} autoPlay loop muted playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
              />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={12} color="var(--accent-cyan)" /> {activeCam.name}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cameras.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setActiveCam(cam)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
                    background: activeCam.id === cam.id ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                    borderColor: activeCam.id === cam.id ? 'var(--accent-cyan)' : 'var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: activeCam.id === cam.id ? 'var(--accent-cyan)' : '#e2e8f0' }}>{cam.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cam.location}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: cam.status === 'Live' ? '#10b981' : '#f59e0b' }}>
                    {cam.status}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
