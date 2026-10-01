process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test';
const { test, mock } = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

const ctl = () => { delete require.cache[require.resolve('../../controllers/paymentController')]; return require('../../controllers/paymentController'); };
const resMock = () => { const r = { code: 200 }; r.status = c => { r.code = c; return r; }; r.json = b => { r.body = b; return r; }; return r; };

test('declined CAD card fee returns 402 with slug and a clear message, not a 500', async () => {
  const g = mock.method(axios, 'get', async () => ({ data: { status: 'success', data: { status: 'failed', tx_ref: 'TK-FEE-1', currency: 'CAD', amount: 4.3, meta: { card_slug: 'abc' } } } }));
  const res = resMock();
  await ctl().verifyCardFee({ query: { tx_ref: 'TK-FEE-1' } }, res);
  assert.equal(res.code, 402); assert.equal(res.body.failed, true); assert.equal(res.body.card_slug, 'abc');
  assert.match(res.body.error, /not charged/);
  g.mock.restore();
});

test('pending (3DS still running) returns 202 so the page waits', async () => {
  const g = mock.method(axios, 'get', async () => ({ data: { status: 'success', data: { status: 'pending', tx_ref: 'TK-FEE-2', meta: { card_slug: 'abc' } } } }));
  const res = resMock();
  await ctl().verifyCardFee({ query: { tx_ref: 'TK-FEE-2' } }, res);
  assert.equal(res.code, 202); assert.equal(res.body.pending, true);
  g.mock.restore();
});

test('transaction_id is verified directly, and ignored if it belongs to another tx_ref', async () => {
  const urls = [];
  const g = mock.method(axios, 'get', async (u) => { urls.push(u);
    if (u.includes('/transactions/99/verify')) return { data: { status: 'success', data: { status: 'failed', tx_ref: 'OTHER' } } };
    return { data: { status: 'success', data: { status: 'pending', tx_ref: 'TK-FEE-3' } } }; });
  const res = resMock();
  await ctl().verifyCardFee({ query: { tx_ref: 'TK-FEE-3', transaction_id: '99' } }, res);
  assert.ok(urls[0].includes('/transactions/99/verify')); assert.ok(urls[1].includes('verify_by_reference'));
  assert.equal(res.code, 202);
  g.mock.restore();
});
