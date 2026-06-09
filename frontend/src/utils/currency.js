/**
 * Thankeeu Currency — Nigerian Naira (₦)
 * All amounts stored in NGN. Flutterwave processes in Naira.
 */

/** Format an NGN amount for display: ₦5,000 / ₦1.2M */
export const formatNGN = (amount) => {
  if (!amount || isNaN(amount)) return '₦0';
  const n = Number(amount);
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)    return `₦${n.toLocaleString('en-NG')}`;
  return `₦${n}`;
};

/** NGN format helper */
export const toKobo = (ngn) => Math.round(ngn * 100);
