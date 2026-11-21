import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Default Leaflet marker icons are bundled via CDN-free URLs from the leaflet package.
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface LatLng {
  lat: number;
  lng: number;
}

const ClickHandler: React.FC<{ onPick: (p: LatLng) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

interface Props {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  attribution: string;
  height?: string;
}

/** Click-to-place location picker. Shows nothing selected until the user actually picks a point. */
export const LocationPicker: React.FC<Props> = ({ value, onChange, attribution, height = '320px' }) => (
  <div className="rounded-md overflow-hidden border border-slate-300">
    <MapContainer
      center={value ? [value.lat, value.lng] : [17.385, 78.4867]}
      zoom={value ? 16 : 11}
      style={{ height, width: '100%' }}
      key={value ? 'pinned' : 'empty'}
    >
      <TileLayer
        attribution={`${attribution} · <a href="https://www.openstreetmap.org/copyright">OSM</a>`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
    </MapContainer>
  </div>
);
