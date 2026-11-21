import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Complaint } from '../types';
import { ComplaintCard } from '../components/ComplaintCard';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import {
  PlusCircle,
  Search,
  Filter,
  Loader2,
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintsApi.getMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'assigned' || c.status === 'in-progress'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  const filtered = complaints.filter((c) => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchArea = c.location?.area?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      return matchTitle || matchArea || matchCategory;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Citizen Portal' }, { label: 'My Grievances' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-civic-50 text-civic-900 border border-civic-200">
              <ShieldCheck className="w-3 h-3 text-civic-700" />
              Verified Citizen Account
            </span>
          </div>
          <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
            Citizen Grievance Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered citizen: <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <Link to="/citizen/new">
          <Button variant="primary" size="md">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Lodge New Grievance</span>
          </Button>
        </Link>
      </div>

      {/* Real Metrics Grid - Strict Data Provenance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Filed
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {complaints.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Grievances logged by this account</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Under Review
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {pendingCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting municipal officer review</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-civic-700 uppercase tracking-wider flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Field Action
          </div>
          <div className="text-2xl font-bold font-mono text-civic-700 mt-1">
            {inProgressCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Assigned to departmental crews</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {resolvedCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">With photographic resolution proof</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['All', 'pending', 'assigned', 'in-progress', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors capitalize whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-civic-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'All' ? 'All Grievances' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by keyword, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 font-sans"
          />
        </div>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-civic-700" />
          <span className="text-xs">Loading registered grievances...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-10 text-center max-w-md mx-auto">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm mb-1">No grievances found</h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {filterStatus === 'All' && !searchQuery
              ? 'You have not submitted any complaints yet. Use the button below to report an infrastructure defect in your locality.'
              : 'No complaints match the selected filter criteria.'}
          </p>
          <Link to="/citizen/new">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Lodge Grievance</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};
