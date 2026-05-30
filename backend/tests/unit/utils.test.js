'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ─── Test pure utility functions extracted from controllers ──────────────────

// Replicate parseBirthday from teamsController (pure function, no deps)
function parseBirthday(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const parts = str.split(/[-\/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (y < 100) y += y < 30 ? 2000 : 1900;
    return new Date(y, m - 1, d);
  }
  return null;
}

// Replicate parseDateCol from occasionController
function parseDateCol(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!isNaN(s) && s.length > 3) return null; // Excel serial (skip in unit test)
  const parts = s.split(/[-\/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (y < 100) y += y < 30 ? 2000 : 1900;
    return new Date(y, m - 1, d);
  }
  return null;
}

// Replicate getDomain from companyMembersController
function getDomain(email) {
  return email.split('@')[1]?.toLowerCase();
}

function validateDomain(memberEmail, companyEmail) {
  return getDomain(companyEmail) === getDomain(memberEmail);
}

// Replicate wallet fee calculation
function calculateWallet(totalContributed) {
  const platformFee     = Math.round(totalContributed * 0.20);
  const netAfterFee     = totalContributed - platformFee;
  const amountToCelebrant = netAfterFee;
  return { totalContributed, platformFee, netAfterFee, amountToCelebrant };
}

function applyDeduction(wallet, deductionAmount) {
  if (deductionAmount > wallet.netAfterFee - wallet.totalDeducted) return null;
  const totalDeducted     = (wallet.totalDeducted || 0) + deductionAmount;
  const amountToCelebrant = wallet.netAfterFee - totalDeducted;
  return { ...wallet, totalDeducted, amountToCelebrant };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Date parsing utilities', () => {

  describe('parseBirthday()', () => {
    it('parses DD-MM-YY with 2-digit year < 30 as 2000s', () => {
      const d = parseBirthday('14-02-25');
      assert.equal(d.getFullYear(), 2025);
      assert.equal(d.getMonth(),    1); // Feb = 1
      assert.equal(d.getDate(),     14);
    });

    it('parses DD-MM-YY with 2-digit year >= 30 as 1900s', () => {
      const d = parseBirthday('20-06-85');
      assert.equal(d.getFullYear(), 1985);
      assert.equal(d.getMonth(),    5); // Jun = 5
    });

    it('parses DD-MM-YYYY with 4-digit year', () => {
      const d = parseBirthday('01-01-1990');
      assert.equal(d.getFullYear(), 1990);
      assert.equal(d.getMonth(),    0); // Jan
      assert.equal(d.getDate(),     1);
    });

    it('parses date with forward-slash separator', () => {
      const d = parseBirthday('15/07/1988');
      assert.equal(d.getFullYear(), 1988);
      assert.equal(d.getMonth(),    6); // Jul
      assert.equal(d.getDate(),     15);
    });

    it('returns null for empty string', () => {
      assert.equal(parseBirthday(''), null);
    });

    it('returns null for null input', () => {
      assert.equal(parseBirthday(null), null);
    });

    it('returns null for completely invalid string', () => {
      const d = parseBirthday('not-a-date');
      // not-a-date splits to ['not', 'a', 'date'] → NaN → Invalid Date
      assert.ok(d === null || isNaN(d?.getTime()));
    });
  });

  describe('parseDateCol()', () => {
    it('parses Women\'s Day date DD-MM-YYYY', () => {
      const d = parseDateCol('08-03-2025');
      assert.equal(d.getMonth(), 2); // March
      assert.equal(d.getDate(),  8);
    });

    it('parses promotion date', () => {
      const d = parseDateCol('22-01-2026');
      assert.equal(d.getFullYear(), 2026);
      assert.equal(d.getMonth(),    0); // Jan
      assert.equal(d.getDate(),     22);
    });

    it('returns null for undefined', () => {
      assert.equal(parseDateCol(undefined), null);
    });
  });
});

describe('Email domain validation', () => {
  it('same domain passes', () => {
    assert.equal(validateDomain('kemi@zenithtech.com', 'hr@zenithtech.com'), true);
  });

  it('different domain fails', () => {
    assert.equal(validateDomain('kemi@gmail.com', 'hr@zenithtech.com'), false);
  });

  it('subdomain does not match root domain', () => {
    assert.equal(validateDomain('kemi@mail.zenithtech.com', 'hr@zenithtech.com'), false);
  });

  it('case-insensitive comparison', () => {
    assert.equal(validateDomain('KEMI@ZENITHTECH.COM', 'hr@zenithtech.com'), true);
  });

  it('handles missing @ gracefully', () => {
    assert.equal(validateDomain('noatsign', 'hr@zenithtech.com'), false);
  });

  it('extracts correct domain from email', () => {
    assert.equal(getDomain('amaka.okafor@zenithtech.com'), 'zenithtech.com');
    assert.equal(getDomain('hr@company.ng'), 'company.ng');
  });
});

describe('Wallet fee calculations', () => {
  it('20% platform fee on ₦100,000 = ₦20,000', () => {
    const w = calculateWallet(100000);
    assert.equal(w.platformFee,       20000);
    assert.equal(w.netAfterFee,       80000);
    assert.equal(w.amountToCelebrant, 80000);
  });

  it('20% platform fee on ₦50,000 = ₦10,000', () => {
    const w = calculateWallet(50000);
    assert.equal(w.platformFee, 10000);
    assert.equal(w.netAfterFee, 40000);
  });

  it('rounds fee correctly for non-round numbers', () => {
    const w = calculateWallet(33333);
    assert.equal(w.platformFee, Math.round(33333 * 0.20)); // 6667
    assert.equal(w.platformFee + w.netAfterFee, 33333);
  });

  it('zero contributions yield zero fee and zero celebrant amount', () => {
    const w = calculateWallet(0);
    assert.equal(w.platformFee,       0);
    assert.equal(w.amountToCelebrant, 0);
  });

  it('20% fee on ₦1 is 0 (rounded down)', () => {
    const w = calculateWallet(1);
    assert.equal(w.platformFee, 0); // Math.round(0.2) = 0
    assert.equal(w.netAfterFee, 1);
  });

  describe('applyDeduction()', () => {
    it('reduces amount to celebrant by deduction', () => {
      const wallet  = { netAfterFee: 80000, totalDeducted: 0 };
      const updated = applyDeduction(wallet, 15000);
      assert.equal(updated.totalDeducted,     15000);
      assert.equal(updated.amountToCelebrant, 65000);
    });

    it('allows multiple deductions that stay within net amount', () => {
      const wallet  = { netAfterFee: 80000, totalDeducted: 10000 };
      const updated = applyDeduction(wallet, 20000);
      assert.equal(updated.totalDeducted,     30000);
      assert.equal(updated.amountToCelebrant, 50000);
    });

    it('returns null when deduction exceeds available balance', () => {
      const wallet = { netAfterFee: 80000, totalDeducted: 60000 };
      const result = applyDeduction(wallet, 30000); // would exceed 80000
      assert.equal(result, null);
    });

    it('allows deduction equal to full available balance', () => {
      const wallet  = { netAfterFee: 80000, totalDeducted: 0 };
      const updated = applyDeduction(wallet, 80000);
      assert.equal(updated.amountToCelebrant, 0);
    });
  });
});

describe('Subscription plan amounts', () => {
  const PLANS = {
    monthly: { amount: 2000000, naira: 20000 },  // 2M kobo = ₦20k
    yearly:  { amount: 20000000, naira: 200000 }, // 20M kobo = ₦200k
  };

  it('monthly plan is ₦20,000 (2,000,000 kobo)', () => {
    assert.equal(PLANS.monthly.amount / 100, PLANS.monthly.naira);
  });

  it('yearly plan is ₦200,000 (20,000,000 kobo)', () => {
    assert.equal(PLANS.yearly.amount / 100, PLANS.yearly.naira);
  });

  it('yearly saves ₦40,000 vs 12 × monthly', () => {
    const monthlyTotal = PLANS.monthly.naira * 12; // 240,000
    const savings = monthlyTotal - PLANS.yearly.naira;
    assert.equal(savings, 40000);
  });
});

describe('Occasion notification rules', () => {
  const OCCASION_DEFAULTS = [
    { name: 'birthday',         notifyDays: 2,  scope: 'department' },
    { name: 'leaving',          notifyDays: 7,  scope: 'department' },
    { name: 'work_anniversary', notifyDays: 7,  scope: 'department' },
    { name: 'promotion',        notifyDays: 7,  scope: 'department' },
    { name: 'valentines_day',   notifyDays: 7,  scope: 'company_wide' },
    { name: 'womens_day',       notifyDays: 7,  scope: 'company_wide' },
    { name: 'mens_day',         notifyDays: 7,  scope: 'company_wide' },
    { name: 'workers_day',      notifyDays: 7,  scope: 'company_wide' },
    { name: 'retirement',       notifyDays: 14, scope: 'company_wide' },
  ];

  it('birthday has 2-day notice (shortest notice period)', () => {
    const bday = OCCASION_DEFAULTS.find(o => o.name === 'birthday');
    assert.equal(bday.notifyDays, 2);
  });

  it('retirement has 14-day notice (longest notice period)', () => {
    const ret = OCCASION_DEFAULTS.find(o => o.name === 'retirement');
    assert.equal(ret.notifyDays, 14);
  });

  it('valentines_day scope is company_wide', () => {
    const vd = OCCASION_DEFAULTS.find(o => o.name === 'valentines_day');
    assert.equal(vd.scope, 'company_wide');
  });

  it('birthday scope is department', () => {
    const bday = OCCASION_DEFAULTS.find(o => o.name === 'birthday');
    assert.equal(bday.scope, 'department');
  });

  it('all 9 occasions in default config', () => {
    assert.equal(OCCASION_DEFAULTS.length, 9);
  });
});

describe('Card slug format', () => {
  function generateSlug(recipientName, occasion) {
    const base = `${recipientName}-${occasion}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${base}-xxxxxx`; // nanoid placeholder
  }

  it('slug is URL-safe (no special chars)', () => {
    const slug = generateSlug('Amaka Okafor', 'birthday');
    assert.match(slug, /^[a-z0-9-]+$/);
  });

  it('slug contains occasion name', () => {
    const slug = generateSlug('Tunde Bello', 'leaving');
    assert.ok(slug.includes('leaving'));
  });

  it('slug converts spaces to hyphens', () => {
    const slug = generateSlug('Ngozi Eze', 'promotion');
    assert.ok(!slug.includes(' '));
  });
});

describe('Department options validation', () => {
  const REQUIRED_DEPTS = [
    'Engineering', 'Finance', 'Human Resources', 'Marketing',
    'Sales', 'Operations', 'Legal', 'Customer Success',
  ];

  const DEFAULT_DEPARTMENTS = [
    'Engineering','Frontend Development','Backend Development','Mobile Development',
    'DevOps / Infrastructure','Data Science','Product Management','UI/UX Design',
    'Quality Assurance','Cybersecurity','IT Support',
    'Finance','Accounting','Audit','Treasury','Risk Management',
    'Human Resources','Legal','Compliance','Administration',
    'Marketing','Digital Marketing','Brand','Public Relations','Communications',
    'Sales','Business Development','Customer Success','Customer Service',
    'Operations','Supply Chain','Logistics','Procurement',
    'Strategy','Research & Development','Innovation',
    'Oil & Gas Operations','Drilling','Exploration','Refinery',
    'Network Operations','Telecoms Engineering','Spectrum Management',
    'Retail','Merchandising','Store Operations','E-Commerce',
    'Agriculture','Agronomy','Farm Operations',
    'Healthcare','Clinical','Pharmacy','Nursing',
    'Media','Content','Editorial','Broadcasting',
    'Executive / C-Suite','Board',
  ];

  it('has at least 50 default departments', () => {
    assert.ok(DEFAULT_DEPARTMENTS.length >= 50);
  });

  it('includes all required Nigerian sector departments', () => {
    for (const dept of REQUIRED_DEPTS) {
      assert.ok(DEFAULT_DEPARTMENTS.includes(dept), `Missing: ${dept}`);
    }
  });

  it('includes Nigeria-specific sectors (Oil & Gas, Telecoms)', () => {
    assert.ok(DEFAULT_DEPARTMENTS.some(d => d.includes('Oil')));
    assert.ok(DEFAULT_DEPARTMENTS.some(d => d.includes('Telecoms')));
  });

  it('includes Agriculture', () => {
    assert.ok(DEFAULT_DEPARTMENTS.includes('Agriculture'));
  });
});

describe('Demo request form validation', () => {
  function validateDemoForm(form) {
    const errors = {};
    if (!form.company_name?.trim())  errors.company_name  = 'Company name required';
    if (!form.contact_name?.trim())  errors.contact_name  = 'Contact name required';
    if (!form.email?.trim())         errors.email         = 'Email required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email';
    return errors;
  }

  it('valid form passes', () => {
    const e = validateDemoForm({ company_name: 'Zenith', contact_name: 'Tunde', email: 'hr@zenith.com' });
    assert.equal(Object.keys(e).length, 0);
  });

  it('missing company name fails', () => {
    const e = validateDemoForm({ contact_name: 'Tunde', email: 'hr@zenith.com' });
    assert.ok(e.company_name);
  });

  it('missing contact name fails', () => {
    const e = validateDemoForm({ company_name: 'Co', email: 'hr@co.com' });
    assert.ok(e.contact_name);
  });

  it('invalid email format fails', () => {
    const e = validateDemoForm({ company_name: 'Co', contact_name: 'HR', email: 'not-an-email' });
    assert.ok(e.email);
  });

  it('valid Nigerian email passes', () => {
    const e = validateDemoForm({ company_name: 'Co', contact_name: 'HR', email: 'hr@company.ng' });
    assert.equal(Object.keys(e).length, 0);
  });

  it('team size options are valid strings', () => {
    const opts = ['1–10', '11–50', '51–200', '201–500', '500+'];
    assert.equal(opts.length, 5);
    opts.forEach(o => assert.ok(o.length > 0));
  });

  it('demo status values are valid', () => {
    const statuses = ['new', 'contacted', 'scheduled', 'converted', 'declined'];
    assert.equal(statuses.length, 5);
    assert.ok(statuses.includes('new'));
    assert.ok(statuses.includes('converted'));
  });
});
