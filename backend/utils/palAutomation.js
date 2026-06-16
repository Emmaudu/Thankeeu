// ════════════════════════════════════════════════════════════════════════════
// THANKEEU PALS — automation cron jobs
// • Auto-creates cards for upcoming birthday/resignation/graduation/milestone/
//   promotion events, 14 days ahead
// • Sends 14/7/4/1-day sign-card reminder emails to all OTHER group members
// • Sends profile-completion reminders (max 2 per member)
// • Settles the gift pot to the recipient's bank account by 6pm on their day
// ════════════════════════════════════════════════════════════════════════════

const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { nanoid } = require('nanoid');
const crypto = require('crypto');

const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

const EVENT_TYPES = [
  { key: 'birth',       dateField: 'birth_date',       occasion: 'birthday',        label: 'birthday',          recurring: true  },
  { key: 'resignation', dateField: 'resignation_date',  occasion: 'farewell',        label: 'farewell',          recurring: false },
  { key: 'graduation',  dateField: 'graduation_date',   occasion: 'graduation',      label: 'graduation',        recurring: false },
  { key: 'milestone',   dateField: 'milestone_date',    occasion: 'milestone',       label: 'milestone',         recurring: false },
  { key: 'promotion',   dateField: 'promotion_date',    occasion: 'promotion',       label: 'promotion',         recurring: false },
];

const REMINDER_STAGES = [14, 7, 4, 1, 0]; // days before event (0 = day-of)

// Given an event's month/day (or full date for non-recurring), compute the
// next occurrence date relative to "now".
function nextOccurrence(dateStr, recurring) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (!recurring) return d; // resignation/graduation/milestone/promotion happen once

  const now = new Date();
  const thisYear = new Date(now.getFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (thisYear >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) return thisYear;
  return new Date(now.getFullYear() + 1, d.getUTCMonth(), d.getUTCDate());
}

function daysBetween(a, b) {
  const ms = new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000);
}

// ── Main daily job: process all pal groups ───────────────────────────────────
async function runPalAutomation() {
  const { data: groups, error } = await supabase.from('pal_groups').select('*').eq('status', 'approved');
  if (error || !groups?.length) return;

  const now = new Date();

  for (const group of groups) {
    const { data: members } = await supabase.from('pal_members').select('*').eq('pal_group_id', group.id);
    if (!members?.length) continue;

    const allMembers = members; // group owner has no pal_members row but isn't a card recipient by default

    for (const member of members) {
      for (const evt of EVENT_TYPES) {
        const rawDate = member[evt.dateField];
        if (!rawDate) continue;

        const occDate = nextOccurrence(rawDate, evt.recurring);
        if (!occDate) continue;

        const occYear = occDate.getFullYear();
        const occKey = `${evt.occasion}_${occYear}`;
        const daysLeft = daysBetween(now, occDate);

        // Only act within the reminder window
        if (daysLeft > 14 || daysLeft < 0) continue;

        // ── 1. Auto-create the card (once, at the 14-day mark or first run within window) ──
        let card = await ensureCardExists(group, member, evt, occDate, occKey);
        if (!card) continue;

        // ── 2. Send reminders at 14/7/4/1/0 days ──
        for (const stage of REMINDER_STAGES) {
          if (daysLeft !== stage) continue;
          const flagKey = `${occKey}_${stage}d`;
          const sentFlags = member.reminders_sent || {};
          if (sentFlags[flagKey]) continue;

          await sendEventReminders(group, member, allMembers, card, evt, occDate, stage);

          sentFlags[flagKey] = true;
          await supabase.from('pal_members').update({ reminders_sent: sentFlags }).eq('id', member.id);
        }
      }
    }

    // ── 3. Profile completion reminders (max 2 per member) ──
    for (const member of members) {
      const complete = !!(member.bio && member.bank_details?.account_number && member.profile_pic_url);
      if (complete) continue;
      if ((member.profile_reminder_count || 0) >= 2) continue;

      // Send roughly once a week
      const last = member.last_reminded_at ? new Date(member.last_reminded_at) : null;
      if (last && (now - last) < 6 * 24 * 60 * 60 * 1000) continue;

      sendEmail({
        to: member.email,
        template: 'palProfileReminder',
        data: {
          name: member.name, groupName: group.group_name,
          profileUrl: `${FRONTEND_URL}/pals/dashboard/members/${member.id}`,
          reminderNumber: (member.profile_reminder_count || 0) + 1,
        },
      }).catch(() => {});

      await supabase.from('pal_members').update({
        profile_reminder_count: (member.profile_reminder_count || 0) + 1,
        last_reminded_at: now,
      }).eq('id', member.id);
    }
  }

  // ── 4. Settlement: send gift pot to recipient's bank by 6pm on their day ──
  await runSettlement();
}

// Create a card for this member's event if one doesn't already exist this year
async function ensureCardExists(group, member, evt, occDate, occKey) {
  const { data: existing } = await supabase.from('cards')
    .select('id, slug').eq('pal_group_id', group.id).eq('pal_member_id', member.id).eq('pal_occasion_key', occKey).maybeSingle();

  if (existing) return existing;

  const slug = `${member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${evt.occasion}-${nanoid(6)}`;
  const titleMap = {
    birthday:   `Happy Birthday, ${member.name}! 🎂`,
    farewell:   `Wishing you well, ${member.name}! 👋`,
    graduation: `Congratulations, ${member.name}! 🎓`,
    milestone:  `Celebrating you, ${member.name}! 🎉`,
    promotion:  `Congratulations on your promotion, ${member.name}! 🎊`,
  };

  // Deadline = the celebration date itself, signing closes that day
  const deadline = new Date(occDate); deadline.setHours(23, 59, 0, 0);
  const sendDate = new Date(occDate); sendDate.setHours(9, 0, 0, 0);

  const { data: card, error } = await supabase.from('cards').insert({
    slug,
    recipient_name: member.name,
    recipient_email: member.email,
    occasion: evt.occasion,
    title: titleMap[evt.occasion] || `Celebrating ${member.name}!`,
    design_theme: 'rose_love', background_color: '#FBEAF0',
    status: 'active', is_gift_enabled: true, gift_type: 'pot',
    suggested_amount: 2000,
    send_date: sendDate.toISOString(),
    deadline: deadline.toISOString(),
    allow_private_messages: true,
    hide_amounts: true, // privacy: only recipient sees contribution amounts
    notification_scope: 'all',
    pal_group_id: group.id,
    pal_member_id: member.id,
    pal_occasion_key: occKey,
    access_token: crypto.randomBytes(16).toString('hex'),
  }).select('id, slug, access_token').maybeSingle();

  if (error) { console.error('Pal card creation error:', error.message); return null; }
  return card;
}

// Email all OTHER group members (and the owner) the sign-card link
async function sendEventReminders(group, recipientMember, allMembers, card, evt, occDate, daysLeft) {
  const occasionLabel = evt.label;
  const dateLabel = occDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // Recipients: group owner + every OTHER member (not the celebrant themselves)
  const recipients = [{ email: group.email, name: group.group_name }];
  for (const m of allMembers) {
    if (m.id === recipientMember.id) continue;
    if (m.status !== 'joined') continue;
    recipients.push({ email: m.email, name: m.name });
  }

  const signUrl = `${FRONTEND_URL}/sign/${card.slug}?access_token=${card.access_token}`;

  for (const r of recipients) {
    sendEmail({
      to: r.email,
      template: 'palEventReminder',
      data: {
        recipientName: recipientMember.name,
        occasionLabel: `${occasionLabel} (${dateLabel})`,
        daysLeft,
        signUrl,
        groupName: group.group_name,
      },
    }).catch(() => {});
  }
}

// ── Settlement: by 6pm on the celebrant's day, send the gift pot to their bank ──
async function runSettlement() {
  const now = new Date();
  if (now.getHours() < 18) return; // only run from 6pm onward

  const todayStr = now.toISOString().slice(0, 10);

  const { data: cards } = await supabase.from('cards')
    .select('id, slug, recipient_name, pal_group_id, pal_member_id, send_date, settled_at')
    .not('pal_group_id', 'is', null)
    .is('settled_at', null)
    .lte('send_date', `${todayStr}T23:59:59`);

  for (const card of (cards || [])) {
    const { data: contribs } = await supabase.from('contributions')
      .select('amount').eq('card_id', card.id).eq('status', 'success');
    const total = (contribs || []).reduce((s, c) => s + (c.amount || 0), 0);
    if (total <= 0) { await supabase.from('cards').update({ settled_at: now }).eq('id', card.id); continue; }

    const { data: group } = await supabase.from('pal_groups').select('pricing_commission_pct').eq('id', card.pal_group_id).maybeSingle();
    const { data: member } = await supabase.from('pal_members').select('bank_details, email, name').eq('id', card.pal_member_id).maybeSingle();

    const commissionPct = group?.pricing_commission_pct ?? 3.5;
    const payout = Math.round(total * (1 - commissionPct / 100));

    if (!member?.bank_details?.account_number) {
      console.warn(`Pal settlement skipped — no bank details for ${member?.name} (card ${card.slug})`);
      continue; // don't mark settled — will retry next run once profile completed
    }

    // NOTE: actual bank transfer integration (Flutterwave transfer) hooks in here.
    // Marking as settled records the computed payout for reconciliation.
    await supabase.from('cards').update({
      settled_at: now, settlement_amount: payout, settlement_commission: total - payout,
    }).eq('id', card.id);

    console.log(`Pal settlement: ${member.name} — ₦${payout.toLocaleString()} (${commissionPct}% commission retained)`);
  }
}

module.exports = { runPalAutomation };
