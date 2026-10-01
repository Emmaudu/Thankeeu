/**
 * fxRates.js — daily USD exchange rates for DISPLAY only.
 *
 * Prices are stored in NGN and converted to USD at the site's fixed rate
 * (CARD_FEE_FX.USD). For currencies we cannot charge in (INR, KRW, …) the
 * customer sees an approximate local price, worked out from USD with these
 * rates, and is charged in USD. Nothing here decides an amount charged.
 *
 * Source: https://open.er-api.com/v6/latest/USD (free, no key, updates daily;
 * attribution "Rates By Exchange Rate API" is shown under the currency picker).
 */
const axios = require('axios');

const SOURCE = 'https://open.er-api.com/v6/latest/USD';
const TTL_MS = 12 * 60 * 60 * 1000;        // refresh twice a day at most
const RETRY_MS = 20 * 60 * 1000;           // after a failure, wait (the API's own cool-down)

let cache = null;          // { rates, updatedAt, fetchedAt }
let lastFailureAt = 0;
let inflight = null;

async function fetchRates() {
  const r = await axios.get(SOURCE, { timeout: 8000 });
  if (r.data?.result !== 'success' || typeof r.data.rates !== 'object') throw new Error('bad FX response');
  const rates = {};
  for (const [code, v] of Object.entries(r.data.rates)) {
    if (/^[A-Z]{3}$/.test(code) && Number.isFinite(v) && v > 0) rates[code] = v;
  }
  if (!rates.USD) rates.USD = 1;
  return { rates, updatedAt: r.data.time_last_update_utc || null, fetchedAt: Date.now() };
}

/** Cached rates, or null when none could ever be fetched. Never throws. */
async function getUsdRates() {
  const fresh = cache && Date.now() - cache.fetchedAt < TTL_MS;
  if (fresh) return cache;
  if (Date.now() - lastFailureAt < RETRY_MS) return cache;
  if (!inflight) {
    inflight = fetchRates()
      .then(d => { cache = d; return d; })
      .catch(e => { lastFailureAt = Date.now(); console.warn('[fx] rates fetch failed:', e.message); return cache; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

function _resetForTests() { cache = null; lastFailureAt = 0; inflight = null; }

module.exports = { getUsdRates, _resetForTests };
