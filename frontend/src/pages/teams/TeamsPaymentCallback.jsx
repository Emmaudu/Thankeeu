import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { teamsApi } from '../../utils/api';

export default function TeamsPaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Flutterwave returns: tx_ref, transaction_id, status
    const reference = searchParams.get('tx_ref') || searchParams.get('reference') || searchParams.get('trxref');
    const flwStatus = searchParams.get('status'); // 'successful' | 'cancelled' | 'failed'

    if (flwStatus === 'cancelled' || flwStatus === 'failed') {
      setStatus('failed');
      setMessage(`Payment was ${flwStatus}. No funds were charged.`);
      return;
    }
    const type = searchParams.get('type'); // subscription | topup

    const storedCompany = JSON.parse(localStorage.getItem('teams_company') || '{}');
    const companyId = storedCompany?.id;

    if (!reference || !companyId) {
      setStatus('failed');
      setMessage('No payment reference or company found.');
      return;
    }

    const verify = async () => {
      try {
        if (type === 'subscription') {
          const { data } = await teamsApi.verifySubscription(companyId, reference);
          if (data.success) {
            setStatus('success');
            setMessage(`Subscription activated! Expires ${data.expires ? new Date(data.expires).toLocaleDateString('en-NG') : ''}`);
            setTimeout(() => navigate('/teams/dashboard/hr'), 3500);
          } else {
            setStatus('failed');
            setMessage(data.message || 'Subscription not confirmed.');
          }
        } else {
          const { data } = await teamsApi.verifyWalletTopup(companyId, reference);
          if (data.success) {
            setStatus('success');
            setMessage(`Wallet funded! New balance: ₦${Number(data.new_balance || 0).toLocaleString()}`);
            setTimeout(() => navigate('/teams/dashboard/hr'), 3500);
          } else {
            setStatus('failed');
            setMessage(data.message || 'Top-up not confirmed.');
          }
        }
      } catch (err) {
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Verification failed.');
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full card p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-5" />
            <h2 className="font-heading text-xl font-bold text-dark mb-2">Verifying Payment...</h2>
            <p className="text-muted text-sm">Please wait while we confirm your payment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={52} className="text-green-500 mb-4 mx-auto" />
            <h2 className="font-heading text-2xl font-bold text-dark mb-2">Payment Successful!</h2>
            <p className="text-muted mb-6">{message}</p>
            <p className="text-xs text-muted mb-4">Redirecting to your dashboard...</p>
            <Link to="/teams/dashboard/hr" className="btn-primary w-full block">Go to HR Dashboard →</Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle size={52} className="text-red-500 mb-4 mx-auto" />
            <h2 className="font-heading text-xl font-bold text-dark mb-2">Payment Not Confirmed</h2>
            <p className="text-muted mb-6">{message}</p>
            <div className="space-y-3">
              <Link to="/teams/dashboard/hr" className="btn-primary w-full block">Go to Dashboard</Link>
              <Link to="/teams" className="btn-outline w-full block">Back to Teams Page</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
