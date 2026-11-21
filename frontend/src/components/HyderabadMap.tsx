import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { getSeverityInfo } from '../utils/severityColor';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPoint } from '../types';
import { StatusBadge } from './StatusBadge';
import { ProvenanceBadge } from './ProvenanceBadge';

/** Solid dot = citizen report. Hollow ring = demo record (approximate location). */
const markerFor = (score: number, demo: boolean) => {
  const { hex } = getSeverityInfo(score);
  const html = demo
    ? `<span style="display:block;width:18px;height:18px;border-radius:50%;border:3px solid ${hex};background:#fff"></span>`
    : `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${hex};border:2px solid #fff;box-shadow:0 0 0 1px #334155"></span>`;
  return L.divIcon({ className: 'custom-leaflet-marker', html, iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -9] });
};

export const MapLegend: React.FC = () => {
  const { t } = useLanguage();
  const items = [
    { label: t.priority.Critical, hex: getSeverityInfo(90).hex },
    { label: t.priority.High, hex: getSeverityInfo(70).hex },
    { label: t.priority.Medium, hex: getSeverityInfo(50).hex },
    { label: t.priority.Low, hex: getSeverityInfo(20).hex },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
      <span className="font-medium">{t.map.legend}:</span>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: i.hex }} aria-hidden="true" />
          {i.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full border-2 border-slate-600 bg-white" aria-hidden="true" />
        {t.provenance.DEMO}
      </span>
    </div>
  );
};

export const HyderabadMap: React.FC<{ points: MapPoint[]; height?: string }> = ({ points, height = '560px' }) => {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg overflow-hidden border border-slate-300">
      <MapContainer center={[17.4065, 78.4772]} zoom={11} style={{ height, width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution={`${t.map.attribution} · <a href="https://www.openstreetmap.org/copyright">OSM</a>`}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={markerFor(p.priority.score, p.provenance === 'DEMO')}>
            <Popup>
              <div className="space-y-1.5 max-w-[240px]">
                <div className="flex flex-wrap gap-1">
                  <StatusBadge status={p.status} size="sm" />
                  <ProvenanceBadge source={p.provenance} />
                </div>
                <div className="font-medium leading-snug">{p.title}</div>
                <div className="text-xs text-slate-600">
                  {t.categories[p.category]} · {p.area}
                </div>
                {p.accuracy === 'area_approx' && <div className="text-xs text-amber-900">{t.map.approx}</div>}
                <Link to={`/track/${p.trackingId}`} className="text-sm text-civic-700 underline">
                  {t.map.open}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
