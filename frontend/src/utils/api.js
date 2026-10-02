import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskeeu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — only log out on genuine auth failure
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const requestUrl = err.config?.url || '';

    // A review is owed (compulsory after every completed task): open the
    // review form wherever the user is. The caller still gets the error so
    // its own toast explains why the action was blocked.
    if (status === 403 && err.response?.data?.code === 'REVIEW_REQUIRED' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('review-required', { detail: err.response.data.pending || [] }));
    }

    // 401 = token invalid/expired → force re-login
    // 403 = forbidden (e.g. pending approval) → do NOT log out, let page handle it
    if (status === 401) {
      // Never intercept login/register endpoints — those 401s are just wrong
      // credentials and the login page handles them. Intercepting them causes
      // the admin to be bounced to /auth instead of seeing the error in-form.
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/me') || requestUrl.endsWith('/auth/check-username')) {
        return Promise.reject(err);
      }

      const msg = err.response?.data?.message || '';
      // Don't logout if it's a business rule 403-style message on a 401
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval')) {
        return Promise.reject(err);
      }

      // Determine role before clearing storage
      const wasAdmin = (() => {
        try { return JSON.parse(localStorage.getItem('taskeeu_user'))?.role === 'admin'; } catch { return false; }
      })();

      localStorage.removeItem('taskeeu_token');
      localStorage.removeItem('taskeeu_user');

      // Redirect to the correct login page
      if (wasAdmin || window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/auth?session=expired';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Double-submit guard (applies to EVERY button in the app) ─────────
// If an identical POST/PUT/PATCH/DELETE (same URL + same body) is already in
// flight, a second call does not send a second request — it receives the SAME
// promise, so both clicks see the same success/error. This removes the whole
// class of "first click: error, second click: already approved" bugs caused by
// double clicks. FormData uploads and chat messages are never merged (a user
// may legitimately send the same text twice).
const inFlight = new Map();
const NEVER_MERGE = [/\/chat\/rooms\/[^/]+\/messages$/];
['post', 'put', 'patch', 'delete'].forEach((method) => {
  const original = api[method].bind(api);
  api[method] = (url, dataOrConfig, config) => {
    const body = method === 'delete' ? dataOrConfig?.data : dataOrConfig;
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    if (isForm || NEVER_MERGE.some((re) => re.test(url))) return original(url, dataOrConfig, config);
    let bodyKey;
    try { bodyKey = JSON.stringify(body ?? null); } catch { return original(url, dataOrConfig, config); }
    const key = `${method} ${url} ${bodyKey}`;
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = original(url, dataOrConfig, config).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
});

// Bank transfers can take longer than the default 30s (they go through a
// static-IP proxy). Timing out early made the screen say "failed" while the
// money was actually sent, so money-moving calls get a longer timeout.
const MONEY_TIMEOUT = { timeout: 90000 };

export default api;

// ─── Typed API helpers ─────────────────────────────────────────────

// Auth
export const authApi = {
  registerRequester: (data) => api.post('/auth/register/requester', data),
  taskerStep1Validate: (data) => api.post('/auth/register/tasker/step1-validate', data),
  taskerStep2: (data) => api.post('/auth/register/tasker/step2', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  taskerStep2Upload: (data) => api.post('/auth/register/tasker/kyc-resume', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  taskerStep3: (data) => api.post('/auth/register/tasker/step3', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  taskerKYC: (data) => api.post('/taskers/me/kyc', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar:  (formData) => api.post('/auth/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/change-password', data),
  getBanks: (country = 'NG') => api.get(`/auth/banks?country=${country}`),
  resolveAccount: (data) => api.post('/auth/resolve-account', data),
  checkUsername: (username, role) => api.get(`/auth/check-username?username=${username}&role=${role}`),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
  deleteAccount: (data) => api.delete('/auth/account', { data }),
};

// Tasks
export const vooomApi = {
  list: (params) => api.get('/vooom', { params }),
  get: (id) => api.get(`/vooom/${id}`),
  create: (data) => api.post('/vooom', data),
  bid: (id, data) => api.post(`/vooom/${id}/bid`, data),
  acceptBid: (id, bidId) => api.post(`/vooom/${id}/accept-bid/${bidId}`),
  complete: (id) => api.post(`/vooom/${id}/complete`),
  cancel: (id) => api.post(`/vooom/${id}/cancel`),
  myRequester: () => api.get('/vooom/my/requester'),
  myTasker: () => api.get('/vooom/my/tasker'),
  switchToRequester: (accepted) => api.post('/vooom/switch-to-requester', { accepted }),
  fundTask: (vooom_task_id, amount) => api.post('/payments/fund-vooom', { vooom_task_id, amount }),
};

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  extendDeadline: (id, new_deadline) => api.post(`/tasks/${id}/extend-deadline`, { new_deadline }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  cancel: (id) => api.delete(`/tasks/${id}`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  bid: (id, data) => api.post(`/tasks/${id}/bid`, data),
  acceptBid: (taskId, bidId) => api.post(`/tasks/${taskId}/bid/${bidId}/accept`),
  rejectBid: (taskId, bidId) => api.post(`/tasks/${taskId}/bid/${bidId}/reject`),
  chatWithBidder: (taskId, bidId) => api.post(`/tasks/${taskId}/bid/${bidId}/chat`),
  generateCode: (id) => api.post(`/tasks/${id}/generate-code`),
  complete: (id, data) => api.post(`/tasks/${id}/complete`, data),
  rate: (id, data) => api.post(`/tasks/${id}/rate`, data),
  myRequesterTasks: () => api.get('/tasks/my/requester'),
  myTaskerTasks: () => api.get('/tasks/my/tasker'),
  requestCancel: (id, data) => api.post(`/tasks/${id}/cancel-request`, data),
  respondCancel: (id, data) => api.post(`/tasks/${id}/cancel-response`, data),
  myCancelRequests: () => api.get('/tasks/my/cancel-requests'),
  directHire: (data) => api.post('/tasks/direct-hire', data),
  // Proof of work (step 1 of the tasker's completion flow). FormData uploads
  // are never de-duplicated, and large files get a longer timeout.
  proofs: (id) => api.get(`/tasks/${id}/proofs`),
  uploadProofs: (id, formData, onUploadProgress) => api.post(`/tasks/${id}/proofs`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000, onUploadProgress,
  }),
  deleteProof: (id, proofId) => api.delete(`/tasks/${id}/proofs/${proofId}`),
};

// Taskers
export const taskersApi = {
  list: (params) => api.get('/taskers', { params }),
  get: (userId) => api.get(`/taskers/${userId}`),
  myProfileLink: () => api.get('/taskers/me/profile-link'),
  updateTaskAddress: (data) => api.put('/taskers/me/task-address', data),
  updateAvailability: (data) => api.put('/taskers/me/availability', data),
  updateBankDetails: (data) => api.put('/taskers/me/bank-details', data),
  // International markets: local bank fields, paid from the Taskeeu payout queue
  savePayoutDetails: (data) => api.put('/taskers/me/payout-details', data),
  myPayouts: () => api.get('/taskers/me/payouts'),
  updateProfile: (data) => api.put('/taskers/me/profile', data),
  updateKYC: (data) => api.post('/taskers/me/kyc', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitKYCRequest: (data) => api.post('/taskers/me/kyc-request', data),
  getMyKYCRequests: () => api.get('/taskers/me/kyc-requests'),
  applyDirectly: (userId, data) => api.post(`/taskers/${userId}/apply`, data),
  dashboard: () => api.get('/taskers/me/dashboard'),
};

// Payments
export const paymentsApi = {
  fundTask: (data) => api.post('/payments/fund-task', data),
  requestWithdrawal: () => api.post('/payments/withdraw', {}, MONEY_TIMEOUT),
  initiate: (data) => api.post('/payments/initiate', data),
  verify: (ref) => api.get(`/payments/verify/${ref}`),
  createCustom: (data) => api.post('/payments/custom', data),
  getCustom: (taskId) => api.get(`/payments/custom/${taskId}`),
  uploadProof: (id, data) => api.post(`/payments/custom/${id}/upload-proof`, data),
  confirmProof: (id) => api.post(`/payments/custom/${id}/confirm`),
  requestRefund: (data) => api.post('/payments/refund/request', data),
  respondRefund: (id, data) => api.post(`/payments/refund/${id}/respond`, data),
  history: () => api.get('/payments/history'),
  refunds: () => api.get('/payments/refunds'),
  // ── Advance payment (equipment/transport advance) ──
  requestAdvance: (data) => api.post('/payments/advance/request', data),
  getAdvanceForTask: (taskId) => api.get(`/payments/advance/task/${taskId}`),
  getPendingAdvances: () => api.get('/payments/advance/pending'),
  getMyAdvanceRequests: () => api.get('/payments/advance/my-requests'),
  respondAdvance: (id, data) => api.put(`/payments/advance/${id}/respond`, data),
  withdrawAdvance: (id) => api.post(`/payments/advance/${id}/withdraw`, {}, MONEY_TIMEOUT),
  escrow: () => api.get('/payments/escrow'),
  // Tips / extra money for the tasker (no platform fee)
  tip: (data) => api.post('/payments/tip', data),
  tipsForTask: (taskId) => api.get(`/payments/tips/task/${taskId}`),
};

// Chat
// Two-way reviews (requester ⇄ tasker)
export const reviewsApi = {
  pending: () => api.get('/reviews/pending'),
  submit: (data) => api.post('/reviews', data),
  mine: (as) => api.get('/reviews/me', { params: as ? { as } : {} }),
  forUser: (userId, as = 'tasker', params = {}) => api.get(`/reviews/user/${userId}`, { params: { as, ...params } }),
  forTask: (taskId) => api.get(`/reviews/task/${taskId}`),
};

export const chatApi = {
  getRooms: () => api.get('/chat/rooms'),
  getMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId, data) => api.post(`/chat/rooms/${roomId}/messages`, data),
  react: (roomId, msgId, data) => api.post(`/chat/rooms/${roomId}/messages/${msgId}/react`, data),
  deleteMessage: (roomId, msgId) => api.delete(`/chat/rooms/${roomId}/messages/${msgId}`),
  getNotifications: () => api.get('/chat/notifications'),
  markNotificationsRead: (ids) => api.put('/chat/notifications/read', { ids }),
};

// Admin
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  // Tasker KYC management
  getTaskers: (params) => api.get('/admin/taskers', { params }),
  getTasker: (userId) => api.get(`/admin/taskers/${userId}`),
  approveTasker: (userId, data) => api.post(`/admin/taskers/${userId}/approve`, data),
  rejectTasker: (userId, data) => api.post(`/admin/taskers/${userId}/reject`, data),
  ignoreTasker: (userId) => api.post(`/admin/taskers/${userId}/ignore`),
  setTaskerFee: (userId, data) => api.put(`/admin/taskers/${userId}/fee`, data),
  // KYC change requests
  getKYCRequests: (params) => api.get('/admin/kyc-requests', { params }),
  reviewKYCRequest: (id, data) => api.put(`/admin/kyc-requests/${id}`, data),
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  setUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  verifyUserEmail: (userId) => api.put(`/admin/users/${userId}/verify-email`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  // Tasks & payments
  getTasks: (params) => api.get('/admin/tasks', { params }),
  getTaskDetail: (id) => api.get(`/admin/tasks/${id}`),
  setTaskVisibility: (id, hidden, reason) =>
    api.patch(`/admin/tasks/${id}/visibility`, { hidden, reason }),
  getReferrals: () => api.get('/admin/referrals'),
  getPwaPushAnalytics: () => api.get('/admin/analytics/pwa-push'),
  getPosterAnalytics: () => api.get('/admin/analytics/posters'),
  sendFeatureAnnouncement: (data) => api.post('/admin/send-feature-announcement', data),
  getAnnouncementHistory: () => api.get('/admin/feature-announcements'),
  getAnnouncementTemplate: () => api.get('/admin/feature-announcement-template'),
  getEmailAnalytics: () => api.get('/admin/analytics/email'),
  getPayments: () => api.get('/admin/payments'),
  getFinance: () => api.get('/admin/finance'),
  getPayouts: (params) => api.get('/admin/payouts', { params }),
  payoutAction: (id, action, note) => api.post(`/admin/payouts/${id}/${action}`, { note }),
  getRefunds: () => api.get('/admin/refunds'),
  auditLog: () => api.get('/admin/audit-log'),
  getAnalytics: (range) => api.get('/admin/analytics', { params: { range } }),
  resetAnalytics: () => api.delete('/admin/analytics/reset'),
  trackPageView: (data) => api.post('/admin/analytics/track', data).catch(() => {}), // fire-and-forget, never throws
  // Site settings (nav toggles etc.)
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
};

// Public site settings (unauthenticated, used to drive nav visibility)
export const referralsApi = {
  me: () => api.get('/referrals/me'),
  setSlug: (slug) => api.put('/referrals/slug', { slug }),
  resolve: (slug) => api.get(`/referrals/resolve/${slug}`),
  withdraw: () => api.post('/referrals/withdraw', {}, MONEY_TIMEOUT),
};

export const pwaApi = {
  logInstall: (data) => api.post('/track/pwa-install', data),
  pushEvent: (data) => api.post('/track/push-event', data),
  posterEvent: (data) => api.post('/track/poster-event', data),
};

export const pushApi = {
  vapidKey: () => api.get('/push/vapid-public-key'),
  subscribe: (subscription) => api.post('/push/subscribe', { subscription }),
  unsubscribe: (endpoint) => api.post('/push/unsubscribe', { endpoint }),
  adminSend: (data) => api.post('/admin/push', data),
};

export const settingsApi = {
  getPublic: () => api.get('/settings'),
};

// Locations
export const locationsApi = {
  states: () => api.get('/locations/states'),
  cities: (state) => api.get(`/locations/cities/${state}`),
};

// ─── Teams API ─────────────────────────────────────────────────────
export const teamsApi = {
  // Task types
  getTaskTypes: () => api.get('/teams/task-types'),

  // Company
  registerCompany: (data) => api.post('/teams/companies/register', data),
  getMyCompany: () => api.get('/teams/companies/me'),
  getCompanyMembers: (id, params) => api.get(`/teams/companies/${id}/members`, { params }),
  approveMember: (cid, mid, data) => api.post(`/teams/companies/${cid}/members/${mid}/approve`, data),
  memberAction: (cid, mid, data) => api.post(`/teams/companies/${cid}/members/${mid}/action`, data),
  setPermissions: (cid, mid, data) => api.post(`/teams/companies/${cid}/members/${mid}/permissions`, data),

  // Departments
  getDepartments: (cid) => api.get(`/teams/companies/${cid}/departments`),
  createDepartment: (cid, data) => api.post(`/teams/companies/${cid}/departments`, data),
  updateDepartment: (cid, did, data) => api.put(`/teams/companies/${cid}/departments/${did}`, data),

  // Wallet
  getWallet: (cid) => api.get(`/teams/companies/${cid}/wallet`),
  topupWallet: (cid, data) => api.post(`/teams/companies/${cid}/wallet/topup`, data),
  verifyWalletTopup: (cid, ref) => api.post(`/teams/companies/${cid}/wallet/verify/${ref}`),
  allocateBudget: (cid, data) => api.post(`/teams/companies/${cid}/wallet/allocate`, data),

  // Subscription
  subscribe: (cid, data) => api.post(`/teams/companies/${cid}/subscribe`, data),
  verifySubscription: (cid, ref) => api.post(`/teams/companies/${cid}/subscribe/verify/${ref}`),

  // Member auth
  memberSignup: (data) => api.post('/teams/members/signup', data),
  memberLogin: (data) => api.post('/teams/members/login', data),
  getMemberProfile: () => api.get('/teams/member/me'),
};

// ─── Enterprise Tasks API ──────────────────────────────────────────
export const enterpriseApi = {
  createTask: (data) => api.post('/enterprise-tasks', data),
  listTasks: (params) => api.get('/enterprise-tasks', { params }),
  getTask: (id) => api.get(`/enterprise-tasks/${id}`),
  approveLine: (id, data) => api.post(`/enterprise-tasks/${id}/approve-line`, data),
  placeBid: (id, data) => api.post(`/enterprise-tasks/${id}/bids`, data),
  bidAction: (id, bidId, data) => api.post(`/enterprise-tasks/${id}/bids/${bidId}/action`, data),
  uploadProofs: (id, data) => api.post(`/enterprise-tasks/${id}/proofs`, data),
  approveProof: (id, proofId, data) => api.post(`/enterprise-tasks/${id}/proofs/${proofId}/approve`, data),
  blacklistTasker: (id, data) => api.post(`/enterprise-tasks/${id}/blacklist-tasker`, data),
  broadcast: (id, data) => api.post(`/enterprise-tasks/${id}/broadcast`, data),
  createMeeting: (id, data) => api.post(`/enterprise-tasks/${id}/meeting`, data),
  taskerAvailable: () => api.get('/enterprise-tasks/tasker/available'),
  taskerMyTasks: () => api.get('/enterprise-tasks/tasker/my-tasks'),
};

// ─── Certifications API ────────────────────────────────────────────
export const certApi = {
  getModules: () => api.get('/certifications/modules'),
  completeModule: (id, data) => api.post(`/certifications/modules/${id}/complete`, data),
  getMyCert: () => api.get('/certifications/my'),
  verifyCert: (num) => api.get(`/certifications/${num}/verify`),
};

// ─── Teams File History ────────────────────────────────────────────
export const fileHistoryApi = {
  list: (companyId, params) => api.get(`/teams/companies/${companyId}/file-history`, { params }),
  approveLeaderRights: (companyId, memberId) => api.post(`/teams/companies/${companyId}/members/${memberId}/approve-leader`),
  getCompaniesByDomain: (domain) => api.get(`/teams/companies/by-domain/${domain}`),
};

// ─── Certifications API ────────────────────────────────────────────
export const certificationsApi = {
  getModules:       ()         => api.get('/certifications/modules'),
  completeModule:   (id, data) => api.post(`/certifications/modules/${id}/complete`, data),
  getMyCert:        ()         => api.get('/certifications/my'),
  verifyCert:       (num)      => api.get(`/certifications/${num}/verify`),
  getCertificateUrl:(userId)   => `${api.defaults.baseURL}/certifications/${userId}/certificate`,
  getFileHistory:   (cid, p)   => api.get(`/enterprise-tasks/company/${cid}/file-history`, { params: p }),
  getTaskProofs:    (id)       => api.get(`/enterprise-tasks/${id}/proofs`),
  grantLeaderRights:(cid, mid, data) => api.post(`/enterprise-tasks/company/${cid}/team-leader-rights/${mid}`, data),
};

// ─── Demo Requests API ─────────────────────────────────────────────
export const demoApi = {
  submitRequest: (data) => api.post('/demo/request', data),
  getRequests:   ()     => api.get('/demo/requests'),
  updateRequest: (id, data) => api.put(`/demo/requests/${id}`, data),
};

// ─── Support Tickets ───────────────────────────────────────────────
export const contactApi = {
  submit:           (data)       => api.post('/contact', data),
  getInquiries:     (params)     => api.get('/contact', { params }),
  reply:            (id, data)   => api.post(`/contact/${id}/reply`, data),
  markRead:         (id)         => api.put(`/contact/${id}/read`),
  broadcast:        (data)       => api.post('/contact/broadcast', data),
  broadcastHistory: ()           => api.get('/contact/broadcast/history'),
};

export const supportApi = {
  createTicket: (data) => api.post('/support/tickets', data),
  getTickets: () => api.get('/support/tickets'),
  getTicket: (id) => api.get(`/support/tickets/${id}`),
  replyTicket: (id, data) => api.post(`/support/tickets/${id}/messages`, data),
  updateStatus: (id, data) => api.put(`/support/tickets/${id}/status`, data),
  // Admin
  adminGetTickets: (params) => api.get('/support/admin/tickets', { params }),
  adminGetStats: () => api.get('/support/admin/stats'),
  adminReplyTicket: (id, data) => api.post(`/support/admin/tickets/${id}/reply`, data),
  adminUpdateStatus: (id, data) => api.put(`/support/admin/tickets/${id}/status`, data),
};

// ─── Blog ─────────────────────────────────────────────────────────
export const blogApi = {
  listPosts:          (params)   => api.get('/blog', { params }),
  getCategories:      ()         => api.get('/blog/categories'),
  getPost:            (slug)     => api.get(`/blog/${slug}`),
  // Admin — names match AdminBlogManager usage
  adminList:          (params)   => api.get('/blog/admin/all', { params }),
  adminGetAll:        ()         => api.get('/blog/admin/all'),
  adminGet:           (id)       => api.get(`/blog/admin/${id}`),
  adminGetPost:       (id)       => api.get(`/blog/admin/${id}`),
  adminCreate:        (data)     => api.post('/blog/admin', data),
  adminUpdate:        (id, data) => api.put(`/blog/admin/${id}`, data),
  adminDelete:        (id)       => api.delete(`/blog/admin/${id}`),
  adminSetStatus:     (id, data) => api.put(`/blog/admin/${id}`, data),
  adminToggleFeatured:(id, data) => api.put(`/blog/admin/${id}`, data),
};
