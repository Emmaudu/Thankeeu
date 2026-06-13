const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { companyAuth } = require('../middleware/companyAuth');
const supabase = require('../utils/supabase');
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
      .neq('status', 'deactivated')
      .order('first_name', { ascending: true });
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (dept)   q = q.eq('department', dept);
    if (role)   q = q.eq('role', role);

    const { data: cmData, error: cmErr } = await q;
    if (cmErr) {
      console.error('[all-members] company_members FAIL:', JSON.stringify(cmErr));
      return res.status(500).json({ error: 'company_members: ' + cmErr.message });
    }
    console.log('[all-members] company_members OK:', (cmData||[]).length, 'rows');

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
    console.log('[all-members] DONE — total:', allMembers.length);
    res.json({ members: allMembers, teams_count: departments.length, departments });

  } catch (err) {
    console.error('[all-members] CRASH:', err.message, '\n', err.stack);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Edit member
router.put('/members/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, department, role, phone, job_title, date_of_birth, gender, resumption_date } = req.body;
    const u = { updated_at: new Date() };
    if (first_name !== undefined)   u.first_name    = first_name;
    if (last_name  !== undefined)   u.last_name     = last_name;
    if (email      !== undefined)   u.email         = email?.toLowerCase().trim();
    if (department !== undefined)   u.department    = department;
    if (role       !== undefined)   u.role          = role;
    if (phone      !== undefined)   u.phone         = phone;
    if (job_title  !== undefined)   u.job_title     = job_title;
    if (date_of_birth  !== undefined) u.date_of_birth  = date_of_birth  || null;
    if (gender         !== undefined) u.gender         = gender         || null;
    if (resumption_date!== undefined) u.resumption_date= resumption_date|| null;
    // Explicitly block is_core_team from being set via this route
    delete req.body.is_core_team;
    const { data, error } = await supabase.from('company_members')
      .update(u).eq('id', req.params.id).eq('company_id', req.company.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete member
router.delete('/members/:id', async (req, res) => {
  try {
    await supabase.from('company_members').delete().eq('id', req.params.id).eq('company_id', req.company.id);
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Suspend / unsuspend member
router.patch('/members/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved','suspended','pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { data, error } = await supabase.from('company_members')
      .update({ status, updated_at: new Date() }).eq('id', req.params.id).eq('company_id', req.company.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete by old route
router.delete('/:memberId', deleteTeamMember);


// POST /api/teams/members/:id/sync-occasions — auto-sync birthday/gender/resumption to occasion tables
router.post('/members/:id/sync-occasions', companyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date_of_birth, gender, resumption_date } = req.body;

    const { data: m } = await supabase.from('company_members')
      .select('email, first_name, last_name, department').eq('id', id).eq('company_id', req.company.id).single();
    if (!m) return res.status(404).json({ error: 'Member not found' });

    const { data: ots } = await supabase.from('occasion_types')
      .select('*').eq('company_id', req.company.id).eq('is_active', true);
    const typeMap = Object.fromEntries((ots || []).map(o => [o.name, o]));
    const yr = new Date().getFullYear();
    const base = { company_id: req.company.id, first_name: m.first_name, last_name: m.last_name, email: m.email, department: m.department };
    const synced = [];

    if (date_of_birth && typeMap.birthday) {
      const dob = new Date(date_of_birth);
      const bday = `${yr}-${String(dob.getMonth()+1).padStart(2,'0')}-${String(dob.getDate()).padStart(2,'0')}`;
      await supabase.from('occasion_members').upsert({ ...base, occasion_type_id: typeMap.birthday.id, occasion_date: bday }, { onConflict: 'company_id,occasion_type_id,email' });
      synced.push('birthday');
    }
    if (resumption_date && typeMap.work_anniversary) {
      const rd = new Date(resumption_date);
      const anniv = `${yr}-${String(rd.getMonth()+1).padStart(2,'0')}-${String(rd.getDate()).padStart(2,'0')}`;
      await supabase.from('occasion_members').upsert({ ...base, occasion_type_id: typeMap.work_anniversary.id, occasion_date: anniv }, { onConflict: 'company_id,occasion_type_id,email' });
      synced.push('work_anniversary');
    }
    if (gender === 'female' && typeMap.womens_day) {
      await supabase.from('occasion_members').upsert({ ...base, gender: 'female', occasion_type_id: typeMap.womens_day.id, occasion_date: `${yr}-03-08` }, { onConflict: 'company_id,occasion_type_id,email' });
      synced.push('womens_day');
    }
    if (gender === 'male' && typeMap.mens_day) {
      await supabase.from('occasion_members').upsert({ ...base, gender: 'male', occasion_type_id: typeMap.mens_day.id, occasion_date: `${yr}-11-19` }, { onConflict: 'company_id,occasion_type_id,email' });
      synced.push('mens_day');
    }
    if (typeMap.valentines_day) {
      await supabase.from('occasion_members').upsert({ ...base, occasion_type_id: typeMap.valentines_day.id, occasion_date: `${yr}-02-14` }, { onConflict: 'company_id,occasion_type_id,email' });
      synced.push('valentines_day');
    }

    res.json({ message: `Synced to ${synced.length} occasion table${synced.length !== 1 ? 's' : ''}`, synced });
  } catch (err) {
    console.error('sync-occasions:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
