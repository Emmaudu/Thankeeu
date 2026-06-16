// ─────────────────────────────────────────────────────────────────────────────
// catchUpCards — Immediately create cards for members whose occasions fall
// within the notification window AT IMPORT TIME.
//
// The daily cron fires Step 1 only when daysUntil === notifyDays (exact match).
// If a member is imported when their birthday is already 2–6 days away, the
// cron will never trigger for them this year. This module catches that gap:
// call catchUpMemberCards() right after a member is upserted into company_members.
// ─────────────────────────────────────────────────────────────────────────────

const supabase      = require('./supabase');
const { sendEmail } = require('./email');
const { getMemberOccasions } = require('./occasionEngine');

// Default occasion config used when occasion_types rows are missing
const OCCASION_DEFAULTS = {
  birthday:        { label: 'Birthday',            icon: '🎂', notify_days_before: 7, default_scope: 'department' },
  work_anniversary:{ label: 'Work Anniversary',    icon: '🏆', notify_days_before: 7, default_scope: 'department' },
  promotion:       { label: 'Promotion',           icon: '⭐', notify_days_before: 7, default_scope: 'department' },
  leaving:         { label: 'Leaving Company',     icon: '👋', notify_days_before: 7, default_scope: 'department' },
  new_hire:        { label: 'New Employee Welcome',icon: '🎉', notify_days_before: 0, default_scope: 'department' },
  womens_day:      { label: "Women's Day",         icon: '👩', notify_days_before: 7, default_scope: 'company_wide' },
  mens_day:        { label: "Men's Day",           icon: '👨', notify_days_before: 7, default_scope: 'company_wide' },
  mothers_day:     { label: "Mother's Day",        icon: '🌹', notify_days_before: 7, default_scope: 'company_wide' },
  fathers_day:     { label: "Father's Day",        icon: '👔', notify_days_before: 7, default_scope: 'company_wide' },
};

/**
 * For a freshly imported member, check all their occasions and immediately
 * create a card + notify colleagues for any occasion already within the
 * notification window that hasn't been processed yet this year.
 *
 * @param {object} member   - Full company_members row
 * @param {object} company  - companies row — MUST include id, name, country, email, occasion_scopes
 */
async function catchUpMemberCards(member, company) {
  try {
    // Guard: company.id is required for all queries
    if (!company?.id) {
      console.error('[catchUp] called without company.id — skipping for', member?.email);
      return;
    }
    if (!member?.id) {
      console.error('[catchUp] called without member.id — skipping');
      return;
    }

    const { nanoid } = require('nanoid');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();

    // ── Load this company's active occasion types ─────────────────────────
    const { data: occasionTypeRows, error: otErr } = await supabase
      .from('occasion_types')
      .select('*')
      .eq('company_id', company.id)
      .eq('is_active', true);

    if (otErr) console.error('[catchUp] occasion_types query error:', otErr.message);

    // If no rows exist, seed them now then re-fetch
    let otRows = occasionTypeRows || [];
    if (otRows.length === 0) {
      console.log('[catchUp] No occasion_types for company', company.id, '— seeding now');
      try {
        await supabase.rpc('seed_occasion_types', { p_company_id: company.id });
        const { data: reseeded } = await supabase
          .from('occasion_types').select('*')
          .eq('company_id', company.id).eq('is_active', true);
        otRows = reseeded || [];
      } catch (seedErr) {
        console.error('[catchUp] seed_occasion_types failed:', seedErr.message);
        // Fall through — we'll use OCCASION_DEFAULTS below
      }
    }

    // Build map: name → occasion_type row (merged with defaults for missing fields)
    // Also apply saved scope overrides from companies.occasion_scopes (the reliable store)
    const savedScopes = company.occasion_scopes || {};
    const otMap = {};
    for (const ot of otRows) {
      const def = OCCASION_DEFAULTS[ot.name] || {};
      otMap[ot.name] = {
        ...ot,
        notify_days_before: ot.notify_days_before || def.notify_days_before || 7,
        // Scope: saved override wins over occasion_types row value wins over default
        default_scope: savedScopes[ot.name] || ot.default_scope || def.default_scope || 'department',
      };
    }
    // For any occasion the cron engine supports but has no DB row, use defaults
    for (const [name, def] of Object.entries(OCCASION_DEFAULTS)) {
      if (!otMap[name]) {
        otMap[name] = {
          id: null, // no DB row — card insert will have occasion_type_id: null
          company_id: company.id,
          name,
          label:              def.label,
          icon:               def.icon,
          notify_days_before: def.notify_days_before,
          default_scope:      savedScopes[name] || def.default_scope,
          is_active:          true,
        };
      }
    }

    // ── Get this member's occasions for the current year ─────────────────
    const occasions = getMemberOccasions(member, company, year);
    const tracking  = { ...(member.occasion_tracking || {}) };
    let   trackingChanged = false;

    for (const occ of occasions) {
      const ot = otMap[occ.occasionName];
      if (!ot) continue;

      // Always use at least 7 days as the catch-up window for recurring occasions
      // regardless of what notify_days_before is in the DB. This handles the case
      // where the migration hasn't run yet (DB still has 2) and ensures a birthday
      // in 6 days is always caught when HR imports.
      const dbNotifyDays = ot.notify_days_before || 7;
      const notifyDays   = Math.max(dbNotifyDays, 7);

      const occasionDate = new Date(occ.occasionDate + 'T00:00:00');
      if (isNaN(occasionDate)) continue;

      const daysUntil = Math.round((occasionDate - today) / 86400000);
      const trackKey  = occ.occasionName;
      const track     = tracking[trackKey] || {};

      console.log(`[catchUp] ${member.first_name} ${member.last_name} — ${occ.occasionName}: ${daysUntil} days away (window 0-${notifyDays}), tracked=${JSON.stringify(track)}`);

      // Already processed this year → skip
      if (track.year === year && track.dept_notified) {
        console.log(`[catchUp] SKIP — already notified this year`);
        continue;
      }
      if (!occ.isRecurring && track.dept_notified) {
        console.log(`[catchUp] SKIP — one-time occasion already processed`);
        continue;
      }

      // Only act if the occasion is within the notification window (0 … notifyDays days away).
      // For one-time occasions, allow up to 7 days late (matching cron catch-up logic).
      const inWindow = occ.isRecurring
        ? (daysUntil >= 0 && daysUntil <= notifyDays)
        : (daysUntil <= notifyDays && daysUntil >= -7);

      if (!inWindow) {
        console.log(`[catchUp] SKIP — outside window (${daysUntil} days, window 0-${notifyDays})`);
        continue;
      }

      // Skip company-wide shared occasions (valentine, workers_day) —
      // one card per company, the cron handles those.
      if (['valentines_day', 'workers_day'].includes(ot.name)) continue;

      console.log(`[catchUp][${ot.label}] ✅ IN WINDOW — ${member.first_name} ${member.last_name}: ${daysUntil} days away — checking for existing card`);

      // ── Check if card already exists this year ───────────────────────────
      let existingCard = null;
      if (ot.id) {
        const { data: byType } = await supabase.from('cards')
          .select('id, slug')
          .eq('occasion_type_id', ot.id)
          .eq('recipient_email', member.email)
          .gte('created_at', `${year}-01-01T00:00:00Z`)
          .order('created_at', { ascending: true })
          .limit(1);
        existingCard = byType?.[0] || null;
      }
      if (!existingCard) {
        // Fallback: check by email + occasion name + year (handles rows with no occasion_type_id)
        const { data: byEmail } = await supabase.from('cards')
          .select('id, slug')
          .eq('recipient_email', member.email)
          .eq('occasion', ot.name)
          .eq('company_id', company.id)
          .gte('created_at', `${year}-01-01T00:00:00Z`)
          .order('created_at', { ascending: true })
          .limit(1);
        existingCard = byEmail?.[0] || null;
      }

      if (existingCard) {
        console.log(`[catchUp][${ot.label}] Card already exists for ${member.first_name} — slug: ${existingCard.slug}`);
        tracking[trackKey] = { ...(tracking[trackKey] || {}), year, dept_notified: true, card_slug: existingCard.slug };
        trackingChanged = true;
        continue;
      }

      // ── Create the card ──────────────────────────────────────────────────
      const slug = `${member.first_name.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${ot.name.replace(/_/g, '-')}-${nanoid(6)}`;

      let deadline = new Date(occasionDate.getTime() + notifyDays * 86400000);
      const minDeadline = new Date(Date.now() + 7 * 86400000);
      if (deadline < minDeadline) deadline = minDeadline;

      // send_date = when the card is delivered to the celebrant.
      // IMPORTANT: must be at least 24 hours from now so the 8AM auto-delivery
      // cron doesn't immediately flip the card to 'sent' before anyone can sign.
      // If birthday is today (daysUntil=0) or tomorrow (daysUntil=1),
      // give colleagues at least 24 hours to sign before delivery.
      const minSendDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // at least tomorrow
      const sendDate = occasionDate > minSendDate ? occasionDate : minSendDate;

      const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
      const dlStr           = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });

      // Effective scope: team_leader → always company_wide; team_member → HR toggle
      const effectiveScope = (member.role === 'team_leader')
        ? 'company_wide'
        : (ot.default_scope || 'department');

      // hide_amounts: read from companies.occasion_hide_amounts per occasion type
      const hideAmounts = !!(company.occasion_hide_amounts?.[ot.name]);

      const { data: card, error: cardErr } = await supabase.from('cards').insert({
        slug,
        recipient_name:         `${member.first_name} ${member.last_name}`,
        recipient_email:        member.email,
        occasion:               ot.name,
        title:                  `Happy ${ot.label}, ${member.first_name}! ${ot.icon}`,
        design_theme:           'rose_love',
        background_color:       '#FBEAF0',
        status:                 'active',
        is_gift_enabled:        true,
        gift_type:              'pot',
        suggested_amount:       2500,
        send_date:              sendDate.toISOString(), // at least 24h from now so auto-delivery cron doesn't fire immediately
        deadline:               deadline.toISOString(),
        allow_private_messages: true,
        company_id:             company.id,
        occasion_type_id:       ot.id || null,
        notification_scope:     effectiveScope,
        hide_amounts:           hideAmounts,
        // Auto-created cards bypass HR approval — mark as approved immediately
        scope_approved_at:      effectiveScope === 'company_wide' ? new Date() : null,
      }).select().maybeSingle();

      if (cardErr || !card) {
        console.error(`[catchUp][${ot.label}] Card insert failed for ${member.email}:`, cardErr?.message);
        continue;
      }

      console.log(`[catchUp][${ot.label}] ✅ Card created — slug: ${slug} (${daysUntil} days to ${ot.label}, scope: ${ot.default_scope})`);

      // ── Create contribution wallet ───────────────────────────────────────
      await supabase.from('contribution_wallets').insert({
        card_id:           card.id,
        company_id:        company.id,
        total_contributed: 0,
        platform_fee:      0,
        net_after_fee:     0,
        amount_to_celebrant: 0,
      }).catch(e => console.error('[catchUp] wallet creation failed:', e.message));

      // ── Update tracking immediately (before async notifications) ─────────
      tracking[trackKey] = { year, dept_notified: true, card_slug: slug };
      trackingChanged = true;

      // Persist tracking right now so the cron doesn't double-fire tonight
      await supabase.from('company_members')
        .update({ occasion_tracking: tracking, updated_at: new Date() })
        .eq('id', member.id)
        .catch(e => console.error('[catchUp] tracking update failed:', e.message));
      trackingChanged = false; // already persisted

      // ── Notify colleagues (async, non-blocking) ──────────────────────────
      setImmediate(async () => {
        try {
          // Team leaders always notify the entire company (company_wide),
          // regardless of what the HR scope toggle is set to.
          // Team members follow the HR scope toggle (department or company_wide).
          const isLeader = member.role === 'team_leader';
          const scope = isLeader
            ? 'company_wide'
            : (ot.default_scope || 'department');

          console.log(`[catchUp] Scope for ${member.first_name} (${member.role || 'team_member'}): ${scope}`);

          let colleagueQuery = supabase
            .from('company_members')
            .select('id, email, first_name')
            .eq('company_id', company.id)
            .eq('status', 'approved')
            .neq('id', member.id);

          if (scope === 'department') {
            colleagueQuery = colleagueQuery.eq('department', member.department);
          }
          // scope === 'company_wide' → no department filter → entire company

          const { data: colleagues } = await colleagueQuery;
          const toNotify = (colleagues || []).filter(c => c.email && c.email !== member.email);

          console.log(`[catchUp][${ot.label}] Notifying ${toNotify.length} colleagues (scope: ${scope})`);

          for (const colleague of toNotify) {
            if (ot.name === 'new_hire') {
              await sendEmail({ to: colleague.email, template: 'newHireDeptNotice', data: {
                newHireName:      `${member.first_name} ${member.last_name}`,
                newHireFirstName: member.first_name,
                department:       member.department,
                companyName:      company.name,
                startDate:        occasionDateStr,
                jobTitle:         member.job_title || '',
                cardSlug:         slug,
                deadline:         dlStr,
              }}).catch(() => {});
            } else if (ot.name === 'leaving') {
              await sendEmail({ to: colleague.email, template: 'farewellDeptNotice', data: {
                leavingName:      `${member.first_name} ${member.last_name}`,
                leavingFirstName: member.first_name,
                department:       member.department,
                companyName:      company.name,
                lastDay:          occasionDateStr,
                cardSlug:         slug,
                giftEnabled:      true,
                deadline:         dlStr,
              }}).catch(() => {});
            } else {
              await sendEmail({ to: colleague.email, template: 'occasionNotice', data: {
                icon:            ot.icon,
                occasionLabel:   ot.label,
                memberName:      `${member.first_name} ${member.last_name}`,
                memberFirstName: member.first_name,
                department:      member.department || 'your company',
                companyName:     company.name,
                cardSlug:        slug,
                giftEnabled:     true,
                occasionDate:    occasionDateStr,
                daysLeft:        daysUntil,
                deadline:        dlStr,
              }}).catch(() => {});
            }
          }
          console.log(`[catchUp][${ot.label}] Done — ${toNotify.length} notification emails sent`);
        } catch (notifyErr) {
          console.error(`[catchUp][${ot.label}] Colleague notification error:`, notifyErr.message);
        }
      });
    }

    // Persist any remaining tracking changes
    if (trackingChanged) {
      await supabase.from('company_members')
        .update({ occasion_tracking: tracking, updated_at: new Date() })
        .eq('id', member.id)
        .catch(e => console.error('[catchUp] tracking update failed:', e.message));
    }
  } catch (err) {
    console.error('[catchUpMemberCards] unexpected error:', err.message, err.stack);
  }
}

module.exports = { catchUpMemberCards };
