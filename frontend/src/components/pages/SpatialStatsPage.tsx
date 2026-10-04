'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, BarChart2, Zap, LayoutDashboard, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const GISMap = dynamic(() => import('@/components/GISMap'), {
  ssr: false,
  loading: () => <div className="glass-card skeleton" style={{ height: '100%' }} />
});

export default function SpatialStatsPage() {
  const [method, setMethod] = useState<'idw' | 'kriging' | 'moran'>('idw');
  
  // Dummy heatmap layer based on the selected method
  // In a real application, we would use leafet.heat or canvas overlays
  // Here we use a generic raster tile that acts as a placeholder for a spatial surface
  const surfaceUrl = method === 'idw'
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png' // Placeholder for IDW
    : method === 'kriging'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png' // Placeholder for Kriging
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // Dark for Moran&apos;s I (will show dots)

  return (
    <div className="page-enter" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Map Viewer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GISMap layers={[
          { id: 'base-dark', name: 'Dark Matter', type: 'raster', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', visible: true, opacity: 1 },
          { id: 'surface', name: 'Statistical Surface', type: 'raster', url: surfaceUrl, visible: method !== 'moran', opacity: 0.6 }
        ]} />
      </div>

      {/* Control Panel */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'absolute', top: 96, left: 104, width: 360, 
          maxHeight: 'calc(100vh - 110px)', overflowY: 'auto',
          zIndex: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={22} className="text-accent-purple" />
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif" }}>Spatial Statistics</h2>
        </div>

        {/* Method Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>ANALYSIS METHOD</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'idw', name: 'IDW Interpolation', desc: 'Inverse Distance Weighting surface.' },
              { id: 'kriging', name: 'Kriging', desc: 'Geostatistical regression surface.' },
              { id: 'moran', name: "Moran&apos;s I", desc: 'Spatial autocorrelation index.' }
            ].map(m => (
              <div 
                key={m.id} 
                onClick={() => setMethod(m.id as any)}
                style={{ 
                  padding: '12px', borderRadius: 8, cursor: 'pointer',
                  background: method === m.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${method === m.id ? 'var(--accent-purple)' : 'var(--border-color)'}`
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: method === m.id ? 'var(--accent-purple)' : 'var(--text-primary)', marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results / Stats */}
        {method === 'moran' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Global Moran&apos;s I Result</div>
              <span className="badge badge-red">HYPOTHETICAL</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-cyan)' }}>0.68</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Index Value</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 8, marginBottom: 8 }}>Clustered Distribution (p &lt; 0.05)</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}><strong>Note:</strong> Data is simulated. No live spatial autocorrelation backend is running.</div>
          </div>
        )}

        {(method === 'idw' || method === 'kriging') && (
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Interpolation Variance</div>
              <span className="badge badge-red">HYPOTHETICAL</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={[{name: 'Z1', val: 12}, {name: 'Z2', val: 19}, {name: 'Z3', val: 15}, {name: 'Z4', val: 28}, {name: 'Z5', val: 22}]}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{background: '#0a1121', border: '1px solid #1e293b'}} />
                <Bar dataKey="val" fill="var(--accent-violet)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}><strong>Note:</strong> Map tiles and graphs are mocked to demonstrate UI capability.</div>
          </div>
        )}

      </div>
    </div>
  );
}
