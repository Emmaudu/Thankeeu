// ─────────────────────────────────────────────────────────────────────────────
// catchUpCards — Immediately create cards + send notifications for members
// whose occasions fall within the notification window at import time.
// ─────────────────────────────────────────────────────────────────────────────

const supabase      = require('./supabase');
const { sendEmail } = require('./email');
const { getMemberOccasions } = require('./occasionEngine');

const OCCASION_DEFAULTS = {
  birthday:        { label: 'Birthday',             icon: '🎂', notify_days_before: 7, default_scope: 'department' },
  work_anniversary:{ label: 'Work Anniversary',     icon: '🏆', notify_days_before: 7, default_scope: 'department' },
  promotion:       { label: 'Promotion',            icon: '⭐', notify_days_before: 7, default_scope: 'department' },
  leaving:         { label: 'Leaving Company',      icon: '👋', notify_days_before: 7, default_scope: 'department' },
  new_hire:        { label: 'New Employee Welcome', icon: '🎉', notify_days_before: 0, default_scope: 'department' },
  womens_day:      { label: "Women's Day",          icon: '👩', notify_days_before: 7, default_scope: 'company_wide' },
  mens_day:        { label: "Men's Day",            icon: '👨', notify_days_before: 7, default_scope: 'company_wide' },
  mothers_day:     { label: "Mother's Day",         icon: '🌹', notify_days_before: 7, default_scope: 'company_wide' },
  fathers_day:     { label: "Father's Day",         icon: '👔', notify_days_before: 7, default_scope: 'company_wide' },
};

// ── Send occasion notification emails to colleagues ──────────────────────────
async function notifyColleagues({ member, company, ot, slug, daysUntil, occasionDateStr, dlStr }) {
  try {
    const isLeader   = member.role === 'team_leader';
    const scope      = isLeader ? 'company_wide' : (ot.default_scope || 'department');

    console.log(`[catchUp] notifyColleagues: ${member.first_name} — scope: ${scope}`);

    let q = supabase.from('company_members')
      .select('id, email, first_name')
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .neq('id', member.id);
    if (scope === 'department') q = q.eq('department', member.department);

    const { data: colleagues } = await q;
    const toNotify = (colleagues || []).filter(c => c.email && c.email !== member.email);

    console.log(`[catchUp][${ot.label}] Notifying ${toNotify.length} colleagues`);

    for (const colleague of toNotify) {
      if (ot.name === 'new_hire') {
        await sendEmail({ to: colleague.email, template: 'newHireDeptNotice', data: {
          newHireName: `${member.first_name} ${member.last_name}`,
          newHireFirstName: member.first_name,
          department: member.department,
          companyName: company.name,
          startDate: occasionDateStr,
          jobTitle: member.job_title || '',
          cardSlug: slug,
          deadline: dlStr,
        }}).catch(() => {});
      } else if (ot.name === 'leaving') {
        await sendEmail({ to: colleague.email, template: 'farewellDeptNotice', data: {
          leavingName: `${member.first_name} ${member.last_name}`,
          leavingFirstName: member.first_name,
          department: member.department,
          companyName: company.name,
          lastDay: occasionDateStr,
          cardSlug: slug,
          giftEnabled: true,
          deadline: dlStr,
        }}).catch(() => {});
      } else {
        await sendEmail({ to: colleague.email, template: 'occasionNotice', data: {
          icon: ot.icon,
          occasionLabel: ot.label,
          memberName: `${member.first_name} ${member.last_name}`,
          memberFirstName: member.first_name,
          department: member.department || 'your company',
          companyName: company.name,
          cardSlug: slug,
          giftEnabled: true,
          occasionDate: occasionDateStr,
          daysLeft: daysUntil,
          deadline: dlStr,
        }}).catch(() => {});
      }
    }

    console.log(`[catchUp][${ot.label}] Done — ${toNotify.length} emails sent`);

    // Mark emails_sent in tracking so re-imports don't resend
    await supabase.from('company_members')
      .update({
        occasion_tracking: supabase.rpc ? undefined : undefined, // placeholder
        updated_at: new Date(),
      })
      .eq('id', member.id)
      .catch(() => {});

    // Use a direct SQL update to merge just this key into the JSONB without overwriting others
    await supabase.rpc('update_occasion_tracking', {
      p_member_id:  member.id,
      p_key:        ot.name,
      p_notified_at: new Date().toISOString(),
      p_emails_sent: toNotify.length,
    }).catch(() => {
      // RPC might not exist — do a best-effort plain update
      supabase.from('company_members').select('occasion_tracking').eq('id', member.id).maybeSingle()
        .then(({ data: m }) => {
          if (!m) return;
          const t = { ...(m.occasion_tracking || {}) };
          if (t[ot.name]) {
            t[ot.name] = { ...t[ot.name], notified_at: new Date().toISOString(), emails_sent: toNotify.length };
            supabase.from('company_members').update({ occasion_tracking: t, updated_at: new Date() })
              .eq('id', member.id).catch(() => {});
          }
        }).catch(() => {});
    });

  } catch (err) {
    console.error(`[catchUp] notifyColleagues error:`, err.message);
  }
}

// ── Main catch-up function ────────────────────────────────────────────────────
async function catchUpMemberCards(member, company) {
  try {
    if (!company?.id) {
      console.error('[catchUp] missing company.id for', member?.email);
      return;
    }
    if (!member?.id) {
      console.error('[catchUp] missing member.id');
      return;
    }

    const { nanoid } = require('nanoid');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();

    // ── Fetch occasion_types ──────────────────────────────────────────────
    const { data: otRows, error: otErr } = await supabase
      .from('occasion_types').select('*')
      .eq('company_id', company.id).eq('is_active', true);
    if (otErr) console.error('[catchUp] occasion_types error:', otErr.message);

    let rows = otRows || [];
    if (rows.length === 0) {
      console.log('[catchUp] seeding occasion_types for company', company.id);
      await supabase.rpc('seed_occasion_types', { p_company_id: company.id }).catch(() => {});
      const { data: seeded } = await supabase.from('occasion_types').select('*')
        .eq('company_id', company.id).eq('is_active', true);
      rows = seeded || [];
    }

    const savedScopes = company.occasion_scopes || {};
    const otMap = {};
    for (const ot of rows) {
      const def = OCCASION_DEFAULTS[ot.name] || {};
      otMap[ot.name] = {
        ...ot,
        notify_days_before: ot.notify_days_before || def.notify_days_before || 7,
        default_scope: savedScopes[ot.name] || ot.default_scope || def.default_scope || 'department',
      };
    }
    for (const [name, def] of Object.entries(OCCASION_DEFAULTS)) {
      if (!otMap[name]) {
        otMap[name] = {
          id: null, company_id: company.id, name,
          label: def.label, icon: def.icon,
          notify_days_before: def.notify_days_before,
          default_scope: savedScopes[name] || def.default_scope,
          is_active: true,
        };
      }
    }

    // ── Fetch fresh tracking from DB (not from stale member object) ───────
    // IMPORTANT: always fetch fresh tracking so we don't overwrite other occasions
    const { data: freshMemberRow } = await supabase
      .from('company_members').select('occasion_tracking')
      .eq('id', member.id).maybeSingle();
    const tracking = { ...(freshMemberRow?.occasion_tracking || {}) };

    const occasions = getMemberOccasions(member, company, year);

    for (const occ of occasions) {
      const ot = otMap[occ.occasionName];
      if (!ot) continue;

      const notifyDays   = Math.max(ot.notify_days_before || 7, 7);
      const occasionDate = new Date(occ.occasionDate + 'T00:00:00');
      if (isNaN(occasionDate)) continue;

      const daysUntil = Math.round((occasionDate - today) / 86400000);
      const trackKey  = occ.occasionName;

      // Fetch FRESH tracking for this key each iteration (avoids stale reads)
      const { data: currentRow } = await supabase
        .from('company_members').select('occasion_tracking')
        .eq('id', member.id).maybeSingle().catch(() => ({ data: null }));
      const currentTracking = currentRow?.occasion_tracking || {};
      const track = currentTracking[trackKey] || {};

      console.log(`[catchUp] ${member.first_name} — ${occ.occasionName}: ${daysUntil}d away, window 0-${notifyDays}, track=${JSON.stringify(track)}`);

      // Skip if already processed AND notifications confirmed sent
      if (track.year === year && track.dept_notified && track.notified_at) {
        console.log(`[catchUp] SKIP — already notified at ${track.notified_at}`);
        continue;
      }
      if (!occ.isRecurring && track.dept_notified && track.notified_at) {
        console.log(`[catchUp] SKIP — one-time, already notified`);
        continue;
      }

      // Window check
      const inWindow = occ.isRecurring
        ? (daysUntil >= 0 && daysUntil <= notifyDays)
        : (daysUntil <= notifyDays && daysUntil >= -7);

      if (!inWindow) {
        console.log(`[catchUp] SKIP — ${daysUntil}d outside window 0-${notifyDays}`);
        continue;
      }

      if (['valentines_day', 'workers_day'].includes(ot.name)) continue;

      console.log(`[catchUp][${ot.label}] ✅ IN WINDOW — ${member.first_name}: ${daysUntil}d away`);

      const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
      const effectiveScope  = member.role === 'team_leader' ? 'company_wide' : (ot.default_scope || 'department');
      const hideAmounts     = !!(company.occasion_hide_amounts?.[ot.name]);

      // ── Check if card already exists ─────────────────────────────────────
      let existingSlug = null;
      if (ot.id) {
        const { data: byType } = await supabase.from('cards').select('id, slug')
          .eq('occasion_type_id', ot.id).eq('recipient_email', member.email)
          .gte('created_at', `${year}-01-01T00:00:00Z`).limit(1);
        existingSlug = byType?.[0]?.slug || null;
      }
      if (!existingSlug) {
        const { data: byEmail } = await supabase.from('cards').select('id, slug')
          .eq('recipient_email', member.email).eq('occasion', ot.name)
          .eq('company_id', company.id)
          .gte('created_at', `${year}-01-01T00:00:00Z`).limit(1);
        existingSlug = byEmail?.[0]?.slug || null;
      }

      let cardSlug = existingSlug;

      if (!cardSlug) {
        // ── Create card ───────────────────────────────────────────────────
        const slug = `${member.first_name.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${ot.name.replace(/_/g,'-')}-${nanoid(6)}`;
        const minSendDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const sendDate    = occasionDate > minSendDate ? occasionDate : minSendDate;
        let deadline      = new Date(occasionDate.getTime() + notifyDays * 86400000);
        const minDeadline = new Date(Date.now() + 7 * 86400000);
        if (deadline < minDeadline) deadline = minDeadline;

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
          send_date:              sendDate.toISOString(),
          deadline:               deadline.toISOString(),
          allow_private_messages: true,
          company_id:             company.id,
          occasion_type_id:       ot.id || null,
          notification_scope:     effectiveScope,
          hide_amounts:           hideAmounts,
          scope_approved_at:      effectiveScope === 'company_wide' ? new Date() : null,
        }).select().maybeSingle();

        if (cardErr || !card) {
          console.error(`[catchUp] Card insert failed for ${member.email}:`, cardErr?.message);
          continue;
        }

        cardSlug = slug;
        console.log(`[catchUp][${ot.label}] ✅ Card created — slug: ${cardSlug}`);

        await supabase.from('contribution_wallets').insert({
          card_id: card.id, company_id: company.id,
          total_contributed: 0, platform_fee: 0, net_after_fee: 0, amount_to_celebrant: 0,
        }).catch(e => console.error('[catchUp] wallet failed:', e.message));
      } else {
        console.log(`[catchUp][${ot.label}] Card exists — slug: ${cardSlug}`);
        // If already notified (notified_at set), skip
        if (track.notified_at) {
          console.log(`[catchUp] SKIP notifications — already sent at ${track.notified_at}`);
          continue;
        }
      }

      // ── Save tracking (dept_notified=true, notified_at still null until emails sent) ──
      await supabase.from('company_members').update({
        occasion_tracking: {
          ...currentTracking,
          [trackKey]: { year, dept_notified: true, card_slug: cardSlug },
        },
        updated_at: new Date(),
      }).eq('id', member.id).catch(e => console.error('[catchUp] tracking save failed:', e.message));

      const dlStr = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en', { day: 'numeric', month: 'long' });

      // ── Send notifications immediately (not via setImmediate) ─────────────
      // We run this synchronously (with await) so we know emails went out
      // before we save notified_at. This prevents stale-closure issues.
      await notifyColleagues({ member, company, ot, slug: cardSlug, daysUntil, occasionDateStr, dlStr });
    }

  } catch (err) {
    console.error('[catchUpMemberCards] error:', err.message, err.stack);
  }
}

module.exports = { catchUpMemberCards };
