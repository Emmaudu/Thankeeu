// Public, read-only site content (no auth).
const express = require('express');
const router = express.Router();
const { readHero } = require('../utils/heroSettings');

// GET /api/site/hero — the homepage hero text set in Admin → Header.
// null fields mean "use the built-in default". Never fails the homepage:
// any error returns all-null so the defaults render.
router.get('/hero', async (req, res) => {
  try {
    const hero = await readHero();
    // Short shared cache: an admin edit shows up within a minute.
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ ok: true, hero });
  } catch (err) {
    console.error('[site/hero] read failed:', err.message);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: false, hero: { title: null, subtitle: null, tagline: null, updated_at: null } });
  }
});

module.exports = router;
