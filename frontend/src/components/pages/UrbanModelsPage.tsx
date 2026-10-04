'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Target, Settings, Play, Database } from 'lucide-react';

const GISMap = dynamic(() => import('@/components/GISMap'), {
  ssr: false,
  loading: () => <div className="glass-card skeleton" style={{ height: '100%' }} />
});

export default function UrbanModelsPage() {
  const [model, setModel] = useState<'gravity' | 'gwr'>('gravity');
  const [running, setRunning] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  const handleRunModel = () => {
    setRunning(true);
    setResultVisible(false);
    setTimeout(() => {
      setRunning(false);
      setResultVisible(true);
    }, 1500);
  };

  const mapLayers = [
    { id: 'base-dark', name: 'Dark Matter', type: 'raster' as const, url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', visible: true, opacity: 1 },
  ];

  if (resultVisible) {
    mapLayers.push({
      id: 'model-result', name: 'Model Output', type: 'raster' as const,
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', // Mock layer for result
      visible: true, opacity: 0.7
    });
  }

  return (
    <div className="page-enter" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Map Viewer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GISMap layers={mapLayers} />
      </div>

      {/* Control Panel */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'absolute', top: 96, left: 104, width: 360, 
          zIndex: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Target size={22} className="text-accent-orange" />
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif" }}>Urban Analytics Lab</h2>
        </div>

        {/* Model Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>SELECT MODEL</label>
          <select 
            value={model} onChange={e => setModel(e.target.value as any)}
            style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }}
          >
            <option value="gravity">Gravity Model (Spatial Interaction)</option>
            <option value="gwr">Geographically Weighted Regression (GWR)</option>
          </select>
        </div>

        {/* Parameters */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Settings size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Model Parameters</span>
          </div>

          {model === 'gravity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Friction of Distance (β)</label>
                <input type="range" min="1" max="5" step="0.5" defaultValue="2" style={{ width: '100%', accentColor: 'var(--accent-orange)' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Origin Mass Variable</label>
                <select style={{ width: '100%', padding: '6px', background: '#0a1121', color: '#fff', border: '1px solid #1e293b', borderRadius: 4, fontSize: 12 }}>
                  <option>Population Density</option>
                  <option>Employment</option>
                </select>
              </div>
            </div>
          )}

          {model === 'gwr' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dependent Variable</label>
                <select style={{ width: '100%', padding: '6px', background: '#0a1121', color: '#fff', border: '1px solid #1e293b', borderRadius: 4, fontSize: 12 }}>
                  <option>Housing Prices</option>
                  <option>Traffic Volume</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bandwidth Type</label>
                <select style={{ width: '100%', padding: '6px', background: '#0a1121', color: '#fff', border: '1px solid #1e293b', borderRadius: 4, fontSize: 12 }}>
                  <option>Adaptive</option>
                  <option>Fixed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleRunModel}
          disabled={running}
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', background: running ? 'var(--text-muted)' : 'var(--accent-orange)' }}
        >
          {running ? 'Running Model...' : <><Play size={16} /> Execute Model</>}
        </button>

        {resultVisible && (
          <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-critical)' }}>Model Simulation Output</div>
              <span className="badge badge-red">HYPOTHETICAL</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              <strong>Dataset:</strong> Mock Generation<br/>
              <strong>Limitations:</strong> This output uses assumed parameters and demo map tiles. No live processing backend is currently configured for this model.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
