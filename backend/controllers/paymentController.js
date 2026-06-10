/**
 * paymentController.js — Flutterwave payments
 *
 * FLOW:
 *  1. Frontend calls init endpoint → gets { payment_link, tx_ref }
 *  2. Frontend: window.location.assign(payment_link) → user pays on flutterwave.com
 *  3. FLW redirects browser directly to FRONTEND redirect_url with ?tx_ref=...&status=...
 *  4. Frontend page reads ?tx_ref, calls backend verify endpoint
 *  5. Backend verifies with FLW, updates DB, returns JSON { ok: true, ... }
 *  6. Frontend shows success screen
 *
 *  No backend redirect hop. No backend URL needed in redirect_url.
 *  FRONTEND_URL is the only URL env var needed.
 */

const axios    = require('axios');
const supabase = require('../utils/supabase');

const FLW_BASE    = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT = 12000;

// FLW considers both statuses as success
const FLW_SUCCESS = new Set(['successful', 'completed', 'success']);

// Frontend URL — FLW redirects browser here after payment
// Hardcoded fallback so a missing/corrupt env var never breaks the URL
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || '';
  // Take the first line that starts with http, ignore everything else
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

// ─── Verify a transaction with FLW ──────────────────────────────────────────
const fetchFlwTransaction = async (txRef) => {
  if (!txRef) throw new Error('tx_ref is required');
  const r = await axios.get(
    `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(String(txRef).trim())}`,
    { headers: flwHeaders(), timeout: FLW_TIMEOUT }
  );
  if (r.data.status !== 'success') throw new Error(r.data.message || 'FLW verification failed');
  return r.data.data;
};

// ─── Upsert contribution row ─────────────────────────────────────────────────
const upsertContribution = async ({ cardId, txRef, amount, contributorName, contributorEmail, status, messageId }) => {
  const row = {
    card_id:           cardId,
    flw_reference:     txRef,
    amount,
    contributor_name:  contributorName || '',
    contributor_email: contributorEmail || '',
    status:            status || 'pending',
    ...(messageId ? { message_id: messageId } : {}),
  };
  const { data, error } = await supabase.from('contributions')
    .upsert(row, { onConflict: 'flw_reference', ignoreDuplicates: false })
    .select('id, message_id, status').single();
  if (!error) return data;
  const { data: ex } = await supabase.from('contributions')
    .select('id').eq('flw_reference', txRef).maybeSingle();
  if (ex) {
    const { data: up } = await supabase.from('contributions')
      .update({ status: status || 'pending', amount, ...(messageId ? { message_id: messageId } : {}) })
      .eq('id', ex.id).select('id, message_id, status').single();
    return up;
  }
  const { data: ins } = await supabase.from('contributions').insert(row).select().single();
  return ins;
};

// ─── Update message after gift verified ──────────────────────────────────────
const updateMessageAfterGift = async ({ txRef, cardId, contributorEmail, amountNaira }) => {
  try {
    const { data: contrib } = await supabase.from('contributions')
      .select('message_id').eq('flw_reference', txRef).maybeSingle();
    if (contrib?.message_id) {
      await supabase.from('messages')
        .update({ payment_verified: true, contributed_amount: amountNaira })
        .eq('id', contrib.message_id);
      return;
    }
  } catch (_) {}
  if (!contributorEmail || !cardId) return;
  const { data: msg } = await supabase.from('messages').select('id')
    .eq('card_id', cardId).eq('author_email', contributorEmail)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (msg) {
    await supabase.from('messages')
      .update({ payment_verified: true, contributed_amount: amountNaira })
      .eq('id', msg.id);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/initialize/purchase  — card creation fee
// anyAuth: sets req.user | req.member | req.company
// Returns { payment_link, tx_ref }
// redirect_url → frontend /create-card/verify?tx_ref=...
// ═══════════════════════════════════════════════════════════════════════════════
const initCardFee = async (req, res) => {
  try {
    const { card_slug } = req.body;
    if (!card_slug) return res.status(400).json({ error: 'card_slug is required' });

    const email =
      req.body.email    ||
      req.user?.email   ||
      req.member?.email ||
      req.company?.email;
    if (!email) return res.status(400).json({ error: 'Could not determine your email. Please log in again.' });

    const callerName =
      req.user?.full_name ||
      (req.member ? `${req.member.first_name} ${req.member.last_name}`.trim() : null) ||
      req.company?.contact_person || req.company?.name || email;

    const txRef = `TK-FEE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payload = {
      tx_ref:    txRef,
      amount:    5000,
      currency:  'NGN',
      // FLW redirects browser directly to frontend — no backend hop needed
      redirect_url: `${FRONTEND_URL}/create-card/verify`,
      customer:  { email, name: callerName },
      customizations: {
        title:       'Thankeeu Card Fee',
        description: 'One-time card creation fee',
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      meta: { type: 'card_fee', card_slug },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success') {
      console.error('FLW initCardFee rejected:', r.data);
      return res.status(400).json({ error: r.data.message || 'Payment gateway rejected the request' });
    }

    // Store tx_ref on card as fallback for webhook
    await supabase.from('cards').update({ payment_ref: txRef }).eq('slug', card_slug)
      .catch(e => console.warn('payment_ref store:', e.message));

    console.log('initCardFee OK tx_ref:', txRef, 'card:', card_slug);
    return res.json({ payment_link: r.data.data.link, tx_ref: txRef });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('initCardFee error:', msg);
    return res.status(500).json({ error: `Failed to initialize card fee: ${msg}` });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/verify-card-fee?tx_ref=...
// Called by frontend /create-card/verify page after FLW redirect
// Returns JSON { ok: true, card_slug }
// ═══════════════════════════════════════════════════════════════════════════════
const verifyCardFee = async (req, res) => {
  try {
    const txRef = req.query.tx_ref || req.params.txRef;
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required' });

    const txn = await fetchFlwTransaction(txRef);
    if (!FLW_SUCCESS.has(txn.status)) {
      return res.status(400).json({ error: `Payment not completed (status: ${txn.status})` });
    }

    const meta     = txn.meta || {};
    let   cardSlug = meta.card_slug;

    // Fallback: find card by payment_ref column
    if (!cardSlug) {
      const { data } = await supabase.from('cards')
        .select('slug').eq('payment_ref', txRef).maybeSingle();
      cardSlug = data?.slug;
    }

    if (!cardSlug) {
      console.error('verifyCardFee: no card found for tx_ref', txRef);
      return res.status(404).json({ error: 'Card not found for this payment. Please contact support with ref: ' + txRef });
    }

    await supabase.from('cards').update({ status: 'active' }).eq('slug', cardSlug);
    console.log('Card activated:', cardSlug);

    return res.json({ ok: true, card_slug: cardSlug });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('verifyCardFee error:', msg);
    return res.status(500).json({ error: msg || 'Verification failed' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/initialize/contribution  — gift contribution
// Public — signers not necessarily logged in
// Returns { payment_link, tx_ref }
// redirect_url → frontend /sign/slug?tx_ref=...
// ═══════════════════════════════════════════════════════════════════════════════
const initContribution = async (req, res) => {
  try {
    const { card_slug, amount, contributor_name, contributor_email, message_id } = req.body;

    if (!card_slug)         return res.status(400).json({ error: 'card_slug is required' });
    if (!amount)            return res.status(400).json({ error: 'amount is required' });
    if (!contributor_email) return res.status(400).json({ error: 'contributor_email is required' });
    if (Number(amount) < 100) return res.status(400).json({ error: 'Minimum gift amount is ₦100' });

    const { data: card } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, is_gift_enabled, status')
      .eq('slug', card_slug).single();

    if (!card)                  return res.status(404).json({ error: 'Card not found' });
    if (!card.is_gift_enabled)  return res.status(400).json({ error: 'Gifts not enabled for this card' });
    if (card.status === 'sent') return res.status(400).json({ error: 'Card already delivered — contributions closed' });

    const txRef       = `TK-GIFT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const amountNaira = Number(amount);

    const payload = {
      tx_ref:    txRef,
      amount:    amountNaira,
      currency:  'NGN',
      // FLW redirects browser directly to the sign page on the frontend
      // Frontend reads ?tx_ref= and calls /api/payments/verify-contribution
      redirect_url: `${FRONTEND_URL}/sign/${card_slug}?tx_ref=${txRef}`,
      customer:  { email: contributor_email, name: contributor_name || contributor_email },
      customizations: {
        title:       `Gift for ${card.recipient_name}`,
        description: `Contribute to ${card.title || card.recipient_name + "'s card"}`,
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      meta: { type: 'gift_contribution', card_id: card.id, card_slug, message_id: message_id || null },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success') {
      return res.status(400).json({ error: r.data.message || 'Gateway rejected the request' });
    }

    await upsertContribution({
      cardId:           card.id,
      txRef,
      amount:           amountNaira,
      contributorName:  contributor_name,
      contributorEmail: contributor_email,
      status:           'pending',
      messageId:        message_id || null,
    });

    console.log('initContribution OK tx_ref:', txRef, 'card:', card_slug, 'amount:', amountNaira);
    return res.json({ payment_link: r.data.data.link, tx_ref: txRef });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('initContribution error:', msg);
    return res.status(500).json({ error: msg || 'Failed to initialize contribution' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/verify-contribution  — verify gift after redirect
// Public — called by frontend SignCard after FLW returns with ?tx_ref=
// Returns JSON { ok: true, amount }
// ═══════════════════════════════════════════════════════════════════════════════
const verifyContribution = async (req, res) => {
  try {
    const txRef = req.query.tx_ref || req.body?.tx_ref || req.params.txRef;
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required' });

    const txn = await fetchFlwTransaction(txRef);
    if (!FLW_SUCCESS.has(txn.status)) {
      return res.status(400).json({ error: `Payment not completed (status: ${txn.status})` });
    }

    const meta        = txn.meta || {};
    const cardId      = meta.card_id;
    const messageId   = meta.message_id || null;
    const amountNaira = Math.floor(txn.amount);

    // Idempotency: skip double-processing
    const { data: existing } = await supabase.from('contributions')
      .select('id, status').eq('flw_reference', txRef).maybeSingle()
      .catch(() => ({ data: null }));
    const alreadyDone = existing?.status === 'success';

    await upsertContribution({
      cardId,
      txRef,
      amount:           amountNaira,
      contributorName:  txn.customer?.name,
      contributorEmail: txn.customer?.email,
      status:           'success',
      messageId,
    });

    // DB trigger (contribution_verified) automatically updates cards.total_collected
    // when contribution status changes to 'success' — no manual update needed here

    await updateMessageAfterGift({
      txRef, cardId,
      contributorEmail: txn.customer?.email,
      amountNaira,
    });

    console.log('verifyContribution OK tx_ref:', txRef, 'amount:', amountNaira);
    return res.json({ ok: true, amount: amountNaira });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('verifyContribution error:', msg);
    return res.status(500).json({ error: msg || 'Verification failed' });
  }
};

module.exports = { initCardFee, verifyCardFee, initContribution, verifyContribution };
