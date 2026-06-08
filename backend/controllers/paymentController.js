const axios = require('axios');
const crypto = require('crypto');
const supabase = require('../utils/supabase');

const PAYSTACK_BASE = 'https://api.paystack.co';
const PAYSTACK_TIMEOUT_MS = 10000;
const PLAN_CREDITS = { single: 1, pack5: 5, business: 999 };
const PLAN_AMOUNTS = { single: 500000, pack5: 2000000, business: 20000000 };
const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json'
});

const grantCardCredits = async ({ userId, planType, reference }) => {
  const credits = PLAN_CREDITS[planType] || 1;
  const { data: existing, error: lookupError } = await supabase
    .from('card_credits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.paystack_reference === reference) {
    return { credits, alreadyProcessed: true };
  }

  if (existing) {
    const { error } = await supabase.from('card_credits').update({
      credits_remaining: existing.credits_remaining + credits,
      paystack_reference: reference,
      plan_type: planType
    }).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('card_credits').insert({
      user_id: userId,
      credits_remaining: credits,
      paystack_reference: reference,
      plan_type: planType
    });
    if (error) throw error;
  }

  return { credits, alreadyProcessed: false };
};

const verifyContribution = async ({ contributionId, reference, transaction }) => {
  const { data: contribution, error: lookupError } = await supabase
    .from('contributions')
    .select('*')
    .eq('id', contributionId)
    .single();

  if (lookupError || !contribution) throw lookupError || new Error('Contribution not found');
  if (transaction) {
    if (transaction.status !== 'success') throw new Error('Payment not successful');
    if (transaction.currency !== 'NGN') throw new Error('Invalid contribution currency');
    if (transaction.amount !== contribution.amount * 100) throw new Error('Contribution amount does not match');
    if (transaction.metadata?.contribution_id !== contribution.id) throw new Error('Invalid contribution reference');
  }
  if (contribution.status === 'success') {
    return { contribution, alreadyProcessed: true };
  }

  const { data: updated, error } = await supabase
    .from('contributions')
    .update({ status: 'success', paystack_reference: reference })
    .eq('id', contributionId)
    .select()
    .single();

  if (error) throw error;
  if (updated.message_id) {
    // Try updating with payment columns, fall back without if they don't exist
    let messageError;
    ({ error: messageError } = await supabase
      .from('messages')
      .update({ contributed_amount: updated.amount, payment_reference: reference, payment_verified: true })
      .eq('id', updated.message_id));
    if (messageError && messageError.message &&
      (messageError.message.includes('payment_verified') || messageError.message.includes('payment_reference'))) {
      ({ error: messageError } = await supabase
        .from('messages')
        .update({ contributed_amount: updated.amount })
        .eq('id', updated.message_id));
    }
    if (messageError) throw messageError;
  }
  return { contribution: updated, alreadyProcessed: false };
};

const activatePurchasedCard = async ({ cardSlug, userId, reference }) => {
  // Select card — try with payment columns, fall back without
  let card, cardError;
  ({ data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('slug', cardSlug)
    .eq('creator_id', userId)
    .single());

  if (cardError || !card) throw cardError || new Error('Paid card could not be found');

  // If payment_verified exists and is true, card already paid
  if (card.payment_verified) {
    if (card.payment_reference && card.payment_reference !== reference) {
      throw new Error('Card was already paid with a different transaction');
    }
    return { card, alreadyProcessed: true };
  }

  // Activate the card — try full update, fall back to minimal if columns missing
  const fullUpdate = {
    status: 'active',
    payment_reference: reference,
    payment_verified: true,
    updated_at: new Date()
  };

  let activated, activateError;
  ({ data: activated, error: activateError } = await supabase
    .from('cards')
    .update(fullUpdate)
    .eq('slug', cardSlug)
    .eq('creator_id', userId)
    .select('*')
    .single());

  // If payment columns don't exist, retry with just status update
  if (activateError && activateError.message &&
    (activateError.message.includes('payment_verified') || activateError.message.includes('payment_reference'))) {
    ({ data: activated, error: activateError } = await supabase
      .from('cards')
      .update({ status: 'active', updated_at: new Date() })
      .eq('slug', cardSlug)
      .eq('creator_id', userId)
      .select('*')
      .single());
  }

  if (activateError) throw activateError;
  return { card: activated, alreadyProcessed: false };
};

const fetchPaystackTransaction = async reference => {
  const response = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: paystackHeaders(), timeout: PAYSTACK_TIMEOUT_MS }
  );
  return response.data.data;
};

const validateCardPurchase = ({ txn, userId }) => {
  const { type, user_id, plan_type, card_slug } = txn.metadata || {};
  if (txn.status !== 'success') throw new Error('Payment not successful');
  if (type !== 'card_purchase' || !user_id) throw new Error('Invalid card purchase');
  if (userId && user_id !== userId) throw new Error('Payment does not belong to this account');
  if (txn.currency !== 'NGN') throw new Error('Invalid payment currency');
  if (!PLAN_AMOUNTS[plan_type] || txn.amount !== PLAN_AMOUNTS[plan_type]) {
    throw new Error('Payment amount does not match the selected plan');
  }
  return { userId: user_id, planType: plan_type, cardSlug: card_slug };
};

// Initialize card purchase in Nigerian naira (Paystack receives kobo).
const initializeCardPurchase = async (req, res) => {
  try {
    const { plan_type, card_slug } = req.body;
    const amount = PLAN_AMOUNTS[plan_type];
    if (!amount) return res.status(400).json({ error: 'Invalid plan type' });

    if (card_slug) {
      // Try select with payment_verified, fall back to without if column doesn't exist
      let card, cardErr;
      ({ data: card, error: cardErr } = await supabase
        .from('cards')
        .select('slug, creator_id, status, payment_verified')
        .eq('slug', card_slug)
        .single());

      // If payment_verified column doesn't exist, retry without it
      if (cardErr && cardErr.message && cardErr.message.includes('payment_verified')) {
        ({ data: card, error: cardErr } = await supabase
          .from('cards')
          .select('slug, creator_id, status')
          .eq('slug', card_slug)
          .single());
      }

      if (cardErr || !card || card.creator_id !== req.user.id) {
        return res.status(403).json({ error: 'Card is not available for this payment' });
      }
      if (card.payment_verified) {
        return res.json({ already_active: true, card_slug: card.slug });
      }
      if (card.status !== 'draft') {
        return res.status(400).json({ error: 'Card cannot be purchased in its current state' });
      }
    }

    const frontendUrl = (req.get('origin') || process.env.FRONTEND_URL || process.env.APP_URL || '').replace(/\/$/, '');
    if (!frontendUrl) return res.status(500).json({ error: 'Payment callback URL is not configured' });

    const response = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: req.user.email,
      amount,
      metadata: {
        user_id: req.user.id,
        plan_type,
        type: 'card_purchase',
        ...(card_slug && { card_slug }),
        custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: plan_type }]
      },
      callback_url: `${frontendUrl}/dashboard?payment=success`
    }, { headers: paystackHeaders(), timeout: PAYSTACK_TIMEOUT_MS });

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

// Verify an authenticated card purchase immediately after Paystack succeeds.
const verifyPurchase = async (req, res) => {
  try {
    const txn = await fetchPaystackTransaction(req.params.reference);
    const purchase = validateCardPurchase({ txn, userId: req.user.id });

    if (purchase.cardSlug) {
      const result = await activatePurchasedCard({
        cardSlug: purchase.cardSlug,
        userId: purchase.userId,
        reference: txn.reference
      });
      return res.json({
        success: true,
        type: 'card_purchase',
        card_slug: purchase.cardSlug,
        card_activated: true,
        already_processed: result.alreadyProcessed
      });
    }

    const result = await grantCardCredits({
      userId: purchase.userId,
      planType: purchase.planType,
      reference: txn.reference
    });
    res.json({
      success: true,
      type: 'card_purchase',
      credits_added: result.alreadyProcessed ? 0 : result.credits,
      already_processed: result.alreadyProcessed
    });
  } catch (err) {
    console.error(err.response?.data || err);
    const message = err.response ? 'Failed to verify payment' : err.message;
    res.status(400).json({ error: message || 'Failed to verify payment' });
  }
};

// Initialize gift contribution
const initializeContribution = async (req, res) => {
  try {
    const { card_slug, contributor_name, contributor_email, amount, message_id } = req.body;

    if (!contributor_email) return res.status(400).json({ error: 'Email required for payment' });
    if (amount < 2500) return res.status(400).json({ error: 'Minimum contribution is ₦2,500' });

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, recipient_name, occasion')
      .eq('slug', card_slug)
      .single();
    if (cardError || !card) return res.status(404).json({ error: 'Card not found' });

    // Create pending contribution record
    const { data: contribution, error: contributionError } = await supabase.from('contributions').insert({
      card_id: card.id,
      message_id: message_id || null,
      contributor_name,
      contributor_email,
      amount,
      status: 'pending'
    }).select().single();
    if (contributionError) throw contributionError;

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
      callback_url: `${req.get('origin') || process.env.FRONTEND_URL || 'https://thankeeu.com'}/sign/${card_slug}?contributed=true`
    }, { headers: paystackHeaders(), timeout: PAYSTACK_TIMEOUT_MS });

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

    const txn = await fetchPaystackTransaction(reference);
    if (txn.status !== 'success') return res.status(400).json({ error: 'Payment not successful' });

    const { type, contribution_id, user_id, plan_type, card_slug } = txn.metadata || {};

    if (type === 'gift_contribution' && contribution_id) {
      const result = await verifyContribution({ contributionId: contribution_id, reference, transaction: txn });
      return res.json({
        success: true,
        type: 'contribution',
        amount: result.contribution.amount,
        already_processed: result.alreadyProcessed
      });
    }

    if (type === 'card_purchase') {
      return res.status(401).json({ error: 'Sign in to verify this card purchase' });
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
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody).digest('hex');

    if (hash !== req.headers['x-paystack-signature'])
      return res.status(400).send('Invalid signature');

    const event = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString('utf8'))
      : req.body;
    if (event.event === 'charge.success') {
      const { reference, metadata = {} } = event.data;
      const { type, contribution_id, card_slug, user_id } = metadata;

      if (type === 'gift_contribution' && contribution_id) {
        await verifyContribution({ contributionId: contribution_id, reference, transaction: event.data });
      }
      if (type === 'card_purchase' && card_slug && user_id) {
        const purchase = validateCardPurchase({ txn: event.data });
        await activatePurchasedCard({
          cardSlug: purchase.cardSlug,
          userId: purchase.userId,
          reference
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
};

module.exports = {
  initializeCardPurchase, initializeContribution, verifyPurchase, verifyPayment, webhook
};
