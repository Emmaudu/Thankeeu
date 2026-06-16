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

    // Read from occasion_types rows first (default_scope)
    const { data: ots } = await supabase
      .from('occasion_types')
      .select('name, default_scope')
      .eq('company_id', req.company.id);
    const scopes = {};
    for (const ot of (ots || [])) scopes[ot.name] = ot.default_scope || 'department';

    // Merge in companies.occasion_scopes (authoritative) + occasion_hide_amounts
    const { data: co } = await supabase
      .from('companies')
      .select('occasion_scopes, occasion_hide_amounts')
      .eq('id', req.company.id).maybeSingle();

    const savedScopes      = co?.occasion_scopes      || {};
    const savedHideAmounts = co?.occasion_hide_amounts || {};
    Object.assign(scopes, savedScopes);

    // Return both scopes and hide_amounts so frontend can read both in one call
    res.json({ ...scopes, _hide_amounts: savedHideAmounts });
  } catch { res.json({}); }
});

router.put('/scopes', companyAuth, async (req, res) => {
  try {
    const supabase = require('../utils/supabase');
    const raw = req.body;
    const names = Object.keys(raw);
    if (names.length === 0) return res.json({ ok: true });

    // Allowlist valid scope values and occasion names — prevents arbitrary DB writes.
    // Keys can be: 'birthday', 'work_anniversary', etc. (scope value)
    //         OR: 'birthday_hide_amounts', etc. (boolean hide_amounts per occasion)
    const VALID_SCOPES  = new Set(['department', 'company_wide', 'all']);
    const VALID_NAME_RE = /^[a-z_]{1,60}$/;
    const scopeUpdates       = {}; // name → scope string
    const hideAmountUpdates  = {}; // name → boolean

    for (const key of names) {
      if (!VALID_NAME_RE.test(key)) continue;

      // hide_amounts key format: 'birthday_hide_amounts'
      if (key.endsWith('_hide_amounts')) {
        const occasionName = key.replace(/_hide_amounts$/, '');
        if (VALID_NAME_RE.test(occasionName)) {
          hideAmountUpdates[occasionName] = raw[key] === true || raw[key] === 'true';
        }
        continue;
      }

      // Scope value
      if (!VALID_SCOPES.has(raw[key])) continue;
      scopeUpdates[key] = raw[key];
    }

    // 1. Persist to companies.occasion_scopes (scope strings)
    //    and companies.occasion_hide_amounts (hide_amounts booleans)
    const { data: existing } = await supabase
      .from('companies')
      .select('occasion_scopes, occasion_hide_amounts')
      .eq('id', req.company.id).maybeSingle();

    const mergedScopes      = { ...(existing?.occasion_scopes      || {}), ...scopeUpdates };
    const mergedHideAmounts = { ...(existing?.occasion_hide_amounts || {}), ...hideAmountUpdates };

    const { error: coErr } = await supabase.from('companies').update({
      occasion_scopes:       mergedScopes,
      occasion_hide_amounts: mergedHideAmounts,
    }).eq('id', req.company.id);
    if (coErr) throw coErr;

    // 2. Sync scope into occasion_types rows (non-fatal)
    const LABEL_MAP = {
      birthday: 'Birthday', work_anniversary: 'Work Anniversary', valentine: "Valentine's Day",
      womens_day: "Women's Day", mothers_day: "Mother's Day", fathers_day: "Father's Day",
      promotion: 'Promotion', leaving: 'Leaving Company', new_hire: 'New Employee Welcome',
    };
    await Promise.allSettled(Object.keys(scopeUpdates).map(name =>
      supabase.from('occasion_types')
        .upsert(
          { company_id: req.company.id, name, label: LABEL_MAP[name] || name, default_scope: scopeUpdates[name] },
          { onConflict: 'company_id,name', ignoreDuplicates: false }
        )
    ));

    res.json({ ok: true, scopes: mergedScopes, hide_amounts: mergedHideAmounts });
  } catch (err) {
    console.error('update scopes error:', err.message);
    res.status(500).json({ error: 'Failed to update scopes' });
  }
});

// ── POST /api/occasions/resync ───────────────────────────────────────────────
// HR calls this to immediately re-check ALL approved company members for
// upcoming occasions within the notification window, creating cards + sending
// notifications without waiting for the nightly cron.
// Useful after: HR imports members, admin sets multiplier, toggle scope change.
router.post('/resync', companyAuth, async (req, res) => {
  try {
    const supabase             = require('../utils/supabase');
    const { getMemberOccasions } = require('../utils/occasionEngine');
    const { catchUpMemberCards } = require('../utils/catchUpCards');

    const companyId = req.company.id;

    // Fetch company row (catchUpMemberCards needs id, name, country, occasion_scopes)
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, email, country, occasion_scopes')
      .eq('id', companyId)
      .maybeSingle();

    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Seed occasion_types if missing
    const { data: existingOTs } = await supabase
      .from('occasion_types').select('id').eq('company_id', companyId).limit(1);
    if (!existingOTs || existingOTs.length === 0) {
      await supabase.rpc('seed_occasion_types', { p_company_id: companyId }).catch(() => {});
    }

    // Ensure company has an active subscription row so the nightly cron
    // will also pick them up going forward. Use UPDATE-then-INSERT to avoid
    // needing a unique constraint on company_id.
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    const { data: existingSub } = await supabase.from('company_subscriptions')
      .select('id').eq('company_id', companyId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .catch(() => ({ data: null }));
    if (existingSub?.id) {
      await supabase.from('company_subscriptions')
        .update({ status: 'active', expires_at: farFuture }).eq('id', existingSub.id)
        .catch(() => {});
    } else {
      await supabase.from('company_subscriptions').insert({
        company_id: companyId, plan: 'admin', status: 'active',
        amount: 0, starts_at: new Date(), expires_at: farFuture, auto_renew: false,
      }).catch(() => {});
    }

    // Fetch all approved members
    const { data: members, error: mErr } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'approved');

    if (mErr) throw mErr;
    if (!members || members.length === 0)
      return res.json({ ok: true, checked: 0, message: 'No approved members found' });

    // Respond immediately — process in background so HR isn't left waiting
    res.json({
      ok:      true,
      checked: members.length,
      message: `Checking ${members.length} member${members.length !== 1 ? 's' : ''} for upcoming occasions. Cards and notifications will appear shortly.`,
    });

    // Run catch-up for every member asynchronously
    setImmediate(async () => {
      let created = 0;
      for (const member of members) {
        try {
          await catchUpMemberCards(member, company);
          created++;
        } catch (e) {
          console.error(`[resync] error for ${member.email}:`, e.message);
        }
      }
      console.log(`[resync] company ${companyId}: processed ${created}/${members.length} members`);
    });

  } catch (err) {
    console.error('[resync] error:', err.message);
    // Only send error if we haven't already responded
    if (!res.headersSent) res.status(500).json({ error: 'Resync failed' });
  }
});

module.exports = router;
