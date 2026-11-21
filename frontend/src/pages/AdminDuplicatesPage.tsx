import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/formatDate';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import {
  Copy,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export const AdminDuplicatesPage: React.FC = () => {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDuplicateGroups();
      setGroups(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch duplicate groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleReview = async (complaintId: string, decision: 'confirmed' | 'rejected') => {
    setActingId(complaintId);
    try {
      await adminApi.reviewDuplicate(complaintId, decision);
      showToast(
        decision === 'confirmed'
          ? 'Duplicate cluster confirmed. Parent grouping retained.'
          : 'Complaint separated from duplicate cluster.',
        'success'
      );
      fetchGroups();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Municipal Administration', href: '/admin' },
          { label: 'Duplicate Review' },
        ]}
      />

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold mb-1">
          <Copy className="w-3.5 h-3.5 text-amber-700" />
          <span>MongoDB 2dsphere 500m & Jaccard Algorithmic Clustering</span>
        </div>
        <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
          Duplicate Grievance Cluster Review
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complaints automatically flagged within a 500-meter geospatial radius with high semantic description similarity.
          Individual citizen reports are preserved in the audit log while clustered for departmental triage efficiency.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-civic-700" />
          <span className="text-xs font-medium">Scanning 2dsphere spatial index for duplicate clusters...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">No Pending Duplicate Clusters</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            All registered civic grievances across Hyderabad's 10 zones have distinct geospatial and semantic classifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, idx) => (
            <div
              key={group._id}
              className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Cluster Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-civic-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    Cluster ID: <span className="font-mono text-slate-600">{group._id}</span>
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {group.count} Clustered Grievances
                </span>
              </div>

              {/* Side-by-side complaint cards */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.complaints.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                          {c.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            c.duplicateStatus === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : c.duplicateStatus === 'rejected'
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          Status: {c.duplicateStatus || 'Suspected'}
                        </span>
                      </div>

                      <div className="font-medium text-xs text-slate-900 leading-snug">
                        {c.title}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.area}</span>
                        <span>•</span>
                        <span className="truncate">{c.address}</span>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        Logged: {formatDate(c.createdAt)}
                      </div>
                    </div>

                    {/* Operational Decision Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingId === c.id || c.duplicateStatus === 'rejected'}
                        onClick={() => handleReview(c.id, 'rejected')}
                      >
                        <X className="w-3 h-3 mr-1 text-slate-500" />
                        <span>Mark Distinct</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actingId === c.id || c.duplicateStatus === 'confirmed'}
                        onClick={() => handleReview(c.id, 'confirmed')}
                      >
                        <Check className="w-3 h-3 mr-1 text-emerald-400" />
                        <span>Confirm Duplicate</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
