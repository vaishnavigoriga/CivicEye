import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { useToast } from '../contexts/ToastContext';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  Upload,
  Building2,
  Loader2,
  Camera,
  FileText,
  ShieldCheck,
  X
} from 'lucide-react';

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

export const AdminComplaintsPage: React.FC = () => {
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [provenance, setProvenance] = useState<'all' | 'citizen' | 'demo'>('all');

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('in-progress');
  const [statusNote, setStatusNote] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [deptNote, setDeptNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Evidence upload modal state
  const [evidenceModalComplaint, setEvidenceModalComplaint] = useState<any | null>(null);
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const [compRes, deptRes] = await Promise.all([
        adminApi.getAllComplaints({ status, category, search, limit: 50 }),
        adminApi.getDepartments(),
      ]);
      setComplaints(compRes.complaints || []);
      setDepartments(deptRes || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [status, category]);

  const handleUpdateStatusAndDept = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      // If department selected and changed
      if (selectedDeptId && selectedDeptId !== selectedComplaint.department?._id) {
        await adminApi.assignDepartment(
          selectedComplaint._id,
          selectedDeptId,
          deptNote || `Department reassigned by municipal admin.`
        );
      }

      // If status changed
      if (newStatus !== selectedComplaint.status || statusNote) {
        await adminApi.updateStatus(
          selectedComplaint._id,
          newStatus,
          statusNote || `Status updated to ${newStatus}`
        );
      }

      showToast('Grievance dossier updated successfully', 'success');
      setSelectedComplaint(null);
      setStatusNote('');
      setDeptNote('');
      fetchComplaints();
    } catch (err: any) {
      showToast(err.message || 'Failed to update grievance', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceModalComplaint || !evidenceFile) return;

    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append('evidence', evidenceFile);
      formData.append('caption', evidenceCaption || 'Official repair completion proof');

      await adminApi.uploadEvidence(evidenceModalComplaint._id, formData);
      showToast('Photographic completion evidence uploaded!', 'success');
      setEvidenceModalComplaint(null);
      setEvidenceFile(null);
      setEvidenceCaption('');
      fetchComplaints();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload evidence', 'error');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (provenance === 'citizen') return c.dataSource !== 'fictional_demo';
    if (provenance === 'demo') return c.dataSource === 'fictional_demo';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Municipal Administration' }, { label: 'All Grievances' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
            Grievance Redressal Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational triage console for assigning municipal departments, monitoring status progression, and recording photographic repair completion.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
              placeholder="Search keyword or area..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchComplaints}>
            Search
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {['All', 'pending', 'assigned', 'in-progress', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-2.5 py-1 rounded font-medium capitalize transition-colors ${
                status === st
                  ? 'bg-civic-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Category & Provenance */}
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-7 px-2 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-civic-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            value={provenance}
            onChange={(e) => setProvenance(e.target.value as any)}
            className="h-7 px-2 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-civic-700"
          >
            <option value="all">All Provenance</option>
            <option value="citizen">Verified Citizen Only</option>
            <option value="demo">Demo Records Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-civic-700" />
          <span className="text-xs">Querying grievance database...</span>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-md mx-auto">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">No grievances found</h3>
          <p className="text-xs text-slate-500 mt-1">No records match the current filter parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Grievance / Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Assigned Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <SeverityBadge score={c.aiAnalysis?.priorityScore || 50} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <a
                        href={`/citizen/complaints/${c._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-slate-900 hover:text-civic-700 line-clamp-1"
                      >
                        {c.title}
                      </a>
                      <div className="text-[10px] text-slate-400">
                        CE-{c._id?.slice(-6).toUpperCase()} • {c.dataSource === 'fictional_demo' ? 'Demo Record' : 'Verified Citizen'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.location?.area}</td>
                    <td className="py-3 px-4">
                      {c.department ? (
                        <span className="font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {c.department.code || c.department.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedComplaint(c);
                          setNewStatus(c.status);
                          setSelectedDeptId(c.department?._id || '');
                        }}
                      >
                        Triage / Dept
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEvidenceModalComplaint(c)}
                      >
                        <Camera className="w-3 h-3 mr-1 text-teal-700" />
                        <span>Evidence</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Triage & Department Assignment Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title="Triage & Department Assignment"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900">{selectedComplaint.title}</div>
              <div className="text-slate-500 mt-0.5">
                {selectedComplaint.location.area} • Category: {selectedComplaint.category}
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assign Municipal Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full h-8 text-xs rounded border border-slate-300 px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-700"
              >
                <option value="">Select Responsible Department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Lifecycle Status Update */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Update Grievance Lifecycle Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full h-8 text-xs rounded border border-slate-300 px-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-700 capitalize"
              >
                <option value="pending">Pending Review</option>
                <option value="assigned">Assigned to Department</option>
                <option value="in-progress">In Progress (Field Crews Dispatched)</option>
                <option value="resolved">Resolved (Completed)</option>
              </select>
            </div>

            {/* Officer Audit Note */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Operational Note (Recorded in Public Audit Trail)
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g., Work order dispatched to Zonal Engineering Team 4 for resurfacing..."
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedComplaint(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                onClick={handleUpdateStatusAndDept}
              >
                Confirm Updates
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Resolution Photographic Evidence Upload Modal */}
      {evidenceModalComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setEvidenceModalComplaint(null)}
          title="Upload Resolution Photographic Evidence"
          maxWidth="md"
        >
          <form onSubmit={handleUploadEvidence} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900">{evidenceModalComplaint.title}</div>
              <div className="text-slate-500 mt-0.5">
                Case ID: CE-{evidenceModalComplaint._id?.slice(-6).toUpperCase()} • {evidenceModalComplaint.location.area}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Completion Photo (JPG, PNG, WEBP - Max 5MB) <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                required
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setEvidenceFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-600 border border-slate-300 rounded p-1.5 focus:outline-none"
              />
            </div>

            <div>
              <Input
                label="Evidence Caption & Verification Details *"
                placeholder="e.g., Asphalt patch completed by Circle 18 road repair unit"
                value={evidenceCaption}
                onChange={(e) => setEvidenceCaption(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEvidenceModalComplaint(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={uploadingEvidence}
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Upload & Verify</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
