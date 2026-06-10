/**
 * CardFeeVerify.jsx — /create-card/verify
 *
 * FLW redirects here after card creation fee payment:
 *   /create-card/verify?tx_ref=TK-FEE-...&status=successful&transaction_id=...
 *
 * This page calls the backend to verify, activates the card,
 * then navigates to /card/slug so the creator sees their live card.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function CardFeeVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Confirming your payment...');

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
        setMsg('Activating your card...');
        const res = await paymentsAPI.verifyCardFee(txRef);
        const { card_slug } = res.data;
        toast.success('Card is now active! 🎉');
        navigate(`/card/${card_slug}`, { replace: true });
      } catch (err) {
        const errMsg = err.response?.data?.error || err.message;
        console.error('CardFeeVerify error:', errMsg);
        toast.error('Payment received but activation had an issue. Please check your dashboard.');
        navigate('/dashboard', { replace: true });
      }
    };
    run();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0FF' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: 56, height: 56,
          border: '4px solid #E9D5FF', borderTopColor: '#7C3AED',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1.5rem',
        }} />
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1C1243', marginBottom: '0.5rem' }}>{msg}</p>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Please wait a moment</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
