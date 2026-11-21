import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getSeverityInfo, getStatusBadgeInfo } from '../utils/severityColor';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, Calendar, ArrowRight } from 'lucide-react';

// Fix Leaflet default icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored SVG pin markers for severity bands
const createCustomMarker = (score: number) => {
  const info = getSeverityInfo(score);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="42">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${info.hex}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
      <text x="12" y="15" font-size="7" font-weight="bold" fill="${info.hex}" text-anchor="middle">${score}</text>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
};

interface GeoFeature {
  type: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lat, lng]
  };
  properties: {
    id: string;
    title: string;
    category: string;
    status: string;
    priorityScore: number;
    aiSeverityRating: number;
    isSimulated: boolean;
    address: string;
    area: string;
    upvotes: number;
    createdAt: string;
  };
}

interface HyderabadMapProps {
  features: GeoFeature[];
  height?: string;
  onMarkerClick?: (complaintId: string) => void;
  center?: [number, number];
  zoom?: number;
}

export const HyderabadMap: React.FC<HyderabadMapProps> = ({
  features = [],
  height = '550px',
  center = [17.4065, 78.4772], // Central Hyderabad
  zoom = 12,
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md">
      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs">
        <div className="font-bold text-slate-800 mb-1.5">Priority Severity Index</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>Critical (80+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span>High (60-79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Medium (40-59)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Low (1-39)</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {features.map((feature) => {
          const [lat, lng] = feature.geometry.coordinates;
          const { id, title, category, status, priorityScore, area, address, upvotes } = feature.properties;

          return (
            <Marker
              key={id}
              position={[lat, lng]}
              icon={createCustomMarker(priorityScore)}
            >
              <Popup className="civiceye-custom-popup">
                <div className="p-1 max-w-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                    {title}
                  </h4>

                  <div className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">{area} - {address}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-700">
                      Score: <span className="text-blue-700">{priorityScore}/100</span>
                    </div>

                    <Link
                      to={`/citizen/complaints/${id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                    >
                      Track <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
