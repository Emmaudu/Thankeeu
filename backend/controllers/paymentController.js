/**
 

    // Verify amount paid matches contribution amount recorded in DB
    const { data: contrib } = await supabase
      .from('contributions')
      .select('amount')
      .eq('tx_ref', txRef)
      .maybeSingle();
    if (contrib && txn.amount < contrib.amount * 0.90) {
      console.error(`[verifyContribution] UNDERPAYMENT: expected ₦${contrib.amount}, got ₦${txn.amount}. ref: ${txRef}`);
      return res.status(400).json({ error: 'Payment amount does not match. Please contact support.' });
    }
* paymentController.js — Flutterwave payments
 *
 * FLOW:
 *  CONTRIBUTION (gift) flow — FLW Inline JS (no redirect):
 *  1. Frontend calls /initialize/contribution → gets { tx_ref, flw_config }
 *  2. Frontend loads checkout.flutterwave.com/v3.js and calls FlutterwaveCheckout(flw_config)
 *  3. FLW popup opens inline — user pays without leaving the page
 *  4. FLW fires callback(response) → frontend calls /verify-contribution
 *
 *  CARD FEE flow — redirect (unchanged):
 *  1. Frontend calls /initialize/purchase → gets { payment_link, tx_ref }
 *  2. Frontend: window.location.assign(payment_link) → user pays on flutterwave.com
 *  3. FLW redirects browser directly to FRONTEND /create-card/verify?tx_ref=...
 *  4. Frontend page reads ?tx_ref, calls backend verify endpoint
 *  5. Backend verifies with FLW, updates DB, returns JSON { ok: true, ... }
 *  6. Frontend shows success screen
 *
 *  No backend redirect hop. No backend URL needed in redirect_url.
 *  FRONTEND_URL is the only URL env var needed.
 */

const axios    = require('axios');
const supabase = require('../utils/supabase');
const { safeTxRef, safeError } = require('../utils/paramGuard');

const FLW_BASE    = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT = 12000;

// FLW considers both statuses as success
const FLW_SUCCESS = new Set(['successful', 'completed', 'success']);

// Frontend URL — FLW redirects browser here after payment
// Hardcoded fallback so a missing/corrupt env var never breaks the URL
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || '';
  let s = raw.trim();
  // Handle "KEY=VALUE" format — user pasted env var with key name included
  // e.g. "FRONTEND_URL=https://thankeeu.com" or "FRONTEND_URLS=https://..."
  const eqIdx = s.indexOf('=');
  if (eqIdx !== -1 && !s.startsWith('http')) s = s.slice(eqIdx + 1).trim();
  // Take first http line if multi-line
  for (const line of s.split(/[\r\n]+/)) {
    const t = line.trim();
    if (t.startsWith('http')) return t.replace(/\/$/, '');
  }
  return s.startsWith('http') ? s.replace(/\/$/, '') : 'https://thankeeu.com';
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
    .select('id, message_id, status').maybeSingle();
  if (!error) return data;
  const { data: ex } = await supabase.from('contributions')
    .select('id').eq('flw_reference', txRef).maybeSingle();
  if (ex) {
    const { data: up } = await supabase.from('contributions')
      .update({ status: status || 'pending', amount, ...(messageId ? { message_id: messageId } : {}) })
      .eq('id', ex.id).select('id, message_id, status').maybeSingle();
    return up;
  }
  const { data: ins } = await supabase.from('contributions').insert(row).select().maybeSingle();
  return ins;
};

// Update message after gift verified + recalculate card total_collected
const updateMessageAfterGift = async ({ txRef, cardId, contributorEmail, amountNaira }) => {
  // Update message.contributed_amount — try message_id first, then email fallback
  try {
    const { data: contrib } = await supabase.from('contributions')
      .select('message_id').eq('flw_reference', txRef).maybeSingle();
    if (contrib?.message_id) {
      await supabase.from('messages')
        .update({ payment_verified: true, contributed_amount: amountNaira })
        .eq('id', contrib.message_id);
    } else if (contributorEmail && cardId) {
      // Email fallback: find the most recent message from this contributor on this card
      const { data: msg } = await supabase.from('messages').select('id')
        .eq('card_id', cardId)
        .ilike('author_email', contributorEmail.trim())
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (msg) {
        await supabase.from('messages')
          .update({ payment_verified: true, contributed_amount: amountNaira })
          .eq('id', msg.id);
      }
    }
  } catch (e) {
    console.warn('updateMessageAfterGift:', e.message);
  }

  // Recalculate total_collected from scratch (accurate, idempotent)
  if (cardId) {
    let sums = null;
    try {
      const { data } = await supabase.from('contributions')
        .select('amount').eq('card_id', cardId).eq('status', 'success');
      sums = data;
    } catch {}
    if (sums) {
      const total = sums.reduce((s, c) => s + (c.amount || 0), 0);
      try { await supabase.from('cards').update({ total_collected: total }).eq('id', cardId); }
      catch (e) { console.warn('total_collected recalc:', e.message); }
    }
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
    const { card_slug, currency: reqCurrency } = req.body;
    if (!card_slug) return res.status(400).json({ error: 'card_slug is required' });

    // Guard against double-charging: if the card is already active (previous payment
    // succeeded but CardFeeVerify failed to navigate), return a synthetic success so
    // the frontend can redirect to the card view without generating a new FLW charge.
    const { data: existingCard } = await supabase.from('cards')
      .select('slug, status').eq('slug', card_slug).maybeSingle();
    if (existingCard?.status === 'active' || existingCard?.status === 'sent') {
      console.log('initCardFee: card already active, skipping charge. card:', card_slug);
      return res.json({ already_active: true, card_slug });
    }
    // Currency: default NGN, support USD/GBP/EUR etc. for international users
    const SUPPORTED = ['NGN','USD','GBP','EUR','CAD','GHS','KES','ZAR'];
    const currency = SUPPORTED.includes(reqCurrency) ? reqCurrency : 'NGN';
    // FX rates (approximate — FLW uses live rates at checkout)
    const FX = { NGN:1, USD:0.00063, GBP:0.00049, EUR:0.00058, CAD:0.00086, GHS:0.0095, KES:0.082, ZAR:0.011 };
    const feeNGN = 5000;
    const feeInCurrency = currency === 'NGN' ? feeNGN : parseFloat((feeNGN * FX[currency]).toFixed(2));

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
      amount:    feeInCurrency,
      currency,
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
    try { await supabase.from('cards').update({ payment_ref: txRef }).eq('slug', card_slug); }
    catch (e) { console.warn('payment_ref store:', e.message); }

    console.log('initCardFee OK tx_ref:', txRef, 'card:', card_slug);
    return res.json({ payment_link: r.data.data.link, tx_ref: txRef });

  } catch (err) {
    console.error('initCardFee error:', err.response?.data?.message || err.message);
    return res.status(500).json({ error: 'Failed to initialize payment. Please try again.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/payments/verify-card-fee?tx_ref=...
// Called by frontend /create-card/verify page after FLW redirect
// Returns JSON { ok: true, card_slug }
// ═══════════════════════════════════════════════════════════════════════════════
const verifyCardFee = async (req, res) => {
  try {
    const txRef = safeTxRef(req.query.tx_ref || req.params.txRef);
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required and must be a valid reference' });

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

    // Verify amount paid matches what was expected (prevents ₦1 payment activating card)
    const CARD_FEE = 5000; // ₦5,000 card creation fee
    const paidAmount = txn.amount;
    if (paidAmount < CARD_FEE * 0.90) {
      console.error(`[verifyCardFee] UNDERPAYMENT: expected ₦${CARD_FEE}, got ₦${paidAmount}. card: ${cardSlug}, ref: ${txRef}`);
      return res.status(400).json({ error: 'Payment amount does not match. Please contact support.' });
    }

    await supabase.from('cards').update({ status: 'active' }).eq('slug', cardSlug);
    console.log('Card activated:', cardSlug);

    // Arm precise delivery setTimeout if the card has a scheduled date.
    const { data: activatedCard } = await supabase
      .from('cards')
      .select('id, slug, send_date, recipient_email, recipient_name, occasion, custom_occasion, access_token, claim_token, total_collected, company_id, recipient_notified')
      .eq('slug', cardSlug).maybeSingle();
    if (activatedCard?.send_date && activatedCard?.recipient_email && !activatedCard?.recipient_notified) {
      try {
        const scheduler = require('../utils/scheduler');
        scheduler.scheduleCardDelivery({ ...activatedCard, status: 'active' });
      } catch (_) { /* scheduler not yet init'd — cron sweep will catch it */ }
    }

    return res.json({ ok: true, card_slug: cardSlug });

  } catch (err) {
    console.error('verifyCardFee error:', err.response?.data?.message || err.message);
    return res.status(500).json({ error: 'Payment verification failed. Please try again.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/initialize/contribution  — gift contribution
// Public — signers not necessarily logged in
// Returns { tx_ref, flw_config } — frontend uses FLW Inline JS (no redirect, no expiring link)
// ═══════════════════════════════════════════════════════════════════════════════
const initContribution = async (req, res) => {
  try {
    const { card_slug, amount, contributor_name, contributor_email, message_id,
            flw_amount, flw_currency, display_currency } = req.body;

    if (!card_slug)         return res.status(400).json({ error: 'card_slug is required' });
    if (!amount)            return res.status(400).json({ error: 'amount is required' });
    if (!contributor_email) return res.status(400).json({ error: 'contributor_email is required' });
    if (Number(amount) < 100) return res.status(400).json({ error: 'Minimum gift amount is ₦100' });

    const { data: card } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, is_gift_enabled, status')
      .eq('slug', card_slug).maybeSingle();

    if (!card)                  return res.status(404).json({ error: 'Card not found' });
    if (!card.is_gift_enabled)  return res.status(400).json({ error: 'Gifts not enabled for this card' });
    // Only 'draft' is blocked — 'active' and 'sent' cards are both open for contributions.
    if (card.status === 'draft') return res.status(400).json({ error: 'Card is not yet active' });

    const txRef       = `TK-GIFT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const amountNaira = Number(amount);

    const SUPPORTED = ['NGN','USD','GBP','EUR','CAD','GHS','KES','ZAR'];
    const payAmount   = (flw_amount && flw_currency && SUPPORTED.includes(flw_currency)) ? flw_amount : amountNaira;
    const payCurrency = (flw_currency && SUPPORTED.includes(flw_currency)) ? flw_currency : 'NGN';

    // Save pending contribution row immediately — so verifyContribution can find the
    // NGN amount even before the popup opens (important for multi-currency payments).
    await upsertContribution({
      cardId:           card.id,
      txRef,
      amount:           amountNaira,
      contributorName:  contributor_name,
      contributorEmail: contributor_email,
      status:           'pending',
      messageId:        message_id || null,
    });

    // Return inline checkout config — NO FLW API call needed here.
    // The frontend loads checkout.flutterwave.com/v3.js and calls
    // window.FlutterwaveCheckout(flw_config) directly. This eliminates the
    // flwlnk- redirect link entirely (those expire after 30 minutes).
    const flwConfig = {
      public_key:  process.env.FLW_PUBLIC_KEY,
      tx_ref:      txRef,
      amount:      payAmount,
      currency:    payCurrency,
      customer: {
        email: contributor_email,
        name:  contributor_name || contributor_email,
      },
      customizations: {
        title:       `Gift for ${card.recipient_name}`,
        description: `Contribute to ${card.title || (card.recipient_name + "'s card")}`,
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      meta: { type: 'gift_contribution', card_id: card.id, card_slug, message_id: message_id || null },
    };

    console.log('initContribution OK tx_ref:', txRef, 'card:', card_slug, 'amount:', amountNaira);
    return res.json({ tx_ref: txRef, flw_config: flwConfig });

  } catch (err) {
    console.error('initContribution error:', err.response?.data?.message || err.message);
    return res.status(500).json({ error: 'Failed to initialize contribution. Please try again.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/verify-contribution  — verify gift after redirect
// Public — called by frontend SignCard after FLW returns with ?tx_ref=
// Returns JSON { ok: true, amount }
// ═══════════════════════════════════════════════════════════════════════════════
const verifyContribution = async (req, res) => {
  try {
    const txRef = safeTxRef(req.query.tx_ref || req.body?.tx_ref || req.params.txRef);
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required and must be a valid reference' });

    const txn = await fetchFlwTransaction(txRef);
    if (!FLW_SUCCESS.has(txn.status)) {
      return res.status(400).json({ error: `Payment not completed (status: ${txn.status})` });
    }

    const meta        = txn.meta || {};
    let   cardId      = meta.card_id;
    const messageId   = meta.message_id || null;

    // Fallback: some payment flows / FLW responses can drop numeric meta
    // fields. If card_id is missing but card_slug is present, resolve it —
    // otherwise the contribution would be saved with no card_id and never
    // count toward that card's total_collected.
    if (!cardId && meta.card_slug) {
      const { data: cardBySlug } = await supabase.from('cards')
        .select('id').eq('slug', meta.card_slug).maybeSingle();
      cardId = cardBySlug?.id || null;
    }

    // IMPORTANT: txn.amount is in whatever currency the contributor actually
    // paid (USD/GBP/EUR/etc if they used the currency switcher), NOT
    // necessarily NGN. The correct NGN amount was already stored when the
    // contribution was created (status='pending') at init time — reuse it
    // here rather than overwriting it with a foreign-currency number.
    const { data: existingContrib } = await supabase.from('contributions')
      .select('amount').eq('flw_reference', txRef).maybeSingle();
    const amountNaira = existingContrib?.amount ?? Math.floor(txn.amount);

    await upsertContribution({
      cardId,
      txRef,
      amount:           amountNaira,
      contributorName:  txn.customer?.name,
      contributorEmail: txn.customer?.email,
      status:           'success',
      messageId,
    });

    // Always update the message contributed_amount (idempotent — safe to run multiple times)
    await updateMessageAfterGift({
      txRef, cardId,
      contributorEmail: txn.customer?.email,
      amountNaira,
    });

    console.log('verifyContribution OK tx_ref:', txRef, 'amount:', amountNaira);
    return res.json({ ok: true, amount: amountNaira });

  } catch (err) {
    console.error('verifyContribution error:', err.response?.data?.message || err.message);
    return res.status(500).json({ error: 'Contribution verification failed. Please try again.' });
  }
};

// Generic verify — reads meta.type and delegates to correct handler
// Used by PaymentCallback as fallback for any payment type
const verifyPayment = async (req, res) => {
  try {
    const txRef = safeTxRef(req.params.txRef || req.query.tx_ref);
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required and must be a valid reference' });
    const txn = await fetchFlwTransaction(txRef);
    const type = txn.meta?.type;
    if (type === 'card_fee') {
      req.params = { ...req.params, txRef };
      return verifyCardFee(req, res);
    }
    if (type === 'gift_contribution') {
      req.body = { ...req.body, tx_ref: txRef };
      return verifyContribution(req, res);
    }
    return res.json({ status: 'success', type, amount: txn.amount, meta: txn.meta });
  } catch (err) {
    console.error('verifyPayment error:', err.message);
    return res.status(500).json({ error: 'Payment verification failed. Please try again.' });
  }
};

module.exports = { initCardFee, verifyCardFee, initContribution, verifyContribution, verifyPayment };
