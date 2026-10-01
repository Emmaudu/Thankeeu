// payLaterEmails.js — creator emails for "Create Now, Pay Later" cards:
//   • congratulations + pay link, the moment an unpaid card is published
//   • payment reminders (hourly sweep, see sweepPayLaterReminders)
//   • "payment received" once a pay-later card is paid
// Every function here is best effort: an email failure must never fail the
// request or the cron that triggered it.

const supabase = require('./supabase');
const { sendEmail } = require('./email');
const { humanSendDate, isMissingColumnError } = require('./cardPayment');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_REMINDERS = 6;

// USD is the platform's display currency (matches the pay page's default charge).
const feeLabel = () => `$${require('./pricing').priceUSD('card_fee').toFixed(2)}`;

async function getCreator(card) {
  if (!card?.creator_id) return null;
  const { data } = await supabase.from('users')
    .select('email, full_name').eq('id', card.creator_id).maybeSingle();
  return data?.email ? data : null;
}

async function countSignatures(cardId) {
  const { count } = await supabase.from('messages')
    .select('*', { count: 'exact', head: true }).eq('card_id', cardId);
  return count || 0;
}

const firstName = (full) => (full || '').trim().split(/\s+/)[0] || '';

async function sendPayLaterCreatedEmail(card) {
  try {
    const creator = await getCreator(card);
    if (!creator) return;
    await sendEmail({
      to: creator.email,
      template: 'cardCreatedPayLater',
      data: {
        creatorName: firstName(creator.full_name),
        recipientName: card.recipient_name || 'your recipient',
        cardSlug: card.slug,
        sendDate: humanSendDate(card.send_date, card.delivery_timezone),
        giftEnabled: !!card.is_gift_enabled,
        signedCount: await countSignatures(card.id),
        giftTotal: card.total_collected || 0,
        feeLabel: feeLabel(),
      },
    });
  } catch (err) {
    console.error('[pay-later] congratulations email failed:', err.message);
  }
}

async function sendCardFeePaidEmail(card) {
  try {
    const creator = await getCreator(card);
    if (!creator) return;
    const due = card.send_date ? new Date(card.send_date).getTime() : NaN;
    await sendEmail({
      to: creator.email,
      template: 'cardFeePaid',
      data: {
        recipientName: card.recipient_name || 'your recipient',
        cardSlug: card.slug,
        sendDate: humanSendDate(card.send_date, card.delivery_timezone),
        hasRecipientEmail: !!card.recipient_email,
        deliveringNow: !!card.recipient_email && !isNaN(due) && due <= Date.now() + 60 * 1000,
      },
    });
  } catch (err) {
    console.error('[pay-later] payment-received email failed:', err.message);
  }
}

/**
 * Which reminder, if any, is due for this card right now?
 *   overdue — the delivery time has passed while unpaid: tell them at once
 *             (the first sweep after send_date), then daily.
 *   soon    — delivery within 72h: daily.
 *   general — otherwise every 3 days.
 * Capped at MAX_REMINDERS; stops 14 days after a missed delivery date.
 */
function reminderStageFor(card, now = Date.now()) {
  const count = card.payment_reminder_count || 0;
  const lastRaw = card.payment_reminder_sent_at || card.updated_at || card.created_at;
  const last = lastRaw ? new Date(lastRaw).getTime() : 0;
  const due = card.send_date ? new Date(card.send_date).getTime() : NaN;
  const hasDue = !isNaN(due);
  // The "your card is on hold" notice is always sent once when the delivery
  // time passes unpaid — even if the earlier reminders used up the cap.
  if (hasDue && now >= due && now - due <= 14 * DAY && last < due) return 'overdue';
  if (count >= MAX_REMINDERS) return null;

  if (hasDue && now >= due) {
    if (now - due > 14 * DAY) return null;
    if (last < due) return 'overdue';        // first notice that it is on hold
    return now - last >= DAY ? 'overdue' : null;
  }
  if (hasDue && due - now <= 72 * HOUR) return now - last >= DAY ? 'soon' : null;
  return now - last >= 3 * DAY ? 'general' : null;
}

async function sweepPayLaterReminders({ overdueOnly = false } = {}) {
  let q = supabase.from('cards')
    .select('*')
    .eq('status', 'active')
    .eq('payment_pending', true)
    .or('recipient_notified.is.null,recipient_notified.eq.false')
    .not('creator_id', 'is', null);
  if (overdueOnly) {
    // Per-minute pass: only cards whose delivery time has just passed unpaid,
    // so the creator hears "on hold" within a minute, not up to an hour later.
    const nowIso = new Date().toISOString();
    q = q.lte('send_date', nowIso).gte('send_date', new Date(Date.now() - 14 * DAY).toISOString());
  }
  const { data: cards, error } = await q.limit(500);
  if (error) {
    if (!isMissingColumnError(error)) console.error('[pay-later reminders] query failed:', error.message);
    return { sent: 0 };
  }

  let sent = 0;
  const now = Date.now();
  for (const card of cards || []) {
    const stage = reminderStageFor(card, now);
    if (!stage) continue;
    if (overdueOnly) {
      const last = card.payment_reminder_sent_at ? new Date(card.payment_reminder_sent_at).getTime() : 0;
      if (stage !== 'overdue' || last >= new Date(card.send_date).getTime()) continue;
    }
    const count = card.payment_reminder_count || 0;

    // Claim this reminder first (optimistic lock on the count) so two server
    // instances running the same sweep can never email the creator twice.
    const { data: claimed, error: claimErr } = await supabase.from('cards')
      .update({ payment_reminder_count: count + 1, payment_reminder_sent_at: new Date(now).toISOString() })
      .eq('id', card.id)
      .eq('payment_reminder_count', count)
      .eq('payment_pending', true)
      .select('id')
      .maybeSingle();
    if (claimErr || !claimed) continue;

    try {
      const creator = await getCreator(card);
      if (!creator) continue;
      await sendEmail({
        to: creator.email,
        template: 'payLaterReminder',
        data: {
          stage,
          creatorName: firstName(creator.full_name),
          recipientName: card.recipient_name || 'your recipient',
          cardSlug: card.slug,
          sendDate: humanSendDate(card.send_date, card.delivery_timezone),
          signedCount: await countSignatures(card.id),
          giftTotal: card.total_collected || 0,
          feeLabel: feeLabel(),
        },
      });
      sent += 1;
    } catch (err) {
      console.error(`[pay-later reminders] ${card.slug}:`, err.message);
    }
  }
  if (sent) console.log(`[pay-later reminders] sent ${sent} reminder(s)`);
  return { sent };
}

module.exports = {
  sendPayLaterCreatedEmail,
  sendCardFeePaidEmail,
  sweepPayLaterReminders,
  reminderStageFor,
  MAX_REMINDERS,
};
