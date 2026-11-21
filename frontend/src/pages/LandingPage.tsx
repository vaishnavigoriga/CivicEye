import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Complaint } from '../types';
import { HyderabadMap } from '../components/HyderabadMap';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDate } from '../utils/formatDate';
import { getSeverityInfo } from '../utils/severityColor';
import {
  Shield,
  MapPin,
  Calendar,
  ArrowRight,
  Database,
  Building2,
  FileCheck2,
  Compass,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ThumbsUp,
  Info,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [mapFeatures, setMapFeatures] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintsData, mapData, analyticsData] = await Promise.all([
          complaintsApi.getComplaints({ limit: 4, sortBy: 'priorityScore', sortOrder: 'desc' }),
          complaintsApi.getMapData(),
          complaintsApi.getAnalyticsSummary(),
        ]);

        setComplaints(complaintsData.complaints || []);
        setMapFeatures(mapData.features || []);
        setKpis(analyticsData.kpis || null);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Enterprise Institutional Hero */}
      <section className="bg-civic-900 text-white border-b border-civic-950 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-civic-850 border border-civic-700/60 text-teal-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>Greater Hyderabad Municipal Triage Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Civic Infrastructure Grievance & Municipal Intelligence
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              A public platform for reporting road craters, stormwater overflow, electrical hazards, and water pipeline ruptures across Hyderabad. Powered by multi-factor severity analysis, 500-meter geospatial deduplication, and verified photographic resolution proof.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/citizen/new">
                <Button variant="secondary" size="lg" className="font-semibold">
                  Report an Infrastructure Defect
                </Button>
              </Link>

              <Link to="/explore">
                <Button variant="outline" size="lg" className="bg-civic-850 hover:bg-civic-800 text-white border-civic-700">
                  Explore Public Registry
                </Button>
              </Link>
            </div>
          </div>

          {/* Institutional Disclosure Box */}
          <div className="p-3.5 rounded bg-civic-950/80 border border-civic-800 text-xs text-slate-300 flex items-start gap-2.5 max-w-2xl">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">Strict Data Provenance:</strong> Statistics and complaints shown on this portal reflect live database queries. Verified citizen complaints and clearly labeled test seeds are preserved and explicitly distinguished.
            </div>
          </div>
        </div>
      </section>

      {/* Real Live Database Metrics Grid (No hardcoded fallbacks) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Logged Grievances
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {kpis ? kpis.totalCount : <span className="text-slate-300 text-2xl font-normal">...</span>}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active across 10 municipal zones</span>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Verified Resolved
            </div>
            <div className="text-3xl font-black text-teal-800 mt-1 tabular-nums">
              {kpis ? kpis.resolvedCount : <span className="text-slate-300 text-2xl font-normal">...</span>}
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-1 block">With on-site photographic proof</span>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Field Repairs
            </div>
            <div className="text-3xl font-black text-civic-700 mt-1 tabular-nums">
              {kpis ? kpis.inProgressCount : <span className="text-slate-300 text-2xl font-normal">...</span>}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Assigned to municipal engineers</span>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Resolution Efficiency
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {kpis ? `${kpis.resolutionRate}%` : <span className="text-slate-300 text-2xl font-normal">...</span>}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Calculated from closed cases ratio</span>
          </Card>
        </div>
      </section>

      {/* Live Geospatial Hotspot Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-civic-700 uppercase tracking-wider mb-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Geospatial Coverage Layer</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Hyderabad Grievance Hotspot Map
            </h2>
          </div>

          <Link
            to="/map"
            className="text-xs font-bold text-civic-700 hover:text-civic-900 flex items-center gap-1"
          >
            <span>Open Fullscreen Map View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <HyderabadMap features={mapFeatures} height="460px" />
      </section>

      {/* The 4-Stage Municipal Lifecycle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6 bg-slate-50/70 border-slate-200">
          <div className="mb-6">
            <span className="text-[11px] font-mono font-bold text-civic-700 uppercase tracking-wider">
              Operational Architecture
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Standard Municipal Triage & Verification Workflow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every complaint follows a structured four-stage audit trail from citizen reporting to on-site closure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-md bg-white border border-slate-200 space-y-2">
              <div className="w-6 h-6 rounded bg-civic-100 text-civic-800 font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Multilingual Intake</h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Citizens submit grievances with photographs, GPS location, and voice dictation in English, Telugu, or Hindi.
              </p>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 space-y-2">
              <div className="w-6 h-6 rounded bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">500m Deduplication</h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                MongoDB 2dsphere queries identify nearby reports within 500 meters. Reports with Jaccard index ≥ 0.35 are grouped for review.
              </p>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 space-y-2">
              <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Severity & Dispatch</h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                The 4-factor formula calculates priority (1–100) with a duration bonus (no age penalty). Routed to the responsible department.
              </p>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 space-y-2">
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Proof of Resolution</h3>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Engineers upload on-site verification photographs and notes before marking complaints resolved. The full timeline is publicly traceable.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Top Priority Grievances Queue */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider mb-0.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Priority Triage Queue</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              High-Urgency Civic Grievances
            </h2>
          </div>

          <Link
            to="/explore"
            className="text-xs font-bold text-civic-700 hover:text-civic-900 flex items-center gap-1"
          >
            <span>View All ({kpis?.totalCount || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading active complaints queue...
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded border">
            No complaints currently logged in database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {complaints.map((item) => {
              const score = item.aiAnalysis?.priorityScore || 50;
              const severity = getSeverityInfo(score);
              const isDemo = item.aiAnalysis?.isSimulated;

              return (
                <Card key={item._id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {(item as any).complaintId || `CE-HYD-${item._id.slice(-6).toUpperCase()}`}
                      </span>
                      <Badge variant={item.status === 'resolved' ? 'success' : 'neutral'} size="sm">
                        {item.status}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </CardHeader>

                  <CardBody className="py-2 space-y-2 text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{item.location?.area}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: severity.hex }}
                        />
                        <span className="font-bold text-slate-800 tabular-nums">
                          Score: {score}/100
                        </span>
                      </div>

                      {isDemo ? (
                        <span className="text-[10px] text-slate-400">Demo Seed</span>
                      ) : (
                        <span className="text-[10px] text-teal-700 font-semibold">Verified</span>
                      )}
                    </div>
                  </CardBody>

                  <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <ThumbsUp className="w-3 h-3" />
                      <span className="tabular-nums text-[11px]">{item.upvotes || 0}</span>
                    </div>

                    <Link
                      to={`/citizen/complaints/${item._id}`}
                      className="font-semibold text-civic-700 hover:text-civic-900 text-xs inline-flex items-center gap-0.5"
                    >
                      <span>Track</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
