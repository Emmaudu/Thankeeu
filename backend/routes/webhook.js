/**
 * Flutterwave Webhook — /webhook/flutterwave
 *
 * This is the server-to-server safety net.
 * FLW calls this after every successful payment, even if the user's browser
 * closed before the frontend callback fired.
 *
 * Mounted BEFORE express.json() in server.js so the raw body is preserved
 * for HMAC signature verification.
 *
 * Set FLW_SECRET_HASH in Railway to the "Secret Hash" from your FLW dashboard.
 * Webhook URL in FLW dashboard: https://YOUR-RAILWAY-URL/webhook/flutterwave
 */

const express  = require('express');
const router   = express.Router();
const supabase = require('../utils/supabase');
const emailUtil = require('../utils/email');
const sendEmail = emailUtil.sendEmail || emailUtil;
const GAMES_URL = (process.env.GAMES_URL || 'https://www.thankeeu.com/games').replace(/\/$/, '');
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

router.post('/flutterwave', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // ── 1. Verify signature ───────────────────────────────────────────────────
    const secret    = process.env.FLW_SECRET_HASH || '';
    const signature = req.headers['verif-hash'];

    if (!secret || !signature || signature !== secret) {
      console.warn('FLW webhook: invalid or missing signature');
      return res.sendStatus(401);
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      console.warn('FLW webhook: could not parse body');
      return res.sendStatus(400);
    }

    const { event: eventName, data: txn } = event;
    console.log('FLW webhook received:', eventName, txn?.tx_ref, txn?.status);

    // ── 3. Acknowledge immediately (FLW has a 5s timeout) ────────────────────
    res.sendStatus(200);

    // Only process successful charge.completed events
    if (eventName !== 'charge.completed' || !['successful', 'completed'].includes(txn?.status)) return;

    const meta        = txn.meta || {};
    const type        = meta.type;
    const txRef       = txn.tx_ref;
    const amountNaira = Math.floor(txn.amount);

    console.log('FLW webhook processing type:', type, 'txRef:', txRef);

    // ── 4. card_fee: activate the card ────────────────────────────────────────
    if (type === 'card_fee' && meta.card_slug) {
      const { data: card, error } = await supabase.from('cards')
        .update({ status: 'active' })
        .eq('slug', meta.card_slug)
        .select('slug').maybeSingle();

      if (error) console.error('Webhook card_fee activation error:', error.message);
      else console.log('Webhook: card activated:', card?.slug || meta.card_slug);
      return;
    }

    // ── 5. gift_contribution: update contribution + card total + message ──────
    if (type === 'gift_contribution' && meta.card_id) {
      const cardId = meta.card_id;

      // Check if already processed
      let existing = null;
      try {
        const { data } = await supabase.from('contributions')
          .select('id, status').eq('flw_reference', txRef).maybeSingle();
        existing = data;
      } catch {}

      const alreadyDone = existing?.status === 'success';

      // Upsert contribution
      if (existing) {
        await supabase.from('contributions')
          .update({ status: 'success', amount: amountNaira })
          .eq('id', existing.id);
      } else {
        try {
          await supabase.from('contributions').insert({
            card_id:           cardId,
            flw_reference:     txRef,
            amount:            amountNaira,
            contributor_name:  txn.customer?.name || '',
            contributor_email: txn.customer?.email || '',
            status:            'success',
          });
        } catch (e) { console.warn('Webhook contribution insert:', e.message); }
      }

      // Update card total_collected (only if new)
      if (!alreadyDone) {
        let cardRow = null;
        try {
          const { data } = await supabase.from('cards').select('total_collected').eq('id', cardId).maybeSingle();
          cardRow = data;
        } catch {}
        try {
          await supabase.from('cards')
            .update({ total_collected: (cardRow?.total_collected || 0) + amountNaira })
            .eq('id', cardId);
        } catch (e) { console.warn('Webhook total_collected:', e.message); }
      }

      // Update message contributed_amount
      // Try via message_id first, then email fallback
      let msgUpdated = false;
      try {
        const { data: contrib } = await supabase.from('contributions')
          .select('message_id').eq('flw_reference', txRef).maybeSingle();
        if (contrib?.message_id) {
          await supabase.from('messages')
            .update({ payment_verified: true, contributed_amount: amountNaira })
            .eq('id', contrib.message_id);
          msgUpdated = true;
        }
      } catch (_) { /* message_id column may not exist */ }

      if (!msgUpdated && txn.customer?.email) {
        const { data: msg } = await supabase.from('messages').select('id')
          .eq('card_id', cardId).eq('author_email', txn.customer.email)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (msg) {
          await supabase.from('messages')
            .update({ payment_verified: true, contributed_amount: amountNaira })
            .eq('id', msg.id);
        }
      }

      console.log('Webhook: gift contribution processed, cardId:', cardId, 'amount:', amountNaira);
      return;
    }

    // ── 5b. games_sponsorship: mark sponsor pledge paid ─────────────────────
    if (type === 'games_sponsorship' && txRef) {
      const { data: sponsorship } = await supabase
        .from('games_sponsorships')
        .select('id, amount, status, contact_email, contact_name, sponsor_company, week_key')
        .eq('flw_reference', txRef)
        .maybeSingle();
      if (sponsorship && sponsorship.status !== 'paid' && Number(txn.amount || 0) >= Number(sponsorship.amount || 0) * 0.9) {
        await supabase
          .from('games_sponsorships')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            flw_transaction_id: String(txn.id || ''),
            updated_at: new Date().toISOString()
          })
          .eq('id', sponsorship.id);
        if (sponsorship.contact_email) {
          await sendEmail({
            to: sponsorship.contact_email,
            subject: 'Thank you for sponsoring Thankeeu Games',
            html: `<p>Hi ${escapeHtml(sponsorship.contact_name)},</p><p>Thank you to ${escapeHtml(sponsorship.sponsor_company)} for sponsoring ${escapeHtml(sponsorship.week_key)} with NGN ${Number(sponsorship.amount).toLocaleString()}.</p><p>Your brand will be promoted across the Thankeeu Games experience and Thankeeu culture channels.</p><p><a href="${GAMES_URL}/gifts">View sponsorship gift page</a></p>`,
          }).catch(() => {});
        }
        console.log('Webhook: games sponsorship paid:', txRef);
      }
      return;
    }

    // ── 6. company_subscription ───────────────────────────────────────────────
    // FLW sometimes drops custom meta on hosted checkout — fall back to tx_ref
    const isSubTxRef = txRef && txRef.startsWith('TK-SUB-');
    let subCompanyId = meta.company_id || null;
    let subPlan      = meta.plan       || null;

    if (isSubTxRef && !subCompanyId) {
      // tx_ref = TK-SUB-{first8ofCompanyId}-{timestamp}
      // extract the 8-char prefix and look up the company
      const parts     = txRef.split('-'); // ['TK','SUB','4D6B0016','timestamp']
      const partialId = (parts[2] || '').toLowerCase();
      if (partialId.length >= 4) {
        const { data: co } = await supabase.from('companies')
          .select('id').ilike('id', `${partialId}%`).maybeSingle();
        if (co?.id) {
          subCompanyId = co.id;
          console.log('Webhook: resolved company_id from tx_ref:', subCompanyId);
        }
      }
    }
    if (isSubTxRef && !subPlan) {
      subPlan = amountNaira >= 2000000 ? 'yearly' : 'monthly';
    }

    if ((type === 'company_subscription' || isSubTxRef) && subCompanyId) {
      const companyId = subCompanyId;
      const plan      = subPlan || 'monthly';
      if (!plan) { console.warn('Webhook: missing plan in subscription meta'); return; }

      const now = new Date();
      const expires_at = plan === 'yearly'
        ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
        : new Date(new Date(now).setMonth(now.getMonth() + 1));

      // Idempotency: skip if already processed
      const { data: already } = await supabase.from('company_subscriptions')
        .select('id').eq('flw_reference', txRef).maybeSingle();
      if (already) { console.log('Webhook: subscription already processed:', txRef); return; }

      const { data: existingSub } = await supabase.from('company_subscriptions')
        .select('id').eq('company_id', companyId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

      // Use shared saveSubscription helper (handles both tables, proper error logging)
      const { saveSubscription } = require('../controllers/subscriptionController');
      await saveSubscription(companyId, plan, txRef, expires_at);

      console.log('Webhook: subscription activated, company:', companyId, 'plan:', plan);
      return;
    }

    // ── 7. transfer.completed — bank transfer success or failure ─────────────
    // FLW fires this when a bank transfer reaches a terminal state.
    // We use this to: confirm success, reverse failed withdrawals, notify recipient.
    if (eventName === 'transfer.completed') {
      const flwRef    = txn.reference;
      const flwStatus = (txn.status || '').toUpperCase(); // 'SUCCESSFUL' | 'FAILED'
      console.log('[transfer webhook]', flwRef, flwStatus);

      // ── Send Money payout (bank claim) ─────────────────────────────────────
      // The claim endpoint already flipped `claimed` and wrote claim_reference
      // before calling FLW; this is the terminal confirmation. On FAILED we
      // release the claim so the recipient can retry with another account —
      // the money is still theirs.
      if (flwRef?.startsWith('TK-SEND-WD-')) {
        const { data: transfer } = await supabase.from('money_transfers')
          .select('id, slug, claimed, recipient_email, recipient_name, sender_name, claim_amount')
          .eq('claim_reference', flwRef).maybeSingle();

        if (!transfer) { console.warn('[transfer webhook] money_transfer not found:', flwRef); return; }

        if (flwStatus === 'SUCCESSFUL') {
          await supabase.from('money_transfers').update({
            claim_status: 'paid', status: 'claimed', updated_at: new Date(),
          }).eq('id', transfer.id);
          console.log('[transfer webhook] Send Money payout confirmed:', transfer.slug);
        } else if (flwStatus === 'FAILED') {
          await supabase.from('money_transfers').update({
            claimed: false, claimed_at: null, claim_type: null, claim_reference: null,
            claim_status: 'failed', claim_amount: null, claim_fee: null,
            claim_bank_name: null, claim_account_last4: null, status: 'sent',
            claim_failure_reason: txn.complete_message || 'The bank rejected the transfer',
            updated_at: new Date(),
          }).eq('id', transfer.id);
          console.log('[transfer webhook] Send Money payout FAILED, claim released:', transfer.slug);
        }
        return;
      }

      // ── Gift pot withdrawal ─────────────────────────────────────────────────
      if (flwRef?.startsWith('TK-GIFT-WD-')) {
        const { data: card } = await supabase.from('cards')
          .select('id, gift_withdrawn, total_collected, recipient_name, recipient_email, title, slug')
          .eq('gift_payout_reference', flwRef).maybeSingle();

        if (!card) { console.warn('[transfer webhook] card not found:', flwRef); return; }

        if (flwStatus === 'SUCCESSFUL') {
          // Confirm wallet disbursed (idempotent in case withdrawGift already set it)
          const { data: wallet } = await supabase.from('contribution_wallets')
            .select('id').eq('card_id', card.id).maybeSingle();
          if (wallet?.id) {
            await supabase.from('contribution_wallets').update({
              disbursed: true, disbursed_at: new Date(),
              disbursement_method: 'bank_transfer', updated_at: new Date(),
            }).eq('id', wallet.id);
          }
          console.log('[transfer webhook] Gift withdrawal confirmed for card:', card.id);

        } else if (flwStatus === 'FAILED') {
          // Reverse withdrawal — recipient can retry
          await supabase.from('cards').update({
            gift_withdrawn: false, gift_withdrawn_at: null,
            gift_payout_reference: null, gift_payout_amount: null,
          }).eq('id', card.id);

          // Restore total_collected from wallet
          const { data: wallet } = await supabase.from('contribution_wallets')
            .select('id, total_contributed').eq('card_id', card.id).maybeSingle();
          if (wallet?.id) {
            await supabase.from('contribution_wallets').update({
              disbursed: false, disbursed_at: null,
              disbursement_method: null, updated_at: new Date(),
            }).eq('id', wallet.id);
            await supabase.from('cards').update({
              total_collected: wallet.total_contributed || 0, updated_at: new Date(),
            }).eq('id', card.id);
          }

          // Notify recipient they can retry
          const { sendEmail } = require('../utils/email');
          const frontUrl = process.env.FRONTEND_URL || 'https://thankeeu.com';
          if (card.recipient_email) {
            await sendEmail({ to: card.recipient_email, template: 'giftWithdrawalFailed', data: {
              recipientName: card.recipient_name,
              cardTitle:     card.title || `${card.recipient_name}'s card`,
              amount:        txn.amount,
              reason:        txn.complete_message || 'Transfer could not be completed',
              retryUrl:      `${frontUrl}/card/${card.slug}`,
            }}).catch(() => {});
          }
          console.log('[transfer webhook] Gift withdrawal FAILED — reversed for card:', card.id);
        }
        return;
      }

      // ── Regular withdrawal (deductions etc.) ────────────────────────────────
      if (flwRef?.startsWith('TK-WD-')) {
        const { data: withdrawal } = await supabase.from('withdrawals')
          .select('id, requester_id, requester_type, amount, source_type, source_id')
          .eq('flw_reference', flwRef).maybeSingle();

        if (!withdrawal) { console.warn('[transfer webhook] withdrawal not found:', flwRef); return; }

        if (flwStatus === 'SUCCESSFUL') {
          await supabase.from('withdrawals').update({
            status: 'success', processed_at: new Date(), updated_at: new Date(),
          }).eq('id', withdrawal.id);

        } else if (flwStatus === 'FAILED') {
          await supabase.from('withdrawals').update({
            status: 'failed',
            failure_reason: txn.complete_message || 'Transfer failed at Flutterwave',
            updated_at: new Date(),
          }).eq('id', withdrawal.id);

          // Release deduction so leader can retry
          if (withdrawal.source_type === 'deduction' && withdrawal.source_id) {
            await supabase.from('deduction_requests').update({
              withdrawal_requested: false, withdrawal_id: null,
            }).eq('id', withdrawal.source_id);
          }
        }
        console.log('[transfer webhook] Regular withdrawal', flwStatus, ':', withdrawal.id);
        return;
      }
    }

    console.log('Webhook: unhandled type:', type, 'event:', eventName);

  } catch (err) {
    // 200 already sent — just log
    console.error('FLW webhook processing error:', err.message);
  }
});

module.exports = router;
