/**
 * pricing.js — the single source of truth for prices and exchange rates.
 *
 * Prices are set by the admin in US dollars (Admin → Currency) and stored in
 * site_settings under the key 'pricing_usd'. Every other currency follows
 * from today's exchange rate:
 *   • naira  = USD price × today's USD→NGN rate, shown and charged rounded to
 *     the nearest ₦100;
 *   • GBP, EUR, CAD, GHS, KES, ZAR (and display-only currencies) = USD price ×
 *     today's rate for that currency.
 *
 * Amounts are still carried internally in NGN (expected_ngn, discounts,
 * gift pots, credit purchase records), so all existing payment and
 * verification code keeps working. What changed is that the NGN value of a
 * price, and every NGN → other-currency rate, now come from here instead of
 * hard-coded numbers.
 *
 * Everything is read synchronously from an in-memory snapshot. The snapshot
 * starts with the long-standing fixed rates and default prices (so tests and
 * a cold start behave exactly as before), and start() refreshes it from the
 * database and the daily rate feed in the background.
 */
const supabase = require('./supabase');

const SETTINGS_KEY = 'pricing_usd';

// Products whose price the admin controls. Credits per product are fixed.
const PRODUCTS = {
  card_fee: { label: 'Card fee (1 card)', credits: 1 },
  standard: { label: 'Standard (2 credits)', credits: 2 },
  pack5:    { label: 'Pack of 5', credits: 5 },
  pack10:   { label: 'Pack of 10', credits: 10 },
  pack25:   { label: 'Pack of 25', credits: 25 },
  pack50:   { label: 'Pack of 50', credits: 50 },
  pack70:   { label: 'Pack of 70', credits: 70 },
  pack100:  { label: 'Pack of 100', credits: 100 },
};

// Today's prices, unchanged: ₦ list price × the old fixed rate 0.00063.
const DEFAULT_USD = {
  card_fee: 3.15, standard: 5.67, pack5: 12.60, pack10: 25.20,
  pack25: 63.00, pack50: 126.00, pack70: 176.40, pack100: 252.00,
};

// The long-standing fixed NGN → currency rates, used until (or whenever) the
// live feed is unavailable. Expressed per US dollar for the snapshot.
const LEGACY_PER_NGN = { NGN: 1, USD: 0.00063, GBP: 0.00049, EUR: 0.00058, CAD: 0.00086, GHS: 0.0095, KES: 0.082, ZAR: 0.011 };
const FALLBACK_USD_RATES = Object.fromEntries(
  Object.entries(LEGACY_PER_NGN).map(([c, r]) => [c, r / LEGACY_PER_NGN.USD]),
);
const CHARGEABLE = Object.keys(LEGACY_PER_NGN);

const MIN_USD = 0.5;      // card processors' practical minimum
const MAX_USD = 10000;

let usdPrices = { ...DEFAULT_USD };
let pricesUpdatedAt = null;
let usdRates = { ...FALLBACK_USD_RATES };
let ratesLive = false;
let ratesUpdatedAt = null;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/** NGN → currency multiplier (the shape the old CARD_FEE_FX table had). */
function fxRate(currency) {
  const cur = String(currency || '').toUpperCase();
  const per = usdRates[cur];
  const ngn = usdRates.NGN;
  if (!(per > 0) || !(ngn > 0)) return null;
  return per / ngn;
}

/** The full NGN → currency table for the chargeable currencies. */
function fxTable() {
  const out = {};
  for (const c of CHARGEABLE) { const r = fxRate(c); if (r) out[c] = r; }
  return out;
}

/** Naira per US dollar right now. */
const ngnPerUsd = () => usdRates.NGN;

/** A naira price as shown and charged: nearest ₦100, never below ₦100. */
// A tiny remainder (e.g. after a 99%-off code) rounds to ₦0, which the payment
// code treats as free, rather than to a ₦100 minimum charge.
const roundNairaPrice = (ngn) => Math.max(0, Math.round(Number(ngn) / 100) * 100);

/** USD price of a product. */
function priceUSD(product) {
  const v = usdPrices[product];
  return Number(v) > 0 ? Number(v) : DEFAULT_USD[product];
}

/**
 * Internal NGN value of a product (not rounded, so converting back to USD
 * gives exactly the admin's USD price).
 */
const priceNGN = (product) => round2(priceUSD(product) * ngnPerUsd());

const cardFeeNGN = () => priceNGN('card_fee');

/** Validate an admin payload { usd: { product: number } }. */
function validatePrices(body = {}) {
  const input = body && typeof body.usd === 'object' && body.usd ? body.usd : null;
  if (!input) return { error: 'Send prices as { usd: { card_fee: 3.15, ... } }' };
  const out = {};
  for (const [k, raw] of Object.entries(input)) {
    if (!PRODUCTS[k]) return { error: `Unknown product "${k}"` };
    const n = Number(raw);
    if (!Number.isFinite(n)) return { error: `${PRODUCTS[k].label}: enter a number` };
    if (n < MIN_USD) return { error: `${PRODUCTS[k].label}: minimum is $${MIN_USD.toFixed(2)}` };
    if (n > MAX_USD) return { error: `${PRODUCTS[k].label}: maximum is $${MAX_USD}` };
    if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) return { error: `${PRODUCTS[k].label}: use at most 2 decimal places` };
    out[k] = round2(n);
  }
  if (!Object.keys(out).length) return { error: 'Nothing to save' };
  return { values: out };
}

async function loadPrices() {
  const { data, error } = await supabase.from('site_settings')
    .select('value, updated_at').eq('key', SETTINGS_KEY).maybeSingle();
  if (error) throw error;
  if (!data?.value) { usdPrices = { ...DEFAULT_USD }; pricesUpdatedAt = null; return; }
  let parsed = {};
  try { parsed = JSON.parse(data.value) || {}; } catch { parsed = {}; }
  const next = { ...DEFAULT_USD };
  for (const k of Object.keys(PRODUCTS)) {
    const n = Number(parsed[k]);
    if (Number.isFinite(n) && n >= MIN_USD && n <= MAX_USD) next[k] = round2(n);
  }
  usdPrices = next;
  pricesUpdatedAt = data.updated_at || null;
}

/** Save prices (merged over the current ones) and apply them immediately. */
async function savePrices(values) {
  const merged = { ...usdPrices, ...values };
  const now = new Date().toISOString();
  const { error } = await supabase.from('site_settings')
    .upsert({ key: SETTINGS_KEY, value: JSON.stringify(merged), updated_at: now }, { onConflict: 'key' });
  if (error) throw error;
  usdPrices = merged;
  pricesUpdatedAt = now;
  return snapshot();
}

async function loadRates() {
  const d = await require('./fxRates').getUsdRates();
  if (!d?.rates) return;
  const next = { ...FALLBACK_USD_RATES };
  let live = true;
  for (const c of CHARGEABLE) {
    const v = Number(d.rates[c]);
    if (v > 0) next[c] = v; else live = false;
  }
  usdRates = next;
  ratesLive = live;
  ratesUpdatedAt = d.updatedAt || null;
}

/** Everything the site needs to show prices, for the public endpoint. */
function snapshot() {
  const products = {};
  for (const k of Object.keys(PRODUCTS)) {
    products[k] = { label: PRODUCTS[k].label, credits: PRODUCTS[k].credits, usd: priceUSD(k), ngn: roundNairaPrice(priceNGN(k)) };
  }
  return {
    products,
    ngn_per_usd: ngnPerUsd(),
    usd_rates: Object.fromEntries(CHARGEABLE.map(c => [c, usdRates[c]])),
    rates_live: ratesLive,
    rates_updated_at: ratesUpdatedAt,
    prices_updated_at: pricesUpdatedAt,
    naira_rounding: 100,
  };
}

let started = false;
let firstLoad = null;
/** Load prices and rates now, then keep them fresh. Never throws. */
function start() {
  if (started) return firstLoad;
  started = true;
  const safe = (fn, what) => fn().catch(e => console.warn(`[pricing] ${what} refresh failed:`, e.message));
  firstLoad = Promise.all([safe(loadPrices, 'prices'), safe(loadRates, 'rates')]);
  setInterval(() => safe(loadPrices, 'prices'), 60 * 1000).unref?.();
  setInterval(() => safe(loadRates, 'rates'), 6 * 60 * 60 * 1000).unref?.();
}

/**
 * Wait (at most `ms`) for the first load after boot, so a checkout started
 * right after a deploy uses the admin's prices, not the built-in defaults.
 */
function ready(ms = 4000) {
  if (!firstLoad) return Promise.resolve();
  return Promise.race([firstLoad, new Promise(r => setTimeout(r, ms))]);
}

/** For tests only. */
function _setForTests({ prices, rates } = {}) {
  if (prices) usdPrices = { ...DEFAULT_USD, ...prices };
  if (rates) usdRates = { ...FALLBACK_USD_RATES, ...rates };
}
function _resetForTests() { usdPrices = { ...DEFAULT_USD }; usdRates = { ...FALLBACK_USD_RATES }; ratesLive = false; }

module.exports = {
  PRODUCTS, DEFAULT_USD, CHARGEABLE, MIN_USD, MAX_USD,
  fxRate, fxTable, ngnPerUsd, roundNairaPrice, priceUSD, priceNGN, cardFeeNGN,
  validatePrices, loadPrices, savePrices, loadRates, snapshot, start, ready,
  _setForTests, _resetForTests,
};
