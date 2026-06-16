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

const { validateUUIDParam } = require('../utils/paramGuard');

// Occasion types
router.get('/types',              companyAuth, getOccasionTypes);
router.post('/types',             companyAuth, createOccasionType);

// Fixed-segment routes before /:occasionTypeId wildcard
router.get('/tables',                      companyAuth, getOccasionTables);
router.get('/general-template',            companyAuth, downloadGeneralTemplate);
router.post('/import-general',             upload.single('file'), companyAuth, importGeneralTemplate);
router.get('/bulk-template',               companyAuth, downloadBulkTemplate);
router.post('/bulk-sync',                  companyAuth, bulkSyncEmployees);
router.post('/import-by-name/:occasionName', companyAuth, upload.single('file'), importByOccasionName);
router.get('/template/:occasionName',      companyAuth, downloadOccasionTemplate);
router.put('/types/:occasionTypeId/scope', validateUUIDParam('occasionTypeId'), companyAuth, updateOccasionTypeScope);
router.post('/members/:memberId/trigger',  validateUUIDParam('memberId'), companyAuth, triggerOccasionNow);
router.put('/members/:memberId',           validateUUIDParam('memberId'), companyAuth, updateOccasionMember);
router.patch('/members/:id',               validateUUIDParam('id'), companyAuth, bulkUpdateMember);
router.delete('/members/:id/bulk',         validateUUIDParam('id'), companyAuth, bulkDeleteMember);

// Wildcard /:occasionTypeId routes — after all fixed-segment routes
router.post('/:occasionTypeId/import',               validateUUIDParam('occasionTypeId'), companyAuth, upload.single('file'), importOccasionMembers);
router.delete('/:occasionTypeId/members/:memberId',  validateUUIDParam('occasionTypeId'), companyAuth, deleteOccasionMember);
router.get('/:occasionTypeId/members',               validateUUIDParam('occasionTypeId'), hrOrMemberAuth, getOccasionMembers);

// ── General master template (one file → all tables) ──────────────────────────
// ── Company-level occasion scopes ─────────────────────────────────────────────
router.get('/scopes', companyAuth, async (req, res) => {
  try {
    const supabase = require('../utils/supabase');

    // Read from occasion_types rows first
    const { data: ots } = await supabase
      .from('occasion_types')
      .select('name, default_scope')
      .eq('company_id', req.company.id);
    const scopes = {};
    for (const ot of (ots || [])) scopes[ot.name] = ot.default_scope || 'department';

    // Merge in companies.occasion_scopes as the authoritative override
    // (PUT /scopes always saves here, so this is the reliable source of truth)
    const { data: co } = await supabase
      .from('companies').select('occasion_scopes').eq('id', req.company.id).maybeSingle();
    const saved = co?.occasion_scopes || {};
    Object.assign(scopes, saved); // saved values win over occasion_types defaults

    res.json(scopes);
  } catch { res.json({}); }
});

router.put('/scopes', companyAuth, async (req, res) => {
  try {
    const supabase = require('../utils/supabase');
    const raw = req.body;
    const names = Object.keys(raw);
    if (names.length === 0) return res.json({ ok: true });

    // Allowlist valid scope values and occasion names — prevents arbitrary DB writes
    const VALID_SCOPES = new Set(['department', 'company_wide', 'all']);
    const VALID_NAME_RE = /^[a-z_]{1,60}$/;
    const updates = {};
    for (const name of names) {
      if (!VALID_NAME_RE.test(name)) continue;
      if (!VALID_SCOPES.has(raw[name])) continue;
      updates[name] = raw[name];
    }
    if (Object.keys(updates).length === 0) return res.json({ ok: true });

    // 1. Persist to companies.occasion_scopes (always works — this is the reliable store)
    const { data: existing } = await supabase
      .from('companies').select('occasion_scopes').eq('id', req.company.id).maybeSingle();
    const merged = { ...(existing?.occasion_scopes || {}), ...updates };
    const { error: coErr } = await supabase
      .from('companies').update({ occasion_scopes: merged }).eq('id', req.company.id);
    if (coErr) throw coErr;

    // 2. Also try to sync into occasion_types rows if they exist (non-fatal)
    //    Uses upsert so it works whether or not seed_occasion_types() was ever called
    const LABEL_MAP = {
      birthday: 'Birthday', work_anniversary: 'Work Anniversary', valentine: "Valentine's Day",
      womens_day: "Women's Day", mothers_day: "Mother's Day", fathers_day: "Father's Day",
      promotion: 'Promotion', leaving: 'Leaving Company', new_hire: 'New Employee Welcome',
    };
    await Promise.allSettled(Object.keys(updates).map(name =>
      supabase.from('occasion_types')
        .upsert(
          { company_id: req.company.id, name, label: LABEL_MAP[name] || name, default_scope: updates[name] },
          { onConflict: 'company_id,name', ignoreDuplicates: false }
        )
    ));

    res.json({ ok: true, scopes: merged });
  } catch (err) {
    console.error('update scopes error:', err.message);
    res.status(500).json({ error: 'Failed to update scopes' });
  }
});

module.exports = router;
