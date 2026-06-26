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
          const res = await paymentsAPI.verifyCardFee(txRef);
          const { card_slug, already_active } = res.data;
          if (already_active) {
            toast('Your card was already active ✓');
          } else {
            toast.success('Card is now active! 🎉');
          }

          // Restore pending creator message + send invite emails
          try {
            const pending = JSON.parse(localStorage.getItem('thankeeu_pending_card') || localStorage.getItem('thankeeu_card_draft') || '{}');

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
        }

      } catch (err) {
        const errMsg = err.response?.data?.error || err.message;
        console.error('CardFeeVerify error:', errMsg);
        toast.error('Payment received but something went wrong. Check your dashboard.');
        navigate('/dashboard', { replace: true });
      }
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
