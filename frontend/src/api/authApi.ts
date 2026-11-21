import { api } from './axiosInstance';
import { User } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async register(data: { name: string; email: string; password: string; preferredLanguage?: string; phone?: string }) {
    const res = await api.post('/api/auth/register', data);
    return res.data.data as AuthResponse;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await api.post('/api/auth/login', credentials);
    return res.data.data as AuthResponse;
  },

  async demoLogin(role: 'citizen' | 'admin') {
    const res = await api.post('/api/auth/demo-login', { role });
    return res.data.data as AuthResponse;
  },

  async logout() {
    const res = await api.post('/api/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/api/auth/me');
    return res.data.data.user as User;
  },

  async updateProfile(data: { name?: string; phone?: string; preferredLanguage?: string; currentPassword?: string; newPassword?: string }) {
    const res = await api.put('/api/auth/profile', data);
    return res.data.data.user as User;
  },
};
