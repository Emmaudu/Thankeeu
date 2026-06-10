/**
 * Thankeeu Currency — Multi-currency display with NGN as base
 *
 * All amounts stored in NGN. FLW charges in the selected currency.
 * Exchange rates are approximate display rates — FLW uses live rates at checkout.
 */

// ── Supported display currencies ──────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    flag: '🇳🇬', rate: 1      },
  { code: 'USD', symbol: '$',  name: 'US Dollar',         flag: '🇺🇸', rate: 0.00063 }, // ₦1 ≈ $0.00063
  { code: 'GBP', symbol: '£',  name: 'British Pound',     flag: '🇬🇧', rate: 0.00049 },
  { code: 'EUR', symbol: '€',  name: 'Euro',              flag: '🇪🇺', rate: 0.00058 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',   flag: '🇨🇦', rate: 0.00086 },
  { code: 'GHS', symbol: '₵',  name: 'Ghanaian Cedi',     flag: '🇬🇭', rate: 0.0095  },
  { code: 'KES', symbol: 'KSh',name: 'Kenyan Shilling',   flag: '🇰🇪', rate: 0.082   },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand',flag: '🇿🇦', rate: 0.011   },
];

/** Get currency info by code */
export const getCurrency = (code) =>
  CURRENCIES.find(c => c.code === code) || CURRENCIES[0];

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

  // For other currencies — show 2 decimal places if < 100, else whole number
  if (converted >= 100)  return `${symbol}${Math.round(converted).toLocaleString()}`;
  if (converted >= 10)   return `${symbol}${converted.toFixed(1)}`;
  return `${symbol}${converted.toFixed(2)}`;
};

/** Format NGN (legacy — used throughout app, always shows ₦) */
export const formatNGN = (amount) => formatCurrency(amount, 'NGN');

/** Flutterwave-supported currencies for payment */
export const FLW_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

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
