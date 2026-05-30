// tests/mocks.js — shared mock helpers for all test files
'use strict';

// ── Supabase mock ────────────────────────────────────────────────────────────
const makeChain = (returnValue) => {
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    upsert: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    gt: () => chain,
    gte: () => chain,
    lte: () => chain,
    lt: () => chain,
    ilike: () => chain,
    or: () => chain,
    not: () => chain,
    filter: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    maybeSingle: async () => returnValue,
    single: async () => returnValue,
    then: (resolve) => Promise.resolve(returnValue).then(resolve),
  };
  return chain;
};

const createSupabaseMock = (overrides = {}) => ({
  from: (table) => {
    const tableOverride = overrides[table];
    const defaultReturn = { data: null, error: null };
    return makeChain(tableOverride !== undefined ? tableOverride : defaultReturn);
  },
  rpc: async () => ({ data: null, error: null }),
  ...overrides.__root,
});

// ── JWT mock ─────────────────────────────────────────────────────────────────
const createJwtMock = () => {
  const tokens = new Map();
  return {
    sign: (payload, secret, options) => {
      const token = `mock-token-${JSON.stringify(payload)}-${Date.now()}`;
      tokens.set(token, { payload, exp: Date.now() + 7 * 86400000 });
      return token;
    },
    verify: (token, secret) => {
      const entry = tokens.get(token);
      if (!entry) throw new Error('invalid signature');
      if (entry.exp < Date.now()) throw new Error('jwt expired');
      return entry.payload;
    },
    decode: (token) => tokens.get(token)?.payload || null,
    _getTokens: () => tokens,
    _setToken: (token, payload, exp) => tokens.set(token, { payload, exp: exp || Date.now() + 86400000 }),
  };
};

// ── bcrypt mock ───────────────────────────────────────────────────────────────
const createBcryptMock = () => ({
  hash: async (password, rounds) => `hashed:${password}:${rounds}`,
  compare: async (plain, hashed) => hashed === `hashed:${plain}:12`,
});

// ── Email mock ────────────────────────────────────────────────────────────────
const createEmailMock = () => {
  const sent = [];
  return {
    sendEmail: async ({ to, template, data }) => {
      sent.push({ to, template, data, sentAt: new Date() });
      return { success: true, id: `mock-email-${sent.length}` };
    },
    getSent: () => sent,
    clear: () => { sent.length = 0; },
  };
};

// ── Axios mock ────────────────────────────────────────────────────────────────
const createAxiosMock = (responses = {}) => ({
  post: async (url, body) => {
    const key = Object.keys(responses).find(k => url.includes(k));
    if (key) return { data: responses[key] };
    return { data: { status: true, data: { reference: 'mock-ref-123', access_code: 'mock-access-code' } } };
  },
  get: async (url) => {
    const key = Object.keys(responses).find(k => url.includes(k));
    if (key) return { data: responses[key] };
    if (url.includes('verify')) {
      return {
        data: {
          status: true,
          data: {
            status: 'success',
            amount: 150000,
            reference: 'mock-ref-123',
            metadata: { type: 'card_purchase', plan_type: 'single', user_id: 'mock-user-id' },
          },
        },
      };
    }
    return { data: {} };
  },
});

// ── Request/Response helpers ──────────────────────────────────────────────────
const makeReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  company: null,
  member: null,
  file: null,
  ...overrides,
});

const makeRes = () => {
  const res = { _status: 200, _json: null, _sent: false };
  res.status = (code) => { res._status = code; return res; };
  res.json   = (data) => { res._json = data; res._sent = true; return res; };
  res.send   = (data) => { res._json = data; res._sent = true; return res; };
  res.setHeader = () => res;
  return res;
};

// ── Fixtures ─────────────────────────────────────────────────────────────────
const FIXTURES = {
  user: {
    id: 'user-uuid-001',
    email: 'amaka@test.com',
    full_name: 'Amaka Okafor',
    password_hash: 'hashed:password123:12',
    role: 'user',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  adminUser: {
    id: 'user-uuid-admin',
    email: 'admin@test.com',
    full_name: 'Admin User',
    role: 'admin',
    password_hash: 'hashed:adminpass:12',
  },
  company: {
    id: 'company-uuid-001',
    name: 'Zenith Tech Ltd',
    email: 'hr@zenithtech.com',
    contact_person: 'Tunde Bello',
    phone: '+2348012345678',
    industry: 'Technology',
    role: 'company',
    password_hash: 'hashed:companypass:12',
  },
  member: {
    id: 'member-uuid-001',
    company_id: 'company-uuid-001',
    first_name: 'Kemi',
    last_name: 'Adeyemi',
    email: 'kemi@zenithtech.com',
    role: 'team_member',
    department: 'Engineering',
    status: 'approved',
    password_hash: 'hashed:memberpass:12',
  },
  leader: {
    id: 'leader-uuid-001',
    company_id: 'company-uuid-001',
    first_name: 'Emeka',
    last_name: 'Eze',
    email: 'emeka@zenithtech.com',
    role: 'team_leader',
    department: 'Engineering',
    status: 'approved',
    password_hash: 'hashed:leaderpass:12',
  },
  card: {
    id: 'card-uuid-001',
    slug: 'amaka-birthday-abc123',
    creator_id: 'user-uuid-001',
    recipient_name: 'Amaka Okafor',
    recipient_email: 'amaka@example.com',
    occasion: 'birthday',
    title: "Happy Birthday, Amaka!",
    design_theme: 'rose_love',
    background_color: '#FBEAF0',
    status: 'active',
    is_gift_enabled: true,
    total_collected: 0,
    access_token: 'access-token-abc123',
    allow_private_messages: true,
  },
  wallet: {
    id: 'wallet-uuid-001',
    card_id: 'card-uuid-001',
    company_id: 'company-uuid-001',
    total_contributed: 100000,
    platform_fee: 20000,
    net_after_fee: 80000,
    total_deducted: 0,
    amount_to_celebrant: 80000,
    disbursed: false,
  },
  occasionType: {
    id: 'ot-uuid-001',
    company_id: 'company-uuid-001',
    name: 'birthday',
    label: 'Birthday',
    icon: '🎂',
    notify_days_before: 2,
    gender_filter: null,
    default_scope: 'department',
    is_system: true,
    is_active: true,
  },
  subscription: {
    id: 'sub-uuid-001',
    company_id: 'company-uuid-001',
    plan: 'monthly',
    status: 'active',
    amount: 20000,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
};

module.exports = {
  makeChain,
  createSupabaseMock,
  createJwtMock,
  createBcryptMock,
  createEmailMock,
  createAxiosMock,
  makeReq,
  makeRes,
  FIXTURES,
};
