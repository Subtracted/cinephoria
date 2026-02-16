import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Instance Axios configurée
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirection vers login si token expiré
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// Services API
// ============================================

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Cinémas
export const cinemaAPI = {
  getAll: () => api.get('/cinemas'),
  getById: (id) => api.get(`/cinemas/${id}`),
};

// Films
export const filmAPI = {
  getAll: (params) => api.get('/films', { params }),
  getLatest: () => api.get('/films/latest'),
  getById: (id) => api.get(`/films/${id}`),
  getGenres: () => api.get('/films/genres'),
  create: (data) => api.post('/films', data),
  update: (id, data) => api.put(`/films/${id}`, data),
  delete: (id) => api.delete(`/films/${id}`),
};

// Séances
export const sessionAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`),
};

// Réservations
export const reservationAPI = {
  create: (data) => api.post('/reservations', data),
  getMine: () => api.get('/reservations/me'),
  getById: (id) => api.get(`/reservations/${id}`),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
};

// Avis
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getPending: () => api.get('/reviews/pending'),
  moderate: (id, status) => api.put(`/reviews/${id}/moderate`, { status }),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Salles
export const roomAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// Contact
export const contactAPI = {
  send: (data) => api.post('/contacts', data),
};

// Incidents
export const incidentAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getEmployees: () => api.get('/admin/employees'),
  createEmployee: (data) => api.post('/admin/employees', data),
  resetPassword: (id, newPassword) => api.put(`/admin/employees/${id}/reset-password`, { newPassword }),
};

// Tarifs
export const qualityPriceAPI = {
  getAll: () => api.get('/quality-prices'),
};

export default api;
