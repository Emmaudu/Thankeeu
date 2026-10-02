// ═══════════════════════════════════════════════════════════════════════
// Rapyd — card payments for the international markets
// (US, UK, Ireland, Australia, New Zealand, Canada, Singapore).
//
// Flutterwave is a Nigerian processor and many foreign cards fail on it, so
// every non Nigerian task is paid through a Rapyd hosted checkout page.
//
// Env:
//   RAPYD_ACCESS_KEY, RAPYD_SECRET_KEY   from the Rapyd Client Portal
//   RAPYD_BASE_URL                       https://sandboxapi.rapyd.net (default)
//                                        or https://api.rapyd.net for live
//
// Request signing (docs.rapyd.net "Request Signatures"):
//   signature = BASE64( HEX( HMAC_SHA256( method_lowercase + url_path + salt
//               + timestamp + access_key + secret_key + body_string ) ) )
// The body string must be exactly the JSON that is sent, with no whitespace.
//
// Payment confirmation never trusts the browser or the webhook body: the
// server always re-reads the checkout from Rapyd (getCheckout) and checks
// that its payment is CLOSED and paid, for the expected amount and currency.
// ═══════════════════════════════════════════════════════════════════════
const crypto = require('crypto');

const clean = (v) => String(v || '').trim().replace(/^['"]|['"]$/g, '');
const ACCESS = () => clean(process.env.RAPYD_ACCESS_KEY);
const SECRET = () => clean(process.env.RAPYD_SECRET_KEY);
const BASE = () => clean(process.env.RAPYD_BASE_URL) || 'https://sandboxapi.rapyd.net';

const isConfigured = () => Boolean(ACCESS() && SECRET());

class RapydError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'RapydError';
    this.details = details;
  }
}

function sign(method, urlPath, salt, timestamp, body) {
  const toSign = method.toLowerCase() + urlPath + salt + timestamp + ACCESS() + SECRET() + body;
  const hex = crypto.createHmac('sha256', SECRET()).update(toSign).digest('hex');
  return Buffer.from(hex).toString('base64');
}

async function request(method, urlPath, payload) {
  if (!isConfigured()) throw new RapydError('Card payments for this country are not configured yet (RAPYD_ACCESS_KEY / RAPYD_SECRET_KEY).');
  const salt = crypto.randomBytes(8).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = payload ? JSON.stringify(payload) : '';
  const headers = {
    'Content-Type': 'application/json',
    access_key: ACCESS(),
    salt,
    timestamp,
    signature: sign(method, urlPath, salt, timestamp, body),
    idempotency: crypto.randomUUID(),
  };
  let res;
  try {
    res = await fetch(BASE() + urlPath, { method: method.toUpperCase(), headers, body: body || undefined, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new RapydError(`Could not reach the card processor: ${e?.message || 'network error'}`);
  }
  let json = null;
  try { json = await res.json(); } catch (_) {}
  if (!res.ok || json?.status?.status !== 'SUCCESS') {
    const msg = json?.status?.message || json?.status?.error_code || `HTTP ${res.status}`;
    throw new RapydError(`Card processor error: ${msg}`, json?.status);
  }
  return json.data;
}

/**
 * Create a hosted checkout page.
 * @returns {{ id: string, redirect_url: string }}
 */
async function createCheckout({ amount, currency, country, reference, email, description, completeUrl, cancelUrl, metadata }) {
  const data = await request('post', '/v1/checkout', {
    amount: Number(amount),
    currency,
    country,
    merchant_reference_id: String(reference).slice(0, 45),
    complete_checkout_url: completeUrl,
    cancel_checkout_url: cancelUrl,
    error_payment_url: cancelUrl,
    language: 'en',
    description: description ? String(description).slice(0, 200) : undefined,
    payment_method_type_categories: ['card'],
    metadata: { ...(metadata || {}), reference, customer_email: email },
  });
  if (!data?.id || !data?.redirect_url) throw new RapydError('Card processor returned no checkout page.');
  return { id: data.id, redirect_url: data.redirect_url };
}

async function getCheckout(checkoutId) {
  return request('get', `/v1/checkout/${encodeURIComponent(checkoutId)}`);
}

/**
 * Is this checkout fully paid for the expected amount and currency?
 * @returns {{ paid: boolean, failed: boolean, paymentId: string|null, status: string }}
 */
async function checkCheckoutPaid(checkoutId, { amount, currency }) {
  const co = await getCheckout(checkoutId);
  const p = co?.payment || {};
  const paid = p.status === 'CLO' && p.paid === true
    && String(p.currency_code || co.currency || '').toUpperCase() === String(currency).toUpperCase()
    && Math.abs(Number(p.amount ?? co.amount) - Number(amount)) < 0.005;
  const failed = ['ERR', 'CAN', 'EXP', 'REV'].includes(p.status) || co?.status === 'EXP';
  return { paid, failed, paymentId: p.id || null, status: p.status || co?.status || 'NEW' };
}

/**
 * Webhook signature: BASE64(HEX(HMAC(url_path + salt + timestamp + access_key + secret_key + body))).
 * Used only as a first filter; the payment itself is always re-read from Rapyd.
 */
function verifyWebhook(urlPath, headers, rawBody) {
  if (!isConfigured()) return false;
  const salt = headers.salt;
  const timestamp = headers.timestamp;
  const got = headers.signature;
  if (!salt || !timestamp || !got) return false;
  const toSign = urlPath + salt + timestamp + ACCESS() + SECRET() + rawBody;
  const want = Buffer.from(crypto.createHmac('sha256', SECRET()).update(toSign).digest('hex')).toString('base64');
  const a = Buffer.from(String(got));
  const b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createCheckout, getCheckout, checkCheckoutPaid, verifyWebhook, isConfigured, RapydError, _sign: sign };
