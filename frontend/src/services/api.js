import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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

// PDF URLs
export const getViewUrl = (id) => {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/papers/${id}/view`;
};
export const getDownloadUrl = (id) => {
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}/api/papers/${id}/download`;
};

export default API;
