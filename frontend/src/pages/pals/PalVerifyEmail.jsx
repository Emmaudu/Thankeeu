import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { palAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';

export default function PalVerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Missing verification token'); return; }
    palAPI.verifyEmail(token)
      .then(res => { setStatus('success'); setMessage(res.data.message); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.error || 'Verification failed'); });
  }, [params]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-24">
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-warm-500">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-xl font-bold text-warm-900 mb-2">Email verified!</h1>
              <p className="text-warm-500 text-sm mb-6">{message}</p>
              <Link to="/pals/login" className="btn-primary px-6 py-3 inline-block">Go to login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">😕</div>
              <h1 className="text-xl font-bold text-warm-900 mb-2">Verification failed</h1>
              <p className="text-warm-500 text-sm mb-6">{message}</p>
              <Link to="/pals" className="btn-secondary px-6 py-3 inline-block">Back to Pals</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
