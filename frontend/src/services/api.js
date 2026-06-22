import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const adminLogin = (credentials) => API.post('/auth/login', credentials);

// Papers - Public
export const getApprovedPapers = (params) => API.get('/papers', { params });
export const uploadPaper = (formData) =>
  API.post('/papers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Papers - Admin
export const getPendingPapers = () => API.get('/papers/pending');
export const approvePaper = (id) => API.put(`/papers/${id}/approve`);
export const rejectPaper = (id) => API.put(`/papers/${id}/reject`);
export const deletePaper = (id) => API.delete(`/papers/${id}`);

// PDF URLs — In production, /api/* is redirected to /.netlify/functions/api/* via netlify.toml
// In dev with netlify dev, the same redirect applies automatically
export const getViewUrl = (id) => `/api/papers/${id}/view`;
export const getDownloadUrl = (id) => `/api/papers/${id}/download`;

export default API;
