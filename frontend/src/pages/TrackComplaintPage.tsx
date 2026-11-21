import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  Search,
  FileSearch,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const TrackComplaintPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setError(null);
    setLoading(true);

    try {
      // If it looks like a full MongoDB 24-char ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(clean)) {
        navigate(`/citizen/complaints/${clean}`);
        return;
      }

      // Or search explore/public list
      const res = await complaintsApi.getComplaints({ search: clean, limit: 1 });
      if (res.complaints && res.complaints.length > 0) {
        navigate(`/citizen/complaints/${res.complaints[0]._id}`);
      } else {
        setError(`No grievance found matching reference "${clean}". Please verify your ticket ID.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error locating complaint record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Track Grievance' }]} />

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-civic-50 text-civic-900 border border-civic-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-civic-700" />
          <span>Real-time Municipal Redressal Tracker</span>
        </div>
        <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
          Track Grievance Redressal Status
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Enter your reference token (e.g. CE-HYD-2026-XXXX or system ID) to view real-time department assignment, SLA timeline, and photographic resolution proof.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            label="Grievance Reference Number or ID"
            placeholder="e.g., 673db874ef1a... or search by landmark address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            helperText="Check your SMS or citizen portfolio for your reference ID"
            required
          />

          {error && (
            <Alert
              variant="warning"
              title="Reference Not Found"
            >
              {error}
            </Alert>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
            >
              <Search className="w-4 h-4 mr-1.5" />
              <span>Lookup Grievance Status</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* SLA Commitment Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 text-center">
          <Clock className="w-5 h-5 text-civic-700 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-slate-900">48-Hour SLA</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Urgent hazards reviewed within 48h</p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 text-center">
          <Building2 className="w-5 h-5 text-teal-700 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-slate-900">Department Routing</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Automated dispatch to 6 GHMC bodies</p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-slate-900">Photographic Proof</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified before closing any case</p>
        </div>
      </div>
    </div>
  );
};
