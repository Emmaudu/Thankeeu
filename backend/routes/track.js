const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const jwt = require('jsonwebtoken');

// Soft auth: attach user id if a valid token is present, but never block —
// installs and push interactions can happen while logged out.
function softAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    }
  } catch (_) { /* ignore — anonymous */ }
  next();
}

// ─── POST /track/pwa-install ──────────────────────────────────────
router.post('/pwa-install', softAuth, async (req, res) => {
  try {
    const { platform, device_type, user_agent } = req.body || {};
    await supabase.from('pwa_installs').insert({
      user_id: req.userId || null,
      platform: (platform || 'other').slice(0, 20),
      device_type: (device_type || 'unknown').slice(0, 20),
      user_agent: (user_agent || req.headers['user-agent'] || '').slice(0, 300),
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true }); // never let tracking break the client
  }
});

// ─── POST /track/push-event ───────────────────────────────────────
// Called by the service worker (via the page) when a push is shown/opened.
router.post('/push-event', softAuth, async (req, res) => {
  try {
    const { campaign_id, event, title } = req.body || {};
    if (!['shown', 'opened'].includes(event)) return res.json({ success: true });
    await supabase.from('push_events').insert({
      campaign_id: campaign_id || null,
      user_id: req.userId || null,
      event,
      title: (title || '').slice(0, 120),
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// ─── POST /track/poster-event ─────────────────────────────────────
router.post('/poster-event', softAuth, async (req, res) => {
  try {
    const { event, role } = req.body || {};
    if (!['download', 'copy_link'].includes(event)) return res.json({ success: true });
    await supabase.from('poster_events').insert({
      user_id: req.userId || null,
      event,
      role: role || null,
    });
    res.json({ success: true });
  } catch (_) { res.json({ success: true }); }
});
module.exports = router;
