'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Layers, Upload, Download, Map as MapIcon, Info, Eye, EyeOff, Settings, X, Plus, Navigation, MapPin
} from 'lucide-react';
import * as turf from '@turf/turf';
import { fetchShortestPath } from '@/lib/gisApi';

// Load map dynamically
const GISMap = dynamic(() => import('@/components/GISMap'), {
  ssr: false,
  loading: () => <div className="glass-card skeleton" style={{ height: '100%' }} />
});

export type GISLayer = {
  id: string;
  name: string;
  type: 'geojson' | 'raster' | 'wms';
  data?: any; // GeoJSON feature collection
  url?: string; // Raster or WMS tile url
  wmsLayer?: string; // WMS Layer name
  attribution?: string;
  visible: boolean;
  opacity: number;
  color?: string;
};

export default function GISExplorerPage() {
  const [layers, setLayers] = useState<GISLayer[]>([
    {
      id: 'base-osm',
      name: 'OpenStreetMap (Default)',
      type: 'raster',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      visible: true,
      opacity: 1
    },
    {
      id: 'base-dark',
      name: 'CartoDB Dark Matter',
      type: 'raster',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      visible: false,
      opacity: 1
    },
    {
      id: 'base-satellite',
      name: 'Esri Satellite',
      type: 'raster',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      visible: false,
      opacity: 1
    },
    {
      id: 'bhuvan-lulc-50k',
      name: 'ISRO Bhuvan LULC 50K (2015-16)',
      type: 'wms',
      url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
      wmsLayer: 'lulc:MH_LULC50K_1516',
      attribution: 'Map data &copy; <a href="https://bhuvan.nrsc.gov.in">ISRO Bhuvan</a> - LULC 50K (Maharashtra 2015-16)',
      visible: false,
      opacity: 0.7
    }
  ]);
  
  const [showPanel, setShowPanel] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<{lat: number, lng: number} | null>(null);

  // Routing State
  const [routeMode, setRouteMode] = useState(false);
  const [routeStart, setRouteStart] = useState<{lat: number, lng: number} | null>(null);
  const [routeEnd, setRouteEnd] = useState<{lat: number, lng: number} | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<{distance?: number | string} | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target?.result as string);
        setLayers(prev => [
          {
            id: `layer-${Date.now()}`,
            name: file.name,
            type: 'geojson',
            data: geojson,
            visible: true,
            opacity: 0.8,
            color: '#00e0ff'
          },
          ...prev
        ]);
      } catch (err) {
        alert("Invalid GeoJSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = (layer: GISLayer) => {
    if (layer.type !== 'geojson' || !layer.data) return;
    const blob = new Blob([JSON.stringify(layer.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = layer.name.endsWith('.geojson') ? layer.name : `${layer.name}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const changeOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  const setBaseMap = (id: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id.startsWith('base-')) {
        return { ...l, visible: l.id === id };
      }
      return l;
    }));
  };

  const calculateRoute = async (end: {lat: number, lng: number}) => {
    if (!routeStart) return;
    setIsRouting(true);
    setRouteError(null);
    try {
      const data = await fetchShortestPath(routeStart.lat, routeStart.lng, end.lat, end.lng);
      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        setLayers(prev => [
          {
            id: `route-${Date.now()}`,
            name: 'Bhuvan Shortest Path',
            type: 'geojson',
            data: data,
            visible: true,
            opacity: 1,
            color: '#10b981'
          },
          ...prev
        ]);
        if (feature.properties && feature.properties.distance) {
          setRouteStats({ distance: feature.properties.distance });
        } else {
          setRouteStats({});
        }
      } else {
        setRouteError("No route found between these points.");
      }
    } catch (err: any) {
      setRouteError(err.message || "Failed to calculate route");
    } finally {
      setIsRouting(false);
      setRouteMode(false);
      setRouteStart(null);
      setRouteEnd(null);
    }
  };

  const performBufferAnalysis = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.type !== 'geojson' || !layer.data) {
      alert("Invalid layer for buffer analysis.");
      return;
    }
    try {
      const buffered = turf.buffer(layer.data, 0.5, { units: 'kilometers' });
      setLayers(prev => [
        {
          id: `buffer-${Date.now()}`,
          name: `${layer.name} (500m Buffer)`,
          type: 'geojson',
          data: buffered,
          visible: true,
          opacity: 0.5,
          color: '#8b5cf6'
        },
        ...prev
      ]);
    } catch (err) {
      alert("Error performing buffer analysis.");
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!routeMode) return;
    if (!routeStart) {
      setRouteStart({ lat, lng });
    } else if (!routeEnd) {
      setRouteEnd({ lat, lng });
      calculateRoute({ lat, lng });
    }
  };

  const toggleRouteMode = () => {
    setRouteMode(!routeMode);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteError(null);
    setRouteStats(null);
  };

  // Combine standard layers with temporary routing markers
  const activeLayers = [...layers];
  if (routeMode && routeStart) {
    activeLayers.push({
      id: 'route-start-marker',
      name: 'Start Point',
      type: 'geojson',
      data: turf.point([routeStart.lng, routeStart.lat]),
      visible: true,
      opacity: 1,
      color: '#f59e0b'
    });
  }

  return (
    <div className="page-enter" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Map Container */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, cursor: routeMode ? 'crosshair' : 'default' }}>
        <GISMap 
          layers={activeLayers}
          onMouseMove={(lat, lng) => setCursorCoords({lat, lng})}
          onClick={handleMapClick}
        />
      </div>

      {/* Control Panel (Left) */}
      {showPanel && (
        <div 
          className="glass-card" 
          style={{ 
            position: 'absolute', top: 96, left: 104, width: 320, 
            maxHeight: 'calc(100vh - 110px)', overflowY: 'auto',
            zIndex: 10, padding: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapIcon size={20} className="text-accent-cyan" />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>GIS Explorer</h2>
            </div>
            <button onClick={() => setShowPanel(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Import/Export Tools */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <label className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer', padding: '8px' }}>
              <Upload size={14} /> Import GeoJSON
              <input type="file" accept=".geojson,.json" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>

          {/* Routing Tools */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                <Navigation size={14} className="text-accent-cyan" />
                <span>ISRO Bhuvan Routing</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={toggleRouteMode}
                className={routeMode ? "btn-primary" : "btn-secondary"}
                style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 12 }}
                disabled={isRouting}
              >
                {isRouting ? 'Calculating...' : routeMode ? 'Cancel Routing' : 'Plan New Route'}
              </button>
              
              {layers.some(l => l.id.startsWith('route-')) && (
                <button 
                  onClick={() => setLayers(prev => prev.filter(l => !l.id.startsWith('route-') && l.id !== 'route-start-marker'))}
                  className="btn-secondary"
                  style={{ padding: '8px', fontSize: 12, color: 'var(--accent-red)' }}
                  title="Clear all routes"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {routeMode && !isRouting && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                {!routeStart ? 'Click on the map to set Start Point.' : 'Click to set End Point.'}
              </div>
            )}
            
            {routeError && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--accent-red)' }}>
                {routeError}
              </div>
            )}
            
            {routeStats?.distance && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-primary)' }}>
                <strong>Distance:</strong> {routeStats.distance}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />

          {/* Basemaps */}
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Basemap</h3>
          <select 
            className="input-field" 
            style={{ marginBottom: 16, padding: '8px 12px' }}
            onChange={(e) => setBaseMap(e.target.value)}
            value={layers.find(l => l.id.startsWith('base-') && l.visible)?.id || ''}
          >
            {layers.filter(l => l.id.startsWith('base-')).map(l => (
              <option key={l.id} value={l.id} style={{ background: '#0d1629' }}>{l.name}</option>
            ))}
          </select>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />

          {/* Layer List */}
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Data Layers</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {layers.filter(l => !l.id.startsWith('base-')).map(layer => (
              <div key={layer.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Layers size={14} color={layer.type === 'geojson' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                    <span title={layer.name}>{layer.name.length > 20 ? layer.name.substring(0,20)+'...' : layer.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {layer.type === 'geojson' && (
                      <button onClick={() => handleExport(layer)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Download size={14} />
                      </button>
                    )}
                    <button onClick={() => toggleVisibility(layer.id)} style={{ background: 'transparent', border: 'none', color: layer.visible ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
                      {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>
                
                {layer.visible && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Opacity</span>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.1" 
                      value={layer.opacity} 
                      onChange={(e) => changeOpacity(layer.id, parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />

          {/* Analysis Tools */}
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Analysis Tools</h3>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 10 }}>500m Buffer Zone</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                id="buffer-layer-select"
                className="input-field" 
                style={{ flex: 1, padding: '6px', fontSize: 12 }}
              >
                <option value="">Select GeoJSON...</option>
                {layers.filter(l => l.type === 'geojson').map(l => (
                  <option key={l.id} value={l.id} style={{ background: '#0d1629' }}>{l.name}</option>
                ))}
              </select>
              <button 
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  const select = document.getElementById('buffer-layer-select') as HTMLSelectElement;
                  if (select && select.value) performBufferAnalysis(select.value);
                }}
              >
                Run
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Toggle Panel Button (if hidden) */}
      {!showPanel && (
        <button 
          onClick={() => setShowPanel(true)}
          className="glass-card"
          style={{ position: 'absolute', top: 96, left: 104, zIndex: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--border-color)' }}
        >
          <Layers size={20} className="text-accent-cyan" />
        </button>
      )}

      {/* Coordinate & Scale Display */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'absolute', bottom: 24, right: 24, zIndex: 10, 
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)'
        }}
      >
        <span>Lat: {cursorCoords ? cursorCoords.lat.toFixed(5) : '---'}</span>
        <span>Lng: {cursorCoords ? cursorCoords.lng.toFixed(5) : '---'}</span>
      </div>

    </div>
  );
}
