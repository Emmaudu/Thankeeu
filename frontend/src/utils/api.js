import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Axios instances ───────────────────────────────────────────────────────

// 1. Regular user (thankeeu_token)
const axiosOptions = {
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
};

const api = axios.create(axiosOptions);
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('thankeeu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('thankeeu_token');
    localStorage.removeItem('thankeeu_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// 2. Public — no auth, no 401 redirect (signing pages, public cards)
const publicAxios = axios.create(axiosOptions);

// 3. Company / HR (thankeeu_company_token)
const companyAxios = axios.create(axiosOptions);
companyAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('thankeeu_company_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
companyAxios.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('thankeeu_company_token');
    localStorage.removeItem('thankeeu_company');
    window.location.href = '/company/login';
  }
  return Promise.reject(err);
});

// 4. Team member (thankeeu_member_token)
const memberAxios = axios.create(axiosOptions);
memberAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('thankeeu_member_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
memberAxios.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('thankeeu_member_token');
    localStorage.removeItem('thankeeu_member');
    window.location.href = '/member/login';
  }
  return Promise.reject(err);
});

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
  signup:         (data)   => api.post('/auth/signup', data),
  login:          (data)   => api.post('/auth/login', data),
  getMe:          ()       => api.get('/auth/me'),
  updateProfile:  (data)   => api.put('/auth/profile', data),
  changePassword: (data)   => api.put('/auth/password', data),
  searchUsers:    (q)      => api.get(`/auth/search?q=${encodeURIComponent(q)}`),
  forgotPassword: (email)  => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)   => api.post('/auth/reset-password', data),
};

// ─── Cards ────────────────────────────────────────────────────────────────
export const cardsAPI = {
  create:   (data)         => api.post('/cards', data),
  getAll:   ()             => api.get('/cards'),
  getOne:   (slug, token)  => api.get(`/cards/${slug}${token ? `?token=${token}` : ''}`),
  getPublic:(slug)         => publicAxios.get(`/cards/public/${slug}`),
  getRecipient: (slug, token) => publicAxios.get(`/cards/recipient/${slug}`, { params: { token } }),
  claimGift: (slug, data)  => publicAxios.post(`/cards/recipient/${slug}/claim`, data),
  update:   (slug, data)   => api.put(`/cards/${slug}`, data),
  activate: (slug, data)   => api.post(`/cards/${slug}/activate`, data),
  send:     (slug)         => api.post(`/cards/${slug}/send`),
  delete:   (slug)         => api.delete(`/cards/${slug}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────
export const messagesAPI = {
  add:    (cardSlug, data)  => publicAxios.post(`/messages/${cardSlug}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  react:  (messageId, data) => publicAxios.post(`/messages/react/${messageId}`, data),
  delete: (messageId)       => api.delete(`/messages/${messageId}`),
  reply:  (cardSlug, data)  => publicAxios.post(`/messages/${cardSlug}/reply`, data),
};

// ─── Payments ─────────────────────────────────────────────────────────────
export const paymentsAPI = {
  initPurchase:     (plan_type, card_slug) => api.post('/payments/initialize/purchase', { plan_type, card_slug }),
  initContribution: (data)      => publicAxios.post('/payments/initialize/contribution', data),
  verifyPurchase:   (reference) => api.get(`/payments/verify/purchase/${reference}`),
  verify:           (reference) => api.get(`/payments/verify/${reference}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get:                    ()           => api.get('/dashboard'),
  getStats:               ()           => api.get('/dashboard/stats'),
  markNotificationsRead:  ()           => api.post('/dashboard/notifications/read'),
  getFinancialHistory:    ()           => api.get('/dashboard/financial-history'),
  getDeliveredCards:      ()           => api.get('/dashboard/delivered'),
  getReceivedCards:       ()           => api.get('/dashboard/received'),
  getPendingToSign:       ()           => api.get('/dashboard/pending-to-sign'),
  transferCard:           (data)       => api.post('/dashboard/transfer-card', data),
  trackCardOpened: (slug) => publicAxios.post(`/dashboard/card-opened/${slug}`),
};

export const remindersAPI = {
  getAll:   ()      => api.get('/reminders'),
  create:   (data)  => api.post('/reminders', data),
  update:   (id, d) => api.put(`/reminders/${id}`, d),
  delete:   (id)    => api.delete(`/reminders/${id}`),
};

// ─── Admin (user) ─────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:   ()           => api.get('/admin/stats'),
  getUsers:   ()           => api.get('/admin/users'),
  updateRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId)     => api.delete(`/admin/users/${userId}`),
  getCards:   ()           => api.get('/admin/cards'),
  deleteCard: (cardId)     => api.delete(`/admin/cards/${cardId}`),
};

export const adminCompanyAPI = {
  getAll:     ()   => api.get('/admin/companies'),
  delete:     (id) => api.delete(`/admin/companies/${id}`),
  getMembers: (id) => api.get(`/admin/companies/${id}/members`),
};

export const adminSupportAPI = {
  getAll: ()                         => api.get('/support/all'),
  reply:  (ticketId, reply)          => api.post(`/support/${ticketId}/reply`, { reply }),
};

// ─── Company / HR ─────────────────────────────────────────────────────────
export const companyAPI = {
  signup:         (data)  => companyAxios.post('/company/signup', data),
  login:          (data)  => companyAxios.post('/company/login', data),
  getMe:          ()      => companyAxios.get('/company/me'),
  updateProfile:  (data)  => companyAxios.put('/company/profile', data),
  changePassword: (data)  => companyAxios.put('/company/password', data),
  forgotPassword: (email) => companyAxios.post('/company/forgot-password', { email }),
  resetPassword:  (data)  => companyAxios.post('/company/reset-password', data),
};

export const teamsAPI = {
  downloadTemplate: ()           => companyAxios.get('/teams/template', { responseType: 'blob' }),
  importMembers:    (fd)         => companyAxios.post('/teams/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMembers:       (params)     => companyAxios.get('/teams', { params }),
  getDepartments:   ()           => companyAxios.get('/teams/departments'),
  getDashboard:     ()           => companyAxios.get('/teams/dashboard'),
  deleteMember:     (id)         => companyAxios.delete(`/teams/${id}`),
};

export const subscriptionAPI = {
  get:        ()          => companyAxios.get('/subscription'),
  initialize: (plan)      => companyAxios.post('/subscription/initialize', { plan }),
  verify:     (reference) => companyAxios.get(`/subscription/verify/${reference}`),
  cancel:     ()          => companyAxios.post('/subscription/cancel'),
};

// Company support tickets
export const supportAPI = {
  create: (data) => companyAxios.post('/support', data),
  getMine: ()    => companyAxios.get('/support/mine'),
};

// Individual user support tickets
export const userSupportAPI = {
  create: (data) => api.post('/support', data),
  getMine: ()    => api.get('/support/mine'),
};

export const occasionsAPI = {
  getTypes:         ()              => companyAxios.get('/occasions/types'),
  createType:       (data)          => companyAxios.post('/occasions/types', data),
  downloadTemplate: (name)          => companyAxios.get(`/occasions/template/${name}`, { responseType: 'blob' }),
  importMembers:    (typeId, fd)    => companyAxios.post(`/occasions/${typeId}/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMembers:       (typeId, p)     => companyAxios.get(`/occasions/${typeId}/members`, { params: p }),
  deleteMember:     (typeId, memberId) => companyAxios.delete(`/occasions/${typeId}/members/${memberId}`),
};

export const hrMembersAPI = {
  getAll:  ()             => companyAxios.get('/members/all'),
  approve: (id)           => companyAxios.post(`/members/${id}/approve`),
  reject:  (id, reason)   => companyAxios.post(`/members/${id}/reject`, { reason }),
};

export const hrisAPI = {
  getConnections:   ()     => companyAxios.get('/hris'),
  saveConnection:   (data) => companyAxios.post('/hris/connect', data),
  testConnection:   (id)   => companyAxios.post(`/hris/${id}/test`),
  syncHRIS:         (id)   => companyAxios.post(`/hris/${id}/sync`),
  deleteConnection: (id)   => companyAxios.delete(`/hris/${id}`),
  getSyncLogs:      ()     => companyAxios.get('/hris/logs'),
  getBranches:      ()     => companyAxios.get('/hris/branches'),
  saveBranch:       (data) => companyAxios.post('/hris/branches', data),
  deleteBranch:     (id)   => companyAxios.delete(`/hris/branches/${id}`),
};

// ─── Team Member ──────────────────────────────────────────────────────────
export const memberAPI = {
  signup:         (data)       => memberAxios.post('/members/signup', data),
  login:          (data)       => memberAxios.post('/members/login', data),
  getMe:          ()           => memberAxios.get('/members/me'),
  getDashboard:   ()           => memberAxios.get('/members/dashboard'),
  getDeptPending: ()           => memberAxios.get('/members/dept-pending'),
  forgotPassword: (email)      => memberAxios.post('/members/forgot-password', { email }),
  resetPassword:  (data)       => memberAxios.post('/members/reset-password', data),
  getMyCards:     ()           => memberAxios.get('/cards/member-history'),
  updateProfile:  (data)       => memberAxios.put('/members/profile', data),
  changePassword: (data)       => memberAxios.put('/members/password', data),
  // Public endpoint — no token needed
  getDepartments: (companyId)  => publicAxios.get(`/members/departments?companyId=${companyId}`),
};

// Member card creation (uses member token)
export const memberCardsAPI = {
  create: (data) => memberAxios.post('/cards', data),
  getOne: (slug) => memberAxios.get(`/cards/${slug}`),
};

// Member support tickets
export const memberSupportAPI = {
  create: (data) => memberAxios.post('/support', data),
  getMine: ()    => memberAxios.get('/support/mine'),
};

export const deductionsAPI = {
  getWallet:           (cardId)     => memberAxios.get(`/deductions/wallet/${cardId}`),
  request:             (data)       => memberAxios.post('/deductions/request', data),
  getPending:          ()           => companyAxios.get('/deductions/pending'),
  approve:             (id, note)   => companyAxios.post(`/deductions/${id}/approve`, { note }),
  reject:              (id, note)   => companyAxios.post(`/deductions/${id}/reject`, { note }),
  requestCrossDept:    (data)       => memberAxios.post('/deductions/cross-dept', data),
  getCrossDeptPending: ()           => companyAxios.get('/deductions/cross-dept'),
  approveCrossDept:    (id)         => companyAxios.post(`/deductions/cross-dept/${id}/approve`),
};

// ─── Demo / Blog (public, no token) ──────────────────────────────────────
export const demoAPI = {
  submit:       (data)            => publicAxios.post('/demo/request', data),
  getAll:       ()                => api.get('/demo/requests'),
  updateStatus: (id, status, note) => api.patch(`/demo/requests/${id}`, { status, admin_note: note }),
};

export const blogAPI = {
  getPosts:      (params = {}) => publicAxios.get('/blog', { params }),
  getCategories: ()             => publicAxios.get('/blog/categories'),
  getPost:       (slug)         => publicAxios.get(`/blog/${slug}`),
  getSitemap:    ()             => publicAxios.get('/blog/sitemap'),
  admin: {
    getPosts:       (status)       => api.get('/blog/admin/posts', { params: { status } }),
    getPost:        (id)           => api.get(`/blog/admin/posts/${id}`),
    createPost:     (data)         => api.post('/blog/admin/posts', data),
    updatePost:     (id, data)     => api.put(`/blog/admin/posts/${id}`, data),
    setStatus:      (id, status)   => api.patch(`/blog/admin/posts/${id}/status`, { status }),
    toggleFeatured: (id, featured) => api.patch(`/blog/admin/posts/${id}/featured`, { is_featured: featured }),
    deletePost:     (id)           => api.delete(`/blog/admin/posts/${id}`),
  },
};
