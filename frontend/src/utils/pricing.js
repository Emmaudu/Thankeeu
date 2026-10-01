/**
 * pricing.js — live prices for the whole site.
 *
 * The admin sets prices in US dollars (Admin → Currency). The backend serves
 * them with today's exchange rates at /api/payments/pricing. This module:
 *   • holds that snapshot (starting from the long-standing defaults, so the
 *     first paint shows the usual prices even before the request returns);
 *   • updates the chargeable currencies' rates in utils/currency.js so every
 *     formatCurrency() call uses today's rates, exactly as the backend does;
 *   • lets components re-render when prices arrive (usePricing()).
 *
 * Amounts stay in NGN internally (as everywhere else on the site):
 *   priceNGN('card_fee') → the exact NGN value of the USD price;
 *   formatPrice(ngn, cur) → shows it; naira is rounded to the nearest ₦100,
 *   which is also what the backend charges.
 */
import { useSyncExternalStore } from 'react';
import { CURRENCIES, formatCurrency } from './currency';

const DEFAULT_USD = {
  card_fee: 3.15, standard: 5.67, pack5: 12.60, pack10: 25.20,
  pack25: 63.00, pack50: 126.00, pack70: 176.40, pack100: 252.00,
};
const CREDITS = { card_fee: 1, standard: 2, pack5: 5, pack10: 10, pack25: 25, pack50: 50, pack70: 70, pack100: 100 };

// Plan ids used across the site → pricing product keys.
const PLAN_TO_PRODUCT = { single: 'card_fee', classic: 'card_fee', card_fee: 'card_fee' };
const productFor = (id) => PLAN_TO_PRODUCT[id] || id;

const USD_INFO = CURRENCIES.find(c => c.code === 'USD');
let state = {
  usd: { ...DEFAULT_USD },
  ngnPerUsd: 1 / USD_INFO.rate,       // 1587.30 with the long-standing rate
  version: 0,
};
const listeners = new Set();
const emit = () => { state = { ...state, version: state.version + 1 }; listeners.forEach(l => l()); };

let loading = null;
/** Fetch prices and rates once (retried on the next call after a failure). */
export function loadPricing() {
  if (loading) return loading;
  const base = import.meta.env.VITE_API_URL || '/api';
  loading = fetch(`${base}/payments/pricing`)
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (!d?.products || !(Number(d.ngn_per_usd) > 0)) { loading = null; return false; }
      const usd = { ...DEFAULT_USD };
      for (const [k, p] of Object.entries(d.products)) if (Number(p?.usd) > 0) usd[k] = Number(p.usd);
      // Same NGN → currency rates the backend charges with.
      const rates = d.usd_rates || {};
      const ngn = Number(rates.NGN) || Number(d.ngn_per_usd);
      for (const c of CURRENCIES) {
        if (c.code === 'NGN') continue;
        const perUsd = Number(rates[c.code]);
        if (perUsd > 0 && ngn > 0) c.rate = perUsd / ngn;
      }
      state = { ...state, usd, ngnPerUsd: ngn };
      emit();
      return true;
    })
    .catch(() => { loading = null; return false; });
  return loading;
}

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/** USD price of a product or plan id ('card_fee', 'single', 'pack5', …). */
export const priceUSD = (id) => state.usd[productFor(id)] ?? DEFAULT_USD[productFor(id)];

/** Exact NGN value of a product's price (round it only for display/charge). */
export const priceNGN = (id) => round2(priceUSD(id) * state.ngnPerUsd);

/** NGN value of the single card fee. */
export const cardFeeNGN = () => priceNGN('card_fee');

/** Credits in a plan. */
export const planCredits = (id) => CREDITS[productFor(id)] || 1;

/** Naira prices are shown (and charged) to the nearest ₦100. */
export const roundNairaPrice = (ngn) => Math.max(0, Math.round(Number(ngn) / 100) * 100);

/** Show a price: naira to the nearest ₦100 (what is charged), others as usual. */
export const formatPrice = (ngn, currency = 'NGN') => (
  currency === 'NGN' ? formatCurrency(roundNairaPrice(ngn), 'NGN') : formatCurrency(ngn, currency)
);

/** "$3.15" in USD, formatted like the rest of the site. */
export const usdLabel = (id) => {
  const v = priceUSD(id);
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
};

/**
 * Give a plan object live price fields (read at render time):
 *   priceNGN, perCardNGN, savingsNGN (vs buying single cards), priceUSD.
 * Any static values with those names are replaced. The plan needs an `id`
 * ('single'/'classic', 'standard', 'pack5', …).
 */
export function livePlan(plan) {
  const id = plan.id;
  const p = { ...plan };
  delete p.priceNGN; delete p.perCardNGN; delete p.savingsNGN; delete p.ngn;
  Object.defineProperties(p, {
    priceNGN:   { enumerable: true, get: () => priceNGN(id) },
    ngn:        { enumerable: true, get: () => priceNGN(id) },
    priceUSD:   { enumerable: true, get: () => priceUSD(id) },
    perCardNGN: { enumerable: true, get: () => priceNGN(id) / planCredits(id) },
    savingsNGN: { enumerable: true, get: () => Math.max(0, cardFeeNGN() * planCredits(id) - priceNGN(id)) },
  });
  return p;
}

/**
 * Marketing copy across the site was written with the launch prices
 * ("$3.15", "$12.60", "about £2.45"). This swaps them for today's prices so
 * that text stays true after the admin changes a price. With unchanged
 * prices the text is returned exactly as written.
 */
export function livePriceText(text) {
  if (typeof text !== 'string' || !/\$3\.15|\$12\.60|\$5\.67|£2\.45/.test(text)) return text;
  return text
    // Function replacers: a "$" in the new price must not be read as a pattern.
    .replace(/\$3\.15/g, () => usdLabel('card_fee'))
    .replace(/\$12\.60/g, () => usdLabel('pack5'))
    .replace(/\$5\.67/g, () => usdLabel('standard'))
    .replace(/£2\.45/g, () => formatPrice(cardFeeNGN(), 'GBP'));
}

// Keep prices current in a tab left open (admin changes, daily rates): refresh
// every 10 minutes and whenever the tab comes back into view.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  let last = Date.now();
  const refresh = () => { last = Date.now(); loading = null; loadPricing(); };
  setInterval(refresh, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - last > 60 * 1000) refresh();
  });
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getSnapshot = () => state;

/** Re-render when prices arrive. Returns the snapshot (rarely needed). */
export function usePricing() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
