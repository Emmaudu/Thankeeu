import axios from 'axios';

const BASE     = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = BASE;  // alias so both names work

// ─── Session expiry helper ───────────────────────────────────────────────────
const isTokenExpired = (tokenKey) => {
  try {
    const token = localStorage.getItem(tokenKey);
    if (!token) return true;
    // Decode JWT payload (base64) without verifying signature
    const payload = JSON.parse(atob(token.split('.')[1]));
    // If exp is within 60 seconds, treat as expired
    return payload.exp && payload.exp < (Date.now() / 1000) + 60;
  } catch { return false; }
};

// Call on app start — clear any expired tokens
(() => {
  if (isTokenExpired('thankeeu_token'))         { localStorage.removeItem('thankeeu_token');         localStorage.removeItem('thankeeu_user'); }
  if (isTokenExpired('thankeeu_company_token')) { localStorage.removeItem('thankeeu_company_token'); localStorage.removeItem('thankeeu_company'); }
  if (isTokenExpired('thankeeu_member_token'))  { localStorage.removeItem('thankeeu_member_token');  localStorage.removeItem('thankeeu_member'); }
})();



const axiosOptions = {
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
};

// ─── Axios instances ──────────────────────────────────────────────────────────

// 1. Regular user
const api = axios.create(axiosOptions);
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('thankeeu_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && localStorage.getItem('thankeeu_token')) {
    localStorage.removeItem('thankeeu_token');
    localStorage.removeItem('thankeeu_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// 2. Public — no auth, no 401 redirect
const publicAxios = axios.create(axiosOptions);

// 3. Company / HR
export const companyAxios = axios.create(axiosOptions);
companyAxios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('thankeeu_company_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
companyAxios.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && localStorage.getItem('thankeeu_company_token')) {
    localStorage.removeItem('thankeeu_company_token');
    localStorage.removeItem('thankeeu_company');
    window.location.href = '/company/login';
  }
  return Promise.reject(err);
});

// 4. Team member
const memberAxios = axios.create(axiosOptions);
memberAxios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('thankeeu_member_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
memberAxios.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && localStorage.getItem('thankeeu_member_token')) {
    localStorage.removeItem('thankeeu_member_token');
    localStorage.removeItem('thankeeu_member');
    window.location.href = '/member/login';
  }
  return Promise.reject(err);
});

// 5. Smart — uses member token if present, falls back to user token (no forced redirect)
const smartAxios = axios.create(axiosOptions);
smartAxios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('thankeeu_member_token') || localStorage.getItem('thankeeu_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
// Smart axios does NOT forcefully redirect on 401 — used for bank/shared endpoints

// 6. Any-auth — tries company token, then member token, then user token. No forced redirect.
const anyAxios = axios.create(axiosOptions);
anyAxios.interceptors.request.use(cfg => {
  const t =
    localStorage.getItem('thankeeu_company_token') ||
    localStorage.getItem('thankeeu_member_token') ||
    localStorage.getItem('thankeeu_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  sendVerificationCode: (data)  => axios.post(`${BASE_URL}/auth/send-code`, data),
  verifyCode:           (data)  => axios.post(`${BASE_URL}/auth/verify-code`, data),
  signup:               (data)   => api.post('/auth/signup', data),
  login:                (data)   => api.post('/auth/login', data),
  getMe:                ()       => api.get('/auth/me'),
  updateProfile:        (data)   => api.put('/auth/profile', data),
  changePassword:       (data)   => api.put('/auth/password', data),
  searchUsers:          (q)      => api.get(`/auth/search?q=${encodeURIComponent(q)}`),
  verifyEmail:          (token)  => publicAxios.get(`/auth/verify-email?token=${token}`),
  resendVerification:   ()       => api.post('/auth/resend-verification'),
  forgotPassword:       (email)  => api.post('/auth/forgot-password', { email }),
  resetPassword:        (data)   => api.post('/auth/reset-password', data),
};

// ─── Cards ─────────────────────────────────────────────────────────────────
export const cardsAPI = {
  create:           (data)         => api.post('/cards', data),
  createAsCompany:  (data)         => companyAxios.post('/cards', data),
  notifySigners:    (slug, data)    => companyAxios.post(`/cards/${slug}/notify-signers`, data),
  getAll:           ()             => api.get('/cards'),
  getOne:           (slug, token)  => api.get(`/cards/${slug}${token ? `?token=${token}` : ''}`),
  getOneAsCompany:  (slug)         => companyAxios.get(`/cards/${slug}`),
  getCompanyMine:   ()             => companyAxios.get('/cards/company/mine'),
  getPublic:    (slug)         => publicAxios.get(`/cards/public/${slug}`),
  // Recipient claim flow
  getClaimGate: (slug, claim)   => publicAxios.get(`/cards/${slug}/claim-gate?claim=${encodeURIComponent(claim)}`),
  markClaimed:  (slug, token)   => publicAxios.post(`/cards/${slug}/mark-claimed`, { access_token: token }),
  getRecipient: (slug, token)  => publicAxios.get(`/cards/recipient/${slug}`, { params: { token } }),
  claimGift:    (slug, data)   => publicAxios.post(`/cards/recipient/${slug}/claim`, data),
  update:       (slug, data)   => api.put(`/cards/${slug}`, data),
  updateAsCompany: (slug, data) => companyAxios.put(`/cards/${slug}`, data),
  activate:     (slug, data)   => anyAxios.post(`/cards/${slug}/activate`, data),
  send:         (slug)         => api.post(`/cards/${slug}/send`),
  delete:       (slug)         => api.delete(`/cards/${slug}`),
  approveScope: (slug)         => companyAxios.post(`/cards/${slug}/approve-scope`),
  // Anonymous pre-signup draft flow (GroupCards/Thankbox-style): create and
  // edit a card with no login required. draftEditToken, once issued by the
  // server on creation, must be presented on every subsequent write.
  createDraft:  (data)                     => anyAxios.post('/cards', data),
  updateDraft:  (slug, data, draftEditToken) => anyAxios.put(`/cards/${slug}`, data,
    draftEditToken ? { headers: { 'x-draft-edit-token': draftEditToken } } : undefined),
  activateDraft: (slug, data, draftEditToken) => anyAxios.post(`/cards/${slug}/activate`, data,
    draftEditToken ? { headers: { 'x-draft-edit-token': draftEditToken } } : undefined),
  claimDraft:   (slug, draftEditToken)     => api.post(`/cards/${slug}/claim`, { draft_edit_token: draftEditToken }),
};

// ─── Messages ──────────────────────────────────────────────────────────────
export const messagesAPI = {
  // RC3 fix: delete Content-Type so axios sets multipart/form-data+boundary automatically for FormData
  // Longer timeout than the global 15s default: this request may carry a photo/video/voice
  // attachment that the backend re-uploads to Cloudinary, which can legitimately take longer
  // than plain JSON calls — especially video/voice on a slower connection.
  add:    (cardSlug, data)  => publicAxios.post(`/messages/${cardSlug}`, data, {
    headers: { 'Content-Type': undefined },
    timeout: 60000,
  }),
  react:          (messageId, data) => publicAxios.post(`/messages/react/${messageId}`, data),
  updatePosition: (messageId, data) => smartAxios.patch(`/messages/position/${messageId}`, data),
  delete: (messageId)       => api.delete(`/messages/${messageId}`),
  // reply is authenticated — uses smart axios so both users and members can reply
  reply:  (cardSlug, data)  => smartAxios.post(`/messages/${cardSlug}/reply`, data),
  // sign = alias for add (used in vendor product gift flow)
  sign:   (cardSlug, data)  => publicAxios.post(`/messages/${cardSlug}`, data, { headers: { 'Content-Type': undefined }, timeout: 60000 }),
};

// ─── Payments ──────────────────────────────────────────────────────────────
export const paymentsAPI = {
  // Card creation fee — returns { payment_link }
  initCardFee:         (card_slug, currency) => anyAxios.post('/payments/initialize/purchase', { card_slug, currency: currency || 'NGN' }),
  verifyCardFee:       (txRef)     => anyAxios.get(`/payments/verify-card-fee?tx_ref=${encodeURIComponent(txRef)}`),

  // Gift contribution — returns { payment_link }
  initContribution:    (data)      => publicAxios.post('/payments/initialize/contribution', data, { timeout: 30000 }),
  verifyContribution:  (txRef)     => publicAxios.post('/payments/verify-contribution', { tx_ref: txRef }, { timeout: 30000 }),

  // Generic verify by tx_ref — used by PaymentCallback as fallback
  verify:              (txRef)     => anyAxios.get(`/payments/verify/${encodeURIComponent(txRef)}`),
};

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get:                   ()      => api.get('/dashboard'),
  getStats:              ()      => api.get('/dashboard/stats'),
  markNotificationsRead: ()      => api.post('/dashboard/notifications/read'),
  getFinancialHistory:   ()      => api.get('/dashboard/financial-history'),
  getDeliveredCards:     ()      => api.get('/dashboard/delivered'),
  getReceivedCards:      ()      => api.get('/dashboard/received'),
  getPendingToSign:      ()      => api.get('/dashboard/pending-to-sign'),
  transferCard:          (data)  => api.post('/dashboard/transfer-card', data),
  trackCardOpened:       (slug)  => publicAxios.post(`/dashboard/card-opened/${slug}`),
};

// ─── Reminders — uses smartAxios so both users and members work ────────────
export const remindersAPI = {
  getAll:  ()       => smartAxios.get('/reminders'),
  create:  (data)   => smartAxios.post('/reminders', data),
  update:  (id, d)  => smartAxios.put(`/reminders/${id}`, d),
  delete:  (id)     => smartAxios.delete(`/reminders/${id}`),
};

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:     ()                       => api.get('/admin/stats'),
  getUsers:     ()                       => api.get('/admin/users'),
  updateRole:   (userId, role)           => api.put(`/admin/users/${userId}/role`, { role }),
  giftCredits:  (userId, credits, reason) => api.post(`/admin/users/${userId}/gift-credits`, { credits, reason }),
  deleteUser:   (userId)                 => api.delete(`/admin/users/${userId}`),
  getCards:     ()                       => api.get('/admin/cards'),
  redeliverCard: (cardId)               => api.post(`/admin/cards/${cardId}/redeliver`),
  deleteCard:   (cardId)                => api.delete(`/admin/cards/${cardId}`),
};

export const adminCompanyAPI = {
  getAll:     ()   => api.get('/admin/companies'),
  delete:     (id) => api.delete(`/admin/companies/${id}`),
  getMembers: (id) => api.get(`/admin/companies/${id}/members`),
};

export const adminSupportAPI = {
  getAll: ()                 => api.get('/support/all'),
  reply:  (ticketId, reply)  => api.post(`/support/${ticketId}/reply`, { reply }),
};

// ─── Company / HR ──────────────────────────────────────────────────────────
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
  downloadTemplate: ()        => companyAxios.get('/teams/template', { responseType: 'blob' }),
  importMembers:    (fd)      => companyAxios.post('/teams/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMembers:       (params)  => companyAxios.get('/teams', { params }),
  getDepartments:   ()        => companyAxios.get('/teams/departments'),
  getDashboard:     ()        => companyAxios.get('/teams/dashboard'),
  deleteMember:     (id)      => companyAxios.delete(`/teams/${id}`),
};

export const subscriptionAPI = {
  get:        ()          => companyAxios.get('/subscription'),
  getQuote:   ()          => companyAxios.get('/subscription/quote'),
  initialize: (plan, currency) => companyAxios.post('/subscription/initialize', { plan, currency: currency || 'NGN' }),
  verify:     (reference) => companyAxios.get(`/subscription/verify/${reference}`),
  cancel:     ()          => companyAxios.post('/subscription/cancel'),
};

// Support — company HR
export const supportAPI = {
  create: (data) => companyAxios.post('/support', data),
  getMine: ()    => companyAxios.get('/support/mine'),
};

// Support — individual user
export const userSupportAPI = {
  create: (data) => api.post('/support', data),
  getMine: ()    => api.get('/support/mine'),
};

export const occasionsAPI = {
  getTypes:         ()               => companyAxios.get('/occasions/types'),
  createType:       (data)           => companyAxios.post('/occasions/types', data),
  downloadTemplate: (name)           => companyAxios.get(`/occasions/template/${name}`, { responseType: 'blob' }),
  importMembers:    (typeId, fd)     => companyAxios.post(`/occasions/${typeId}/import`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMembers:       (typeId, p)      => companyAxios.get(`/occasions/${typeId}/members`, { params: p }),
  deleteMember:     (typeId, mId)    => companyAxios.delete(`/occasions/${typeId}/members/${mId}`),
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

// ─── Team Member ───────────────────────────────────────────────────────────
export const memberAPI = {
  signup:              (data)      => memberAxios.post('/members/signup', data),
  login:               (data)      => memberAxios.post('/members/login', data),
  getMe:               ()          => memberAxios.get('/members/me'),
  getDashboard:        ()          => memberAxios.get('/members/dashboard'),
  getDeptPending:      ()          => memberAxios.get('/members/dept-pending'),
  forgotPassword:      (email)     => memberAxios.post('/members/forgot-password', { email }),
  resetPassword:       (data)      => memberAxios.post('/members/reset-password', data),
  getMyCards:          ()          => memberAxios.get('/members/my-cards'),
  updateProfile:       (data)      => memberAxios.put('/members/profile', data),
  changePassword:      (data)      => memberAxios.put('/members/password', data),
  getPendingToSign:    ()          => memberAxios.get('/members/pending-to-sign'),
  getReceived:         ()          => memberAxios.get('/members/received'),
  transferCard:        (data)      => memberAxios.post('/members/transfer-card', data),
  getReminders:        ()          => memberAxios.get('/members/reminders'),
  createReminder:      (data)      => memberAxios.post('/members/reminders', data),
  deleteReminder:      (id)        => memberAxios.delete(`/members/reminders/${id}`),
  getFinances:         ()          => memberAxios.get('/members/finances'),
  getDepartments:      (companyId) => publicAxios.get(`/members/departments?companyId=${companyId}`),
  getFinancialHistory: ()          => memberAxios.get('/members/financial-history'),
};

// Member card creation
export const memberCardsAPI = {
  getHistory: () => memberAxios.get('/cards/member-history'),
  create:     (data) => memberAxios.post('/cards', data),
  getOne:     (slug) => memberAxios.get(`/cards/${slug}`),
  update:     (slug, data) => memberAxios.put(`/cards/${slug}`, data),
};

// Member support tickets
export const memberSupportAPI = {
  create: (data) => memberAxios.post('/support', data),
  getMine: ()    => memberAxios.get('/support/mine'),
};

export const deductionsAPI = {
  getWallet:           (cardId) => memberAxios.get(`/deductions/wallet/${cardId}`),
  request:             (data)   => memberAxios.post('/deductions/request', data),
  getPending:          ()       => companyAxios.get('/deductions/pending'),
  approve:             (id, n)  => companyAxios.post(`/deductions/${id}/approve`, { note: n }),
  reject:              (id, n)  => companyAxios.post(`/deductions/${id}/reject`, { note: n }),
  requestCrossDept:    (data)   => memberAxios.post('/deductions/cross-dept', data),
  getCrossDeptPending: ()       => companyAxios.get('/deductions/cross-dept'),
  approveCrossDept:    (id)     => companyAxios.post(`/deductions/cross-dept/${id}/approve`),
  getLeaderOccasions:  ()       => memberAxios.get('/deductions/leader/occasions'),
  getLeaderRequests:   ()       => memberAxios.get('/deductions/leader/requests'),
  withdrawDeduction:   (id)     => memberAxios.post(`/deductions/${id}/withdraw`, {}),
};

// ─── Notifications ─────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      () => smartAxios.get('/notifications'),
  getCount:    () => smartAxios.get('/notifications/count'),
  markAllRead: () => smartAxios.post('/notifications/mark-read'),
};

// ─── Banks & Withdrawals ───────────────────────────────────────────────────
export const creditsAPI = {
  getBalance:  ()           => api.get('/credits/balance'),
  getHistory:  ()           => api.get('/credits/history'),
  purchase:    (plan_type, currency) => api.post('/credits/purchase', { plan_type, currency: currency || 'NGN' }),
  verify:      (txRef)      => api.get(`/credits/verify/${encodeURIComponent(txRef)}`),
  spend:       (card_slug)  => api.post('/credits/spend', { card_slug }),
};

export const giftcardsAPI = {
  getProducts:    (country, currency) => publicAxios.get(`/giftcards/products?country=${country||''}&currency=${currency||''}`),
  getProduct:     (productId)         => publicAxios.get(`/giftcards/product/${productId}`),
  order:          (data)              => anyAxios.post('/giftcards/order', data),
  myHistory:      ()                  => anyAxios.get('/giftcards/my-history'),
};

export const banksAPI = {
  getList:      ()     => publicAxios.get('/banks/list'),
  verify:       (data) => smartAxios.post('/banks/verify', data),
  save:         (data) => smartAxios.post('/banks/save', data),
  getMy:        ()     => smartAxios.get('/banks/my'),
  delete:       (id)   => smartAxios.delete(`/banks/${id}`),
  withdraw:     (data) => smartAxios.post('/banks/withdraw', data),
  withdrawGift: (data) => smartAxios.post('/banks/withdraw-gift', data),
};

// ─── Demo / Blog ───────────────────────────────────────────────────────────
export const demoAPI = {
  submit:       (data)              => publicAxios.post('/demo/request', data),
  getAll:       ()                  => api.get('/demo/requests'),
  updateStatus: (id, status, note)  => api.patch(`/demo/requests/${id}`, { status, admin_note: note }),
};

export const blogAPI = {
  getPosts:      (params = {}) => publicAxios.get('/blog', { params }),
  getCategories: ()             => publicAxios.get('/blog/categories'),
  getPost:       (slug)         => publicAxios.get(`/blog/${slug}`),
  getSitemap:    ()             => publicAxios.get('/blog/sitemap'),
  subscribe:     (data)          => publicAxios.post('/blog/subscribe', data),
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

export const visitorsAPI = {
  track: (data) => publicAxios.post('/visitors/track', data),
};

// ── Vendor API (marketplace) ─────────────────────────────────────────────────
const vendorAxios = axios.create({ baseURL: BASE_URL, withCredentials: true });
vendorAxios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('tk_vendor');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
vendorAxios.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && !window.location.pathname.includes('/vendor/login')) {
    localStorage.removeItem('tk_vendor');
    window.location.href = '/vendor/login';
  }
  return Promise.reject(err);
});
export { vendorAxios };

export const vendorAPI = {
  signup:      (data)  => publicAxios.post('/vendor/signup', data),
  login:       (data)  => publicAxios.post('/vendor/login', data),
  getStore:    ()      => vendorAxios.get('/vendor/me'),
  updateStore: (data)  => vendorAxios.put('/vendor/me', data),
  getProducts: ()      => vendorAxios.get('/vendor/products'),
  addProduct:  (data)  => vendorAxios.post('/vendor/products', data),
  updateProduct:(id,d) => vendorAxios.put(`/vendor/products/${id}`, d),
  deleteProduct:(id)   => vendorAxios.delete(`/vendor/products/${id}`),
  getOrders:   ()      => vendorAxios.get('/vendor/orders'),
  updateOrder: (id, d) => vendorAxios.put(`/vendor/orders/${id}`, d),
  getAnalytics:()      => vendorAxios.get('/vendor/analytics'),
  uploadProductImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return vendorAxios.post('/vendor/products/upload-image', fd, { headers: { 'Content-Type': undefined } });
  },
  getPublicStore: (slug) => publicAxios.get(`/vendor/store/${slug}`),
  placeOrder:     (slug,d) => publicAxios.post(`/vendor/store/${slug}/order`, d),
  checkout:       (slug,d) => publicAxios.post(`/vendor/store/${slug}/checkout`, d, { timeout: 30000 }),
  verifyOrder:    (txRef)  => publicAxios.get(`/vendor/order-verify?tx_ref=${txRef}`, { timeout: 30000 }),
  uploadBanner:   (file)   => {
    const fd = new FormData(); fd.append('image', file);
    return vendorAxios.post('/vendor/me/upload-banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Pals API (group accounts) ────────────────────────────────────────────────
const palAxios = axios.create({ baseURL: BASE_URL, withCredentials: true });
palAxios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('tk_pal');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
palAxios.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && !window.location.pathname.includes('/pals/login')) {
    localStorage.removeItem('tk_pal');
    localStorage.removeItem('thankeeu_pal');
    window.location.href = '/pals/login';
  }
  return Promise.reject(err);
});
export { palAxios };

export const palAPI = {
  signup:       (data) => publicAxios.post('/pals/signup', data),
  login:        (data) => publicAxios.post('/pals/login', data),
  verifyEmail:  (token) => publicAxios.get(`/pals/verify-email?token=${token}`),
  previewInvite:(token) => publicAxios.get(`/pals/invite/${token}`),
  acceptInvite: (data) => publicAxios.post('/pals/accept-invite', data),

  me:            ()      => palAxios.get('/pals/me'),
  getSettings:   ()      => palAxios.get('/pals/settings'),
  updateSettings:(data)  => palAxios.put('/pals/settings', data),
  uploadLogo:    (file)  => { const fd = new FormData(); fd.append('file', file); return palAxios.post('/pals/settings/logo', fd, { headers: { 'Content-Type': undefined } }); },

  getMembers:        ()       => palAxios.get('/pals/members'),
  getMemberProfile:  (id)     => palAxios.get(`/pals/members/${id}`),
  updateMemberProfile:(id,d)  => palAxios.put(`/pals/members/${id}`, d),
  updateMemberEvent: (id,d)   => palAxios.put(`/pals/members/${id}/event`, d),
  uploadAvatar:      (id,file)=> { const fd = new FormData(); fd.append('file', file); return palAxios.post(`/pals/members/${id}/avatar`, fd, { headers: { 'Content-Type': undefined } }); },
  inviteMember:      (data)   => palAxios.post('/pals/invite', data),
  inviteCSV:         (file)   => { const fd = new FormData(); fd.append('file', file); return palAxios.post('/pals/invite/csv', fd, { headers: { 'Content-Type': undefined } }); },

  getMyCards:    ()  => palAxios.get('/pals/cards'),
  updateCard:    (slug, data) => palAxios.put(`/cards/${slug}`, data),
  getAnalytics:  ()  => palAxios.get('/pals/analytics'),

  getTickets:    ()      => palAxios.get('/pals/support'),
  createTicket:  (data)  => palAxios.post('/pals/support', data),
};
