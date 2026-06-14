const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const jwt      = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { companyAuth } = require('../middleware/companyAuth');

const BACKEND_URL  = process.env.BACKEND_URL || 'https://thankeeu-production.up.railway.app';
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (s.includes('=') && !s.startsWith('http')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  return s.startsWith('http') ? s.replace(/\/$/, '') : 'https://thankeeu.com';
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

// Sign a short-lived state token embedding companyId + provider
function makeState(companyId, provider, extra = {}) {
  return jwt.sign(
    { companyId, provider, type: 'hris_oauth_state', ts: Date.now(), ...extra },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}
function verifyState(state) {
  const d = jwt.verify(state, process.env.JWT_SECRET);
  if (d.type !== 'hris_oauth_state') throw new Error('wrong token type');
  return d;
}

// Upsert an hris_connections row and redirect back to the HRIS page
async function saveConnection(companyId, provider, displayName, payload) {
  const { data: existing } = await supabase
    .from('hris_connections').select('id')
    .eq('company_id', companyId).eq('provider', provider).maybeSingle();

  const row = {
    company_id: companyId, provider, display_name: displayName,
    is_active: true, is_verified: false, updated_at: new Date(),
    ...payload,
  };

  if (existing?.id) {
    await supabase.from('hris_connections').update(row).eq('id', existing.id);
  } else {
    await supabase.from('hris_connections').insert(row);
  }
}

function redirectSuccess(res, provider) {
  res.redirect(`${FRONTEND_URL}/company/hris?connected=${provider}`);
}
function redirectError(res, provider, err, detail) {
  console.error(`[oauth][${provider}] error:`, err, detail || '');
  const msg = encodeURIComponent(String(detail || err || 'unknown'));
  res.redirect(`${FRONTEND_URL}/company/hris?error=${provider}_failed&detail=${msg}`);
}

// ── Generic OAuth init endpoint ───────────────────────────────────────────────
// GET /api/hris/:provider/auth  (protected — HR must be logged in)
// Issues a short-lived token so the browser can navigate away with state

const OAUTH_CONFIGS = {

  zoho_people: {
    name: 'Zoho People',
    authUrl: () => 'https://accounts.zoho.com/oauth/v2/auth',
    clientId:     () => process.env.ZOHO_CLIENT_ID,
    clientSecret: () => process.env.ZOHO_CLIENT_SECRET,
    scope: 'ZohoPeople.employee.ALL,ZohoPeople.forms.ALL',
    tokenUrl: () => 'https://accounts.zoho.com/oauth/v2/token',
    extraParams: { prompt: 'consent', access_type: 'offline' },
    offline: true, // has refresh_token
  },

  bamboohr: {
    name: 'BambooHR',
    // BambooHR OAuth requires the subdomain in the URL — HR types it first
    // We collect subdomain from a tiny pre-auth form, then redirect
    needsSubdomain: true,
    authUrl: (subdomain) => `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/oauth2/authorize`,
    clientId:     () => process.env.BAMBOOHR_CLIENT_ID,
    clientSecret: () => process.env.BAMBOOHR_CLIENT_SECRET,
    scope: 'openid r_employees_fullaccess',
    tokenUrl: (subdomain) => `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/oauth2/token`,
    offline: false, // BambooHR tokens are long-lived
  },

  rippling: {
    name: 'Rippling',
    authUrl: () => `https://app.rippling.com/apps/PLATFORM/${process.env.RIPPLING_APP_NAME || 'thankeeu'}/authorize`,
    clientId:     () => process.env.RIPPLING_CLIENT_ID,
    clientSecret: () => process.env.RIPPLING_CLIENT_SECRET,
    scope: 'employees:read',
    tokenUrl: () => 'https://app.rippling.com/api/o/token/',
    offline: true,
  },

  gusto: {
    name: 'Gusto',
    authUrl: () => 'https://api.gusto.com/oauth/authorize',
    clientId:     () => process.env.GUSTO_CLIENT_ID,
    clientSecret: () => process.env.GUSTO_CLIENT_SECRET,
    scope: 'companies:read employees:read',
    tokenUrl: () => 'https://api.gusto.com/oauth/token',
    offline: true,
  },

  deel: {
    name: 'Deel',
    authUrl: () => 'https://app.letsdeel.com/oauth2/authorize',
    clientId:     () => process.env.DEEL_CLIENT_ID,
    clientSecret: () => process.env.DEEL_CLIENT_SECRET,
    scope: 'people:read',
    tokenUrl: () => 'https://app.letsdeel.com/oauth2/token',
    offline: true,
  },
};

// ── /api/hris/:provider/init — protected, issues redirect URL ────────────────
router.get('/:provider/init', companyAuth, async (req, res) => {
  const { provider } = req.params;
  const cfg = OAUTH_CONFIGS[provider];
  if (!cfg) return res.status(404).json({ error: `OAuth not supported for ${provider}` });

  const clientId = cfg.clientId();
  if (!clientId) {
    const setup = {
      zoho_people: {
        envVars: 'ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET',
        steps: 'Go to api-console.zoho.com → Add Client → Server-based Applications → set redirect URI to https://thankeeu-production.up.railway.app/api/hris/zoho_people/callback → copy Client ID and Secret into Railway env vars',
      },
      bamboohr: {
        envVars: 'BAMBOOHR_CLIENT_ID and BAMBOOHR_CLIENT_SECRET',
        steps: 'Go to developers.bamboohr.com → Create Application → set redirect URI to https://thankeeu-production.up.railway.app/api/hris/bamboohr/callback → copy Client ID and Secret into Railway env vars',
      },
      rippling: {
        envVars: 'RIPPLING_CLIENT_ID, RIPPLING_CLIENT_SECRET and RIPPLING_APP_NAME',
        steps: 'Go to developer.rippling.com → Create App → OAuth2 → set redirect URI to https://thankeeu-production.up.railway.app/api/hris/rippling/callback → copy credentials into Railway env vars',
      },
      gusto: {
        envVars: 'GUSTO_CLIENT_ID and GUSTO_CLIENT_SECRET',
        steps: 'Go to dev.gusto.com → Create Application → set redirect URI to https://thankeeu-production.up.railway.app/api/hris/gusto/callback → copy Client ID and Secret into Railway env vars',
      },
      deel: {
        envVars: 'DEEL_CLIENT_ID and DEEL_CLIENT_SECRET',
        steps: 'Go to developer.deel.com → Create OAuth App → set redirect URI to https://thankeeu-production.up.railway.app/api/hris/deel/callback → copy Client ID and Secret into Railway env vars',
      },
    };
    const info = setup[provider] || { envVars: `${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET`, steps: 'Register Thankeeu as an OAuth app on the provider developer portal and add credentials to Railway env vars.' };
    console.error(`[oauth][${provider}] env vars not set — ${info.envVars} missing from Railway`);
    return res.status(503).json({
      error: `${cfg.name} OAuth not yet activated`,
      message: `To enable ${cfg.name} OAuth, add these Railway environment variables: ${info.envVars}`,
      setup_steps: info.steps,
      coming_soon: true,
    });
  }

  const subdomain = req.query.subdomain || '';
  // For BambooHR we need subdomain before we can build the auth URL
  if (cfg.needsSubdomain && !subdomain) {
    return res.status(400).json({ error: 'subdomain_required', message: 'Enter your BambooHR subdomain first' });
  }

  const state = makeState(req.company.id, provider, subdomain ? { subdomain } : {});
  const redirectUri = `${BACKEND_URL}/api/hris/${provider}/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  redirectUri,
    scope:         cfg.scope,
    state,
    ...(cfg.extraParams || {}),
  });

  const authUrl = cfg.needsSubdomain ? cfg.authUrl(subdomain) : cfg.authUrl();
  const fullUrl = `${authUrl}?${params}`;

  console.log(`[oauth][${provider}] company ${req.company.id} → redirecting`);
  res.json({ url: fullUrl });
});

// ── /api/hris/:provider/callback — browser redirect from provider ─────────────
router.get('/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  const cfg = OAUTH_CONFIGS[provider];
  if (!cfg) return res.redirect(`${FRONTEND_URL}/company/hris?error=unknown_provider`);

  if (error) return redirectError(res, provider, error);
  if (!code || !state) return redirectError(res, provider, 'missing_params');

  let stateData;
  try { stateData = verifyState(state); }
  catch (e) { return redirectError(res, provider, 'invalid_state', e.message); }

  const { companyId, subdomain } = stateData;
  const redirectUri  = `${BACKEND_URL}/api/hris/${provider}/callback`;
  const clientId     = cfg.clientId();
  const clientSecret = cfg.clientSecret();
  const tokenUrl     = cfg.needsSubdomain ? cfg.tokenUrl(subdomain) : cfg.tokenUrl();

  try {
    const params = new URLSearchParams({
      code, grant_type: 'authorization_code',
      client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const r = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    console.log(`[oauth][${provider}] token response:`, JSON.stringify(r.data).slice(0, 200));

    const { access_token, refresh_token, expires_in } = r.data;
    if (!access_token) throw new Error(`No access_token in response: ${JSON.stringify(r.data)}`);

    const tokenExpiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000) : null;

    await saveConnection(companyId, provider, cfg.name, {
      api_key:          clientId,
      api_secret:       clientSecret,
      access_token,
      refresh_token:    refresh_token || null,
      token_expires_at: tokenExpiresAt,
      base_url:         subdomain ? `https://${subdomain}.bamboohr.com` : null,
      company_code:     subdomain || null,
    });

    console.log(`[oauth][${provider}] connection saved for company ${companyId}`);
    redirectSuccess(res, provider);

  } catch (err) {
    const detail = err.response?.data || err.message;
    redirectError(res, provider, `${provider}_token_exchange`, detail);
  }
});

// ── Legacy Zoho routes (keep for backward compatibility) ─────────────────────
router.get('/zoho-auth', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type !== 'zoho_init') throw new Error('wrong type');
    const state = makeState(d.companyId, 'zoho_people');
    const cfg = OAUTH_CONFIGS.zoho_people;
    const params = new URLSearchParams({
      scope: cfg.scope, client_id: cfg.clientId(),
      response_type: 'code', access_type: 'offline',
      redirect_uri: `${BACKEND_URL}/api/hris/zoho_people/callback`,
      state, prompt: 'consent',
    });
    res.redirect(`https://accounts.zoho.com/oauth/v2/auth?${params}`);
  } catch (e) {
    res.redirect(`${FRONTEND_URL}/company/hris?error=zoho_auth_failed`);
  }
});

router.get('/zoho-init', companyAuth, (req, res) => {
  const token = jwt.sign({ companyId: req.company.id, type: 'zoho_init' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const BACKEND = process.env.BACKEND_URL || 'https://thankeeu-production.up.railway.app';
  res.json({ url: `${BACKEND}/api/hris/zoho-auth?token=${token}` });
});

router.get('/zoho-callback', async (req, res) => {
  // Legacy — delegate to new generic callback
  req.params = { ...req.params, provider: 'zoho_people' };
  // Verify state has the right type from either old or new format
  const { state } = req.query;
  if (state) {
    try {
      const d = jwt.verify(state, process.env.JWT_SECRET);
      // Old format: type=zoho_state → rewrite to new format
      if (d.type === 'zoho_state') {
        req.query.state = makeState(d.companyId, 'zoho_people');
      }
    } catch(e) { /* will fail in handler */ }
  }
  // Use the generic callback logic directly
  const { code, error } = req.query;
  if (error) return redirectError(res, 'zoho_people', error);

  let companyId;
  try {
    const d = jwt.verify(req.query.state, process.env.JWT_SECRET);
    companyId = d.companyId;
  } catch(e) { return redirectError(res, 'zoho_people', 'invalid_state'); }

  try {
    const cfg = OAUTH_CONFIGS.zoho_people;
    const params = new URLSearchParams({
      code, client_id: cfg.clientId(), client_secret: cfg.clientSecret(),
      redirect_uri: `${BACKEND_URL}/api/hris/zoho-callback`,
      grant_type: 'authorization_code',
    });
    const r = await axios.post('https://accounts.zoho.com/oauth/v2/token', params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
    if (!r.data.refresh_token) return redirectError(res, 'zoho_people', 'no_refresh_token', r.data);
    const { access_token, refresh_token, expires_in } = r.data;
    await saveConnection(companyId, 'zoho_people', 'Zoho People', {
      api_key: cfg.clientId(), api_secret: cfg.clientSecret(),
      access_token, refresh_token,
      token_expires_at: new Date(Date.now() + (expires_in || 3600) * 1000),
    });
    res.redirect(`${FRONTEND_URL}/company/hris?connected=zoho_people`);
  } catch(err) {
    redirectError(res, 'zoho_people', 'token_exchange', err.response?.data || err.message);
  }
});

module.exports = router;
