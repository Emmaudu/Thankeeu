const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { companyAuth }   = require('../middleware/companyAuth');
const { hrOrMemberAuth } = require('../middleware/memberAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Main occasion controller ─────────────────────────────────────────────────
const {
  getOccasionTypes, createOccasionType,
  downloadOccasionTemplate,
  importOccasionMembers, importByOccasionName,
  getOccasionMembers, deleteOccasionMember,
  downloadGeneralTemplate, importGeneralTemplate,
  updateOccasionTypeScope, updateOccasionMember, triggerOccasionNow,
} = require('../controllers/occasionController');

// ── Bulk controller (bulk Excel sync, /tables endpoint) ─────────────────────
const {
  downloadBulkTemplate, bulkSyncEmployees, getOccasionTables,
  updateOccasionMember: bulkUpdateMember,
  deleteOccasionMember: bulkDeleteMember,
} = require('../controllers/occasionBulkController');

// ─────────────────────────────────────────────────────────────────────────────

// Occasion types
router.get('/types',              companyAuth, getOccasionTypes);
router.post('/types',             companyAuth, createOccasionType);

// Per-type template download and import
router.get('/template/:occasionName',              companyAuth, downloadOccasionTemplate);
router.post('/:occasionTypeId/import',             companyAuth, upload.single('file'), importOccasionMembers);
// New: import directly by occasion name (no UUID needed — used by per-tab upload buttons)
router.post('/import-by-name/:occasionName',       companyAuth, upload.single('file'), importByOccasionName);
router.delete('/:occasionTypeId/members/:memberId', companyAuth, deleteOccasionMember);

// View members (HR or approved member)
router.get('/:occasionTypeId/members',        hrOrMemberAuth, getOccasionMembers);

// ── /tables — main dashboard data endpoint (used by OccasionsPage) ───────────
router.get('/tables',                         companyAuth, getOccasionTables);

// ── General master template (one file → all tables) ──────────────────────────
router.get('/general-template',               companyAuth, downloadGeneralTemplate);
router.post('/import-general', upload.single('file'), companyAuth, importGeneralTemplate);

// ── Bulk CSV sync (legacy / alternative path) ─────────────────────────────────
router.get('/bulk-template',                  companyAuth, downloadBulkTemplate);
router.post('/bulk-sync',                     companyAuth, bulkSyncEmployees);

// ── Per-type notification scope ───────────────────────────────────────────────
router.put('/types/:occasionTypeId/scope',   companyAuth, updateOccasionTypeScope);

// ── Company-level occasion scopes (stored by name string, not UUID) ───────────
// GET  /api/occasions/scopes    → { birthday: 'department', fathers_day: 'company', ... }
// PUT  /api/occasions/scopes    → body: { birthday: 'company_wide' }
router.get('/scopes', companyAuth, async (req, res) => {
  try {
    const supabase = require('../utils/supabase');
    // Read directly from occasion_types so the UI always reflects what the cron sees
    const { data: ots } = await supabase
      .from('occasion_types')
      .select('name, default_scope')
      .eq('company_id', req.company.id);
    const scopes = {};
    for (const ot of (ots || [])) scopes[ot.name] = ot.default_scope || 'department';
    res.json(scopes);
  } catch { res.json({}); }
});

router.put('/scopes', companyAuth, async (req, res) => {
  try {
    const supabase = require('../utils/supabase');
    // req.body = { birthday: 'company_wide', work_anniversary: 'department', ... }
    // Update BOTH occasion_types.default_scope (used by cron) AND
    // companies.occasion_scopes (legacy JSON cache — kept for backward compat)
    const updates = req.body;
    const names   = Object.keys(updates);

    if (names.length === 0) return res.json({ ok: true });

    // Update each occasion_type row that belongs to this company
    await Promise.all(names.map(name =>
      supabase.from('occasion_types')
        .update({ default_scope: updates[name], updated_at: new Date() })
        .eq('company_id', req.company.id)
        .eq('name', name)
    ));

    // Also keep companies.occasion_scopes in sync for any code still reading it
    const { data: existing } = await supabase
      .from('companies').select('occasion_scopes').eq('id', req.company.id).single();
    const merged = { ...(existing?.occasion_scopes || {}), ...updates };
    await supabase.from('companies').update({ occasion_scopes: merged }).eq('id', req.company.id);

    res.json({ ok: true, scopes: merged });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Edit / patch occasion member rows ────────────────────────────────────────
router.post('/members/:memberId/trigger', companyAuth, triggerOccasionNow);
router.put('/members/:memberId',             companyAuth, updateOccasionMember);
router.patch('/members/:id',                 companyAuth, bulkUpdateMember);
router.delete('/members/:id/bulk',           companyAuth, bulkDeleteMember);

module.exports = router;
