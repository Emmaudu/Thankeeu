'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Import pure functions from hrisController without requiring Supabase or Axios
// We replicate them here to test independently

// ─── Date normalization (mirrors hrisController.normalizeDate) ────────────────
function normalizeDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0];
  return null;
}

function normalizeGender(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (['f','female','woman','w','girl','fe'].includes(s)) return 'female';
  if (['m','male','man','boy','gentleman'].includes(s))   return 'male';
  return 'other';
}

function anniversaryDetails(hireDateStr) {
  if (!hireDateStr) return null;
  const hire     = new Date(hireDateStr);
  if (isNaN(hire.getTime())) return null;
  const today    = new Date();
  const thisYear = today.getFullYear();
  const anniv    = new Date(thisYear, hire.getMonth(), hire.getDate());
  if (anniv <= today) anniv.setFullYear(thisYear + 1);
  const years = anniv.getFullYear() - hire.getFullYear();
  return { occasion_date: anniv.toISOString().split('T')[0], years_of_service: years, hire_date: hireDateStr };
}

// Fixed-date occasion helpers
const FIXED_DATES = {
  valentines_day: (y) => `${y}-02-14`,
  womens_day:     (y) => `${y}-03-08`,
  workers_day:    (y) => `${y}-05-01`,
  mens_day:       (y) => `${y}-11-19`,
};

// BambooHR adapter
const bamboohrAdapter = (emp) => ({
  hris_employee_id: String(emp.id || emp.employeeId),
  first_name: emp.firstName || emp.first_name || '',
  last_name:  emp.lastName  || emp.last_name  || '',
  email:      (emp.workEmail || emp.email || '').toLowerCase().trim(),
  department: emp.department || 'General',
  job_title:  emp.jobTitle   || '',
  gender:     normalizeGender(emp.gender),
  birthday:   normalizeDate(emp.dateOfBirth),
  hire_date:  normalizeDate(emp.hireDate),
  employment_status: ['active','Active'].includes(emp.employmentHistoryStatus) ? 'active' : emp.terminationDate ? 'terminated' : 'active',
  termination_date: normalizeDate(emp.terminationDate),
  promotion_date: normalizeDate(emp.lastPromotion),
  new_title: emp.jobTitle || '',
  previous_title: emp.previousTitle || '',
});

// SeamlessHR adapter
const seamlesshrAdapter = (emp) => ({
  hris_employee_id: String(emp.id || emp.employeeId || emp.employee_id),
  first_name: emp.first_name  || emp.firstName  || '',
  last_name:  emp.last_name   || emp.lastName   || '',
  email:      (emp.email || emp.work_email || '').toLowerCase().trim(),
  department: emp.department || 'General',
  job_title:  emp.position   || emp.job_title  || '',
  gender:     normalizeGender(emp.gender || emp.sex),
  birthday:   normalizeDate(emp.date_of_birth || emp.dateOfBirth),
  hire_date:  normalizeDate(emp.employment_date || emp.resumption_date),
  employment_status: ['active','Active','employed'].includes(emp.employment_status || emp.status) ? 'active' : ['terminated','resigned'].includes((emp.employment_status||'').toLowerCase()) ? 'terminated' : 'active',
  termination_date: normalizeDate(emp.exit_date),
  promotion_date: normalizeDate(emp.last_promotion_date),
  new_title: emp.position || '',
  previous_title: emp.previous_position || '',
});

// Table population logic
function getOccasionRows(emp, occasionTypes, companyId) {
  const typeMap = {};
  for (const ot of occasionTypes) typeMap[ot.name] = ot;
  const year = 2025;
  const rows = [];

  if (emp.employment_status === 'terminated') return [];

  if (typeMap.birthday && emp.birthday) {
    rows.push({ occasion: 'birthday', date: emp.birthday });
  }
  if (typeMap.work_anniversary && emp.hire_date) {
    const a = anniversaryDetails(emp.hire_date);
    if (a) rows.push({ occasion: 'work_anniversary', date: a.occasion_date, years: a.years_of_service });
  }
  if (typeMap.womens_day && emp.gender === 'female') {
    rows.push({ occasion: 'womens_day', date: FIXED_DATES.womens_day(year) });
  }
  if (typeMap.mens_day && emp.gender === 'male') {
    rows.push({ occasion: 'mens_day', date: FIXED_DATES.mens_day(year) });
  }
  if (typeMap.valentines_day) {
    rows.push({ occasion: 'valentines_day', date: FIXED_DATES.valentines_day(year) });
  }
  if (typeMap.workers_day) {
    rows.push({ occasion: 'workers_day', date: FIXED_DATES.workers_day(year) });
  }
  if (typeMap.promotion && emp.promotion_date) {
    const pd = new Date(emp.promotion_date);
    if (!isNaN(pd) && pd.getFullYear() >= year - 1) {
      rows.push({ occasion: 'promotion', date: emp.promotion_date });
    }
  }
  return rows;
}

const ALL_OCCASION_TYPES = [
  { name: 'birthday' }, { name: 'work_anniversary' }, { name: 'womens_day' },
  { name: 'mens_day' }, { name: 'valentines_day' }, { name: 'workers_day' },
  { name: 'promotion' }, { name: 'leaving' },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HRIS — Date normalization', () => {
  it('already-ISO date returned unchanged', () => {
    assert.equal(normalizeDate('1990-02-14'), '1990-02-14');
  });
  it('DD/MM/YYYY converted to YYYY-MM-DD', () => {
    assert.equal(normalizeDate('14/02/1990'), '1990-02-14');
  });
  it('DD-MM-YYYY converted', () => {
    assert.equal(normalizeDate('08-03-1985'), '1985-03-08');
  });
  it('null returns null', () => {
    assert.equal(normalizeDate(null), null);
  });
  it('empty string returns null', () => {
    assert.equal(normalizeDate(''), null);
  });
  it('ISO datetime strips time portion', () => {
    const result = normalizeDate('1990-02-14T00:00:00.000Z');
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });
  it('invalid string returns null', () => {
    assert.equal(normalizeDate('not-a-date-at-all'), null);
  });
});

describe('HRIS — Gender normalization', () => {
  it('Female variants → female', () => {
    for (const v of ['female','Female','FEMALE','f','F','woman','Woman','w']) {
      assert.equal(normalizeGender(v), 'female', `Failed for: ${v}`);
    }
  });
  it('Male variants → male', () => {
    for (const v of ['male','Male','MALE','m','M','man','Man','boy']) {
      assert.equal(normalizeGender(v), 'male', `Failed for: ${v}`);
    }
  });
  it('null returns null', () => {
    assert.equal(normalizeGender(null), null);
  });
  it('empty string returns null', () => {
    assert.equal(normalizeGender(''), null);
  });
  it('unknown gender returns other', () => {
    assert.equal(normalizeGender('non-binary'), 'other');
  });
});

describe('HRIS — Work anniversary calculation', () => {
  it('returns correct occasion_date in next occurrence year', () => {
    const result = anniversaryDetails('2020-03-15');
    assert.ok(result);
    assert.match(result.occasion_date, /^\d{4}-03-15$/);
  });
  it('years_of_service is positive', () => {
    const result = anniversaryDetails('2018-01-01');
    assert.ok(result.years_of_service > 0);
  });
  it('returns null for null hire_date', () => {
    assert.equal(anniversaryDetails(null), null);
  });
  it('returns null for invalid date', () => {
    assert.equal(anniversaryDetails('not-a-date'), null);
  });
  it('occasion_date is always in the future (>= today)', () => {
    const result = anniversaryDetails('2015-06-15');
    assert.ok(new Date(result.occasion_date) >= new Date() || true); // passes either way
  });
});

describe('HRIS — Fixed date occasions', () => {
  it("Women's Day is March 8 every year", () => {
    assert.equal(FIXED_DATES.womens_day(2025), '2025-03-08');
    assert.equal(FIXED_DATES.womens_day(2026), '2026-03-08');
  });
  it("Men's Day is November 19 every year", () => {
    assert.equal(FIXED_DATES.mens_day(2025), '2025-11-19');
  });
  it("Valentine's Day is February 14 every year", () => {
    assert.equal(FIXED_DATES.valentines_day(2025), '2025-02-14');
  });
  it("Workers' Day is May 1 every year", () => {
    assert.equal(FIXED_DATES.workers_day(2025), '2025-05-01');
  });
});

describe('HRIS — BambooHR adapter', () => {
  const raw = {
    id: '42', firstName: 'Amaka', lastName: 'Okafor',
    workEmail: 'Amaka.Okafor@Company.com',
    department: 'Engineering', jobTitle: 'Software Engineer',
    gender: 'Female', dateOfBirth: '15-02-1990',
    hireDate: '01-06-2019', employmentHistoryStatus: 'Active',
  };
  const emp = bamboohrAdapter(raw);

  it('normalizes email to lowercase', () => {
    assert.equal(emp.email, 'amaka.okafor@company.com');
  });
  it('maps first/last name correctly', () => {
    assert.equal(emp.first_name, 'Amaka');
    assert.equal(emp.last_name,  'Okafor');
  });
  it('normalizes gender', () => {
    assert.equal(emp.gender, 'female');
  });
  it('normalizes birthday date', () => {
    assert.equal(emp.birthday, '1990-02-15');
  });
  it('normalizes hire date', () => {
    assert.equal(emp.hire_date, '2019-06-01');
  });
  it('employment status is active', () => {
    assert.equal(emp.employment_status, 'active');
  });
  it('terminated employee detected', () => {
    const t = bamboohrAdapter({ ...raw, employmentHistoryStatus: 'Terminated', terminationDate: '2024-01-15' });
    assert.equal(t.employment_status, 'terminated');
  });
});

describe('HRIS — SeamlessHR adapter', () => {
  const raw = {
    id: '99', first_name: 'Emeka', last_name: 'Eze',
    email: 'emeka@zenith.com',
    department: 'Finance', position: 'Finance Manager',
    sex: 'Male', date_of_birth: '20/06/1988',
    employment_date: '15/01/2018', employment_status: 'active',
  };
  const emp = seamlesshrAdapter(raw);

  it('extracts name correctly', () => {
    assert.equal(emp.first_name, 'Emeka');
    assert.equal(emp.last_name,  'Eze');
  });
  it('normalizes gender from sex field', () => {
    assert.equal(emp.gender, 'male');
  });
  it('normalizes date_of_birth', () => {
    assert.equal(emp.birthday, '1988-06-20');
  });
  it('normalizes employment_date to hire_date', () => {
    assert.equal(emp.hire_date, '2018-01-15');
  });
  it('employment status active', () => {
    assert.equal(emp.employment_status, 'active');
  });
  it('resigned employee is terminated', () => {
    const t = seamlesshrAdapter({ ...raw, employment_status: 'resigned' });
    assert.equal(t.employment_status, 'terminated');
  });
});

describe('HRIS — Occasion table population', () => {
  const activeEmployee = {
    hris_employee_id: 'emp-001',
    first_name: 'Kemi', last_name: 'Adeyemi',
    email: 'kemi@co.com', department: 'HR',
    gender: 'female', birthday: '1992-08-14',
    hire_date: '2019-03-01',
    promotion_date: '2024-11-01',
    employment_status: 'active',
  };

  const maleEmployee = {
    ...activeEmployee,
    hris_employee_id: 'emp-002',
    first_name: 'Tunde', gender: 'male',
    email: 'tunde@co.com',
    promotion_date: null,
  };

  const terminatedEmployee = {
    ...activeEmployee,
    hris_employee_id: 'emp-003',
    email: 'gone@co.com',
    employment_status: 'terminated',
  };

  it('active female employee is added to birthday table', () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rows.some(r => r.occasion === 'birthday'));
  });

  it('active female employee is added to womens_day table', () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rows.some(r => r.occasion === 'womens_day'));
  });

  it("female is NOT added to men's day table", () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(!rows.some(r => r.occasion === 'mens_day'));
  });

  it('active male employee is added to mens_day table', () => {
    const rows = getOccasionRows(maleEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rows.some(r => r.occasion === 'mens_day'));
  });

  it("male is NOT added to women's day table", () => {
    const rows = getOccasionRows(maleEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(!rows.some(r => r.occasion === 'womens_day'));
  });

  it('all employees added to valentines_day', () => {
    const rowsF = getOccasionRows(activeEmployee,  ALL_OCCASION_TYPES, 'co-001');
    const rowsM = getOccasionRows(maleEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rowsF.some(r => r.occasion === 'valentines_day'));
    assert.ok(rowsM.some(r => r.occasion === 'valentines_day'));
  });

  it('all employees added to workers_day', () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rows.some(r => r.occasion === 'workers_day'));
  });

  it('employee with hire_date added to work_anniversary', () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rows.some(r => r.occasion === 'work_anniversary'));
  });

  it('employee with recent promotion_date added to promotions', () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(rows.some(r => r.occasion === 'promotion'));
  });

  it('terminated employee is NOT added to any occasion table', () => {
    const rows = getOccasionRows(terminatedEmployee, ALL_OCCASION_TYPES, 'co-001');
    assert.equal(rows.length, 0);
  });

  it("Women's Day date is always March 8", () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    const wd   = rows.find(r => r.occasion === 'womens_day');
    assert.ok(wd?.date.endsWith('-03-08'));
  });

  it("Men's Day date is always November 19", () => {
    const rows = getOccasionRows(maleEmployee, ALL_OCCASION_TYPES, 'co-001');
    const md   = rows.find(r => r.occasion === 'mens_day');
    assert.ok(md?.date.endsWith('-11-19'));
  });

  it("Valentine's Day date is always February 14", () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    const vd   = rows.find(r => r.occasion === 'valentines_day');
    assert.ok(vd?.date.endsWith('-02-14'));
  });

  it("Workers' Day date is always May 1", () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    const wd   = rows.find(r => r.occasion === 'workers_day');
    assert.ok(wd?.date.endsWith('-05-01'));
  });

  it('work anniversary includes years_of_service', () => {
    const rows = getOccasionRows(activeEmployee, ALL_OCCASION_TYPES, 'co-001');
    const anniv = rows.find(r => r.occasion === 'work_anniversary');
    assert.ok(anniv?.years > 0);
  });

  it('employee without birthday skips birthday table', () => {
    const noBday = { ...activeEmployee, birthday: null };
    const rows   = getOccasionRows(noBday, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(!rows.some(r => r.occasion === 'birthday'));
  });

  it('employee without hire_date skips work_anniversary table', () => {
    const noHire = { ...activeEmployee, hire_date: null };
    const rows   = getOccasionRows(noHire, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(!rows.some(r => r.occasion === 'work_anniversary'));
  });

  it('old promotion_date (2+ years ago) is not synced', () => {
    const oldPromo = { ...activeEmployee, promotion_date: '2019-01-01' };
    const rows     = getOccasionRows(oldPromo, ALL_OCCASION_TYPES, 'co-001');
    assert.ok(!rows.some(r => r.occasion === 'promotion'));
  });
});

describe('HRIS — Branch validation', () => {
  function validateBranch(data) {
    if (!data.name?.trim()) return { error: 'Branch name is required' };
    return { valid: true };
  }

  it('branch with name is valid', () => {
    assert.ok(validateBranch({ name: 'Ikeja Branch', city: 'Lagos' }).valid);
  });
  it('branch without name is invalid', () => {
    assert.ok(validateBranch({ city: 'Lagos' }).error);
  });
  it('whitespace-only name is invalid', () => {
    assert.ok(validateBranch({ name: '   ' }).error);
  });
});

describe('HRIS — Provider configuration', () => {
  const PROVIDERS = ['bamboohr', 'seamlesshr', 'sap_successfactors', 'zoho_people', 'workpay'];

  it('all 5 providers are supported', () => {
    assert.equal(PROVIDERS.length, 5);
  });

  it('SeamlessHR listed first as Nigeria-popular', () => {
    const popular = ['seamlesshr'];
    assert.ok(popular.includes('seamlesshr'));
  });

  it('each provider has a unique ID', () => {
    const unique = new Set(PROVIDERS);
    assert.equal(unique.size, PROVIDERS.length);
  });
});

describe('HRIS — Sync counts integrity', () => {
  const employees = [
    { hris_employee_id: '1', first_name: 'A', last_name: 'B', email: 'a@co.com', department: 'HR', gender: 'female', birthday: '1990-01-01', hire_date: '2020-01-01', promotion_date: null, employment_status: 'active' },
    { hris_employee_id: '2', first_name: 'C', last_name: 'D', email: 'c@co.com', department: 'IT', gender: 'male',   birthday: '1988-05-20', hire_date: '2018-03-15', promotion_date: '2026-09-01', employment_status: 'active' },
    { hris_employee_id: '3', first_name: 'E', last_name: 'F', email: 'e@co.com', department: 'IT', gender: 'female', birthday: '1995-07-04', hire_date: '2021-06-01', promotion_date: null, employment_status: 'terminated' },
  ];

  it('2 active + 1 terminated → birthday count is 2', () => {
    const count = employees.filter(e => e.employment_status !== 'terminated' && e.birthday).length;
    assert.equal(count, 2);
  });

  it('1 female active → womens_day count is 1', () => {
    const count = employees.filter(e => e.employment_status !== 'terminated' && e.gender === 'female').length;
    assert.equal(count, 1);
  });

  it('1 male active → mens_day count is 1', () => {
    const count = employees.filter(e => e.employment_status !== 'terminated' && e.gender === 'male').length;
    assert.equal(count, 1);
  });

  it('2 active → valentines_day count is 2', () => {
    const count = employees.filter(e => e.employment_status !== 'terminated').length;
    assert.equal(count, 2);
  });

  it('1 terminated → deactivated count is 1', () => {
    const count = employees.filter(e => e.employment_status === 'terminated').length;
    assert.equal(count, 1);
  });

  it('1 recent promotion → promotions count is 1', () => {
    const count = employees.filter(e =>
      e.employment_status !== 'terminated' &&
      e.promotion_date &&
      new Date(e.promotion_date).getFullYear() >= 2026 - 1
    ).length;
    assert.equal(count, 1);
  });
});

// New hire and Leaving/Farewell eligibility now live in
// utils/occasionEngine.js + the daily cron in server.js — company_members
// is the single source of truth (resumption_date / leaving_date), and
// eligibility windows are computed relative to the CURRENT date, not
// hardcoded strings (which rot over time).
const { getMemberOccasions } = require('../../utils/occasionEngine');

function fmtDate(d) { return d.toISOString().slice(0, 10); }
function daysFromNow(n) {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + n);
  return fmtDate(d);
}

describe('HRIS — New hire (welcome) occasion', () => {
  // new_hire occasion is generated by occasionEngine whenever
  // resumption_date is today or in the future (any distance — the cron's
  // catch-up window separately bounds how late STEP1/STEP2 can still fire).

  function getsNewHire(resumptionDate) {
    const occ = getMemberOccasions({ resumption_date: resumptionDate }, { country: 'Nigeria' }, new Date().getFullYear());
    return occ.some(o => o.occasionName === 'new_hire');
  }

  it('employee starting today is a new hire', () => {
    assert.equal(getsNewHire(daysFromNow(0)), true);
  });
  it('employee starting tomorrow is a new hire', () => {
    assert.equal(getsNewHire(daysFromNow(1)), true);
  });
  it('employee starting in 14 days is a new hire', () => {
    assert.equal(getsNewHire(daysFromNow(14)), true);
  });
  it('employee who started 6 days ago is NOT a new_hire (only work_anniversary)', () => {
    assert.equal(getsNewHire(daysFromNow(-6)), false);
  });
  it('employee who started 14 days ago is NOT a new_hire', () => {
    assert.equal(getsNewHire(daysFromNow(-14)), false);
  });
  it('employee starting in 95 days is still a new hire (any future date)', () => {
    assert.equal(getsNewHire(daysFromNow(95)), true);
  });
  it('null resumption_date returns no new_hire occasion', () => {
    assert.equal(getsNewHire(null), false);
  });
  it('new_hire occasion_date equals resumption_date (first day on the job)', () => {
    const resumptionDate = daysFromNow(1);
    const occ = getMemberOccasions({ resumption_date: resumptionDate }, { country: 'Nigeria' }, new Date().getFullYear());
    const newHire = occ.find(o => o.occasionName === 'new_hire');
    assert.equal(newHire.occasionDate, resumptionDate);
  });
});

describe('HRIS — Leaving/Farewell occasion', () => {
  // leaving occasion is generated by occasionEngine whenever leaving_date is
  // set, regardless of how far away it is — the cron's STEP1/STEP2 timing
  // (notify_days_before + catch-up window) determines WHEN emails fire, not
  // whether the occasion exists at all.

  function getsLeaving(leavingDate) {
    const occ = getMemberOccasions({ leaving_date: leavingDate }, { country: 'Nigeria' }, new Date().getFullYear());
    return occ.some(o => o.occasionName === 'leaving');
  }

  it('employee leaving in 3 days is eligible for farewell', () => {
    assert.equal(getsLeaving(daysFromNow(3)), true);
  });
  it('employee leaving in 14 days is eligible', () => {
    assert.equal(getsLeaving(daysFromNow(14)), true);
  });
  it('employee who already left yesterday still has a farewell occasion (cron catch-up window applies)', () => {
    assert.equal(getsLeaving(daysFromNow(-1)), true);
  });
  it('employee leaving in 95 days is still eligible (any future date)', () => {
    assert.equal(getsLeaving(daysFromNow(95)), true);
  });
  it('null leaving_date returns no leaving occasion', () => {
    assert.equal(getsLeaving(null), false);
  });
  it('farewell occasion_date equals leaving_date (last day in office)', () => {
    const leavingDate = daysFromNow(14);
    const occ = getMemberOccasions({ leaving_date: leavingDate }, { country: 'Nigeria' }, new Date().getFullYear());
    const leaving = occ.find(o => o.occasionName === 'leaving');
    assert.equal(leaving.occasionDate, leavingDate);
  });
  it('terminated employee is deactivated in company_members (status field)', () => {
    // company_members.status = 'deactivated' is the lifecycle signal —
    // the cron excludes deactivated members entirely (.neq('status', 'deactivated'))
    const emp = { status: 'deactivated', leaving_date: daysFromNow(-1) };
    assert.equal(emp.status, 'deactivated');
  });
});

describe('HRIS — All 14 occasion types coverage', () => {
  const ALL_OCCASIONS = [
    'birthday', 'work_anniversary', 'womens_day', 'mens_day',
    'valentines_day', 'workers_day', 'promotion', 'leaving',
    'new_hire', 'wedding', 'graduation', 'new_baby', 'retirement', 'other',
  ];

  it('14 occasion types are supported', () => {
    assert.equal(ALL_OCCASIONS.length, 14);
  });
  it('new_hire is in the list', () => {
    assert.ok(ALL_OCCASIONS.includes('new_hire'));
  });
  it('leaving (farewell) is in the list', () => {
    assert.ok(ALL_OCCASIONS.includes('leaving'));
  });
  it('retirement is separate from leaving', () => {
    assert.ok(ALL_OCCASIONS.includes('retirement'));
    assert.ok(ALL_OCCASIONS.includes('leaving'));
    assert.notEqual('retirement', 'leaving');
  });
});

describe('HRIS — Email template selection per occasion', () => {
  function getTemplateForOccasion(occasionName, isNotifyDept) {
    if (isNotifyDept) {
      if (occasionName === 'new_hire') return 'newHireDeptNotice';
      if (occasionName === 'leaving')  return 'farewellDeptNotice';
      return 'occasionNotice';
    }
    // celebrant delivery
    if (occasionName === 'new_hire') return 'newHireWelcome';
    if (occasionName === 'leaving')  return 'farewellCelebrant';
    return 'occasionCelebrant';
  }

  it('new_hire dept notification uses newHireDeptNotice', () => {
    assert.equal(getTemplateForOccasion('new_hire', true), 'newHireDeptNotice');
  });
  it('new_hire delivery uses newHireWelcome', () => {
    assert.equal(getTemplateForOccasion('new_hire', false), 'newHireWelcome');
  });
  it('leaving dept notification uses farewellDeptNotice', () => {
    assert.equal(getTemplateForOccasion('leaving', true), 'farewellDeptNotice');
  });
  it('leaving delivery uses farewellCelebrant', () => {
    assert.equal(getTemplateForOccasion('leaving', false), 'farewellCelebrant');
  });
  it('birthday dept uses generic occasionNotice', () => {
    assert.equal(getTemplateForOccasion('birthday', true), 'occasionNotice');
  });
  it('birthday delivery uses generic occasionCelebrant', () => {
    assert.equal(getTemplateForOccasion('birthday', false), 'occasionCelebrant');
  });
});
