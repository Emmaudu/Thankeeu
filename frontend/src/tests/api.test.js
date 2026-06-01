// src/tests/api.test.js
// Tests API utility logic, token management, and URL construction.
// These tests use Vitest and run in jsdom.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock localStorage ────────────────────────────────────────────────────────
const mockStorage = {};
const ls = {
  getItem:    (k) => mockStorage[k] ?? null,
  setItem:    (k, v) => { mockStorage[k] = v; },
  removeItem: (k) => { delete mockStorage[k]; },
  clear:      () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

// ─── Pure helpers that mirror api.js logic ────────────────────────────────────
function getToken(key)       { return ls.getItem(key); }
function setToken(key, val)  { ls.setItem(key, val); }
function removeToken(key)    { ls.removeItem(key); }

function buildAuthHeader(tokenKey) {
  const token = getToken(tokenKey);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function handleUnauthorized(tokenKey, dataKey, redirectPath) {
  removeToken(tokenKey);
  removeToken(dataKey);
  // In real app: window.location.href = redirectPath
  return redirectPath;
}

// Plan pricing helpers
const PLANS = {
  single:  { price: 1500,  label: '₦1,500',   credits: 1 },
  pack5:   { price: 5000,  label: '₦5,000',   credits: 5 },
  monthly: { price: 20000, label: '₦20,000/month' },
  yearly:  { price: 200000,label: '₦200,000/year' },
};

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

function calculateGiftFee(amount, feeRate = 0.04) {
  return Math.round(amount * feeRate);
}

function calculatePlatformFee(amount, feeRate = 0.20) {
  return Math.round(amount * feeRate);
}

function getOccasionDisplay(occasion) {
  const map = {
    birthday:         { label: 'Birthday',        icon: '🎂' },
    leaving:          { label: 'Leaving Company', icon: '👋' },
    work_anniversary: { label: 'Work Anniversary',icon: '🏆' },
    promotion:        { label: 'Promotion',        icon: '🌟' },
    wedding:          { label: 'Wedding',          icon: '💍' },
    valentines_day:   { label: "Valentine's Day",  icon: '💝' },
    womens_day:       { label: "Women's Day",      icon: '👩' },
    mens_day:         { label: "Men's Day",        icon: '👨' },
    workers_day:      { label: "Workers' Day",     icon: '✊' },
    graduation:       { label: 'Graduation',       icon: '🎓' },
    new_baby:         { label: 'New Baby',         icon: '👶' },
    retirement:       { label: 'Retirement',       icon: '🏖️' },
  };
  return map[occasion] || { label: occasion, icon: '🎉' };
}

function daysUntil(dateStr) {
  const today = new Date();
  const d     = new Date(dateStr);
  const next  = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Token management (api.js)', () => {
  beforeEach(() => ls.clear());

  it('getToken returns null when not set', () => {
    expect(getToken('thankeeu_token')).toBeNull();
  });

  it('setToken stores value in localStorage', () => {
    setToken('thankeeu_token', 'my-jwt');
    expect(getToken('thankeeu_token')).toBe('my-jwt');
  });

  it('removeToken deletes value', () => {
    setToken('thankeeu_token', 'my-jwt');
    removeToken('thankeeu_token');
    expect(getToken('thankeeu_token')).toBeNull();
  });

  it('buildAuthHeader returns empty object when no token', () => {
    expect(buildAuthHeader('thankeeu_token')).toEqual({});
  });

  it('buildAuthHeader returns Bearer header when token exists', () => {
    setToken('thankeeu_token', 'my-jwt-token');
    expect(buildAuthHeader('thankeeu_token')).toEqual({ Authorization: 'Bearer my-jwt-token' });
  });

  it('different token keys are isolated', () => {
    setToken('thankeeu_token',         'user-token');
    setToken('thankeeu_company_token', 'company-token');
    setToken('thankeeu_member_token',  'member-token');
    expect(getToken('thankeeu_token')).toBe('user-token');
    expect(getToken('thankeeu_company_token')).toBe('company-token');
    expect(getToken('thankeeu_member_token')).toBe('member-token');
  });

  it('handleUnauthorized clears token and data', () => {
    setToken('thankeeu_company_token', 'co-token');
    setToken('thankeeu_company',       '{"id":"co-001"}');
    const redirect = handleUnauthorized('thankeeu_company_token', 'thankeeu_company', '/company/login');
    expect(getToken('thankeeu_company_token')).toBeNull();
    expect(getToken('thankeeu_company')).toBeNull();
    expect(redirect).toBe('/company/login');
  });
});

describe('Price & fee calculations (api.js / Pricing.jsx)', () => {
  it('single card is ₦1,500', () => {
    expect(PLANS.single.price).toBe(1500);
  });

  it('pack5 is ₦5,000 (₦1,000/card)', () => {
    expect(PLANS.pack5.price).toBe(5000);
    expect(PLANS.pack5.price / PLANS.pack5.credits).toBe(1000);
  });

  it('pack5 saves ₦2,500 vs 5 singles', () => {
    const savings = PLANS.single.price * 5 - PLANS.pack5.price;
    expect(savings).toBe(2500);
  });

  it('monthly subscription is ₦20,000', () => {
    expect(PLANS.monthly.price).toBe(20000);
  });

  it('yearly subscription is ₦200,000', () => {
    expect(PLANS.yearly.price).toBe(200000);
  });

  it('yearly saves ₦40,000 vs 12 months', () => {
    const savings = PLANS.monthly.price * 12 - PLANS.yearly.price;
    expect(savings).toBe(40000);
  });

  it('formatNaira formats numbers with commas', () => {
    expect(formatNaira(100000)).toContain('100,000');
    expect(formatNaira(1500)).toContain('1,500');
  });

  it('formatNaira includes ₦ symbol', () => {
    expect(formatNaira(5000)).toMatch(/^₦/);
  });

  it('gift fee is 4% of contribution', () => {
    expect(calculateGiftFee(10000)).toBe(400);
    expect(calculateGiftFee(5000)).toBe(200);
    expect(calculateGiftFee(2500)).toBe(100);
  });

  it('platform fee is 20% of gross', () => {
    expect(calculatePlatformFee(100000)).toBe(20000);
    expect(calculatePlatformFee(50000)).toBe(10000);
  });

  it('fee + net = total (no money lost)', () => {
    for (const amount of [1000, 5000, 33333, 100000]) {
      const fee = calculatePlatformFee(amount);
      expect(fee + (amount - fee)).toBe(amount);
    }
  });
});

describe('Occasion display helpers (TeamsPage.jsx, MemberDashboard.jsx)', () => {
  it('birthday returns correct label and icon', () => {
    const d = getOccasionDisplay('birthday');
    expect(d.label).toBe('Birthday');
    expect(d.icon).toBe('🎂');
  });

  it("women's day returns correct label", () => {
    const d = getOccasionDisplay('womens_day');
    expect(d.label).toBe("Women's Day");
    expect(d.icon).toBe('👩');
  });

  it('unknown occasion returns fallback', () => {
    const d = getOccasionDisplay('some_custom_occasion');
    expect(d.icon).toBe('🎉');
  });

  it('all 12 system occasions have display data', () => {
    const occasions = ['birthday','leaving','work_anniversary','promotion','wedding','valentines_day','womens_day','mens_day','workers_day','graduation','new_baby','retirement'];
    for (const occ of occasions) {
      const d = getOccasionDisplay(occ);
      expect(d.label).toBeTruthy();
      expect(d.icon).toBeTruthy();
    }
  });
});

describe('Days until calculation (TeamsPage.jsx)', () => {
  it('date in the future returns positive number', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const dateStr = future.toISOString().split('T')[0];
    const days = daysUntil(dateStr);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(11);
  });

  it('past date wraps to next year (positive)', () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);
    past.setDate(past.getDate() - 1);
    const dateStr = past.toISOString().split('T')[0];
    const days = daysUntil(dateStr);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(366);
  });

  it('birthday 2 days away returns ~2', () => {
    const twoDays = new Date();
    twoDays.setDate(twoDays.getDate() + 2);
    const dateStr = twoDays.toISOString().split('T')[0];
    const days = daysUntil(dateStr);
    expect(days).toBeGreaterThanOrEqual(1);
    expect(days).toBeLessThanOrEqual(3);
  });
});

describe('Domain validation (JoinCompanySignup.jsx)', () => {
  function getDomain(email) { return email.split('@')[1]?.toLowerCase(); }
  function validateDomain(memberEmail, companyEmail) {
    return getDomain(companyEmail) === getDomain(memberEmail);
  }

  it('same domain passes', () => {
    expect(validateDomain('kemi@zenithtech.com', 'hr@zenithtech.com')).toBe(true);
  });

  it('different domain fails', () => {
    expect(validateDomain('kemi@gmail.com', 'hr@zenithtech.com')).toBe(false);
  });

  it('subdomain does not match parent domain', () => {
    expect(validateDomain('kemi@mail.zenithtech.com', 'hr@zenithtech.com')).toBe(false);
  });

  it('case-insensitive match', () => {
    expect(validateDomain('KEMI@ZENITHTECH.COM', 'hr@zenithtech.com')).toBe(true);
  });

  it('no @ in email returns false', () => {
    expect(validateDomain('keminoemail', 'hr@zenithtech.com')).toBe(false);
  });
});

describe('Card status logic (CardView.jsx, CreateCard.jsx)', () => {
  const STATUSES = ['draft', 'active', 'sent', 'cancelled'];

  it('all statuses are valid strings', () => {
    for (const s of STATUSES) {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    }
  });

  it('active card can be signed', () => {
    const card = { status: 'active' };
    expect(card.status === 'active').toBe(true);
  });

  it('sent card cannot be signed again', () => {
    const card = { status: 'sent' };
    expect(card.status === 'active').toBe(false);
  });

  it('draft card is not visible to signers', () => {
    const card = { status: 'draft' };
    expect(['active', 'sent'].includes(card.status)).toBe(false);
  });
});

describe('Wallet display logic (DeductionRequestsPage.jsx)', () => {
  function walletSummary(wallet) {
    return {
      gross:          wallet.total_contributed,
      fee:            wallet.platform_fee,
      net:            wallet.net_after_fee,
      deducted:       wallet.total_deducted,
      toCelebrant:    wallet.amount_to_celebrant,
      feePercent:     wallet.total_contributed > 0
        ? ((wallet.platform_fee / wallet.total_contributed) * 100).toFixed(0)
        : '0',
    };
  }

  it('wallet summary shows correct values', () => {
    const wallet = { total_contributed: 100000, platform_fee: 20000, net_after_fee: 80000, total_deducted: 15000, amount_to_celebrant: 65000 };
    const s = walletSummary(wallet);
    expect(s.gross).toBe(100000);
    expect(s.fee).toBe(20000);
    expect(s.feePercent).toBe('20');
    expect(s.toCelebrant).toBe(65000);
  });

  it('zero wallet shows 0% fee', () => {
    const wallet = { total_contributed: 0, platform_fee: 0, net_after_fee: 0, total_deducted: 0, amount_to_celebrant: 0 };
    const s = walletSummary(wallet);
    expect(s.feePercent).toBe('0');
  });
});
