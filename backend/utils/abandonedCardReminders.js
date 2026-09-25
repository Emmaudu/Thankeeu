// abandonedCardReminders.js — nudge creators who started a card but never
// published it (status 'draft'):
//   1st reminder: 1 day after they last worked on it
//   2nd reminder: 2 days after the 1st
//   final:        5 days after the 2nd — politely suggests deleting it, but
//                 still offers to continue. Nothing is sent after that.
// Editing the draft again restarts the sequence (they came back).
const supabase = require('./supabase');
const { sendEmail } = require('./email');
const { isMissingColumnError } = require('./cardPayment');

const DAY = 24 * 60 * 60 * 1000;
const GAPS = [1 * DAY, 2 * DAY, 5 * DAY];
// Do not email about drafts abandoned long before this feature shipped.
const MAX_AGE_FOR_FIRST = 10 * DAY;

function abandonedStageFor(card, now = Date.now()) {
  const count = card.abandoned_reminder_count || 0;
  if (count >= GAPS.length) return null;
  const lastActivity = new Date(card.updated_at || card.created_at).getTime();
  const lastReminder = card.abandoned_reminder_sent_at ? new Date(card.abandoned_reminder_sent_at).getTime() : 0;
  if (isNaN(lastActivity)) return null;
  // Worked on it after our last reminder → they responded; stay quiet until
  // they go idle again (the count is reset by the sweep).
  const base = count === 0 ? lastActivity : lastReminder;
  if (count === 0 && now - lastActivity > MAX_AGE_FOR_FIRST) return null;
  if (now - base < GAPS[count]) return null;
  return count === 2 ? 'final' : count + 1;
}

async function sweepAbandonedCards() {
  const since = new Date(Date.now() - 30 * DAY).toISOString();
  const { data: drafts, error } = await supabase.from('cards')
    .select('*')
    .eq('status', 'draft')
    .not('creator_id', 'is', null)
    .gte('created_at', since)
    .limit(500);
  if (error) {
    if (!isMissingColumnError(error)) console.error('[abandoned] query failed:', error.message);
    return { sent: 0 };
  }
  let sent = 0;
  const now = Date.now();
  for (const card of drafts || []) {
    let current = card;
    // Came back and edited after a reminder → restart the sequence.
    if ((card.abandoned_reminder_count || 0) > 0 && card.abandoned_reminder_sent_at
        && new Date(card.updated_at).getTime() > new Date(card.abandoned_reminder_sent_at).getTime() + 60 * 1000) {
      const { error: resetErr } = await supabase.from('cards')
        .update({ abandoned_reminder_count: 0, abandoned_reminder_sent_at: null })
        .eq('id', card.id);
      if (resetErr) continue;
      current = { ...card, abandoned_reminder_count: 0, abandoned_reminder_sent_at: null };
    }
    const stage = abandonedStageFor(current, now);
    if (!stage) continue;
    const count = current.abandoned_reminder_count || 0;
    // Claim first (optimistic lock) so parallel instances never double-send.
    // updated_at is deliberately NOT touched, so this does not look like the
    // creator coming back.
    const { data: claimed, error: claimErr } = await supabase.from('cards')
      .update({ abandoned_reminder_count: count + 1, abandoned_reminder_sent_at: new Date(now).toISOString() })
      .eq('id', card.id).eq('status', 'draft').eq('abandoned_reminder_count', count)
      .select('id').maybeSingle();
    if (claimErr || !claimed) continue;
    try {
      const { data: user } = await supabase.from('users')
        .select('email, full_name').eq('id', card.creator_id).maybeSingle();
      if (!user?.email) continue;
      await sendEmail({
        to: user.email,
        template: 'abandonedCardReminder',
        data: {
          stage,
          creatorName: (user.full_name || '').trim().split(/\s+/)[0],
          recipientName: card.recipient_name || '',
          cardSlug: card.slug,
        },
      });
      sent += 1;
    } catch (e) {
      console.error(`[abandoned] ${card.slug}:`, e.message);
    }
  }
  if (sent) console.log(`[abandoned] sent ${sent} reminder(s)`);
  return { sent };
}

module.exports = { sweepAbandonedCards, abandonedStageFor };
