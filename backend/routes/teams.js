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
  try {
    const { search, dept, role } = req.query;
    let q = supabase.from('company_members')
      .select('id, first_name, last_name, email, department, role, status, phone, job_title, date_of_birth, username, created_at')
      .eq('company_id', req.company.id)
      .order('first_name', { ascending: true });
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (dept)   q = q.eq('department', dept);
    if (role)   q = q.eq('role', role);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Edit member
router.put('/members/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, department, role, phone, job_title, date_of_birth } = req.body;
    const u = { updated_at: new Date() };
    if (first_name !== undefined)   u.first_name    = first_name;
    if (last_name  !== undefined)   u.last_name     = last_name;
    if (email      !== undefined)   u.email         = email?.toLowerCase().trim();
    if (department !== undefined)   u.department    = department;
    if (role       !== undefined)   u.role          = role;
    if (phone      !== undefined)   u.phone         = phone;
    if (job_title  !== undefined)   u.job_title     = job_title;
    if (date_of_birth !== undefined) u.date_of_birth = date_of_birth || null;
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

module.exports = router;
