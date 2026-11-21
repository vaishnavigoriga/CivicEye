import axios from 'axios';

export const API = '/api/v1';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // the session lives in an httpOnly cookie; JavaScript never sees the token
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiError extends Error {
  /** Machine-readable code from the API (e.g. INVALID_CREDENTIALS) or NETWORK when the server was unreachable. */
  code?: string;
  status?: number;
  fields?: Record<string, string>;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let payload = error.response?.data;
    // Binary requests (e.g. speech) return error bodies as Blobs; decode them to read the error code.
    if (payload instanceof Blob) {
      try {
        payload = JSON.parse(await payload.text());
      } catch {
        payload = undefined;
      }
    }
    const body = payload?.error;
    const err: ApiError = new Error(body?.message || error.message || 'Request failed');
    err.status = error.response?.status;
    err.code = error.response ? body?.code : 'NETWORK';
    err.fields = body?.fields;
    return Promise.reject(err);
  },
);
