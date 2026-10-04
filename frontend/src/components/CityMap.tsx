'use client';

import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export type MapMarker = {
  id: string;
  kind: 'complaint' | 'traffic' | 'water' | 'waste' | 'road' | 'alert' | 'sensor';
  title: string;
  subtitle?: string;
  severity?: 'good' | 'warning' | 'critical';
  lat: number;
  lng: number;
  meta?: Record<string, string | number>;
};

function iconFor(kind: MapMarker['kind'], severity?: MapMarker['severity']) {
  const color =
    severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : kind === 'water' ? '#3b82f6' : kind === 'waste' ? '#10b981' : kind === 'traffic' ? '#f97316' : kind === 'road' ? '#a78bfa' : '#00d4ff';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 14px; height: 14px; border-radius: 999px;
        background: ${color};
        box-shadow: 0 0 0 4px rgba(255,255,255,0.12), 0 0 22px ${color}55;
        border: 2px solid rgba(6, 11, 24, 0.9);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });
}

function MapBoundsFitter({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds.pad(0.25));
    }
  }, [bounds, map]);
  return null;
}

const DEFAULT_CENTER: [number, number] = [19.418, 72.818]; // Nalasopara, India

export default function CityMap({
  markers,
  center = DEFAULT_CENTER,
  zoom = 13,
  height = 520,
  className,
  style,
}: {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const bounds = useMemo(() => {
    if (!markers || markers.length === 0) return null;
    const latLngs = markers.map((m) => L.latLng(m.lat, m.lng));
    return L.latLngBounds(latLngs);
  }, [markers]);

  return (
    <div className={className || "glass-card"} style={{ padding: className === undefined ? 12 : 0, ...style }}>
      <div style={{ borderRadius: className === undefined ? 14 : 0, overflow: 'hidden', height: '100%', border: className === undefined ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
        <MapContainer
          center={bounds && bounds.isValid() ? bounds.getCenter() : center}
          zoom={zoom}
          style={{ height, width: '100%' }}
          scrollWheelZoom
        >
          <MapBoundsFitter bounds={bounds} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers && markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={iconFor(m.kind, m.severity)}>
              <Popup>
                <div style={{ minWidth: 220, color: '#0a1121' }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{m.title}</div>
                  {m.subtitle && <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>{m.subtitle}</div>}
                  {m.meta && (
                    <div style={{ display: 'grid', gap: 4 }}>
                      {Object.entries(m.meta).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
                          <span style={{ opacity: 0.7 }}>{k}</span>
                          <span style={{ fontWeight: 700 }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
