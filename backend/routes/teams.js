const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { companyAuth } = require('../middleware/companyAuth');
const supabase = require('../utils/supabase');
const { getWorkersDayDate } = require('../utils/workersDay');
const { validateUUIDParam } = require('../utils/paramGuard');
const {
  downloadTemplate, importTeamMembers, getTeamMembers,
  getDepartments, deleteTeamMember, getTeamsDashboard,
} = require('../controllers/teamsController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(companyAuth);

// Template download & Excel import
router.get('/template',                downloadTemplate);
router.post('/import', upload.single('file'), importTeamMembers);

// List / dashboard
router.get('/',                        getTeamMembers);
router.get('/departments',             getDepartments);
router.get('/dashboard',               getTeamsDashboard);

// Extended member list with birthday + edit
router.get('/all-members', async (req, res) => {
  console.log('[all-members] START — company:', req.company?.id);
  try {
    const search = (req.query.search || '').trim();
    const dept   = (req.query.dept   || '').trim();
    const role   = (req.query.role   || '').trim();
    const companyId = req.company.id;

    // Step 1: company_members — use select('*') so no column name can cause 500
    let q = supabase
      .from('company_members')
      .select('*')
      .eq('company_id', companyId)
      .order('first_name', { ascending: true });
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (dept)   q = q.eq('department', dept);
    if (role)   q = q.eq('role', role);

    const { data: cmRaw, error: cmErr } = await q;
    if (cmErr) {
      console.error('[all-members] company_members FAIL:', JSON.stringify(cmErr));
      return res.status(500).json({ error: 'company_members: ' + cmErr.message });
    }
    // Exclude deactivated members — but rows with status NULL/undefined
    // (e.g. older HRIS-synced records) count as active, not deactivated.
    const cmData = (cmRaw || []).filter(m => m.status !== 'deactivated');
    console.log('[all-members] company_members OK:', (cmRaw||[]).length, 'rows total,', cmData.length, 'after status filter');

    // Step 2: occasion_members supplement — non-fatal if it fails
    const cmEmails = new Set((cmData||[]).map(m=>m.email?.toLowerCase()).filter(Boolean));
    let omData = [];
    try {
      let omQ = supabase
        .from('occasion_members')
        .select('id, email, first_name, last_name, department, gender, member_id')
        .eq('company_id', companyId);
      if (dept)   omQ = omQ.eq('department', dept);
      if (search) omQ = omQ.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data: omRows, error: omErr } = await omQ;
      if (omErr) console.error('[all-members] occasion_members non-fatal:', omErr.message);
      else omData = omRows || [];
    } catch(omEx) { console.error('[all-members] occasion_members exception:', omEx.message); }
    console.log('[all-members] occasion_members OK:', omData.length, 'rows');

    const omUnique = Object.values(
      omData
        .filter(m => m.email && !cmEmails.has(m.email.toLowerCase()))
        .reduce((acc, m) => {
          const k = m.email.toLowerCase();
          if (!acc[k] || (!acc[k].member_id && m.member_id)) acc[k] = m;
          return acc;
        }, {})
    ).map(m => ({ ...m, id: m.member_id||`om_${m.email}`, status:'approved', role:m.role||'member', source:'occasion_import' }));

    const allMembers  = [...(cmData||[]), ...omUnique];
    const departments = [...new Set(allMembers.map(m=>m.department).filter(Boolean))];

    // leaving_date and promotion_date are now native company_members columns
    // (added via migration_credit_system.sql) — already present in cmData rows
    // via select('*'). omUnique (occasion_members-only supplement rows) don't
    // have these columns, so default them to null.
    for (const m of allMembers) {
      if (m.leaving_date   === undefined) m.leaving_date   = null;
      if (m.promotion_date === undefined) m.promotion_date = null;
    }

    // workers_day_date is computed from the company's country — same for everyone,
    // not stored per-member.
    const workersDayDate = getWorkersDayDate(req.company?.country, new Date().getFullYear());
    for (const m of allMembers) m.workers_day_date = workersDayDate;

    console.log('[all-members] DONE — total:', allMembers.length);
    res.json({ members: allMembers, teams_count: departments.length, departments });

  } catch (err) {
    console.error('[all-members] CRASH:', err.message, '\n', err.stack);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// Edit member
// company_members (Team Members page) is the single source of truth for
// occasion automation. Editing birthday, work anniversary, gender, farewell,
// or promotion date here directly controls what the daily cron will act on —
// no separate occasion_members rows to keep in sync.
router.put('/members/:id', validateUUIDParam('id'), async (req, res) => {
  try {
    const raw = req.body;
    const { sanitizeName, sanitizePhone, sanitizeDate, sanitizeText, validateEmail } = require('../utils/sanitize');
    // Explicitly block is_core_team from being set via this route
    delete req.body.is_core_team;
    const u = { updated_at: new Date() };
    if (raw.first_name    !== undefined) u.first_name     = sanitizeName(raw.first_name, 'First name', { required: false, maxLen: 60 });
    if (raw.last_name     !== undefined) u.last_name      = sanitizeName(raw.last_name,  'Last name',  { required: false, maxLen: 60 });
    if (raw.email         !== undefined) u.email          = raw.email ? validateEmail(raw.email) : null;
    if (raw.department    !== undefined) u.department     = sanitizeText(raw.department, 'Department', { maxLen: 100 });
    if (raw.role          !== undefined) u.role           = sanitizeText(raw.role, 'Role', { maxLen: 60 });
    if (raw.phone         !== undefined) u.phone          = sanitizePhone(raw.phone);
    if (raw.job_title     !== undefined) u.job_title      = sanitizeText(raw.job_title, 'Job title', { maxLen: 100 });
    if (raw.date_of_birth !== undefined) u.date_of_birth  = sanitizeDate(raw.date_of_birth, 'Date of birth') || null;
    if (raw.gender        !== undefined) u.gender         = raw.gender || null;
    if (raw.resumption_date!==undefined) u.resumption_date= sanitizeDate(raw.resumption_date, 'Resumption date', { allowFuture: true }) || null;
    if (raw.leaving_date  !== undefined) u.leaving_date   = sanitizeDate(raw.leaving_date,   'Leaving date',   { allowFuture: true }) || null;
    if (raw.promotion_date!== undefined) u.promotion_date = sanitizeDate(raw.promotion_date, 'Promotion date', { allowFuture: true }) || null;

    // Fetch current row first so we can detect date CHANGES and reset
    // per-occasion notification tracking only for the occasion(s) that changed.
    const { data: before } = await supabase.from('company_members')
      .select('date_of_birth, resumption_date, leaving_date, promotion_date, occasion_tracking')
      .eq('id', req.params.id).eq('company_id', req.company.id).maybeSingle();

    const tracking = { ...(before?.occasion_tracking || {}) };
    const dateChanged = (field, occasionKey) => {
      if (u[field] === undefined) return;
      const oldVal = before?.[field] || null;
      const newVal = u[field] || null;
      if (oldVal !== newVal && tracking[occasionKey]) {
        delete tracking[occasionKey]; // allow automation to re-fire for the new date
      }
    };
    dateChanged('date_of_birth',    'birthday');
    dateChanged('resumption_date',  'work_anniversary');
    dateChanged('resumption_date',  'new_hire');
    dateChanged('leaving_date',     'leaving');
    dateChanged('promotion_date',   'promotion');
    if (Object.keys(tracking).length !== Object.keys(before?.occasion_tracking || {}).length) {
      u.occasion_tracking = tracking;
    }

    const { data, error } = await supabase.from('company_members')
      .update(u).eq('id', req.params.id).eq('company_id', req.company.id).select().maybeSingle();
    if (error) throw error;

    res.json(data);
  } catch (err) { console.error('[teams]', err.message);
    const { isSanitizeError } = require('../utils/sanitize');
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Operation failed' }); }
});

// Delete member
router.delete('/members/:id', validateUUIDParam('id'), async (req, res) => {
  try {
    await supabase.from('company_members').delete().eq('id', req.params.id).eq('company_id', req.company.id);
    res.json({ message: 'Member removed' });
  } catch (err) { console.error('[teams]', err.message); res.status(500).json({ error: 'Operation failed' }); }
});

// Suspend / unsuspend member
router.patch('/members/:id/status', validateUUIDParam('id'), async (req, res) => {
  try {
    const { status } = req.body;
    // Allowlist check prevents prototype pollution via status='__proto__' etc.
    if (!['approved','suspended','pending'].includes(String(status || '')))
      return res.status(400).json({ error: 'Invalid status. Must be approved, suspended or pending.' });
    const cleanStatus = String(status);
    const { data, error } = await supabase.from('company_members')
      .update({ status: cleanStatus, updated_at: new Date() }).eq('id', req.params.id).eq('company_id', req.company.id).select().maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[teams]', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete by old route
router.delete('/:memberId', deleteTeamMember);

module.exports = router;
