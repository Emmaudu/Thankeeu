/**
 * utils/sanitize.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized input sanitization and validation for all Thankeeu auth flows.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Supabase JS client uses parameterized queries via PostgREST, so classic
 * SQL injection through .eq() / .insert() is already blocked at the ORM layer.
 * However, several other attack classes are still possible without this module:
 *
 *   1. Type injection     — req.body fields might be objects/arrays, not strings.
 *                           e.g. {"email": {"$gt": ""}} causes unexpected behaviour
 *                           and can trigger unhandled errors that leak stack traces.
 *
 *   2. XSS via storage    — Names, descriptions, etc. are stored in the DB and
 *                           then reflected in emails (via Resend/HTML templates)
 *                           and in React UIs. Stored XSS: <script> in full_name
 *                           executes in every email client that renders HTML.
 *
 *   3. DoS via long input — bcrypt silently truncates at 72 bytes; argon2 with
 *                           very long inputs causes CPU exhaustion. A 10 MB
 *                           "password" or "name" string can spike server CPU and
 *                           memory without a length cap.
 *
 *   4. Date/type abuse    — date_of_birth passed as arbitrary strings propagates
 *                           into occasionEngine.js date arithmetic causing NaN /
 *                           silent crashes in the cron automation.
 *
 *   5. Missing required   — some login handlers (vendorLogin) had no guard for
 *                           missing email/password, returning unhandled 500s.
 *
 * APPROACH
 * ────────
 * No external dependencies — pure Node.js so the bundle stays lean.
 * All functions are pure (no side effects) and return cleaned values or throw
 * a structured { status, error } object that the controller catches and returns.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure a value is a plain string. Rejects objects, arrays, numbers, booleans.
 * Prevents type-injection attacks where {"email": {"$gt": ""}} is sent as JSON.
 */
const ensureString = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw { status: 400, error: `${fieldName} must be a plain text value` };
  }
  return value;
};

/**
 * Strip dangerous HTML from free-text fields stored in the DB.
 * We remove tags and dangerous protocols but do NOT HTML-encode
 * safe characters like apostrophes, quotes, ampersands — these are
 * plain text values going into a database, not into an HTML page.
 * HTML encoding should happen at render time (React escapes by default,
 * email templates escape at the template layer).
 *
 * We DO strip: HTML tags, javascript: protocol, inline event handlers,
 * null bytes, dangerous control characters.
 * We do NOT encode: & ' " < > — those are valid in names like
 * O'Brien, AT&T, "The Company", <nickname>
 */
const stripHtml = (str) => {
  if (!str) return str;
  return str
    .replace(/\0/g, '')                           // null bytes
    // eslint-disable-next-line no-control-regex
    .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // control chars (keep \t \n \r)
    .replace(/<script[\s\S]*?<\/script>/gi, '')   // script blocks first
    .replace(/<style[\s\S]*?<\/style>/gi, '')     // style blocks
    .replace(/<[^>]+>/g, '')                      // all remaining HTML tags
    .replace(/javascript\s*:/gi, '')              // javascript: protocol
    .replace(/on\w+\s*=/gi, '');                  // inline event handlers (onclick= etc.)
};

/**
 * Validate an email address format.
 * Uses a robust RFC-5321-informed regex — not perfect (no regex is) but catches
 * all realistic attack patterns while allowing valid international addresses.
 */
const EMAIL_REGEX = /^[^\s@"'<>()[\]\\,;:]{1,64}@[^\s@"'<>()[\]\\,;:]{1,255}\.[a-zA-Z]{2,}$/;

const validateEmail = (email, fieldName = 'Email') => {
  if (email === undefined || email === null || email === '') throw { status: 400, error: `${fieldName} is required` };
  // Reject non-strings (arrays, objects) before any coercion
  if (typeof email !== 'string') throw { status: 400, error: `${fieldName} is not a valid email address` };
  // Reject null bytes and control characters outright — a legitimate user's
  // email address will never contain these. Their presence indicates either a
  // malformed client, fuzzing, or an injection attempt. We reject rather than
  // strip so the caller knows the input was invalid (not silently sanitized
  // into a different value than what the user entered).
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(email)) throw { status: 400, error: `${fieldName} is not a valid email address` };
  const clean = email.toLowerCase().trim();
  if (!clean) throw { status: 400, error: `${fieldName} is required` };
  if (clean.length > 320) throw { status: 400, error: `${fieldName} is too long` };
  if (!EMAIL_REGEX.test(clean)) throw { status: 400, error: `${fieldName} is not a valid email address` };
  return clean;
};

/**
 * Validate a password.
 *  - Min 8 chars (standard security baseline)
 *  - Max 72 chars — bcrypt silently truncates here; anything longer gives a
 *    false sense of security AND allows DoS via CPU-heavy hashing of huge inputs.
 *    argon2 doesn't truncate but is still vulnerable to DoS with huge inputs.
 */
const validatePassword = (password, fieldName = 'Password') => {
  if (!password) throw { status: 400, error: `${fieldName} is required` };
  const s = ensureString(password, fieldName);
  if (s.length < 8) throw { status: 400, error: `${fieldName} must be at least 8 characters` };
  // bcrypt silently truncates at 72 BYTES (not characters). Multibyte characters
  // (emoji = 4 bytes each, CJK = 3 bytes each) can exceed 72 bytes while passing
  // a simple character-count check — e.g. 19 emoji = 38 chars but 76 bytes,
  // causing silent truncation and making two different passwords hash identically.
  // We check byte length so this limit holds for all scripts and languages.
  if (Buffer.byteLength(s, 'utf8') > 72) {
    throw { status: 400, error: `${fieldName} is too long (maximum 72 bytes)` };
  }
  return s;
};

/**
 * Sanitize a human name (full name, first name, last name, contact person, etc.)
 * - Type-checks to string
 * - Strips HTML/script content
 * - Enforces reasonable length limits
 * - Allows letters, spaces, hyphens, apostrophes, dots (covers most world names)
 */
const sanitizeName = (value, fieldName = 'Name', { required = true, maxLen = 100 } = {}) => {
  if (!value || !String(value).trim()) {
    if (required) throw { status: 400, error: `${fieldName} is required` };
    return null;
  }
  ensureString(value, fieldName);
  const raw = String(value).trim();
  // Reject inputs that contain HTML tags or event handler patterns outright.
  // We don't silently strip them because that would store a mutated value
  // different from what the user typed (e.g. 'onclick=x Bob' → 'Bob'),
  // which is confusing and could mask abuse. Legitimate names never contain
  // HTML angle brackets or JavaScript event attributes.
  if (/<[^>]+>/.test(raw) || /on\w+\s*=/i.test(raw) || /javascript\s*:/i.test(raw)) {
    throw { status: 400, error: `${fieldName} contains invalid characters` };
  }
  const clean = raw.replace(/\0/g, '').trim();  // only strip null bytes
  if (clean.length > maxLen) throw { status: 400, error: `${fieldName} must be ${maxLen} characters or fewer` };
  if (clean.length < 1) throw { status: 400, error: `${fieldName} cannot be empty` };
  return clean;
};

/**
 * Sanitize a username (alphanumeric + underscore only, no HTML possible).
 */
const sanitizeUsername = (value, fieldName = 'Username', { minLen = 3, maxLen = 30 } = {}) => {
  if (!value) throw { status: 400, error: `${fieldName} is required` };
  ensureString(value, fieldName);
  const clean = value.trim().toLowerCase();
  if (clean.length < minLen) throw { status: 400, error: `${fieldName} must be at least ${minLen} characters` };
  if (clean.length > maxLen) throw { status: 400, error: `${fieldName} must be ${maxLen} characters or fewer` };
  if (!/^[a-zA-Z0-9_]+$/.test(clean))
    throw { status: 400, error: `${fieldName} can only contain letters, numbers and underscores` };
  return clean;
};

/**
 * Sanitize a phone number.
 * Allows digits, spaces, +, -, (, ) — strips everything else.
 * Does NOT validate international format (too complex, too many false positives).
 */
const sanitizePhone = (value) => {
  if (!value) return null;
  ensureString(value, 'Phone');
  const clean = value.replace(/[^\d\s+\-().]/g, '').trim();
  if (clean.length > 30) throw { status: 400, error: 'Phone number is too long' };
  return clean || null;
};

/**
 * Sanitize a free-text field (city, state, industry, description, etc.)
 * Strips HTML tags, enforces length.
 */
const sanitizeText = (value, fieldName = 'Field', { required = false, maxLen = 500 } = {}) => {
  if (!value || !String(value).trim()) {
    if (required) throw { status: 400, error: `${fieldName} is required` };
    return null;
  }
  ensureString(value, fieldName);
  const clean = stripHtml(value).trim();
  if (clean.length > maxLen) throw { status: 400, error: `${fieldName} must be ${maxLen} characters or fewer` };
  return clean || null;
};

/**
 * Validate a date string (YYYY-MM-DD format).
 * Returns null for empty values (date_of_birth is optional).
 * Rejects obviously invalid dates to prevent garbage reaching occasionEngine.js.
 */
/**
 * Validate a date string (YYYY-MM-DD format).
 * Returns null for empty values (date fields are optional).
 * allowFuture=true for resumption_date, promotion_date, leaving_date.
 * allowFuture=false (default) for date_of_birth — must be in the past.
 */
const sanitizeDate = (value, fieldName = 'Date', { allowFuture = false } = {}) => {
  if (!value || !String(value).trim()) return null;
  ensureString(value, fieldName);
  const clean = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean))
    throw { status: 400, error: `${fieldName} must be in YYYY-MM-DD format` };
  const d = new Date(clean);
  if (isNaN(d.getTime()))
    throw { status: 400, error: `${fieldName} is not a valid date` };
  const year = d.getFullYear();
  if (year < 1900)
    throw { status: 400, error: `${fieldName} is out of a valid range` };
  // For date_of_birth: must not be in the future
  if (!allowFuture && year > new Date().getFullYear())
    throw { status: 400, error: `${fieldName} cannot be in the future` };
  // Future dates allowed for resumption/promotion/leaving — just cap at 10 years out
  if (allowFuture && year > new Date().getFullYear() + 10)
    throw { status: 400, error: `${fieldName} is too far in the future` };
  return clean;
};

/**
 * Validate a UUID (company_code, IDs from URL params etc.)
 * Prevents garbage strings from reaching DB queries.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validateUUID = (value, fieldName = 'ID') => {
  if (!value) throw { status: 400, error: `${fieldName} is required` };
  ensureString(value, fieldName);
  const clean = value.trim();
  if (!UUID_REGEX.test(clean)) throw { status: 400, error: `${fieldName} is not a valid code` };
  return clean;
};

/**
 * Validate a URL-safe slug (alphanumeric + hyphens).
 */
const sanitizeSlug = (value, fieldName = 'Slug', { maxLen = 80 } = {}) => {
  if (!value) return null;
  ensureString(value, fieldName);
  const clean = value.replace(/[^a-zA-Z0-9\-_]+/g, '-').replace(/^-|-$/g, '');
  if (clean.length > maxLen) throw { status: 400, error: `${fieldName} is too long` };
  return clean || null;
};

/**
 * Central error handler for sanitization errors thrown above.
 * Call in each controller's catch block (or use the middleware version below).
 *
 * Usage in controller:
 *   } catch (err) {
 *     if (err.status && err.error) return res.status(err.status).json({ error: err.error });
 *     // ... rest of error handling
 *   }
 */
const isSanitizeError = (err) => !!(err && err.status && err.error && typeof err.error === 'string');

module.exports = {
  validateEmail,
  validatePassword,
  sanitizeName,
  sanitizeUsername,
  sanitizePhone,
  sanitizeText,
  sanitizeDate,
  validateUUID,
  sanitizeSlug,
  isSanitizeError,
  stripHtml,   // exported for use in other contexts (e.g. message content)
  ensureString,
};
