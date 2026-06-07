'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt    = require('../jwt-helper');

process.env.JWT_SECRET     = 'test-secret-key-minimum-32-chars-long';
process.env.APP_URL        = 'https://thankeeu.com';
process.env.RESEND_API_KEY = 'test-key';
process.env.EMAIL_FROM     = 'hello@thankeeu.com';
process.env.EMAIL_FROM_NAME = 'Thankeeu';

const { FIXTURES, createBcryptMock, createEmailMock } = require('../mocks');
const bcrypt    = createBcryptMock();
const emailMock = createEmailMock();

// ─── Pure logic helpers ───────────────────────────────────────────────────────
const getDomain         = (email) => email.split('@')[1]?.toLowerCase();
const validateDomain    = (memberEmail, companyEmail) => getDomain(companyEmail) === getDomain(memberEmail);
const generateToken     = (companyId) => jwt.sign({ companyId, type: 'company' }, process.env.JWT_SECRET, { expiresIn: '7d' });
const generateMemberTok = (memberId, companyId) => jwt.sign({ memberId, companyId, type: 'company_member' }, process.env.JWT_SECRET, { expiresIn: '7d' });

async function companySignup({ name, email, password, contact_person, phone, industry }, db) {
  const existing = db.companies.find(c => c.email === email);
  if (existing) return { error: 'Email already registered as a company', status: 400 };
  const password_hash = await bcrypt.hash(password, 12);
  const company = { id: `co-${Date.now()}`, name, email, password_hash, contact_person, phone, industry, role: 'company' };
  db.companies.push(company);
  await emailMock.sendEmail({ to: email, template: 'companyWelcome', data: { companyName: name, contactPerson: contact_person } });
  const token = generateToken(company.id);
  const { password_hash: _, ...safeCompany } = company;
  return { token, company: safeCompany };
}

async function companyLogin({ email, password }, db) {
  const company = db.companies.find(c => c.email === email);
  if (!company) return { error: 'Invalid email or password', status: 401 };
  const valid = await bcrypt.compare(password, company.password_hash);
  if (!valid) return { error: 'Invalid email or password', status: 401 };
  const token = generateToken(company.id);
  const { password_hash, ...safe } = company;
  return { token, company: safe };
}

async function memberSignup({ company_code, first_name, last_name, email, password, role, department }, db) {
  const company = db.companies.find(c => c.id === company_code);
  if (!company) return { error: 'Company not found. Check your company code.', status: 404 };
  if (!validateDomain(email, company.email)) {
    const domain = getDomain(company.email);
    return { error: `Your email must use your company domain (@${domain}).`, status: 400 };
  }
  const existingMember = db.members.find(m => m.email === email);
  if (existingMember) return { error: 'Email already registered', status: 400 };
  const password_hash = await bcrypt.hash(password, 12);
  const member = { id: `mem-${Date.now()}`, company_id: company.id, first_name, last_name, email, password_hash, role, department, status: 'pending' };
  db.members.push(member);
  await emailMock.sendEmail({ to: company.email, template: 'memberJoinRequest', data: { companyName: company.name, hrName: company.contact_person, memberName: `${first_name} ${last_name}`, memberEmail: email, role, department, companyId: company.id } });
  const { password_hash: _, ...safeMember } = member;
  return { message: 'Account created. Awaiting approval.', member: safeMember };
}

async function approveMember(memberId, approverId, isHR, db) {
  const member = db.members.find(m => m.id === memberId);
  if (!member) return { error: 'Member not found', status: 404 };
  if (!isHR) {
    const approver = db.members.find(m => m.id === approverId);
    if (approver?.role !== 'team_leader') return { error: 'Only team leaders or HR can approve members', status: 403 };
    if (member.department !== approver.department) return { error: 'You can only approve members in your department', status: 403 };
    if (member.role === 'team_leader') return { error: 'Only HR can approve team leaders', status: 403 };
  }
  member.status = 'approved';
  await emailMock.sendEmail({ to: member.email, template: 'memberApproved', data: { memberName: member.first_name, companyName: 'Co', role: member.role, department: member.department } });
  return { message: `${member.first_name} has been approved` };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Company Controller', () => {
  let db;
  beforeEach(() => {
    db = { companies: [{ ...FIXTURES.company }], members: [], subscriptions: [] };
    emailMock.clear();
  });

  describe('companySignup()', () => {
    it('creates company and returns token', async () => {
      const result = await companySignup({ name: 'Acme Corp', email: 'hr@acme.com', password: 'pass123', contact_person: 'Bola' }, db);
      assert.ok(result.token);
      assert.equal(result.company.name, 'Acme Corp');
    });

    it('token type is company', async () => {
      const result  = await companySignup({ name: 'Co2', email: 'hr@co2.com', password: 'pass', contact_person: 'HR' }, db);
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
      assert.equal(decoded.type, 'company');
    });

    it('does not expose password_hash', async () => {
      const result = await companySignup({ name: 'Co3', email: 'hr@co3.com', password: 'pass', contact_person: 'HR' }, db);
      assert.equal(result.company.password_hash, undefined);
    });

    it('rejects duplicate company email', async () => {
      const result = await companySignup({ name: 'Duplicate', email: FIXTURES.company.email, password: 'pass', contact_person: 'HR' }, db);
      assert.equal(result.status, 400);
      assert.ok(result.error.includes('already registered'));
    });

    it('sends welcome email after signup', async () => {
      await companySignup({ name: 'NewCo', email: 'hr@newco.com', password: 'pass', contact_person: 'Tunde' }, db);
      const sent = emailMock.getSent();
      assert.equal(sent.length, 1);
      assert.equal(sent[0].template, 'companyWelcome');
    });
  });

  describe('companyLogin()', () => {
    it('returns token for valid credentials', async () => {
      const result = await companyLogin({ email: FIXTURES.company.email, password: 'companypass' }, db);
      assert.ok(result.token);
    });

    it('rejects unknown email', async () => {
      const result = await companyLogin({ email: 'unknown@co.com', password: 'pass' }, db);
      assert.equal(result.status, 401);
    });

    it('rejects wrong password', async () => {
      const result = await companyLogin({ email: FIXTURES.company.email, password: 'wrongpass' }, db);
      assert.equal(result.status, 401);
    });
  });
});

describe('Company Members Controller', () => {
  let db;
  beforeEach(() => {
    db = {
      companies: [{ ...FIXTURES.company }],
      members: [{ ...FIXTURES.leader }, { ...FIXTURES.member }],
    };
    emailMock.clear();
  });

  describe('memberSignup()', () => {
    it('creates pending member for valid company domain', async () => {
      const result = await memberSignup({
        company_code: FIXTURES.company.id,
        first_name: 'Ngozi', last_name: 'Eze',
        email: 'ngozi@zenithtech.com',
        password: 'pass123',
        role: 'team_member',
        department: 'Finance',
      }, db);
      assert.equal(result.member.status, 'pending');
      assert.equal(result.member.first_name, 'Ngozi');
    });

    it('rejects email with wrong domain', async () => {
      const result = await memberSignup({
        company_code: FIXTURES.company.id,
        first_name: 'Bola', last_name: 'Test',
        email: 'bola@gmail.com',
        password: 'pass123',
        role: 'team_member',
        department: 'HR',
      }, db);
      assert.equal(result.status, 400);
      assert.ok(result.error.includes('zenithtech.com'));
    });

    it('rejects invalid company code', async () => {
      const result = await memberSignup({
        company_code: 'invalid-code-000',
        first_name: 'Test', last_name: 'User',
        email: 'test@zenithtech.com',
        password: 'pass',
        role: 'team_member',
        department: 'HR',
      }, db);
      assert.equal(result.status, 404);
    });

    it('rejects duplicate email', async () => {
      const result = await memberSignup({
        company_code: FIXTURES.company.id,
        first_name: 'Kemi', last_name: 'Adeyemi',
        email: FIXTURES.member.email,
        password: 'pass',
        role: 'team_member',
        department: 'Engineering',
      }, db);
      assert.equal(result.status, 400);
    });

    it('does not expose password_hash', async () => {
      const result = await memberSignup({
        company_code: FIXTURES.company.id,
        first_name: 'New', last_name: 'User',
        email: 'newuser@zenithtech.com',
        password: 'pass123',
        role: 'team_member',
        department: 'Marketing',
      }, db);
      assert.equal(result.member?.password_hash, undefined);
    });

    it('notifies HR and dept leader on signup', async () => {
      await memberSignup({
        company_code: FIXTURES.company.id,
        first_name: 'Chidi', last_name: 'Obi',
        email: 'chidi@zenithtech.com',
        password: 'pass123',
        role: 'team_member',
        department: 'Engineering',
      }, db);
      const sent = emailMock.getSent();
      assert.ok(sent.length >= 1);
      assert.ok(sent.some(s => s.template === 'memberJoinRequest'));
    });
  });

  describe('approveMember()', () => {
    it('HR can approve any member', async () => {
      const pendingMember = { id: 'pm-001', company_id: FIXTURES.company.id, first_name: 'Pend', last_name: 'User', email: 'pend@zenithtech.com', role: 'team_member', department: 'Finance', status: 'pending' };
      db.members.push(pendingMember);
      const result = await approveMember('pm-001', FIXTURES.company.id, true, db);
      assert.ok(result.message.includes('approved'));
      assert.equal(pendingMember.status, 'approved');
    });

    it('team leader approves member in same dept', async () => {
      const pendingMember = { id: 'pm-002', company_id: FIXTURES.company.id, first_name: 'New', last_name: 'Eng', email: 'neweng@zenithtech.com', role: 'team_member', department: 'Engineering', status: 'pending' };
      db.members.push(pendingMember);
      const result = await approveMember('pm-002', FIXTURES.leader.id, false, db);
      assert.ok(result.message.includes('approved'));
    });

    it('team leader cannot approve member from different dept', async () => {
      const pendingMember = { id: 'pm-003', first_name: 'Fin', last_name: 'User', email: 'fin@zenithtech.com', role: 'team_member', department: 'Finance', status: 'pending' };
      db.members.push(pendingMember);
      const result = await approveMember('pm-003', FIXTURES.leader.id, false, db);
      assert.equal(result.status, 403);
    });

    it('team leader cannot approve other team leaders', async () => {
      const pendingLeader = { id: 'pl-001', first_name: 'New', last_name: 'Leader', email: 'nl@zenithtech.com', role: 'team_leader', department: 'Engineering', status: 'pending' };
      db.members.push(pendingLeader);
      const result = await approveMember('pl-001', FIXTURES.leader.id, false, db);
      assert.equal(result.status, 403);
    });

    it('team member cannot approve anyone', async () => {
      const pendingMember = { id: 'pm-004', first_name: 'P', last_name: 'M', email: 'pm@zenithtech.com', role: 'team_member', department: 'Engineering', status: 'pending' };
      db.members.push(pendingMember);
      const result = await approveMember('pm-004', FIXTURES.member.id, false, db);
      assert.equal(result.status, 403);
    });

    it('sends approval email after approving', async () => {
      const pendingMember = { id: 'pm-005', first_name: 'Get', last_name: 'Approved', email: 'ga@zenithtech.com', role: 'team_member', department: 'Engineering', status: 'pending' };
      db.members.push(pendingMember);
      await approveMember('pm-005', FIXTURES.company.id, true, db);
      const sent = emailMock.getSent();
      assert.ok(sent.some(s => s.template === 'memberApproved'));
    });
  });
});
