/**
 * Flutterwave charge-currency handling.
 *
 * Flutterwave documents CAD, USD, GBP, EUR, … as card-payment currencies, but
 * each merchant account must have a currency enabled before it can collect in
 * it. When a currency isn't enabled, /payments rejects the request and the
 * customer (e.g. a Canadian paying in CAD) could not pay at all.
 *
 *  - FLW_DISABLED_CURRENCIES (env, e.g. "CAD" or "CAD,EUR") charges those
 *    currencies in USD everywhere — an instant switch without a redeploy.
 *  - createPaymentLink() also retries once in USD when Flutterwave explicitly
 *    rejects a non-NGN/USD currency, so the customer still gets to pay.
 */
const axios = require('axios');
const { chargeAmountFor } = require('./cardPayment');

const FLW_BASE = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT = 12000;
const flwHeaders = () => ({
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const disabledCurrencies = () => new Set(
  String(process.env.FLW_DISABLED_CURRENCIES || '')
    .split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
);

/** The currency to actually charge in for a requested one. */
function resolveChargeCurrency(currency) {
  const cur = String(currency || 'NGN').toUpperCase();
  return disabledCurrencies().has(cur) ? 'USD' : cur;
}

const canFallBack = cur => !['NGN', 'USD'].includes(String(cur || '').toUpperCase());

/**
 * POST /payments (hosted link). amountNGN is the NGN value being charged, used
 * to recompute the USD amount if a fallback is needed.
 * Resolves { ok, link, currency, amount, message, fellBack }.
 * Only an explicit Flutterwave rejection triggers the fallback — never a
 * timeout, where the first link may already exist.
 */
async function createPaymentLink(payload, amountNGN, log = console) {
  const post = async (body) => {
    try {
      const r = await axios.post(`${FLW_BASE}/payments`, body, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
      return { ok: r.data?.status === 'success', data: r.data, rejected: r.data?.status !== 'success' };
    } catch (err) {
      if (err.response) return { ok: false, data: err.response.data, rejected: true };
      throw err; // network/timeout: let the caller report it, don't retry
    }
  };

  const first = await post(payload);
  if (first.ok) {
    return { ok: true, link: first.data.data.link, currency: payload.currency, amount: payload.amount, fellBack: false };
  }
  if (!first.rejected || !canFallBack(payload.currency)) {
    return { ok: false, message: first.data?.message || 'Payment gateway rejected the request' };
  }

  const usdAmount = chargeAmountFor(amountNGN, 'USD');
  log.warn?.(`[flw] ${payload.currency} rejected ("${first.data?.message || 'no message'}") for ${payload.tx_ref} — retrying in USD ${usdAmount}. `
    + `Enable ${payload.currency} in the Flutterwave dashboard or set FLW_DISABLED_CURRENCIES=${payload.currency}.`);
  const retry = {
    ...payload,
    currency: 'USD',
    amount: usdAmount,
    meta: { ...(payload.meta || {}), currency: 'USD', expected_amount: usdAmount, fallback_from: payload.currency },
  };
  const second = await post(retry);
  if (second.ok) {
    return { ok: true, link: second.data.data.link, currency: 'USD', amount: usdAmount, fellBack: true };
  }
  return { ok: false, message: second.data?.message || first.data?.message || 'Payment gateway rejected the request' };
}

module.exports = { resolveChargeCurrency, createPaymentLink };
