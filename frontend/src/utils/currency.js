/**
 * Thankeeu Currency — Multi-currency display with NGN as base
 *
 * All amounts stored in NGN. FLW charges in the selected currency.
 * Exchange rates are approximate display rates — FLW uses live rates at checkout.
 */

import { WORLD_CURRENCIES, flagFor, currencyName } from './worldCurrencies';

const WORLD_BY_CODE = Object.fromEntries(WORLD_CURRENCIES.map(w => [w[0], w]));
const WORLD_CODES = new Set(Object.keys(WORLD_BY_CODE));
/** Country or region label for a currency ("India"). */
export const currencyCountry = (code) => WORLD_BY_CODE[code]?.[1] || '';

// ── Supported display currencies ──────────────────────────────────────────────
export const CURRENCIES = [
  // USD first: it is the platform's display/default currency. NGN remains the
  // storage base (rate 1) — see NGN_BASE below; never rely on array order for that.
  { code: 'USD', symbol: '$',  name: 'US Dollar',         flag: '🇺🇸', rate: 0.00063 }, // ₦1 ≈ $0.00063 until today's rate loads (utils/pricing.js updates every rate here)
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    flag: '🇳🇬', rate: 1      },
  { code: 'GBP', symbol: '£',  name: 'British Pound',     flag: '🇬🇧', rate: 0.00049 },
  { code: 'EUR', symbol: '€',  name: 'Euro',              flag: '🇪🇺', rate: 0.00058 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',   flag: '🇨🇦', rate: 0.00086 },
  { code: 'GHS', symbol: '₵',  name: 'Ghanaian Cedi',     flag: '🇬🇭', rate: 0.0095  },
  { code: 'KES', symbol: 'KSh',name: 'Kenyan Shilling',   flag: '🇰🇪', rate: 0.082   },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand',flag: '🇿🇦', rate: 0.011   },
];

/** Platform-wide display + checkout default. Amounts are still stored in NGN. */
export const DEFAULT_CURRENCY = 'USD';

/** Every currency for the picker: chargeable ones first, then the rest A to Z. */
export const ALL_CURRENCY_CODES = (() => {
  const core = CURRENCIES.map(c => c.code);
  return [...core, ...WORLD_CURRENCIES.map(w => w[0]).filter(c => !core.includes(c)).sort()];
})();

const NGN_BASE = CURRENCIES.find(c => c.code === 'NGN');
const USD_INFO = CURRENCIES.find(c => c.code === 'USD');

// ── Display-only currencies (INR, KRW, JPY, …) ───────────────────────────────
// Every currency Lemon Squeezy can show. These can't be charged directly: the
// customer sees an approximate local price and pays in USD. The local price is
// worked out from the site's USD price with a daily USD rate fetched from the
// backend (/api/payments/fx-rates). Until that rate arrives, or if it can't be
// fetched, these currencies show the USD price instead, never a guessed one.
let usdRates = null;
let ratesPromise = null;

/** Fetch daily USD rates once; resolves true when they are available. */
export function loadFxRates() {
  if (usdRates) return Promise.resolve(true);
  if (!ratesPromise) {
    const base = import.meta.env.VITE_API_URL || '/api';
    ratesPromise = fetch(`${base}/payments/fx-rates`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.rates && typeof d.rates === 'object') { usdRates = d.rates; return true; }
        ratesPromise = null; return false;
      })
      .catch(() => { ratesPromise = null; return false; });
  }
  return ratesPromise;
}

const symbolCache = {};
const symbolFor = (code) => {
  if (symbolCache[code]) return symbolCache[code];
  try {
    const part = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find(p => p.type === 'currency');
    symbolCache[code] = part?.value || code;
  } catch { symbolCache[code] = code; }
  return symbolCache[code];
};

/** Can payments be charged in this currency? Otherwise they are charged in USD. */
export const isChargeableCurrency = (code) => CURRENCIES.some(c => c.code === code);

/** The currency a payment picked in `code` is actually charged in. */
export const chargeCurrencyFor = (code) => (isChargeableCurrency(code) ? code : 'USD');

/** Is a live rate available for a display-only currency? */
export const hasLiveRate = (code) => !!(usdRates && Number(usdRates[code]) > 0);

/**
 * Get currency info by code. Display-only currencies get a rate derived from
 * the site USD price × daily USD rate (null until rates load). Unknown codes
 * fall back to the NGN base, rate 1, as before.
 */
export const getCurrency = (code) => {
  const core = CURRENCIES.find(c => c.code === code);
  if (core) return core;
  if (code && /^[A-Z]{3}$/.test(code) && WORLD_CODES.has(code)) {
    const usdPer = hasLiveRate(code) ? Number(usdRates[code]) : null;
    return {
      code,
      symbol: symbolFor(code),
      name: currencyName(code),
      flag: flagFor(WORLD_BY_CODE[code]?.[2]),
      rate: usdPer ? USD_INFO.rate * usdPer : null,
      displayOnly: true,
    };
  }
  return NGN_BASE;
};

/** Convert NGN amount to display currency (USD when a display rate is missing) */
export const convertFromNGN = (amountNGN, toCurrencyCode) => {
  const currency = getCurrency(toCurrencyCode);
  return amountNGN * (currency.rate || USD_INFO.rate);
};

/** Convert display currency amount back to NGN (treated as USD when a display rate is missing) */
export const convertToNGN = (amount, fromCurrencyCode) => {
  const currency = getCurrency(fromCurrencyCode);
  return Math.round(amount / (currency.rate || USD_INFO.rate));
};

/** Format an amount in the given currency */
export const formatCurrency = (amountNGN, currencyCode = 'NGN') => {
  const currency = getCurrency(currencyCode);
  const converted = convertFromNGN(amountNGN, currencyCode);
  const symbol    = currency.symbol;

  if (currencyCode === 'NGN') {
    const n = Math.round(amountNGN);
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₦${n.toLocaleString('en-NG')}`;
    return `₦${n}`;
  }

  // Display-only currency (INR, KRW, …): Intl knows its symbol and decimals.
  // No rate yet → show the USD price rather than a made-up local one.
  if (currency.displayOnly) {
    if (!currency.rate) return formatCurrency(amountNGN, 'USD');
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' })
        .format(converted);
    } catch { return `${currencyCode} ${Math.round(converted).toLocaleString('en-US')}`; }
  }

  // Other currencies — money always has 0 or 2 decimals (never "$15.9").
  // >= 100 → whole units with separators; below that → cents, dropping ".00".
  if (converted >= 100) return `${symbol}${Math.round(converted).toLocaleString('en-US')}`;
  const cents = Math.round(converted * 100);
  if (cents % 100 === 0) return `${symbol}${cents / 100}`;
  return `${symbol}${(cents / 100).toFixed(2)}`;
};

/** Format an NGN-stored amount as its US-dollar equivalent, e.g. 5000 → "$3.15". */
export const formatUSD = (amountNGN) => formatCurrency(amountNGN, 'USD');

/** Format NGN (legacy — used throughout app, always shows ₦) */
export const formatNGN = (amount) => formatCurrency(amount, 'NGN');

/** Flutterwave-supported currencies for payment. Must match the backend's
 *  CARD_FEE_CURRENCIES — CAD was missing here, so Canadians who chose CAD for a
 *  gift were silently charged in NGN (often declined by Canadian banks). */
export const FLW_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'GHS', 'KES', 'ZAR'];

/** Get the FLW amount and currency for a given NGN base amount + selected currency */
export const getFLWPaymentParams = (amountNGN, selectedCurrency = 'NGN') => {
  if (selectedCurrency === 'NGN') {
    return { amount: amountNGN, currency: 'NGN' };
  }
  // Display-only currencies (INR, KRW, …) are charged in USD.
  if (!FLW_CURRENCIES.includes(selectedCurrency)) selectedCurrency = 'USD';
  const converted = convertFromNGN(amountNGN, selectedCurrency);
  const flwCurrency = selectedCurrency;
  // Round appropriately
  const rounded = selectedCurrency === 'NGN' ? Math.round(converted)
    : converted < 1 ? parseFloat(converted.toFixed(4))
    : parseFloat(converted.toFixed(2));
  return { amount: rounded, currency: flwCurrency };
};

export const toKobo = (ngn) => Math.round(ngn * 100);
