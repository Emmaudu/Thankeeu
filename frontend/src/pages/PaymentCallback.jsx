/**
 * PaymentCallback.jsx
 *
 * FLW hosted checkout redirects here after payment.
 * URL format: /payment/callback?tx_ref=TK-FEE-...&status=successful&transaction_id=...
 *
 * Also handles gift contribution redirects from /sign/slug?contributed=1&tx_ref=...
 * but those are handled directly in SignCard.jsx — this page handles card_fee only.
 */

import { useEffect, useState } from 'react';
import Icon from '../components/ui/Icon';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Confirming your payment...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const run = async () => {
      // FLW appends: ?status=successful&tx_ref=...&transaction_id=...
      const status = searchParams.get('status');
      const txRef  =
        searchParams.get('tx_ref')    ||
        searchParams.get('reference') ||
        searchParams.get('trxref');

      if (status === 'cancelled' || !txRef) {
        toast.error('Payment was cancelled.');
        setFailed(true);
        setTimeout(() => navigate(-1), 2500);
        return;
      }

      try {
        // Try card fee verify first
        setMsg('Activating your card...');
        const res = await paymentsAPI.verifyCardFee(txRef);
        const { card_slug } = res.data;

        if (card_slug) {
          toast.success('Card is now active!');
          navigate(`/card/${card_slug}`, { replace: true });
          return;
        }

        // Fallback to generic verify (gift contribution etc.)
        const generic = await paymentsAPI.verify(txRef);
        if (generic.data.type === 'gift_contribution') {
          toast.success('Gift confirmed!');
          navigate('/dashboard', { replace: true });
          return;
        }

        toast.success('Payment confirmed!');
        navigate('/dashboard', { replace: true });

      } catch (err) {
        const errMsg = err.response?.data?.error || err.message || 'Verification failed';
        console.error('PaymentCallback error:', errMsg);
        toast.error(errMsg);
        setMsg('Verification failed. Redirecting...');
        setFailed(true);
        setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
      }
    };

    run();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0FF' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        {!failed ? (
          <>
            <div style={{
              width: 56, height: 56, border: '4px solid #E9D5FF',
              borderTopColor: '#7C3AED', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 1.5rem',
            }} />
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1C1243', marginBottom: '0.5rem' }}>
              {msg}
            </p>
            <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Please wait a moment</p>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', display:'flex', justifyContent:'center' }}><Icon name="AlertCircle" size={44} style={{color:'#F59E0B'}}/></div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1C1243' }}>
              Something went wrong. Redirecting...
            </p>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
