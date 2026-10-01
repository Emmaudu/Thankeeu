/**
 * lemonSqueezy.js — Lemon Squeezy checkout for international card payments.
 *
 * Why: US and Canadian banks often refuse card charges from a Nigerian
 * merchant ("Restricted Card"). Lemon Squeezy is a US merchant of record, so
 * the customer's bank sees a US merchant. The customer chooses it on the
 * payment method screen; Flutterwave stays available for everything.
 *
 * Used for: the card fee, credit packs and company subscriptions.
 * NOT used for gift contributions: money collected for someone else is not a
 * sale of our product, which a merchant of record does not allow.
 *
 * Lemon Squeezy processes every order in USD, so a checkout is always priced
 * in USD cents (custom_price), whatever display currency the customer chose.
 *
 * Switch: enabled when LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_WEBHOOK_SECRET are
 * set. LEMONSQUEEZY_STORE_ID and LEMONSQUEEZY_VARIANT_ID are optional: when
 * left empty they are looked up once from the API (works when the account has
 * one store and that store has one product). Set them to choose explicitly.
 * Until then the option is hidden and nothing changes.
 *
 * Trust model: the webhook (signed with HMAC-SHA256 over the raw body) is the
 * only thing that marks a payment paid. What was bought and the price we
 * expected come from our own lemon_payments row, written before checkout.
 *
 * Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 *       https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */
const axios = require('axios');
const crypto = require('crypto');
const supabase = require('./supabase');

const API = 'https://api.lemonsqueezy.com/v1';
const TIMEOUT = 15000;
const TABLE = 'lemon_payments';
const TYPES = new Set(['card_fee', 'card_credits', 'company_subscription']);

const env = (k) => String(process.env[k] || '').trim();
const isConfigured = () => !!(env('LEMONSQUEEZY_API_KEY') && env('LEMONSQUEEZY_WEBHOOK_SECRET'));
const apiHeaders = () => ({
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  Authorization: `Bearer ${env('LEMONSQUEEZY_API_KEY')}`,
});

// ── Store and variant IDs: from env, or looked up once from the API ──────────
let resolved = null;            // { storeId, variantId }
let resolveFailedAt = 0;
async function resolveIds() {
  const envStore = env('LEMONSQUEEZY_STORE_ID');
  const envVariant = env('LEMONSQUEEZY_VARIANT_ID');
  if (resolved) return resolved;
  if (Date.now() - resolveFailedAt < 60_000) return null;
  try {
    // The store's currency matters: custom_price is in the STORE currency's
    // minor units (a store set to NGN reads 315 as ₦3.15, not $3.15).
    let storeId = envStore;
    let storeCurrency;
    if (!storeId) {
      const r = await axios.get(`${API}/stores`, { headers: apiHeaders(), timeout: TIMEOUT });
      const stores = r.data?.data || [];
      if (stores.length !== 1) throw new Error(`found ${stores.length} stores; set LEMONSQUEEZY_STORE_ID`);
      storeId = String(stores[0].id);
      storeCurrency = stores[0].attributes?.currency;
    } else {
      const r = await axios.get(`${API}/stores/${encodeURIComponent(storeId)}`, { headers: apiHeaders(), timeout: TIMEOUT });
      storeCurrency = r.data?.data?.attributes?.currency;
    }
    storeCurrency = String(storeCurrency || '').toUpperCase();
    if (!require('./cardPayment').fxRate(storeCurrency)) {
      throw new Error(`store currency "${storeCurrency || 'unknown'}" is not supported here; set the store currency to USD in Lemon Squeezy (Settings > General)`);
    }
    let variantId = envVariant;
    if (!variantId) {
      const pr = await axios.get(`${API}/products?filter[store_id]=${encodeURIComponent(storeId)}`, { headers: apiHeaders(), timeout: TIMEOUT });
      const products = pr.data?.data || [];
      if (products.length !== 1) throw new Error(`found ${products.length} products in store ${storeId}; set LEMONSQUEEZY_VARIANT_ID`);
      const vr = await axios.get(`${API}/variants?filter[product_id]=${encodeURIComponent(products[0].id)}`, { headers: apiHeaders(), timeout: TIMEOUT });
      const variants = vr.data?.data || [];
      const pick = variants.find(v => v.attributes?.status === 'published') || variants[0];
      if (!pick) throw new Error(`product ${products[0].id} has no variant; set LEMONSQUEEZY_VARIANT_ID`);
      variantId = String(pick.id);
    }
    resolved = { storeId, variantId, storeCurrency };
    console.log(`[lemonsqueezy] using store ${storeId} (${storeCurrency}), variant ${variantId}`);
    if (storeCurrency !== 'USD') console.warn(`[lemonsqueezy] store currency is ${storeCurrency}. Customers will see ${storeCurrency} prices on the Lemon Squeezy page; set it to USD in Settings > General for international customers.`);
    return resolved;
  } catch (e) {
    resolveFailedAt = Date.now();
    console.error('[lemonsqueezy] could not look up store/variant:', e.response?.data?.errors?.[0]?.detail || e.message);
    return null;
  }
}
/** Store ID for the webhook check (resolved or from env). */
async function getStoreId() { return (await resolveIds())?.storeId || null; }
const isTestMode = () => env('LEMONSQUEEZY_TEST_MODE').toLowerCase() === 'true';

const isMissingTable = (err) => !!err && (
  err.code === '42P01' || err.code === 'PGRST205'
  || /relation .* does not exist|could not find the table/i.test(`${err.message || ''}`)
);

// The table check is cached once it passes; a failure is re-checked after a
// minute, so running the migration takes effect without a redeploy.
let tableOk = null;
let tableCheckedAt = 0;
async function tableReady() {
  if (tableOk === true) return true;
  if (tableOk === false && Date.now() - tableCheckedAt < 60_000) return false;
  const { error } = await supabase.from(TABLE).select('reference').limit(1);
  tableCheckedAt = Date.now();
  tableOk = !error;
  if (error) console.error(`[lemonsqueezy] ${TABLE} not usable (${error.message}). Run database/migration_lemon_payments.sql.`);
  return tableOk;
}

/** Is Lemon Squeezy ready to take payments right now? */
async function isEnabled() {
  if (!isConfigured()) return false;
  try { return (await tableReady()) && !!(await resolveIds()); } catch { return false; }
}

/** NGN amount → USD cents, using the same rate as the rest of the site. */
function usdCentsFor(amountNGN) {
  const { chargeAmountFor } = require('./cardPayment');
  return Math.round(chargeAmountFor(amountNGN, 'USD') * 100);
}

/**
 * Record the payment, then create a Lemon Squeezy checkout for it.
 * @returns {Promise<{ok:true, url:string, amountUsd:number} | {ok:false, status:number, message:string}>}
 */
async function createCheckout({ reference, type, amountNGN, email, name, redirectPath, meta, productName, description }) {
  if (!TYPES.has(type)) return { ok: false, status: 500, message: 'Unsupported payment type' };
  if (!(await isEnabled())) return { ok: false, status: 400, message: 'This payment method is not available right now. Please choose Flutterwave.' };
  const ids = await resolveIds(); // cached by isEnabled(); never null here
  if (!ids) return { ok: false, status: 400, message: 'This payment method is not available right now. Please choose Flutterwave.' };

  // USD cents: what we expect Lemon Squeezy to report as total_usd.
  const cents = usdCentsFor(amountNGN);
  // Checkout price in the store currency's minor units.
  const { priceChargeAmount } = require('./cardPayment');
  const storeMinor = Math.round(priceChargeAmount(amountNGN, ids.storeCurrency) * 100);
  // Lemon Squeezy's minimum order is about US$0.50.
  if (!Number.isInteger(cents) || cents < 50 || !(storeMinor > 0)) {
    return { ok: false, status: 400, message: 'This amount is too small to pay by this method. Please choose Flutterwave.' };
  }
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail) return { ok: false, status: 400, message: 'An email address is required to pay.' };

  // Unguessable token for the return page's status polling, so a reference
  // alone never reveals anything (subscription refs are partly predictable).
  const statusToken = crypto.randomBytes(16).toString('hex');

  const { error: insErr } = await supabase.from(TABLE).insert({
    reference,
    status_token: statusToken,
    type,
    amount_usd_cents: cents,
    expected_ngn: Number(amountNGN),
    customer_email: cleanEmail,
    // Price as asked for in the store currency; the webhook compares like with like.
    meta: {
      ...(meta || {}), store_currency: ids.storeCurrency, store_amount_minor: storeMinor,
      ...(name ? { customer_name: String(name).slice(0, 120) } : {}),
    },
    status: 'pending',
  });
  if (insErr) {
    console.error('[lemonsqueezy] record insert failed', reference, insErr.message);
    return { ok: false, status: 500, message: 'Payment could not start. Please try again.' };
  }

  const frontend = frontendUrl();
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        custom_price: storeMinor,
        product_options: {
          ...(productName ? { name: productName } : {}),
          ...(description ? { description } : {}),
          redirect_url: `${frontend}${redirectPath}${redirectPath.includes('?') ? '&' : '?'}k=${statusToken}`,
          enabled_variants: [Number(ids.variantId)],
        },
        checkout_data: {
          email: cleanEmail,
          ...(name ? { name: String(name).slice(0, 120) } : {}),
          // Only our reference travels through Lemon Squeezy; everything else
          // is looked up from our own row.
          custom: { ref: reference },
        },
        // A checkout link that lingers can't be paid against a stale price.
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        ...(isTestMode() ? { test_mode: true } : {}),
      },
      relationships: {
        store:   { data: { type: 'stores',   id: String(ids.storeId) } },
        variant: { data: { type: 'variants', id: String(ids.variantId) } },
      },
    },
  };

  try {
    const r = await axios.post(`${API}/checkouts`, body, {
      headers: apiHeaders(),
      timeout: TIMEOUT,
    });
    const url = r.data?.data?.attributes?.url;
    if (!url) throw Object.assign(new Error('No checkout URL returned'), { noUrl: true });
    await supabase.from(TABLE).update({ checkout_id: String(r.data.data.id || ''), updated_at: new Date().toISOString() })
      .eq('reference', reference).then(() => {}, () => {});
    return { ok: true, url, amountUsd: cents / 100 };
  } catch (err) {
    const detail = err.response?.data?.errors?.[0]?.detail || err.message;
    console.error('[lemonsqueezy] checkout failed', reference, detail);
    // Keep the reason for Admin → Transactions.
    await supabase.from(TABLE).update({
      status: 'init_failed', updated_at: new Date().toISOString(),
      meta: {
        ...(meta || {}), store_currency: ids.storeCurrency, store_amount_minor: storeMinor,
        ...(name ? { customer_name: String(name).slice(0, 120) } : {}),
        error: String(detail || 'unknown').slice(0, 300),
      },
    }).eq('reference', reference).then(() => {}, () => {});
    return { ok: false, status: 502, message: 'Payment could not start. Please try again or choose Flutterwave.' };
  }
}

function frontendUrl() {
  for (const line of String(process.env.FRONTEND_URL || '').split(/[\r\n]+/)) {
    let t = line.trim();
    const eq = t.indexOf('=');
    if (eq !== -1 && !t.startsWith('http')) t = t.slice(eq + 1).trim();
    if (t.startsWith('http')) return t.replace(/\/$/, '');
  }
  return 'https://www.thankeeu.com';
}

/** HMAC-SHA256 of the raw body, hex, compared in constant time. */
function isValidSignature(rawBody, signature) {
  const secret = env('LEMONSQUEEZY_WEBHOOK_SECRET');
  if (!secret || !signature || !rawBody) return false;
  const digest = Buffer.from(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8');
  const sig = Buffer.from(String(signature), 'utf8');
  return digest.length === sig.length && crypto.timingSafeEqual(digest, sig);
}

async function getPayment(reference) {
  if (!reference) return null;
  const { data, error } = await supabase.from(TABLE).select('*').eq('reference', reference).maybeSingle();
  if (error) {
    if (!isMissingTable(error)) console.warn('[lemonsqueezy] lookup', reference, error.message);
    return null;
  }
  return data || null;
}

/**
 * Claim a pending payment for fulfilment. Only one caller can move it from
 * pending to processing, so a retried webhook can never fulfil twice.
 */
const STALE_PROCESSING_MS = 5 * 60 * 1000;

async function claimForFulfilment(reference, order) {
  const patch = {
    status: 'processing',
    order_id: order.id,
    order_identifier: order.identifier,
    paid_total_usd_cents: order.totalUsdCents,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE)
    .update(patch).eq('reference', reference).in('status', ['pending', 'init_failed']).select('*');
  if (error) throw error;
  if (data && data.length) return data[0];

  // A delivery that crashed mid-fulfilment leaves the row in 'processing'.
  // After a few minutes a retry may take it over. The compare on updated_at
  // makes sure only one retry wins. Fulfilment steps are idempotent (credits
  // are guarded by their own credit_purchases claim).
  const current = await getPayment(reference);
  if (current?.status === 'processing' && current.updated_at
      && Date.now() - new Date(current.updated_at).getTime() > STALE_PROCESSING_MS) {
    const { data: again, error: e2 } = await supabase.from(TABLE)
      .update(patch).eq('reference', reference).eq('status', 'processing').eq('updated_at', current.updated_at).select('*');
    if (e2) throw e2;
    if (again && again.length) {
      console.warn('[lemonsqueezy] reclaimed a stale processing payment', reference);
      return again[0];
    }
  }
  return null;
}

async function setStatus(reference, status, extra = {}, { throwOnError = false } = {}) {
  const { error } = await supabase.from(TABLE)
    .update({ status, updated_at: new Date().toISOString(), ...extra }).eq('reference', reference);
  if (error) {
    console.error('[lemonsqueezy] status update', reference, status, error.message);
    if (throwOnError) throw new Error(error.message);
  }
}

/** For tests only. */
function _resetForTests() { tableOk = null; tableCheckedAt = 0; resolved = null; resolveFailedAt = 0; }

module.exports = {
  isConfigured, isEnabled, isTestMode, getStoreId, usdCentsFor, createCheckout,
  isValidSignature, getPayment, frontendUrl, apiHeaders, API_BASE: API, claimForFulfilment, setStatus, _resetForTests,
};
