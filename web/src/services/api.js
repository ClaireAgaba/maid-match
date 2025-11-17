import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Function to get CSRF token from cookie
const getCsrfToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to headers for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    // If data is FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getCsrfToken: () => api.get('/accounts/csrf/'),
  register: (userData) => api.post('/accounts/register/', userData),
  login: (credentials) => api.post('/accounts/login/', credentials),
  logout: () => api.post('/accounts/logout/'),
  getCurrentUser: () => api.get('/accounts/users/me/'),
  updateUser: (data) => api.patch('/accounts/users/me/', data),
  changePassword: (passwords) => api.post('/accounts/users/change_password/', passwords),
};

// Maid API
export const maidAPI = {
  getAll: (params) => api.get('/maid/profiles/', { params }),
  getById: (id) => api.get(`/maid/profiles/${id}/`),
  getMyProfile: () => api.get('/maid/profiles/me/'),
  updateMyProfile: (data) => api.patch('/maid/profiles/me/', data),
  update: (id, data) => api.put(`/maid/profiles/${id}/`, data),
  getAvailable: () => api.get('/maid/profiles/available/'),
  // Admin actions
  verify: (id, notes) => api.post(`/maid/profiles/${id}/verify/`, { verification_notes: notes }),
  unverify: (id) => api.post(`/maid/profiles/${id}/unverify/`),
  disable: (id, reason) => api.post(`/maid/profiles/${id}/disable/`, { reason }),
  enable: (id) => api.post(`/maid/profiles/${id}/enable/`),
};

// Homeowner API
export const homeownerAPI = {
  getAll: (params) => api.get('/homeowner/profiles/', { params }),
  getMyProfile: () => api.get('/homeowner/profiles/my_profile/'),
  update: (id, data) => api.patch(`/homeowner/profiles/${id}/`, data),
};

// Job API
export const jobAPI = {
  getAll: (params) => api.get('/homeowner/jobs/', { params }),
  getById: (id) => api.get(`/homeowner/jobs/${id}/`),
  create: (data) => api.post('/homeowner/jobs/', data),
  update: (id, data) => api.patch(`/homeowner/jobs/${id}/`, data),
  delete: (id) => api.delete(`/homeowner/jobs/${id}/`),
  assignMaid: (id, maidId) => api.post(`/homeowner/jobs/${id}/assign_maid/`, { maid_id: maidId }),
  updateStatus: (id, status) => api.post(`/homeowner/jobs/${id}/update_status/`, { status }),
};

// Job Application API
export const applicationAPI = {
  getAll: (params) => api.get('/homeowner/applications/', { params }),
  getById: (id) => api.get(`/homeowner/applications/${id}/`),
  create: (data) => api.post('/homeowner/applications/', data),
  accept: (id) => api.post(`/homeowner/applications/${id}/accept/`),
  reject: (id) => api.post(`/homeowner/applications/${id}/reject/`),
};

// Review API
export const reviewAPI = {
  getAll: (params) => api.get('/homeowner/reviews/', { params }),
  getById: (id) => api.get(`/homeowner/reviews/${id}/`),
  create: (data) => api.post('/homeowner/reviews/', data),
  update: (id, data) => api.patch(`/homeowner/reviews/${id}/`, data),
};

export default api;
