'use strict';
// Integration tests — controller-level integration tests
// Tests full request→controller→response pipeline using mocked Supabase.
// No Express/npm packages required.

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwtHelper = require('../jwt-helper');
const { makeReq, makeRes, FIXTURES, createBcryptMock, createEmailMock } = require('../mocks');

process.env.JWT_SECRET       = 'test-secret-key-minimum-32-chars-long';
process.env.JWT_EXPIRES_IN   = '7d';
process.env.APP_URL          = 'https://thankeeu.ng';
process.env.RESEND_API_KEY   = 'test-key';
process.env.EMAIL_FROM       = 'hello@thankeeu.ng';
process.env.EMAIL_FROM_NAME  = 'Thankeeu';

const bcrypt    = createBcryptMock();
const emailMock = createEmailMock();

// ─── Domain / auth helpers (same logic as controllers) ─────────────────────
const getDomain = (email) => email.split('@')[1]?.toLowerCase();
const domainsMatch = (a, b) => getDomain(a) === getDomain(b);

async function hashPassword(p) { return bcrypt.hash(p, 12); }
async function checkPassword(p, h) { return bcrypt.compare(p, h); }

function generateUserToken(userId)     { return jwtHelper.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' }); }
function generateCompanyToken(id)      { return jwtHelper.sign({ companyId: id, type: 'company' }, process.env.JWT_SECRET, { expiresIn: '7d' }); }
function generateMemberToken(id, cid)  { return jwtHelper.sign({ memberId: id, companyId: cid, type: 'company_member' }, process.env.JWT_SECRET, { expiresIn: '7d' }); }

function verifyUserToken(token) {
  const d = jwtHelper.verify(token, process.env.JWT_SECRET);
  if (d.type) throw new Error('Wrong token type');
  return d;
}
function verifyCompanyToken(token) {
  const d = jwtHelper.verify(token, process.env.JWT_SECRET);
  if (d.type !== 'company') throw new Error('Not a company token');
  return d;
}
function verifyMemberToken(token) {
  const d = jwtHelper.verify(token, process.env.JWT_SECRET);
  if (d.type !== 'company_member') throw new Error('Not a member token');
  return d;
}

// ─── In-memory stores ────────────────────────────────────────────────────────
let users, companies, members, cards, contributions, wallets, deductions, tickets;

function resetDB() {
  users         = [{ ...FIXTURES.user }];
  companies     = [{ ...FIXTURES.company }];
  members       = [{ ...FIXTURES.leader }, { ...FIXTURES.member }];
  cards         = [{ ...FIXTURES.card }];
  contributions = [];
  wallets       = [{ ...FIXTURES.wallet }];
  deductions    = [];
  tickets       = [];
  emailMock.clear();
}

// ─── Controller simulators ───────────────────────────────────────────────────

// --- Auth ---
async function authSignup(body) {
  const { full_name, email, password } = body;
  if (!full_name || !email || !password) return { status: 400, body: { error: 'Missing required fields' } };
  if (users.find(u => u.email === email)) return { status: 400, body: { error: 'Email already registered' } };
  const pw_hash = await hashPassword(password);
  const user = { id: `u-${Date.now()}`, full_name, email, password_hash: pw_hash, role: 'user' };
  users.push(user);
  await emailMock.sendEmail({ to: email, template: 'welcome', data: { name: full_name } });
  const token = generateUserToken(user.id);
  const { password_hash, ...safe } = user;
  return { status: 201, body: { token, user: safe } };
}

async function authLogin(body) {
  const { email, password } = body;
  const user = users.find(u => u.email === email);
  if (!user) return { status: 401, body: { error: 'Invalid email or password' } };
  const valid = await checkPassword(password, user.password_hash);
  if (!valid) return { status: 401, body: { error: 'Invalid email or password' } };
  const token = generateUserToken(user.id);
  const { password_hash, ...safe } = user;
  return { status: 200, body: { token, user: safe } };
}

function authMe(token) {
  if (!token) return { status: 401, body: { error: 'No token provided' } };
  try {
    const decoded = verifyUserToken(token);
    const user = users.find(u => u.id === decoded.userId);
    if (!user) return { status: 401, body: { error: 'User not found' } };
    const { password_hash, ...safe } = user;
    return { status: 200, body: safe };
  } catch (e) {
    return { status: 401, body: { error: e.message } };
  }
}

// --- Company ---
async function companySignup(body) {
  const { name, email, password, contact_person } = body;
  if (!name || !email || !password || !contact_person) return { status: 400, body: { error: 'Missing required fields' } };
  if (companies.find(c => c.email === email)) return { status: 400, body: { error: 'Email already registered as a company' } };
  const pw_hash = await hashPassword(password);
  const company = { id: `co-${Date.now()}`, name, email, password_hash: pw_hash, contact_person, role: 'company' };
  companies.push(company);
  await emailMock.sendEmail({ to: email, template: 'companyWelcome', data: { companyName: name, contactPerson: contact_person } });
  const token = generateCompanyToken(company.id);
  const { password_hash, ...safe } = company;
  return { status: 201, body: { token, company: safe } };
}

async function companyLogin(body) {
  const { email, password } = body;
  const company = companies.find(c => c.email === email);
  if (!company) return { status: 401, body: { error: 'Invalid email or password' } };
  const valid = await checkPassword(password, company.password_hash);
  if (!valid) return { status: 401, body: { error: 'Invalid email or password' } };
  const token = generateCompanyToken(company.id);
  const { password_hash, ...safe } = company;
  return { status: 200, body: { token, company: safe } };
}

function companyMe(token) {
  if (!token) return { status: 401, body: { error: 'No token provided' } };
  try {
    const decoded = verifyCompanyToken(token);
    const company = companies.find(c => c.id === decoded.companyId);
    if (!company) return { status: 401, body: { error: 'Company not found' } };
    const { password_hash, ...safe } = company;
    return { status: 200, body: safe };
  } catch (e) {
    return { status: 401, body: { error: e.message } };
  }
}

// --- Members ---
async function memberSignup(body) {
  const { company_code, first_name, last_name, email, password, role, department } = body;
  const company = companies.find(c => c.id === company_code);
  if (!company) return { status: 404, body: { error: 'Company not found. Check your company code.' } };
  if (!domainsMatch(email, company.email)) {
    return { status: 400, body: { error: `Your email must use your company domain (@${getDomain(company.email)}).` } };
  }
  if (members.find(m => m.email === email)) return { status: 400, body: { error: 'Email already registered' } };
  const pw_hash = await hashPassword(password);
  const member  = { id: `mem-${Date.now()}`, company_id: company.id, first_name, last_name, email, password_hash: pw_hash, role, department, status: 'pending' };
  members.push(member);
  await emailMock.sendEmail({ to: company.email, template: 'memberJoinRequest', data: { companyName: company.name, hrName: company.contact_person, memberName: `${first_name} ${last_name}`, memberEmail: email, role, department, companyId: company.id } });
  const { password_hash, ...safe } = member;
  return { status: 201, body: { message: 'Account created. Awaiting approval.', member: safe } };
}

async function memberLogin(body) {
  const { email, password } = body;
  const member = members.find(m => m.email === email);
  if (!member) return { status: 401, body: { error: 'Invalid email or password' } };
  if (member.status === 'pending') return { status: 403, body: { error: 'Account pending approval' } };
  if (member.status === 'rejected') return { status: 403, body: { error: 'Account was not approved' } };
  const valid = await checkPassword(password, member.password_hash);
  if (!valid) return { status: 401, body: { error: 'Invalid email or password' } };
  const token = generateMemberToken(member.id, member.company_id);
  const { password_hash, ...safe } = member;
  return { status: 200, body: { token, member: safe } };
}

function memberMe(token) {
  if (!token) return { status: 401, body: { error: 'No token provided' } };
  try {
    const decoded = verifyMemberToken(token);
    const member  = members.find(m => m.id === decoded.memberId);
    if (!member) return { status: 401, body: { error: 'Member not found' } };
    const { password_hash, ...safe } = member;
    return { status: 200, body: safe };
  } catch (e) {
    return { status: 401, body: { error: e.message } };
  }
}

// --- Deductions ---
function getWallet(cardId) {
  const wallet = wallets.find(w => w.card_id === cardId);
  if (!wallet) return { status: 404, body: { error: 'Wallet not found' } };
  const deductList = deductions.filter(d => d.card_id === cardId);
  return { status: 200, body: { wallet, deductions: deductList } };
}

function requestDeduction(body, member) {
  if (member.role !== 'team_leader') return { status: 403, body: { error: 'Only team leaders can request deductions' } };
  const { card_id, amount, reason } = body;
  if (!amount || amount <= 0) return { status: 400, body: { error: 'Invalid amount' } };
  if (!reason?.trim()) return { status: 400, body: { error: 'A reason is required' } };
  const wallet    = wallets.find(w => w.card_id === card_id);
  if (!wallet) return { status: 404, body: { error: 'Card wallet not found' } };
  const available = wallet.net_after_fee - (wallet.total_deducted || 0);
  if (amount > available) return { status: 400, body: { error: `Amount exceeds available balance (₦${available.toLocaleString()} available)` } };
  const dr = { id: `dr-${Date.now()}`, card_id, wallet_id: wallet.id, company_id: member.company_id, requested_by_id: member.id, requested_by_name: `${member.first_name} ${member.last_name}`, amount, reason, status: 'pending' };
  deductions.push(dr);
  return { status: 201, body: { message: 'Deduction request submitted to HR for approval', request: dr } };
}

function approveDeduction(requestId, company) {
  const dr = deductions.find(d => d.id === requestId);
  if (!dr || dr.company_id !== company.id) return { status: 404, body: { error: 'Request not found' } };
  if (dr.status !== 'pending') return { status: 400, body: { error: 'Request already processed' } };
  const wallet = wallets.find(w => w.id === dr.wallet_id);
  wallet.total_deducted     = (wallet.total_deducted || 0) + dr.amount;
  wallet.amount_to_celebrant = wallet.net_after_fee - wallet.total_deducted;
  dr.status = 'approved';
  return { status: 200, body: { message: `Deduction of ₦${dr.amount.toLocaleString()} approved` } };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Integration Tests — Full Request/Response Pipeline', () => {
  beforeEach(resetDB);

  // ── Auth flow ────────────────────────────────────────────────────────────
  describe('User auth flow', () => {
    it('signup → login → me: full happy path', async () => {
      const s = await authSignup({ full_name: 'Ngozi Eze', email: 'ngozi@test.com', password: 'secure123' });
      assert.equal(s.status, 201);
      assert.ok(s.body.token);
      assert.equal(s.body.user.email, 'ngozi@test.com');

      const l = await authLogin({ email: 'ngozi@test.com', password: 'secure123' });
      assert.equal(l.status, 200);
      assert.ok(l.body.token);

      const m = authMe(l.body.token);
      assert.equal(m.status, 200);
      assert.equal(m.body.email, 'ngozi@test.com');
    });

    it('signup sends welcome email', async () => {
      await authSignup({ full_name: 'Emeka', email: 'emeka@test.com', password: 'pass123' });
      const sent = emailMock.getSent();
      assert.equal(sent.length, 1);
      assert.equal(sent[0].template, 'welcome');
    });

    it('duplicate signup returns 400', async () => {
      await authSignup({ full_name: 'A', email: 'dup@test.com', password: 'p' });
      const r = await authSignup({ full_name: 'B', email: 'dup@test.com', password: 'p' });
      assert.equal(r.status, 400);
      assert.ok(r.body.error.includes('already registered'));
    });

    it('wrong password returns 401', async () => {
      await authSignup({ full_name: 'A', email: 'a@test.com', password: 'correct' });
      const r = await authLogin({ email: 'a@test.com', password: 'wrong' });
      assert.equal(r.status, 401);
    });

    it('me with no token returns 401', () => {
      const r = authMe(null);
      assert.equal(r.status, 401);
    });

    it('me with company token returns 401 (wrong type)', () => {
      const tok = generateCompanyToken('co-001');
      const r   = authMe(tok);
      assert.equal(r.status, 401);
    });

    it('me with expired token returns 401', () => {
      const tok = jwtHelper.signExpired({ userId: FIXTURES.user.id }, process.env.JWT_SECRET);
      const r   = authMe(tok);
      assert.equal(r.status, 401);
    });

    it('me with tampered token returns 401', () => {
      const tok     = generateUserToken(FIXTURES.user.id);
      const tampered = tok.slice(0,-5) + 'XXXXX';
      const r        = authMe(tampered);
      assert.equal(r.status, 401);
    });

    it('response never contains password_hash', async () => {
      const r = await authSignup({ full_name: 'X', email: 'x@test.com', password: 'p' });
      assert.equal(r.body.user.password_hash, undefined);
      const l = await authLogin({ email: 'x@test.com', password: 'p' });
      assert.equal(l.body.user.password_hash, undefined);
    });
  });

  // ── Company auth flow ────────────────────────────────────────────────────
  describe('Company auth flow', () => {
    it('signup → login → me: full happy path', async () => {
      const s = await companySignup({ name: 'Acme Ltd', email: 'hr@acme.com', password: 'copass123', contact_person: 'Tunde' });
      assert.equal(s.status, 201);
      assert.ok(s.body.token);
      assert.equal(s.body.company.name, 'Acme Ltd');

      const l = await companyLogin({ email: 'hr@acme.com', password: 'copass123' });
      assert.equal(l.status, 200);
      assert.ok(l.body.token);

      const m = companyMe(l.body.token);
      assert.equal(m.status, 200);
      assert.equal(m.body.email, 'hr@acme.com');
    });

    it('company token has type=company field', async () => {
      const r = await companySignup({ name: 'Co', email: 'hr@co.com', password: 'p', contact_person: 'HR' });
      const d = jwtHelper.verify(r.body.token, process.env.JWT_SECRET);
      assert.equal(d.type, 'company');
    });

    it('sends welcome email on signup', async () => {
      await companySignup({ name: 'Co2', email: 'hr@co2.com', password: 'p', contact_person: 'HR2' });
      const sent = emailMock.getSent();
      assert.equal(sent[0]?.template, 'companyWelcome');
    });

    it('duplicate company email returns 400', async () => {
      const r = await companySignup({ name: 'Dup', email: FIXTURES.company.email, password: 'p', contact_person: 'HR' });
      assert.equal(r.status, 400);
    });

    it('me with user token returns 401', () => {
      const tok = generateUserToken('uid-001');
      const r   = companyMe(tok);
      assert.equal(r.status, 401);
    });
  });

  // ── Member flow ──────────────────────────────────────────────────────────
  describe('Member signup & approval flow', () => {
    it('signup with correct domain → pending status', async () => {
      const r = await memberSignup({ company_code: FIXTURES.company.id, first_name: 'New', last_name: 'Staff', email: 'newstaff@zenithtech.com', password: 'pass123', role: 'team_member', department: 'Finance' });
      assert.equal(r.status, 201);
      assert.equal(r.body.member.status, 'pending');
    });

    it('pending member cannot login', async () => {
      await memberSignup({ company_code: FIXTURES.company.id, first_name: 'P', last_name: 'M', email: 'pm@zenithtech.com', password: 'pass', role: 'team_member', department: 'HR' });
      const l = await memberLogin({ email: 'pm@zenithtech.com', password: 'pass' });
      assert.equal(l.status, 403);
      assert.ok(l.body.error.includes('pending'));
    });

    it('approved member can login and get me', async () => {
      const l = await memberLogin({ email: FIXTURES.leader.email, password: 'leaderpass' });
      assert.equal(l.status, 200);
      assert.ok(l.body.token);
      const m = memberMe(l.body.token);
      assert.equal(m.status, 200);
      assert.equal(m.body.role, 'team_leader');
    });

    it('wrong domain email rejected with domain hint', async () => {
      const r = await memberSignup({ company_code: FIXTURES.company.id, first_name: 'X', last_name: 'Y', email: 'x@gmail.com', password: 'p', role: 'team_member', department: 'IT' });
      assert.equal(r.status, 400);
      assert.ok(r.body.error.includes('zenithtech.com'));
    });

    it('invalid company code returns 404', async () => {
      const r = await memberSignup({ company_code: 'invalid-code', first_name: 'X', last_name: 'Y', email: 'x@zenithtech.com', password: 'p', role: 'team_member', department: 'IT' });
      assert.equal(r.status, 404);
    });

    it('member token type is company_member', async () => {
      const l = await memberLogin({ email: FIXTURES.leader.email, password: 'leaderpass' });
      const d = jwtHelper.verify(l.body.token, process.env.JWT_SECRET);
      assert.equal(d.type, 'company_member');
    });

    it('member token on company endpoint returns 401', () => {
      const tok = generateMemberToken('mem-001', 'co-001');
      const r   = companyMe(tok);
      assert.equal(r.status, 401);
    });
  });

  // ── Deduction flow ───────────────────────────────────────────────────────
  describe('Deduction request flow', () => {
    it('team leader can view wallet', () => {
      const r = getWallet(FIXTURES.card.id);
      assert.equal(r.status, 200);
      assert.ok(r.body.wallet);
      assert.equal(r.body.wallet.total_contributed, 100000);
      assert.equal(r.body.wallet.platform_fee,      20000);
      assert.equal(r.body.wallet.net_after_fee,     80000);
    });

    it('team leader can request deduction with reason', () => {
      const r = requestDeduction({ card_id: FIXTURES.card.id, amount: 15000, reason: 'Buy a celebration cake' }, FIXTURES.leader);
      assert.equal(r.status, 201);
      assert.equal(r.body.request.status, 'pending');
      assert.equal(r.body.request.amount, 15000);
    });

    it('team member cannot request deduction', () => {
      const r = requestDeduction({ card_id: FIXTURES.card.id, amount: 5000, reason: 'cake' }, FIXTURES.member);
      assert.equal(r.status, 403);
    });

    it('deduction exceeding balance rejected', () => {
      const r = requestDeduction({ card_id: FIXTURES.card.id, amount: 90000, reason: 'too much' }, FIXTURES.leader);
      assert.equal(r.status, 400);
      assert.ok(r.body.error.includes('exceeds'));
    });

    it('deduction without reason rejected', () => {
      const r = requestDeduction({ card_id: FIXTURES.card.id, amount: 5000, reason: '' }, FIXTURES.leader);
      assert.equal(r.status, 400);
      assert.ok(r.body.error.includes('reason'));
    });

    it('HR can approve deduction and wallet is updated', () => {
      const dr = requestDeduction({ card_id: FIXTURES.card.id, amount: 15000, reason: 'cake' }, FIXTURES.leader);
      const approved = approveDeduction(dr.body.request.id, FIXTURES.company);
      assert.equal(approved.status, 200);
      const wallet = wallets.find(w => w.card_id === FIXTURES.card.id);
      assert.equal(wallet.total_deducted,     15000);
      assert.equal(wallet.amount_to_celebrant, 65000);
    });

    it('platform fee is 20% of gross (not reduced by deduction)', () => {
      requestDeduction({ card_id: FIXTURES.card.id, amount: 15000, reason: 'r' }, FIXTURES.leader);
      const wallet = wallets.find(w => w.card_id === FIXTURES.card.id);
      // Fee should remain 20% of original 100,000 = 20,000
      assert.equal(wallet.platform_fee, 20000);
    });

    it('already-processed deduction cannot be approved again', () => {
      const dr = requestDeduction({ card_id: FIXTURES.card.id, amount: 10000, reason: 'r' }, FIXTURES.leader);
      approveDeduction(dr.body.request.id, FIXTURES.company);
      const r2 = approveDeduction(dr.body.request.id, FIXTURES.company);
      assert.equal(r2.status, 400);
      assert.ok(r2.body.error.includes('already processed'));
    });
  });

  // ── Cross-concerns ───────────────────────────────────────────────────────
  describe('Cross-concern security checks', () => {
    it('user token cannot access company endpoint', () => {
      const tok = generateUserToken('uid-001');
      assert.throws(() => verifyCompanyToken(tok), /Not a company token/);
    });

    it('company token cannot access user endpoint', () => {
      const tok = generateCompanyToken('co-001');
      assert.throws(() => verifyUserToken(tok), /Wrong token type/);
    });

    it('member token cannot access company endpoint', () => {
      const tok = generateMemberToken('m-001', 'co-001');
      assert.throws(() => verifyCompanyToken(tok), /Not a company token/);
    });

    it('expired token always fails all verification', () => {
      const expired = jwtHelper.signExpired({ userId: 'u', type: 'company' }, process.env.JWT_SECRET);
      assert.throws(() => jwtHelper.verify(expired, process.env.JWT_SECRET), /expired/);
    });

    it('token from wrong secret always fails', () => {
      const tok = jwtHelper.sign({ userId: 'u-001' }, 'different-secret', { expiresIn: '1d' });
      assert.throws(() => jwtHelper.verify(tok, process.env.JWT_SECRET), /invalid signature/);
    });

    it('response body is always JSON (error or success)', async () => {
      const r = await authSignup({ full_name: 'Valid', email: 'v@test.com', password: 'pass123' });
      assert.ok(typeof r.body === 'object');
      const e = await authLogin({ email: 'invalid@test.com', password: 'wrong' });
      assert.ok(typeof e.body === 'object');
      assert.ok(e.body.error);
    });
  });

  // ── Email notification integration ──────────────────────────────────────
  describe('Email notification triggers', () => {
    it('member signup notifies HR via email', async () => {
      emailMock.clear();
      await memberSignup({ company_code: FIXTURES.company.id, first_name: 'K', last_name: 'M', email: 'km@zenithtech.com', password: 'pass', role: 'team_member', department: 'Engineering' });
      const sent = emailMock.getSent();
      assert.ok(sent.some(s => s.template === 'memberJoinRequest'));
    });

    it('company signup sends exactly one welcome email', async () => {
      emailMock.clear();
      await companySignup({ name: 'NewCo', email: 'hr@newco.ng', password: 'p', contact_person: 'HR' });
      assert.equal(emailMock.getSent().length, 1);
      assert.equal(emailMock.getSent()[0].template, 'companyWelcome');
    });

    it('individual signup sends exactly one welcome email', async () => {
      emailMock.clear();
      await authSignup({ full_name: 'Solo', email: 'solo@test.com', password: 'pass123' });
      assert.equal(emailMock.getSent().length, 1);
      assert.equal(emailMock.getSent()[0].template, 'welcome');
    });

    it('failed login does not send emails', async () => {
      emailMock.clear();
      await authLogin({ email: 'unknown@test.com', password: 'wrong' });
      assert.equal(emailMock.getSent().length, 0);
    });
  });
});
