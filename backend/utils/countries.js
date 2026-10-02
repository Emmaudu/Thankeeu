// ═══════════════════════════════════════════════════════════════════════
// Markets Taskeeu operates in.
//
// Nigeria is the original market and keeps the root routes. Every other
// market has its own URL prefix (slug), currency and payment provider.
// A task belongs to one country; only taskers of that country may bid on it.
// ═══════════════════════════════════════════════════════════════════════

const COUNTRIES = {
  NG: { code: 'NG', slug: null,          name: 'Nigeria',        currency: 'NGN', locale: 'en-NG', provider: 'flutterwave', fundMin: 100, tipMin: 100, tipMax: 5000000, advanceMin: 100, withdrawMin: 100 },
  US: { code: 'US', slug: 'us',          name: 'United States',  currency: 'USD', locale: 'en-US', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
  GB: { code: 'GB', slug: 'uk',          name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
  IE: { code: 'IE', slug: 'ireland',     name: 'Ireland',        currency: 'EUR', locale: 'en-IE', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
  AU: { code: 'AU', slug: 'australia',   name: 'Australia',      currency: 'AUD', locale: 'en-AU', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
  NZ: { code: 'NZ', slug: 'new-zealand', name: 'New Zealand',    currency: 'NZD', locale: 'en-NZ', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
  CA: { code: 'CA', slug: 'canada',      name: 'Canada',         currency: 'CAD', locale: 'en-CA', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
  SG: { code: 'SG', slug: 'singapore',   name: 'Singapore',      currency: 'SGD', locale: 'en-SG', provider: 'rapyd', fundMin: 5, tipMin: 2, tipMax: 10000, advanceMin: 5, withdrawMin: 5 },
};

const DEFAULT_COUNTRY = 'NG';
const CODES = Object.keys(COUNTRIES);

/** 'us' | 'US' | 'uk' | 'GB' | null → country object (Nigeria for anything unknown). */
function getCountry(input) {
  if (!input) return COUNTRIES[DEFAULT_COUNTRY];
  const s = String(input).trim();
  const up = s.toUpperCase();
  if (COUNTRIES[up]) return COUNTRIES[up];
  const low = s.toLowerCase();
  if (low === 'nigeria' || low === 'ng') return COUNTRIES.NG;
  return Object.values(COUNTRIES).find((c) => c.slug === low) || COUNTRIES[DEFAULT_COUNTRY];
}

/** Strict: returns the code or null when the input is not a known market. */
function parseCountry(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (COUNTRIES[s.toUpperCase()]) return s.toUpperCase();
  const low = s.toLowerCase();
  if (low === 'nigeria') return 'NG';
  const hit = Object.values(COUNTRIES).find((c) => c.slug === low);
  return hit ? hit.code : null;
}

const isInternational = (code) => getCountry(code).provider === 'rapyd';

/** URL prefix for links ('' for Nigeria, '/us' for the US ...). */
const pathPrefix = (code) => {
  const c = getCountry(code);
  return c.slug ? `/${c.slug}` : '';
};

const CURRENCY_SYMBOL = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', AUD: 'A$', NZD: 'NZ$', CAD: 'C$', SGD: 'S$' };

/**
 * Money for messages. Naira keeps the exact format used everywhere before
 * the expansion (₦12,500); other currencies get two decimals when needed.
 */
function money(amount, currency = 'NGN') {
  const n = Number(amount || 0);
  const cur = String(currency || 'NGN').toUpperCase();
  if (cur === 'NGN') return `₦${n.toLocaleString()}`;
  const sym = CURRENCY_SYMBOL[cur] || `${cur} `;
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return `${sym}${n.toLocaleString('en-US', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

const currencyOf = (code) => getCountry(code).currency;
/** Market that uses a currency (each market has its own). Unknown → Nigeria. */
const countryByCurrency = (cur) => Object.values(COUNTRIES).find((c) => c.currency === String(cur || '').toUpperCase()) || COUNTRIES[DEFAULT_COUNTRY];

// Bank details taskers give for payouts in each market (stored in
// tasker_profiles.payout_details). Patterns are checked after removing spaces
// and dashes.
const BANK_FIELDS = {
  US: [
    { key: 'account_holder', label: 'Account holder name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'routing_number', label: 'Routing number (ABA)', pattern: /^\d{9}$/, hint: '9 digits' },
    { key: 'account_number', label: 'Account number', pattern: /^\d{4,17}$/, hint: '4 to 17 digits' },
  ],
  GB: [
    { key: 'account_holder', label: 'Account holder name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'sort_code', label: 'Sort code', pattern: /^\d{6}$/, hint: '6 digits' },
    { key: 'account_number', label: 'Account number', pattern: /^\d{8}$/, hint: '8 digits' },
  ],
  IE: [
    { key: 'account_holder', label: 'Account holder name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'iban', label: 'IBAN', pattern: /^IE\d{2}[A-Z]{4}\d{14}$/i, hint: 'starts with IE, 22 characters' },
    { key: 'bic', label: 'BIC', pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i, hint: '8 or 11 characters', optional: true },
  ],
  AU: [
    { key: 'account_holder', label: 'Account name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'bsb', label: 'BSB', pattern: /^\d{6}$/, hint: '6 digits' },
    { key: 'account_number', label: 'Account number', pattern: /^\d{5,10}$/, hint: '5 to 10 digits' },
  ],
  NZ: [
    { key: 'account_holder', label: 'Account name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'account_number', label: 'Account number', pattern: /^\d{15,16}$/, hint: 'bank, branch, account and suffix, 15 or 16 digits' },
  ],
  CA: [
    { key: 'account_holder', label: 'Account holder name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'institution_number', label: 'Institution number', pattern: /^\d{3}$/, hint: '3 digits' },
    { key: 'transit_number', label: 'Transit number', pattern: /^\d{5}$/, hint: '5 digits' },
    { key: 'account_number', label: 'Account number', pattern: /^\d{7,12}$/, hint: '7 to 12 digits' },
  ],
  SG: [
    { key: 'account_holder', label: 'Account holder name' },
    { key: 'bank_name', label: 'Bank name' },
    { key: 'account_number', label: 'Account number', pattern: /^\d{7,14}$/, hint: '7 to 14 digits' },
  ],
};

/** Validate and clean payout details for a market. */
function validatePayoutDetails(code, input) {
  const fields = BANK_FIELDS[getCountry(code).code];
  if (!fields) return { ok: false, errors: ['Bank details are not collected here for this country.'] };
  const clean = { country: getCountry(code).code };
  const errors = [];
  for (const f of fields) {
    let v = String(input?.[f.key] ?? '').trim();
    if (f.pattern) v = v.replace(/[\s-]/g, '').toUpperCase();
    else v = v.replace(/\s+/g, ' ').slice(0, 120);
    if (!v) { if (!f.optional) errors.push(`${f.label} is required.`); continue; }
    if (f.pattern && !f.pattern.test(v)) { errors.push(`${f.label} must be ${f.hint}.`); continue; }
    clean[f.key] = v;
  }
  return { ok: errors.length === 0, errors, clean };
}

/** True when stored payout details are complete for the market they were saved for. */
const payoutDetailsComplete = (details) => !!details?.country && validatePayoutDetails(details.country, details).ok;

module.exports = { BANK_FIELDS, validatePayoutDetails, payoutDetailsComplete, COUNTRIES, CODES, DEFAULT_COUNTRY, getCountry, parseCountry, isInternational, pathPrefix, money, currencyOf, countryByCurrency, CURRENCY_SYMBOL };
