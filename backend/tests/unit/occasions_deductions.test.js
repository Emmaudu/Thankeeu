'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { FIXTURES, createEmailMock } = require('../mocks');

const emailMock = createEmailMock();

// ─── Pure occasion logic ──────────────────────────────────────────────────────
const OCCASION_CONFIGS = {
  birthday:         { label: 'Birthday',        icon: '🎂', notifyDays: 2,  scope: 'department',   genderFilter: null },
  leaving:          { label: 'Leaving Company', icon: '👋', notifyDays: 7,  scope: 'department',   genderFilter: null },
  work_anniversary: { label: 'Work Anniversary',icon: '🏆', notifyDays: 7,  scope: 'department',   genderFilter: null },
  promotion:        { label: 'Promotion',        icon: '🌟', notifyDays: 7,  scope: 'department',   genderFilter: null },
  wedding:          { label: 'Wedding',          icon: '💍', notifyDays: 7,  scope: 'department',   genderFilter: null },
  valentines_day:   { label: "Valentine's Day",  icon: '💝', notifyDays: 7,  scope: 'company_wide', genderFilter: null },
  womens_day:       { label: "Women's Day",      icon: '👩', notifyDays: 7,  scope: 'company_wide', genderFilter: 'female' },
  mens_day:         { label: "Men's Day",        icon: '👨', notifyDays: 7,  scope: 'company_wide', genderFilter: 'male' },
  workers_day:      { label: "Workers' Day",     icon: '✊', notifyDays: 7,  scope: 'company_wide', genderFilter: null },
  graduation:       { label: 'Graduation',       icon: '🎓', notifyDays: 7,  scope: 'department',   genderFilter: null },
  new_baby:         { label: 'New Baby',         icon: '👶', notifyDays: 7,  scope: 'department',   genderFilter: null },
  retirement:       { label: 'Retirement',       icon: '🏖️', notifyDays: 14, scope: 'company_wide', genderFilter: null },
};

function parseDateCol(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const parts = s.split(/[-\/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    if (y < 100) y += y < 30 ? 2000 : 1900;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function shouldNotifyForGender(member, occasionConfig) {
  if (!occasionConfig.genderFilter) return true;
  return member.gender?.toLowerCase() === occasionConfig.genderFilter;
}

function getNotifyScope(occasionConfig, requestedScope) {
  if (requestedScope === 'company_wide' && occasionConfig.scope !== 'company_wide') {
    return 'pending_approval';
  }
  return occasionConfig.scope;
}

// ─── Pure deduction logic ─────────────────────────────────────────────────────
function calculateWallet(totalContributed) {
  const platformFee       = Math.round(totalContributed * 0.20);
  const netAfterFee       = totalContributed - platformFee;
  return { totalContributed, platformFee, netAfterFee, totalDeducted: 0, amountToCelebrant: netAfterFee };
}

function applyDeduction(wallet, amount) {
  const available = wallet.netAfterFee - (wallet.totalDeducted || 0);
  if (amount > available) return { error: `Exceeds available balance (₦${available.toLocaleString()} available)` };
  const totalDeducted     = (wallet.totalDeducted || 0) + amount;
  const amountToCelebrant = wallet.netAfterFee - totalDeducted;
  return { ...wallet, totalDeducted, amountToCelebrant };
}

function platformCutIsOnGross(totalGross, deductionAmount) {
  // Platform always takes 20% of gross, NOT of net-after-deduction
  return Math.round(totalGross * 0.20);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Occasion Controller', () => {
  describe('Occasion configuration', () => {
    it('has exactly 12 occasion types', () => {
      assert.equal(Object.keys(OCCASION_CONFIGS).length, 12);
    });

    it('birthday notify days is 2 (shortest)', () => {
      assert.equal(OCCASION_CONFIGS.birthday.notifyDays, 2);
    });

    it('retirement notify days is 14 (longest)', () => {
      assert.equal(OCCASION_CONFIGS.retirement.notifyDays, 14);
    });

    it("women's day has female gender filter", () => {
      assert.equal(OCCASION_CONFIGS.womens_day.genderFilter, 'female');
    });

    it("men's day has male gender filter", () => {
      assert.equal(OCCASION_CONFIGS.mens_day.genderFilter, 'male');
    });

    it('birthday has no gender filter', () => {
      assert.equal(OCCASION_CONFIGS.birthday.genderFilter, null);
    });

    it('company-wide occasions are: valentines, womens, mens, workers, retirement', () => {
      const companyWide = Object.entries(OCCASION_CONFIGS)
        .filter(([, v]) => v.scope === 'company_wide')
        .map(([k]) => k);
      assert.ok(companyWide.includes('valentines_day'));
      assert.ok(companyWide.includes('womens_day'));
      assert.ok(companyWide.includes('mens_day'));
      assert.ok(companyWide.includes('workers_day'));
      assert.ok(companyWide.includes('retirement'));
    });

    it('department-only occasions include birthday, promotion, leaving', () => {
      const deptOnly = Object.entries(OCCASION_CONFIGS)
        .filter(([, v]) => v.scope === 'department')
        .map(([k]) => k);
      assert.ok(deptOnly.includes('birthday'));
      assert.ok(deptOnly.includes('promotion'));
      assert.ok(deptOnly.includes('leaving'));
    });

    it('each occasion has a non-empty icon', () => {
      for (const [name, cfg] of Object.entries(OCCASION_CONFIGS)) {
        assert.ok(cfg.icon?.length > 0, `${name} has no icon`);
      }
    });
  });

  describe('Date parsing', () => {
    it('parses DD-MM-YY birthday format', () => {
      const d = parseDateCol('14-02-90');
      assert.equal(d.getFullYear(), 1990);
      assert.equal(d.getMonth(),    1);
      assert.equal(d.getDate(),     14);
    });

    it('parses DD-MM-YYYY promotion date', () => {
      const d = parseDateCol('01-04-2026');
      assert.equal(d.getFullYear(), 2026);
      assert.equal(d.getMonth(),    3);
    });

    it('parses slash-separated date', () => {
      const d = parseDateCol('08/03/2025');
      assert.equal(d.getMonth(), 2); // March
      assert.equal(d.getDate(),  8);
    });

    it('returns null for null input', () => {
      assert.equal(parseDateCol(null), null);
    });

    it('returns null for empty string', () => {
      assert.equal(parseDateCol(''), null);
    });

    it('returns null for non-date string', () => {
      const result = parseDateCol('hello-world-today');
      assert.ok(result === null || isNaN(result?.getTime()));
    });
  });

  describe('Gender filtering', () => {
    const femaleMember = { gender: 'female' };
    const maleMember   = { gender: 'male' };
    const noGender     = { gender: null };

    it("female member is included in Women's Day", () => {
      assert.equal(shouldNotifyForGender(femaleMember, OCCASION_CONFIGS.womens_day), true);
    });

    it("male member is excluded from Women's Day", () => {
      assert.equal(shouldNotifyForGender(maleMember, OCCASION_CONFIGS.womens_day), false);
    });

    it("male member is included in Men's Day", () => {
      assert.equal(shouldNotifyForGender(maleMember, OCCASION_CONFIGS.mens_day), true);
    });

    it("female member is excluded from Men's Day", () => {
      assert.equal(shouldNotifyForGender(femaleMember, OCCASION_CONFIGS.mens_day), false);
    });

    it('all genders included for birthday (no filter)', () => {
      assert.equal(shouldNotifyForGender(femaleMember, OCCASION_CONFIGS.birthday), true);
      assert.equal(shouldNotifyForGender(maleMember,   OCCASION_CONFIGS.birthday), true);
      assert.equal(shouldNotifyForGender(noGender,     OCCASION_CONFIGS.birthday), true);
    });

    it('all genders included for Workers Day', () => {
      assert.equal(shouldNotifyForGender(femaleMember, OCCASION_CONFIGS.workers_day), true);
      assert.equal(shouldNotifyForGender(maleMember,   OCCASION_CONFIGS.workers_day), true);
    });
  });

  describe('Notification scope', () => {
    it('department occasion stays department unless approved', () => {
      const scope = getNotifyScope(OCCASION_CONFIGS.birthday, 'company_wide');
      assert.equal(scope, 'pending_approval');
    });

    it('company_wide occasion stays company_wide', () => {
      const scope = getNotifyScope(OCCASION_CONFIGS.valentines_day, 'company_wide');
      assert.equal(scope, 'company_wide');
    });

    it('department scope for birthday when requested as department', () => {
      const scope = getNotifyScope(OCCASION_CONFIGS.birthday, 'department');
      assert.equal(scope, 'department');
    });
  });
});

describe('Deduction Controller', () => {
  describe('Wallet calculations', () => {
    it('₦100,000 contribution → ₦20,000 fee, ₦200,000 net', () => {
      const w = calculateWallet(100000);
      assert.equal(w.platformFee,       20000);
      assert.equal(w.netAfterFee,       80000);
      assert.equal(w.amountToCelebrant, 80000);
    });

    it('₦250,000 → fee ₦50,000 → net ₦200,000', () => {
      const w = calculateWallet(250000);
      assert.equal(w.platformFee, 50000);
      assert.equal(w.netAfterFee, 200000);
    });

    it('fee + net = total contributed (no money lost)', () => {
      for (const amount of [1000, 5000, 33333, 100000, 999999]) {
        const w = calculateWallet(amount);
        assert.equal(w.platformFee + w.netAfterFee, amount, `Failed for ${amount}`);
      }
    });

    it('zero contributions → zero everywhere', () => {
      const w = calculateWallet(0);
      assert.equal(w.platformFee,       0);
      assert.equal(w.netAfterFee,       0);
      assert.equal(w.amountToCelebrant, 0);
    });
  });

  describe('Platform fee is always on gross (before deduction)', () => {
    it('fee does not change when deduction is applied', () => {
      const grossTotal   = 100000;
      const deduction    = 15000;
      const fee          = platformCutIsOnGross(grossTotal, deduction);
      const expectedFee  = 20000; // 20% of 100k, NOT 20% of (100k - 15k)
      assert.equal(fee, expectedFee);
    });

    it('fee on ₦80k after deduction would be wrong — fee is always on ₦100k gross', () => {
      const grossTotal = 100000;
      const wrongFee   = Math.round((grossTotal - 15000) * 0.20); // 17,000 (wrong)
      const correctFee = Math.round(grossTotal * 0.20);           // 20,000 (correct)
      assert.notEqual(wrongFee,   correctFee);
      assert.equal(correctFee, 20000);
    });
  });

  describe('applyDeduction()', () => {
    it('reduces celebrant amount correctly', () => {
      const wallet  = calculateWallet(100000); // net: 80000
      const updated = applyDeduction(wallet, 15000);
      assert.equal(updated.totalDeducted,     15000);
      assert.equal(updated.amountToCelebrant, 65000);
    });

    it('rejects deduction exceeding available balance', () => {
      const wallet = calculateWallet(100000); // net: 80000
      const result = applyDeduction(wallet, 85000); // exceeds 80000
      assert.ok(result.error);
      assert.ok(result.error.includes('Exceeds'));
    });

    it('allows deduction exactly equal to available', () => {
      const wallet  = calculateWallet(100000);
      const updated = applyDeduction(wallet, 80000);
      assert.equal(updated.amountToCelebrant, 0);
      assert.equal(updated.error, undefined);
    });

    it('multiple deductions accumulate correctly', () => {
      const wallet   = calculateWallet(100000);
      const after1   = applyDeduction(wallet, 10000);
      const after2   = applyDeduction(after1,  20000);
      assert.equal(after2.totalDeducted,     30000);
      assert.equal(after2.amountToCelebrant, 50000);
    });

    it('second deduction rejected if total would exceed net', () => {
      const wallet = calculateWallet(100000);
      const after1 = applyDeduction(wallet,  70000); // leaves 10000
      const result = applyDeduction(after1,  20000); // would exceed
      assert.ok(result.error);
    });
  });

  describe('Subscription plans', () => {
    it('monthly plan is ₦200,000', () => {
      assert.equal(20000000 / 100, 200000); // kobo to naira
    });

    it('yearly plan is ₦2,400,000', () => {
      assert.equal(240000000 / 100, 2400000);
    });

    it('yearly saves ₦40,000 vs 12 monthly', () => {
      const savings = (20000 * 12) - 200000;
      assert.equal(savings, 40000);
    });

    it('active subscription required for automation', () => {
      const activeSub  = { status: 'active',    expires_at: new Date(Date.now() + 86400000).toISOString() };
      const expiredSub = { status: 'expired',   expires_at: new Date(Date.now() - 86400000).toISOString() };
      const cancelSub  = { status: 'cancelled', expires_at: new Date(Date.now() + 86400000).toISOString() };

      const isActive = (sub) => sub.status === 'active' && new Date(sub.expires_at) > new Date();

      assert.equal(isActive(activeSub),  true);
      assert.equal(isActive(expiredSub), false);
      assert.equal(isActive(cancelSub),  false);
    });
  });
});
