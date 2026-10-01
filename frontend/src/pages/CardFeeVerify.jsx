/**
 * CardFeeVerify.jsx — /create-card/verify
 *
 * Handles FLW redirects after TWO types of payment:
 *  1. card_fee      (tx_ref starts TK-FEE-) → activate the card
 *  2. card_credits  (tx_ref starts TK-CR-)  → add credits to account
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI, creditsAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Lemon Squeezy confirms by webhook, usually within seconds. Poll our own
// status endpoint for up to about 90 seconds before handing off to the dashboard.
async function waitForLemonPayment(ref, k) {
  const DONE = new Set(['paid', 'amount_mismatch', 'refunded', 'failed', 'init_failed']);
  let last = null;
  for (let i = 0; i < 45; i++) {
    try {
      const r = await paymentsAPI.lemonStatus(ref, k);
      last = r.data;
      if (DONE.has(last?.status)) return last;
    } catch (e) {
      if (e.response?.status === 404) return null;
    }
    await new Promise(res => setTimeout(res, 2000));
  }
  return last;
}

export default function CardFeeVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Confirming your payment…');

  useEffect(() => {
    const run = async () => {
      const txRef  = searchParams.get('tx_ref') || searchParams.get('reference');
      const status = searchParams.get('status');

      if (status === 'cancelled' || !txRef) {
        toast.error('Payment was cancelled.');
        navigate('/dashboard', { replace: true });
        return;
      }

      try {
        // ── Lemon Squeezy: its signed webhook marks the payment paid on our
        //    server; here we only wait for that to happen.
        if (searchParams.get('provider') === 'lemonsqueezy') {
          setMsg('Confirming your payment…');
          const ls = await waitForLemonPayment(txRef, searchParams.get('k'));
          if (!ls || ls.status === 'pending' || ls.status === 'processing') {
            toast('Your payment is still being confirmed. It completes on its own within a few minutes, so check your dashboard shortly.', { duration: 8000 });
            navigate(txRef.startsWith('TK-CR-') ? '/dashboard/credits' : '/dashboard', { replace: true });
            return;
          }
          if (ls.status !== 'paid') {
            toast.error(`We could not confirm this payment. If you were charged, contact support with reference ${txRef}.`, { duration: 10000 });
            navigate('/dashboard', { replace: true });
            return;
          }
          if (ls.type === 'card_credits') {
            toast.success(`${ls.credits || ''} credit${ls.credits === 1 ? '' : 's'} added!`.trim());
            navigate('/dashboard/credits', { replace: true });
            return;
          }
          // Card fee: continue with the same steps as any other paid card.
          await finishCardFee({ card_slug: ls.card_slug, was_pay_later: ls.was_pay_later, already_active: false });
          return;
        }

        // Detect payment type by prefix
        if (txRef.startsWith('TK-CR-')) {
          // ── Credit purchase ─────────────────────────────────────────────
          setMsg('Adding credits to your account…');
          const res = await creditsAPI.verify(txRef);
          const { credits_added, already_processed } = res.data;
          if (already_processed) {
            toast('Credits already added to your account ✓');
          } else {
            toast.success(`${credits_added} credit${credits_added > 1 ? 's' : ''} added! 🎉`);
          }
          navigate('/dashboard/credits', { replace: true });

        } else {
          // ── Card fee payment ─────────────────────────────────────────────
          setMsg('Activating your card…');
          const txnId = searchParams.get('transaction_id');
          let res = await paymentsAPI.verifyCardFee(txRef, txnId);
          // 202 = the bank is still finishing (3D Secure on foreign cards). Wait and ask again.
          for (let i = 0; res.status === 202 && i < 8; i++) {
            setMsg('Your bank is confirming the payment…');
            await new Promise(r => setTimeout(r, 2500));
            res = await paymentsAPI.verifyCardFee(txRef, txnId);
          }
          if (res.status === 202) {
            toast('Your bank is still confirming. Your card activates on its own once it clears.');
            navigate('/dashboard', { replace: true });
            return;
          }
          await finishCardFee(res.data);
        }

      } catch (err) {
        handleError(err);
      }
    };

    // Shared by Flutterwave and Lemon Squeezy once the card fee is confirmed paid.
    const finishCardFee = async ({ card_slug, already_active, was_pay_later }) => {
          if (was_pay_later) {
            // "Create Now, Pay Later" card: it was already live — this payment
            // unlocks delivery. The pay page shows when it will be delivered.
            toast.success('Payment received — your card will be delivered 🎉');
            navigate(`/pay/${card_slug}`, { replace: true });
            return;
          }
          if (already_active) {
            toast('Your card was already active ✓');
          } else {
            toast.success('Card is now active! 🎉');
          }

          // Restore pending creator message + send invite emails
          try {
            const saved = JSON.parse(localStorage.getItem('thankeeu_pending_card') || localStorage.getItem('thankeeu_card_draft') || '{}');
            // Only use saved invites/message if they belong to THIS card — a
            // stale snapshot from another card must never be applied here.
            const pending = (saved?.slug && saved.slug === card_slug) ? saved : {};

            // Send invite emails to signers
            const emailList = pending?.inviteEmails || [];
            if (emailList.length && card_slug) {
              const { cardsAPI: cAPI } = await import('../utils/api');
              await cAPI.activate(card_slug, { inviteEmails: emailList }).catch(e =>
                console.warn('[CardFeeVerify] invite emails failed:', e?.message)
              );
            }

            const snap = pending?.msgSnapshot;
            if (snap?.content?.trim() && card_slug) {
              const { messagesAPI } = await import('../utils/api');
              const fd = new FormData();
              fd.append('author_name',  pending?.creatorName || pending?.formSnapshot?.creator_name || 'Card Creator');
              fd.append('author_email', pending?.creatorEmail || pending?.formSnapshot?.creator_email || '');
              fd.append('content',      snap.content);
              fd.append('font_style',   snap.font_style || 'handwritten');
              fd.append('is_private',   snap.is_private || false);
              await messagesAPI.add(card_slug, fd).catch(e =>
                console.warn('[CardFeeVerify] creator msg save failed:', e?.message)
              );
            }
          } catch (msgErr) {
            console.warn('[CardFeeVerify] could not restore creator message:', msgErr?.message);
          }

          navigate(`/card/${card_slug}`, { replace: true });
    };

    const handleError = (err) => {
        const status = searchParams.get('status');
        const data = err.response?.data || {};
        const errMsg = data.error || err.message;
        console.error('CardFeeVerify error:', errMsg);
        if (data.failed) {
          // Declined by the bank: nothing was charged. Send them back to pay again.
          toast.error(errMsg, { duration: 8000 });
          const slug = data.card_slug;
          navigate(slug ? `/pay/${slug}?declined=1` : '/dashboard', { replace: true });
          return;
        }
        toast.error(status === 'failed'
          ? 'The payment did not go through, so you were not charged. Please try again.'
          : 'We could not confirm your payment yet. Check your dashboard, and contact support if you were charged.');
        navigate('/dashboard', { replace: true });
    };

    run();
  }, []);

  return (
    <div className="section-dots" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F0FF' }}>
      <div style={{ textAlign:'center', padding:'2rem' }}>
        <div style={{ width:56, height:56, border:'4px solid #E9D5FF', borderTopColor:'#7C3AED',
          borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1.5rem' }} />
        <p style={{ fontSize:'1.2rem', fontWeight:700, color:'#1C1243', marginBottom:'0.5rem' }}>{msg}</p>
        <p style={{ color:'#6B7280', fontSize:'0.9rem' }}>Please wait a moment</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
