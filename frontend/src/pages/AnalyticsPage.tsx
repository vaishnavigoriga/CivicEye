import React, { useEffect, useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Clock,
  Wrench,
  Info,
  Layers
} from 'lucide-react';

const CIVIC_COLORS = ['#0F766E', '#0B192C', '#D97706', '#2563EB', '#059669', '#DC2626', '#64748B', '#7C3AED'];

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await complaintsApi.getAnalyticsSummary();
        setData(res);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
        <span className="text-xs font-medium">Aggregating municipal grievance telemetry...</span>
      </div>
    );
  }

  const kpis = data?.kpis || { totalCount: 0, resolvedCount: 0, inProgressCount: 0, pendingCount: 0, resolutionRate: 0 };
  const byCategory = data?.byCategory || [];
  const byStatus = data?.byStatus || [];
  const byArea = data?.byArea || [];

  const hasData = kpis.totalCount > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Public Analytics' }]} />

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-civic-50 text-civic-900 border border-civic-200 text-xs font-semibold mb-1">
          <BarChart3 className="w-3.5 h-3.5 text-civic-700" />
          <span>Greater Hyderabad Municipal Open Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
          Civic Infrastructure Grievance Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time aggregated triage telemetry, departmental resolution velocity, and geospatial defect distribution across Hyderabad.
        </p>
      </div>

      {/* Data Provenance Notice */}
      <Alert
        variant="info"
        title="Open Data Transparency Commitment"
      >
        All charts, counts, and percentages displayed here are computed strictly from verified database records in the CivicEye MongoDB instance. CivicEye does NOT simulate or fabricate municipal metrics.
      </Alert>

      {/* Real KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Grievances
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {kpis.totalCount}
          </div>
          <span className="text-[10px] text-slate-400">Indexed across 10 GHMC zones</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Verified Resolved
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {kpis.resolvedCount}
          </div>
          <span className="text-[10px] text-emerald-700">With photographic completion proof</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-civic-700 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Active Field Repairs
          </div>
          <div className="text-2xl font-bold font-mono text-civic-700 mt-1">
            {kpis.inProgressCount}
          </div>
          <span className="text-[10px] text-slate-400">Assigned engineering crews</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Resolution Velocity
          </div>
          <div className="text-2xl font-bold font-mono text-teal-800 mt-1">
            {kpis.resolutionRate}%
          </div>
          <span className="text-[10px] text-slate-400">Resolved to logged case ratio</span>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-md mx-auto space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-sm">No Grievance Telemetry Recorded</h3>
          <p className="text-xs text-slate-500">
            No complaints have been logged in the active database yet. Charts will populate automatically as complaints are registered.
          </p>
        </div>
      ) : (
        /* Visual Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Categories Breakdown (Pie Chart) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
            <h3 className="font-semibold text-slate-900 text-sm">Grievances by Infrastructure Category</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution across Roads, Water Supply, Drainage, Electricity, etc.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {byCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CIVIC_COLORS[index % CIVIC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Lifecycle Statuses (Bar Chart) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
            <h3 className="font-semibold text-slate-900 text-sm">Grievance Lifecycle Progression</h3>
            <p className="text-xs text-slate-500 mb-4">Status count from submission through photographic verification</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus}>
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0B192C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Top Localities Distribution */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs lg:col-span-2">
            <h3 className="font-semibold text-slate-900 text-sm">Defect Concentration by Hyderabad Locality</h3>
            <p className="text-xs text-slate-500 mb-4">Frequency of reported municipal issues across GHMC administrative zones</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byArea}>
                  <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0F766E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
