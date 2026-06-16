/**
 * utils/paramGuard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * URL parameter hardening for Thankeeu's Express backend.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Even though Supabase JS uses parameterized queries (blocking SQL injection),
 * URL/query parameters are still attack surfaces for:
 *
 *   1. IDOR via ID guessing — attackers iterate UUIDs or slugs to reach data
 *      belonging to other users. Ownership checks in controllers are the real
 *      fix, but format validation (UUID, slug) at the param layer stops garbage
 *      values from ever touching the DB.
 *
 *   2. Parameter pollution — ?tx_ref[]=a&tx_ref[]=b causes req.query.tx_ref to
 *      be an Array in Express. Passing an Array to supabase .eq() produces
 *      unexpected SQL (IN-clause style or type error) and can bypass exact-match
 *      logic in payment verification flows.
 *
 *   3. Info leakage via error messages — Supabase internal errors (containing
 *      table names, column names, constraint names, even partial connection
 *      strings in some cases) are surfaced verbatim as err.message. Replacing
 *      these with generic client-safe messages prevents reconnaissance.
 *
 *   4. Enumeration via slug/ID format — malformed slugs still hit the DB,
 *      wasting resources and potentially returning timing-based information.
 *
 *   5. Open redirect via reflected provider name — OAuth provider params are
 *      reflected in redirect URLs; must be allowlisted.
 *
 *   6. Overlong inputs — params with no length cap can cause memory pressure,
 *      slow regex evaluation (ReDoS), or abnormal Supabase behaviour.
 *
 * USAGE
 * ─────
 * As middleware on individual routes:
 *   router.get('/:id', validateUUIDParam('id'), handler)
 *   router.get('/:slug', validateSlugParam('slug'), handler)
 *
 * As a helper inside a controller:
 *   const txRef = safeQueryString(req.query.tx_ref, 'tx_ref');
 *   if (!txRef) return res.status(400).json({ error: 'Invalid tx_ref' });
 *
 * As a safe error wrapper:
 *   } catch (err) { return safeError(res, err, 'Failed to process payment'); }
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const UUID_RE   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Slugs: alphanumeric (upper+lower) + hyphens + underscores, max 120 chars.
// Must start with alphanumeric. nanoid's default alphabet includes A-Za-z0-9_-
// so card slugs like "amaka-birthday-Yz3k9X" are valid and must be allowed.
const SLUG_RE   = /^[a-zA-Z0-9][a-zA-Z0-9\-_]{0,119}$/;
// Transaction references: alphanumeric + safe punctuation, max 200 chars
const TX_REF_RE = /^[a-zA-Z0-9_\-.:]{1,200}$/;
// HRIS provider names: strict allowlist checked separately
const KNOWN_PROVIDERS = new Set([
  // OAuth providers (redirect flow)
  'zoho_people', 'bamboohr', 'rippling', 'gusto', 'deel',
  // API-key providers (credentials form — also use /:provider routes in hris.js)
  'seamless_hr', 'workpay', 'hibob', 'personio', 'adp', 'sap', 'oracle',
]);

// ── Middleware factories ───────────────────────────────────────────────────────

/**
 * Express middleware: validates that req.params[param] is a well-formed UUID.
 * Returns 400 immediately for anything that isn't — no DB hit.
 *
 * Usage: router.delete('/:id', validateUUIDParam('id'), handler)
 */
const validateUUIDParam = (param = 'id') => (req, res, next) => {
  const val = req.params[param];
  if (!val || !UUID_RE.test(val)) {
    return res.status(400).json({ error: `Invalid ${param} format` });
  }
  next();
};

/**
 * Express middleware: validates that req.params[param] is a safe slug.
 * Slugs are lowercase alphanumeric + hyphens/underscores, max 120 chars.
 *
 * Usage: router.get('/:slug', validateSlugParam('slug'), handler)
 */
const validateSlugParam = (param = 'slug') => (req, res, next) => {
  const val = req.params[param];
  if (!val || !SLUG_RE.test(val)) {
    return res.status(400).json({ error: `Invalid ${param}` });
  }
  next();
};

/**
 * Express middleware: validates that req.params.provider is a known HRIS provider.
 * Prevents unknown strings from being reflected in error messages or redirect URLs.
 *
 * Usage: router.get('/:provider/callback', validateProvider, handler)
 */
const validateProvider = (req, res, next) => {
  const { provider } = req.params;
  if (!provider || !KNOWN_PROVIDERS.has(provider)) {
    return res.status(404).json({ error: 'Unknown provider' });
  }
  next();
};

/**
 * Safely extract a string from req.query or req.params, preventing:
 *  - Parameter pollution (array values: ?tx_ref=a&tx_ref=b → req.query.tx_ref is ['a','b'])
 *  - Overlong strings (max 200 chars by default, configurable)
 *  - Non-string types
 *
 * Returns the clean string, or null if invalid.
 *
 * Usage:
 *   const txRef = safeQueryString(req.query.tx_ref, 'tx_ref');
 *   const plan  = safeQueryString(req.query.plan, 'plan', { maxLen: 20 });
 */
const safeQueryString = (value, fieldName = 'param', { maxLen = 200, pattern = null } = {}) => {
  // Array pollution: ?field=a&field=b
  if (Array.isArray(value)) return null;
  // Must be a string
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) return null;
  if (pattern && !pattern.test(trimmed)) return null;
  return trimmed;
};

/**
 * Safely extract a transaction reference from query/params.
 * Returns null if invalid or looks like param pollution.
 */
const safeTxRef = (value) => safeQueryString(value, 'tx_ref', { maxLen: 200, pattern: TX_REF_RE });

/**
 * Safely extract a UUID from params (alternative to middleware, for use inside controllers).
 * Returns null if invalid.
 */
const safeUUID = (value) => {
  if (!value || typeof value !== 'string') return null;
  const clean = value.trim();
  return UUID_RE.test(clean) ? clean : null;
};

// ── Error sanitization ────────────────────────────────────────────────────────

/**
 * Internal error categories that should NEVER be exposed to clients verbatim.
 * Supabase/Postgres error messages can contain:
 *  - Table names ("relation "users" does not exist")
 *  - Column names ("column "password_hash" of relation "users"")
 *  - Constraint names ("duplicate key value violates unique constraint "users_email_key"")
 *  - Connection strings (in misconfigured environments)
 *  - Query fragments
 *
 * This function returns a safe client-facing message while logging the real
 * error server-side for debugging.
 */
const safeError = (res, err, clientMessage = 'An error occurred. Please try again.', statusCode = 500) => {
  // Log the real error server-side (Railway logs, not visible to attacker)
  console.error('[safeError]', err?.message || err);

  // Detect Supabase/Postgres error codes and give specific but safe messages
  const code = err?.code || err?.details?.code;
  if (code === '23505') return res.status(409).json({ error: 'This record already exists.' });
  if (code === '23503') return res.status(400).json({ error: 'Related record not found.' });
  if (code === '23502') return res.status(400).json({ error: 'A required field is missing.' });
  if (code === '42P01') return res.status(500).json({ error: 'Service temporarily unavailable.' }); // table not found
  if (code === 'PGRST116') return res.status(404).json({ error: 'Record not found.' }); // Supabase "no rows"
  if (code === 'PGRST301') return res.status(429).json({ error: 'Too many requests. Please slow down.' });

  // For auth errors, don't reveal whether it was the email or password
  if (clientMessage.toLowerCase().includes('login') || clientMessage.toLowerCase().includes('auth')) {
    return res.status(statusCode).json({ error: clientMessage });
  }

  // All other errors: return the safe client message, never err.message
  return res.status(statusCode).json({ error: clientMessage });
};

/**
 * Middleware to add security headers that protect against common URL-based attacks.
 * Apply globally in server.js after your existing helmet() middleware.
 */
const securityHeaders = (req, res, next) => {
  // Prevent browsers from MIME-sniffing (e.g. a JSON response treated as HTML → XSS)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Stop browsers from rendering this in a frame (clickjacking)
  res.setHeader('X-Frame-Options', 'DENY');
  // Disable referrer on cross-origin requests (prevents leaking card slugs/tokens)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Prevent caching of authenticated API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
};

/**
 * Rate limiter factory — creates targeted limiters for specific sensitive endpoints.
 * Import and use these in server.js alongside the existing general/auth limiters.
 *
 * Requires: express-rate-limit (already in package.json)
 */
const makeRateLimiter = (options) => {
  try {
    const rateLimit = require('express-rate-limit');
    return rateLimit({
      standardHeaders: true,
      legacyHeaders:   false,
      ...options,
    });
  } catch {
    // If express-rate-limit isn't available, return a no-op middleware
    return (req, res, next) => next();
  }
};

// Dedicated limiters for endpoints not covered by authLimiter
const publicCardLimiter = makeRateLimiter({
  windowMs: 60 * 1000,        // 1 minute
  max: 30,                    // 30 card fetches/min per IP — enough for normal browsing
  message: { error: 'Too many requests. Please slow down.' },
  skip: (req) => !!req.user || !!req.member || !!req.company, // authenticated users skip
});

const paymentVerifyLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // 20 payment verifications/15min — more than enough for retries
  message: { error: 'Too many payment verification attempts. Please wait a few minutes.' },
});

const bankVerifyLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 30,                    // 30 account lookups/hour — reasonable for adding bank accounts
  message: { error: 'Too many account verification requests. Please wait before trying again.' },
});

const signCardLimiter = makeRateLimiter({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,                     // 5 message submissions/min per IP — stops automated signing spam
  message: { error: 'Too many submissions. Please wait a moment.' },
  // Key by IP + the full path (which includes the card slug) so the limit
  // is per-card, not per-IP across all cards. req.path is available at
  // middleware level; req.params is not (params are parsed per-route).
  keyGenerator: (req) => req.ip + ':' + req.path,
  // Only apply to POST requests (signing) — not GET (viewing)
  skip: (req) => req.method !== 'POST',
});

module.exports = {
  // Middleware
  validateUUIDParam,
  validateSlugParam,
  validateProvider,
  securityHeaders,
  // Limiters (apply in server.js or on specific routes)
  publicCardLimiter,
  paymentVerifyLimiter,
  bankVerifyLimiter,
  signCardLimiter,
  // Helpers for use inside controllers
  safeQueryString,
  safeTxRef,
  safeUUID,
  safeError,
  // Constants (exported so they can be extended)
  UUID_RE,
  SLUG_RE,
  KNOWN_PROVIDERS,
};
