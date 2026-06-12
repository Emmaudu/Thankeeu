import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { vendorAPI } from '../../utils/api';

export default function VendorOrderSuccess() {
  const [params]  = useSearchParams();
  const txRef     = params.get('tx_ref') || params.get('transaction_id');
  const [state, setState] = useState('verifying'); // verifying | success | failed
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!txRef) { setState('failed'); return; }
    vendorAPI.verifyOrder(txRef)
      .then(r => { setState('success'); setOrder(r.data); })
      .catch(() => setState('failed'));
  }, [txRef]);

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 max-w-md w-full text-center">

          {state === 'verifying' && (
            <>
              <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-5"/>
              <h2 className="text-xl font-bold text-warm-900 mb-2">Confirming your order…</h2>
              <p className="text-warm-500 text-sm">Please wait — this takes just a moment.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-extrabold text-warm-900 mb-2">Order confirmed!</h2>
              <p className="text-warm-600 text-sm mb-2">Your payment was received. The vendor has been notified and will prepare your order.</p>
              {order?.order_id && (
                <p className="text-xs text-warm-400 mb-6">Order #{order.order_id.slice(0,8).toUpperCase()}</p>
              )}
              <p className="text-xs text-warm-400 mb-6">Check your email for a confirmation with order details.</p>
              <Link to="/" className="btn-primary px-8 py-3 inline-block">Back to Thankeeu →</Link>
            </>
          )}

          {state === 'failed' && (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-extrabold text-warm-900 mb-2">Payment incomplete</h2>
              <p className="text-warm-600 text-sm mb-6">Your payment was not completed or could not be verified. You have not been charged. Please try again.</p>
              <Link to="/" className="btn-primary px-8 py-3 inline-block">Go back →</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
