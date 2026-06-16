import axios from 'axios';
import { clearToken, getToken } from '../utils/storage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      error.message = message;
    }

    return Promise.reject(error);
  },
);
