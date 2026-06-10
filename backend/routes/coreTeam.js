const express = require('express');
const router  = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const {
  inviteCoreMember, bulkInviteCoreTeam,
  getCoreTeam, removeCoreMember,
} = require('../controllers/coreTeamController');

// ── Public-ish routes (authenticate manually, no companyAuth) ─────────────
// POST /api/core-team/get-company-access
// Core team member presents their member token and gets a temporary company token
router.post('/get-company-access', async (req, res) => {
  try {
    const jwt     = require('jsonwebtoken');
    const supabase = require('../utils/supabase');
    const token   = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    // Verify it's a member token
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Invalid token' }); }

    if (decoded.type !== 'company_member')
      return res.status(403).json({ error: 'Member token required' });

    // Verify member exists, is approved, and IS a core team member
    const { data: member } = await supabase.from('company_members')
      .select('id, company_id, first_name, last_name, email, is_core_team, status')
      .eq('id', decoded.memberId).single();

    if (!member || member.status !== 'approved')
      return res.status(401).json({ error: 'Invalid member' });

    if (!member.is_core_team)
      return res.status(403).json({ error: 'Core team access only. You were not invited as a core team member.' });

    // Get company details
    const { data: company } = await supabase.from('companies')
      .select('id, name, email, contact_person').eq('id', member.company_id).single();
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Issue a short-lived company JWT (4 hours — enough for a work session)
    const companyToken = jwt.sign(
      { companyId: company.id, type: 'company', via_core_team: true, member_id: member.id },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      token:   companyToken,
      company: { id: company.id, name: company.name, email: company.email, contact_person: company.contact_person },
      member_name: `${member.first_name} ${member.last_name}`,
    });
  } catch (err) {
    console.error('get-company-access:', err);
    res.status(500).json({ error: 'Failed to generate company access' });
  }
});


// ── HR-only routes (require company token) ────────────────────────────────
router.use(companyAuth);
router.get('/',                getCoreTeam);
router.post('/invite',         inviteCoreMember);
router.post('/invite-bulk',    upload.single('file'), bulkInviteCoreTeam);
router.delete('/:id',          removeCoreMember);


module.exports = router;
