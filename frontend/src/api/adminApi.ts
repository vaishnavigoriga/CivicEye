import { api } from './axiosInstance';
import { Department } from '../types';

export const adminApi = {
  async getKPIs() {
    const res = await api.get('/api/admin/kpis');
    return res.data.data;
  },

  async getAllComplaints(params?: any) {
    const res = await api.get('/api/admin/complaints', { params });
    return res.data.data;
  },

  async updateStatus(id: string, status: string, note?: string) {
    const res = await api.patch(`/api/admin/complaints/${id}/status`, { status, note });
    return res.data.data;
  },

  async assignDepartment(id: string, departmentId: string, note?: string) {
    const res = await api.patch(`/api/admin/complaints/${id}/department`, { departmentId, note });
    return res.data.data;
  },

  async uploadEvidence(id: string, formData: FormData) {
    const res = await api.post(`/api/admin/complaints/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  async getDuplicateGroups() {
    const res = await api.get('/api/admin/duplicates');
    return res.data.data.groups;
  },

  async reviewDuplicate(id: string, decision: 'confirmed' | 'rejected') {
    const res = await api.patch(`/api/admin/complaints/${id}/duplicate`, { decision });
    return res.data.data;
  },

  async getDepartments() {
    const res = await api.get('/api/admin/departments');
    return res.data.data.departments as Department[];
  },

  async createDepartment(data: { name: string; code: string; description: string; contactEmail: string }) {
    const res = await api.post('/api/admin/departments', data);
    return res.data.data.department as Department;
  },

  async getAuditLog() {
    const res = await api.get('/api/admin/audit');
    return res.data.data.logs;
  },
};
