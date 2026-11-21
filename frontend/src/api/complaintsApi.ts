import { api } from './axiosInstance';
import { Complaint, ComplaintCategory } from '../types';

export interface ComplaintsQuery {
  category?: string;
  status?: string;
  area?: string;
  dataSource?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ImageAnalysisResponse {
  category: ComplaintCategory;
  description: string;
  evidenceStrength: 'low' | 'medium' | 'high' | 'strong';
  severity: number;
  confidence: number;
  suggestedDepartment: string;
  isSimulated: boolean;
  source: 'gemini' | 'mock';
}

export const complaintsApi = {
  async getComplaints(params?: ComplaintsQuery) {
    const res = await api.get('/api/complaints', { params });
    return res.data.data;
  },

  async getComplaintById(id: string) {
    const res = await api.get(`/api/complaints/${id}`);
    return res.data.data;
  },

  async getMyComplaints() {
    const res = await api.get('/api/complaints/citizen/my');
    return res.data.data.complaints as Complaint[];
  },

  async submitComplaint(formData: FormData) {
    const res = await api.post('/api/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async analyzeImage(imageFile: File): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await api.post('/api/complaints/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const res = await api.post('/api/transcription/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async toggleUpvote(id: string) {
    const res = await api.post(`/api/complaints/${id}/upvote`);
    return res.data.data;
  },

  async getMapData(params?: { category?: string; status?: string; dataSource?: string }) {
    const res = await api.get('/api/complaints/map', { params });
    return res.data.data;
  },

  async getAnalyticsSummary() {
    const res = await api.get('/api/complaints/analytics/summary');
    return res.data.data;
  },
};
