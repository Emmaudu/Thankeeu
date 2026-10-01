'use strict';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost.test';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test';
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../../utils/pricing');
const { chargeAmountFor, priceChargeAmount, cardFeeNGN, isCardFeeAmountOk } = require('../../utils/cardPayment');

beforeEach(() => pricing._resetForTests());

test('defaults reproduce today\'s prices exactly', () => {
  assert.equal(cardFeeNGN(), 5000);
  assert.equal(pricing.priceNGN('standard'), 9000);
  assert.equal(pricing.priceNGN('pack100'), 400000);
  assert.equal(chargeAmountFor(cardFeeNGN(), 'USD'), 3.15);
  assert.equal(chargeAmountFor(cardFeeNGN(), 'GBP'), 2.45);
});

test('a new USD price flows to every currency; USD stays exact', () => {
  pricing._setForTests({ prices: { card_fee: 3.5 }, rates: { NGN: 1600, GBP: 0.8, CAD: 1.4 } });
  assert.equal(cardFeeNGN(), 5600);
  assert.equal(priceChargeAmount(cardFeeNGN(), 'USD'), 3.5);
  assert.equal(priceChargeAmount(cardFeeNGN(), 'GBP'), 2.8);
  assert.equal(priceChargeAmount(cardFeeNGN(), 'CAD'), 4.9);
  assert.equal(priceChargeAmount(cardFeeNGN(), 'NGN'), 5600);
});

test('naira prices round to the nearest ₦100, gifts never do', () => {
  pricing._setForTests({ prices: { card_fee: 3.49 }, rates: { NGN: 1587.3 } });   // 5539.68
  assert.equal(priceChargeAmount(cardFeeNGN(), 'NGN'), 5500);
  assert.equal(priceChargeAmount(cardFeeNGN(), 'USD'), 3.49);
  assert.equal(chargeAmountFor(2550, 'NGN'), 2550);
  assert.equal(pricing.roundNairaPrice(40), 0);     // tiny remainder → free, not a ₦100 charge
  assert.equal(pricing.roundNairaPrice(60), 100);
});

test('verification accepts the rounded naira charge', () => {
  pricing._setForTests({ prices: { card_fee: 3.49 }, rates: { NGN: 1587.3 } });
  const fee = cardFeeNGN();
  assert.equal(isCardFeeAmountOk({ amount: 5500, currency: 'NGN', meta: { expected_ngn: fee } }), true);
  assert.equal(isCardFeeAmountOk({ amount: 3000, currency: 'NGN', meta: { expected_ngn: fee } }), false);
});

test('admin input is validated', () => {
  assert.ok(pricing.validatePrices({ usd: { card_fee: 0.2 } }).error);
  assert.ok(pricing.validatePrices({ usd: { card_fee: 3.456 } }).error);
  assert.ok(pricing.validatePrices({ usd: { nope: 3 } }).error);
  assert.ok(pricing.validatePrices({ usd: { card_fee: 'abc' } }).error);
  assert.ok(pricing.validatePrices({}).error);
  assert.deepEqual(pricing.validatePrices({ usd: { card_fee: '3.50', pack5: 14 } }).values, { card_fee: 3.5, pack5: 14 });
});

test('public snapshot lists every product with USD and rounded naira', () => {
  const s = pricing.snapshot();
  assert.equal(s.products.card_fee.usd, 3.15);
  assert.equal(s.products.card_fee.ngn, 5000);
  assert.equal(s.products.pack5.credits, 5);
  assert.equal(s.naira_rounding, 100);
  assert.ok(s.usd_rates.NGN > 0 && s.usd_rates.GBP > 0);
});

test('credit purchase verify refuses an underpaid charge', async () => {
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test';
  const axios = require('axios');
  const { mock } = require('node:test');
  const ctl = require('../../controllers/creditController');
  const g = mock.method(axios, 'get', async () => ({ data: { status: 'success', data: {
    status: 'successful', amount: 1, currency: 'USD', tx_ref: 'TK-CR-1',
    meta: { type: 'card_credits', plan_type: 'pack5', credits: 5, user_id: 'u', expected_ngn: 20000, expected_amount: 12.6, currency: 'USD' } } } }));
  const res = { code: 200, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await ctl.verifyPurchase({ params: { txRef: 'TK-CR-1' }, query: {} }, res);
  assert.equal(res.code, 400);
  assert.match(res.body.error, /does not match/);
  g.mock.restore();
});
