const express  = require('express');
const router   = express.Router();
const supabase = require('../utils/supabase');
const axios    = require('axios');
const { adminAuth } = require('../middleware/auth');

// ── IP → Country cache (in-memory, resets on server restart) ─────────────────
// Avoids hitting the geo API on every single page view from the same IP
const geoCache = new Map(); // ip → { country, city, ts }
const GEO_TTL  = 24 * 60 * 60 * 1000; // cache each IP for 24 hours

async function getCountry(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { country: 'Local', city: null };
  }
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.ts < GEO_TTL) {
    return { country: cached.country, city: cached.city };
  }
  try {
    // ip-api.com: free, no key, 45 req/min, returns JSON
    const { data } = await axios.get(`http://ip-api.com/json/${ip}?fields=country,city,status`, { timeout: 2000 });
    if (data.status === 'success') {
      const result = { country: data.country || null, city: data.city || null };
      geoCache.set(ip, { ...result, ts: Date.now() });
      // Prevent unbounded cache growth
      if (geoCache.size > 10000) {
        const oldest = [...geoCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0][0];
        geoCache.delete(oldest);
      }
      return result;
    }
  } catch { /* geo lookup failed — not critical */ }
  return { country: null, city: null };
}

// Helper — extract real IP (Railway sets x-forwarded-for)
function getIP(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
}

// ── POST /api/analytics/track ─────────────────────────────────────────────────
router.post('/track', async (req, res) => {
  try {
    const { path, referrer, session_id, user_type } = req.body;
    if (!path || !session_id) return res.json({ ok: false });

    const ignorePaths = ['/api', '/health', '/favicon'];
    if (ignorePaths.some(p => path.startsWith(p))) return res.json({ ok: false });

    const ua = req.headers['user-agent'] || '';
    const isBot = /bot|crawl|spider|slurp|facebook|twitter|preview|lighthouse|chrome-lighthouse/i.test(ua);
    if (isBot) return res.json({ ok: false, reason: 'bot' });

    // Get country from IP (cached)
    const ip = getIP(req);
    const { country, city } = await getCountry(ip);

    const { error: insertErr } = await supabase.from('page_views').insert({
      path:       path.slice(0, 200),
      referrer:   referrer?.slice(0, 500) || null,
      user_agent: ua.slice(0, 300),
      session_id: session_id.slice(0, 64),
      user_type:  user_type || 'anonymous',
      country:    country || null,
      city:       city    || null,
      created_at: new Date(),
    });

    if (insertErr) {
      console.error('[analytics/track] insert failed:', insertErr.message, insertErr.code);
      return res.json({ ok: false, error: insertErr.message });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[analytics/track] unexpected error:', err.message);
    res.json({ ok: false });
  }
});

// ── GET /api/analytics/dashboard — admin only ─────────────────────────────────
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Daily unique visitors and page views
    // limit(50000): Supabase default cap is 1000 rows. For a 30-day window
    // with active traffic, 1000 rows covers only ~33 views/day which is too low.
    // 50k rows = ~1,600 views/day over 30 days — enough headroom for now.
    const { data: raw, error: fetchErr } = await supabase.from('page_views')
      .select('path, session_id, created_at, country, city')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(50000);

    if (fetchErr) {
      console.error('[analytics/dashboard] fetch failed:', fetchErr.message, fetchErr.code);
      return res.status(500).json({ error: 'Analytics unavailable: ' + fetchErr.message });
    }

    console.log(`[analytics/dashboard] rows fetched: ${(raw||[]).length} (last ${days} days)`);
    const views = raw || [];

    // Aggregate by day
    const byDay     = {};
    const byPath    = {};
    const byCountry = {};
    const sessions  = new Set();

    const todayStr = new Date().toISOString().split('T')[0];

    views.forEach(v => {
      const day = new Date(v.created_at).toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { views: 0, unique: new Set() };
      byDay[day].views++;
      byDay[day].unique.add(v.session_id);
      byPath[v.path] = (byPath[v.path] || 0) + 1;
      sessions.add(v.session_id);
      if (v.country) byCountry[v.country] = (byCountry[v.country] || 0) + 1;
    });

    // Today stats
    const todayViews   = byDay[todayStr]?.views  || 0;
    const todayUnique  = byDay[todayStr]?.unique?.size || 0;
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayViews = byDay[yesterdayStr]?.views || 0;

    // Top countries
    const topCountries = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Build chart data — fill missing days with 0
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dayStr = d.toISOString().split('T')[0];
      const label  = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
      chartData.push({
        day:     dayStr,
        label,
        views:   byDay[dayStr]?.views   || 0,
        unique:  byDay[dayStr]?.unique?.size || 0,
      });
    }

    // Top pages
    const topPages = Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Summary stats
    const totalViews   = views.length;
    const totalUnique  = sessions.size;
    const avgPerDay    = Math.round(totalViews / days);

    res.json({
      summary: {
        totalViews, totalUnique, avgPerDay,
        todayViews, todayUnique, yesterdayViews, days,
      },
      chartData,
      topPages,
      topCountries,
    });
  } catch (err) {
    console.error('[analytics]', err.message);
    res.status(500).json({ error: 'Analytics unavailable' });
  }
});

// ── GET /api/analytics/country-visits — admin only ────────────────────────────
// Returns raw visit rows for a given country (or all countries) with path + timestamp
router.get('/country-visits', adminAuth, async (req, res) => {
  try {
    const days    = parseInt(req.query.days)    || 30;
    const country = req.query.country           || null; // null = all countries
    const limit   = Math.min(parseInt(req.query.limit) || 200, 1000);
    const since   = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase.from('page_views')
      .select('path, country, city, session_id, user_type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (country) query = query.eq('country', country);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json(data || []);
  } catch (err) {
    console.error('[analytics/country-visits]', err.message);
    res.status(500).json({ error: 'Failed to load visit log' });
  }
});

module.exports = router;
