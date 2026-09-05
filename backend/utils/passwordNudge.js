/**
 * Two reminders, a day apart, for quick-start accounts that still have no
 * password of their own.
 *
 * Those accounts were created from an email address alone so someone could
 * send a free test card. Their password is random and unknown even to them, so
 * until they set one the only way back in is the reset link — which is worth
 * exactly two reminders and then silence. Nobody should be nagged forever.
 */
const supabase = require('./supabase');
const { sendEmail } = require('./email');

const DAY = 24 * 60 * 60 * 1000;
const MAX_NUDGES = 2;

/** One pass. Safe to call repeatedly; each user is nudged at most once a day. */
const sweepPasswordNudges = async () => {
  const cutoff = new Date(Date.now() - DAY).toISOString();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, reset_token, password_nudge_count, password_nudged_at, created_at')
    .eq('must_set_password', true)
    .lt('password_nudge_count', MAX_NUDGES)
    .limit(200);

  if (error) { console.error('[passwordNudge] query failed:', error.message); return 0; }
  if (!users?.length) return 0;

  const base = (process.env.FRONTEND_URL || 'https://www.thankeeu.com').replace(/\/$/, '');
  let sent = 0;

  for (const u of users) {
    // A day must have passed since the last nudge — or since signup, for the
    // first one. Filtering in JS keeps the query simple and the rule in one
    // readable place.
    const since = u.password_nudged_at || u.created_at;
    if (since && new Date(since).toISOString() > cutoff) continue;
    if (!u.email || !u.reset_token) continue;

    const count = (u.password_nudge_count || 0) + 1;
    try {
      await sendEmail({
        to: u.email,
        template: 'setPasswordReminder',
        data: {
          name: String(u.full_name || '').split(' ')[0] || 'there',
          resetUrl: `${base}/reset-password?token=${u.reset_token}`,
          lastCall: count >= MAX_NUDGES,
        },
      });
      // Counter moves only after the send actually succeeded, so a mail outage
      // costs a delay rather than a silently skipped reminder.
      await supabase.from('users')
        .update({ password_nudge_count: count, password_nudged_at: new Date() })
        .eq('id', u.id);
      sent++;
    } catch (err) {
      console.error('[passwordNudge] send failed for', u.id, err.message);
    }
  }

  if (sent) console.log(`[passwordNudge] sent ${sent} reminder(s)`);
  return sent;
};

module.exports = { sweepPasswordNudges, MAX_NUDGES };
