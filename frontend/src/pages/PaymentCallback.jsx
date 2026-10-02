import { prefixOf } from '../utils/market';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentsApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    // Flutterwave callback sends: tx_ref, transaction_id, status
    // Flutterwave also supports legacy ?reference param for compatibility
    const reference =
      searchParams.get('tx_ref') ||
      searchParams.get('reference') ||
      searchParams.get('trxref');

    const flwStatus = searchParams.get('status'); // 'successful' | 'cancelled' | 'failed'

    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found. If you completed a payment, please check your dashboard.');
      return;
    }

    if (flwStatus === 'cancelled') {
      setStatus('failed');
      setMessage('Payment was cancelled. No funds were charged.');
      return;
    }

    if (flwStatus === 'failed') {
      setStatus('failed');
      setMessage('Payment failed. No funds were charged. Please try again.');
      return;
    }

    // Card payments (Rapyd) can take a few seconds to be confirmed after the
    // redirect, so a "not confirmed yet" answer is retried before giving up.
    let tries = 0;
    const verify = async () => {
      try {
        const { data } = await paymentsApi.verify(reference);
        if (!data.success && data.pending && tries < 8) {
          tries += 1;
          setTimeout(verify, 2500);
          return;
        }
        if (data.success) {
          setStatus('success');
          setPayment(data.payment);
          const isFundTask = data.payment?.payment_type === 'workmanship' && !data.payment?.custom_payment_id;
          const isVooom = data.payment?.payment_type === 'vooom';
          const isTip = data.payment?.payment_type === 'tip';
          setMessage(isTip
            ? 'Thank you! The money has been sent to your tasker. It goes straight to their earnings with no platform fee.'
            : isVooom
            ? 'Vooom payment successful! Your delivery is now funded. Confirm delivery when the carrier hands over your item.': isFundTask
            ? 'Task funded successfully! The tasker has been notified by email and can now start work. Your payment is held securely in escrow.': 'Your payment was successful! Funds are now held securely in escrow.');
          setTimeout(() => {
            if (isVooom && data.payment?.vooom_task_id) {
              navigate(`/vooom/${data.payment.vooom_task_id}`, { replace: true });
            } else if (isTip && data.payment?.task_id) {
              navigate(`${prefixOf(user?.market || 'NG')}/requester?tab=tasks&task=${data.payment.task_id}`, { replace: true });
            } else {
              const dest = `${prefixOf(user?.market || 'NG')}${user?.role === 'tasker' ? '/tasker' : '/requester'}`;
              navigate(dest, { replace: true });
            }
          }, 4000);
        } else {
          setStatus('failed');
          setMessage(data.pending
            ? 'Your bank has not confirmed the payment yet. Check your dashboard in a few minutes; the task is marked paid as soon as it is confirmed.'
            : 'Payment verification failed or was not completed. No funds were charged.');
        }
      } catch (err) {
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Payment verification encountered an error.');
      }
    };

    verify();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/auth';
    return `${prefixOf(user.market || 'NG')}${user.role === 'tasker' ? '/tasker' : '/requester'}`;
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full card p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-heading text-xl font-bold text-dark mb-2">Verifying Payment...</h2>
            <p className="text-muted text-sm">Please wait while we confirm your payment. Do not close this window.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-5xl mx-auto mb-6"></div>
            <h2 className="font-heading text-2xl font-bold text-dark mb-2">Payment Successful!</h2>
            <p className="text-muted mb-4">{message}</p>

            {payment && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Amount</span>
                  <span className="font-bold text-gray-800">
                    {payment.currency || 'NGN'} {Number(payment.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted">Type</span>
                  <span className="font-medium capitalize text-gray-700">{payment.payment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Reference</span>
                  <span className="font-mono text-xs text-gray-600">{payment.flw_reference?.slice(-12)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted mb-4">Redirecting you to your dashboard in a few seconds...</p>
            <Link to={getDashboardPath()} className="btn-primary w-full block">Go to Dashboard →</Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-5xl mx-auto mb-6"></div>
            <h2 className="font-heading text-xl font-bold text-dark mb-2">Payment Not Completed</h2>
            <p className="text-muted mb-6">{message}</p>
            <div className="space-y-3">
              <Link to={getDashboardPath()} className="btn-primary w-full block">Go to Dashboard</Link>
              <Link to={`${prefixOf(user?.market || 'NG')}/tasks`} className="btn-outline w-full block">Browse Tasks</Link>
            </div>
            <p className="text-xs text-muted mt-4">
              If you believe this is an error, <a href="/contact" className="text-rose-600 hover:underline">contact support</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
