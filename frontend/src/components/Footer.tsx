import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-civic-950 text-slate-400 text-xs border-t border-civic-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Identity & Scope */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-civic-700 flex items-center justify-center text-white font-black text-xs">
                CE
              </div>
              <span className="font-bold text-white text-sm">CivicEye Hyderabad</span>
              <span className="text-[10px] font-mono bg-civic-900 text-slate-300 px-1.5 py-0.5 rounded border border-civic-800">
                v2.0
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Civic Infrastructure Grievance and Triage Intelligence Platform designed for Greater Hyderabad. Features multi-factor urgency ranking, 500-meter geospatial deduplication via MongoDB 2dsphere indexing, and transparent photographic resolution proof.
            </p>
            <div className="p-3 rounded bg-civic-900/80 border border-civic-800 text-[11px] text-slate-300 max-w-lg">
              <strong className="text-white">Data Provenance Disclosure:</strong> Civic complaints are either citizen-submitted directly through this portal or sourced from clearly labeled prototype test seeds. No artificial streaming counts or fabricated government statuses are displayed.
            </div>
          </div>

          {/* Jurisdictional Departments */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Monitored Agencies
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>GHMC Roads & Infrastructure</li>
              <li>GHMC Stormwater Drainage & Sewerage</li>
              <li>TSSPDCL Electrical Safety & Hazards</li>
              <li>HMWSSB Potable Water Distribution</li>
              <li>GHMC Sanitation & Solid Waste</li>
              <li>GHMC Public Lighting & Dark Spots</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Platform Navigation
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Complaint Registry
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-white transition-colors">
                  Hyderabad Hotspot Map
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-white transition-colors">
                  Public Analytics & Metrics
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Methodology & Provenance
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Citizen & Admin Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-civic-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© 2026 CivicEye. Developed for Hyderabad Civic Technology Evaluation.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium">Built with React, Express, MongoDB & Leaflet</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
