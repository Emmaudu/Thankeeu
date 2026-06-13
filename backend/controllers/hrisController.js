'use strict';
const axios   = require('axios');
const supabase = require('../utils/supabase');
const bcrypt  = require('bcryptjs');
const argon2  = require('argon2');
const crypto  = require('crypto');
const { sendEmail } = require('../utils/email');

const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });

// Resolve the frontend base URL from env (same pattern used elsewhere)
const frontendUrl = (() => {
  const r = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = r.trim();
  if (s.includes('=') && !s.startsWith('http')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  return (s.replace(/['"\/]$/g, '').startsWith('http')) ? s.replace(/\/$/, '') : 'https://thankeeu.com';
})();

// ─── Fixed-date occasion helpers ─────────────────────────────────────────────
// Returns the occasion_date for this calendar year for fixed-date occasions
const FIXED_DATES = {
  valentines_day: (y) => `${y}-02-14`,
  womens_day:     (y) => `${y}-03-08`,
  workers_day:    (y) => `${y}-05-01`,
  mens_day:       (y) => `${y}-11-19`,
};

function thisYearDate(month, day) {
  const y = new Date().getFullYear();
  return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// Parse a date string to YYYY-MM-DD (handles multiple formats)
function normalizeDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // MM/DD/YYYY (US format)
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`;
  // ISO with time
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

// Calculate work anniversary date for current year and years of service
function anniversaryDetails(hireDateStr) {
  if (!hireDateStr) return null;
  const hire    = new Date(hireDateStr);
  const today   = new Date();
  const thisYear = today.getFullYear();
  const anniv   = new Date(thisYear, hire.getMonth(), hire.getDate());
  if (anniv <= today) anniv.setFullYear(thisYear + 1);
  const years = anniv.getFullYear() - hire.getFullYear();
  return { occasion_date: anniv.toISOString().split('T')[0], years_of_service: years, hire_date: hireDateStr };
}

// ─── Provider adapters — normalize raw employee to Thankeeu format ─────────
const ADAPTERS = {

  bamboohr: (emp) => ({
    hris_employee_id: String(emp.id || emp.employeeId),
    first_name:       emp.firstName || emp.first_name || '',
    last_name:        emp.lastName  || emp.last_name  || '',
    email:            (emp.workEmail || emp.email || '').toLowerCase().trim(),
    department:       emp.department || emp.Department || 'General',
    job_title:        emp.jobTitle   || emp.position  || '',
    gender:           normalizeGender(emp.gender || emp.Gender),
    birthday:         normalizeDate(emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.hireDate || emp.hire_date || emp.startDate),
    employment_status:
      ['active','Active','ACTIVE'].includes(emp.employmentHistoryStatus) ? 'active' :
      emp.terminationDate ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.terminationDate),
    promotion_date:   normalizeDate(emp.lastPromotion || emp.promotionDate),
    new_title:        emp.jobTitle || '',
    previous_title:   emp.previousTitle || '',
  }),

  seamlesshr: (emp) => ({
    hris_employee_id: String(emp.id || emp.employeeId || emp.employee_id),
    first_name:       emp.first_name  || emp.firstName  || '',
    last_name:        emp.last_name   || emp.lastName   || '',
    email:            (emp.email || emp.work_email || emp.workEmail || '').toLowerCase().trim(),
    department:       emp.department  || emp.Department || 'General',
    job_title:        emp.position    || emp.job_title  || emp.jobTitle || '',
    gender:           normalizeGender(emp.gender || emp.sex),
    birthday:         normalizeDate(emp.date_of_birth || emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.employment_date || emp.hireDate || emp.hire_date || emp.resumption_date),
    employment_status:
      ['active','Active','ACTIVE','employed'].includes(emp.employment_status || emp.status) ? 'active' :
      ['terminated','resigned','dismissed'].includes((emp.employment_status || '').toLowerCase()) ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.exit_date || emp.terminationDate),
    promotion_date:   normalizeDate(emp.last_promotion_date || emp.promotionDate),
    new_title:        emp.position || emp.job_title || '',
    previous_title:   emp.previous_position || '',
  }),

  sap_successfactors: (emp) => ({
    hris_employee_id: String(emp.userId   || emp.personIdExternal || emp.id),
    first_name:       emp.firstName        || emp.first_name || '',
    last_name:        emp.lastName         || emp.last_name  || '',
    email:            (emp.email || emp.defaultFullName || '').toLowerCase().trim(),
    department:       emp.department       || emp.Division   || 'General',
    job_title:        emp.title            || emp.jobTitle   || emp.position || '',
    gender:           normalizeGender(emp.gender || emp.sex),
    birthday:         normalizeDate(emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.startDate || emp.hireDate || emp.originalStartDate),
    employment_status:
      ['active','Active','ACTIVE','A'].includes(emp.status || emp.employmentStatus) ? 'active' :
      ['terminated','T','Terminated'].includes(emp.status || '') ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.endDate || emp.terminationDate),
    promotion_date:   normalizeDate(emp.lastChangeDate),
    new_title:        emp.title || '',
    previous_title:   '',
  }),

  zoho_people: (emp) => {
    // EXACT Zoho People column names (confirmed by account owner):
    // 'First Name', 'Last Name', 'Email address', 'Department',
    // 'Designation' → determines role (member/leader),
    // 'Zoho Role'   → job title shown in the app,
    // 'Date of Joining' → work anniversary trigger,
    // 'Date of Birth'   → birthday trigger,
    // 'Gender', 'Personal Mobile Number',
    // 'Date of Exit'    → farewell/leaving trigger
    const d = emp.tabular_data || emp;

    const pick = (...keys) => {
      for (const k of keys) {
        if (d[k] !== undefined && d[k] !== null && d[k] !== '') return d[k];
      }
      return '';
    };

    // 'Designation' = role in Thankeeu (member vs leader)
    const designation = String(pick('Designation') || '').trim();
    const designationLower = designation.toLowerCase();
    const isLeader = /\b(lead|head|manager|director|chief|hod|supervisor|ceo|coo|cto|cfo|vp|president)\b/.test(designationLower);

    // 'Zoho Role' = Job Title shown in the app
    const jobTitle = String(pick('Zoho Role') || '').trim();

    // 'Date of Exit' = farewell trigger
    const dateOfExit = pick('Date of Exit');
    const hasExited  = !!normalizeDate(dateOfExit);

    // 'Employeestatus' field for active/inactive check (Zoho internal field)
    const empStatus = String(pick('Employeestatus','EmployeeStatus') || '').toLowerCase();

    return {
      hris_employee_id: String(pick('EmployeeID','Employee ID') || ''),
      first_name:       pick('First Name'),
      last_name:        pick('Last Name'),
      email:            String(pick('Email address') || '').toLowerCase().trim(),
      department:       pick('Department') || 'General',
      job_title:        jobTitle,         // 'Zoho Role' → job title
      role:             isLeader ? 'team_leader' : 'member',  // 'Designation' → role
      gender:           normalizeGender(pick('Gender')),
      birthday:         normalizeDate(pick('Date of Birth')),
      hire_date:        normalizeDate(pick('Date of Joining')),
      phone:            pick('Personal Mobile Number'),
      employment_status: hasExited ? 'terminated' : (empStatus === 'inactive' ? 'terminated' : 'active'),
      termination_date: normalizeDate(dateOfExit),
      promotion_date:   normalizeDate(pick('Last Promotion Date')),
      new_title:        jobTitle,
      previous_title:   pick('Previous Designation','PreviousDesignation'),
    };
  },

  workpay: (emp) => ({
    hris_employee_id: String(emp.id || emp.employee_id || emp.employeeId),
    first_name:       emp.first_name   || emp.firstName   || '',
    last_name:        emp.last_name    || emp.lastName    || '',
    email:            (emp.email || emp.work_email || '').toLowerCase().trim(),
    department:       emp.department   || emp.team || 'General',
    job_title:        emp.job_title    || emp.position || emp.title || '',
    gender:           normalizeGender(emp.gender || emp.sex),
    birthday:         normalizeDate(emp.date_of_birth || emp.dob || emp.birthday),
    hire_date:        normalizeDate(emp.hire_date || emp.start_date || emp.employment_date),
    employment_status:
      ['active','employed','Active'].includes(emp.employment_type || emp.status) ? 'active' :
      ['terminated','resigned','dismissed'].includes((emp.status || '').toLowerCase()) ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.termination_date || emp.exit_date),
    promotion_date:   normalizeDate(emp.last_promotion_date),
    new_title:        emp.job_title || '',
    previous_title:   emp.previous_job_title || '',
  }),
};

// ─── Provider API fetchers ─────────────────────────────────────────────────────
async function fetchFromBambooHR(connection) {
  const encoded = Buffer.from(`${connection.api_key}:x`).toString('base64');
  const res = await axios.get(
    `https://api.bamboohr.com/api/gateway.php/${connection.subdomain}/v1/employees/directory`,
    {
      headers: { Authorization: `Basic ${encoded}`, Accept: 'application/json' },
      timeout: 30000,
    }
  );
  return (res.data?.employees || []).map(ADAPTERS.bamboohr);
}

async function fetchFromSeamlessHR(connection) {
  // SeamlessHR — page through all employees
  const employees = [];
  let page = 1;
  while (true) {
    const res = await axios.get(
      `https://api.seamlesshr.com/v1/employees?page=${page}&per_page=100`,
      {
        headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' },
        timeout: 30000,
      }
    );
    const data = res.data?.data || res.data?.employees || res.data || [];
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) break;
    employees.push(...items.map(ADAPTERS.seamlesshr));
    if (items.length < 100) break;
    page++;
  }
  return employees;
}

async function fetchFromSAPSuccessFactors(connection) {
  // SAP SuccessFactors OData API
  const encoded = Buffer.from(`${connection.api_key}@${connection.company_code}:${connection.api_secret}`).toString('base64');
  const baseUrl = connection.base_url || 'https://api4.successfactors.com/odata/v2';
  const fields  = 'userId,firstName,lastName,email,department,title,gender,dateOfBirth,startDate,status,endDate';
  const res = await axios.get(
    `${baseUrl}/User?$select=${fields}&$format=json&$top=1000`,
    {
      headers: { Authorization: `Basic ${encoded}`, Accept: 'application/json' },
      timeout: 30000,
    }
  );
  const employees = res.data?.d?.results || res.data?.value || [];
  return employees.map(ADAPTERS.sap_successfactors);
}

async function fetchFromZohoPeople(connection) {
  // BUG FIX 1: Always try to refresh if refresh_token exists AND
  //   (a) token_expires_at is missing/null, OR
  //   (b) token is expired, OR
  //   (c) access_token is missing
  // This handles the case where HR saves credentials but never got an initial access_token
  // Always refresh on every call to ensure we have a valid token
  // (access tokens expire in 1 hour; refresh tokens are long-lived)
  const needsRefresh = !!connection.refresh_token;

  if (needsRefresh) {
    try {
      await refreshZohoToken(connection);
      const { data } = await supabase.from('hris_connections')
        .select('access_token, token_expires_at').eq('id', connection.id).single();
      connection.access_token    = data?.access_token;
      connection.token_expires_at = data?.token_expires_at;
    } catch (refreshErr) {
      console.error('Zoho token refresh failed:', refreshErr.response?.data || refreshErr.message);
      throw new Error(
        'Zoho authentication failed. Your refresh token may be expired. ' +
        'Please reconnect Zoho People in HRIS settings: go to Zoho API Console → ' +
        'revoke and regenerate a new refresh token, then save the connection again.'
      );
    }
  }

  if (!connection.access_token) {
    throw new Error(
      'No Zoho access token available. Please save your connection credentials ' +
      '(Client ID, Client Secret, Refresh Token) in HRIS settings first.'
    );
  }

  // BUG FIX 2: Zoho has region-specific domains (.com, .eu, .in, .com.au, .jp)
  // Default to .com but allow override via base_url field
  const zohoBase = (connection.base_url && connection.base_url.trim() ? connection.base_url.trim() : 'https://people.zoho.com').replace(/\/+$/, '');

  // Zoho People v2 API — try the current endpoint first, fall back to v1
  // v2: https://www.zohoapis.com/people/v2/forms/employee/getRecords
  // v1: https://people.zoho.com/people/api/forms/P_EmployeeView/getRecords
  const authHeader = { Authorization: `Zoho-oauthtoken ${connection.access_token}` };
  const timeout    = 30000;
  let   records    = [];

  // Zoho People API — correct documented endpoint
  // Docs: https://www.zoho.com/people/api/get-employees.html
  // The ONLY correct base is people.zoho.com
  // The path is /people/api/forms/P_EmployeeView/getRecords
  // Auth header: Zoho-oauthtoken <token>
  // Token is valid on people.zoho.com (confirmed via code 7218 = scope issue, not 7213 = invalid token)
  const endpoints = [
    { url: 'https://people.zoho.com/people/api/forms/P_EmployeeView/getRecords?sIndex=1&limit=200', label: 'P_EmployeeView-zoho.com' },
    { url: 'https://people.zoho.com/people/api/forms/employee/getRecords?sIndex=1&limit=200',       label: 'employee-zoho.com' },
  ];

  let lastStatus = null;
  let lastBody   = null;

  for (const ep of endpoints) {
    try {
      console.log('[zoho] trying:', ep.label, ep.url.split('?')[0]);
      const epRes = await axios.get(ep.url, { headers: authHeader, timeout });
      // Zoho sometimes returns 200 with an error in the body
      const body = epRes.data;
      if (body?.response?.errors || body?.errors) {
        console.warn('[zoho]', ep.label, 'returned body error:', JSON.stringify(body?.response?.errors || body?.errors));
        lastBody = body;
        continue;
      }
      const rows = body?.data || body?.response?.result || body?.result || [];
      // Zoho's employee/getRecords returns { "ZOHO_ID": [empObj], ... } under body.data
      // Object.values() gives [[emp1],[emp2],...] — we need to flatten one level.
      const flat = Array.isArray(rows) ? rows : Object.values(rows || {});
      records = flat.flat ? flat.flat(1) : [].concat(...flat);
      records = records.filter(r => r && typeof r === 'object' && !Array.isArray(r));
      console.log('[zoho]', ep.label, 'success — records:', records.length);
      break;
    } catch (epErr) {
      lastStatus = epErr.response?.status;
      lastBody   = epErr.response?.data;
      console.warn('[zoho]', ep.label, 'failed:', lastStatus, JSON.stringify(lastBody)?.slice(0, 200));
    }
  }

  if (records.length === 0 && lastStatus) {
    const bodyStr = typeof lastBody === 'string' ? lastBody.slice(0,300) : JSON.stringify(lastBody)?.slice(0,300);
    if (lastStatus === 401) {
      throw new Error(
        `Zoho API 401. Raw response: ${bodyStr}. ` +
        'Possible causes: (1) Zoho People not activated on your account — log into people.zoho.com and check. ' +
        '(2) The authorizing user does not have API permissions in Zoho People admin. ' +
        '(3) Disconnect and reconnect to get a fresh token.'
      );
    }
    if (lastStatus === 403) throw new Error(`Zoho API 403 — your Zoho People plan may not include API access. Body: ${bodyStr}`);
    throw new Error(`Zoho API error ${lastStatus}: ${bodyStr}`);
  }

  // Log the first raw record so we can see Zoho's actual field names
  if (records.length > 0) {
    console.log('[zoho] RAW FIRST RECORD:', JSON.stringify(records[0]));
  } else {
    console.log('[zoho] No records returned from Zoho People');
  }

  return records.map(ADAPTERS.zoho_people);
}

async function refreshZohoToken(connection) {
  // Derive the accounts domain from the base_url region
  // e.g. people.zoho.eu → accounts.zoho.eu
  const base = (connection.base_url || '').trim();
  let accountsDomain = 'https://accounts.zoho.com'; // default global
  if (base.includes('zoho.eu'))     accountsDomain = 'https://accounts.zoho.eu';
  else if (base.includes('zoho.in'))     accountsDomain = 'https://accounts.zoho.in';
  else if (base.includes('zoho.com.au')) accountsDomain = 'https://accounts.zoho.com.au';
  else if (base.includes('zoho.jp'))     accountsDomain = 'https://accounts.zoho.jp';

  console.log('[zoho-refresh] domain:', accountsDomain);
  console.log('[zoho-refresh] client_id:', (connection.api_key||'(missing)'));
  console.log('[zoho-refresh] client_secret (first 8):', (connection.api_secret||'(missing)').slice(0,8));
  console.log('[zoho-refresh] refresh_token (first 16):', (connection.refresh_token||'(missing)').slice(0,16));

  const params = new URLSearchParams({
    refresh_token: connection.refresh_token,
    client_id:     connection.api_key,
    client_secret: connection.api_secret,
    grant_type:    'refresh_token',
  });

  const res = await axios.post(
    `${accountsDomain}/oauth/v2/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
  );

  console.log('[zoho-refresh] response:', JSON.stringify(res.data));

  if (!res.data.access_token) {
    throw new Error(
      `Zoho token refresh returned no access_token. Response: ${JSON.stringify(res.data)}. ` +
      'Common causes: (1) Refresh token is invalid or expired — regenerate it in Zoho API Console. ' +
      '(2) Client ID or Client Secret is wrong. (3) App does not have ZohoPeople.employee.ALL scope.'
    );
  }

  const newToken  = res.data.access_token;
  const expiresAt = new Date(Date.now() + (res.data.expires_in || 3600) * 1000);
  await supabase.from('hris_connections')
    .update({ access_token: newToken, token_expires_at: expiresAt })
    .eq('id', connection.id);
}

async function fetchFromWorkPay(connection) {
  const res = await axios.get(
    `${connection.base_url || 'https://api.workpay.africa'}/v1/employees?page=1&limit=500`,
    {
      headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' },
      timeout: 30000,
    }
  );
  const employees = res.data?.data || res.data?.employees || res.data || [];
  return (Array.isArray(employees) ? employees : []).map(ADAPTERS.workpay);
}

const PROVIDER_FETCHERS = {
  bamboohr:           fetchFromBambooHR,
  seamlesshr:         fetchFromSeamlessHR,
  sap_successfactors: fetchFromSAPSuccessFactors,
  zoho_people:        fetchFromZohoPeople,
  workpay:            fetchFromWorkPay,
};

// ─── Core sync engine — maps employees to ALL occasion tables ─────────────────
async function syncEmployeesToOccasionTables(companyId, employees, occasionTypes) {
  const typeMap = {};
  for (const ot of occasionTypes) typeMap[ot.name] = ot;

  const year    = new Date().getFullYear();
  const counts  = { birthday:0, anniversary:0, womens_day:0, mens_day:0, valentines:0, workers_day:0, promotions:0, leaving:0, new_hire:0, deactivated:0, errors:0, invites_sent:0 };
  const errors  = [];

  // Fetch company name/contact once for invite emails
  const { data: companyData } = await supabase.from('companies').select('name, contact_person').eq('id', companyId).single();

  for (const emp of employees) {
    if (!emp.email || !emp.first_name) {
      errors.push(`Skipped: missing email or name for HRIS ID ${emp.hris_employee_id}`);
      counts.errors++;
      continue;
    }

    const base = {
      company_id:        companyId,
      first_name:        emp.first_name.trim(),
      last_name:         (emp.last_name || '').trim(),
      email:             emp.email.toLowerCase(),
      department:        emp.department || 'General',
      gender:            emp.gender,
      job_title:         emp.job_title,
      hire_date:         emp.hire_date,
      hris_employee_id:  emp.hris_employee_id,
      employment_status: emp.employment_status || 'active',
      is_active:         emp.employment_status !== 'terminated',
    };

    try {

      // Occasion sync map:
  // birthday         → all active employees with DOB
  // work_anniversary → all active employees with hire_date (yearly)
  // womens_day       → active female employees (Mar 8)
  // mens_day         → active male employees (Nov 19)
  // valentines_day   → all active employees (Feb 14)
  // workers_day      → all active employees (May 1)
  // promotion        → active employees with recent promotion_date
  // leaving/farewell → active employees with future termination_date (≤90 days ahead)
  // new_hire/welcome → active employees with hire_date within last 7 days or next 30 days
  // terminated       → deactivated across all tables, no more emails

  // ── SYNC TO company_members — makes Team Members page reflect HRIS ──
  // HRIS is the master of truth: upsert overwrites occasion manager data
      const cmRow = {
        company_id:  companyId,
        first_name:  base.first_name,
        last_name:   base.last_name,
        email:       base.email,
        department:  base.department,
        gender:      base.gender || null,
        job_title:   base.job_title || null,
        date_of_birth: emp.birthday || null,
        resumption_date: emp.hire_date || null,
        phone:       emp.phone || null,
        status:      emp.employment_status === 'terminated' ? 'deactivated' : 'approved',
        role:        emp.role || 'member',
        updated_at:  new Date(),
      };

      // Check whether this person already has an account (so we don't
      // re-invite or overwrite an existing password) before upserting.
      const { data: existingMember } = await supabase.from('company_members')
        .select('id, password_hash, invite_token')
        .eq('company_id', companyId).eq('email', base.email).maybeSingle();

      const needsInvite = cmRow.status === 'approved' && !existingMember?.password_hash;
      let inviteToken = existingMember?.invite_token || null;
      const cmRowToUpsert = { ...cmRow };
      if (needsInvite) {
        inviteToken = crypto.randomBytes(32).toString('hex');
        cmRowToUpsert.invite_token  = inviteToken;
        cmRowToUpsert.password_hash = await hashPassword(crypto.randomBytes(8).toString('hex'));
      }

      let { error: cmErr } = await supabase.from('company_members')
        .upsert(cmRowToUpsert, { onConflict: 'company_id,email' });

      // Some databases use an enum for `role` ('team_leader'/'team_member')
      // instead of free text ('member'/'team_leader') — retry with the
      // enum-compatible value if the first attempt fails on that column.
      if (cmErr && /role/i.test(cmErr.message || '')) {
        cmRowToUpsert.role = cmRowToUpsert.role === 'team_leader' ? 'team_leader' : 'team_member';
        ({ error: cmErr } = await supabase.from('company_members')
          .upsert(cmRowToUpsert, { onConflict: 'company_id,email' }));
      }

      if (cmErr) {
        errors.push(`company_members sync failed for ${base.email}: ${cmErr.message}`);
      } else if (needsInvite && inviteToken) {
        // Brand new (or password-less) member — send the "set your password" email
        try {
          const link = `${frontendUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(base.email)}`;
          await sendEmail({ to: base.email,
            subject: `You've been added to ${companyData?.name || 'your company'} on Thankeeu!`,
            html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;">
              <h2 style="color:#7C3AED;margin:0 0 8px;">Welcome, ${base.first_name}!</h2>
              <p style="color:#555;margin:0 0 20px;">${companyData?.contact_person || companyData?.name || 'Your HR team'} has added you to <strong>${companyData?.name || 'your company'}</strong> on Thankeeu — the platform that makes team celebrations effortless.</p>
              <p style="color:#555;margin:0 0 20px;">Click the button below to set your password and access your team dashboard:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr><td style="border-radius:8px;background:#7C3AED;">
                  <a href="${link}" style="display:inline-block;background:#7C3AED;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Set your password →</a>
                </td></tr>
              </table>
              <p style="color:#aaa;font-size:12px;margin:8px 0 0;">Or copy this link: <a href="${link}" style="color:#7C3AED;">${link}</a></p>
              <p style="color:#aaa;font-size:12px;margin:16px 0 0;">This link does not expire. If you have issues, contact your HR team.</p>
            </div>`,
          }).catch((emailErr) => { errors.push(`Invite email failed for ${base.email}: ${emailErr.message}`); });
          counts.invites_sent++;
        } catch (emailErr) {
          errors.push(`Invite email failed for ${base.email}: ${emailErr.message}`);
        }
      }


  // ── DEACTIVATE terminated employees across all occasion tables ──────
      if (emp.employment_status === 'terminated') {
        await supabase.from('occasion_members')
          .update({ is_active: false, employment_status: 'terminated' })
          .eq('company_id', companyId)
          .eq('hris_employee_id', emp.hris_employee_id);
        // Also deactivate in company_members
        await supabase.from('company_members')
          .update({ status: 'deactivated', updated_at: new Date() })
          .eq('company_id', companyId).eq('email', base.email);
        counts.deactivated++;
        continue; // Don't add to any table
      }

      // ── BIRTHDAY ─────────────────────────────────────────────────────────
      if (typeMap.birthday && emp.birthday) {
        await upsertOccasionMember({
          ...base,
          occasion_type_id: typeMap.birthday.id,
          occasion_date:    emp.birthday,
        });
        counts.birthday++;
      }

      // ── WORK ANNIVERSARY ──────────────────────────────────────────────────
      if (typeMap.work_anniversary && emp.hire_date) {
        const anniv = anniversaryDetails(emp.hire_date);
        if (anniv) {
          await upsertOccasionMember({
            ...base,
            occasion_type_id:  typeMap.work_anniversary.id,
            occasion_date:     anniv.occasion_date,
            hire_date:         anniv.hire_date,
            years_of_service:  anniv.years_of_service,
          });
          counts.anniversary++;
        }
      }

      // ── WOMEN'S DAY (females only) ────────────────────────────────────────
      if (typeMap.womens_day && emp.gender === 'female') {
        await upsertOccasionMember({
          ...base,
          occasion_type_id: typeMap.womens_day.id,
          occasion_date:    FIXED_DATES.womens_day(year),
        });
        counts.womens_day++;
      }

      // ── MEN'S DAY (males only) ────────────────────────────────────────────
      if (typeMap.mens_day && emp.gender === 'male') {
        await upsertOccasionMember({
          ...base,
          occasion_type_id: typeMap.mens_day.id,
          occasion_date:    FIXED_DATES.mens_day(year),
        });
        counts.mens_day++;
      }

      // ── VALENTINE'S DAY (everyone) ────────────────────────────────────────
      if (typeMap.valentines_day) {
        await upsertOccasionMember({
          ...base,
          occasion_type_id: typeMap.valentines_day.id,
          occasion_date:    FIXED_DATES.valentines_day(year),
        });
        counts.valentines++;
      }

      // ── WORKERS' DAY (everyone) ───────────────────────────────────────────
      if (typeMap.workers_day) {
        await upsertOccasionMember({
          ...base,
          occasion_type_id: typeMap.workers_day.id,
          occasion_date:    FIXED_DATES.workers_day(year),
        });
        counts.workers_day++;
      }

      // ── PROMOTION (only if promotion_date present and in this/last year) ──
      if (typeMap.promotion && emp.promotion_date) {
        const pd = new Date(emp.promotion_date);
        if (!isNaN(pd) && pd.getFullYear() >= year - 1) {
          await upsertOccasionMember({
            ...base,
            occasion_type_id: typeMap.promotion.id,
            occasion_date:    emp.promotion_date,
            new_title:        emp.new_title  || emp.job_title,
            previous_title:   emp.previous_title || '',
          });
          counts.promotions++;
        }
      }

      // ── LEAVING / FAREWELL (employees with future termination_date from HRIS) ──
      // termination_date present AND in the future → upcoming farewell
      if (typeMap.leaving && emp.termination_date) {
        const td   = new Date(emp.termination_date);
        const now  = new Date();
        // Only add to farewell table if last day is within 90 days ahead (not already past)
        const diff = Math.ceil((td - now) / 86400000);
        if (!isNaN(td) && diff >= 0 && diff <= 90) {
          await upsertOccasionMember({
            ...base,
            occasion_type_id:      typeMap.leaving.id,
            occasion_date:         emp.termination_date, // last day in office
            termination_reason:    emp.additional_data?.reason || 'Leaving the company',
          });
          counts.leaving++;
        }
      }

      // ── NEW HIRE / WELCOME (employees whose hire_date is recent or upcoming) ──
      // hire_date within the last 7 days OR in the next 30 days
      if (typeMap.new_hire && emp.hire_date) {
        const hd   = new Date(emp.hire_date);
        const now  = new Date();
        const diff = Math.ceil((hd - now) / 86400000); // negative = past, positive = future
        if (!isNaN(hd) && diff >= -7 && diff <= 30) {
          await upsertOccasionMember({
            ...base,
            occasion_type_id: typeMap.new_hire.id,
            occasion_date:    emp.hire_date, // first day on the job
          });
          counts.new_hire++;
        }
      }

    } catch (err) {
      errors.push(`Error syncing ${emp.email}: ${err.message}`);
      counts.errors++;
    }
  }

  return { counts, errors };
}

async function upsertOccasionMember(data) {
  const { data: existing } = await supabase
    .from('occasion_members')
    .select('id')
    .eq('company_id', data.company_id)
    .eq('occasion_type_id', data.occasion_type_id)
    .eq('hris_employee_id', data.hris_employee_id)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('occasion_members').update({ ...data, updated_at: new Date() }).eq('id', existing.id);
  } else {
    await supabase.from('occasion_members').insert(data);
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

// GET /api/hris — list all connections for company
const getConnections = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hris_connections')
      .select('id, provider, display_name, is_active, is_verified, last_synced_at, last_sync_status, last_sync_count, auto_sync, sync_frequency, subdomain, company_code, base_url, created_at')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
};

// POST /api/hris/connect — save a new HRIS connection
const saveConnection = async (req, res) => {
  try {
    const { provider, display_name, api_key, api_secret, subdomain, company_code, base_url, access_token, refresh_token, token_expires_at } = req.body;
    if (!provider || !api_key) return res.status(400).json({ error: 'Provider and API key are required' });

    const payload = {
      company_id: req.company.id,
      provider, display_name: display_name || provider,
      api_key, api_secret, subdomain, company_code, base_url,
      access_token, refresh_token, token_expires_at,
      is_active: true, is_verified: false,
    };

    const { data: existing } = await supabase.from('hris_connections').select('id').eq('company_id', req.company.id).eq('provider', provider).maybeSingle();

    let result;
    if (existing?.id) {
      const { data } = await supabase.from('hris_connections').update({ ...payload, updated_at: new Date() }).eq('id', existing.id).select().single();
      result = data;
    } else {
      const { data } = await supabase.from('hris_connections').insert(payload).select().single();
      result = data;
    }
    res.status(201).json({ message: 'Connection saved', connection: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save connection' });
  }
};

// POST /api/hris/:connectionId/test — test a connection without syncing
const testConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { data: conn, error } = await supabase.from('hris_connections').select('*').eq('id', connectionId).eq('company_id', req.company.id).single();
    if (error || !conn) return res.status(404).json({ error: 'Connection not found' });

    const fetcher = PROVIDER_FETCHERS[conn.provider];
    if (!fetcher) return res.status(400).json({ error: `Unknown provider: ${conn.provider}` });

    // Fetch up to 5 employees to test
    const employees = await fetcher(conn);
    const sample    = employees.slice(0, 3).map(e => ({
      name:       `${e.first_name} ${e.last_name}`,
      email:      e.email,
      department: e.department,
      gender:     e.gender,
      birthday:   e.birthday,
      hire_date:  e.hire_date,
      status:     e.employment_status,
    }));

    await supabase.from('hris_connections').update({ is_verified: true, updated_at: new Date() }).eq('id', connectionId);

    res.json({ success: true, total_employees: employees.length, sample, message: `Successfully connected to ${conn.display_name}. Found ${employees.length} employees.` });
  } catch (err) {
    console.error(err.response?.data || err.message);
    await supabase.from('hris_connections').update({ is_verified: false }).eq('id', req.params.connectionId);
    res.status(400).json({ error: `Connection test failed: ${err.response?.data?.message || err.message}` });
  }
};

// POST /api/hris/:connectionId/sync — full sync: populate all occasion tables
const syncHRIS = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { data: conn, error } = await supabase.from('hris_connections').select('*').eq('id', connectionId).eq('company_id', req.company.id).single();
    if (error || !conn) return res.status(404).json({ error: 'Connection not found' });

    const fetcher = PROVIDER_FETCHERS[conn.provider];
    if (!fetcher) return res.status(400).json({ error: `Unknown provider: ${conn.provider}` });

    // Start a sync log entry
    const { data: logEntry } = await supabase.from('hris_sync_logs').insert({
      company_id: req.company.id, connection_id: connectionId,
      provider: conn.provider, status: 'running',
    }).select().single();

    const startTime = Date.now();

    // Fetch all employees from HRIS
    let employees;
    try {
      employees = await fetcher(conn);
    } catch (fetchErr) {
      const errMsg = fetchErr.response?.data?.message || fetchErr.message;
      await supabase.from('hris_sync_logs').update({ status: 'failed', finished_at: new Date(), last_sync_error: errMsg, duration_ms: Date.now() - startTime }).eq('id', logEntry.id);
      await supabase.from('hris_connections').update({ last_sync_status: 'failed', last_sync_error: errMsg, updated_at: new Date() }).eq('id', connectionId);
      return res.status(400).json({ error: `Failed to fetch employees from ${conn.display_name}: ${errMsg}` });
    }

    // Get all occasion types for this company
    const { data: occasionTypes } = await supabase.from('occasion_types').select('*').eq('company_id', req.company.id).eq('is_active', true);

    // Run the sync
    const { counts, errors } = await syncEmployeesToOccasionTables(req.company.id, employees, occasionTypes || []);

    // Handle "leaving" — employees that exist in Thankeeu but NOT in HRIS anymore
    const leavingCount = await deactivateMissingEmployees(req.company.id, employees, occasionTypes || []);
    counts.leaving = leavingCount;

    const duration = Date.now() - startTime;
    const hasErrors = errors.length > 0;
    const finalStatus = hasErrors && counts.errors === employees.length ? 'failed' : hasErrors ? 'partial' : 'success';

    // Update sync log
    await supabase.from('hris_sync_logs').update({
      status:            finalStatus,
      finished_at:       new Date(),
      total_employees:   employees.length,
      birthday_synced:   counts.birthday,
      anniversary_synced:counts.anniversary,
      womens_day_synced: counts.womens_day,
      mens_day_synced:   counts.mens_day,
      valentines_synced: counts.valentines,
      workers_day_synced:counts.workers_day,
      promotions_synced: counts.promotions,
      leaving_synced:    counts.leaving,
      new_hire_synced:   counts.new_hire,
      deactivated_count: counts.deactivated,
      error_count:       counts.errors,
      errors:            errors.length > 0 ? errors : null,
      duration_ms:       duration,
    }).eq('id', logEntry.id);

    // Update connection record
    await supabase.from('hris_connections').update({
      last_synced_at:   new Date(),
      last_sync_status: finalStatus,
      last_sync_count:  employees.length,
      last_sync_error:  errors.length > 0 ? errors[0] : null,
      is_verified:      true,
      updated_at:       new Date(),
    }).eq('id', connectionId);

    // Count active company_members for per-head pricing
    const { data: memberRows } = await supabase.from('company_members')
      .select('id').eq('company_id', req.company.id).neq('status','deactivated');
    const headCount    = (memberRows || []).length || employees.length;
    const monthlyPrice = headCount * 2000;
    const yearlyPrice  = headCount * 20000;

    res.json({
      success:                  true,
      provider:                 conn.display_name,
      total_employees:          employees.length,
      duration_ms:              duration,
      synced:                   counts,
      errors:                   errors.slice(0, 20),
      message:                  `Sync complete. ${employees.length} employees processed across all occasion tables.${counts.invites_sent ? ` ${counts.invites_sent} new team member${counts.invites_sent === 1 ? '' : 's'} invited by email to set their password.` : ''}`,
      head_count:               headCount,
      monthly_price:            monthlyPrice,
      yearly_price:             yearlyPrice,
      redirect_to_subscription: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed unexpectedly. Check server logs.' });
  }
};

// Deactivate employees no longer in HRIS feed
async function deactivateMissingEmployees(companyId, hrисEmployees, occasionTypes) {
  const activeHRISIds = new Set(hrисEmployees.filter(e => e.employment_status !== 'terminated').map(e => e.hris_employee_id));
  const typeIds = occasionTypes.map(ot => ot.id);
  if (typeIds.length === 0) return 0;

  const { data: thankeeuMembers } = await supabase.from('occasion_members')
    .select('id, hris_employee_id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .not('hris_employee_id', 'is', null)
    .in('occasion_type_id', typeIds);

  let deactivated = 0;
  for (const m of (thankeeuMembers || [])) {
    if (!activeHRISIds.has(m.hris_employee_id)) {
      await supabase.from('occasion_members').update({ is_active: false, employment_status: 'terminated' }).eq('id', m.id);
      deactivated++;
    }
  }
  return deactivated;
}

// GET /api/hris/logs — sync history
const getSyncLogs = async (req, res) => {
  try {
    const { data, error } = await supabase.from('hris_sync_logs')
      .select('*')
      .eq('company_id', req.company.id)
      .order('started_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// DELETE /api/hris/:connectionId — disconnect
const deleteConnection = async (req, res) => {
  try {
    await supabase.from('hris_connections').delete().eq('id', req.params.connectionId).eq('company_id', req.company.id);
    res.json({ message: 'Connection removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove connection' });
  }
};

// Branch management
const getBranches = async (req, res) => {
  try {
    const { data } = await supabase.from('company_branches').select('*').eq('company_id', req.company.id).eq('is_active', true).order('name');
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

const saveBranch = async (req, res) => {
  try {
    const { name, city, state, is_default } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Branch name is required' });
    if (is_default) {
      await supabase.from('company_branches').update({ is_default: false }).eq('company_id', req.company.id);
    }
    const { data } = await supabase.from('company_branches').insert({ company_id: req.company.id, name, city, state, is_default: !!is_default }).select().single();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save branch' });
  }
};

const deleteBranch = async (req, res) => {
  try {
    await supabase.from('company_branches').update({ is_active: false }).eq('id', req.params.branchId).eq('company_id', req.company.id);
    res.json({ message: 'Branch removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove branch' });
  }
};

module.exports = {
  getConnections, saveConnection, testConnection, syncHRIS,
  getSyncLogs, deleteConnection,
  getBranches, saveBranch, deleteBranch,
  PROVIDER_FETCHERS, ADAPTERS, syncEmployeesToOccasionTables, // exported for tests
};
