const axios = require('axios');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const PAYSTACK_BASE = 'https://api.paystack.co';
const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json'
});

// Initialize card purchase (single card $5 or pack of 5 $20)
const initializeCardPurchase = async (req, res) => {
  try {
    const { plan_type } = req.body;
    // USD prices: single=$5, pack5=$20, business=$50
    // Converted to NGN at 1600/USD, then to kobo (*100)
    const amounts = { single: 500000, pack5: 1000000, business: 20000000 }; // kobo — NGN: single=₦5k, pack=₦10k, business=₦200k
    const amount = amounts[plan_type];
    if (!amount) return res.status(400).json({ error: 'Invalid plan type' });

    const response = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: req.user.email,
      amount,
      metadata: {
        user_id: req.user.id,
        plan_type,
        type: 'card_purchase',
        custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: plan_type }]
      },
      callback_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`
    }, { headers: paystackHeaders() });

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

// Initialize gift contribution
const initializeContribution = async (req, res) => {
  try {
    const { card_slug, contributor_name, contributor_email, amount, message_id } = req.body;

    if (!contributor_email) return res.status(400).json({ error: 'Email required for payment' });
    if (amount < 2500) return res.status(400).json({ error: 'Minimum contribution is ₦2,500' });

    const { data: card } = await supabase.from('cards').select('id, recipient_name, occasion').eq('slug', card_slug).single();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Create pending contribution record
    const { data: contribution } = await supabase.from('contributions').insert({
      card_id: card.id,
      message_id: message_id || null,
      contributor_name,
      contributor_email,
      amount,
      status: 'pending'
    }).select().single();

    const response = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: contributor_email,
      amount: amount * 100, // convert to kobo
      metadata: {
        contribution_id: contribution.id,
        card_id: card.id,
        card_slug,
        contributor_name,
        type: 'gift_contribution',
        custom_fields: [
          { display_name: 'Recipient', variable_name: 'recipient', value: card.recipient_name },
          { display_name: 'Occasion', variable_name: 'occasion', value: card.occasion }
        ]
      },
      callback_url: `${process.env.FRONTEND_URL}/sign/${card_slug}?contributed=true`
    }, { headers: paystackHeaders() });

    await supabase.from('contributions').update({
      paystack_reference: response.data.data.reference,
      paystack_access_code: response.data.data.access_code
    }).eq('id', contribution.id);

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to initialize contribution' });
  }
};

// Verify payment (called by frontend after redirect)
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: paystackHeaders()
    });

    const txn = response.data.data;
    if (txn.status !== 'success') return res.status(400).json({ error: 'Payment not successful' });

    const { type, contribution_id, user_id, plan_type, card_id, card_slug } = txn.metadata;

    if (type === 'gift_contribution' && contribution_id) {
      const { data: contribution } = await supabase
        .from('contributions')
        .update({ status: 'success', paystack_reference: reference })
        .eq('id', contribution_id)
        .select()
        .single();

      // Update card total
      await supabase.from('cards')
        .update({ total_collected: supabase.rpc('increment', { x: contribution.amount }) })
        .eq('id', card_id);

      // Actually increment using raw update
      const { data: card } = await supabase.from('cards').select('total_collected').eq('id', card_id).single();
      await supabase.from('cards').update({ total_collected: (card?.total_collected || 0) + contribution.amount }).eq('id', card_id);

      return res.json({ success: true, type: 'contribution', amount: contribution.amount });
    }

    if (type === 'card_purchase' && user_id) {
      const credits = plan_type === 'pack5' ? 5 : 1;
      const { data: existing } = await supabase.from('card_credits').select('*').eq('user_id', user_id).maybeSingle();

      if (existing) {
        await supabase.from('card_credits').update({
          credits_remaining: existing.credits_remaining + credits,
          paystack_reference: reference
        }).eq('user_id', user_id);
      } else {
        await supabase.from('card_credits').insert({
          user_id, credits_remaining: credits, paystack_reference: reference, plan_type
        });
      }

      return res.json({ success: true, type: 'card_purchase', credits_added: credits });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Paystack webhook
const webhook = async (req, res) => {
  try {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body)).digest('hex');

    if (hash !== req.headers['x-paystack-signature'])
      return res.status(400).send('Invalid signature');

    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, metadata, amount } = event.data;
      const { type, contribution_id, user_id, plan_type, card_id } = metadata;

      if (type === 'gift_contribution' && contribution_id) {
        await supabase.from('contributions').update({ status: 'success' }).eq('id', contribution_id);
        const amountNaira = amount / 100;
        const { data: card } = await supabase.from('cards').select('total_collected').eq('id', card_id).single();
        await supabase.from('cards').update({ total_collected: (card?.total_collected || 0) + amountNaira }).eq('id', card_id);
      }

      if (type === 'card_purchase' && user_id) {
        const credits = plan_type === 'pack5' ? 5 : plan_type === 'business' ? 999 : 1;
        const { data: existing } = await supabase.from('card_credits').select('*').eq('user_id', user_id).maybeSingle();
        if (existing) {
          await supabase.from('card_credits').update({ credits_remaining: existing.credits_remaining + credits }).eq('user_id', user_id);
        } else {
          await supabase.from('card_credits').insert({ user_id, credits_remaining: credits, plan_type });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
};

module.exports = { initializeCardPurchase, initializeContribution, verifyPayment, webhook };
