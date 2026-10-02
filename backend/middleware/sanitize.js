/**
 * Input sanitization & security middleware
 * Applied globally to prevent XSS, injection, and info leakage
 */
const xss = require('xss');

// ─── Sanitize a single value recursively ─────────────────────────
function sanitizeValue(value) {
  // Raw request bodies (e.g. the Flutterwave webhook, kept as a Buffer for
  // signature checks) must pass through untouched. Treating a Buffer as a
  // plain object turned it into {"0":123,"1":34,...} capped at 50 keys, so
  // every payment webhook was silently ignored.
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') {
    // 1. Strip XSS patterns
    // 2. Trim whitespace
    // 3. Cap field length at 10000 chars to prevent huge payloads
    return xss(value.trim()).slice(0, 10000);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 100).map(sanitizeValue); // max 100 array items
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    const keys = Object.keys(value).slice(0, 50); // max 50 keys
    for (const key of keys) {
      // Sanitize key itself (no prototype pollution)
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      cleaned[sanitizeValue(key)] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value; // numbers, booleans pass through
}

// ─── Sanitize req.body ───────────────────────────────────────────
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// ─── Sanitize req.query and req.params ──────────────────────────
const sanitizeQuery = (req, res, next) => {
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

// ─── Safe error response (never leak internals) ──────────────────
const SAFE_ERRORS = {
  400: 'Invalid request data',
  401: 'Authentication required',
  403: 'Access denied',
  404: 'Resource not found',
  409: 'Conflict with existing data',
  429: 'Too many requests',
  500: 'Something went wrong. Please try again.',
};

/**
 * Send a safe error response that never leaks stack traces,
 * DB errors, or file paths in production.
 */
function safeError(res, status, userMessage, internalErr = null) {
  // Always log internally
  if (internalErr) {
    console.error(`[${status}] ${userMessage}:`, internalErr?.message || internalErr);
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    success: false,
    message: isProd ? (SAFE_ERRORS[status] || userMessage) : userMessage,
  });
}

// ─── Bcrypt 72-byte password limit protection ────────────────────
// bcrypt silently truncates passwords longer than 72 bytes
function checkPasswordLength(req, res, next) {
  const { password, new_password } = req.body;
  const pw = password || new_password;
  if (pw && Buffer.byteLength(pw, 'utf8') > 72) {
    return res.status(400).json({
      success: false,
      message: 'Password must be 72 characters or fewer',
    });
  }
  next();
}

// ─── Remove sensitive fields from responses ──────────────────────
// Middleware that strips password_hash from any JSON response
const removeSensitiveFields = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (data && typeof data === 'object') {
      data = stripSensitive(data);
    }
    return originalJson(data);
  };
  next();
};

function stripSensitive(obj) {
  if (Array.isArray(obj)) return obj.map(stripSensitive);
  if (obj !== null && typeof obj === 'object') {
    const cleaned = { ...obj };
    delete cleaned.password_hash;
    delete cleaned.password;
    delete cleaned.jwt_secret;
    delete cleaned.secret;
    for (const key of Object.keys(cleaned)) {
      if (cleaned[key] && typeof cleaned[key] === 'object') {
        cleaned[key] = stripSensitive(cleaned[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  safeError,
  checkPasswordLength,
  removeSensitiveFields,
  sanitizeValue,
};
