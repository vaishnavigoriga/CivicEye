import React, { useEffect, useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { HyderabadMap } from '../components/HyderabadMap';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import { MapPin, RotateCcw, Loader2, ShieldCheck, Layers, Info } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Roads',
  'Drainage',
  'Electricity',
  'Water Supply',
  'Sanitation',
  'Street Lights',
  'Parks',
  'Other',
];

const STATUSES = ['All', 'pending', 'assigned', 'in-progress', 'resolved'];

export const MapPage: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchMapFeatures = async () => {
    setLoading(true);
    try {
      const data = await complaintsApi.getMapData({ category, status });
      setFeatures(data.features || []);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapFeatures();
  }, [category, status]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Hyderabad Spatial GIS' }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-civic-50 text-civic-900 border border-civic-200 text-xs font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5 text-civic-700" />
            <span>GHMC Geospatial 2dsphere Layer</span>
          </div>
          <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
            Hyderabad Civic Grievance Spatial Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Displaying <strong className="text-slate-800 font-mono">{features.length}</strong> geo-referenced civic issues across Hyderabad localities indexed with OpenStreetMap and GeoJSON points.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 px-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-civic-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 px-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-civic-700 capitalize"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCategory('All');
              setStatus('All');
            }}
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-xs bg-white">
        {loading ? (
          <div className="h-[550px] flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
            <Loader2 className="w-6 h-6 animate-spin text-civic-700" />
            <span className="text-xs font-medium">Loading geospatial vector layer...</span>
          </div>
        ) : (
          <HyderabadMap features={features} height="600px" />
        )}
      </div>

      {/* Map Legend */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-800">Pin Severity Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>Critical (&gt;75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Moderate (40-75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Low (&lt;40)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span>Resolved</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          EPSG:4326 GeoJSON • OpenStreetMap Cartography
        </div>
      </div>
    </div>
  );
};
