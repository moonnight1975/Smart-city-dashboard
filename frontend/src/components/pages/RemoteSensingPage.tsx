'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Camera, Image as ImageIcon, SlidersHorizontal, Settings2, Download } from 'lucide-react';

const GISMap = dynamic(() => import('@/components/GISMap'), {
  ssr: false,
  loading: () => <div className="glass-card skeleton" style={{ height: '100%' }} />
});

export default function RemoteSensingPage() {
  const [bandCombination, setBandCombination] = useState<'true' | 'false' | 'ndvi'>('true');
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);

  // We will use different tile layers to simulate band combinations
  const tileUrl = bandCombination === 'true'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : bandCombination === 'false'
      ? 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_SurfaceReflectance_Bands721/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png'
      : 'https://tiles.openaerialmap.org/5923296e053f31000b05b4b7/0/5923296e053f31000b05b4b8/{z}/{x}/{y}.png'; // Demo URLs for illustration

  const filterStyle = `brightness(${brightness}) contrast(${contrast})`;

  return (
    <div className="page-enter" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Map Viewer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, filter: filterStyle }}>
        <GISMap layers={[
          { id: 'sat', name: 'Satellite Imagery', type: 'raster', url: tileUrl, visible: true, opacity: 1 }
        ]} />
      </div>

      {/* Remote Sensing Tools */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'absolute', top: 96, left: 104, width: 340, 
          zIndex: 10, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ImageIcon size={22} className="text-accent-cyan" />
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif', sans-serif" }}>Remote Sensing</h2>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>BAND COMBINATION</label>
          <select 
            value={bandCombination} onChange={e => setBandCombination(e.target.value as any)}
            style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }}
          >
            <option value="true">True Color (RGB)</option>
            <option value="false">False Color (Color Infrared)</option>
            <option value="ndvi">NDVI (Vegetation Index)</option>
          </select>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            {bandCombination === 'true' && "Visible spectrum for natural appearance."}
            {bandCombination === 'false' && "Near-infrared, red, and green bands. Vegetation appears red."}
            {bandCombination === 'ndvi' && "Normalized Difference Vegetation Index. Highlights healthy vegetation."}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, display: 'block' }}>IMAGE ENHANCEMENT</label>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Brightness</span>
              <span>{Math.round(brightness * 100)}%</span>
            </div>
            <input 
              type="range" min="0.2" max="2" step="0.1" 
              value={brightness} onChange={e => setBrightness(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Contrast</span>
              <span>{Math.round(contrast * 100)}%</span>
            </div>
            <input 
              type="range" min="0.5" max="3" step="0.1" 
              value={contrast} onChange={e => setContrast(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Data Source</div>
            <span className="badge badge-red">DEMO</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {bandCombination === 'true' && "Tiles provided by Esri World Imagery (Archival)."}
            {bandCombination === 'false' && "Tiles provided by NASA MODIS Terra (Global Demo)."}
            {bandCombination === 'ndvi' && "Tiles provided by OpenAerialMap (Open Source Demo)."}
            <br/>Not pulling live localized Nalasopara data.
          </div>
        </div>

        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>
          <Download size={14} /> Export (Disabled)
        </button>

      </div>
    </div>
  );
}
