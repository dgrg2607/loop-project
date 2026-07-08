import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('loop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isCancel(err) || err.code === 'ERR_CANCELED') {
      return Promise.reject(err);
    }
    
    if (err.response?.status === 401) {
      localStorage.removeItem('loop_token');
      window.dispatchEvent(new CustomEvent('loop:unauthorized'));
    } else {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      window.dispatchEvent(new CustomEvent('loop:api-error', { detail: message }));
    }
    return Promise.reject(err);
  }
);

export default api;