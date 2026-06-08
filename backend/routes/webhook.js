/**
 * Paystack Webhook Route
 * Handles payment.success events so subscription activates even
 * if the browser redirect fails (user closes popup, bad network, etc.)
 */
const express  = require('express');
const crypto   = require('crypto');
const router   = express.Router();
const supabase = require('../utils/supabase');

router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Verify webhook signature
    const secret    = process.env.PAYSTACK_SECRET_KEY || '';
    const signature = req.headers['x-paystack-signature'];
    const hash      = crypto.createHmac('sha512', secret).update(req.body).digest('hex');

    if (signature !== hash) {
      console.warn('Paystack webhook: invalid signature');
      return res.sendStatus(400);
    }

    const event = JSON.parse(req.body.toString());
    console.log('Paystack webhook event:', event.event, event.data?.reference);

    // 2. Only handle successful charges
    if (event.event !== 'charge.success') return res.sendStatus(200);

    const txn      = event.data;
    const meta     = txn.metadata || {};
    const type     = meta.type;

    // 3. Handle company subscriptions
    if (type === 'company_subscription') {
      const companyId = meta.company_id;
      const plan      = meta.plan;

      if (!companyId || !plan) {
        console.warn('Webhook: missing company_id or plan in metadata');
        return res.sendStatus(200);
      }

      const PLANS = {
        monthly: { naira: 200000 },
        yearly:  { naira: 2400000 },
      };

      const now = new Date();
      const expires_at = plan === 'yearly'
        ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
        : new Date(new Date(now).setMonth(now.getMonth() + 1));

      // Upsert subscription
      const { data: existing } = await supabase
        .from('company_subscriptions')
        .select('id')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase.from('company_subscriptions').update({
          expires_at, status: 'active', paystack_reference: txn.reference,
          plan, updated_at: new Date()
        }).eq('id', existing.id);
      } else {
        await supabase.from('company_subscriptions').insert({
          company_id: companyId, plan, status: 'active',
          amount:     PLANS[plan]?.naira || 200000,
          paystack_reference: txn.reference,
          starts_at:  new Date(), expires_at
        });
      }

      // Update company row
      await supabase.from('companies')
        .update({
          subscription_status:     'active',
          subscription_plan:        plan,
          subscription_expires_at:  expires_at,
        })
        .eq('id', companyId)
        .catch(e => console.warn('Webhook: company update warn:', e.message));

      console.log(`Webhook: subscription activated for company ${companyId}, plan=${plan}`);
    }

    // 4. Handle gift contributions (card payments)
    if (type === 'gift_contribution') {
      const cardId   = meta.card_id;
      const amount   = txn.amount / 100; // kobo → naira
      const ref      = txn.reference;

      if (cardId) {
        // Mark contribution as success
        await supabase.from('contributions')
          .update({ status: 'success' })
          .eq('paystack_reference', ref)
          .catch(() => {});

        // Update card total_collected
        const { data: card } = await supabase.from('cards')
          .select('total_collected').eq('id', cardId).single();

        if (card) {
          await supabase.from('cards')
            .update({ total_collected: (card.total_collected || 0) + amount })
            .eq('id', cardId)
            .catch(() => {});
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
