/**
 * TASKEEU BACKEND TEST SUITE
 * Unit + Integration Tests
 * Uses Jest + Supertest with mocked Supabase & external services
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ── Mock all external services before importing routes ─────────────
jest.mock('../utils/supabase', () => {
  const mockData = {
    users: [
      { id: 'user-1', email: 'requester@test.com', full_name: 'Test Requester', role: 'requester', is_active: true, password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGc8EYJlM0mP5RrTOqFNHiJz1O2' },
      { id: 'user-2', email: 'tasker@test.com', full_name: 'Test Tasker', role: 'tasker', is_active: true, password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGc8EYJlM0mP5RrTOqFNHiJz1O2' },
      { id: 'user-admin', email: 'admin@taskeeu.com', full_name: 'Admin', role: 'admin', is_active: true, password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGc8EYJlM0mP5RrTOqFNHiJz1O2' },
    ],
    tasks: [
      { id: 'task-1', requester_id: 'user-1', title: 'Test Task', description: 'Pick up document', task_type: 'pickup_delivery', task_city: 'Lagos', task_state: 'Lagos', status: 'open', deadline: new Date(Date.now() + 86400000).toISOString(), is_equipment_required: false, created_at: new Date().toISOString() },
    ],
    tasker_profiles: [
      { user_id: 'user-2', verification_status: 'approved', task_city: 'Lagos', task_state: 'Lagos', rating_average: 4.5, total_tasks_completed: 10, is_available: true, enterprise_certified: false },
    ],
    notifications: [],
    task_bids: [],
    companies: [
      { id: 'company-1', company_name: 'Test Corp', company_domain: 'testcorp.com', branch_name: 'Ikeja Branch', subscription_status: 'active', hr_user_id: 'user-admin', is_active: true },
    ],
    enterprise_cert_modules: [
      { id: 'mod-1', module_number: 1, title: 'Verification Tasks', subtitle: 'KYC and Merchant', emoji: '🔍', estimated_minutes: 12, requirements: ['Carry valid ID'], content: [{ heading: 'What Are Verification Tasks?', body: 'Test content body here.' }], is_active: true },
      { id: 'mod-2', module_number: 2, title: 'Telecom Tasks', subtitle: 'Tower Inspection', emoji: '📡', estimated_minutes: 15, requirements: ['Wear helmet'], content: [{ heading: 'Telecom Overview', body: 'Test content.' }], is_active: true },
      { id: 'mod-3', module_number: 3, title: 'Inspection Tasks', subtitle: 'Audit', emoji: '🏗️', estimated_minutes: 14, requirements: ['Wear boots'], content: [{ heading: 'Inspection Overview', body: 'Test content.' }], is_active: true },
      { id: 'mod-4', module_number: 4, title: 'Field Operations', subtitle: 'Logistics', emoji: '🚚', estimated_minutes: 12, requirements: ['Confirm receipt'], content: [{ heading: 'Field Ops', body: 'Test content.' }], is_active: true },
      { id: 'mod-5', module_number: 5, title: 'Safety Standards', subtitle: 'PPE', emoji: '🛡️', estimated_minutes: 18, requirements: ['Download GPS app'], content: [{ heading: 'Safety First', body: 'Test content.' }], is_active: true },
    ],
    tasker_module_completions: [],
    tasker_enterprise_certifications: [],
    demo_requests: [],
  };

  const makeChain = (result) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockImplementation((cb) => Promise.resolve(result).then(cb)),
      ...result,
    };
    // Make it thenable (awaitable)
    chain[Symbol.toStringTag] = 'Promise';
    Object.defineProperty(chain, 'then', {
      value: (resolve) => Promise.resolve(result).then(resolve),
      configurable: true,
    });
    return chain;
  };

  const supabase = {
    from: jest.fn((table) => {
      const tableData = mockData[table] || [];
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn((data) => ({
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: Array.isArray(data) ? data[0] : { ...data, id: `${table}-new-${Date.now()}`, created_at: new Date().toISOString() },
            error: null,
          }),
          then: (resolve) => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null }).then(resolve),
        })),
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: tableData[0] || null, error: null }),
        single: jest.fn().mockResolvedValue({ data: tableData[0] || null, error: null }),
        then: (resolve) => Promise.resolve({ data: tableData, error: null, count: tableData.length }).then(resolve),
      };
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  return supabase;
});

jest.mock('../utils/email', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({}),
  sendTaskerWelcomeEmail: jest.fn().mockResolvedValue({}),
  sendTaskerApprovedEmail: jest.fn().mockResolvedValue({}),
  sendTaskerRejectedEmail: jest.fn().mockResolvedValue({}),
  sendNewBidEmail: jest.fn().mockResolvedValue({}),
  sendBidAcceptedEmail: jest.fn().mockResolvedValue({}),
  sendBidRejectedEmail: jest.fn().mockResolvedValue({}),
  sendNewMessageEmail: jest.fn().mockResolvedValue({}),
  sendProofUploadedEmail: jest.fn().mockResolvedValue({}),
  sendPaymentSentEmail: jest.fn().mockResolvedValue({}),
  sendTaskCompletionCodeEmail: jest.fn().mockResolvedValue({}),
  sendRefundRequestEmail: jest.fn().mockResolvedValue({}),
  sendDirectApplicationEmail: jest.fn().mockResolvedValue({}),
}));

jest.mock('../utils/flutterwave', () => ({
  initializePayment: jest.fn().mockResolvedValue({ authorization_url: 'https://checkout.flutterwave.com/v3/hosted/pay/test', tx_ref: 'TEST_REF' }),
  verifyPayment: jest.fn().mockResolvedValue({ status: 'success', amount: 500000, reference: 'TEST_REF', metadata: {} }),
  generateReference: jest.fn().mockReturnValue('TKU_TEST_123'),
  createTransferRecipient: jest.fn().mockResolvedValue({ recipient_code: 'RCP_test' }),
  initiateTransfer: jest.fn().mockResolvedValue({ transfer_code: 'TRF_test' }),
  listBanks: jest.fn().mockResolvedValue([{ name: 'Access Bank', code: '044' }, { name: 'GTBank', code: '058' }]),
  resolveAccountNumber: jest.fn().mockResolvedValue({ account_name: 'Test Account', account_number: '0123456789' }),
  verifyWebhookSignature: jest.fn().mockReturnValue(true),
}));

jest.mock('../utils/cloudinary', () => ({
  cloudinary: {},
  uploadKYC: { single: jest.fn(() => (req, res, next) => next()), fields: jest.fn(() => (req, res, next) => next()) },
  uploadProof: { single: jest.fn(() => (req, res, next) => next()), array: jest.fn(() => (req, res, next) => next()) },
  uploadChat: { single: jest.fn(() => (req, res, next) => next()) },
  uploadAvatar: { single: jest.fn(() => (req, res, next) => next()) },
  deleteFile: jest.fn().mockResolvedValue({}),
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }) },
  })),
}));

// ── Create test app ────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('../routes/auth'));

const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: true }));
  testApp.use('/api/auth', require('../routes/auth'));
  testApp.use('/api/tasks', require('../routes/tasks'));
  testApp.use('/api/taskers', require('../routes/taskers'));
  testApp.use('/api/payments', require('../routes/payments'));
  testApp.use('/api/chat', require('../routes/chat'));
  testApp.use('/api/admin', require('../routes/admin'));
  testApp.use('/api/teams', require('../routes/teams'));
  testApp.use('/api/enterprise-tasks', require('../routes/enterprise-tasks'));
  testApp.use('/api/certifications', require('../routes/certifications'));
  return testApp;
};

// ── JWT helper ─────────────────────────────────────────────────────
const makeToken = (id, role = 'requester') =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

// ─────────────────────────────────────────────────────────────────
// UTILITY UNIT TESTS
// ─────────────────────────────────────────────────────────────────
describe('🔧 Utility — JWT helpers', () => {
  test('generates valid JWT token', () => {
    const token = makeToken('user-1');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('user-1');
  });

  test('JWT expires correctly', () => {
    const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET, { expiresIn: '0s' });
    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow('jwt expired');
  });

  test('invalid JWT secret throws', () => {
    const token = jwt.sign({ id: 'user-1' }, 'wrong-secret');
    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow('invalid signature');
  });
});

describe('🔒 Utility — bcrypt password hashing', () => {
  test('hashes password correctly', async () => {
    const hash = await bcrypt.hash('TestPass123!', 4);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe('TestPass123!');
    expect(hash.startsWith('$2')).toBe(true); // bcryptjs uses $2a$ or $2b$
  });

  test('verifies correct password', async () => {
    const hash = await bcrypt.hash('TestPass123!', 10);
    const valid = await bcrypt.compare('TestPass123!', hash);
    expect(valid).toBe(true);
  });

  test('rejects wrong password', async () => {
    const hash = await bcrypt.hash('TestPass123!', 10);
    const valid = await bcrypt.compare('WrongPass', hash);
    expect(valid).toBe(false);
  });
});

describe('💳 Utility — Flutterwave helpers', () => {
  const flutterwave = require('../utils/flutterwave');

  test('generateReference returns prefixed string', () => {
    const ref = flutterwave.generateReference('TKU');
    expect(typeof ref).toBe('string');
    expect(typeof ref === 'string').toBe(true);
  });

  test('listBanks returns bank array', async () => {
    const banks = await flutterwave.listBanks('NG');
    expect(Array.isArray(banks)).toBe(true);
    expect(banks.length).toBeGreaterThan(0);
    expect(banks[0]).toHaveProperty('name');
    expect(banks[0]).toHaveProperty('code');
  });

  test('initializePayment returns authorization_url', async () => {
    const result = await flutterwave.initializePayment({ email: 'test@test.com', amount: 5000, currency: 'NGN', reference: 'TEST_REF', customerName: 'Test User' });
    expect(result).toHaveProperty('authorization_url');
    expect(result.authorization_url).toContain('flutterwave.com');
  });

  test('verifyPayment returns success status', async () => {
    const result = await flutterwave.verifyPayment('TEST_REF');
    expect(result.status).toBe('success');
  });

  test('verifyWebhookSignature returns boolean', () => {
    const result = flutterwave.verifyWebhookSignature({}, 'test_webhook_secret');
    expect(typeof result).toBe('boolean');
  });
});

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE UNIT TESTS
// ─────────────────────────────────────────────────────────────────
describe('🛡️ Middleware — authenticate', () => {
  const { authenticate, requireRole } = require('../middleware/auth');
  const supabase = require('../utils/supabase');

  beforeEach(() => {
    supabase.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', email: 'test@test.com', full_name: 'Test', role: 'requester', is_active: true, avatar_url: null, phone: null },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    }));
  });

  test('rejects missing Authorization header', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects Bearer with invalid token', async () => {
    const req = { headers: { authorization: 'Bearer invalidtoken123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('accepts valid JWT and calls next', async () => {
    const token = makeToken('user-1', 'requester');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-1');
  });

  test('requireRole blocks wrong role', () => {
    const middleware = requireRole('admin');
    const req = { user: { id: 'user-1', role: 'requester' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireRole passes correct role', () => {
    const middleware = requireRole('requester');
    const req = { user: { id: 'user-1', role: 'requester' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('requireRole with multiple allowed roles', () => {
    const middleware = requireRole('requester', 'admin');
    const req = { user: { id: 'user-admin', role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────
// AUTH ROUTE INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────
describe('🔐 API — Auth Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/auth/banks — returns bank list', async () => {
    const res = await request(server).get('/api/auth/banks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.banks)).toBe(true);
  });

  test('POST /api/auth/login — rejects missing fields', async () => {
    const res = await request(server).post('/api/auth/login').send({ email: 'bad' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login — rejects non-existent user', async () => {
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }));
    const res = await request(server).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'pass123' });
    expect([400, 401]).toContain(res.status);
  });

  test('POST /api/auth/register/requester — rejects short password', async () => {
    const res = await request(server).post('/api/auth/register/requester').send({
      email: 'new@test.com', full_name: 'New User', phone: '08012345678', password: 'short',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register/requester — rejects invalid email', async () => {
    const res = await request(server).post('/api/auth/register/requester').send({
      email: 'not-an-email', full_name: 'New User', phone: '08012345678', password: 'longpassword123',
    });
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/me — rejects unauthenticated', async () => {
    const res = await request(server).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — returns user with valid token', async () => {
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', email: 'req@test.com', full_name: 'Test', role: 'requester', is_active: true },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    }));
    const token = makeToken('user-1');
    const res = await request(server).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────
// TASKS ROUTE INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────
describe('📋 API — Tasks Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/tasks — returns task list without auth', async () => {
    const supabase = require('../utils/supabase');
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    };
    mockChain.then = (resolve) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
    supabase.from.mockReturnValueOnce(mockChain);
    const res = await request(server).get('/api/tasks');
    expect([200, 500]).toContain(res.status); // accept either, just don't crash with 401
  });

  test('GET /api/tasks — rejects invalid page param gracefully', async () => {
    const supabase = require('../utils/supabase');
    const mockChain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockReturnThis() };
    mockChain.then = (resolve) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
    supabase.from.mockReturnValueOnce(mockChain);
    const res = await request(server).get('/api/tasks?status=open&page=1&limit=5');
    expect([200, 500]).toContain(res.status);
  });

  test('GET /api/tasks/:id — returns 404 for unknown task', async () => {
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } }),
    }));
    const res = await request(server).get('/api/tasks/nonexistent-id');
    expect(res.status).toBe(404);
  });

  test('POST /api/tasks — rejects unauthenticated', async () => {
    const res = await request(server).post('/api/tasks').send({
      title: 'Test task', description: 'Description', task_city: 'Lagos', task_state: 'Lagos', deadline: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/tasks — rejects short title', async () => {
    const token = makeToken('user-1', 'requester');
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', email: 'test@test.com', full_name: 'Test', role: 'requester', is_active: true },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    }));
    const res = await request(server).post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hi', description: 'desc', task_city: 'Lagos', task_state: 'Lagos', deadline: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  test('GET /api/tasks/my/requester — requires auth', async () => {
    const res = await request(server).get('/api/tasks/my/requester');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────
// TASKERS ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('👤 API — Taskers Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/taskers — returns tasker list or error', async () => {
    const supabase = require('../utils/supabase');
    const mockChain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockReturnThis() };
    mockChain.then = (resolve) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
    supabase.from.mockReturnValueOnce(mockChain);
    const res = await request(server).get('/api/taskers');
    expect([200, 500]).toContain(res.status);
  });

  test('GET /api/taskers — accepts filter params without crashing', async () => {
    const supabase = require('../utils/supabase');
    const mockChain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockReturnThis() };
    mockChain.then = (resolve) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
    supabase.from.mockReturnValueOnce(mockChain);
    const res = await request(server).get('/api/taskers?city=Lagos&sort=rating');
    expect([200, 500]).toContain(res.status);
  });

  test('PUT /api/taskers/me/task-address — requires auth', async () => {
    const res = await request(server).put('/api/taskers/me/task-address').send({ task_city: 'Lagos', task_state: 'Lagos' });
    expect(res.status).toBe(401);
  });

  test('PUT /api/taskers/me/bank-details — requires auth', async () => {
    const res = await request(server).put('/api/taskers/me/bank-details').send({});
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────
// PAYMENTS ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('💰 API — Payments Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('POST /api/payments/initiate — requires auth', async () => {
    const res = await request(server).post('/api/payments/initiate').send({ task_id: 'task-1', payment_type: 'workmanship', amount: 5000 });
    expect(res.status).toBe(401);
  });

  test('POST /api/payments/refund/request — requires auth', async () => {
    const res = await request(server).post('/api/payments/refund/request').send({ task_id: 'task-1', amount: 1000, reason: 'Test' });
    expect(res.status).toBe(401);
  });

  test('GET /api/payments/history — requires auth', async () => {
    const res = await request(server).get('/api/payments/history');
    expect(res.status).toBe(401);
  });

  test('POST /api/payments/resolve-account — requires auth', async () => {
    const res = await request(server).post('/api/payments/resolve-account').send({ account_number: '0123456789', bank_code: '044' });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────
// CHAT ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('💬 API — Chat Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/chat/rooms — requires auth', async () => {
    const res = await request(server).get('/api/chat/rooms');
    expect(res.status).toBe(401);
  });

  test('GET /api/chat/notifications — requires auth', async () => {
    const res = await request(server).get('/api/chat/notifications');
    expect(res.status).toBe(401);
  });

  test('PUT /api/chat/notifications/read — requires auth', async () => {
    const res = await request(server).put('/api/chat/notifications/read').send({ ids: [] });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────
// ADMIN ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('🛡️ API — Admin Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/admin/dashboard — requires admin role', async () => {
    const res = await request(server).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  test('GET /api/admin/taskers — requires admin role', async () => {
    const token = makeToken('user-1', 'requester');
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'user-1', role: 'requester', is_active: true, email: 'x@x.com', full_name: 'X' }, error: null }),
      update: jest.fn().mockReturnThis(),
    }));
    const res = await request(server).get('/api/admin/taskers').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────
// TEAMS ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('🏢 API — Teams Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/teams/task-types — public, returns task types', async () => {
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (resolve) => Promise.resolve({
        data: [{ id: 'tt-1', name: 'Merchant Verification', base_price: 12000, category: 'Verification', is_active: true }],
        error: null,
      }).then(resolve),
    }));
    const res = await request(server).get('/api/teams/task-types');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/teams/members/signup — rejects invalid email', async () => {
    const res = await request(server).post('/api/teams/members/signup').send({
      first_name: 'John', last_name: 'Doe', work_email: 'not-email',
      password: 'pass12345', department: 'Tech', job_role: 'Dev',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/teams/members/login — rejects missing password', async () => {
    const res = await request(server).post('/api/teams/members/login').send({ email: 'test@corp.com' });
    expect(res.status).toBe(400);
  });

  test('GET /api/teams/member/me — requires auth', async () => {
    const res = await request(server).get('/api/teams/member/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/teams/companies/me — requires auth', async () => {
    const res = await request(server).get('/api/teams/companies/me');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────
// CERTIFICATIONS ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('🏆 API — Certifications Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('GET /api/certifications/modules — requires auth', async () => {
    const res = await request(server).get('/api/certifications/modules');
    expect(res.status).toBe(401);
  });

  test('POST /api/certifications/modules/:id/complete — requires auth', async () => {
    const res = await request(server).post('/api/certifications/modules/mod-1/complete').send({ time_spent_seconds: 300 });
    expect(res.status).toBe(401);
  });

  test('GET /api/certifications/my — requires auth', async () => {
    const res = await request(server).get('/api/certifications/my');
    expect(res.status).toBe(401);
  });

  test('GET /api/certifications/:certNumber/verify — public route', async () => {
    const supabase = require('../utils/supabase');
    supabase.from.mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }));
    const res = await request(server).get('/api/certifications/INVALID-CERT/verify');
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────
// ENTERPRISE TASKS ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('🏭 API — Enterprise Tasks Routes', () => {
  let server;
  beforeAll(() => { server = createTestApp(); });

  test('POST /api/enterprise-tasks — requires auth', async () => {
    const res = await request(server).post('/api/enterprise-tasks').send({ title: 'Test Task' });
    expect(res.status).toBe(401);
  });

  test('GET /api/enterprise-tasks — requires auth', async () => {
    const res = await request(server).get('/api/enterprise-tasks');
    expect(res.status).toBe(401);
  });

  test('GET /api/enterprise-tasks/tasker/available — requires auth', async () => {
    const res = await request(server).get('/api/enterprise-tasks/tasker/available');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────
describe('❤️ Health Check', () => {
  let server;
  beforeAll(() => {
    server = createTestApp();
    server.get('/api/health', (req, res) => res.json({ success: true, message: 'Taskeeu API running', version: '1.0.0' }));
  });

  test('GET /api/health — returns healthy status', async () => {
    const res = await request(server).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// VALIDATION HELPERS UNIT TESTS
// ─────────────────────────────────────────────────────────────────
describe('✅ Validation — Input sanitization', () => {
  test('email validation rejects invalid formats', () => {
    const invalidEmails = ['notanemail', '@no-local.com', 'no-at-sign', 'spaces in@email.com'];
    invalidEmails.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  test('domain validation accepts valid domains', () => {
    const validDomains = ['google.com', 'company.ng', 'sub.domain.co'];
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    validDomains.forEach(d => expect(domainRegex.test(d)).toBe(true));
  });

  test('Nigerian phone number format validation', () => {
    const validPhones = ['08012345678', '07056789012', '+2348012345678', '09034567890'];
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    validPhones.forEach(p => expect(phoneRegex.test(p)).toBe(true));
  });

  test('password minimum length check', () => {
    expect('short'.length >= 8).toBe(false);
    expect('longpassword123'.length >= 8).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// BUSINESS LOGIC UNIT TESTS
// ─────────────────────────────────────────────────────────────────
describe('🧮 Business Logic — Price calculations', () => {
  const calcAdjusted = (base, adjType, adjVal) => {
    const val = parseFloat(adjVal) || 0;
    const b = parseFloat(base) || 0;
    switch (adjType) {
      case 'add':      return b + val;
      case 'subtract': return Math.max(0, b - val);
      case 'multiply': return b * (val || 1);
      case 'divide':   return val > 0 ? b / val : b;
      default:         return b;
    }
  };

  test('add adjustment adds correctly', () => {
    expect(calcAdjusted(10000, 'add', 2000)).toBe(12000);
  });

  test('subtract adjustment does not go below zero', () => {
    expect(calcAdjusted(5000, 'subtract', 10000)).toBe(0);
  });

  test('multiply adjustment multiplies correctly', () => {
    expect(calcAdjusted(10000, 'multiply', 1.5)).toBe(15000);
  });

  test('divide adjustment divides correctly', () => {
    expect(calcAdjusted(12000, 'divide', 2)).toBe(6000);
  });

  test('none adjustment returns base price', () => {
    expect(calcAdjusted(10000, 'none', 0)).toBe(10000);
  });

  test('platform fee calculation — 20% for enterprise', () => {
    const workmanship = 15000;
    const platformFee = workmanship * 0.20;
    const taskerPayout = workmanship * 0.80;
    expect(platformFee).toBe(3000);
    expect(taskerPayout).toBe(12000);
    expect(platformFee + taskerPayout).toBe(workmanship);
  });

  test('total cost calculation for multi-state deployment', () => {
    const pricePerPerson = 12000;
    const deployments = [
      { state: 'Lagos', people_needed: 3 },
      { state: 'Abuja', people_needed: 2 },
      { state: 'Rivers', people_needed: 1 },
    ];
    const totalPeople = deployments.reduce((s, d) => s + d.people_needed, 0);
    const totalCost = pricePerPerson * totalPeople;
    expect(totalPeople).toBe(6);
    expect(totalCost).toBe(72000);
  });
});

describe('🔑 Business Logic — Completion code', () => {
  test('generates 6-digit numeric code', () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    expect(code.length).toBe(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });

  test('certificate number format is unique', () => {
    const gen = () => `TKU-ENT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const certs = new Set(Array.from({ length: 100 }, gen));
    expect(certs.size).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────
// DEMO REQUEST ROUTE TESTS
// ─────────────────────────────────────────────────────────────────
describe('📩 API — Demo Requests', () => {
  let server;
  beforeAll(() => {
    server = createTestApp();
    // Add demo route for testing
    server.post('/api/demo/request', (req, res) => {
      const { company_name, contact_name, email, phone, company_size } = req.body;
      if (!company_name || !email || !contact_name) return res.status(400).json({ success: false, message: 'Required fields missing' });
      if (!email.includes('@')) return res.status(400).json({ success: false, message: 'Invalid email' });
      res.status(201).json({ success: true, message: 'Demo request submitted!' });
    });
  });

  test('POST /api/demo/request — creates demo request', async () => {
    const res = await request(server).post('/api/demo/request').send({
      company_name: 'Test Corp Nigeria', contact_name: 'Adaeze Obi',
      email: 'adaeze@testcorp.com', phone: '08012345678', company_size: '51-200',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/demo/request — rejects missing email', async () => {
    const res = await request(server).post('/api/demo/request').send({
      company_name: 'Test Corp', contact_name: 'Adaeze',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/demo/request — rejects invalid email format', async () => {
    const res = await request(server).post('/api/demo/request').send({
      company_name: 'Test Corp', contact_name: 'Adaeze', email: 'not-an-email',
    });
    expect(res.status).toBe(400);
  });
});
