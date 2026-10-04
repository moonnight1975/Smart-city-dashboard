'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  BoxSelect, Layers, Settings2, Play, Circle, Plus, Trash2, Hexagon
} from 'lucide-react';
import * as turf from '@turf/turf';

const GISMap = dynamic(() => import('@/components/GISMap'), {
  ssr: false,
  loading: () => <div className="glass-card skeleton" style={{ height: '100%' }} />
});

import type { GISLayer } from '@/components/pages/GISExplorerPage';

export default function GISAnalysisPage() {
  // Sample Data Setup
  const initialLayers: GISLayer[] = useMemo(() => {
    // Generate some mock features for analysis
    const poly1 = turf.polygon([[
      [72.810, 19.410],
      [72.820, 19.410],
      [72.820, 19.420],
      [72.810, 19.420],
      [72.810, 19.410]
    ]]);
    
    const poly2 = turf.polygon([[
      [72.815, 19.415],
      [72.825, 19.415],
      [72.825, 19.425],
      [72.815, 19.425],
      [72.815, 19.415]
    ]]);

    const pt1 = turf.point([72.815, 19.418]);
    const pt2 = turf.point([72.820, 19.422]);

    return [
      { id: 'base-osm', name: 'OpenStreetMap', type: 'raster', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', visible: true, opacity: 1 },
      { id: 'poly-1', name: 'Zone A', type: 'geojson', data: turf.featureCollection([poly1]), visible: true, opacity: 0.5, color: '#f59e0b' },
      { id: 'poly-2', name: 'Zone B', type: 'geojson', data: turf.featureCollection([poly2]), visible: true, opacity: 0.5, color: '#8b5cf6' },
      { id: 'points-1', name: 'Facilities', type: 'geojson', data: turf.featureCollection([pt1, pt2]), visible: true, opacity: 1, color: '#10b981' }
    ];
  }, []);

  const [layers, setLayers] = useState<GISLayer[]>(initialLayers);
  const [operation, setOperation] = useState<'buffer' | 'intersect' | 'union'>('buffer');
  
  // Params
  const [inputLayerId, setInputLayerId] = useState('poly-1');
  const [inputLayerId2, setInputLayerId2] = useState('poly-2');
  const [bufferDistance, setBufferDistance] = useState(1);
  const [bufferUnits, setBufferUnits] = useState<'kilometers' | 'meters' | 'miles'>('kilometers');

  const executeAnalysis = () => {
    try {
      const l1 = layers.find(l => l.id === inputLayerId);
      const l2 = layers.find(l => l.id === inputLayerId2);
      let resultData: any = null;
      let newName = '';
      let color = '#00e0ff';

      if (operation === 'buffer' && l1?.data) {
        // Buffer operation
        resultData = turf.buffer(l1.data, bufferDistance, { units: bufferUnits });
        newName = `Buffer (${l1.name})`;
        color = '#00e0ff';
      } 
      else if (operation === 'intersect' && l1?.data && l2?.data) {
        // We assume single polygon for simplicity, or we flatten
        // For real app, would need to handle feature collections properly
        const f1 = l1.data.features[0];
        const f2 = l2.data.features[0];
        if (f1 && f2) {
          resultData = turf.intersect(turf.featureCollection([f1, f2]));
          if (resultData) {
            resultData = turf.featureCollection([resultData]);
          }
        }
        newName = `Intersection (${l1.name} ∩ ${l2.name})`;
        color = '#ef4444';
      }
      else if (operation === 'union' && l1?.data && l2?.data) {
        const f1 = l1.data.features[0];
        const f2 = l2.data.features[0];
        if (f1 && f2) {
          resultData = turf.union(turf.featureCollection([f1, f2]));
          if (resultData) {
            resultData = turf.featureCollection([resultData]);
          }
        }
        newName = `Union (${l1.name} ∪ ${l2.name})`;
        color = '#10b981';
      }

      if (resultData) {
        setLayers(prev => [
          ...prev, 
          { id: `res-${Date.now()}`, name: newName, type: 'geojson', data: resultData, visible: true, opacity: 0.6, color }
        ]);
      } else {
        alert("Operation produced empty result or failed.");
      }
    } catch (err) {
      alert("Analysis error: " + err);
    }
  };

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="page-enter" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GISMap layers={layers} />
      </div>

      {/* Analysis Panel */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'absolute', top: 96, left: 104, width: 340, 
          maxHeight: 'calc(100vh - 110px)', overflowY: 'auto',
          zIndex: 10, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Hexagon size={22} className="text-accent-cyan" />
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif" }}>Advanced GIS Analysis</h2>
        </div>

        {/* Operation Selection */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>OPERATION</label>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
            {[
              { id: 'buffer', label: 'Buffer', icon: Circle },
              { id: 'intersect', label: 'Intersect', icon: BoxSelect },
              { id: 'union', label: 'Union', icon: Layers }
            ].map(op => (
              <button
                key={op.id}
                onClick={() => setOperation(op.id as any)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: operation === op.id ? 'var(--accent-blue)' : 'transparent',
                  color: operation === op.id ? '#fff' : 'var(--text-muted)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600
                }}
              >
                <op.icon size={16} />
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Input Layer 1</label>
            <select 
              value={inputLayerId} onChange={e => setInputLayerId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 13 }}
            >
              {layers.filter(l => l.type === 'geojson').map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {(operation === 'intersect' || operation === 'union') && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Input Layer 2</label>
              <select 
                value={inputLayerId2} onChange={e => setInputLayerId2(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 13 }}
              >
                {layers.filter(l => l.type === 'geojson').map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

          {operation === 'buffer' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Distance</label>
                <input 
                  type="number" value={bufferDistance} onChange={e => setBufferDistance(parseFloat(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 13 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Units</label>
                <select 
                  value={bufferUnits} onChange={e => setBufferUnits(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 13 }}
                >
                  <option value="kilometers">km</option>
                  <option value="meters">meters</option>
                  <option value="miles">miles</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={executeAnalysis}
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}
        >
          <Play size={16} /> Execute Analysis
        </button>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

        {/* Results / Layers */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, display: 'block' }}>ACTIVE LAYERS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {layers.filter(l => l.type === 'geojson').map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color, opacity: 0.8 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{l.name}</span>
                </div>
                {!l.id.startsWith('base') && (
                  <button onClick={() => removeLayer(l.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
