import axios from 'axios';

// Automatically points to environment variable in production, relative origin on Vercel, or localhost:5000 in dev
export const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Accept': 'application/json'
  }
});

// Automatically attach authenticated user identity headers if signed in
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('apollo_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.email && !config.headers['x-user-email']) config.headers['x-user-email'] = u.email;
      if (u.phone && !config.headers['x-user-phone']) config.headers['x-user-phone'] = u.phone;
      if (u.roll && !config.headers['x-user-roll']) config.headers['x-user-roll'] = u.roll;
      if (u.adminKey && !config.headers['x-admin-key']) config.headers['x-admin-key'] = u.adminKey;
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

/**
 * Returns full URL for item photos regardless of whether they are hosted on:
 * - Local backend (/uploads/...)
 * - Cloudinary or external CDN (https://...)
 * - Empty/null
 */
export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

export default api;
