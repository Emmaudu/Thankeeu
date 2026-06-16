// ─────────────────────────────────────────────────────────────────────────────
// catchUpCards — Immediately create cards for members whose occasions fall
// within the notification window AT IMPORT TIME.
//
// The daily cron only fires Step 1 when daysUntil === notifyDays (exact match).
// If a member is imported when their birthday is already 2–6 days away, the
// cron will never trigger for them this year. This module catches that gap:
// call catchUpMemberCards() right after a member is upserted into company_members.
// ─────────────────────────────────────────────────────────────────────────────

const supabase     = require('./supabase');
const { sendEmail } = require('./email');
const { getMemberOccasions } = require('./occasionEngine');

/**
 * For a freshly imported member, check all their occasions and immediately
 * create a card + notify colleagues for any occasion already within the
 * notification window that hasn't been processed yet this year.
 *
 * @param {object} member   - Full company_members row (must include id, email,
 *                            first_name, last_name, department, date_of_birth,
 *                            resumption_date, gender, promotion_date,
 *                            leaving_date, occasion_tracking, company_id)
 * @param {object} company  - Full companies row (id, name, email, country, ...)
 */
async function catchUpMemberCards(member, company) {
  try {
    const { nanoid } = require('nanoid');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();

    // Load this company's active occasion types
    const { data: occasionTypes } = await supabase
      .from('occasion_types')
      .select('*')
      .eq('company_id', company.id)
      .eq('is_active', true);

    if (!occasionTypes || occasionTypes.length === 0) return;

    const otMap = {};
    for (const ot of occasionTypes) otMap[ot.name] = ot;

    // Get occasions for this member
    const occasions = getMemberOccasions(member, company, year);
    const tracking  = { ...(member.occasion_tracking || {}) };
    let   trackingChanged = false;

    for (const occ of occasions) {
      const ot = otMap[occ.occasionName];
      if (!ot) continue;

      const notifyDays  = ot.notify_days_before || 7;
      const occasionDate = new Date(occ.occasionDate + 'T00:00:00');
      if (isNaN(occasionDate)) continue;

      const daysUntil = Math.round((occasionDate - today) / 86400000);
      const trackKey  = occ.occasionName;
      const track     = tracking[trackKey] || {};

      // Already processed this year → skip
      if (track.year === year && track.dept_notified) continue;
      if (!occ.isRecurring && track.dept_notified) continue;

      // Only act if the occasion is within the notification window (0 … notifyDays days away).
      // daysUntil < 0 means the occasion already passed this year — don't create a late card
      // for recurring occasions (birthday, work anniversary). For one-time occasions
      // (promotion, leaving) we allow up to 7 days late, matching the cron catch-up logic.
      const inWindow = occ.isRecurring
        ? (daysUntil >= 0 && daysUntil <= notifyDays)
        : (daysUntil <= notifyDays && daysUntil >= -7);

      if (!inWindow) continue;

      // Skip company-wide shared occasions (valentine, workers_day) —
      // those only need one card per company, which the cron manages.
      if (['valentines_day', 'workers_day'].includes(ot.name)) continue;

      // Check whether a card already exists for this member + occasion this year
      const { data: existingCards } = await supabase
        .from('cards')
        .select('id, slug')
        .eq('occasion_type_id', ot.id)
        .eq('recipient_email', member.email)
        .gte('created_at', `${year}-01-01T00:00:00Z`)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingCards && existingCards.length > 0) {
        // Card already exists — just sync tracking so cron doesn't re-fire
        tracking[trackKey] = { ...(tracking[trackKey] || {}), year, dept_notified: true, card_slug: existingCards[0].slug };
        trackingChanged = true;
        console.log(`[catchUp][${ot.label}] Card already exists for ${member.first_name} — skipping`);
        continue;
      }

      // ── Create the card ──────────────────────────────────────────────────
      const slug = `${member.first_name.toLowerCase()}-${ot.name.replace(/_/g, '-')}-${nanoid(6)}`;
      let deadline = new Date(occasionDate.getTime() + notifyDays * 86400000);
      const minDeadline = new Date(Date.now() + 7 * 86400000);
      if (deadline < minDeadline) deadline = minDeadline;

      const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
      const dlStr           = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });

      const { data: card, error: cardErr } = await supabase.from('cards').insert({
        slug,
        recipient_name:  `${member.first_name} ${member.last_name}`,
        recipient_email: member.email,
        occasion:        ot.name,
        title:           `Happy ${ot.label}, ${member.first_name}! ${ot.icon}`,
        design_theme:    'rose_love',
        background_color: '#FBEAF0',
        status:           'active',
        is_gift_enabled:  true,
        gift_type:        'pot',
        suggested_amount: 2500,
        send_date:        occasionDate.toISOString(),
        deadline:         deadline.toISOString(),
        allow_private_messages: true,
        company_id:       ot.company_id,
        occasion_type_id: ot.id,
        notification_scope: ot.default_scope || 'department',
      }).select().maybeSingle();

      if (cardErr || !card) {
        console.error(`[catchUp][${ot.label}] Card insert failed for ${member.email}:`, cardErr?.message);
        continue;
      }

      console.log(`[catchUp][${ot.label}] Card created for ${member.first_name} ${member.last_name} (${daysUntil} days away) — slug: ${slug}`);

      // ── Create contribution wallet ───────────────────────────────────────
      await supabase.from('contribution_wallets').insert({
        card_id: card.id, company_id: ot.company_id,
        total_contributed: 0, platform_fee: 0, net_after_fee: 0, amount_to_celebrant: 0,
      }).catch(e => console.error('[catchUp] wallet creation failed:', e.message));

      // ── Update tracking ──────────────────────────────────────────────────
      tracking[trackKey] = { year, dept_notified: true, card_slug: slug };
      trackingChanged = true;

      // ── Notify colleagues (non-blocking) ────────────────────────────────
      setImmediate(async () => {
        try {
          let colleagueQuery = supabase
            .from('company_members')
            .select('email, first_name')
            .eq('company_id', ot.company_id)
            .eq('status', 'approved')
            .neq('id', member.id);

          if (ot.default_scope === 'department' || !ot.default_scope) {
            colleagueQuery = colleagueQuery.eq('department', member.department);
          }
          const { data: colleagues } = await colleagueQuery;
          const toNotify = (colleagues || []).filter(c => c.email !== member.email);

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
                department:      member.department,
                companyName:     company.name,
                cardSlug:        slug,
                giftEnabled:     true,
                occasionDate:    occasionDateStr,
                daysLeft:        daysUntil,
                deadline:        dlStr,
              }}).catch(() => {});
            }
          }
          console.log(`[catchUp][${ot.label}] Notified ${toNotify.length} colleagues for ${member.first_name}`);
        } catch (notifyErr) {
          console.error(`[catchUp][${ot.label}] Colleague notification error:`, notifyErr.message);
        }
      });
    }

    // Persist updated tracking
    if (trackingChanged) {
      await supabase.from('company_members')
        .update({ occasion_tracking: tracking, updated_at: new Date() })
        .eq('id', member.id)
        .catch(e => console.error('[catchUp] tracking update failed:', e.message));
    }
  } catch (err) {
    // Non-fatal — log and move on so the import response still returns
    console.error('[catchUpMemberCards] error:', err.message);
  }
}

module.exports = { catchUpMemberCards };
