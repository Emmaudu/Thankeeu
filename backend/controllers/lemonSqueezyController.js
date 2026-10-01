/**
 * lemonSqueezyController.js — webhook, payment status and provider list for
 * Lemon Squeezy (see utils/lemonSqueezy.js for why and how).
 *
 * The browser never marks anything paid. After checkout Lemon Squeezy sends
 * the customer back to Thankeeu, whose page polls GET /status/:ref until the
 * signed webhook has fulfilled the payment.
 */
const supabase = require('../utils/supabase');
const ls = require('../utils/lemonSqueezy');
const { safeTxRef } = require('../utils/paramGuard');

// GET /api/payments/providers — which payment methods the checkout may offer.
const getProviders = async (_req, res) => {
  const lemonsqueezy = await ls.isEnabled();
  // Currencies Flutterwave charges in USD instead (FLW_DISABLED_CURRENCIES),
  // so the payment dialog can say what the customer will really be charged.
  const flutterwave_usd_for = String(process.env.FLW_DISABLED_CURRENCIES || '')
    .split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
  res.set('Cache-Control', 'no-store');
  return res.json({ flutterwave: true, lemonsqueezy, flutterwave_usd_for });
};

// GET /api/payments/lemonsqueezy/status/:ref — polled by the return pages.
const getStatus = async (req, res) => {
  const ref = safeTxRef(req.params.ref);
  if (!ref) return res.status(400).json({ error: 'Invalid reference' });
  const row = await ls.getPayment(ref);
  const token = String(req.query.k || '');
  // Same answer for "no such payment" and "wrong token", so refs can't be probed.
  if (!row || !row.status_token || token.length !== row.status_token.length
      || !require('crypto').timingSafeEqual(Buffer.from(token), Buffer.from(row.status_token))) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  const meta = row.meta || {};
  res.set('Cache-Control', 'no-store');
  return res.json({
    status: row.status,           // pending | processing | paid | amount_mismatch | refunded | init_failed | failed
    type: row.type,
    card_slug: row.type === 'card_fee' ? meta.card_slug || null : null,
    was_pay_later: row.type === 'card_fee' ? !!meta.was_pay_later : undefined,
    credits: row.type === 'card_credits' ? Number(meta.credits) || null : undefined,
    plan: row.type === 'company_subscription' ? meta.plan || null : undefined,
  });
};

/** Carry out what was paid for. Throws on failure so the webhook is retried. */
async function fulfil(row) {
  const meta = row.meta || {};
  const { recordDiscountRedemption } = require('./discountCodeController');

  if (row.type === 'card_fee') {
    if (!meta.card_slug) throw new Error('card_fee without card_slug');
    const { markCardFeePaid } = require('../utils/cardPayment');
    const { card, wasPending } = await markCardFeePaid(meta.card_slug);
    if (wasPending && card) require('../utils/payLaterEmails').sendCardFeePaidEmail(card).catch(() => {});
    if (meta.discount_code_id) {
      recordDiscountRedemption({
        discountId: meta.discount_code_id, cardSlug: meta.card_slug, txRef: row.reference,
        email: row.customer_email || null, amountBeforeNGN: 5000, amountAfterNGN: Number(row.expected_ngn),
      }).catch(() => {});
    }
    return;
  }

  if (row.type === 'card_credits') {
    if (!meta.user_id || !(Number(meta.credits) > 0) || !meta.plan_type) throw new Error('card_credits meta incomplete');
    // Credits are not naturally idempotent, so claim the purchase row first:
    // pending -> crediting. addCreditsToUser sets it to 'paid' when done.
    const { data: claimed, error: cErr } = await supabase.from('credit_purchases')
      .update({ status: 'crediting' }).eq('flw_reference', row.reference).eq('status', 'pending').select('id');
    if (cErr) throw new Error(`credit_purchases claim: ${cErr.message}`);
    if (!claimed || !claimed.length) {
      const { data: cp } = await supabase.from('credit_purchases').select('status').eq('flw_reference', row.reference).maybeSingle();
      if (cp?.status === 'paid') return; // credited by an earlier delivery
      // 'crediting' left behind by a crash: credits may or may not have landed.
      // Never risk adding them twice; flag for a manual check instead.
      console.error(`[lemonsqueezy] CREDITS NEED MANUAL CHECK for ${row.reference} (user ${meta.user_id}, ${meta.credits} credits): purchase row is '${cp?.status || 'missing'}'.`);
      return;
    }
    const { addCreditsToUser } = require('./creditController');
    const added = await addCreditsToUser(meta.user_id, Number(meta.credits), meta.plan_type, row.reference);
    if (added === false) {
      // Nothing was added (every attempt lost the lock); release for the retry.
      await supabase.from('credit_purchases').update({ status: 'pending' }).eq('flw_reference', row.reference);
      throw new Error('credits could not be added (lock contention)');
    }
    if (meta.discount_code_id) {
      recordDiscountRedemption({
        discountId: meta.discount_code_id, cardSlug: null, txRef: row.reference,
        email: row.customer_email || null, amountBeforeNGN: Number(meta.list_price_ngn) || null,
        amountAfterNGN: Number(row.expected_ngn),
      }).catch(() => {});
    }
    return;
  }

  if (row.type === 'company_subscription') {
    if (!meta.company_id || !['monthly', 'yearly'].includes(meta.plan)) throw new Error('subscription meta incomplete');
    const { saveSubscription } = require('./subscriptionController');
    const now = new Date();
    const expires = meta.plan === 'yearly'
      ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
      : new Date(new Date(now).setMonth(now.getMonth() + 1));
    await saveSubscription(meta.company_id, meta.plan, row.reference, expires, Number(row.expected_ngn));
    return;
  }

  throw new Error(`unknown type ${row.type}`);
}

/**
 * POST /webhook/lemonsqueezy — raw body (mounted before express.json).
 * Always answers 200 for events we deliberately ignore, 401 for a bad
 * signature, and 500 when fulfilment failed so Lemon Squeezy retries.
 */
const handleWebhook = async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : '');
  if (!ls.isValidSignature(raw, req.get('X-Signature'))) {
    console.warn('[lemonsqueezy webhook] invalid signature');
    return res.sendStatus(401);
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.sendStatus(400); }

  const eventName = event?.meta?.event_name || req.get('X-Event-Name');
  const ref = safeTxRef(event?.meta?.custom_data?.ref);
  const attrs = event?.data?.attributes || {};
  console.log('[lemonsqueezy webhook]', eventName, ref, attrs.status, event?.data?.id);

  if (!ref) return res.sendStatus(200); // not one of our checkouts
  const row = await ls.getPayment(ref);
  if (!row) { console.warn('[lemonsqueezy webhook] unknown ref', ref); return res.sendStatus(200); }

  if (eventName === 'order_refunded') {
    await ls.setStatus(ref, attrs.status === 'partial_refund' ? 'partial_refund' : 'refunded');
    console.warn(`[lemonsqueezy webhook] REFUND for ${ref} (${row.type}). Review manually; access was not revoked automatically.`);
    return res.sendStatus(200);
  }
  if (eventName !== 'order_created') return res.sendStatus(200);

  // ── Checks before anything is granted ──────────────────────────────────────
  const storeId = await ls.getStoreId();
  if (!storeId || String(attrs.store_id) !== String(storeId)) {
    console.error('[lemonsqueezy webhook] store mismatch', ref, attrs.store_id);
    return res.sendStatus(200);
  }
  if (!!attrs.test_mode !== ls.isTestMode()) {
    console.error('[lemonsqueezy webhook] test/live mode mismatch, ignored', ref, attrs.test_mode);
    return res.sendStatus(200);
  }
  if (attrs.status !== 'paid') {
    // pending/failed/fraudulent orders never grant anything.
    console.warn('[lemonsqueezy webhook] order not paid', ref, attrs.status);
    if (attrs.status === 'failed' || attrs.status === 'fraudulent') await ls.setStatus(ref, 'failed');
    return res.sendStatus(200);
  }
  if (row.status === 'paid') {
    if (row.order_id && String(row.order_id) !== String(event.data.id)) {
      // A second, different order for something already paid: refund it.
      console.error(`[lemonsqueezy webhook] DUPLICATE PAYMENT for ${ref}: order ${event.data.id} after ${row.order_id}. Refund it in Lemon Squeezy.`);
    }
    return res.sendStatus(200); // already done (retry)
  }

  const totalUsdCents = Number(attrs.total_usd);
  // Tax may be added on top of our price, so the total can be higher, never
  // meaningfully lower. 1% covers rounding only.
  if (!(totalUsdCents >= row.amount_usd_cents * 0.99)) {
    console.error(`[lemonsqueezy webhook] AMOUNT MISMATCH ${ref}: expected ${row.amount_usd_cents}c, got ${attrs.total_usd}c`);
    await ls.setStatus(ref, 'amount_mismatch', { order_id: String(event.data.id), paid_total_usd_cents: isFinite(totalUsdCents) ? totalUsdCents : null });
    return res.sendStatus(200);
  }

  let claimed;
  try {
    claimed = await ls.claimForFulfilment(ref, {
      id: String(event.data.id), identifier: attrs.identifier || null, totalUsdCents,
    });
  } catch (e) {
    console.error('[lemonsqueezy webhook] claim failed', ref, e.message);
    return res.sendStatus(500);
  }
  if (!claimed) return res.sendStatus(200); // another delivery is handling it, or already paid

  try {
    await fulfil(claimed);
    await ls.setStatus(ref, 'paid', {}, { throwOnError: true });
    console.log('[lemonsqueezy webhook] fulfilled', ref, claimed.type);
    return res.sendStatus(200);
  } catch (e) {
    console.error('[lemonsqueezy webhook] fulfilment failed, will retry', ref, e.message);
    try { await ls.setStatus(ref, 'pending', {}, { throwOnError: true }); } // release so the retry can claim it
    catch (e2) { console.error('[lemonsqueezy webhook] release failed; a retry will reclaim it after 5 minutes', ref, e2.message); }
    return res.sendStatus(500);
  }
};

module.exports = { getProviders, getStatus, handleWebhook, fulfil };
