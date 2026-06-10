const axios   = require('axios');
const supabase = require('../utils/supabase');

const FLW_BASE     = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT  = 10000;
// Use FRONTEND_URL (Vercel) for redirect_url — APP_URL is the Railway backend
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.APP_URL || 'https://thankeeu.com').replace(/\/$/, '');

const crypto = require('crypto');

const flwHeaders = () => ({
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

/**
 * generateIntegrityHash
 * Creates an HMAC-SHA256 signature of the checkout payload using FLW_ENCRYPTION_KEY.
 * Passed as `meta.integrity_hash` to the frontend FlutterwaveCheckout() call.
 * Flutterwave verifies this before processing — prevents users tampering with
 * amount/tx_ref in the browser.
 *
 * @param {object} payload - The exact same payload sent to FlutterwaveCheckout on frontend
 * @returns {string} hex-encoded HMAC signature
 */
const generateIntegrityHash = (payload) => {
  const encKey = process.env.FLW_ENCRYPTION_KEY;
  if (!encKey) {
    console.warn('FLW_ENCRYPTION_KEY not set — integrity hash skipped');
    return null;
  }
  return crypto
    .createHmac('sha256', encKey)
    .update(JSON.stringify(payload))
    .digest('hex');
};

// ── helpers ──────────────────────────────────────────────────────────────────

const fetchFlwTransaction = async (txRef) => {
  if (!txRef || !txRef.trim()) throw new Error('Transaction reference is required');
  try {
    const r = await axios.get(
      `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef.trim())}`,
      { headers: flwHeaders(), timeout: FLW_TIMEOUT }
    );
    if (r.data.status !== 'success') {
      const msg = r.data.message || 'Payment verification failed';
      const err = new Error(msg);
      err.flwStatus = r.data.status;
      throw err;
    }
    return r.data.data;
  } catch (err) {
    // Bug 9 fix: rethrow with clear message if FLW returns 4xx
    if (err.response?.status === 404) throw new Error('Transaction not found. It may still be processing — please wait and retry.');
    if (err.response?.status === 400) throw new Error(err.response.data?.message || 'Invalid transaction reference');
    if (err.code === 'ECONNABORTED') throw new Error('Payment gateway timeout — please try again');
    throw err;
  }
};

// ── upsert contribution record ─────────────────────────────────────────────
// RC3+RC4 fix: use Supabase native upsert on flw_reference to avoid race-condition duplicates
const upsertContribution = async ({ cardId, txRef, amount, contributorName, contributorEmail, status = 'pending', messageId = null }) => {
  const row = {
    card_id: cardId,
    flw_reference: txRef,
    amount,
    contributor_name: contributorName,
    contributor_email: contributorEmail,
    status,
    ...(messageId ? { message_id: messageId } : {}),
  };
  // onConflict on flw_reference prevents duplicate rows (requires unique index - see migration)
  const { data, error } = await supabase
    .from('contributions')
    .upsert(row, { onConflict: 'flw_reference', ignoreDuplicates: false })
    .select()
    .single();
  if (error) {
    // Fallback: if unique index not yet created, do manual check
    const { data: existing } = await supabase
      .from('contributions').select('id').eq('flw_reference', txRef).maybeSingle();
    if (existing) {
      const updateData = { status, amount };
      if (messageId) updateData.message_id = messageId;
      const { data: updated } = await supabase.from('contributions')
        .update(updateData).eq('id', existing.id).select().single();
      return updated;
    }
    const { data: inserted } = await supabase.from('contributions').insert(row).select().single();
    return inserted;
  }
  return data;
};

// ── Initialize card purchase / gift contribution ───────────────────────────
// POST /api/payments/initialize
const initializePayment = async (req, res) => {
  try {
    const {
      card_id, card_slug, amount, email, name,
      type = 'card_purchase', // 'card_purchase' | 'gift_contribution'
    } = req.body;

    if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum amount is ₦100' });
    if (!email)                  return res.status(400).json({ error: 'Email is required' });

    const txRef = `TK-${type === 'gift_contribution' ? 'GIFT' : 'CARD'}-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const amountNaira = Number(amount);

    const payload = {
      tx_ref:          txRef,
      amount:          amountNaira,
      currency:        'NGN',
      redirect_url:    `${FRONTEND_URL}/payment/callback`,
      customer:        { email, name: name || email },
      customizations:  { title: 'Thankeeu', logo: `${process.env.APP_URL}/logo.png` },
      meta: {
        type,
        card_id:   card_id   || null,
        card_slug: card_slug || null,
        user_id:   req.user?.id || req.member?.id || null,
      },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success') throw new Error(r.data.message);

    // Pre-create pending contribution record for gift payments
    if (type === 'gift_contribution' && card_id) {
      await upsertContribution({ cardId: card_id, txRef, amount: amountNaira, contributorName: name, contributorEmail: email });
    }

    res.json({
      payment_link:    r.data.data.link,
      tx_ref:          txRef,
      reference:       txRef, // backwards compat
    });
  } catch (err) {
    console.error('initializePayment error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Payment initialization failed' });
  }
};

// POST /api/payments/verify/:txRef  — called after redirect
const verifyPayment = async (req, res) => {
  try {
    const txRef = req.params.txRef || req.params.reference;
    const txn   = await fetchFlwTransaction(txRef);

    const status = txn.status; // 'successful' | 'failed' | 'cancelled'
    const meta   = txn.meta || {};
    const type   = meta.type;

    if (status !== 'successful') {
      return res.status(400).json({ error: `Payment not completed (status: ${status})` });
    }

    if (type === 'card_fee') {
      // Bug 6 fix: find card by meta.card_slug or fallback to payment_ref
      const cardQuery = meta.card_slug
        ? supabase.from('cards').update({ status: 'active' }).eq('slug', meta.card_slug).select('slug, id').single()
        : supabase.from('cards').update({ status: 'active' }).eq('payment_ref', txRef).select('slug, id').single();

      const { data: card, error: cardErr } = await cardQuery;
      if (cardErr || !card) {
        console.error('Card activation failed — slug:', meta.card_slug, 'txRef:', txRef, 'err:', cardErr?.message);
        return res.status(404).json({ error: 'Card not found for activation. Payment was received — please contact support with reference: ' + txRef });
      }
      return res.json({ status: 'success', type, card_slug: card.slug, meta });
    }

    if (type === 'gift_contribution' && meta.card_id) {
      const amountNaira = Math.floor(txn.amount);
      // Bug 9 fix: also look up card_id from contributions table in case meta was truncated by FLW
      const effectiveCardId = meta.card_id || await (async () => {
        const { data: existing } = await supabase.from('contributions')
          .select('card_id').eq('flw_reference', txRef).maybeSingle().catch(() => ({ data: null }));
        return existing?.card_id;
      })();

      // Bug 5 fix: check double-count BEFORE upserting (same guard as verifyContribution)
      const { data: existingC } = await supabase.from('contributions')
        .select('id, status').eq('flw_reference', txRef).maybeSingle().catch(() => ({ data: null }));
      const alreadyDone = existingC?.status === 'success';

      await upsertContribution({
        cardId: effectiveCardId, txRef, amount: amountNaira,
        contributorName: txn.customer?.name, contributorEmail: txn.customer?.email,
        status: 'success',
      });

      if (effectiveCardId && !alreadyDone) {
        const { data: cardRow } = await supabase.from('cards').select('total_collected')
          .eq('id', effectiveCardId).single().catch(() => ({ data: null }));
        await supabase.from('cards')
          .update({ total_collected: (cardRow?.total_collected || 0) + amountNaira })
          .eq('id', effectiveCardId).catch(e => console.error('total_collected:', e.message));
      }

      // Update message: mark payment verified and record contribution amount
      let msgUpdated = false;
      try {
        const { data: contribution } = await supabase
          .from('contributions').select('message_id').eq('flw_reference', txRef).maybeSingle();
        if (contribution?.message_id) {
          await supabase.from('messages')
            .update({ payment_verified: true, contributed_amount: amountNaira })
            .eq('id', contribution.message_id);
          msgUpdated = true;
        }
      } catch (e) { /* message_id column may not exist yet */ }

      // Bug 4 fix: use effectiveCardId not meta.card_id (meta.card_id may be null)
      if (!msgUpdated && txn.customer?.email && effectiveCardId) {
        const { data: msg } = await supabase
          .from('messages').select('id')
          .eq('card_id', effectiveCardId)
          .eq('author_email', txn.customer.email)
          .order('created_at', { ascending: false })
          .limit(1).maybeSingle();
        if (msg) {
          await supabase.from('messages')
            .update({ payment_verified: true, contributed_amount: amountNaira })
            .eq('id', msg.id)
            .catch(() => {});
        }
      }

      // Bug 5 fix: return card_id so caller can confirm which card was updated
      return res.json({ status: 'success', type, card_id: effectiveCardId, meta, amount: txn.amount });
    }

    res.json({ status: 'success', type, meta, amount: txn.amount });
  } catch (err) {
    console.error('verifyPayment error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Verification failed' });
  }
};

// POST /api/payments/contribution — initialize a gift contribution
const initContribution = async (req, res) => {
  try {
    const { card_slug, amount, contributor_name, contributor_email, message_id } = req.body;
    if (!card_slug || !amount || !contributor_email)
      return res.status(400).json({ error: 'card_slug, amount and email are required' });
    if (amount < 2500)
      return res.status(400).json({ error: 'Minimum gift amount is ₦2,500' });

    const { data: card } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, is_gift_enabled, status').eq('slug', card_slug).single();
    if (!card || !card.is_gift_enabled) return res.status(400).json({ error: 'Gift contributions not enabled for this card' });
    // Bug 8 fix: block contributions on draft cards (creator hasn't paid the activation fee yet)
    if (card.status === 'draft') return res.status(400).json({ error: 'This card is not yet active. The card creator needs to complete their payment first.' });
    if (card.status === 'sent') return res.status(400).json({ error: 'This card has already been delivered — contributions are now closed.' });

    const txRef = `TK-GIFT-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const amountNaira = Number(amount);

    const payload = {
      tx_ref:         txRef,
      amount:         amountNaira,
      currency:       'NGN',
      redirect_url:   `${FRONTEND_URL}/sign/${card_slug}?contributed=1`,
      customer:       { email: contributor_email, name: contributor_name || contributor_email },
      customizations: {
        title: `Gift for ${card.recipient_name}`,
        description: `Contribute to ${card.title || card.recipient_name + "'s card"}`,
        logo: `${process.env.APP_URL}/logo.png`,
      },
      meta: { type: 'gift_contribution', card_id: card.id, card_slug },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success') throw new Error(r.data.message);

    // Pre-create pending contribution
    await upsertContribution({ cardId: card.id, txRef, amount: amountNaira, contributorName: contributor_name, contributorEmail: contributor_email, messageId: message_id || null });

    res.json({
      payment_link:  r.data.data.link,
      tx_ref:        txRef,
    });
  } catch (err) {
    console.error('initContribution error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to initialize contribution' });
  }
};

// GET /api/payments/verify-contribution/:txRef  (after FLW redirect)
// POST /api/payments/verify-contribution         (manual call with body)
const verifyContribution = async (req, res) => {
  try {
    // Support both GET (params) and POST (body)
    const txRef = req.params.txRef || req.body?.tx_ref || req.body?.reference || req.query.tx_ref;
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required' });
    const txn   = await fetchFlwTransaction(txRef);

    if (txn.status !== 'successful') return res.status(400).json({ error: 'Payment not successful' });

    const meta        = txn.meta || {};
    const amountNaira = Math.floor(txn.amount);

    // Bug 10 fix: check if this contribution was already counted to prevent double-count
    const { data: existingContrib } = await supabase.from('contributions')
      .select('id, status').eq('flw_reference', txRef).maybeSingle().catch(() => ({ data: null }));
    const wasAlreadySuccess = existingContrib?.status === 'success';

    await upsertContribution({
      cardId: meta.card_id, txRef, amount: amountNaira,
      contributorName: txn.customer?.name, contributorEmail: txn.customer?.email,
      status: 'success',
    });

    // Only update total_collected if this is the FIRST time we're marking it success
    if (meta.card_id && !wasAlreadySuccess) {
      const { data: card } = await supabase.from('cards').select('total_collected').eq('id', meta.card_id).single().catch(() => ({ data: null }));
      const currentTotal = card?.total_collected || 0;
      await supabase.from('cards').update({ total_collected: currentTotal + amountNaira })
        .eq('id', meta.card_id).catch(e => console.error('total_collected update:', e.message));
    }

    // Update the message record: mark payment verified and record contribution amount
    // Primary: look up via message_id stored in contributions (requires migration)
    // Fallback: match by card_id + contributor_email (for older rows without message_id)
    let messageUpdated = false;
    try {
      const { data: contribution } = await supabase
        .from('contributions')
        .select('message_id')
        .eq('flw_reference', txRef)
        .maybeSingle();
      if (contribution?.message_id) {
        await supabase.from('messages')
          .update({ payment_verified: true, contributed_amount: amountNaira })
          .eq('id', contribution.message_id);
        messageUpdated = true;
      }
    } catch (e) { /* message_id column may not exist yet on older DBs */ }

    if (!messageUpdated && txn.customer?.email && meta.card_id) {
      // Fallback: find the most recent message from this email on this card
      const { data: msg } = await supabase
        .from('messages')
        .select('id')
        .eq('card_id', meta.card_id)
        .eq('author_email', txn.customer.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (msg) {
        await supabase.from('messages')
          .update({ payment_verified: true, contributed_amount: amountNaira })
          .eq('id', msg.id);
      }
    }

    res.json({ verified: true, amount: amountNaira });
  } catch (err) {
    console.error('verifyContribution error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// POST /api/payments/card-fee — initialize the ₦5,000 card creation fee
const initCardFee = async (req, res) => {
  try {
    const { card_slug, name } = req.body;

    // Resolve email from body OR from authenticated identity
    const email =
      req.body.email ||
      req.user?.email ||
      req.member?.email ||
      req.company?.email;

    // Resolve display name similarly
    const displayName =
      name ||
      req.user?.full_name ||
      (req.member ? `${req.member.first_name} ${req.member.last_name}`.trim() : null) ||
      req.company?.contact_person ||
      req.company?.name ||
      email;

    if (!card_slug || !email) return res.status(400).json({ error: 'card_slug and email required' });

    const txRef = `TK-FEE-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const payload = {
      tx_ref:         txRef,
      amount:         5000,
      currency:       'NGN',
      redirect_url:   `${FRONTEND_URL}/payment/callback`,
      customer:       { email, name: displayName },
      customizations: { title: 'Thankeeu Card Fee', logo: `${process.env.APP_URL}/logo.png` },
      meta:           { type: 'card_fee', card_slug },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success') throw new Error(r.data.message);

    // Bug 6 fix: store tx_ref on card so we can look it up even if FLW meta is truncated
    await supabase.from('cards').update({ payment_ref: txRef }).eq('slug', card_slug).catch(() => {});

    res.json({ payment_link: r.data.data.link, tx_ref: txRef });
  } catch (err) {
    console.error('initCardFee:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize card fee' });
  }
};

module.exports = { initializePayment, verifyPayment, initContribution, verifyContribution, initCardFee };
