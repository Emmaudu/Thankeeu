const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// ─── GET /settings — public, unauthenticated ───────────────────────
// Exposes a curated set of site_settings rows to the frontend (e.g. nav
// link visibility toggles). Only keys explicitly listed here are ever
// returned — new internal/admin-only settings added later won't leak
// here unless someone deliberately adds them to PUBLIC_KEYS.
// Boolean keys (coerced to true/false) and text keys (returned as-is).
const PUBLIC_BOOL_KEYS = ['nav_show_browse_taskers', 'refer_banner_enabled'];
const PUBLIC_TEXT_KEYS = ['refer_banner_text', 'home_hero_heading', 'home_hero_subheading', 'vooom_hero_heading', 'vooom_hero_subheading'];
const PUBLIC_KEYS = [...PUBLIC_BOOL_KEYS, ...PUBLIC_TEXT_KEYS];

// Sensible defaults if a row hasn't been created yet (fresh install) or
// if the DB call fails — we fail open so a settings hiccup never breaks
// the site.
const DEFAULTS = {
  nav_show_browse_taskers: true,
  refer_banner_enabled: true,
  refer_banner_text: 'Refer and earn: get 10% commission when people you invite complete tasks.',
  home_hero_heading: 'Need someone to run an errand for you in Nigeria?',
  home_hero_subheading: 'Hire a verified errand runner in Lagos, Abuja, Port Harcourt or anywhere in Nigeria. Grocery runs, NIMC queuing, pharmacy pickups, bill payments — any errand handled. Safe. Fast. Fair.',
  vooom_hero_heading: 'Send anything across Nigeria or worldwide — with someone already going.',
  vooom_hero_subheading: 'Verified carriers already travelling your route bid to carry your item. Pay a fraction of courier prices.',
};

router.get('/', async (req, res) => {
  const settings = { ...DEFAULTS };
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', PUBLIC_KEYS);
    if (error) throw error;

    for (const row of data || []) {
      if (PUBLIC_BOOL_KEYS.includes(row.key)) settings[row.key] = row.value === 'true';
      else settings[row.key] = row.value;
    }
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Get public settings error:', err);
    res.json({ success: true, settings }); // fail open with defaults
  }
});

module.exports = router;
