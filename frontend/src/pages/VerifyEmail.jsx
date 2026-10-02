import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

// This is the page the requester actually lands on when they click "Verify
// Email Address" in their inbox — a branded taskeeu.com URL, not the raw
// backend domain. It calls the backend's verification API in the
// background, then stores the returned session and redirects.
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role') || 'requester';

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/verify-email/check?token=${encodeURIComponent(token)}&role=${encodeURIComponent(role)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          setStatus('error');
          setMessage(data.message || 'This verification link is invalid or has expired.');
          return;
        }
        localStorage.setItem('taskeeu_token', data.token);
        setStatus('success');
        setTimeout(() => {
          // Full page reload so AuthContext re-initialises with the token
          window.location.href = data.role === 'tasker' ? '/tasker' : '/requester';
        }, 1500);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong verifying your email. Please try logging in directly.');
      });
  }, []);

  return (
    <>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'white', borderBottom: '1px solid #f0ecf8' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="Taskeeu" style={{ width: 32, height: 32, borderRadius: 10 }} />
          <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--dark)', letterSpacing: '-0.03em' }}>Taskeeu</span>
        </Link>
        <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none' }}>← Home</Link>
      </nav>
      <div style={{ minHeight: 'calc(100vh - 57px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--surface)' }}>
        <div style={{ maxWidth: 440, width: '100%', background: 'white', borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: '0 8px 40px rgba(18,9,26,0.12)' }}>

          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
              <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Verifying your email…</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Just a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={32} style={{ color: '#00c37e' }} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.03em' }}>
                Email verified!
              </h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
                Taking you to your dashboard now…
              </p>
              <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertCircle size={32} style={{ color: '#ef4444' }} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 12 }}>Verification failed</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
                {message}
              </p>
              <Link to="/requester/login" className="btn-primary w-full block">
                Go to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
