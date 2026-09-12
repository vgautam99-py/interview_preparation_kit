import axios from 'axios';

let rawBaseURL = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
if (rawBaseURL !== '/api') {
  rawBaseURL = rawBaseURL.replace(/\/$/, '');
  if (!rawBaseURL.endsWith('/api')) {
    rawBaseURL = rawBaseURL + '/api';
  }
}

const api = axios.create({
  baseURL: rawBaseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
