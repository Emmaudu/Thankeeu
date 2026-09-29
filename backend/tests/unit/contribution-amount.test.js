'use strict';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost.test';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { chargeAmountFor, isContributionAmountOk, CARD_FEE_NGN } = require('../../utils/cardPayment');

describe('chargeAmountFor', () => {
  it('converts NGN to USD cents server-side', () => {
    assert.equal(chargeAmountFor(CARD_FEE_NGN, 'USD'), 3.15);
    assert.equal(chargeAmountFor(10000, 'USD'), 6.3);
  });
  it('keeps NGN whole and falls back to NGN for unknown currencies', () => {
    assert.equal(chargeAmountFor(2500, 'NGN'), 2500);
    assert.equal(chargeAmountFor(2500, 'XYZ'), 2500);
  });
});

describe('isContributionAmountOk', () => {
  const meta = { currency: 'USD', expected_amount: 6.3, expected_ngn: 10000 };
  it('accepts the exact USD charge', () => {
    assert.equal(isContributionAmountOk({ amount: 6.3, currency: 'USD', meta }, 10000), true);
  });
  it('rejects a one-cent payment for a big gift', () => {
    assert.equal(isContributionAmountOk({ amount: 0.01, currency: 'USD', meta }, 10000), false);
    assert.equal(isContributionAmountOk({ amount: 0.01, currency: 'USD', meta: {} }, 5_000_000), false);
  });
  it('checks NGN payments against the naira amount', () => {
    assert.equal(isContributionAmountOk({ amount: 10000, currency: 'NGN', meta: {} }, 10000), true);
    assert.equal(isContributionAmountOk({ amount: 100, currency: 'NGN', meta: {} }, 10000), false);
  });
  it('refuses unknown currencies and bad input', () => {
    assert.equal(isContributionAmountOk({ amount: 99, currency: 'JPY', meta: {} }, 10000), false);
    assert.equal(isContributionAmountOk({ amount: 0, currency: 'USD', meta }, 10000), false);
  });
});
