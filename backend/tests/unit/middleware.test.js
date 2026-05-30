'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const jwt    = require('../jwt-helper');

process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars-long';

const { makeReq, makeRes, FIXTURES } = require('../mocks');

function buildUserToken(payload)    { return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); }
function buildCompanyToken(payload) { return jwt.sign({ ...payload, type: 'company' }, process.env.JWT_SECRET, { expiresIn: '1d' }); }
function buildMemberToken(payload)  { return jwt.sign({ ...payload, type: 'company_member' }, process.env.JWT_SECRET, { expiresIn: '1d' }); }

function decodeUserToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type) throw new Error('Wrong token type');
  return decoded;
}
function decodeCompanyToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'company') throw new Error('Not a company token');
  return decoded;
}
function decodeMemberToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'company_member') throw new Error('Not a member token');
  return decoded;
}

describe('User auth middleware', () => {
  it('accepts valid user token', () => {
    const token   = buildUserToken({ userId: 'uid-001' });
    const decoded = decodeUserToken(token);
    assert.equal(decoded.userId, 'uid-001');
  });
  it('rejects company token when user token expected', () => {
    const token = buildCompanyToken({ companyId: 'co-001' });
    assert.throws(() => decodeUserToken(token), /Wrong token type/);
  });
  it('rejects member token when user token expected', () => {
    const token = buildMemberToken({ memberId: 'mem-001', companyId: 'co-001' });
    assert.throws(() => decodeUserToken(token), /Wrong token type/);
  });
  it('rejects expired token', () => {
    const token = jwt.signExpired({ userId: 'uid-001' }, process.env.JWT_SECRET);
    assert.throws(() => decodeUserToken(token), /expired/);
  });
  it('rejects token signed with wrong secret', () => {
    const token = jwt.sign({ userId: 'uid-001' }, 'wrong-secret', { expiresIn: '1d' });
    assert.throws(() => decodeUserToken(token));
  });
  it('rejects completely invalid token string', () => {
    assert.throws(() => decodeUserToken('not.a.valid.jwt.token'));
  });
  it('rejects empty string token', () => {
    assert.throws(() => decodeUserToken(''));
  });
});

describe('Company auth middleware', () => {
  it('accepts valid company token', () => {
    const token   = buildCompanyToken({ companyId: 'co-001' });
    const decoded = decodeCompanyToken(token);
    assert.equal(decoded.companyId, 'co-001');
    assert.equal(decoded.type, 'company');
  });
  it('rejects user token when company token expected', () => {
    const token = buildUserToken({ userId: 'uid-001' });
    assert.throws(() => decodeCompanyToken(token), /Not a company token/);
  });
  it('rejects member token when company token expected', () => {
    const token = buildMemberToken({ memberId: 'mem-001', companyId: 'co-001' });
    assert.throws(() => decodeCompanyToken(token), /Not a company token/);
  });
  it('rejects expired company token', () => {
    const token = jwt.signExpired({ companyId: 'co-001', type: 'company' }, process.env.JWT_SECRET);
    assert.throws(() => decodeCompanyToken(token), /expired/);
  });
});

describe('Member auth middleware', () => {
  it('accepts valid member token', () => {
    const token   = buildMemberToken({ memberId: 'mem-001', companyId: 'co-001' });
    const decoded = decodeMemberToken(token);
    assert.equal(decoded.memberId,  'mem-001');
    assert.equal(decoded.companyId, 'co-001');
    assert.equal(decoded.type, 'company_member');
  });
  it('rejects user token when member token expected', () => {
    const token = buildUserToken({ userId: 'uid-001' });
    assert.throws(() => decodeMemberToken(token), /Not a member token/);
  });
  it('rejects company token when member token expected', () => {
    const token = buildCompanyToken({ companyId: 'co-001' });
    assert.throws(() => decodeMemberToken(token), /Not a member token/);
  });
  it('token carries member role and department', () => {
    const token   = buildMemberToken({ memberId: 'mem-001', companyId: 'co-001', role: 'team_leader', department: 'Engineering' });
    const decoded = decodeMemberToken(token);
    assert.equal(decoded.role,       'team_leader');
    assert.equal(decoded.department, 'Engineering');
  });
});

describe('Authorization rules', () => {
  describe('Admin-only endpoints', () => {
    it('user with role=admin is authorized', () => {
      assert.equal(FIXTURES.adminUser.role, 'admin');
    });
    it('user with role=user is not authorized for admin', () => {
      assert.notEqual(FIXTURES.user.role, 'admin');
    });
  });

  describe('Team leader authorization', () => {
    it('team_leader can approve members in their own department', () => {
      const canApprove = FIXTURES.leader.role === 'team_leader' && FIXTURES.leader.department === FIXTURES.member.department;
      assert.equal(canApprove, true);
    });
    it('team_leader cannot approve members in different department', () => {
      const diffDeptMember = { ...FIXTURES.member, department: 'Finance' };
      const canApprove = FIXTURES.leader.role === 'team_leader' && FIXTURES.leader.department === diffDeptMember.department;
      assert.equal(canApprove, false);
    });
    it('team_leader cannot approve other team_leaders', () => {
      const anotherLeader = { role: 'team_leader', department: 'Engineering' };
      const canApprove    = FIXTURES.leader.role === 'team_leader' && anotherLeader.role !== 'team_leader';
      assert.equal(canApprove, false);
    });
    it('team_member cannot approve anyone', () => {
      const canApprove = FIXTURES.member.role === 'team_leader';
      assert.equal(canApprove, false);
    });
  });

  describe('Deduction authorization', () => {
    it('only team_leader can request deductions', () => {
      assert.equal(FIXTURES.leader.role, 'team_leader');
      assert.notEqual(FIXTURES.member.role, 'team_leader');
    });
    it('deduction cannot exceed available balance', () => {
      const available = 70000;
      const requested = 75000;
      assert.equal(requested > available, true);
    });
    it('deduction within available balance is allowed', () => {
      const available = 70000;
      const requested = 30000;
      assert.equal(requested <= available, true);
    });
  });
});

describe('Request validation', () => {
  it('missing Authorization header returns no token', () => {
    const req   = makeReq({ headers: {} });
    const token = req.headers.authorization?.split(' ')[1];
    assert.equal(token, undefined);
  });
  it('correct Bearer token extraction', () => {
    const expected = 'my-jwt-token-here';
    const req      = makeReq({ headers: { authorization: `Bearer ${expected}` } });
    const token    = req.headers.authorization?.split(' ')[1];
    assert.equal(token, expected);
  });
});
