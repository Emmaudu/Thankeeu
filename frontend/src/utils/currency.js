/**
 * Thankeeu Currency — Nigerian Naira (₦)
 * All amounts stored in NGN. Paystack processes in kobo (NGN × 100).
 */

/** Format an NGN amount for display: ₦5,000 / ₦1.2M */
export const formatNGN = (amount) => {
  if (!amount || isNaN(amount)) return '₦0';
  const n = Number(amount);
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)    return `₦${n.toLocaleString('en-NG')}`;
  return `₦${n}`;
};

/** Alias used by pages that still call formatUSD — returns Naira string */
export const formatUSD = formatNGN;

/** Convert NGN → kobo for Paystack */
export const toKobo = (ngn) => Math.round(ngn * 100);

/** No-op aliases for backward compatibility */
export const usdToNgn    = (x) => x;
export const ngnToUsd    = (x) => x;
export const formatUSDDirect = formatNGN;
export const NGN_PER_USD = 1;
