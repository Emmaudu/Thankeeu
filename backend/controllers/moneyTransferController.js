/**
 * moneyTransferController.js — "Send Money" : money tucked inside a card.
 *
 * One sender → one recipient → one amount. This is NOT the group-card flow.
 *
 * ── The money path, end to end ───────────────────────────────────────────────
 *  1. createDraft      sender composes the card                    status=draft
 *  2. initPayment      returns FLW inline-checkout config          TK-SEND-…
 *                      (inline, not a hosted redirect link — hosted `flwlnk-`
 *                       links expire after 30 minutes, see paymentController)
 *  3. verifyPayment    server-side verify against FLW              status=paid
 *                      → emails the recipient with a claim link
 *  4. getPublic        recipient opens /money/:slug?token=…
 *  5. claim            recipient takes it to their bank (FLW transfer) or as a
 *                      Reloadly gift card                          status=claimed
 *
 * ── Safety properties ───────────────────────────────────────────────────────
 *  • `payment_ref` and `claim_reference` are UNIQUE in Postgres, so a replayed
 *    webhook or a double-clicked button cannot double-credit or double-pay.
 *  • The claim uses the same conditional-update lock as bankController's
 *    withdrawGift: `.eq('claimed', false)` — only one request can win.
 *  • A failed FLW transfer releases the lock so the recipient can retry.
 *  • The amount charged is recomputed on the server from the stored row; the
 *    client never dictates what was paid.
 */
const axios    = require('axios');
const crypto   = require('crypto');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { nanoid } = require('nanoid');

const FLW = 'https://api.flutterwave.com/v3';
const flwH = () => ({
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json',
});
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://www.thankeeu.com').replace(/\/$/, '');

// Same static-IP proxy the existing payout code uses — Flutterwave whitelists
// the transfer endpoint by IP.
const flwTransferAxios = () => {
  const proxyUrl = process.env.QUOTAGUARDSTATIC_URL || process.env.PROXY_URL;
  if (!proxyUrl) return axios;
  try {
    const { HttpsProxyAgent } = require('https-proxy-agent');
    return axios.create({ httpsAgent: new HttpsProxyAgent(proxyUrl) });
  } catch (e) {
    console.warn('[moneyTransfer] https-proxy-agent unavailable:', e.message);
    return axios;
  }
};

const FLW_SUCCESS = new Set(['successful', 'completed', 'success']);

// ── Money rules (single source of truth; the client never sets these) ───────
const CARD_FEE_NGN   = Number(process.env.SEND_MONEY_CARD_FEE_NGN || 500);
const MIN_GIFT_NGN   = 500;
const MAX_GIFT_NGN   = Number(process.env.SEND_MONEY_MAX_NGN || 2000000);
const PAYOUT_FEE_PCT = 0.03; // identical to bankController.withdrawGift

const money = (n) => Math.round(Number(n) || 0);
const lower = (s) => String(s || '').trim().toLowerCase();
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
const clean = (s, max) => (s == null ? null : String(s).replace(/<[^>]*>/g, '').trim().slice(0, max));

/** Fields a client is allowed to set on the card. Money is never in here. */
const pickCardFields = (body) => ({
  title:                  clean(body.title, 200),
  occasion:               clean(body.occasion, 40) || 'other',
  custom_occasion:        clean(body.custom_occasion, 60),
  design_theme:           clean(body.design_theme, 80),
  background_color:       clean(body.background_color, 500),
  cover_text_color:       clean(body.cover_text_color, 20) || 'auto',
  cover_layout:           body.cover_layout && typeof body.cover_layout === 'object' ? body.cover_layout : null,
  album_background_theme: clean(body.album_background_theme, 32) || 'cover_blur',
  font_style:             clean(body.font_style, 30) || 'elegant',
  message:                clean(body.message, 2000),
  message_font_style:     clean(body.message_font_style, 30) || 'handwritten',
  message_font_size:      Math.min(120, Math.max(7, Number(body.message_font_size) || 18)),
  message_font_color:     clean(body.message_font_color, 20),
  media_url:              clean(body.media_url, 1000),
  media_type:             clean(body.media_type, 20),
  media_gallery:          Array.isArray(body.media_gallery) ? body.media_gallery : null,
});

const publicShape = (t) => ({
  slug: t.slug,
  sender_name: t.sender_name,
  recipient_name: t.recipient_name,
  title: t.title,
  occasion: t.occasion,
  custom_occasion: t.custom_occasion,
  design_theme: t.design_theme,
  background_color: t.background_color,
  cover_text_color: t.cover_text_color,
  cover_layout: t.cover_layout,
  album_background_theme: t.album_background_theme,
  font_style: t.font_style,
  message: t.message,
  message_font_style: t.message_font_style,
  message_font_size: t.message_font_size,
  message_font_color: t.message_font_color,
  media_url: t.media_url,
  media_type: t.media_type,
  media_gallery: t.media_gallery,
  gift_amount: Number(t.gift_amount || 0),
  currency: t.currency,
  status: t.status,
  claimed: t.claimed,
  claimed_at: t.claimed_at,
  claim_type: t.claim_type,
  claim_status: t.claim_status,
  claim_amount: t.claim_amount == null ? null : Number(t.claim_amount),
  claim_fee: t.claim_fee == null ? null : Number(t.claim_fee),
  claim_product_name: t.claim_product_name,
  claim_redemption_code: t.claim_redemption_code,
  delivered_at: t.delivered_at,
  created_at: t.created_at,
});

/* ── 1. Create / update a draft ─────────────────────────────────────────── */
const createDraft = async (req, res) => {
  try {
    const b = req.body || {};
    const recipient_email = lower(b.recipient_email);
    if (!isEmail(recipient_email))       return res.status(400).json({ error: 'A valid recipient email is required' });
    if (!clean(b.recipient_name, 120))   return res.status(400).json({ error: "The recipient's name is required" });

    const senderEmail = lower(b.sender_email) || lower(req.user?.email);
    if (!isEmail(senderEmail))           return res.status(400).json({ error: 'A valid sender email is required' });

    // A card must not be sent to the sender's own address — the claim flow
    // matches on recipient_email and that would let someone claim their own
    // payment back minus fees.
    if (recipient_email === senderEmail) {
      return res.status(400).json({ error: 'Send this to someone else — you cannot send money to your own email.' });
    }

    const gift = money(b.gift_amount);
    if (gift && (gift < MIN_GIFT_NGN || gift > MAX_GIFT_NGN)) {
      return res.status(400).json({ error: `Gift amount must be between ₦${MIN_GIFT_NGN.toLocaleString()} and ₦${MAX_GIFT_NGN.toLocaleString()}` });
    }

    const fields = {
      ...pickCardFields(b),
      sender_user_id:  req.user?.id || null,
      sender_name:     clean(b.sender_name, 120) || req.user?.full_name || 'A friend',
      sender_email:    senderEmail,
      recipient_name:  clean(b.recipient_name, 120),
      recipient_email: recipient_email,
      gift_amount:     gift,
      card_fee:        CARD_FEE_NGN,
      total_paid:      gift + CARD_FEE_NGN,
      currency:        'NGN',
    };

    // Updating an existing draft (the wizard saves as the sender types).
    if (b.slug) {
      const { data: existing } = await supabase.from('money_transfers')
        .select('id, sender_user_id, status').eq('slug', b.slug).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'Draft not found' });
      if (existing.sender_user_id !== req.user?.id) return res.status(403).json({ error: 'Not authorized' });
      if (existing.status !== 'draft') return res.status(400).json({ error: 'This card has already been paid for and cannot be edited.' });

      const { data: updated, error } = await supabase.from('money_transfers')
        .update(fields).eq('id', existing.id).select().maybeSingle();
      if (error) throw error;
      return res.json(updated);
    }

    const { data: created, error } = await supabase.from('money_transfers')
      .insert({ ...fields, slug: nanoid(12), status: 'draft' })
      .select().maybeSingle();
    if (error) throw error;
    return res.status(201).json(created);
  } catch (err) {
    console.error('[moneyTransfer.createDraft]', err.message);
    return res.status(500).json({ error: 'Could not save your card. Please try again.' });
  }
};

/* ── 2. Initialise payment (gift + card fee, one charge) ────────────────── */
const initPayment = async (req, res) => {
  try {
    const { slug } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const { data: t } = await supabase.from('money_transfers')
      .select('*').eq('slug', slug).maybeSingle();
    if (!t) return res.status(404).json({ error: 'Card not found' });
    if (t.sender_user_id !== req.user?.id) return res.status(403).json({ error: 'Not authorized' });
    if (t.payment_status === 'paid') return res.status(400).json({ error: 'This card has already been paid for.' });

    // Recompute server-side. The client cannot influence the charge.
    const gift  = money(t.gift_amount);
    const fee   = CARD_FEE_NGN;
    const total = gift + fee;
    if (gift < MIN_GIFT_NGN) {
      return res.status(400).json({ error: `Add at least ₦${MIN_GIFT_NGN.toLocaleString()} to send.` });
    }

    const txRef = `TK-SEND-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const { error: saveErr } = await supabase.from('money_transfers').update({
      payment_ref: txRef, card_fee: fee, total_paid: total, payment_status: 'pending',
    }).eq('id', t.id);
    if (saveErr) throw saveErr;

    // Inline checkout — the frontend calls window.FlutterwaveCheckout(flw_config).
    return res.json({
      tx_ref: txRef,
      amount: total,
      gift_amount: gift,
      card_fee: fee,
      flw_config: {
        public_key: process.env.FLW_PUBLIC_KEY,
        tx_ref:     txRef,
        amount:     total,
        currency:   'NGN',
        customer:   { email: t.sender_email, name: t.sender_name || t.sender_email },
        customizations: {
          title:       `Send ₦${gift.toLocaleString()} to ${t.recipient_name}`,
          description: 'Money inside a Thankeeu card',
          logo:        `${FRONTEND_URL}/logo.png`,
        },
        meta: { type: 'money_transfer', transfer_id: t.id, slug: t.slug, expected_ngn: total },
      },
    });
  } catch (err) {
    console.error('[moneyTransfer.initPayment]', err.message);
    return res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
};

/* ── 3. Verify payment, then deliver ────────────────────────────────────── */
const verifyPayment = async (req, res) => {
  try {
    const txRef = req.body?.tx_ref || req.query?.tx_ref;
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required' });

    const { data: t } = await supabase.from('money_transfers')
      .select('*').eq('payment_ref', txRef).maybeSingle();
    if (!t) return res.status(404).json({ error: 'Payment not found' });

    // Already verified — idempotent, safe to call twice (FLW callback + redirect).
    if (t.payment_status === 'paid') {
      return res.json({ ok: true, already: true, transfer: publicShape(t) });
    }

    const r = await axios.get(
      `${FLW}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: flwH() },
    );
    const txn = r.data?.data;
    const status = String(txn?.status || '').toLowerCase();
    if (!FLW_SUCCESS.has(status)) {
      await supabase.from('money_transfers').update({ payment_status: 'failed' }).eq('id', t.id);
      return res.status(400).json({ error: 'Payment was not successful.' });
    }

    // Underpayment guard — same 10% tolerance the contribution flow uses to
    // absorb FX rounding on non-NGN cards.
    const expected = money(t.total_paid);
    if (Number(txn.amount) < expected * 0.9) {
      console.error(`[moneyTransfer] UNDERPAYMENT ref=${txRef} expected=${expected} got=${txn.amount}`);
      return res.status(400).json({ error: 'Payment amount does not match. Please contact support.' });
    }

    const claimToken = crypto.randomBytes(24).toString('hex');
    const { data: paid, error: payErr } = await supabase.from('money_transfers').update({
      payment_status: 'paid',
      paid_at:        new Date(),
      paid_amount:    Number(txn.amount),
      paid_currency:  txn.currency || 'NGN',
      status:         'paid',
      claim_token:    claimToken,
    }).eq('id', t.id).eq('payment_status', 'pending').select().maybeSingle();

    // Lost the race to a concurrent verify — that call already delivered it.
    if (!paid) {
      const { data: fresh } = await supabase.from('money_transfers').select('*').eq('id', t.id).maybeSingle();
      return res.json({ ok: true, already: true, transfer: publicShape(fresh || t) });
    }
    if (payErr) throw payErr;

    // Deliver now unless it is scheduled for later.
    const dueLater = paid.send_date && new Date(paid.send_date).getTime() - Date.now() > 30_000;
    if (!dueLater) await deliverTransfer(paid);

    return res.json({ ok: true, transfer: publicShape(paid), scheduled: !!dueLater });
  } catch (err) {
    console.error('[moneyTransfer.verifyPayment]', err.response?.data?.message || err.message);
    return res.status(500).json({ error: 'Could not verify payment. Please contact support.' });
  }
};

/* ── Delivery: email the recipient their claim link ─────────────────────── */
async function deliverTransfer(t) {
  try {
    const { data: fresh } = await supabase.from('money_transfers')
      .select('*').eq('id', t.id).maybeSingle();
    if (!fresh || fresh.payment_status !== 'paid' || fresh.recipient_notified) {
      return { skipped: true };
    }

    const claimToken = fresh.claim_token || crypto.randomBytes(24).toString('hex');
    // Conditional update so two concurrent deliveries cannot both send.
    const { data: marked } = await supabase.from('money_transfers').update({
      status: 'sent', recipient_notified: true, delivered_at: new Date(), claim_token: claimToken,
    }).eq('id', fresh.id).eq('recipient_notified', false).select('id').maybeSingle();
    if (!marked) return { skipped: true };

    const link = `${FRONTEND_URL}/money/${fresh.slug}?token=${claimToken}`;
    await sendEmail({
      to: fresh.recipient_email,
      template: 'moneyCardReceived',
      data: {
        senderName: fresh.sender_name,
        amount: money(fresh.gift_amount),
        message: fresh.message,
        claimUrl: link,
      },
    });

    // Receipt to the sender, so the charge is never a surprise. Best-effort:
    // a failed receipt must never make the recipient's delivery look failed.
    sendEmail({
      to: fresh.sender_email,
      template: 'moneyCardSent',
      data: {
        recipientName:  fresh.recipient_name,
        recipientEmail: fresh.recipient_email,
        amount:   money(fresh.gift_amount),
        cardFee:  money(fresh.card_fee),
        total:    money(fresh.total_paid),
      },
    }).catch(e => console.warn('[moneyTransfer] sender receipt failed:', e.message));

    console.log(`[moneyTransfer] delivered ${fresh.slug} → ${fresh.recipient_email}`);
    return { ok: true };
  } catch (err) {
    console.error('[moneyTransfer.deliverTransfer]', err.message);
    return { error: err.message };
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── 4. Sender's list + single read ─────────────────────────────────────── */
const listMine = async (req, res) => {
  try {
    const { data, error } = await supabase.from('money_transfers')
      .select('*').eq('sender_user_id', req.user.id)
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return res.json((data || []).map(publicShape));
  } catch (err) {
    console.error('[moneyTransfer.listMine]', err.message);
    return res.status(500).json({ error: 'Could not load your transfers' });
  }
};

const getMine = async (req, res) => {
  try {
    const { data: t } = await supabase.from('money_transfers')
      .select('*').eq('slug', req.params.slug).maybeSingle();
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.sender_user_id !== req.user?.id) return res.status(403).json({ error: 'Not authorized' });
    return res.json(t);
  } catch (err) {
    console.error('[moneyTransfer.getMine]', err.message);
    return res.status(500).json({ error: 'Could not load this card' });
  }
};

/* ── 5. Recipient view ──────────────────────────────────────────────────── */
const getPublic = async (req, res) => {
  try {
    const { slug } = req.params;
    const token = req.query.token;
    const { data: t } = await supabase.from('money_transfers')
      .select('*').eq('slug', slug).maybeSingle();
    if (!t) return res.status(404).json({ error: 'Card not found' });
    if (t.status === 'draft' || t.payment_status !== 'paid') {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Either the private token, or the signed-in owner of that email.
    const byToken = token && t.claim_token && token === t.claim_token;
    const byEmail = req.user?.email && lower(req.user.email) === lower(t.recipient_email);
    if (!byToken && !byEmail) return res.status(403).json({ error: 'This card is private.' });

    return res.json({ ...publicShape(t), isRecipient: true, can_claim: !t.claimed });
  } catch (err) {
    console.error('[moneyTransfer.getPublic]', err.message);
    return res.status(500).json({ error: 'Could not load this card' });
  }
};

/* ── 6. Claim: to a bank account, or as a gift card ─────────────────────── */
const claim = async (req, res) => {
  const { slug } = req.params;
  try {
    const { token, claim_type, bank_code, bank_name, account_number, account_name } = req.body || {};
    if (!['bank', 'giftcard'].includes(claim_type)) {
      return res.status(400).json({ error: 'Choose how you want the money: bank or giftcard.' });
    }

    const { data: t } = await supabase.from('money_transfers').select('*').eq('slug', slug).maybeSingle();
    if (!t) return res.status(404).json({ error: 'Card not found' });
    if (t.payment_status !== 'paid') return res.status(400).json({ error: 'This card has not been paid for.' });

    const byToken = token && t.claim_token && token === t.claim_token;
    const byEmail = req.user?.email && lower(req.user.email) === lower(t.recipient_email);
    if (!byToken && !byEmail) return res.status(403).json({ error: 'This card is private.' });
    if (t.claimed) return res.status(400).json({ error: 'This money has already been claimed.' });

    const gross = money(t.gift_amount);
    if (gross <= 0) return res.status(400).json({ error: 'There is no money on this card.' });
    const fee = Math.round(gross * PAYOUT_FEE_PCT);
    const net = gross - fee;

    if (claim_type === 'bank') {
      const code = String(bank_code || '').trim();
      const acct = String(account_number || '').trim();
      if (!code || !acct) return res.status(400).json({ error: 'Bank and account number are required.' });

      const transferRef = `TK-SEND-WD-${String(t.id).slice(0, 8).toUpperCase()}-${Date.now()}`;

      // Claim the money BEFORE calling Flutterwave. Only one request can flip
      // `claimed` false → true, so a double-click cannot pay out twice.
      const { data: locked } = await supabase.from('money_transfers').update({
        claimed: true, claimed_at: new Date(), claim_type: 'bank',
        claim_reference: transferRef, claim_status: 'processing',
        claim_amount: net, claim_fee: fee,
        claim_bank_name: clean(bank_name, 120),
        claim_account_last4: acct.slice(-4),
      }).eq('id', t.id).eq('claimed', false).select('id').maybeSingle();
      if (!locked) return res.status(400).json({ error: 'This money has already been claimed.' });

      try {
        const r = await flwTransferAxios().post(`${FLW}/transfers`, {
          account_bank:     code,
          account_number:   acct,
          amount:           net,
          narration:        `Thankeeu — from ${t.sender_name}`.slice(0, 100),
          currency:         'NGN',
          reference:        transferRef,
          beneficiary_name: String(account_name || t.recipient_name || 'Recipient').slice(0, 100),
          debit_currency:   'NGN',
        }, { headers: flwH() });

        const flwStatus = String(r.data?.data?.status || r.data?.status || '').toLowerCase();
        if (!['new', 'success', 'pending', 'processing'].includes(flwStatus) && r.data?.status !== 'success') {
          throw new Error(r.data?.message || 'Transfer was rejected');
        }
        await supabase.from('money_transfers').update({ status: 'claimed' }).eq('id', t.id);
        sendEmail({
          to: t.recipient_email,
          template: 'moneyCardClaimed',
          data: { claimType: 'bank', net, fee, gross, senderName: t.sender_name,
                  bankName: bank_name, last4: acct.slice(-4) },
        }).catch(e => console.warn('[moneyTransfer] claim email failed:', e.message));
        return res.json({ ok: true, claim_type: 'bank', amount: net, fee, reference: transferRef, status: 'processing' });
      } catch (transferErr) {
        // Release the lock so the recipient can try a different account.
        await supabase.from('money_transfers').update({
          claimed: false, claimed_at: null, claim_type: null, claim_reference: null,
          claim_status: null, claim_amount: null, claim_fee: null,
          claim_bank_name: null, claim_account_last4: null,
          claim_failure_reason: String(transferErr.response?.data?.message || transferErr.message).slice(0, 400),
        }).eq('id', t.id);
        console.error('[moneyTransfer.claim] FLW transfer failed:', transferErr.response?.data || transferErr.message);
        return res.status(502).json({ error: transferErr.response?.data?.message || 'Transfer failed. Please check the account details and try again.' });
      }
    }

    // Gift card — delegate to the existing Reloadly controller so there is one
    // gift-card integration, not two.
    const claimRef = `TK-SEND-GC-${String(t.id).slice(0, 8).toUpperCase()}-${Date.now()}`;
    const { data: locked } = await supabase.from('money_transfers').update({
      claimed: true, claimed_at: new Date(), claim_type: 'giftcard',
      claim_reference: claimRef, claim_status: 'processing',
      claim_amount: net, claim_fee: fee,
      claim_product_name: clean(req.body.product_name, 160),
    }).eq('id', t.id).eq('claimed', false).select('id').maybeSingle();
    if (!locked) return res.status(400).json({ error: 'This money has already been claimed.' });

    try {
      const { orderGiftCardDirect } = require('./reloadlyController');
      if (typeof orderGiftCardDirect !== 'function') {
        throw new Error('Gift card ordering is not available right now.');
      }
      const result = await orderGiftCardDirect({
        product_id:      req.body.product_id,
        amount:          net,
        recipient_email: t.recipient_email,
        reference:       claimRef,
      });
      await supabase.from('money_transfers').update({
        status: 'claimed', claim_status: 'paid',
        claim_redemption_code: result?.redemption_code || null,
        claim_product_name: result?.product_name || clean(req.body.product_name, 160),
      }).eq('id', t.id);
      sendEmail({
        to: t.recipient_email,
        template: 'moneyCardClaimed',
        data: { claimType: 'giftcard', net, fee, gross, senderName: t.sender_name,
                productName: result?.product_name, redemptionCode: result?.redemption_code },
      }).catch(e => console.warn('[moneyTransfer] claim email failed:', e.message));
      return res.json({ ok: true, claim_type: 'giftcard', amount: net, fee, ...result });
    } catch (gcErr) {
      await supabase.from('money_transfers').update({
        claimed: false, claimed_at: null, claim_type: null, claim_reference: null,
        claim_status: null, claim_amount: null, claim_fee: null, claim_product_name: null,
        claim_failure_reason: String(gcErr.message).slice(0, 400),
      }).eq('id', t.id);
      console.error('[moneyTransfer.claim] gift card failed:', gcErr.message);
      return res.status(502).json({ error: gcErr.message || 'Could not issue the gift card. Please try your bank instead.' });
    }
  } catch (err) {
    console.error('[moneyTransfer.claim]', err.message);
    return res.status(500).json({ error: 'Could not complete your claim. Please try again.' });
  }
};

/* ── 7. Cards waiting for the signed-in user (recipient inbox) ──────────── */
const listReceived = async (req, res) => {
  try {
    const email = lower(req.user.email);
    const { data, error } = await supabase.from('money_transfers')
      .select('*').eq('recipient_email', email).eq('payment_status', 'paid')
      .order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return res.json((data || []).map(publicShape));
  } catch (err) {
    console.error('[moneyTransfer.listReceived]', err.message);
    return res.status(500).json({ error: 'Could not load received money' });
  }
};

/* ── 8. Scheduled delivery sweep (called from server.js cron) ───────────── */
async function sweepDueTransfers() {
  const nowISO = new Date().toISOString();
  const { data, error } = await supabase.from('money_transfers')
    .select('*')
    .eq('status', 'paid')
    .eq('recipient_notified', false)
    .not('send_date', 'is', null)
    .lte('send_date', nowISO);
  if (error) { console.error('[moneyTransfer.sweep]', error.message); return; }
  for (const t of data || []) {
    await deliverTransfer(t).catch(e => console.error('[moneyTransfer.sweep] deliver:', e.message));
  }
}

/* ── 9. Media upload for the card (photo / GIF / video / voice) ─────────────
 * Reuses the same Cloudinary middleware the group-card messages use, so the
 * stored shape is identical: media_url + media_type on the row, extras as a
 * media_gallery array of { media_url, media_type }. That is what
 * frontend/src/utils/messageMedia.js reads.
 */
const uploadMedia = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No files were uploaded' });

    const appUrl = (process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
    const toItem = (f) => ({
      media_url: f.path?.startsWith('http') ? f.path : `${appUrl}/uploads/${require('path').basename(f.path)}`,
      media_type: f.mimetype?.startsWith('video/') ? 'video'
        : f.mimetype?.startsWith('audio/') ? 'voice'
        : f.mimetype === 'image/gif' ? 'gif'
        : 'image',
    });
    const items = files.map(toItem);
    return res.json({ items, media_url: items[0].media_url, media_type: items[0].media_type,
                      media_gallery: items.slice(1) });
  } catch (err) {
    console.error('[moneyTransfer.uploadMedia]', err.message);
    return res.status(500).json({ error: 'Could not upload your files. Please try again.' });
  }
};

module.exports = {
  createDraft, initPayment, verifyPayment, listMine, getMine, uploadMedia,
  getPublic, claim, listReceived, deliverTransfer, sweepDueTransfers,
  CARD_FEE_NGN, MIN_GIFT_NGN, MAX_GIFT_NGN, PAYOUT_FEE_PCT,
};
