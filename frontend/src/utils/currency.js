/**
 * Thankeeu Currency Utility
 * The backend stores all amounts in NGN and processes payments via Paystack in kobo.
 * The frontend shows amounts in USD for a global audience.
 *
 * Exchange rate: 1 USD ≈ 1,600 NGN (approximate 2025 mid-market rate)
 * This is for display purposes. Paystack handles actual FX at checkout.
 */

export const NGN_PER_USD = 1600;

/**
 * Format a stored NGN amount as a USD display string.
 * e.g.  8000 NGN → "$5"
 *       16000 NGN → "$10"
 *       80000 NGN → "$50"
 */
export const formatUSD = (ngnAmount) => {
  if (!ngnAmount || isNaN(ngnAmount)) return '$0';
  const usd = ngnAmount / NGN_PER_USD;
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`;
  if (usd < 1) return `$${usd.toFixed(2)}`;
  return `$${Math.round(usd).toLocaleString()}`;
};

/**
 * Convert a USD amount to NGN for sending to the backend.
 * e.g.  5 USD → 8000 NGN
 */
export const usdToNgn = (usdAmount) => Math.round(usdAmount * NGN_PER_USD);

/**
 * Convert NGN to USD number (unformatted).
 */
export const ngnToUsd = (ngnAmount) => Math.round(ngnAmount / NGN_PER_USD);

/**
 * Format a USD number as a display string without converting (amount already in USD).
 */
export const formatUSDDirect = (usdAmount) => {
  if (!usdAmount || isNaN(usdAmount)) return '$0';
  if (usdAmount >= 1000) return `$${(usdAmount / 1000).toFixed(1)}k`;
  return `$${usdAmount.toLocaleString()}`;
};
