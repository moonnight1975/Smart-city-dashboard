'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Activity, Droplets, Trash2, Wind, Navigation, AlertTriangle, Loader2 } from 'lucide-react';
import type { MapMarker } from '@/components/CityMap';

const CityMap = dynamic(() => import('@/components/CityMap'), {
  ssr: false,
  loading: () => <div className="glass-card skeleton" style={{ height: 400 }} />
});

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const [overviewRes, mapRes] = await Promise.all([
          fetch(`${baseUrl}/api/v2/metrics/overview`),
          fetch(`${baseUrl}/api/v2/metrics/map`)
        ]);
        const overviewData = await overviewRes.json();
        const mapData = await mapRes.json();
        
        setMetrics(overviewData);
        setMapMarkers(mapData.markers || []);
      } catch (error) {
        console.error("Failed to load overview data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOverview();
  }, []);

  if (loading || !metrics || metrics.error) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <Loader2 className="animate-spin text-accent-cyan" size={32} />
    </div>
  );

  return (
    <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">City Command Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time overview of urban operations and active incidents.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
              <Wind size={18} /> <span style={{ fontSize: 13, fontWeight: 700 }}>AQI</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc' }}>{metrics.aqi.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Air Quality Index</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444' }}>
              <Navigation size={18} /> <span style={{ fontSize: 13, fontWeight: 700 }}>Traffic</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc' }}>{metrics.traffic.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Congestion Index</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
              <Trash2 size={18} /> <span style={{ fontSize: 13, fontWeight: 700 }}>Waste</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc' }}>{metrics.waste.value}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Collection Rate</div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6' }}>
              <Droplets size={18} /> <span style={{ fontSize: 13, fontWeight: 700 }}>Water</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc' }}>{metrics.water.value}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Reservoir Level</div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        
        <div className="glass-card" style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8' } } as any}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)' }}>
            <div className="section-title" style={{ margin: 0 }}>Live Map (Overview)</div>
          </div>
          <div style={{ height: 400 }}>
            <CityMap markers={mapMarkers} />
          </div>
        </div>
        <div className="glass-card" style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', '@media (min-width: 1024px)': { gridColumn: 'span 4' } } as any}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)' }}>
            <div className="section-title" style={{ margin: 0 }}>Recent Alerts</div>
          </div>
          <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metrics.recent_alerts.map((alert: any) => (
              <div key={alert.id} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
                <AlertTriangle size={16} color={alert.severity === 'high' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, color: '#f8fafc', marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
