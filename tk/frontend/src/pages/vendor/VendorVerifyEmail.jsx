import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

export default function VendorVerifyEmail() {
  const [searchParams]  = useSearchParams();
  const token           = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'already' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link. Please use the exact link from your email.');
      return;
    }

    axios.get(`${BASE}/vendor/verify-email`, { params: { token } })
      .then(res => {
        if (res.data.already_verified) {
          setStatus('already');
        } else {
          setStatus('success');
        }
        setMessage(res.data.message || '');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired or already been used.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 50%,#FFF1F3 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-purple-100 p-8 text-center">

        {status === 'loading' && (
          <>
            <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-xl font-bold text-warm-900 mb-2">Verifying your email…</h2>
            <p className="text-warm-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold text-warm-900 mb-2">Store verified & activated!</h2>
            <p className="text-warm-600 text-sm mb-6 leading-relaxed">
              Your email is verified and your store is now live on Thankeeu. You can log in to your vendor dashboard right now.
            </p>
            <Link to="/vendor/login"
              className="inline-block bg-primary-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-600 transition-all">
              Go to vendor login →
            </Link>
          </>
        )}

        {status === 'already' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-extrabold text-warm-900 mb-2">Already verified</h2>
            <p className="text-warm-600 text-sm mb-6 leading-relaxed">
              Your email was already verified. You can log in to your vendor dashboard.
            </p>
            <Link to="/vendor/login"
              className="inline-block bg-primary-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-600 transition-all">
              Go to vendor login →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-extrabold text-warm-900 mb-2">Verification failed</h2>
            <p className="text-warm-600 text-sm mb-6 leading-relaxed">{message}</p>
            <div className="space-y-3">
              <Link to="/vendor/login"
                className="block bg-primary-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-primary-600 transition-all">
                Try logging in →
              </Link>
              <p className="text-xs text-warm-400">
                If you continue to have issues, contact{' '}
                <a href="mailto:hello@thankeeu.com" className="text-primary-500 underline">hello@thankeeu.com</a>
                {' '}and we'll activate your store manually.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
