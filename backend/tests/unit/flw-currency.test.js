'use strict';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost.test';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { resolveChargeCurrency, createPaymentLink } = require('../../utils/flwCurrency');

const quiet = { warn() {} };
const payload = () => ({ tx_ref: 'TK-T-1', amount: 4.3, currency: 'CAD', meta: { currency: 'CAD', expected_amount: 4.3, expected_ngn: 5000 } });
let calls;
const mockPost = (...responses) => { calls = []; axios.post = async (url, body) => { calls.push(body); const r = responses.shift(); if (r instanceof Error) throw r; return { data: r }; }; };
const rejection = (message) => Object.assign(new Error('400'), { response: { status: 400, data: { status: 'error', message } } });

describe('resolveChargeCurrency', () => {
  beforeEach(() => { delete process.env.FLW_DISABLED_CURRENCIES; });
  it('keeps currencies by default', () => assert.equal(resolveChargeCurrency('cad'), 'CAD'));
  it('charges switched-off currencies in USD', () => {
    process.env.FLW_DISABLED_CURRENCIES = 'CAD, eur';
    assert.equal(resolveChargeCurrency('CAD'), 'USD');
    assert.equal(resolveChargeCurrency('EUR'), 'USD');
    assert.equal(resolveChargeCurrency('GBP'), 'GBP');
  });
});

describe('createPaymentLink', () => {
  it('uses CAD when Flutterwave accepts it', async () => {
    mockPost({ status: 'success', data: { link: 'https://pay/1' } });
    const r = await createPaymentLink(payload(), 5000, quiet);
    assert.deepEqual([r.ok, r.currency, r.amount, r.fellBack, calls.length], [true, 'CAD', 4.3, false, 1]);
  });
  it('retries once in USD with matching meta when CAD is rejected (thrown 400)', async () => {
    mockPost(rejection('Currency not supported'), { status: 'success', data: { link: 'https://pay/2' } });
    const r = await createPaymentLink(payload(), 5000, quiet);
    assert.deepEqual([r.ok, r.currency, r.amount, r.fellBack], [true, 'USD', 3.15, true]);
    assert.equal(calls[1].meta.currency, 'USD');
    assert.equal(calls[1].meta.expected_amount, 3.15);
    assert.equal(calls[1].meta.fallback_from, 'CAD');
    assert.equal(calls[1].tx_ref, 'TK-T-1');
  });
  it('also falls back on a non-thrown error status', async () => {
    mockPost({ status: 'error', message: 'nope' }, { status: 'success', data: { link: 'x' } });
    assert.equal((await createPaymentLink(payload(), 5000, quiet)).currency, 'USD');
  });
  it('never retries on a timeout (the first link may exist)', async () => {
    mockPost(new Error('timeout of 12000ms exceeded'));
    await assert.rejects(() => createPaymentLink(payload(), 5000, quiet));
    assert.equal(calls.length, 1);
  });
  it('does not retry NGN or USD rejections', async () => {
    mockPost(rejection('bad'));
    const r = await createPaymentLink({ ...payload(), currency: 'NGN', amount: 5000 }, 5000, quiet);
    assert.equal(r.ok, false); assert.equal(calls.length, 1);
  });
});
