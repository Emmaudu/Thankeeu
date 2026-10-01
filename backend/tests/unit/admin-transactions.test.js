process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
require.cache[path.resolve(__dirname, '../../utils/supabase.js')] = { id: 's', filename: 's', loaded: true, exports: { from() { throw new Error('unused'); } } };
const tx = require('../../controllers/adminTransactionsController');

test('flutterwave failure shows the processor reason, card and customer', () => {
  const it = tx._normaliseFlw({
    id: 1, tx_ref: 'TK-FEE-1-AB', status: 'failed', processor_response: 'Restricted Card', amount: 4.6, currency: 'CAD',
    payment_type: 'card', created_at: '2026-10-01T10:00:00Z',
    customer: { name: 'Jo Smith', email: 'jo@x.ca', phone_number: '+1555' },
    card: { first_6digits: '453201', last_4digits: '4242', issuer: 'TD BANK', country: 'CA', type: 'VISA', token: 'secret' },
  });
  assert.equal(it.status_group, 'failed');
  assert.equal(it.reason, 'Restricted Card');
  assert.equal(it.product, 'Card fee');
  assert.equal(it.card_number, '453201••••••4242');
  assert.equal(it.card_type, 'VISA');
  assert.equal(it.country, 'CA');
  assert.equal(it.phone, '+1555');
  assert.equal(it.payment_method, 'Card');
  assert.ok(!JSON.stringify(it).includes('secret'));
});

test('reference prefixes map to products (longest first)', () => {
  assert.equal(tx._productFor('TK-GIFT-1'), 'Gift to a card');
  assert.equal(tx._productFor('TK-GAMES-SPONSOR-1'), 'Games sponsorship');
  assert.equal(tx._productFor('xyz'), 'Other');
});

test('lemon squeezy statuses: open, abandoned, could not start, mismatch', () => {
  const now = Date.now();
  const base = { amount_usd_cents: 315, meta: {}, created_at: new Date(now - 60000).toISOString() };
  assert.equal(tx._lsStatus({ ...base, status: 'pending' }, now).group, 'pending');
  assert.equal(tx._lsStatus({ ...base, status: 'pending', created_at: new Date(now - 3 * 3600e3).toISOString() }, now).group, 'failed');
  assert.match(tx._lsStatus({ ...base, status: 'init_failed', meta: { error: 'custom price too low' } }, now).reason, /custom price too low/);
  assert.match(tx._lsStatus({ ...base, status: 'amount_mismatch', paid_total_usd_cents: 100 }, now).reason, /1\.00 USD but 3\.15 USD/);
  const row = tx._normaliseLs({ ...base, reference: 'TK-CR-1', type: 'card_credits', status: 'paid', customer_email: 'a@b.c', meta: { credits: 5 } },
    { order: { total: 1260, total_usd: 1260, currency: 'USD', user_name: 'Ann', user_email: 'a@b.c', tax: 0, urls: { receipt: 'https://r' } }, customer: { country: 'US', country_formatted: 'United States' } });
  assert.equal(row.status_group, 'successful');
  assert.equal(row.amount, 12.6);
  assert.equal(row.country, 'United States');
  assert.equal(row.product, 'Credits · 5 credits');
  assert.equal(row.name, 'Ann');
});
