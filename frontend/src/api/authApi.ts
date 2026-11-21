import { api, API } from './axiosInstance';
import { User } from '../types';

export interface AuthResponse {
  user: User;
}

export const authApi = {
  async register(data: { name: string; email: string; password: string; preferredLanguage?: string; phone?: string }) {
    const res = await api.post(`${API}/auth/register`, data);
    return res.data.data as AuthResponse;
  },

  async login(credentials: { email: string; password: string }) {
    const res = await api.post(`${API}/auth/login`, credentials);
    return res.data.data as AuthResponse;
  },

  async logout() {
    const res = await api.post(`${API}/auth/logout`);
    return res.data;
  },

  async getMe() {
    const res = await api.get(`${API}/auth/me`);
    return res.data.data.user as User;
  },

  async updateProfile(data: { name?: string; phone?: string; preferredLanguage?: string; currentPassword?: string; newPassword?: string }) {
    const res = await api.patch(`${API}/auth/me`, data);
    return res.data.data.user as User;
  },
};
