import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon paths for bundlers like Vite.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center?.[0] || !center?.[1]) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

export default function LocationPickerMap({ value, onChange }) {
  const center = useMemo(() => {
    if (value?.lat && value?.lng) return [value.lat, value.lng];
    return [28.6139, 77.209];
  }, [value?.lat, value?.lng]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={12} style={{ height: 260, width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />

        {value?.lat && value?.lng ? <Marker position={[value.lat, value.lng]} /> : null}

        <ClickHandler
          onPick={(loc) => {
            onChange?.(loc);
          }}
        />
      </MapContainer>
      <div style={{ padding: 10 }} className="muted">
        Map demo: click to pick location. Selected: {value?.lat?.toFixed?.(5) || '—'},{' '}
        {value?.lng?.toFixed?.(5) || '—'}
      </div>
    </div>
  );
}
