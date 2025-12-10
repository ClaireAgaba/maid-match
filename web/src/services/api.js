import axios from 'axios';

//const API_BASE_URL = 'http://localhost:8000/api';
//const API_BASE_URL = import.meta.env.VITE_API_URL;

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000/api'          // used in local dev
  : import.meta.env.VITE_API_URL;        // used in Netlify/prod

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If data is FormData, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
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
  // Legacy password login endpoint (no longer used for WhatsApp OTP)
  login: (credentials) => api.post('/accounts/login/', credentials),
  sendLoginPin: (payload) => api.post('/accounts/login/send-pin/', payload),
  verifyLoginPin: (payload) => api.post('/accounts/login/verify-pin/', payload),
  logout: () => api.post('/accounts/logout/'),
  getCurrentUser: () => api.get('/accounts/users/me/'),
  updateUser: (data) => api.patch('/accounts/users/me/', data),
  changePassword: (passwords) => api.post('/accounts/users/change_password/', passwords),
  setInitialPassword: (passwords) => api.post('/accounts/users/set_initial_password/', passwords),
};

// Maid API
export const maidAPI = {
  getAll: (params) => api.get('/maid/profiles/', { params }),
  getMyProfile: () => api.get('/maid/profiles/me/'),
  updateMyProfile: (data) => api.patch('/maid/profiles/me/', data),
  update: (id, data) => api.put(`/maid/profiles/${id}/`, data),
  getAvailable: () => api.get('/maid/profiles/available/'),
  recomputeRating: (id) => api.post(`/maid/profiles/${id}/recompute_rating/`),
  closeJob: (id) => api.post(`/maid/profiles/${id}/close_job/`),
  recentClients: (id) => api.get(`/maid/profiles/${id}/recent_clients/`),
  adminStats: () => api.get('/maid/profiles/admin_stats/'),
  exportMaids: () => api.get('/maid/profiles/export_maids/', { responseType: 'blob' }),
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
  recentMaids: () => api.get('/homeowner/profiles/recent_maids/'),
  exportHomeowners: () => api.get('/homeowner/profiles/export_homeowners/', { responseType: 'blob' }),
  // Admin actions (backend endpoints required)
  verify: (id, notes) => api.post(`/homeowner/profiles/${id}/verify/`, { verification_notes: notes }),
  unverify: (id) => api.post(`/homeowner/profiles/${id}/unverify/`),
  activate: (id) => api.post(`/homeowner/profiles/${id}/activate/`),
  deactivate: (id, reason) => api.post(`/homeowner/profiles/${id}/deactivate/`, { reason }),
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
  mine: () => api.get('/homeowner/reviews/mine/'),
  given: () => api.get('/homeowner/reviews/given/'),
};

// Cleaning Company API
export const cleaningCompanyAPI = {
  categoriesGrouped: () => api.get('/cleaning-company/categories/grouped/'),
  register: (data) => api.post('/cleaning-company/register/', data),
  me: () => api.get('/cleaning-company/me/'),
  galleryList: () => api.get('/cleaning-company/gallery/'),
  meUpdate: (data) => api.patch('/cleaning-company/me/', data),
  galleryUpload: (formData) => api.post('/cleaning-company/gallery/', formData),
  galleryDelete: (id) => api.delete(`/cleaning-company/gallery/${id}/`),
  galleryUpdate: (id, data) => api.patch(`/cleaning-company/gallery/${id}/`, data),
  adminList: (params) => api.get('/cleaning-company/admin/companies/', { params }),
  adminBulk: (data) => api.post('/cleaning-company/admin/companies/bulk/', data),
  browse: (params) => api.get('/cleaning-company/browse/', { params }),
  publicGallery: (companyId) => api.get(`/cleaning-company/public/${companyId}/gallery/`),
  pauseMe: (data) => api.patch('/cleaning-company/me/', data),
  deactivateMe: () => api.post('/cleaning-company/me/deactivate/'),
};

// Home Nursing API
export const homeNursingAPI = {
  categoriesGrouped: () => api.get('/home-nursing/categories/grouped/'),
  register: (data) => api.post('/home-nursing/register/', data),
  me: () => api.get('/home-nursing/me/'),
  updateMe: (data) => api.patch('/home-nursing/me/', data),
  adminList: (params) => api.get('/home-nursing/admin/nurses/', { params }),
  adminVerify: (id) => api.post(`/home-nursing/admin/nurses/${id}/verify/`),
  adminUnverify: (id) => api.post(`/home-nursing/admin/nurses/${id}/unverify/`),
  adminEnable: (id) => api.post(`/home-nursing/admin/nurses/${id}/enable/`),
  adminDisable: (id) => api.post(`/home-nursing/admin/nurses/${id}/disable/`),
  browse: (params) => api.get('/home-nursing/public/browse/', { params }),
};

// Support / Help & Feedback API
export const supportAPI = {
  listTickets: (params) => api.get('/support/tickets/', { params }),
  createTicket: (payload) => api.post('/support/tickets/', payload),
  getTicket: (id) => api.get(`/support/tickets/${id}/`),
  getMessages: (id) => api.get(`/support/tickets/${id}/messages/`),
  reply: (id, body) => api.post(`/support/tickets/${id}/reply/`, { body }),
  close: (id) => api.post(`/support/tickets/${id}/close/`),
  satisfaction: (id, payload) => api.post(`/support/tickets/${id}/satisfaction/`, payload),
};

// Payments API
export const paymentAPI = {
  initiateMaidOnboarding: (payload) => api.post('/payments/maid-onboarding/initiate/', payload),
  initiateHomeownerPayment: (payload) => api.post('/payments/homeowner/initiate/', payload),
  // Cleaning company payment plans (monthly/annual subscriptions)
  initiateCompanyPayment: (payload) => api.post('/payments/cleaning-company/initiate/', payload),
};

// Live Location API
export const locationAPI = {
  updateMaid: (coords) => api.post('/maid/profiles/update_location/', coords),
  updateHomeowner: (coords) => api.post('/homeowner/profiles/update_location/', coords),
  updateCleaningCompany: (coords) => api.post('/cleaning-company/me/update-location/', coords),
  updateHomeNurse: (coords) => api.post('/home-nursing/me/update-location/', coords),
};

export default api;
