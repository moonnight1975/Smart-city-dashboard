'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMapEvents, useMap, Marker, Popup } from 'react-leaflet';
import type { GISLayer } from './pages/GISExplorerPage';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// A component to attach mousemove and click events to the map
function MapEvents({ onMouseMove, onClick }: { onMouseMove?: (lat: number, lng: number) => void, onClick?: (lat: number, lng: number) => void }) {
  const events: any = {};
  if (onMouseMove) {
    events.mousemove = (e: any) => onMouseMove(e.latlng.lat, e.latlng.lng);
  }
  if (onClick) {
    events.click = (e: any) => onClick(e.latlng.lat, e.latlng.lng);
  }
  useMapEvents(events);
  return null;
}

function MapCenterFitter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const didFly = useRef(false);
  useEffect(() => {
    if (center && !didFly.current) {
      map.flyTo(center, map.getZoom());
      didFly.current = true;
    }
  }, [center, map]);
  return null;
}

function MapBoundsFitter({ geojsonData }: { geojsonData: any }) {
  const map = useMap();
  useEffect(() => {
    if (geojsonData) {
      try {
        const geojsonLayer = L.geoJSON(geojsonData);
        const bounds = geojsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch (e) {
        console.warn('Failed to fit bounds', e);
      }
    }
  }, [geojsonData, map]);
  return null;
}

function shiftGeoJSON(data: any, latOffset: number, lngOffset: number) {
  if (!data) return data;
  try {
    const clone = JSON.parse(JSON.stringify(data));
    const shiftCoords = (coords: any[]) => {
      if (typeof coords[0] === 'number') {
        coords[0] += lngOffset; // longitude
        coords[1] += latOffset; // latitude
      } else {
        coords.forEach(shiftCoords);
      }
    };
    
    if (clone.type === 'FeatureCollection') {
      clone.features.forEach((f: any) => {
        if (f.geometry && f.geometry.coordinates) {
          shiftCoords(f.geometry.coordinates);
        }
      });
    } else if (clone.geometry && clone.geometry.coordinates) {
      shiftCoords(clone.geometry.coordinates);
    }
    return clone;
  } catch (e) {
    return data;
  }
}

const DEFAULT_CENTER: [number, number] = [19.418, 72.818];

export default function GISMap({
  layers,
  center = DEFAULT_CENTER,
  zoom = 12,
  onMouseMove,
  onClick
}: {
  layers: GISLayer[];
  center?: [number, number];
  zoom?: number;
  onMouseMove?: (lat: number, lng: number) => void;
  onClick?: (lat: number, lng: number) => void;
}) {
  const [deviceLocation, setDeviceLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeviceLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const shiftedLayers = useMemo(() => {
    if (!deviceLocation) return layers;
    
    const latOffset = deviceLocation[0] - DEFAULT_CENTER[0];
    const lngOffset = deviceLocation[1] - DEFAULT_CENTER[1];

    return layers.map(layer => {
      if (layer.type === 'geojson' && layer.data) {
        return {
          ...layer,
          data: shiftGeoJSON(layer.data, latOffset, lngOffset)
        };
      }
      return layer;
    });
  }, [layers, deviceLocation]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <MapCenterFitter center={deviceLocation} />
        <MapEvents onMouseMove={onMouseMove} onClick={onClick} />
        
        {/* Fit map to latest route or buffer if it was just added */}
        {(() => {
          const latestRoute = shiftedLayers.find(l => (l.id.startsWith('route-') || l.id.startsWith('buffer-')) && l.visible);
          return latestRoute ? <MapBoundsFitter geojsonData={latestRoute.data} /> : null;
        })()}
        
        {deviceLocation && (
          <Marker position={deviceLocation} icon={L.divIcon({
            className: '',
            html: `
              <div style="
                width: 18px; height: 18px; border-radius: 999px;
                background: #3b82f6;
                box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 0 22px #3b82f6;
                border: 2px solid #fff;
              "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Render raster layers first (as basemaps) */}
        {shiftedLayers.filter(l => l.type === 'raster' && l.visible).map(layer => (
          <TileLayer
            key={layer.id}
            url={layer.url!}
            opacity={layer.opacity}
            attribution={layer.attribution || "&copy; OpenStreetMap contributors"}
          />
        ))}

        {/* Render WMS layers */}
        {shiftedLayers.filter(l => l.type === 'wms' && l.visible).map(layer => (
          <WMSTileLayer
            key={layer.id}
            url={layer.url!}
            layers={layer.wmsLayer!}
            format="image/png"
            transparent={true}
            opacity={layer.opacity}
            attribution={layer.attribution || "&copy; ISRO Bhuvan"}
          />
        ))}

        {/* Render GeoJSON layers on top */}
        {shiftedLayers.filter(l => l.type === 'geojson' && l.visible).map(layer => (
          <GeoJSON
            key={layer.id + (deviceLocation ? '-shifted' : '')}
            data={layer.data}
            style={{
              color: layer.color || '#3388ff',
              weight: 2,
              opacity: layer.opacity,
              fillOpacity: layer.opacity * 0.4
            }}
            onEachFeature={(feature, leafletLayer) => {
              if (feature.properties) {
                const popupContent = Object.entries(feature.properties)
                  .map(([key, val]) => `<strong>${key}:</strong> ${val}`)
                  .join('<br/>');
                leafletLayer.bindPopup(popupContent);
              }
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
