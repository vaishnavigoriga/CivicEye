import { api, API } from './axiosInstance';
import { Analytics, Complaint, ComplaintUpdate, DataSources, DuplicateCandidate, MapPoint } from '../types';

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  area?: string;
  includeDemo?: boolean;
  sort?: 'newest' | 'priority';
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T;

export const complaintsApi = {
  async list(params: ListQuery): Promise<{ items: Complaint[]; pagination: Pagination }> {
    const res = await api.get(`${API}/complaints`, { params: clean(params) });
    return res.data.data;
  },

  async get(trackingId: string): Promise<{ complaint: Complaint; updates: ComplaintUpdate[]; related: { trackingId: string; title: string; status: string }[] }> {
    const res = await api.get(`${API}/complaints/${encodeURIComponent(trackingId)}`);
    return res.data.data;
  },

  async mine(): Promise<Complaint[]> {
    const res = await api.get(`${API}/complaints/mine`);
    return res.data.data.items;
  },

  async submit(form: FormData): Promise<{ complaint: Complaint; duplicate: { linked: boolean; related: DuplicateCandidate[] } | null }> {
    const res = await api.post(`${API}/complaints`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data;
  },

  async checkDuplicates(body: { description: string; latitude: number; longitude: number; category?: string }): Promise<DuplicateCandidate[]> {
    const res = await api.post(`${API}/complaints/check-duplicates`, body);
    return res.data.data.candidates;
  },

  async support(trackingId: string, add: boolean): Promise<{ supportCount: number; hasSupported: boolean }> {
    const url = `${API}/complaints/${encodeURIComponent(trackingId)}/support`;
    const res = add ? await api.post(url) : await api.delete(url);
    return res.data.data;
  },

  async translate(trackingId: string, target: 'en' | 'te' | 'hi'): Promise<{ text: string; cached: boolean }> {
    const res = await api.post(`${API}/complaints/${encodeURIComponent(trackingId)}/translate`, { target });
    return res.data.data;
  },

  async speak(text: string): Promise<Blob> {
    const res = await api.post(`${API}/voice/speak`, { text }, { responseType: 'blob' });
    return res.data as Blob;
  },

  async transcribe(audio: Blob): Promise<{ available: boolean; noSpeech: boolean; text: string | null; language: string }> {
    const form = new FormData();
    form.append('audio', audio, 'recording.webm');
    const res = await api.post(`${API}/voice/transcribe`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data;
  },

  async dataSources(): Promise<DataSources> {
    const res = await api.get(`${API}/data-sources`);
    return res.data.data;
  },

  async map(params: { category?: string; status?: string; includeDemo?: boolean }): Promise<MapPoint[]> {
    const res = await api.get(`${API}/complaints/map`, { params: clean(params) });
    return res.data.data.points;
  },

  async analytics(params: { scope: 'citizen' | 'all'; category?: string; status?: string; area?: string; from?: string; to?: string }): Promise<Analytics> {
    const res = await api.get(`${API}/complaints/analytics`, { params: clean(params) });
    return res.data.data;
  },
};
