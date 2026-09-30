/**
 * Thankeeu Currency — Multi-currency display with NGN as base
 *
 * All amounts stored in NGN. FLW charges in the selected currency.
 * Exchange rates are approximate display rates — FLW uses live rates at checkout.
 */

// ── Supported display currencies ──────────────────────────────────────────────
export const CURRENCIES = [
  // USD first: it is the platform's display/default currency. NGN remains the
  // storage base (rate 1) — see NGN_BASE below; never rely on array order for that.
  { code: 'USD', symbol: '$',  name: 'US Dollar',         flag: '🇺🇸', rate: 0.00063 }, // ₦1 ≈ $0.00063 — keep in sync with backend utils/cardPayment.js CARD_FEE_FX
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

const NGN_BASE = CURRENCIES.find(c => c.code === 'NGN');

/** Get currency info by code (unknown codes fall back to the NGN base, rate 1) */
export const getCurrency = (code) =>
  CURRENCIES.find(c => c.code === code) || NGN_BASE;

/** Convert NGN amount to display currency */
export const convertFromNGN = (amountNGN, toCurrencyCode) => {
  const currency = getCurrency(toCurrencyCode);
  return amountNGN * currency.rate;
};

/** Convert display currency amount back to NGN */
export const convertToNGN = (amount, fromCurrencyCode) => {
  const currency = getCurrency(fromCurrencyCode);
  return Math.round(amount / currency.rate);
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
  const converted = convertFromNGN(amountNGN, selectedCurrency);
  const flwCurrency = FLW_CURRENCIES.includes(selectedCurrency) ? selectedCurrency : 'NGN';
  if (flwCurrency !== selectedCurrency) {
    // Currency not supported by FLW — fall back to NGN
    return { amount: amountNGN, currency: 'NGN' };
  }
  // Round appropriately
  const rounded = selectedCurrency === 'NGN' ? Math.round(converted)
    : converted < 1 ? parseFloat(converted.toFixed(4))
    : parseFloat(converted.toFixed(2));
  return { amount: rounded, currency: flwCurrency };
};

export const toKobo = (ngn) => Math.round(ngn * 100);
