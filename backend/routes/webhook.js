/**
 * Flutterwave Webhook — /webhook/flutterwave
 *
 * This is the server-to-server safety net.
 * FLW calls this after every successful payment, even if the user's browser
 * closed before the frontend callback fired.
 *
 * Mounted BEFORE express.json() in server.js so the raw body is preserved
 * for HMAC signature verification.
 *
 * Set FLW_SECRET_HASH in Railway to the "Secret Hash" from your FLW dashboard.
 * Webhook URL in FLW dashboard: https://YOUR-RAILWAY-URL/webhook/flutterwave
 */

const express  = require('express');
const router   = express.Router();
const supabase = require('../utils/supabase');

router.post('/flutterwave', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // ── 1. Verify signature ───────────────────────────────────────────────────
    const secret    = process.env.FLW_SECRET_HASH || '';
    const signature = req.headers['verif-hash'];

    if (!secret || !signature || signature !== secret) {
      console.warn('FLW webhook: invalid or missing signature');
      return res.sendStatus(401);
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      console.warn('FLW webhook: could not parse body');
      return res.sendStatus(400);
    }

    const { event: eventName, data: txn } = event;
    console.log('FLW webhook received:', eventName, txn?.tx_ref, txn?.status);

    // ── 3. Acknowledge immediately (FLW has a 5s timeout) ────────────────────
    res.sendStatus(200);

    // Only process successful charge.completed events
    if (eventName !== 'charge.completed' || !['successful', 'completed'].includes(txn?.status)) return;

    const meta        = txn.meta || {};
    const type        = meta.type;
    const txRef       = txn.tx_ref;
    const amountNaira = Math.floor(txn.amount);

    console.log('FLW webhook processing type:', type, 'txRef:', txRef);

    // ── 4. card_fee: activate the card ────────────────────────────────────────
    if (type === 'card_fee' && meta.card_slug) {
      const { data: card, error } = await supabase.from('cards')
        .update({ status: 'active' })
        .eq('slug', meta.card_slug)
        .select('slug').maybeSingle();

      if (error) console.error('Webhook card_fee activation error:', error.message);
      else console.log('Webhook: card activated:', card?.slug || meta.card_slug);
      return;
    }

    // ── 5. gift_contribution: update contribution + card total + message ──────
    if (type === 'gift_contribution' && meta.card_id) {
      const cardId = meta.card_id;

      // Check if already processed
      const { data: existing } = await supabase.from('contributions')
        .select('id, status').eq('flw_reference', txRef).maybeSingle()
        .catch(() => ({ data: null }));

      const alreadyDone = existing?.status === 'success';

      // Upsert contribution
      if (existing) {
        await supabase.from('contributions')
          .update({ status: 'success', amount: amountNaira })
          .eq('id', existing.id);
      } else {
        await supabase.from('contributions').insert({
          card_id:           cardId,
          flw_reference:     txRef,
          amount:            amountNaira,
          contributor_name:  txn.customer?.name || '',
          contributor_email: txn.customer?.email || '',
          status:            'success',
        }).catch(e => console.warn('Webhook contribution insert:', e.message));
      }

      // Update card total_collected (only if new)
      if (!alreadyDone) {
        const { data: card } = await supabase.from('cards')
          .select('total_collected').eq('id', cardId).single()
          .catch(() => ({ data: null }));
        await supabase.from('cards')
          .update({ total_collected: (card?.total_collected || 0) + amountNaira })
          .eq('id', cardId)
          .catch(e => console.warn('Webhook total_collected:', e.message));
      }

      // Update message contributed_amount
      // Try via message_id first, then email fallback
      let msgUpdated = false;
      try {
        const { data: contrib } = await supabase.from('contributions')
          .select('message_id').eq('flw_reference', txRef).maybeSingle();
        if (contrib?.message_id) {
          await supabase.from('messages')
            .update({ payment_verified: true, contributed_amount: amountNaira })
            .eq('id', contrib.message_id);
          msgUpdated = true;
        }
      } catch (_) { /* message_id column may not exist */ }

      if (!msgUpdated && txn.customer?.email) {
        const { data: msg } = await supabase.from('messages').select('id')
          .eq('card_id', cardId).eq('author_email', txn.customer.email)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (msg) {
          await supabase.from('messages')
            .update({ payment_verified: true, contributed_amount: amountNaira })
            .eq('id', msg.id)
            .catch(e => console.warn('Webhook message update:', e.message));
        }
      }

      console.log('Webhook: gift contribution processed, cardId:', cardId, 'amount:', amountNaira);
      return;
    }

    // ── 6. company_subscription ───────────────────────────────────────────────
    if (type === 'company_subscription' && meta.company_id) {
      const companyId = meta.company_id;
      const plan      = meta.plan;
      if (!plan) { console.warn('Webhook: missing plan in subscription meta'); return; }

      const now = new Date();
      const expires_at = plan === 'yearly'
        ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
        : new Date(new Date(now).setMonth(now.getMonth() + 1));

      // Idempotency: skip if already processed
      const { data: already } = await supabase.from('company_subscriptions')
        .select('id').eq('flw_reference', txRef).maybeSingle();
      if (already) { console.log('Webhook: subscription already processed:', txRef); return; }

      const { data: existingSub } = await supabase.from('company_subscriptions')
        .select('id').eq('company_id', companyId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (existingSub) {
        await supabase.from('company_subscriptions')
          .update({ expires_at, status: 'active', flw_reference: txRef, plan, updated_at: new Date() })
          .eq('id', existingSub.id);
      } else {
        await supabase.from('company_subscriptions').insert({
          company_id: companyId, plan, status: 'active',
          amount: plan === 'yearly' ? 2400000 : 200000,
          flw_reference: txRef, starts_at: new Date(), expires_at,
        });
      }

      await supabase.from('companies')
        .update({ subscription_status: 'active', subscription_plan: plan, subscription_expires_at: expires_at })
        .eq('id', companyId)
        .catch(e => console.warn('Webhook company sub update:', e.message));

      console.log('Webhook: subscription activated, company:', companyId, 'plan:', plan);
      return;
    }

    console.log('Webhook: unhandled type:', type);

  } catch (err) {
    // 200 already sent — just log
    console.error('FLW webhook processing error:', err.message);
  }
});

module.exports = router;
