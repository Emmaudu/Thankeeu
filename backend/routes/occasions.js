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
    const { data: ots, error: otErr } = await supabase
      .from('occasion_types')
      .select('name, default_scope')
      .eq('company_id', req.company.id);
    if (otErr) console.warn('[get scopes] occasion_types read warning:', otErr.message);
    const scopes = {};
    for (const ot of (ots || [])) scopes[ot.name] = ot.default_scope || 'department';

    // Merge in companies.occasion_scopes (authoritative) + occasion_hide_amounts
    const { data: co, error: coErr } = await supabase
      .from('companies')
      .select('occasion_scopes, occasion_hide_amounts')
      .eq('id', req.company.id).maybeSingle();

    if (coErr) {
      // Most likely cause if this specifically mentions occasion_hide_amounts:
      // database/migration_hide_amounts.sql hasn't been run on this database
      // yet, so the column doesn't exist. Logged clearly instead of silently
      // returning an empty object that looks identical to "nothing saved".
      console.error('[get scopes] companies read error (check migration_hide_amounts.sql has run):', coErr.message);
    }

    const savedScopes      = co?.occasion_scopes      || {};
    const savedHideAmounts = co?.occasion_hide_amounts || {};
    Object.assign(scopes, savedScopes);

    // Return both scopes and hide_amounts so frontend can read both in one call
    res.json({ ...scopes, _hide_amounts: savedHideAmounts });
  } catch (err) {
    console.error('[get scopes] unexpected error:', err.message);
    res.json({});
  }
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
    const { data: existing, error: fetchErr } = await supabase
      .from('companies')
      .select('occasion_scopes, occasion_hide_amounts')
      .eq('id', req.company.id).maybeSingle();
    if (fetchErr) console.warn('[put scopes] existing-row fetch warning:', fetchErr.message);

    const mergedScopes      = { ...(existing?.occasion_scopes      || {}), ...scopeUpdates };
    const mergedHideAmounts = { ...(existing?.occasion_hide_amounts || {}), ...hideAmountUpdates };

    // Split into two independent updates so a problem with one column can't
    // take down the other — these are two unrelated toggles (notification
    // scope vs. hide gift amounts) bundled into one endpoint for convenience.
    let scopesSaved = true, hideAmountsSaved = true;

    if (Object.keys(scopeUpdates).length > 0) {
      const { error: scopeErr } = await supabase.from('companies')
        .update({ occasion_scopes: mergedScopes }).eq('id', req.company.id);
      if (scopeErr) { scopesSaved = false; console.error('[put scopes] occasion_scopes update error:', scopeErr.message); }
    }

    if (Object.keys(hideAmountUpdates).length > 0) {
      const { error: hideErr } = await supabase.from('companies')
        .update({ occasion_hide_amounts: mergedHideAmounts }).eq('id', req.company.id);
      if (hideErr) {
        hideAmountsSaved = false;
        // Most likely cause: database/migration_hide_amounts.sql hasn't been
        // run on this database yet, so occasion_hide_amounts doesn't exist
        // as a column. Previously this threw and aborted the whole request
        // (including any scope update bundled in the same call) — now it's
        // reported back explicitly instead of failing silently or taking
        // the scope update down with it.
        console.error('[put scopes] occasion_hide_amounts update error (check migration_hide_amounts.sql has run):', hideErr.message);
      }
    }

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

    if (!scopesSaved || !hideAmountsSaved) {
      return res.status(500).json({
        error: !hideAmountsSaved
          ? 'Could not save the hide-amounts setting. Please contact support.'
          : 'Could not save the notification scope. Please contact support.',
      });
    }

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
  const companyId = req.company.id;
  try {
    const supabase             = require('../utils/supabase');
    const { catchUpMemberCards } = require('../utils/catchUpCards');

    // Fetch company row (catchUpMemberCards needs id, name, country, occasion_scopes)
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id, name, email, country, occasion_scopes')
      .eq('id', companyId)
      .maybeSingle();

    if (companyErr) {
      console.error('[resync] company fetch error:', companyErr.message);
      return res.status(500).json({ error: 'Could not load company details. Please try again.' });
    }
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Seed occasion_types if missing — best-effort, never fails the request
    try {
      const { data: existingOTs, error: otErr } = await supabase
        .from('occasion_types').select('id').eq('company_id', companyId).limit(1);
      if (otErr) console.warn('[resync] occasion_types check warning:', otErr.message);
      if (!otErr && (!existingOTs || existingOTs.length === 0)) {
        const { error: seedErr } = await supabase.rpc('seed_occasion_types', { p_company_id: companyId });
        if (seedErr) console.warn('[resync] seed_occasion_types warning:', seedErr.message);
      }
    } catch (e) {
      console.warn('[resync] occasion_types seed step failed (non-fatal):', e.message);
    }

    // Ensure company has an active subscription row so the nightly cron
    // will also pick them up going forward. Best-effort — if this fails
    // (e.g. the 'admin' plan value hasn't been added to the sub_plan enum
    // yet via migration_subscription_enum.sql), resync should still run for
    // today; it just means the nightly cron won't pick this company up
    // automatically until the row exists.
    try {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 10);
      const { data: existingSub, error: subFetchErr } = await supabase.from('company_subscriptions')
        .select('id').eq('company_id', companyId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (subFetchErr) {
        console.warn('[resync] subscription fetch warning:', subFetchErr.message);
      } else if (existingSub?.id) {
        const { error: updErr } = await supabase.from('company_subscriptions')
          .update({ status: 'active', expires_at: farFuture }).eq('id', existingSub.id);
        if (updErr) console.warn('[resync] subscription update warning:', updErr.message);
      } else {
        const { error: insErr } = await supabase.from('company_subscriptions').insert({
          company_id: companyId, plan: 'monthly', status: 'active',
          amount: 0, starts_at: new Date(), expires_at: farFuture, auto_renew: false,
        });
        if (insErr) {
          console.warn('[resync] subscription insert warning:', insErr.message);
        }
      }
    } catch (e) {
      console.warn('[resync] subscription step failed (non-fatal):', e.message);
    }

    // Fetch all approved members
    const { data: members, error: mErr } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'approved');

    if (mErr) {
      console.error('[resync] members fetch error:', mErr.message);
      return res.status(500).json({ error: 'Could not load team members. Please try again.' });
    }
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
    console.error('[resync] unexpected error for company', companyId, ':', err.message, err.stack);
    // Only send error if we haven't already responded
    if (!res.headersSent) res.status(500).json({ error: 'Resync failed. Please try again or contact support if this continues.' });
  }
});

module.exports = router;
