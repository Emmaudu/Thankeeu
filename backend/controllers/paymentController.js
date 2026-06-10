/**
 * paymentController.js — Flutterwave payments (Paystack-style redirect flow)
 *
 * FLOW (same as old Paystack approach that worked well):
 *   1. Frontend calls init endpoint → backend creates FLW payment link
 *   2. Frontend: window.location.assign(payment_link) — no popup, no callback complexity
 *   3. User pays on flutterwave.com hosted checkout page
 *   4. FLW redirects to: BACKEND /api/payments/callback?tx_ref=...&status=successful
 *   5. Backend verifyAndRedirect: fetches transaction from FLW, verifies, updates DB
 *   6. Backend: res.redirect(FRONTEND_URL/card/slug) or res.redirect(FRONTEND_URL/sign/slug?success=1)
 *   7. Frontend success page renders automatically
 *
 * WEBHOOK (server-to-server safety net):
 *   FLW also POSTs to /webhook/flutterwave after every payment.
 *   Backend processes this regardless of redirect outcome.
 *   Both run independently so the card/contribution is always activated.
 */

const axios    = require('axios');
const supabase = require('../utils/supabase');

const FLW_BASE    = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT = 12000;

// Railway backend URL — FLW redirects back here after payment
const BACKEND_URL  = (process.env.APP_URL || 'https://thankeeu-production.up.railway.app').replace(/\/$/, '');
// Vercel frontend URL — backend redirects browser here after verification
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.APP_URL || 'https://thankeeu.com').replace(/\/$/, '');

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

// ─── Upsert contribution row ──────────────────────────────────────────────────
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
  const { data, error } = await supabase
    .from('contributions')
    .upsert(row, { onConflict: 'flw_reference', ignoreDuplicates: false })
    .select('id, message_id, status')
    .single();
  if (!error) return data;
  // Fallback for DBs without unique index yet
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
    const { data: contrib } = await supabase
      .from('contributions').select('message_id').eq('flw_reference', txRef).maybeSingle();
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

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/payments/initialize/purchase   — card creation fee
// anyAuth: sets req.user | req.member | req.company
// ═════════════════════════════════════════════════════════════════════════════
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

    // Identify caller type so callback can redirect to the right dashboard
    const callerType = req.company ? 'company' : req.member ? 'member' : 'user';
    const callerDashboard = callerType === 'company'
      ? `${FRONTEND_URL}/company/dashboard`
      : callerType === 'member'
      ? `${FRONTEND_URL}/member/dashboard`
      : `${FRONTEND_URL}/dashboard`;

    const txRef = `TK-FEE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payload = {
      tx_ref:       txRef,
      amount:       5000,
      currency:     'NGN',
      redirect_url: `${BACKEND_URL}/api/payments/callback`,
      customer:     { email, name: callerName },
      customizations: {
        title:       'Thankeeu Card Fee',
        description: 'One-time card creation fee',
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      // caller_type + caller_dashboard let the callback redirect correctly
      meta: { type: 'card_fee', card_slug, caller_type: callerType, caller_dashboard: callerDashboard },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success') {
      console.error('FLW rejected initCardFee:', r.data);
      return res.status(400).json({ error: r.data.message || 'Payment gateway rejected the request' });
    }

    await supabase.from('cards').update({ payment_ref: txRef }).eq('slug', card_slug)
      .catch(e => console.warn('payment_ref store:', e.message));

    console.log('initCardFee OK — tx_ref:', txRef, 'card:', card_slug, 'caller:', callerType);
    return res.json({ payment_link: r.data.data.link, tx_ref: txRef });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('initCardFee error:', msg, err.response?.data);
    return res.status(500).json({ error: `Failed to initialize card fee: ${msg}` });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/payments/initialize/contribution   — gift contribution
// Public — signers are not necessarily logged in
// ═════════════════════════════════════════════════════════════════════════════
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

    // redirect_url points to BACKEND — same as Paystack approach
    // Backend verifies and redirects to /sign/slug?success=1
    const payload = {
      tx_ref:       txRef,
      amount:       amountNaira,
      currency:     'NGN',
      redirect_url: `${BACKEND_URL}/api/payments/callback`,
      customer:     { email: contributor_email, name: contributor_name || contributor_email },
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

    // Pre-create pending contribution
    await upsertContribution({
      cardId:           card.id,
      txRef,
      amount:           amountNaira,
      contributorName:  contributor_name,
      contributorEmail: contributor_email,
      status:           'pending',
      messageId:        message_id || null,
    });

    console.log('initContribution OK — tx_ref:', txRef, 'card:', card_slug, 'amount:', amountNaira);
    return res.json({ payment_link: r.data.data.link, tx_ref: txRef });

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('initContribution error:', msg);
    return res.status(500).json({ error: msg || 'Failed to initialize contribution' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/payments/callback
// FLW redirects HERE after hosted checkout (same as old Paystack /api/payments/callback)
// Verifies payment, updates DB, then res.redirect() to frontend
//
// FLW appends: ?status=successful&tx_ref=TK-FEE-...&transaction_id=...
// ═════════════════════════════════════════════════════════════════════════════
const paymentCallback = async (req, res) => {
  const txRef  = req.query.tx_ref || req.query.reference;
  const status = req.query.status;

  // Default dashboard — overridden per user type once we read meta
  const defaultDashboard = `${FRONTEND_URL}/dashboard`;

  // Payment was cancelled before completing
  if (status === 'cancelled' || !txRef) {
    console.log('Payment cancelled or no tx_ref');
    return res.redirect(`${defaultDashboard}?payment=cancelled`);
  }

  try {
    const txn = await fetchFlwTransaction(txRef);
    const meta = txn.meta || {};
    const type = meta.type;

    // Use stored caller_dashboard for error/cancel redirects — falls back to /dashboard
    const callerDashboard = meta.caller_dashboard || defaultDashboard;

    if (txn.status !== 'successful') {
      console.warn('Payment callback not successful:', txn.status, txRef);
      return res.redirect(`${callerDashboard}?payment=failed`);
    }

    console.log('Payment callback OK — type:', type, 'tx_ref:', txRef);

    // ── card_fee ──────────────────────────────────────────────────────────────
    if (type === 'card_fee') {
      // Find card slug from meta or fallback to payment_ref column
      let cardSlug = meta.card_slug;
      if (!cardSlug) {
        const { data } = await supabase.from('cards')
          .select('slug').eq('payment_ref', txRef).maybeSingle();
        cardSlug = data?.slug;
      }

      if (!cardSlug) {
        console.error('card_fee callback: cannot find card for tx_ref', txRef);
        return res.redirect(`${callerDashboard}?payment=error&ref=${encodeURIComponent(txRef)}`);
      }

      // Activate card
      const { error: actErr } = await supabase.from('cards')
        .update({ status: 'active' })
        .eq('slug', cardSlug);

      if (actErr) console.error('Card activation error:', actErr.message);
      else        console.log('Card activated:', cardSlug);

      // All user types (normal user, member, team leader, HR) redirect to the card page
      // CardViewGate on the frontend handles auth for all of them
      return res.redirect(`${FRONTEND_URL}/card/${cardSlug}?activated=1`);
    }

    // ── gift_contribution ────────────────────────────────────────────────────
    if (type === 'gift_contribution') {
      const cardId      = meta.card_id;
      const cardSlug    = meta.card_slug;
      const amountNaira = Math.floor(txn.amount);
      const messageId   = meta.message_id || null;

      if (cardId) {
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

        if (!alreadyDone) {
          const { data: card } = await supabase.from('cards')
            .select('total_collected').eq('id', cardId).single()
            .catch(() => ({ data: null }));
          await supabase.from('cards')
            .update({ total_collected: (card?.total_collected || 0) + amountNaira })
            .eq('id', cardId)
            .catch(e => console.warn('total_collected:', e.message));
        }

        await updateMessageAfterGift({
          txRef,
          cardId,
          contributorEmail: txn.customer?.email,
          amountNaira,
        });

        console.log('Gift contribution processed — card:', cardSlug, 'amount:', amountNaira);
      }

      // Redirect to sign page with ?success=1
      // SignCard's useEffect detects this and shows "Message delivered!" with WhatsApp invite
      const target = cardSlug
        ? `${FRONTEND_URL}/sign/${cardSlug}?success=1`
        : `${defaultDashboard}?payment=success`;
      return res.redirect(target);
    }

    // Unknown type
    return res.redirect(`${defaultDashboard}?payment=success`);

  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('paymentCallback error:', txRef, msg);
    return res.redirect(`${defaultDashboard}?payment=error&ref=${encodeURIComponent(txRef)}`);
  }
};

module.exports = {
  initCardFee,
  initContribution,
  paymentCallback,
};
