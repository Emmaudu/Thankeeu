// Lemon Squeezy: checkout creation, signed webhook, idempotent fulfilment.
// Supabase is replaced by a tiny in-memory fake injected into require.cache.
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
const { test, beforeEach, mock } = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const path = require('node:path');
const axios = require('axios');

// ── In-memory supabase fake ─────────────────────────────────────────────────
const db = { lemon_payments: [] };
function query(table) {
  const rows = () => (db[table] = db[table] || []);
  const filters = [];
  let op = 'select', patch = null, insertRow = null, wantRows = false;
  const match = (r) => filters.every(f => f(r));
  const q = {
    select() { wantRows = true; return q; },
    insert(row) { op = 'insert'; insertRow = row; return q; },
    update(p) { op = 'update'; patch = p; return q; },
    eq(k, v) { filters.push(r => r[k] === v); return q; },
    in(k, vs) { filters.push(r => vs.includes(r[k])); return q; },
    limit() { return q; },
    order() { return q; },
    maybeSingle() { return Promise.resolve({ data: rows().find(match) || null, error: null }); },
    then(res, rej) {
      let out;
      if (op === 'insert') {
        if (rows().some(r => r.reference === insertRow.reference)) out = { data: null, error: { message: 'duplicate' } };
        else { rows().push({ ...insertRow }); out = { data: null, error: null }; }
      } else if (op === 'update') {
        const hit = rows().filter(match);
        hit.forEach(r => Object.assign(r, patch));
        out = { data: wantRows ? hit.map(r => ({ ...r })) : null, error: null };
      } else out = { data: rows().filter(match), error: null };
      return Promise.resolve(out).then(res, rej);
    },
  };
  return q;
}
const fakeSupabase = { from: (t) => query(t) };
require.cache[path.resolve(__dirname, '../../utils/supabase.js')] = {
  id: 'supabase', filename: 'supabase', loaded: true, exports: fakeSupabase,
};

const ls = require('../../utils/lemonSqueezy');
const cardPayment = require('../../utils/cardPayment');
const ctl = require('../../controllers/lemonSqueezyController');

const SECRET = 'whsec_test';
function setEnv() {
  Object.assign(process.env, {
    LEMONSQUEEZY_API_KEY: 'k', LEMONSQUEEZY_STORE_ID: '42', LEMONSQUEEZY_VARIANT_ID: '7',
    LEMONSQUEEZY_WEBHOOK_SECRET: SECRET, LEMONSQUEEZY_TEST_MODE: '', FRONTEND_URL: 'https://www.thankeeu.com',
  });
}
beforeEach(() => { db.lemon_payments = []; setEnv(); ls._resetForTests(); mock.restoreAll(); });

const resMock = () => {
  const r = { code: 200 };
  r.status = c => { r.code = c; return r; };
  r.json = b => { r.body = b; return r; };
  r.sendStatus = c => { r.code = c; return r; };
  r.set = () => r;
  r.headersSent = false;
  return r;
};
const signedReq = (payload, secret = SECRET) => {
  const raw = Buffer.from(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return { body: raw, get: (h) => (h.toLowerCase() === 'x-signature' ? sig : undefined) };
};
const order = (ref, over = {}) => ({
  meta: { event_name: 'order_created', custom_data: { ref } },
  data: { type: 'orders', id: '9001', attributes: { store_id: 42, status: 'paid', total_usd: 315, test_mode: false, identifier: 'u-1', ...over } },
});

test('disabled until all keys are set', async () => {
  delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  assert.equal(await ls.isEnabled(), false);
  const r = await ls.createCheckout({ reference: 'TK-FEE-1', type: 'card_fee', amountNGN: 5000, email: 'a@b.c', redirectPath: '/x' });
  assert.equal(r.ok, false);
  assert.equal(db.lemon_payments.length, 0);
});

test('card fee is priced in USD cents from NGN and recorded before checkout', async () => {
  let sent;
  mock.method(axios, 'post', async (url, body) => { sent = { url, body }; return { data: { data: { id: 'c1', attributes: { url: 'https://pay.lemonsqueezy.com/c1' } } } }; });
  const r = await ls.createCheckout({ reference: 'TK-FEE-2', type: 'card_fee', amountNGN: 5000, email: 'a@b.c', redirectPath: '/create-card/verify?provider=lemonsqueezy&tx_ref=TK-FEE-2', meta: { card_slug: 's1' } });
  assert.equal(r.ok, true);
  assert.equal(r.amountUsd, 3.15);
  const a = sent.body.data.attributes;
  assert.equal(a.custom_price, 315);
  assert.deepEqual(a.checkout_data.custom, { ref: 'TK-FEE-2' });
  assert.ok(a.product_options.redirect_url.startsWith('https://www.thankeeu.com/create-card/verify?provider=lemonsqueezy&tx_ref=TK-FEE-2&k='));
  assert.equal(sent.body.data.relationships.store.data.id, '42');
  assert.equal(db.lemon_payments[0].amount_usd_cents, 315);
  assert.equal(db.lemon_payments[0].status, 'pending');
});

test('webhook with a bad signature is rejected and grants nothing', async () => {
  db.lemon_payments.push({ reference: 'TK-FEE-3', type: 'card_fee', amount_usd_cents: 315, expected_ngn: 5000, meta: { card_slug: 's' }, status: 'pending' });
  const res = resMock();
  await ctl.handleWebhook(signedReq(order('TK-FEE-3'), 'wrong'), res);
  assert.equal(res.code, 401);
  assert.equal(db.lemon_payments[0].status, 'pending');
});

test('paid order activates the card once, even when the webhook is delivered twice', async () => {
  db.lemon_payments.push({ reference: 'TK-FEE-4', type: 'card_fee', amount_usd_cents: 315, expected_ngn: 5000, meta: { card_slug: 's4' }, status: 'pending' });
  const paid = mock.method(cardPayment, 'markCardFeePaid', async () => ({ card: null, wasPending: false }));
  const r1 = resMock(); await ctl.handleWebhook(signedReq(order('TK-FEE-4')), r1);
  const r2 = resMock(); await ctl.handleWebhook(signedReq(order('TK-FEE-4')), r2);
  assert.equal(r1.code, 200); assert.equal(r2.code, 200);
  assert.equal(paid.mock.callCount(), 1);
  assert.equal(paid.mock.calls[0].arguments[0], 's4');
  assert.equal(db.lemon_payments[0].status, 'paid');
  assert.equal(db.lemon_payments[0].order_id, '9001');
});

test('underpaid, unpaid, wrong store and test-mode orders grant nothing', async () => {
  const paid = mock.method(cardPayment, 'markCardFeePaid', async () => ({ card: null, wasPending: false }));
  const cases = [
    ['TK-FEE-5', { total_usd: 100 }, 'amount_mismatch'],
    ['TK-FEE-6', { status: 'pending' }, 'pending'],
    ['TK-FEE-7', { store_id: 99 }, 'pending'],
    ['TK-FEE-8', { test_mode: true }, 'pending'],
  ];
  for (const [ref, over, expectStatus] of cases) {
    db.lemon_payments.push({ reference: ref, type: 'card_fee', amount_usd_cents: 315, expected_ngn: 5000, meta: { card_slug: 's' }, status: 'pending' });
    const res = resMock();
    await ctl.handleWebhook(signedReq(order(ref, over)), res);
    assert.equal(res.code, 200, ref);
    assert.equal(db.lemon_payments.find(r => r.reference === ref).status, expectStatus, ref);
  }
  assert.equal(paid.mock.callCount(), 0);
});

test('a failed fulfilment is released so the retried webhook can complete it', async () => {
  db.lemon_payments.push({ reference: 'TK-FEE-9', type: 'card_fee', amount_usd_cents: 315, expected_ngn: 5000, meta: { card_slug: 's9' }, status: 'pending' });
  let n = 0;
  mock.method(cardPayment, 'markCardFeePaid', async () => { n += 1; if (n === 1) throw new Error('db down'); return { card: null, wasPending: false }; });
  const r1 = resMock(); await ctl.handleWebhook(signedReq(order('TK-FEE-9')), r1);
  assert.equal(r1.code, 500);
  assert.equal(db.lemon_payments[0].status, 'pending');
  const r2 = resMock(); await ctl.handleWebhook(signedReq(order('TK-FEE-9')), r2);
  assert.equal(r2.code, 200);
  assert.equal(db.lemon_payments[0].status, 'paid');
});

test('status endpoint needs the token and exposes only what the return page needs', async () => {
  db.lemon_payments.push({ reference: 'TK-CR-1', status_token: 'a'.repeat(32), type: 'card_credits', amount_usd_cents: 315, expected_ngn: 5000, meta: { user_id: 'u', credits: 1, plan_type: 'classic' }, status: 'paid', customer_email: 'x@y.z' });
  const bad = resMock();
  await ctl.getStatus({ params: { ref: 'TK-CR-1' }, query: { k: 'b'.repeat(32) } }, bad);
  assert.equal(bad.code, 404);
  const none = resMock();
  await ctl.getStatus({ params: { ref: 'TK-CR-1' }, query: {} }, none);
  assert.equal(none.code, 404);
  const res = resMock();
  await ctl.getStatus({ params: { ref: 'TK-CR-1' }, query: { k: 'a'.repeat(32) } }, res);
  assert.equal(res.body.status, 'paid');
  assert.equal(res.body.credits, 1);
  assert.equal(res.body.card_slug, null);
  assert.equal(JSON.stringify(res.body).includes('x@y.z'), false);
});

test('checkout redirect carries the status token', async () => {
  let sent;
  mock.method(axios, 'post', async (url, body) => { sent = body; return { data: { data: { id: 'c', attributes: { url: 'https://x' } } } }; });
  await ls.createCheckout({ reference: 'TK-SUB-AB-1', type: 'company_subscription', amountNGN: 20000, email: 'h@co.com', redirectPath: '/company/subscription?provider=lemonsqueezy&tx_ref=TK-SUB-AB-1', meta: { company_id: 'c', plan: 'monthly' } });
  const tok = db.lemon_payments[0].status_token;
  assert.match(tok, /^[0-9a-f]{32}$/);
  assert.ok(sent.data.attributes.product_options.redirect_url.endsWith(`&k=${tok}`));
});

test('credits are added once; a retry after a crash never adds them twice', async () => {
  const creditCtl = require('../../controllers/creditController');
  db.credit_purchases = [{ flw_reference: 'TK-CR-2', status: 'pending' }];
  db.lemon_payments.push({ reference: 'TK-CR-2', type: 'card_credits', amount_usd_cents: 315, expected_ngn: 5000, meta: { user_id: 'u', credits: 5, plan_type: 'pack5' }, status: 'pending' });
  const add = mock.method(creditCtl, 'addCreditsToUser', async (u, c, p, ref) => {
    db.credit_purchases.find(r => r.flw_reference === ref).status = 'paid'; return true;
  });
  const r1 = resMock(); await ctl.handleWebhook(signedReq(order('TK-CR-2')), r1);
  assert.equal(r1.code, 200);
  // Simulate a lost 'paid' write: the row went back to pending and is retried.
  db.lemon_payments[0].status = 'pending';
  const r2 = resMock(); await ctl.handleWebhook(signedReq(order('TK-CR-2')), r2);
  assert.equal(r2.code, 200);
  assert.equal(add.mock.callCount(), 1);
});

test('a payment stuck in processing is reclaimed after 5 minutes, not before', async () => {
  const paid = mock.method(cardPayment, 'markCardFeePaid', async () => ({ card: null, wasPending: false }));
  const fresh = new Date().toISOString();
  db.lemon_payments.push({ reference: 'TK-FEE-10', type: 'card_fee', amount_usd_cents: 315, expected_ngn: 5000, meta: { card_slug: 's' }, status: 'processing', updated_at: fresh });
  const r1 = resMock(); await ctl.handleWebhook(signedReq(order('TK-FEE-10')), r1);
  assert.equal(paid.mock.callCount(), 0);
  db.lemon_payments[0].updated_at = new Date(Date.now() - 6 * 60 * 1000).toISOString();
  const r2 = resMock(); await ctl.handleWebhook(signedReq(order('TK-FEE-10')), r2);
  assert.equal(paid.mock.callCount(), 1);
  assert.equal(db.lemon_payments[0].status, 'paid');
});

test('partial refund is recorded as partial', async () => {
  db.lemon_payments.push({ reference: 'TK-FEE-11', type: 'card_fee', amount_usd_cents: 315, expected_ngn: 5000, meta: {}, status: 'paid' });
  const res = resMock();
  await ctl.handleWebhook(signedReq({ meta: { event_name: 'order_refunded', custom_data: { ref: 'TK-FEE-11' } }, data: { id: '1', attributes: { status: 'partial_refund' } } }), res);
  assert.equal(db.lemon_payments[0].status, 'partial_refund');
});

test('display-only currencies are charged in USD; no currency stays naira', () => {
  const { chargeableCurrency } = require('../../utils/cardPayment');
  assert.equal(chargeableCurrency('INR'), 'USD');
  assert.equal(chargeableCurrency('krw'), 'USD');
  assert.equal(chargeableCurrency('CAD'), 'CAD');
  assert.equal(chargeableCurrency(undefined), 'NGN');
  assert.equal(chargeableCurrency(''), 'NGN');
});

test('fx rates are cached and a failure never throws', async () => {
  const fx = require('../../utils/fxRates');
  fx._resetForTests();
  let calls = 0;
  mock.method(axios, 'get', async () => { calls += 1; return { data: { result: 'success', rates: { USD: 1, INR: 83, BAD: -1 }, time_last_update_utc: 'x' } }; });
  const a = await fx.getUsdRates();
  const b = await fx.getUsdRates();
  assert.equal(calls, 1);
  assert.equal(a.rates.INR, 83);
  assert.equal(a.rates.BAD, undefined);
  assert.equal(b, a);
  fx._resetForTests();
  mock.restoreAll();
  mock.method(axios, 'get', async () => { throw new Error('down'); });
  assert.equal(await fx.getUsdRates(), null);
});

test('store and variant IDs are looked up when not set', async () => {
  delete process.env.LEMONSQUEEZY_STORE_ID; delete process.env.LEMONSQUEEZY_VARIANT_ID;
  ls._resetForTests();
  mock.method(axios, 'get', async (url) => {
    if (url.endsWith('/stores')) return { data: { data: [{ id: 55 }] } };
    if (url.includes('/products?')) { assert.ok(url.includes('filter[store_id]=55')); return { data: { data: [{ id: 9 }] } }; }
    if (url.includes('/variants?')) return { data: { data: [{ id: 101, attributes: { status: 'pending' } }, { id: 102, attributes: { status: 'published' } }] } };
    throw new Error('unexpected ' + url);
  });
  let sent;
  mock.method(axios, 'post', async (u, body) => { sent = body; return { data: { data: { id: 'c', attributes: { url: 'https://x' } } } }; });
  const r = await ls.createCheckout({ reference: 'TK-FEE-20', type: 'card_fee', amountNGN: 5000, email: 'a@b.c', redirectPath: '/x' });
  assert.equal(r.ok, true);
  assert.equal(sent.data.relationships.store.data.id, '55');
  assert.equal(sent.data.relationships.variant.data.id, '102');
  assert.equal(await ls.getStoreId(), '55');
});

test('two stores and no store ID set: Lemon Squeezy stays off', async () => {
  delete process.env.LEMONSQUEEZY_STORE_ID; delete process.env.LEMONSQUEEZY_VARIANT_ID;
  ls._resetForTests();
  mock.method(axios, 'get', async () => ({ data: { data: [{ id: 1 }, { id: 2 }] } }));
  assert.equal(await ls.isEnabled(), false);
});
