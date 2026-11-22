import { api, API } from './axiosInstance';
import { AdminComplaint, AdminUpdate, AdminDepartment, DuplicateGroupView, Workload, ComplaintCategory, ComplaintStatus } from '../types';
import type { Pagination } from './complaintsApi';

export interface AdminListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  departmentId?: string;
  unassigned?: boolean;
  duplicatesOnly?: boolean;
  provenance?: 'citizen' | 'demo' | 'all';
  sort?: 'newest' | 'priority';
}

const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && v !== false));
const base = `${API}/admin`;
const enc = encodeURIComponent;

export const adminApi = {
  async list(params: AdminListQuery): Promise<{ items: AdminComplaint[]; pagination: Pagination }> {
    return (await api.get(`${base}/complaints`, { params: clean({ ...params }) })).data.data;
  },

  async get(trackingId: string): Promise<{ complaint: AdminComplaint; updates: AdminUpdate[]; duplicateGroup: DuplicateGroupView | null }> {
    return (await api.get(`${base}/complaints/${enc(trackingId)}`)).data.data;
  },

  async setStatus(trackingId: string, body: { status: ComplaintStatus; note: string; isPublic: boolean }) {
    return (await api.patch(`${base}/complaints/${enc(trackingId)}/status`, body)).data.data;
  },

  async assign(trackingId: string, body: { departmentId: string; note?: string }) {
    return (await api.patch(`${base}/complaints/${enc(trackingId)}/department`, body)).data.data;
  },

  async verifyCategory(trackingId: string, body: { category: ComplaintCategory; note?: string }) {
    return (await api.patch(`${base}/complaints/${enc(trackingId)}/category`, body)).data.data;
  },

  async comment(trackingId: string, body: { note: string; isPublic: boolean }) {
    return (await api.post(`${base}/complaints/${enc(trackingId)}/comments`, body)).data;
  },

  async uploadEvidence(trackingId: string, file: File, caption: string) {
    const form = new FormData();
    form.append('evidence', file);
    form.append('caption', caption);
    return (await api.post(`${base}/complaints/${enc(trackingId)}/evidence`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },

  async duplicates(): Promise<DuplicateGroupView[]> {
    return (await api.get(`${base}/duplicates`)).data.data.groups;
  },

  async reviewDuplicate(id: string, decision: 'confirmed' | 'rejected') {
    return (await api.patch(`${base}/duplicates/${enc(id)}`, { decision })).data.data;
  },

  async workload(): Promise<Workload> {
    return (await api.get(`${base}/workload`)).data.data;
  },

  async departments(): Promise<AdminDepartment[]> {
    return (await api.get(`${base}/departments`)).data.data.departments;
  },

  async saveDepartment(body: Omit<AdminDepartment, '_id'>, id?: string): Promise<AdminDepartment> {
    const res = id ? await api.put(`${base}/departments/${enc(id)}`, body) : await api.post(`${base}/departments`, body);
    return res.data.data.department;
  },
};
