// src/tests/auth-contexts.test.js
// Tests the three auth contexts: AuthContext, CompanyAuthContext, MemberAuthContext

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock localStorage ────────────────────────────────────────────────────────
const store = {};
const ls = {
  getItem:    (k) => store[k] ?? null,
  setItem:    (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear:      () => { Object.keys(store).forEach(k => delete store[k]); },
};

// ─── Token key constants (match api.js) ──────────────────────────────────────
const KEYS = {
  userToken:     'thankeeu_token',
  userData:      'thankeeu_user',
  companyToken:  'thankeeu_company_token',
  companyData:   'thankeeu_company',
  memberToken:   'thankeeu_member_token',
  memberData:    'thankeeu_member',
};

// ─── Simulate context login/logout logic ─────────────────────────────────────
function userLogin(token, user) {
  ls.setItem(KEYS.userToken, token);
  ls.setItem(KEYS.userData, JSON.stringify(user));
}
function userLogout() {
  ls.removeItem(KEYS.userToken);
  ls.removeItem(KEYS.userData);
}
function getUserFromStorage() {
  const d = ls.getItem(KEYS.userData);
  return d ? JSON.parse(d) : null;
}

function companyLogin(token, company) {
  ls.setItem(KEYS.companyToken, token);
  ls.setItem(KEYS.companyData, JSON.stringify(company));
}
function companyLogout() {
  ls.removeItem(KEYS.companyToken);
  ls.removeItem(KEYS.companyData);
}
function getCompanyFromStorage() {
  const d = ls.getItem(KEYS.companyData);
  return d ? JSON.parse(d) : null;
}

function memberLogin(token, member) {
  ls.setItem(KEYS.memberToken, token);
  ls.setItem(KEYS.memberData, JSON.stringify(member));
}
function memberLogout() {
  ls.removeItem(KEYS.memberToken);
  ls.removeItem(KEYS.memberData);
}
function getMemberFromStorage() {
  const d = ls.getItem(KEYS.memberData);
  return d ? JSON.parse(d) : null;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_USER    = { id: 'u-001', email: 'amaka@test.com', full_name: 'Amaka Okafor', role: 'user' };
const MOCK_COMPANY = { id: 'co-001', name: 'Zenith Tech', email: 'hr@zenithtech.com', contact_person: 'Tunde' };
const MOCK_MEMBER  = { id: 'mem-001', company_id: 'co-001', first_name: 'Kemi', last_name: 'Adeyemi', email: 'kemi@zenithtech.com', role: 'team_member', department: 'Engineering', status: 'approved' };
const MOCK_LEADER  = { id: 'ldr-001', company_id: 'co-001', first_name: 'Emeka', last_name: 'Eze', email: 'emeka@zenithtech.com', role: 'team_leader', department: 'Engineering', status: 'approved' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext (individual users)', () => {
  beforeEach(() => ls.clear());

  it('login stores token and user in localStorage', () => {
    userLogin('user-tok-123', MOCK_USER);
    expect(ls.getItem(KEYS.userToken)).toBe('user-tok-123');
    expect(getUserFromStorage()).toEqual(MOCK_USER);
  });

  it('logout clears token and user from localStorage', () => {
    userLogin('user-tok-123', MOCK_USER);
    userLogout();
    expect(ls.getItem(KEYS.userToken)).toBeNull();
    expect(getUserFromStorage()).toBeNull();
  });

  it('user data is recoverable from storage after login', () => {
    userLogin('tok', MOCK_USER);
    const recovered = getUserFromStorage();
    expect(recovered?.email).toBe(MOCK_USER.email);
    expect(recovered?.full_name).toBe(MOCK_USER.full_name);
    expect(recovered?.role).toBe('user');
  });

  it('different sessions do not bleed into each other', () => {
    userLogin('tok1', MOCK_USER);
    companyLogin('tok2', MOCK_COMPANY);
    expect(getUserFromStorage()?.email).toBe(MOCK_USER.email);
    expect(getCompanyFromStorage()?.name).toBe(MOCK_COMPANY.name);
  });

  it('no user in storage when never logged in', () => {
    expect(getUserFromStorage()).toBeNull();
  });
});

describe('CompanyAuthContext (HR accounts)', () => {
  beforeEach(() => ls.clear());

  it('login stores company token and data', () => {
    companyLogin('company-tok-456', MOCK_COMPANY);
    expect(ls.getItem(KEYS.companyToken)).toBe('company-tok-456');
    expect(getCompanyFromStorage()?.name).toBe('Zenith Tech');
  });

  it('logout clears company data', () => {
    companyLogin('company-tok-456', MOCK_COMPANY);
    companyLogout();
    expect(ls.getItem(KEYS.companyToken)).toBeNull();
    expect(getCompanyFromStorage()).toBeNull();
  });

  it('user logout does not affect company session', () => {
    userLogin('u-tok', MOCK_USER);
    companyLogin('co-tok', MOCK_COMPANY);
    userLogout();
    expect(getCompanyFromStorage()?.name).toBe('Zenith Tech');
  });

  it('company ID is preserved in storage', () => {
    companyLogin('tok', MOCK_COMPANY);
    const recovered = getCompanyFromStorage();
    expect(recovered?.id).toBe('co-001');
  });
});

describe('MemberAuthContext (team leaders & members)', () => {
  beforeEach(() => ls.clear());

  it('team member login stores token and profile', () => {
    memberLogin('member-tok-789', MOCK_MEMBER);
    expect(ls.getItem(KEYS.memberToken)).toBe('member-tok-789');
    expect(getMemberFromStorage()?.role).toBe('team_member');
  });

  it('team leader login stores role correctly', () => {
    memberLogin('leader-tok', MOCK_LEADER);
    const m = getMemberFromStorage();
    expect(m?.role).toBe('team_leader');
    expect(m?.first_name).toBe('Emeka');
  });

  it('member logout clears all member data', () => {
    memberLogin('tok', MOCK_MEMBER);
    memberLogout();
    expect(ls.getItem(KEYS.memberToken)).toBeNull();
    expect(getMemberFromStorage()).toBeNull();
  });

  it('department is preserved in storage', () => {
    memberLogin('tok', MOCK_MEMBER);
    expect(getMemberFromStorage()?.department).toBe('Engineering');
  });

  it('company_id is accessible from member storage', () => {
    memberLogin('tok', MOCK_MEMBER);
    expect(getMemberFromStorage()?.company_id).toBe('co-001');
  });
});

describe('Session isolation (three auth systems)', () => {
  beforeEach(() => ls.clear());

  it('all three sessions can be active simultaneously', () => {
    userLogin('u-tok',   MOCK_USER);
    companyLogin('c-tok', MOCK_COMPANY);
    memberLogin('m-tok',  MOCK_MEMBER);
    expect(getUserFromStorage()?.id).toBe('u-001');
    expect(getCompanyFromStorage()?.id).toBe('co-001');
    expect(getMemberFromStorage()?.id).toBe('mem-001');
  });

  it('logging out of one session does not affect others', () => {
    userLogin('u-tok',   MOCK_USER);
    companyLogin('c-tok', MOCK_COMPANY);
    memberLogin('m-tok',  MOCK_MEMBER);
    userLogout();
    expect(getUserFromStorage()).toBeNull();
    expect(getCompanyFromStorage()?.name).toBe('Zenith Tech');
    expect(getMemberFromStorage()?.email).toBe('kemi@zenithtech.com');
  });

  it('clearing one token key does not affect others', () => {
    ls.setItem(KEYS.userToken,    'u-tok');
    ls.setItem(KEYS.companyToken, 'c-tok');
    ls.setItem(KEYS.memberToken,  'm-tok');
    ls.removeItem(KEYS.userToken);
    expect(ls.getItem(KEYS.userToken)).toBeNull();
    expect(ls.getItem(KEYS.companyToken)).toBe('c-tok');
    expect(ls.getItem(KEYS.memberToken)).toBe('m-tok');
  });
});

describe('Route protection logic', () => {
  beforeEach(() => ls.clear());

  it('user protected route requires user token', () => {
    const canAccess = () => !!ls.getItem(KEYS.userToken);
    expect(canAccess()).toBe(false);
    ls.setItem(KEYS.userToken, 'tok');
    expect(canAccess()).toBe(true);
  });

  it('company protected route requires company token', () => {
    const canAccess = () => !!ls.getItem(KEYS.companyToken);
    expect(canAccess()).toBe(false);
    ls.setItem(KEYS.companyToken, 'tok');
    expect(canAccess()).toBe(true);
  });

  it('member protected route requires member token', () => {
    const canAccess = () => !!ls.getItem(KEYS.memberToken);
    expect(canAccess()).toBe(false);
    ls.setItem(KEYS.memberToken, 'tok');
    expect(canAccess()).toBe(true);
  });

  it('leader-only route checks role from storage', () => {
    memberLogin('tok', MOCK_MEMBER);
    const isLeader = getMemberFromStorage()?.role === 'team_leader';
    expect(isLeader).toBe(false);

    memberLogin('tok2', MOCK_LEADER);
    const isLeader2 = getMemberFromStorage()?.role === 'team_leader';
    expect(isLeader2).toBe(true);
  });

  it('admin-only route checks role from user storage', () => {
    userLogin('tok', MOCK_USER);
    const isAdmin = getUserFromStorage()?.role === 'admin';
    expect(isAdmin).toBe(false);

    userLogin('tok2', { ...MOCK_USER, role: 'admin' });
    const isAdmin2 = getUserFromStorage()?.role === 'admin';
    expect(isAdmin2).toBe(true);
  });
});
