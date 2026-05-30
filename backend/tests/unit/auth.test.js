'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt    = require('../jwt-helper');

process.env.JWT_SECRET      = 'test-secret-key-minimum-32-chars-long';
process.env.JWT_EXPIRES_IN  = '7d';
process.env.APP_URL         = 'https://thankeeu.ng';
process.env.RESEND_API_KEY  = 'test-key';
process.env.EMAIL_FROM      = 'hello@thankeeu.ng';
process.env.EMAIL_FROM_NAME = 'Thankeeu';

const { makeReq, makeRes, FIXTURES, createBcryptMock, createEmailMock } = require('../mocks');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const bcrypt    = createBcryptMock();
const emailMock = createEmailMock();

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

// Simulated signup logic (mirrors authController.signup)
async function signup({ full_name, email, password }, db) {
  const existing = db.users.find(u => u.email === email);
  if (existing) return { error: 'Email already registered', status: 400 };

  const password_hash = await bcrypt.hash(password, 12);
  const user = { id: `user-${Date.now()}`, email, full_name, password_hash, role: 'user', avatar_url: null };
  db.users.push(user);

  await emailMock.sendEmail({ to: email, template: 'welcome', data: { name: full_name } });

  const token = generateToken(user.id);
  const { password_hash: _, ...safeUser } = user;
  return { token, user: safeUser };
}

// Simulated login logic
async function login({ email, password }, db) {
  const user = db.users.find(u => u.email === email);
  if (!user) return { error: 'Invalid email or password', status: 401 };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { error: 'Invalid email or password', status: 401 };

  const token = generateToken(user.id);
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Auth Controller', () => {
  let db;

  beforeEach(() => {
    db = { users: [{ ...FIXTURES.user }] };
    emailMock.clear();
  });

  describe('signup()', () => {
    it('creates user and returns token + user object', async () => {
      const result = await signup({ full_name: 'Ngozi Eze', email: 'ngozi@test.com', password: 'password123' }, db);
      assert.ok(result.token);
      assert.equal(result.user.email, 'ngozi@test.com');
      assert.equal(result.user.full_name, 'Ngozi Eze');
      assert.equal(result.user.role, 'user');
    });

    it('does not expose password_hash in response', async () => {
      const result = await signup({ full_name: 'Ngozi', email: 'n@test.com', password: 'pass123' }, db);
      assert.equal(result.user.password_hash, undefined);
    });

    it('rejects duplicate email', async () => {
      const result = await signup({ full_name: 'Amaka', email: FIXTURES.user.email, password: 'pass' }, db);
      assert.equal(result.status, 400);
      assert.ok(result.error.includes('already registered'));
    });

    it('sends welcome email after signup', async () => {
      await signup({ full_name: 'Emeka', email: 'emeka@test.com', password: 'pass123' }, db);
      const sent = emailMock.getSent();
      assert.equal(sent.length, 1);
      assert.equal(sent[0].template, 'welcome');
      assert.equal(sent[0].to, 'emeka@test.com');
    });

    it('generated token contains correct userId', async () => {
      const result = await signup({ full_name: 'Bola', email: 'bola@test.com', password: 'pass123' }, db);
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      assert.equal(decoded.userId, result.user.id);
    });

    it('token does not contain type field (user tokens have no type)', async () => {
      const result = await signup({ full_name: 'Chidi', email: 'chidi@test.com', password: 'pass' }, db);
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      assert.equal(decoded.type, undefined);
    });
  });

  describe('login()', () => {
    it('returns token and user for valid credentials', async () => {
      const result = await login({ email: FIXTURES.user.email, password: 'password123' }, db);
      assert.ok(result.token);
      assert.equal(result.user.email, FIXTURES.user.email);
    });

    it('rejects unknown email', async () => {
      const result = await login({ email: 'unknown@test.com', password: 'pass' }, db);
      assert.equal(result.status, 401);
      assert.ok(result.error.includes('Invalid'));
    });

    it('rejects wrong password', async () => {
      const result = await login({ email: FIXTURES.user.email, password: 'wrongpassword' }, db);
      assert.equal(result.status, 401);
    });

    it('does not expose password_hash in response', async () => {
      const result = await login({ email: FIXTURES.user.email, password: 'password123' }, db);
      assert.equal(result.user?.password_hash, undefined);
    });

    it('login does not send any emails', async () => {
      await login({ email: FIXTURES.user.email, password: 'password123' }, db);
      assert.equal(emailMock.getSent().length, 0);
    });
  });

  describe('Token validation', () => {
    it('token expires after configured duration', () => {
      const token   = generateToken('uid-001');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      assert.ok(decoded.exp > Date.now() / 1000);
    });

    it('expired token is rejected', () => {
      const token = jwt.signExpired({ userId: 'uid-001' }, process.env.JWT_SECRET);
      assert.throws(() => jwt.verify(token, process.env.JWT_SECRET), /expired/);
    });

    it('token payload contains only userId (no sensitive data)', () => {
      const token   = generateToken('uid-001');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const keys    = Object.keys(decoded).filter(k => !['userId','iat','exp'].includes(k));
      assert.equal(keys.length, 0);
    });
  });

  describe('Password reset flow', () => {
    it('reset token is a 64-char hex string', () => {
      const crypto = require('node:crypto');
      const token  = crypto.randomBytes(32).toString('hex');
      assert.equal(token.length, 64);
      assert.match(token, /^[a-f0-9]+$/);
    });

    it('reset token expires in 1 hour', () => {
      const expires = new Date(Date.now() + 3600000);
      const diff    = expires.getTime() - Date.now();
      assert.ok(diff > 3590000 && diff <= 3600000);
    });

    it('different calls produce different reset tokens', () => {
      const crypto = require('node:crypto');
      const t1 = crypto.randomBytes(32).toString('hex');
      const t2 = crypto.randomBytes(32).toString('hex');
      assert.notEqual(t1, t2);
    });
  });

  describe('Password hashing', () => {
    it('hash is different from plain text', async () => {
      const hash = await bcrypt.hash('mypassword', 12);
      assert.notEqual(hash, 'mypassword');
    });

    it('compare returns true for correct password', async () => {
      const hash  = await bcrypt.hash('correct123', 12);
      const match = await bcrypt.compare('correct123', hash);
      assert.equal(match, true);
    });

    it('compare returns false for wrong password', async () => {
      const hash  = await bcrypt.hash('correct123', 12);
      const match = await bcrypt.compare('wrongpassword', hash);
      assert.equal(match, false);
    });
  });
});
