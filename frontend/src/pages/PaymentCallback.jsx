import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const txRef    = searchParams.get('tx_ref') || searchParams.get('reference') || searchParams.get('trxref');
    const type     = searchParams.get('type');
    const cardSlug = searchParams.get('card_slug');
    const status_  = searchParams.get('status');

    if (!txRef || status_ === 'cancelled') {
      toast.error('Payment was cancelled or the link is invalid.');
      setStatus('cancelled');
      setTimeout(() => navigate(-1), 2000);
      return;
    }

    (async () => {
      try {
        const res = await paymentsAPI.verify(txRef);
        const { card_slug: activatedSlug, type: payType } = res.data;

        if (payType === 'card_fee' && activatedSlug) {
          toast.success('✅ Payment confirmed! Your card is now active.');
          navigate(`/card/${activatedSlug}`, { replace: true });
        } else if (payType === 'gift_contribution') {
          toast.success('🎉 Gift contribution confirmed!');
          if (cardSlug) navigate(`/sign/${cardSlug}`, { replace: true });
          else navigate('/dashboard', { replace: true });
        } else if (res.data.status === 'success') {
          toast.success('✅ Payment confirmed!');
          navigate('/dashboard', { replace: true });
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error('Payment callback verify error:', err);
        toast.error(err.response?.data?.error || 'Could not confirm payment. Please check your dashboard.');
        setStatus('failed');
        setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0FF' }}>
      <div className="text-center px-4">
        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6" />
            <p className="font-display text-xl font-bold text-warm-900 mb-2">Confirming your payment...</p>
            <p className="text-warm-500 text-sm">Please wait a moment</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <p className="font-display text-xl font-bold text-warm-900 mb-2">Verification pending</p>
            <p className="text-warm-500 text-sm">Redirecting you to your dashboard...</p>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="font-display text-xl font-bold text-warm-900 mb-2">Payment cancelled</p>
          </>
        )}
      </div>
    </div>
  );
}
