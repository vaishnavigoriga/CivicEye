import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Complaint } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { AIBadge } from '../components/AIBadge';
import { formatDate } from '../utils/formatDate';
import { useToast } from '../contexts/ToastContext';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import {
  MapPin,
  Calendar,
  ThumbsUp,
  Building2,
  Clock,
  CheckCircle2,
  FileText,
  Camera,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Check,
  Layers,
  Info
} from 'lucide-react';

const LIFECYCLE_STAGES = [
  { key: 'pending', label: '1. Submitted & Under Review' },
  { key: 'assigned', label: '2. Department Assigned' },
  { key: 'in-progress', label: '3. Field Crew Dispatched' },
  { key: 'resolved', label: '4. Verified Resolved' },
];

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [duplicateGroup, setDuplicateGroup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);

  const fetchComplaint = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await complaintsApi.getComplaintById(id);
      setComplaint(data.complaint);
      setDuplicateGroup(data.duplicateGroup || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load grievance details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleUpvote = async () => {
    if (!complaint) return;
    setUpvoting(true);
    try {
      const res = await complaintsApi.toggleUpvote(complaint._id);
      setComplaint((prev) =>
        prev
          ? {
              ...prev,
              upvotes: res.upvotes,
              hasUpvoted: res.hasUpvoted,
              aiAnalysis: {
                ...prev.aiAnalysis,
                priorityScore: res.priorityScore,
              },
            }
          : null
      );
      showToast(
        res.hasUpvoted
          ? 'Upvoted! Community prioritization score increased.'
          : 'Upvote removed',
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Please sign in to upvote', 'warning');
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
        <span className="text-xs font-medium">Retrieving municipal grievance record...</span>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Grievance Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested record ID does not exist or has been archived.
        </p>
        <Link to="/explore">
          <Button variant="primary" size="sm">
            Return to Public Registry
          </Button>
        </Link>
      </div>
    );
  }

  const displayId = complaint._id
    ? `CE-HYD-${new Date(complaint.createdAt).getFullYear()}-${complaint._id.slice(-6).toUpperCase()}`
    : 'CE-RECORD';

  // Determine active step index
  const getActiveStep = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'assigned':
        return 1;
      case 'in-progress':
        return 2;
      case 'resolved':
        return 3;
      default:
        return 0;
    }
  };

  const activeStepIdx = getActiveStep(complaint.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Public Registry', href: '/explore' },
          { label: displayId },
        ]}
      />

      {/* Main Grievance Dossier Card */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        {/* Institutional Record Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-900 text-white">
                {displayId}
              </span>

              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-civic-100 text-civic-900 border border-civic-200">
                {complaint.category}
              </span>

              <SeverityBadge score={complaint.aiAnalysis?.priorityScore || 50} size="md" />
              <StatusBadge status={complaint.status} size="md" />

              {complaint.dataSource === 'fictional_demo' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  Fictional Demo Record
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Citizen Grievance
                </span>
              )}
            </div>

            {/* Upvote Button */}
            <Button
              variant={complaint.hasUpvoted ? 'primary' : 'outline'}
              size="sm"
              onClick={handleUpvote}
              disabled={upvoting}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
              <span>{complaint.upvotes || 0} Endorsements</span>
            </Button>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-civic-900 leading-snug mb-3">
            {complaint.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-civic-700 shrink-0" />
              <strong className="text-slate-800">{complaint.location.area}</strong>
              <span>•</span>
              <span className="text-slate-600">{complaint.location.address}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Logged on {formatDate(complaint.createdAt)}</span>
            </div>

            {complaint.department && (
              <div className="flex items-center gap-1.5 text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                <Building2 className="w-3.5 h-3.5" />
                <span>Assigned: {complaint.department.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Stage Municipal Lifecycle Progression Bar */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Resolution Lifecycle Progression
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {LIFECYCLE_STAGES.map((st, idx) => {
              const isPast = idx < activeStepIdx;
              const isCurrent = idx === activeStepIdx;
              return (
                <div
                  key={st.key}
                  className={`p-3 rounded-md border text-xs font-medium transition-all ${
                    isCurrent
                      ? 'border-civic-700 bg-civic-50 text-civic-900 font-semibold'
                      : isPast
                      ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-civic-900 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span className="truncate">{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Narrative & Citizen Evidence */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Citizen Grievance Narrative
            </h2>
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {complaint.description}
            </div>
          </div>

          {/* Citizen Media */}
          {complaint.media && complaint.media.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Citizen Submitted Evidence
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.media.map((m, idx) => (
                  <div
                    key={idx}
                    className="rounded-md overflow-hidden border border-slate-200 bg-slate-100 h-48"
                  >
                    <img
                      src={m.url}
                      alt="Citizen evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Intake Analysis Breakdown */}
          <div className="p-4 rounded-md bg-slate-50 border border-slate-300 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <AIBadge
                  isSimulated={complaint.aiAnalysis?.isSimulated}
                  source={complaint.aiAnalysis?.source}
                />
                <span className="font-semibold text-slate-800">
                  Automated Triage Analysis
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-civic-900">
                Computed Urgency: {complaint.aiAnalysis?.priorityScore || 50} / 100
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed">
              {complaint.aiAnalysis?.summary || 'Complaint analyzed and indexed in municipal queue.'}
            </p>

            {/* 4-Factor Severity Metric Breakdown */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase mb-2">
                Priority Score Formulation Breakdown (Transparency Formula)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-slate-400">Safety Risk (40%)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {complaint.aiAnalysis?.aiSeverityRating || 5} / 10 Hazard
                  </div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-slate-400">Population (25%)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    High Transit Corridor
                  </div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-slate-400">Duration (20%)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    Active SLA Window
                  </div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200">
                  <div className="text-slate-400">Evidence (15%)</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    {complaint.media?.length ? 'Photo Attached' : 'Text Only'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic pt-1">
              Notice: Prototype calculation based on multi-factor analysis - not an official government assessment.
            </p>
          </div>

          {/* Suspected Duplicate Grouping */}
          {complaint.duplicateGroupId && (
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Geospatial Duplicate Cluster (500-Meter Index)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                This grievance has been matched with other reports filed in the same vicinity ({complaint.location.area}). To respect each citizen's participation, individual grievance records remain active while grouped for departmental triage efficiency.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Before-and-After Resolution Evidence Module */}
      {complaint.resolutionEvidence && complaint.resolutionEvidence.length > 0 && (
        <div className="bg-white rounded-lg border border-emerald-300 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Field Resolution Proof & Photographic Completion Evidence
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Official photographic evidence captured on-site by municipal engineering staff verifying repair completion.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complaint.resolutionEvidence.map((ev, i) => (
              <div
                key={i}
                className="rounded-md border border-slate-200 overflow-hidden bg-slate-50"
              >
                <div className="h-56 bg-slate-200 overflow-hidden">
                  <img
                    src={ev.url}
                    alt="Resolution completion proof"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-800 mb-0.5">{ev.caption}</p>
                  <span className="text-[10px] text-slate-400">
                    Uploaded: {formatDate(ev.uploadedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Timeline & Audit Log */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-civic-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            Municipal Audit Trail & Resolution Timeline
          </h2>
        </div>

        <div className="relative pl-6 border-l border-slate-200 space-y-5">
          {complaint.timeline?.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-civic-700 border-2 border-white"></div>
              <div className="flex items-center gap-2 mb-0.5">
                <StatusBadge status={step.status} size="sm" />
                <span className="text-[11px] text-slate-400">{formatDate(step.timestamp)}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">{step.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
