import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  Clock,
  Wrench,
  CheckCircle2,
  Building2,
  Copy,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Flame,
  FileText
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [kpiData, complaintsData] = await Promise.all([
          adminApi.getKPIs(),
          adminApi.getAllComplaints({ limit: 8, sortBy: 'priorityScore', sortOrder: 'desc' }),
        ]);
        setKpis(kpiData);
        setRecentComplaints(complaintsData.complaints || []);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
        <span className="text-xs font-medium">Aggregating municipal telemetry and triage queues...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Municipal Administration' }, { label: 'Command Console' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-civic-50 text-civic-900 border border-civic-200 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-civic-700" />
            <span>GHMC Administrative & Zonal Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
            Municipal Command Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time grievance triage, departmental dispatch, 500m geospatial duplicate verification, and SLA oversight.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Link to="/admin/duplicates">
            <Button variant="outline" size="sm">
              <Copy className="w-3.5 h-3.5 mr-1 text-amber-600" />
              <span>Review Duplicates ({kpis?.duplicateGroupsCount || 0})</span>
            </Button>
          </Link>

          <Link to="/admin/complaints">
            <Button variant="primary" size="sm">
              <span>All Grievances</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Strict Provenance KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Logged
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {kpis?.totalComplaints || 0}
          </div>
          <span className="text-[10px] text-slate-400">All 10 zones</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Triage
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            {kpis?.pendingComplaints || 0}
          </div>
          <span className="text-[10px] text-slate-400">Awaiting department</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Dept Assigned
          </div>
          <div className="text-xl font-bold font-mono text-teal-800 mt-1">
            {kpis?.assignedComplaints || 0}
          </div>
          <span className="text-[10px] text-slate-400">Routed to engineering</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-civic-700 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Field Action
          </div>
          <div className="text-xl font-bold font-mono text-civic-700 mt-1">
            {kpis?.inProgressComplaints || 0}
          </div>
          <span className="text-[10px] text-slate-400">Active repairs</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Verified Closed
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {kpis?.resolvedComplaints || 0}
          </div>
          <span className="text-[10px] text-slate-400">With photo proof</span>
        </div>

        <div className="bg-rose-50/50 p-3.5 rounded-lg border border-rose-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-600" />
            Critical SLA
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            {kpis?.criticalSeverityCount || 0}
          </div>
          <span className="text-[10px] text-rose-600">Priority score &gt; 75</span>
        </div>
      </div>

      {/* High-Urgency Triage Queue */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              High-Priority Triage Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked in descending order by transparent 4-factor severity algorithm
            </p>
          </div>
          <Link
            to="/admin/complaints"
            className="text-xs font-medium text-civic-700 hover:text-civic-900 transition-colors"
          >
            View Full Queue &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Urgency</th>
                <th className="py-2.5 px-4">Grievance Title</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Locality</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentComplaints.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <SeverityBadge score={c.aiAnalysis?.priorityScore || 50} size="sm" />
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <Link
                      to={`/citizen/complaints/${c._id}`}
                      className="font-medium text-slate-900 hover:text-civic-700 transition-colors line-clamp-1"
                    >
                      {c.title}
                    </Link>
                    <span className="text-[10px] text-slate-400">
                      ID: CE-{c._id?.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{c.location?.area}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/citizen/complaints/${c._id}`}>
                      <Button variant="outline" size="sm">
                        Inspect
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
