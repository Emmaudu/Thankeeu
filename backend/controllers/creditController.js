/**
 * creditController.js — Card credit system for individual users
 *
 * Plans:
 *  classic  — ₦5,000  → 1 credit
 *  standard — ₦9,000  → 2 credits
 *  pack5    — ₦19,000 → 5 credits
 *
 * Company users (HR/member/leader) get free card creation — no credits needed.
 *
 * Flow:
 *  1. User buys credits on /pricing or /dashboard/credits
 *  2. Backend creates FLW payment link (redirect_url → /create-card/verify)
 *  3. FLW redirects to /create-card/verify?tx_ref=TK-CR-...
 *  4. CardFeeVerify calls POST /api/credits/verify/:txRef
 *  5. Backend verifies FLW, adds credits to card_credits table
 *  6. Dashboard shows updated credit count
 *
 *  When creating a card with credits:
 *  POST /api/credits/spend { card_slug }
 *  → deducts 1 credit, activates card
 */

const axios    = require('axios');
const supabase = require('../utils/supabase');

const FLW_BASE    = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT = 12000;
const FLW_SUCCESS = new Set(['successful', 'completed', 'success']);

const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || '';
  for (const line of raw.split(/[\r\n]+/)) {
    const t = line.trim();
    if (t.startsWith('http')) return t.replace(/\/$/, '');
  }
  return 'https://thankeeu.com';
})();

const flwHeaders = () => ({
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const PLANS = {
  classic:  { priceNGN: 5000,  credits: 1, label: 'Classic (1 credit)'    },
  standard: { priceNGN: 9000,  credits: 2, label: 'Standard (2 credits)'  },
  pack5:    { priceNGN: 19000, credits: 5, label: 'Pack of 5 (5 credits)'  },
};

const FX = { NGN:1, USD:0.00063, GBP:0.00049, EUR:0.00058, CAD:0.00086, GHS:0.0095, KES:0.082, ZAR:0.011 };
const SUPPORTED = Object.keys(FX);

// ── GET /api/credits/balance — get user's current credit balance ─────────────
const getBalance = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { data } = await supabase.from('card_credits')
      .select('credits_remaining, total_purchased, updated_at')
      .eq('user_id', userId).maybeSingle();

    return res.json({
      credits: data?.credits_remaining || 0,
      total_purchased: data?.total_purchased || 0,
      last_updated: data?.updated_at || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── GET /api/credits/history — credit purchase history ──────────────────────
const getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { data } = await supabase.from('credit_purchases')
      .select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(20);

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── POST /api/credits/purchase — buy credits, returns FLW payment link ───────
const purchaseCredits = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { plan_type, currency: reqCurrency } = req.body;
    const plan = PLANS[plan_type];
    if (!plan) return res.status(400).json({ error: 'Invalid plan. Choose classic, standard, or pack5.' });

    const currency = SUPPORTED.includes(reqCurrency) ? reqCurrency : 'NGN';
    const amount   = currency === 'NGN' ? plan.priceNGN : parseFloat((plan.priceNGN * FX[currency]).toFixed(2));

    // Get user info
    const { data: user } = await supabase.from('users')
      .select('email, full_name').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const txRef = `TK-CR-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

    // Log purchase attempt
    await supabase.from('credit_purchases').insert({
      user_id:       userId,
      plan_type,
      credits_bought: plan.credits,
      amount_paid:   plan.priceNGN,
      currency,
      flw_reference: txRef,
      status:        'pending',
    });

    // Create FLW payment link
    const payload = {
      tx_ref:       txRef,
      amount,
      currency,
      redirect_url: `${FRONTEND_URL}/create-card/verify`,
      customer:     { email: user.email, name: user.full_name || user.email },
      customizations: {
        title:       `Thankeeu — ${plan.label}`,
        description: `${plan.credits} card credit${plan.credits > 1 ? 's' : ''}`,
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      meta: { type: 'card_credits', plan_type, credits: plan.credits, user_id: userId },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, {
      headers: flwHeaders(), timeout: FLW_TIMEOUT,
    });

    if (r.data.status !== 'success') {
      return res.status(400).json({ error: r.data.message || 'Payment gateway rejected the request' });
    }

    return res.json({ payment_link: r.data.data.link, tx_ref: txRef, plan, currency, amount });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('purchaseCredits error:', msg);
    return res.status(500).json({ error: msg || 'Failed to start payment' });
  }
};

// ── POST /api/credits/verify/:txRef — verify after FLW redirect ─────────────
// Called by CardFeeVerify.jsx after FLW redirects with ?tx_ref=TK-CR-...
const verifyPurchase = async (req, res) => {
  try {
    const txRef = req.params.txRef || req.query.tx_ref;
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required' });

    // Verify with FLW
    const r = await axios.get(
      `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: flwHeaders(), timeout: FLW_TIMEOUT }
    );
    if (r.data.status !== 'success') return res.status(400).json({ error: 'FLW verification failed' });

    const txn  = r.data.data;
    if (!FLW_SUCCESS.has(txn.status)) {
      return res.status(400).json({ error: `Payment not completed (status: ${txn.status})` });
    }

    const meta     = txn.meta || {};
    const planType = meta.plan_type;
    const credits  = Number(meta.credits) || 0;
    const userId   = meta.user_id;

    if (!planType || !credits || !userId) {
      // Fallback: find from credit_purchases table
      const { data: purchase } = await supabase.from('credit_purchases')
        .select('*').eq('flw_reference', txRef).eq('status', 'pending').maybeSingle();
      if (!purchase) {
        // May have already been processed
        const { data: done } = await supabase.from('credit_purchases')
          .select('credits_bought, user_id').eq('flw_reference', txRef).maybeSingle();
        if (done) return res.json({ ok: true, credits_added: done.credits_bought, already_processed: true });
        return res.status(404).json({ error: 'Purchase not found. Contact support with ref: ' + txRef });
      }

      // Process from purchase record
      await addCreditsToUser(purchase.user_id, purchase.credits_bought, purchase.plan_type, txRef);
      return res.json({ ok: true, credits_added: purchase.credits_bought, plan_type: purchase.plan_type });
    }

    // Idempotency check
    const { data: existing } = await supabase.from('credit_purchases')
      .select('id, status').eq('flw_reference', txRef).maybeSingle();
    if (existing?.status === 'paid') {
      return res.json({ ok: true, credits_added: credits, already_processed: true });
    }

    await addCreditsToUser(userId, credits, planType, txRef);
    return res.json({ ok: true, credits_added: credits, plan_type: planType });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('verifyPurchase error:', msg);
    return res.status(500).json({ error: msg || 'Verification failed' });
  }
};

// Helper: add credits to user's balance
// Uses an optimistic-lock retry loop to avoid a lost update if two
// concurrent purchases (different tx_refs) for the same user are verified
// at nearly the same time — a plain read-then-write would let one
// purchase's credits silently overwrite the other's.
const addCreditsToUser = async (userId, creditsToAdd, planType, txRef) => {
  const MAX_ATTEMPTS = 5;
  let success = false;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: existing } = await supabase.from('card_credits')
      .select('id, credits_remaining, total_purchased').eq('user_id', userId).maybeSingle();

    if (existing) {
      const { data: updated } = await supabase.from('card_credits').update({
        credits_remaining: (existing.credits_remaining || 0) + creditsToAdd,
        total_purchased:   (existing.total_purchased   || 0) + creditsToAdd,
        plan_type_v2:      planType,
        updated_at:        new Date(),
      })
        .eq('id', existing.id)
        .eq('credits_remaining', existing.credits_remaining) // optimistic lock
        .select('id').maybeSingle();

      if (updated) { success = true; break; }
      // Lock missed (concurrent update in between) — retry with fresh balance
      continue;
    } else {
      const { error: insertErr } = await supabase.from('card_credits').insert({
        user_id:           userId,
        credits_remaining: creditsToAdd,
        total_purchased:   creditsToAdd,
        plan_type_v2:      planType,
        flw_reference:     txRef,
      });
      if (!insertErr) { success = true; break; }
      // Insert failed (likely a row was created concurrently — unique
      // constraint on user_id) — retry, which will now find `existing`
      if (attempt === MAX_ATTEMPTS - 1) console.error('addCreditsToUser: insert failed after retries:', insertErr.message);
    }
  }

  if (!success) {
    // All attempts hit lock collisions — don't silently mark the purchase
    // 'paid' while the balance was never actually updated, or the user
    // would lose the credits they paid for with no way to retry (verify
    // is gated by status !== 'paid'). Leave status as-is so a retry of
    // verifyPurchase can pick it up again.
    console.error(`addCreditsToUser: FAILED to add ${creditsToAdd} credits for user ${userId} (txRef ${txRef}) after ${MAX_ATTEMPTS} attempts — purchase NOT marked paid, safe to retry.`);
    return;
  }

  // Mark purchase as paid
  await supabase.from('credit_purchases')
    .update({ status: 'paid' }).eq('flw_reference', txRef);
};

// ── POST /api/credits/spend — deduct 1 credit to activate a card ────────────
const spendCredit = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { card_slug } = req.body;
    if (!card_slug) return res.status(400).json({ error: 'card_slug is required' });

    // Check balance
    const { data: balance } = await supabase.from('card_credits')
      .select('id, credits_remaining').eq('user_id', userId).maybeSingle();

    if (!balance || (balance.credits_remaining || 0) < 1) {
      return res.status(400).json({
        error: 'Not enough credits. Buy credits to activate this card.',
        credits_remaining: balance?.credits_remaining || 0,
      });
    }

    // Verify card belongs to this user — column is 'creator_id' not 'created_by'
    const { data: card, error: cardErr } = await supabase.from('cards')
      .select('id, slug, status, creator_id').eq('slug', card_slug).maybeSingle();

    if (cardErr) {
      console.error('spendCredit card lookup error:', cardErr.message);
      return res.status(500).json({ error: 'Database error looking up card' });
    }
    if (!card) return res.status(404).json({ error: `Card not found: ${card_slug}` });
    if (card.creator_id !== userId) return res.status(403).json({ error: 'This card was not created by your account' });
    if (card.status === 'active') return res.status(400).json({ error: 'This card is already active' });

    // Deduct credit first, then activate
    const { data: deducted, error: deductErr } = await supabase.from('card_credits')
      .update({ credits_remaining: balance.credits_remaining - 1, updated_at: new Date() })
      .eq('id', balance.id)
      .eq('credits_remaining', balance.credits_remaining) // optimistic lock
      .select('id')
      .maybeSingle();

    if (deductErr) {
      console.error('spendCredit deduct error:', deductErr.message);
      return res.status(500).json({ error: 'Failed to deduct credit. Please try again.' });
    }

    // If the optimistic lock didn't match any row, the balance changed
    // between our read and write (e.g. a concurrent spend on another card) —
    // do NOT activate the card on a stale balance.
    if (!deducted) {
      return res.status(409).json({ error: 'Your credit balance just changed — please try again.' });
    }

    // Activate the card
    const { error: activateErr } = await supabase.from('cards')
      .update({ status: 'active' }).eq('slug', card_slug);
    if (activateErr) {
      // Refund the credit if activation fails
      await supabase.from('card_credits')
        .update({ credits_remaining: balance.credits_remaining, updated_at: new Date() })
        .eq('id', balance.id);
      return res.status(500).json({ error: 'Card activation failed. Credit has been refunded.' });
    }

    return res.json({
      ok: true,
      card_slug,
      credits_remaining: balance.credits_remaining - 1,
      message: '1 credit used. Card is now active!',
    });

  } catch (err) {
    console.error('spendCredit error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to spend credit' });
  }
};

module.exports = { getBalance, getHistory, purchaseCredits, verifyPurchase, spendCredit };
