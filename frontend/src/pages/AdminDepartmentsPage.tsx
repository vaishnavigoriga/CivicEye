import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { Department } from '../types';
import { useToast } from '../contexts/ToastContext';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  Building2,
  Plus,
  Loader2,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // New dept modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDepartments();
      setDepartments(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createDepartment({ name, code, description, contactEmail });
      showToast('Department registered successfully', 'success');
      setIsModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      setContactEmail('');
      fetchDepts();
    } catch (err: any) {
      showToast(err.message || 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Municipal Administration', href: '/admin' },
          { label: 'Departments Directory' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-civic-900 tracking-tight">
            Municipal Departments & Dispatch Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational directories of Greater Hyderabad civic engineering departments, contact emails, and active grievance caseloads.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Register Department</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-civic-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div
              key={d._id}
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-civic-50 text-civic-900 border border-civic-200">
                    {d.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {d.assignedComplaintsCount || 0} active cases
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 text-sm">{d.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate font-mono text-slate-700">{d.contactEmail}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Municipal Department"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Department Name *"
            placeholder="e.g., GHMC Traffic Engineering Cell"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Department Code (Uppercase) *"
            placeholder="e.g., GHMC-TRAFFIC"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Operational Scope of Responsibility *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe maintenance responsibilities, ward jurisdiction, and equipment..."
              className="w-full text-xs rounded border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-civic-700"
            />
          </div>

          <Input
            label="Official Dispatch Email *"
            type="email"
            placeholder="e.g., traffic-cell@ghmc.gov.in.demo"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            helperText="Internal simulated address used for dispatch notifications"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Confirm Registration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
