// payLaterEmails.js — creator emails for "Create Now, Pay Later" cards:
//   • congratulations + pay link, the moment an unpaid card is published
//   • payment reminders (hourly sweep, see sweepPayLaterReminders)
//   • "payment received" once a pay-later card is paid
// Every function here is best effort: an email failure must never fail the
// request or the cron that triggered it.

const supabase = require('./supabase');
const { sendEmail } = require('./email');
const { humanSendDate, isMissingColumnError, CARD_FEE_NGN } = require('./cardPayment');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_REMINDERS = 6;

const feeLabel = () => `₦${CARD_FEE_NGN.toLocaleString('en-NG')}`;

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
  if (count >= MAX_REMINDERS) return null;
  const lastRaw = card.payment_reminder_sent_at || card.updated_at || card.created_at;
  const last = lastRaw ? new Date(lastRaw).getTime() : 0;
  const due = card.send_date ? new Date(card.send_date).getTime() : NaN;
  const hasDue = !isNaN(due);

  if (hasDue && now >= due) {
    if (now - due > 14 * DAY) return null;
    if (last < due) return 'overdue';        // first notice that it is on hold
    return now - last >= DAY ? 'overdue' : null;
  }
  if (hasDue && due - now <= 72 * HOUR) return now - last >= DAY ? 'soon' : null;
  return now - last >= 3 * DAY ? 'general' : null;
}

async function sweepPayLaterReminders() {
  const { data: cards, error } = await supabase.from('cards')
    .select('*')
    .eq('status', 'active')
    .eq('payment_pending', true)
    .eq('recipient_notified', false)
    .not('creator_id', 'is', null)
    .limit(500);
  if (error) {
    if (!isMissingColumnError(error)) console.error('[pay-later reminders] query failed:', error.message);
    return { sent: 0 };
  }

  let sent = 0;
  const now = Date.now();
  for (const card of cards || []) {
    const stage = reminderStageFor(card, now);
    if (!stage) continue;
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
