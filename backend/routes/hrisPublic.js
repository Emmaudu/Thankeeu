const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const jwt      = require('jsonwebtoken');
const supabase = require('../utils/supabase');

const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const BACKEND_URL        = process.env.BACKEND_URL || 'https://thankeeu-production.up.railway.app';
const REDIRECT_URI       = `${BACKEND_URL}/api/hris/zoho-callback`;

const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (s.includes('=') && !s.startsWith('http')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  return s.startsWith('http') ? s.replace(/\/$/, '') : 'https://thankeeu.com';
})();

// ── GET /api/hris/zoho-auth?token=<signed_company_jwt> ────────────────────────
// Browser navigates here → backend builds Zoho OAuth URL and redirects
// The token param is a short-lived JWT signed by our JWT_SECRET containing companyId
// Frontend gets this token via a fetch call first (with Authorization header)
router.get('/zoho-auth', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token param');

    // Verify the short-lived token from frontend
    let companyId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'zoho_init') throw new Error('wrong token type');
      companyId = decoded.companyId;
    } catch (e) {
      return res.status(401).send('Invalid or expired token. Please try again.');
    }

    if (!ZOHO_CLIENT_ID) {
      return res.status(500).send('ZOHO_CLIENT_ID not configured in Railway environment variables');
    }

    // Embed companyId in state so callback can identify who to save tokens for
    const state = jwt.sign(
      { companyId, type: 'zoho_state', ts: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const params = new URLSearchParams({
      scope:         'ZohoPeople.employee.ALL',
      client_id:     ZOHO_CLIENT_ID,
      response_type: 'code',
      access_type:   'offline',
      redirect_uri:  REDIRECT_URI,
      state,
      prompt:        'consent',
    });

    const zohoUrl = `https://accounts.zoho.com/oauth/v2/auth?${params}`;
    console.log('[zoho-auth] company:', companyId, '→ redirecting to Zoho consent');
    res.redirect(zohoUrl);
  } catch (err) {
    console.error('[zoho-auth] error:', err.message);
    res.redirect(`${FRONTEND_URL}/company/hris?error=zoho_auth_failed`);
  }
});

// ── GET /api/hris/zoho-callback ───────────────────────────────────────────────
// Zoho redirects here after HR approves access
router.get('/zoho-callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('[zoho-callback] Zoho error:', error);
    return res.redirect(`${FRONTEND_URL}/company/hris?error=zoho_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/company/hris?error=zoho_missing_params`);
  }

  let companyId;
  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (decoded.type !== 'zoho_state') throw new Error('wrong token type');
    companyId = decoded.companyId;
  } catch (e) {
    console.error('[zoho-callback] invalid state:', e.message);
    return res.redirect(`${FRONTEND_URL}/company/hris?error=zoho_state_invalid`);
  }

  try {
    const params = new URLSearchParams({
      code,
      client_id:     ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    });

    console.log('[zoho-callback] exchanging code for tokens, company:', companyId);
    const r = await axios.post(
      'https://accounts.zoho.com/oauth/v2/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );
    console.log('[zoho-callback] Zoho response:', JSON.stringify(r.data));

    if (!r.data.refresh_token) {
      return res.redirect(
        `${FRONTEND_URL}/company/hris?error=zoho_no_refresh_token&detail=${encodeURIComponent(JSON.stringify(r.data))}`
      );
    }

    const { access_token, refresh_token, expires_in } = r.data;
    const tokenExpiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

    // Upsert the connection
    const { data: existing } = await supabase
      .from('hris_connections')
      .select('id')
      .eq('company_id', companyId)
      .eq('provider', 'zoho_people')
      .maybeSingle();

    const payload = {
      company_id: companyId, provider: 'zoho_people',
      display_name: 'Zoho People',
      api_key: ZOHO_CLIENT_ID, api_secret: ZOHO_CLIENT_SECRET,
      access_token, refresh_token, token_expires_at: tokenExpiresAt,
      is_active: true, is_verified: false, updated_at: new Date(),
    };

    if (existing?.id) {
      await supabase.from('hris_connections').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('hris_connections').insert(payload);
    }

    console.log('[zoho-callback] connection saved for company:', companyId);
    res.redirect(`${FRONTEND_URL}/company/hris?zoho_connected=1`);

  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[zoho-callback] token exchange error:', detail);
    res.redirect(
      `${FRONTEND_URL}/company/hris?error=zoho_exchange_failed&detail=${encodeURIComponent(JSON.stringify(detail))}`
    );
  }
});

module.exports = router;
