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

// company_members.gender has a CHECK constraint allowing only
// 'male' / 'female' / NULL — returning 'other' here would cause the
// company_members upsert to fail on a constraint violation for any
// employee with an unrecognized gender value, blocking their entire sync.
function normalizeGender(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (['f','female','woman','w','girl','fe'].includes(s)) return 'female';
  if (['m','male','man','boy','gentleman'].includes(s))   return 'male';
  return null;
}

// ─── Provider adapters — normalize raw employee to Thankeeu format ─────────
let _zohoAdapterLogged = false;

// Debug logger — prints first record keys from each provider to Railway logs
// so field-name mismatches are immediately visible on first sync
const _adapterLogged = {};
function debugFirstRecord(provider, emp) {
  if (_adapterLogged[provider]) return;
  _adapterLogged[provider] = true;
  const keys = Object.keys(emp || {}).join(', ');
  console.log(`[hris-debug][${provider}] field keys on first record:`, keys);
  // Log the key fields we actually use so mismatches are obvious
  const keyFields = ['firstName','first_name','FirstName','lastName','last_name','LastName',
    'email','workEmail','work_email','EmailID','department','jobTitle','job_title','gender',
    'dateOfBirth','date_of_birth','Date_of_birth','dob','hireDate','hire_date','startDate'];
  const found = {};
  keyFields.forEach(k => { if (emp[k] !== undefined) found[k] = emp[k]; });
  console.log(`[hris-debug][${provider}] recognized fields:`, JSON.stringify(found).slice(0, 300));
}

// ─── Leader detection helper — shared across all adapters ─────────────────────
const isLeaderTitle = (title) =>
  /\b(lead|head|manager|director|chief|hod|supervisor|ceo|coo|cto|cfo|vp|president|principal|senior partner|partner|founder|owner)\b/i.test(String(title || ''));

const ADAPTERS = {

  // ─── BambooHR ──────────────────────────────────────────────────────────────
  // API ref: https://documentation.bamboohr.com/reference/get-employees-directory
  // Fields returned: id, firstName, lastName, workEmail, department, jobTitle,
  //   gender, dateOfBirth (YYYY-MM-DD), hireDate (YYYY-MM-DD),
  //   employmentHistoryStatus (Active/Inactive/Terminated), mobilePhone, workPhone
  bamboohr: (emp) => ({
    ...(() => { debugFirstRecord("bamboohr", emp); return {}; })(),
    hris_employee_id: String(emp.id || emp.employeeId || ''),
    first_name:       emp.firstName    || emp.first_name || '',
    last_name:        emp.lastName     || emp.last_name  || '',
    email:            (emp.workEmail   || emp.email      || '').toLowerCase().trim(),
    department:       emp.department   || emp.Division   || 'General',
    job_title:        emp.jobTitle     || emp.position   || emp.job_title || '',
    role:             isLeaderTitle(emp.jobTitle || emp.position) ? 'team_leader' : 'member',
    gender:           normalizeGender(emp.gender),
    birthday:         normalizeDate(emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.hireDate    || emp.startDate || emp.hire_date),
    phone:            emp.mobilePhone  || emp.workPhone  || emp.phone || '',
    employment_status:
      ['Active','active','ACTIVE'].includes(emp.employmentHistoryStatus || emp.status) ? 'active' :
      emp.terminationDate ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.terminationDate),
    promotion_date:   normalizeDate(emp.lastPromotionDate || emp.promotionDate),
    new_title:        emp.jobTitle || '',
    previous_title:   emp.previousTitle || '',
  }),

  // ─── SeamlessHR ────────────────────────────────────────────────────────────
  // API ref: https://documenter.getpostman.com/view/9348048/2sA2xiWC
  // Fields: id, employee_id, first_name, last_name, email, work_email,
  //   department, branch, position (job title), job_grade,
  //   gender (Male/Female), date_of_birth, employment_date,
  //   employment_status (active/inactive), date_of_exit,
  //   phone_number, mobile_number
  seamlesshr: (emp) => ({
    ...(() => { debugFirstRecord("seamlesshr", emp); return {}; })(),
    hris_employee_id: String(emp.id || emp.employee_id || emp.employeeId || ''),
    first_name:       emp.first_name  || emp.firstName  || '',
    last_name:        emp.last_name   || emp.lastName   || '',
    email:            (emp.work_email || emp.email || emp.workEmail || '').toLowerCase().trim(),
    department:       emp.department  || emp.branch      || 'General',
    job_title:        emp.position    || emp.job_title   || emp.jobTitle || emp.job_grade || '',
    role:             isLeaderTitle(emp.position || emp.job_title) ? 'team_leader' : 'member',
    gender:           normalizeGender(emp.gender || emp.sex),
    birthday:         normalizeDate(emp.date_of_birth || emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.employment_date || emp.hireDate || emp.hire_date || emp.resumption_date),
    phone:            emp.phone_number || emp.mobile_number || emp.phone || '',
    employment_status:
      (emp.date_of_exit && normalizeDate(emp.date_of_exit)) ? 'terminated' :
      ['active','Active','employed'].includes(emp.employment_status || emp.status || '') ? 'active' :
      ['inactive','Inactive','terminated','resigned'].includes((emp.employment_status || '').toLowerCase()) ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.date_of_exit || emp.exit_date || emp.terminationDate),
    promotion_date:   normalizeDate(emp.last_promotion_date || emp.promotionDate),
    new_title:        emp.position || emp.job_title || '',
    previous_title:   emp.previous_position || '',
  }),

  // ─── SAP SuccessFactors ────────────────────────────────────────────────────
  // API ref: https://help.sap.com/docs/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL
  // OData fields: userId, personIdExternal, firstName, lastName,
  //   email/defaultEmail, department, title (job title), division,
  //   gender (M/F/U), dateOfBirth, startDate,
  //   status (A=active, T=terminated, U=unpaid leave), endDate,
  //   mobilePhone, businessPhone, officePhone
  sap_successfactors: (emp) => ({
    ...(() => { debugFirstRecord("sap_successfactors", emp); return {}; })(),
    hris_employee_id: String(emp.userId || emp.personIdExternal || emp.id || ''),
    first_name:       emp.firstName   || emp.first_name || '',
    last_name:        emp.lastName    || emp.last_name  || '',
    email:            (emp.email || emp.defaultEmail || emp.workEmail || '').toLowerCase().trim(),
    department:       emp.department  || emp.Division   || 'General',
    job_title:        emp.title       || emp.jobTitle   || emp.position || '',
    role:             isLeaderTitle(emp.title || emp.jobTitle) ? 'team_leader' : 'member',
    gender:           normalizeGender(emp.gender === 'M' ? 'male' : emp.gender === 'F' ? 'female' : emp.gender),
    birthday:         normalizeDate(emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.startDate || emp.hireDate || emp.originalStartDate),
    phone:            emp.mobilePhone || emp.businessPhone || emp.officePhone || emp.phone || '',
    employment_status:
      ['A','Active','active','ACTIVE'].includes(emp.status || emp.employmentStatus || '') ? 'active' :
      ['T','Terminated','terminated'].includes(emp.status || '') ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.endDate || emp.terminationDate),
    promotion_date:   normalizeDate(emp.lastChangeDate),
    new_title:        emp.title || '',
    previous_title:   '',
  }),

  // ─── Zoho People ───────────────────────────────────────────────────────────
  // Exact JSON fields from live Railway logs (NOT the template display labels):
  // EmailID, FirstName, LastName, Department, Designation (→role), Role (→job title),
  // Date_of_birth, Dateofjoining, Dateofexit, Gender, Mobile, EmployeeID, Employeestatus
  zoho_people: (emp) => {
    const d = emp.tabular_data || emp;
    if (!_zohoAdapterLogged) {
      _zohoAdapterLogged = true;
      console.log('[zoho-adapter] field keys on first record:', Object.keys(d).join(', '));
      console.log('[zoho-adapter] EmailID:', d.EmailID, '| FirstName:', d.FirstName, '| LastName:', d.LastName);
    }
    const pick = (...keys) => {
      for (const k of keys) {
        if (d[k] !== undefined && d[k] !== null && d[k] !== '') return d[k];
      }
      return '';
    };
    const designation = String(pick('Designation') || '').trim();
    const jobTitle    = String(pick('Role') || '').trim();
    const dateOfExit  = pick('Dateofexit');
    const hasExited   = !!normalizeDate(dateOfExit);
    const empStatus   = String(pick('Employeestatus') || '').toLowerCase();
    return {
      hris_employee_id: String(pick('EmployeeID') || ''),
      first_name:       pick('FirstName'),
      last_name:        pick('LastName'),
      email:            String(pick('EmailID') || '').toLowerCase().trim(),
      department:       pick('Department') || 'General',
      job_title:        jobTitle,
      role:             isLeaderTitle(designation) ? 'team_leader' : 'member',
      gender:           normalizeGender(pick('Gender')),
      birthday:         normalizeDate(pick('Date_of_birth')),
      hire_date:        normalizeDate(pick('Dateofjoining')),
      phone:            pick('Mobile'),
      employment_status: hasExited ? 'terminated' : (empStatus === 'inactive' ? 'terminated' : 'active'),
      termination_date:  normalizeDate(dateOfExit),
      promotion_date:    normalizeDate(pick('LastPromotionDate')),
      new_title:         jobTitle,
      previous_title:    pick('PreviousDesignation'),
    };
  },

  // ─── WorkPay ───────────────────────────────────────────────────────────────
  // API ref: https://api.workpay.africa/docs
  // Fields: id, employee_number, first_name, last_name,
  //   work_email, personal_email, department.name, job_title,
  //   gender, date_of_birth, date_of_joining,
  //   status (active/inactive/terminated), phone_number,
  //   termination_date
  workpay: (emp) => ({
    ...(() => { debugFirstRecord("workpay", emp); return {}; })(),
    hris_employee_id: String(emp.id || emp.employee_id || emp.employee_number || ''),
    first_name:       emp.first_name  || emp.firstName  || '',
    last_name:        emp.last_name   || emp.lastName   || '',
    email:            (emp.work_email || emp.email || emp.personal_email || '').toLowerCase().trim(),
    department:       (emp.department?.name || emp.department || emp.team || 'General'),
    job_title:        emp.job_title   || emp.title      || emp.position || '',
    role:             isLeaderTitle(emp.job_title || emp.title) ? 'team_leader' : 'member',
    gender:           normalizeGender(emp.gender || emp.sex),
    birthday:         normalizeDate(emp.date_of_birth || emp.dob || emp.birthday),
    hire_date:        normalizeDate(emp.date_of_joining || emp.hire_date || emp.start_date || emp.employment_date),
    phone:            emp.phone_number || emp.mobile_number || emp.phone || '',
    employment_status:
      ['active','Active','employed'].includes(emp.status || emp.employment_type || '') ? 'active' :
      ['terminated','resigned','dismissed','inactive'].includes((emp.status || '').toLowerCase()) ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.termination_date || emp.exit_date),
    promotion_date:   normalizeDate(emp.last_promotion_date),
    new_title:        emp.job_title || '',
    previous_title:   emp.previous_job_title || '',
  }),

  // ─── Rippling ──────────────────────────────────────────────────────────────
  // API ref: https://developer.rippling.com/docs/employee
  // Fields: id, workEmail, personalEmail, firstName, lastName,
  //   department.name, role (job title), team.name,
  //   startDate, terminationDate, gender, birthday,
  //   status (ACTIVE/INACTIVE/TERMINATED), phoneNumbers (array)
  rippling: (emp) => ({
    ...(() => { debugFirstRecord("rippling", emp); return {}; })(),
    hris_employee_id: String(emp.id || emp.employeeId || ''),
    first_name:       emp.firstName   || emp.first_name || '',
    last_name:        emp.lastName    || emp.last_name  || '',
    email:            (emp.workEmail  || emp.email || emp.personalEmail || '').toLowerCase().trim(),
    department:       emp.department?.name || emp.department || emp.team?.name || 'General',
    job_title:        emp.role        || emp.jobTitle   || emp.title || emp.position || '',
    role:             isLeaderTitle(emp.role || emp.jobTitle || emp.title) ? 'team_leader' : 'member',
    gender:           normalizeGender(emp.gender),
    birthday:         normalizeDate(emp.birthday || emp.dateOfBirth || emp.dob),
    hire_date:        normalizeDate(emp.startDate || emp.hireDate   || emp.start_date),
    phone:            (Array.isArray(emp.phoneNumbers) ? emp.phoneNumbers[0]?.number : emp.phone) || '',
    employment_status:
      ['ACTIVE','active','Active'].includes(emp.status || '') ? 'active' :
      ['TERMINATED','terminated','INACTIVE','inactive'].includes(emp.status || '') ? 'terminated' : 'active',
    termination_date: normalizeDate(emp.terminationDate || emp.termination_date),
    promotion_date:   normalizeDate(emp.lastPromotionDate),
    new_title:        emp.role || emp.jobTitle || '',
    previous_title:   emp.previousJobTitle || '',
  }),

  // ─── ADP Workforce Now ─────────────────────────────────────────────────────
  // API ref: https://developers.adp.com/articles/api/workforce-now-v2-api
  // Deeply nested structure: worker.person, worker.workerDates, etc.
  adp: (worker) => {
    debugFirstRecord("adp", worker);
        const person   = worker.person         || {};
    const name     = person.legalName      || {};
    const comms    = worker.businessCommunication || {};
    const emails   = Array.isArray(comms.emails) ? comms.emails : [];
    const phones   = Array.isArray(comms.phones) ? comms.phones : [];
    const dates    = worker.workerDates    || {};
    const wStatus  = worker.workerStatus   || {};
    const statusCode = wStatus.statusCode?.codeValue || wStatus.status || '';
    const assignments = Array.isArray(worker.workAssignments) ? worker.workAssignments[0] : {};
    const jobCode  = assignments.jobCode   || {};
    const deptName = assignments.homeOrganizationalUnit?.unitName
                  || assignments.department
                  || worker.assignedWorkGroup
                  || 'General';
    return {
      hris_employee_id: String(worker.associateOID || worker.workerID?.idValue || ''),
      first_name:       name.givenName     || worker.firstName || '',
      last_name:        name.familyName1   || name.familyName || worker.lastName || '',
      email:            (emails.find(e => e.nameCode?.codeValue === 'Work' || e.emailType === 'work')?.emailUri
                      || emails[0]?.emailUri || worker.email || '').toLowerCase().trim(),
      department:       deptName,
      job_title:        jobCode.longName   || assignments.jobTitle || worker.jobTitle || '',
      role:             isLeaderTitle(jobCode.longName || assignments.jobTitle) ? 'team_leader' : 'member',
      gender:           normalizeGender(person.genderCode?.codeValue || person.gender),
      birthday:         normalizeDate(person.birthDate || person.dateOfBirth),
      hire_date:        normalizeDate(dates.originalHireDate || dates.hireDate || worker.hireDate),
      phone:            phones[0]?.formattedNumber || worker.phone || '',
      employment_status:
        ['Active','ACTIVE','active','A'].includes(statusCode) ? 'active' :
        ['Terminated','TERMINATED','T'].includes(statusCode) ? 'terminated' : 'active',
      termination_date: normalizeDate(dates.terminationDate || worker.terminationDate),
      promotion_date:   null,
      new_title:        jobCode.longName || '',
      previous_title:   '',
    };
  },

  // ─── Gusto ─────────────────────────────────────────────────────────────────
  // API ref: https://docs.gusto.com/app-integrations/reference
  // Fields: uuid, first_name, last_name, email (work_email),
  //   department.title, job_title, date_of_birth, start_date,
  //   termination_date, terminated (bool),
  //   phone_numbers (array: {phone_number, phone_type}), gender
  gusto: (emp) => ({
    ...(() => { debugFirstRecord("gusto", emp); return {}; })(),
    hris_employee_id: String(emp.uuid || emp.id || emp.employee_id || ''),
    first_name:       emp.first_name  || emp.firstName || '',
    last_name:        emp.last_name   || emp.lastName  || '',
    email:            (emp.email || emp.work_email || emp.personal_email || '').toLowerCase().trim(),
    department:       emp.department?.title || emp.department || 'General',
    job_title:        emp.job_title   || emp.title     || emp.jobTitle || '',
    role:             isLeaderTitle(emp.job_title || emp.title) ? 'team_leader' : 'member',
    gender:           normalizeGender(emp.gender === 'M' ? 'male' : emp.gender === 'F' ? 'female' : emp.gender),
    birthday:         normalizeDate(emp.date_of_birth  || emp.dateOfBirth  || emp.dob),
    hire_date:        normalizeDate(emp.start_date     || emp.hireDate     || emp.hire_date),
    phone:            (Array.isArray(emp.phone_numbers)
                        ? (emp.phone_numbers.find(p => p.phone_type === 'work') || emp.phone_numbers[0])?.phone_number
                        : emp.phone) || '',
    employment_status: emp.terminated ? 'terminated' : 'active',
    termination_date:  normalizeDate(emp.termination_date),
    promotion_date:    null,
    new_title:         emp.job_title || '',
    previous_title:    '',
  }),

  // ─── Deel ──────────────────────────────────────────────────────────────────
  // API ref: https://developer.deel.com/docs/rest-api
  // Nested under data.profile, data.job, data.contract
  deel: (item) => {
    debugFirstRecord("deel", item);
        const emp      = item.data || item;
    const profile  = emp.profile  || {};
    const job      = emp.job      || {};
    const contract = emp.contract || {};
    return {
      hris_employee_id: String(emp.id || ''),
      first_name:       profile.firstName || emp.firstName || emp.first_name || '',
      last_name:        profile.lastName  || emp.lastName  || emp.last_name  || '',
      email:            (profile.email    || emp.email     || '').toLowerCase().trim(),
      department:       job.department    || emp.department || 'General',
      job_title:        job.title         || emp.jobTitle  || emp.job_title  || '',
      role:             isLeaderTitle(job.title || emp.jobTitle) ? 'team_leader' : 'member',
      gender:           normalizeGender(profile.gender || emp.gender),
      birthday:         normalizeDate(profile.dateOfBirth || emp.dateOfBirth || emp.date_of_birth),
      hire_date:        normalizeDate(contract.startDate  || emp.startDate  || emp.start_date),
      phone:            profile.phone || emp.phone || '',
      employment_status:
        ['active','Active','ACTIVE'].includes(emp.status || '') ? 'active' :
        ['terminated','Terminated','offboarded'].includes(emp.status || '') ? 'terminated' : 'active',
      termination_date: normalizeDate(contract.endDate    || emp.terminationDate),
      promotion_date:   null,
      new_title:        job.title || '',
      previous_title:   '',
    };
  },

  // ─── HiBob ─────────────────────────────────────────────────────────────────
  // API ref: https://apidocs.hibob.com/reference
  // Nested: work.email, work.department, work.title, work.startDate,
  //   personal.gender, personal.dateOfBirth (YYYY-MM-DD),
  //   personal.communication.phoneNumber,
  //   work.termination.date (for leavers)
  hibob: (emp) => {
    debugFirstRecord("hibob", emp);
        const work     = emp.work     || {};
    const personal = emp.personal || {};
    const comms    = personal.communication || {};
    const termination = work.termination || {};
    const displayName = emp.displayName || work.displayName || '';
    const nameParts   = displayName.split(' ');
    return {
      hris_employee_id: String(emp.id || ''),
      first_name:       emp.firstName || nameParts[0] || '',
      last_name:        emp.surname   || emp.lastName || nameParts.slice(1).join(' ') || '',
      email:            (work.email   || personal.email || emp.email || '').toLowerCase().trim(),
      department:       work.department || 'General',
      job_title:        work.title    || work.jobTitle  || emp.jobTitle || '',
      role:             isLeaderTitle(work.title || work.jobTitle) ? 'team_leader' : 'member',
      gender:           normalizeGender(personal.gender || emp.gender),
      birthday:         normalizeDate(personal.dateOfBirth || personal.dob || emp.dob),
      hire_date:        normalizeDate(work.startDate   || emp.startDate || emp.hireDate),
      phone:            comms.phoneNumber || comms.phone || personal.phone || emp.phone || '',
      employment_status:
        termination.date ? 'terminated' :
        ['Active','active'].includes(emp.status || work.status || '') ? 'active' :
        ['Inactive','inactive'].includes(emp.status || '') ? 'terminated' : 'active',
      termination_date: normalizeDate(termination.date || emp.terminationDate),
      promotion_date:   null,
      new_title:        work.title || '',
      previous_title:   '',
    };
  },

  // ─── Personio ──────────────────────────────────────────────────────────────
  // API ref: https://developer.personio.de/reference
  // All fields wrapped: data.attributes.<field>.value
  // department is nested: data.attributes.department.value.attributes.name
  personio: (item) => {
    debugFirstRecord("personio", item);
        const attrs = item.attributes || item.data?.attributes || item;
    const v = (key, fallback = '') => {
      const node = attrs[key];
      if (!node) return fallback;
      if (typeof node === 'object' && 'value' in node) return node.value ?? fallback;
      return node ?? fallback;
    };
    const dept = (() => {
      const d = attrs.department;
      if (!d) return 'General';
      if (d?.value?.attributes?.name) return d.value.attributes.name;
      if (typeof d.value === 'string') return d.value;
      return 'General';
    })();
    const jobTitle = v('position') || v('job_title') || v('subcompany') || '';
    return {
      hris_employee_id: String(v('id') || item.id || ''),
      first_name:       String(v('first_name') || ''),
      last_name:        String(v('last_name')  || ''),
      email:            String(v('email')       || '').toLowerCase().trim(),
      department:       dept,
      job_title:        jobTitle,
      role:             isLeaderTitle(jobTitle) ? 'team_leader' : 'member',
      gender:           normalizeGender(v('gender')),
      birthday:         normalizeDate(String(attrs.birth_date?.value || attrs.date_of_birth?.value || '')),
      hire_date:        normalizeDate(String(v('hire_date') || '')),
      phone:            String(v('work_phone') || v('mobile_phone') || ''),
      employment_status:
        ['active','Active'].includes(v('status') || '') ? 'active' :
        ['inactive','leave','terminated'].includes((v('status') || '').toLowerCase()) ? 'terminated' : 'active',
      termination_date: normalizeDate(String(v('termination_date') || v('last_working_day') || '')),
      promotion_date:   null,
      new_title:        jobTitle,
      previous_title:   '',
    };
  },

  // ─── Oracle HCM ────────────────────────────────────────────────────────────
  // API ref: https://docs.oracle.com/en/cloud/saas/human-resources
  // REST: /hcmRestApi/resources/11.13.18.05/workers
  // Fields: PersonId, DisplayName, FirstName, LastName,
  //   DepartmentName (from assignments), JobTitle, GenderCode (M/F/ORA_UNKNOWN),
  //   DateOfBirth, HireDate, ActiveFlag, TerminationDate
  oracle_hcm: (worker) => {
    debugFirstRecord("oracle_hcm", worker);
        const assignments = Array.isArray(worker.assignments) ? worker.assignments[0] : (worker.assignments || {});
    const emails = Array.isArray(worker.emails) ? worker.emails : [];
    const phones = Array.isArray(worker.phones) ? worker.phones : [];
    const email  = emails.find(e => e.EmailType === 'W1' || e.emailType === 'work')?.EmailAddress
               || emails[0]?.EmailAddress || worker.workEmail || '';
    const phone  = phones.find(p => p.PhoneType === 'W1' || p.phoneType === 'work')?.FormattedPhoneNumber
               || phones[0]?.FormattedPhoneNumber || worker.phone || '';
    const dept   = assignments.DepartmentName || assignments.departmentName || worker.DepartmentName || 'General';
    const title  = assignments.JobTitle || assignments.jobTitle || worker.JobTitle || worker.jobTitle || '';
    const gender = worker.GenderCode || worker.genderCode || worker.Gender || '';
    return {
      hris_employee_id: String(worker.PersonId || worker.personId || worker.PersonNumber || ''),
      first_name:       worker.FirstName  || worker.firstName  || (worker.DisplayName || '').split(' ')[0] || '',
      last_name:        worker.LastName   || worker.lastName   || (worker.DisplayName || '').split(' ').slice(1).join(' ') || '',
      email:            email.toLowerCase().trim(),
      department:       dept,
      job_title:        title,
      role:             isLeaderTitle(title) ? 'team_leader' : 'member',
      gender:           normalizeGender(gender === 'M' ? 'male' : gender === 'F' ? 'female' : gender),
      birthday:         normalizeDate(worker.DateOfBirth || worker.dateOfBirth),
      hire_date:        normalizeDate(worker.HireDate    || worker.hireDate    || worker.StartDate),
      phone:            phone,
      employment_status:
        worker.ActiveFlag === true || worker.ActiveFlag === 'Y' || worker.workerStatus === 'Active' ? 'active' :
        worker.TerminationDate ? 'terminated' : 'active',
      termination_date: normalizeDate(worker.TerminationDate || worker.terminationDate),
      promotion_date:   null,
      new_title:        title,
      previous_title:   '',
    };
  },
};

// ─── Provider API fetchers ─────────────────────────────────────────────────────

async function fetchFromBambooHR(connection) {
  // Docs: https://documentation.bamboohr.com/reference/get-employees-directory
  const encoded = Buffer.from(`${connection.api_key}:x`).toString('base64');
  const res = await axios.get(
    `https://api.bamboohr.com/api/gateway.php/${connection.subdomain}/v1/employees/directory`,
    { headers: { Authorization: `Basic ${encoded}`, Accept: 'application/json' }, timeout: 30000 }
  );
  return (res.data?.employees || []).map(ADAPTERS.bamboohr);
}

async function fetchFromSeamlessHR(connection) {
  // Docs: https://documenter.getpostman.com/view/9348048/2sA2xiWC
  const employees = [];
  let page = 1;
  while (true) {
    const res = await axios.get(
      `https://api.seamlesshr.com/v1/employees?page=${page}&per_page=100`,
      { headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' }, timeout: 30000 }
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
  // Docs: https://help.sap.com/docs/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL
  const encoded = Buffer.from(`${connection.api_key}@${connection.company_code}:${connection.api_secret}`).toString('base64');
  const baseUrl = connection.base_url || 'https://api4.successfactors.com/odata/v2';
  const fields  = 'userId,firstName,lastName,email,department,title,gender,dateOfBirth,startDate,status,endDate,mobilePhone,businessPhone';
  const res = await axios.get(
    `${baseUrl}/User?$select=${fields}&$format=json&$top=1000`,
    { headers: { Authorization: `Basic ${encoded}`, Accept: 'application/json' }, timeout: 30000 }
  );
  const employees = res.data?.d?.results || res.data?.value || [];
  return employees.map(ADAPTERS.sap_successfactors);
}

// Refresh a Zoho OAuth access token using the stored refresh_token.
// Updates the hris_connections row in Supabase with the new token.
async function refreshZohoToken(connection) {
  const domain = connection.base_url || 'https://accounts.zoho.com';
  const params = new URLSearchParams({
    refresh_token: connection.refresh_token,
    client_id:     connection.api_key     || process.env.ZOHO_CLIENT_ID,
    client_secret: connection.api_secret  || process.env.ZOHO_CLIENT_SECRET,
    grant_type:    'refresh_token',
  });
  console.log('[zoho-refresh] domain:', domain.replace(/\/$/, ''));
  console.log('[zoho-refresh] client_id:', params.get('client_id'));
  console.log('[zoho-refresh] client_secret (first 8):', (params.get('client_secret') || '').slice(0, 8));
  console.log('[zoho-refresh] refresh_token (first 16):', (connection.refresh_token || '').slice(0, 16));
  const r = await axios.post(
    `${domain.replace(/\/$/, '')}/oauth/v2/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  console.log('[zoho-refresh] response:', JSON.stringify(r.data));
  if (!r.data.access_token) {
    throw new Error(`Zoho token refresh failed: ${JSON.stringify(r.data)}`);
  }
  const tokenExpiresAt = new Date(Date.now() + (r.data.expires_in || 3600) * 1000);
  if (connection.id) {
    await supabase.from('hris_connections').update({
      access_token:     r.data.access_token,
      token_expires_at: tokenExpiresAt,
      updated_at:       new Date(),
    }).eq('id', connection.id);
  }
  // Update in-memory so the caller immediately sees the new token
  connection.access_token     = r.data.access_token;
  connection.token_expires_at = tokenExpiresAt;
  return r.data.access_token;
}

async function fetchFromZohoPeople(connection) {
  // BUG FIX 1: Always refresh token before fetching
  const needsRefresh = !!connection.refresh_token;
  if (needsRefresh) {
    try {
      await refreshZohoToken(connection);
      const { data } = await supabase.from('hris_connections')
        .select('access_token, token_expires_at').eq('id', connection.id).single();
      connection.access_token     = data?.access_token;
      connection.token_expires_at = data?.token_expires_at;
    } catch (refreshErr) {
      console.error('Zoho token refresh failed:', refreshErr.response?.data || refreshErr.message);
      throw new Error('Zoho authentication failed. Please reconnect Zoho People in HRIS settings.');
    }
  }
  if (!connection.access_token) throw new Error('No Zoho access token available. Please save your connection credentials first.');

  const authHeader = { Authorization: `Zoho-oauthtoken ${connection.access_token}` };
  const timeout    = 30000;
  let   records    = [];
  const endpoints  = [
    { url: 'https://people.zoho.com/people/api/forms/P_EmployeeView/getRecords?sIndex=1&limit=200', label: 'P_EmployeeView-zoho.com' },
    { url: 'https://people.zoho.com/people/api/forms/employee/getRecords?sIndex=1&limit=200',       label: 'employee-zoho.com' },
  ];
  let lastStatus = null;
  let lastBody   = null;

  for (const ep of endpoints) {
    try {
      console.log('[zoho] trying:', ep.label, ep.url.split('?')[0]);
      const epRes = await axios.get(ep.url, { headers: authHeader, timeout });
      const body  = epRes.data;

      // Detect ALL Zoho error formats
      const isBodyError =
        (body?.code && body?.message && !body?.data) ||
        !!body?.response?.errors || !!body?.errors || !!body?.error;

      if (isBodyError) {
        console.warn('[zoho]', ep.label, 'body error — skipping:', JSON.stringify(body).slice(0, 200));
        lastBody = body;
        continue;
      }

      // Zoho employee/getRecords returns body.data as an ARRAY of wrapper objects:
      // [ {"ZOHO_ID_1": [empObj]}, {"ZOHO_ID_2": [empObj]}, ... ]
      const rows    = body?.data || body?.response?.result || body?.result || [];
      const rowsArr = Array.isArray(rows) ? rows : Object.values(rows || {});
      records = rowsArr
        .flatMap(item => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            return Object.values(item).flatMap(v => Array.isArray(v) ? v : [v]);
          }
          if (Array.isArray(item)) return item;
          return [item];
        })
        .filter(r => r && typeof r === 'object' && !Array.isArray(r) && (r.EmailID || r.email || r.FirstName));
      console.log('[zoho]', ep.label, 'success — records:', records.length);
      break;
    } catch (epErr) {
      lastStatus = epErr.response?.status;
      lastBody   = epErr.response?.data;
      console.warn('[zoho]', ep.label, 'failed:', lastStatus, JSON.stringify(lastBody)?.slice(0, 200));
    }
  }

  if (records.length === 0 && lastStatus) {
    const bodyStr = typeof lastBody === 'string' ? lastBody.slice(0, 300) : JSON.stringify(lastBody)?.slice(0, 300);
    if (lastStatus === 401) throw new Error(`Zoho API 401. Please disconnect and reconnect Zoho People. Raw: ${bodyStr}`);
    if (lastStatus === 403) throw new Error(`Zoho API 403 — your Zoho People plan may not include API access. Body: ${bodyStr}`);
    throw new Error(`Zoho API error ${lastStatus}: ${bodyStr}`);
  }

  if (records.length > 0) console.log('[zoho] RAW FIRST RECORD:', JSON.stringify(records[0]));
  else console.log('[zoho] No records returned from Zoho People');

  return records.map(ADAPTERS.zoho_people);
}

async function fetchFromWorkPay(connection) {
  // Docs: https://api.workpay.africa/docs
  const employees = [];
  let page = 1;
  while (true) {
    const res = await axios.get(
      `https://api.workpay.africa/v1/employees?page=${page}&per_page=100`,
      { headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' }, timeout: 30000 }
    );
    const data  = res.data?.data || res.data?.employees || res.data || [];
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) break;
    employees.push(...items.map(ADAPTERS.workpay));
    if (items.length < 100) break;
    page++;
  }
  return employees;
}

// ─── New provider fetchers ─────────────────────────────────────────────────────

async function fetchFromRippling(connection) {
  // Rippling API — Bearer token, paginated employees
  // Docs: https://developer.rippling.com/docs/employee
  const employees = [];
  let cursor = null;
  do {
    const url = `https://api.rippling.com/platform/api/employees${cursor ? `?cursor=${cursor}` : ''}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${connection.api_key}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    const data = res.data?.results || res.data?.data || res.data || [];
    if (Array.isArray(data)) employees.push(...data.map(ADAPTERS.rippling));
    cursor = res.data?.next_cursor || res.data?.nextCursor || null;
  } while (cursor);
  return employees;
}

async function fetchFromADP(connection) {
  // ADP Workforce Now — OAuth2 client_credentials, workers endpoint
  // Docs: https://developers.adp.com/articles/api/workforce-now-v2-api
  // Requires: client_id (api_key), client_secret (api_secret), base_url
  const tokenRes = await axios.post(
    `${(connection.base_url || 'https://accounts.adp.com').replace(/\/+$/, '')}/auth/oauth/v2/token`,
    'grant_type=client_credentials',
    {
      auth: { username: connection.api_key, password: connection.api_secret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    }
  );
  const accessToken = tokenRes.data.access_token;
  const apiBase = (connection.base_url || 'https://api.adp.com').replace(/\/+$/, '');
  const employees = [];
  let skip = 0;
  const limit = 100;
  while (true) {
    const res = await axios.get(`${apiBase}/hr/v2/workers?$top=${limit}&$skip=${skip}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      timeout: 30000,
    });
    const workers = res.data?.workers || [];
    if (!workers.length) break;
    employees.push(...workers.map(ADAPTERS.adp));
    if (workers.length < limit) break;
    skip += limit;
  }
  return employees;
}

async function fetchFromGusto(connection) {
  // Gusto API — Bearer token (company access token)
  // Docs: https://docs.gusto.com/app-integrations/reference/get-v1-companies-company_id-employees
  const companyRes = await axios.get('https://api.gusto.com/v1/me', {
    headers: { Authorization: `Bearer ${connection.api_key}` },
    timeout: 15000,
  });
  const companyId = companyRes.data?.company_id || companyRes.data?.companies?.[0]?.company_uuid
                 || connection.company_code;
  if (!companyId) throw new Error('Could not determine Gusto company ID. Ensure your API token has company access.');

  const res = await axios.get(`https://api.gusto.com/v1/companies/${companyId}/employees?include=all_compensations`, {
    headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' },
    timeout: 30000,
  });
  return (res.data || []).map(ADAPTERS.gusto);
}

async function fetchFromDeel(connection) {
  // Deel API — Bearer token, /rest/v2/people endpoint
  // Docs: https://developer.deel.com/docs/rest-api
  const employees = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await axios.get(`https://api.letsdeel.com/rest/v2/people?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' },
      timeout: 30000,
    });
    const data = res.data?.data || res.data?.people || res.data || [];
    if (!data.length) break;
    employees.push(...data.map(ADAPTERS.deel));
    if (data.length < limit) break;
    offset += limit;
  }
  return employees;
}

async function fetchFromHiBob(connection) {
  // HiBob API — Service User (api_key = service user token)
  // Docs: https://apidocs.hibob.com/reference/get_people
  const employees = [];
  let page = 1;
  while (true) {
    const res = await axios.get(`https://api.hibob.com/v1/people?limit=100&page=${page}`, {
      headers: { Authorization: `Basic ${Buffer.from(connection.api_key + ':').toString('base64')}`, Accept: 'application/json' },
      timeout: 30000,
    });
    // Try alternate auth format if needed
    const employees_raw = res.data?.employees || res.data?.data || res.data?.people || res.data || [];
    if (!employees_raw.length) break;
    employees.push(...employees_raw.map(ADAPTERS.hibob));
    if (employees_raw.length < 100) break;
    page++;
  }
  return employees;
}

async function fetchFromPersonio(connection) {
  // Personio API — client_id + client_secret auth
  // api_key = client_id, api_secret = client_secret
  // Docs: https://developer.personio.de/reference/post_auth
  const authRes = await axios.post('https://api.personio.de/v1/auth', {
    client_id:     connection.api_key,
    client_secret: connection.api_secret,
  }, { timeout: 15000 });
  const token = authRes.data?.data?.token;
  if (!token) throw new Error('Personio auth failed — check Client ID and Client Secret');

  const employees = [];
  let offset = 0;
  while (true) {
    const res = await axios.get(`https://api.personio.de/v1/company/employees?limit=100&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeout: 30000,
    });
    const data = res.data?.data || [];
    if (!data.length) break;
    employees.push(...data.map(ADAPTERS.personio));
    if (data.length < 100) break;
    offset += 100;
  }
  return employees;
}

async function fetchFromOracleHCM(connection) {
  // Oracle HCM — Basic auth with username@TenantID:password
  // base_url = tenant URL e.g. https://mycompany.fa.oraclecloud.com
  const base = (connection.base_url || '').replace(/\/+$/, '');
  if (!base) throw new Error('Oracle HCM requires a Base URL (e.g. https://mycompany.fa.oraclecloud.com)');
  const encoded = Buffer.from(`${connection.api_key}:${connection.api_secret}`).toString('base64');
  const employees = [];
  let offset = 0;
  while (true) {
    const res = await axios.get(
      `${base}/hcmRestApi/resources/11.13.18.05/workers?expand=assignments,emails,phones&offset=${offset}&limit=100`,
      { headers: { Authorization: `Basic ${encoded}`, Accept: 'application/json' }, timeout: 30000 }
    );
    const items = res.data?.items || res.data?.workers || [];
    if (!items.length) break;
    employees.push(...items.map(ADAPTERS.oracle_hcm));
    if (!res.data?.hasMore && items.length < 100) break;
    offset += 100;
  }
  return employees;
}

const PROVIDER_FETCHERS = {
  bamboohr:           fetchFromBambooHR,
  seamlesshr:         fetchFromSeamlessHR,
  sap_successfactors: fetchFromSAPSuccessFactors,
  zoho_people:        fetchFromZohoPeople,
  workpay:            fetchFromWorkPay,
  rippling:           fetchFromRippling,
  adp:                fetchFromADP,
  gusto:              fetchFromGusto,
  deel:               fetchFromDeel,
  hibob:              fetchFromHiBob,
  personio:           fetchFromPersonio,
  oracle_hcm:         fetchFromOracleHCM,
};

// ─── Core sync engine — maps employees to ALL occasion tables ─────────────────
// `occasionTypes` param kept for backward-compatible call signature, but is no
// longer used here: company_members is the single source of truth, and the
// daily cron (server.js) computes occasion eligibility directly from its
// columns via utils/occasionEngine.js.
async function syncEmployeesToOccasionTables(companyId, employees, _occasionTypes) {
  const counts  = { birthday:0, anniversary:0, womens_day:0, mens_day:0, valentines:0, workers_day:0, promotions:0, leaving:0, new_hire:0, deactivated:0, errors:0, invites_sent:0 };
  const errors  = [];

  // Fetch company name/contact once for invite emails
  const { data: companyData } = await supabase.from('companies').select('name, contact_person, country').eq('id', companyId).single();

  // TEMP DEBUG — log first adapted employee to see what fields came through
  if (employees.length > 0) {
    console.log('[sync-debug] employees.length:', employees.length);
    console.log('[sync-debug] first employee raw:', JSON.stringify(employees[0]));
  }

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
  // Priority: HRIS > Occasions Manager / master template, BUT only for FILLING
  // GAPS. If the member already has a record (e.g. imported earlier via the
  // master template) with a field already filled in, we do NOT overwrite it
  // with HRIS data — we only fill in cells that are currently empty/null.
  // Lifecycle fields (status / employment_status) always apply from HRIS
  // since that reflects whether the person is still employed.

      // Fetch the FULL existing row (if any) so we can compare field-by-field.
      const { data: existingMember } = await supabase.from('company_members')
        .select('*')
        .eq('company_id', companyId).eq('email', base.email).maybeSingle();

      const hrisValues = {
        first_name:      base.first_name,
        last_name:       base.last_name,
        department:      base.department,
        gender:          base.gender || null,
        job_title:       base.job_title || null,
        date_of_birth:   emp.birthday || null,
        resumption_date: emp.hire_date || null,
        phone:           emp.phone || null,
        role:            emp.role || 'member',
        // Farewell/Promotion dates — company_members (Team Members page) is the
        // single source of truth for automation, so HRIS writes these directly
        // here too (fill-gaps-only, same as every other field below).
        promotion_date:  emp.promotion_date   || null,
        leaving_date:    emp.termination_date || null,
      };

      const cmRow = { company_id: companyId, email: base.email, updated_at: new Date() };

      if (existingMember) {
        // EXISTING MEMBER — fill gaps only, never clobber a non-empty value
        for (const [key, hrisVal] of Object.entries(hrisValues)) {
          const existingVal = existingMember[key];
          const existingIsEmpty = existingVal === null || existingVal === undefined || existingVal === '';
          cmRow[key] = existingIsEmpty ? hrisVal : existingVal;
        }
      } else {
        // BRAND NEW MEMBER — HRIS data populates everything
        Object.assign(cmRow, hrisValues);
      }

      // Lifecycle status always reflects current HRIS employment status
      cmRow.status = emp.employment_status === 'terminated' ? 'deactivated' : 'approved';

      // hris_employee_id is always set/refreshed from HRIS so future syncs can match
      cmRow.hris_employee_id = base.hris_employee_id || existingMember?.hris_employee_id || null;

      const needsInvite = cmRow.status === 'approved' && !existingMember?.password_hash && !existingMember?.invite_accepted;
      let inviteToken = existingMember?.invite_token || null;
      const cmRowToUpsert = { ...cmRow };
      if (needsInvite) {
        inviteToken = crypto.randomBytes(32).toString('hex');
        cmRowToUpsert.invite_token  = inviteToken;
        cmRowToUpsert.password_hash = await hashPassword(crypto.randomBytes(8).toString('hex'));
      }

      let { error: cmErr } = await supabase.from('company_members')
        .upsert(cmRowToUpsert, { onConflict: 'company_id,email' });

      // If the upsert fails specifically on the role column for any reason,
      // retry with the safe default 'member' rather than failing the whole sync.
      if (cmErr && /role/i.test(cmErr.message || '')) {
        cmRowToUpsert.role = cmRowToUpsert.role === 'team_leader' ? 'team_leader' : 'member';
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


  // ── DEACTIVATE terminated employees ──────────────────────────────────
      // company_members is the single source of truth for automation — the
      // daily cron reads `status` directly from here. occasion_members is no
      // longer used as a trigger source.
      if (emp.employment_status === 'terminated') {
        await supabase.from('company_members')
          .update({ status: 'deactivated', updated_at: new Date() })
          .eq('company_id', companyId).eq('email', base.email);
        counts.deactivated++;
        continue; // Don't add to any table
      }

      // Birthday, work anniversary, gender-based days, Valentine's, Workers' Day,
      // promotion, leaving, and new hire are all now computed directly from
      // company_members columns by the daily cron (see utils/occasionEngine.js).
      // No occasion_members writes needed here — cmRow above already carries
      // date_of_birth, resumption_date, gender, promotion_date, leaving_date.
      counts.birthday    += emp.birthday        ? 1 : 0;
      counts.anniversary += emp.hire_date       ? 1 : 0;
      counts.womens_day  += emp.gender === 'female' ? 1 : 0;
      counts.mens_day    += emp.gender === 'male'   ? 1 : 0;
      counts.valentines++;
      counts.workers_day++;
      counts.promotions  += emp.promotion_date    ? 1 : 0;
      counts.leaving     += emp.termination_date  ? 1 : 0;
      if (emp.hire_date) {
        const hd = new Date(emp.hire_date);
        if (!isNaN(hd) && hd >= new Date(new Date().setHours(0,0,0,0))) counts.new_hire++;
      }

    } catch (err) {
      errors.push(`Error syncing ${emp.email}: ${err.message}`);
      counts.errors++;
    }
  }

  return { counts, errors };
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
// `occasionTypes` param kept for backward-compatible call signature, but is
// no longer used: company_members is the single source of truth, so an
// employee who has disappeared from the HRIS export entirely (not just
// marked terminated) gets deactivated directly in company_members.
async function deactivateMissingEmployees(companyId, hrisEmployees, _occasionTypes) {
  const activeHRISIds = new Set(
    hrisEmployees.filter(e => e.employment_status !== 'terminated').map(e => e.hris_employee_id)
  );

  const { data: thankeeuMembers } = await supabase.from('company_members')
    .select('id, hris_employee_id')
    .eq('company_id', companyId)
    .neq('status', 'deactivated')
    .not('hris_employee_id', 'is', null);

  let deactivated = 0;
  for (const m of (thankeeuMembers || [])) {
    if (!activeHRISIds.has(m.hris_employee_id)) {
      await supabase.from('company_members')
        .update({ status: 'deactivated', updated_at: new Date() })
        .eq('id', m.id);
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
