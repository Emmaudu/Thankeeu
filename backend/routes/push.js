const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');

// VAPID keys identify your server to push services. Generate once with:
//   npx web-push generate-vapid-keys
// then set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in the backend
// environment. Without them, push is disabled (endpoints respond gracefully).
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@taskeeu.com';
const pushEnabled = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

if (pushEnabled) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); }
  catch (e) { console.warn('[push] Invalid VAPID config:', e.message); }
} else {
  console.log('[push] VAPID keys not set — push notifications disabled until configured.');
}

// Soft auth middleware — attaches user id if a valid token is present,
// but never blocks the request. Push subscriptions belong to the device,
// not the login session, so this endpoint accepts both authed and anon.
function softAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
    }
  } catch (_) {}
  next();
}

// ─── GET /push/vapid-public-key — client needs this to subscribe ──
router.get('/vapid-public-key', (req, res) => {
  res.json({ success: true, enabled: pushEnabled, key: VAPID_PUBLIC });
});

// ─── POST /push/subscribe — store this browser's subscription ─────
router.post('/subscribe', softAuth, async (req, res) => {
  try {
    const sub = req.body.subscription || req.body;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth)
      return res.status(400).json({ success: false, message: 'Invalid subscription' });

    // Upsert by endpoint (unique). Re-subscribing updates keys + owner.
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: req.user?.id || null,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: (req.headers['user-agent'] || '').slice(0, 300),
      last_used_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save subscription' });
  }
});

// ─── POST /push/unsubscribe — remove a subscription ───────────────
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const endpoint = req.body.endpoint || req.body.subscription?.endpoint;
    if (endpoint) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true }); // best-effort
  }
});

// ── Reusable sender: push to a set of user IDs (or all). ───────────
// Returns { sent, failed }. Prunes dead subscriptions (410/404) so the
// table stays clean.
async function sendPushToUsers({ userIds = null, title, body, url = '/' }) {
  if (!pushEnabled) return { sent: 0, failed: 0, disabled: true };

  const crypto = require('crypto');
  const campaign_id = crypto.randomUUID();

  let q = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (Array.isArray(userIds)) {
    if (userIds.length === 0) return { sent: 0, failed: 0, campaign_id };
    q = q.in('user_id', userIds);
  }
  const { data: subs, error } = await q;
  if (error || !subs?.length) return { sent: 0, failed: 0, campaign_id };

  const payload = JSON.stringify({ title, body, url, campaign_id });
  let sent = 0, failed = 0;
  const dead = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      if (err.statusCode === 410 || err.statusCode === 404) dead.push(s.id);
    }
  }));

  if (dead.length) {
    await supabase.from('push_subscriptions').delete().in('id', dead);
  }
  return { sent, failed, campaign_id };
}

module.exports = router;
module.exports.sendPushToUsers = sendPushToUsers;
