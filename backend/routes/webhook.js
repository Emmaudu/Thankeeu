/**
 * Flutterwave Webhook Route
 * Handles payment events so subscription/contributions activate
 * even if the browser redirect fails.
 */
const express  = require('express');
const crypto   = require('crypto');
const router   = express.Router();
const supabase = require('../utils/supabase');

router.post('/flutterwave', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Verify webhook signature
    const secret    = process.env.FLW_SECRET_HASH || process.env.FLW_SECRET_KEY || '';
    const signature = req.headers['verif-hash'];

    if (!signature || signature !== secret) {
      console.warn('Flutterwave webhook: invalid signature');
      return res.sendStatus(401);
    }

    const event = JSON.parse(req.body.toString());
    const { event: eventName, data: txn } = event;
    console.log('FLW webhook event:', eventName, txn?.tx_ref);

    // 2. Only handle successful charges
    if (eventName !== 'charge.completed' || txn.status !== 'successful') return res.sendStatus(200);

    const meta     = txn.meta || {};
    const type     = meta.type;
    const txRef    = txn.tx_ref;
    const amountNaira = Math.floor(txn.amount);

    // 3. Handle company subscriptions
    if (type === 'company_subscription') {
      const companyId = meta.company_id;
      const plan      = meta.plan;
      if (!companyId || !plan) { console.warn('Webhook: missing company_id or plan'); return res.sendStatus(200); }

      const PLANS = { monthly: { naira: 200000 }, yearly: { naira: 2400000 } };
      const now = new Date();
      const expires_at = plan === 'yearly'
        ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
        : new Date(new Date(now).setMonth(now.getMonth() + 1));

      const { data: existing } = await supabase.from('company_subscriptions')
        .select('id').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (existing) {
        await supabase.from('company_subscriptions')
          .update({ expires_at, status: 'active', flw_reference: txRef, plan, updated_at: new Date() })
          .eq('id', existing.id);
      } else {
        await supabase.from('company_subscriptions').insert({
          company_id: companyId, plan, status: 'active', amount: PLANS[plan]?.naira || 200000,
          flw_reference: txRef, starts_at: new Date(), expires_at,
        });
      }

      await supabase.from('companies')
        .update({ subscription_status: 'active', subscription_plan: plan, subscription_expires_at: expires_at })
        .eq('id', companyId)
        .catch(e => console.warn('Webhook company update:', e.message));

      console.log(`Webhook: subscription activated for company ${companyId}, plan=${plan}`);
    }

    // 4. Handle gift contributions
    if (type === 'gift_contribution' && meta.card_id) {
      const cardId = meta.card_id;

      // Update or create contribution
      const { data: existing } = await supabase.from('contributions')
        .select('id').eq('flw_reference', txRef).maybeSingle();

      if (existing) {
        await supabase.from('contributions').update({ status: 'success', amount: amountNaira }).eq('id', existing.id);
      } else {
        await supabase.from('contributions').insert({
          card_id: cardId, flw_reference: txRef, amount: amountNaira,
          contributor_name: txn.customer?.name, contributor_email: txn.customer?.email,
          status: 'success',
        });
      }

      // Update card total_collected
      const { data: card } = await supabase.from('cards').select('total_collected').eq('id', cardId).single();
      if (card) {
        await supabase.from('cards').update({ total_collected: (card.total_collected || 0) + amountNaira }).eq('id', cardId);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('FLW Webhook error:', err);
    res.sendStatus(500);
  }
});

// Keep old paystack path as 404 redirect hint
router.post('/paystack', (req, res) => res.status(410).json({ error: 'Paystack webhooks no longer active. Use /webhook/flutterwave' }));

module.exports = router;
