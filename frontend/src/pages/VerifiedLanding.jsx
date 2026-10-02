import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

// Receives ?token=JWT&role=requester|tasker from backend redirects after:
// - Requester email verification click
// - Tasker approval link click
export default function VerifiedLanding() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    if (!token || !role) { setStatus('error'); return; }

    // Store token first so the /me request works
    localStorage.setItem('taskeeu_token', token);

    fetch((import.meta.env.VITE_API_URL || '/api') + '/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error('Invalid session');
        localStorage.setItem('taskeeu_user', JSON.stringify(data.user));
        setEmail(data.user.email || '');
        setStatus('success');
        // Full page reload so AuthContext re-initialises with the token
        setTimeout(() => {
          window.location.href = role === 'tasker' ? '/tasker' : '/requester';
        }, 1800);
      })
      .catch(() => {
        localStorage.removeItem('taskeeu_token');
        localStorage.removeItem('taskeeu_user');
        setStatus('error');
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
      <div style={{
        minHeight: 'calc(100vh - 57px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--surface)', padding: 24,
      }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '4px solid #fde0e8', borderTopColor: '#ff2d62',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 24px',
            }} />
            <h2 style={{ fontWeight: 900, color: 'var(--text)', fontSize: 22, marginBottom: 8 }}>
              Verifying your account…
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Just a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 60, marginBottom: 16 }}></div>
            <h2 style={{ fontWeight: 900, color: 'var(--text)', fontSize: 24, marginBottom: 10 }}>
              You're all set!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 6 }}>
              Taking you to your dashboard…
            </p>
            {email && (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Logged in as <strong>{email}</strong></p>
            )}
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}></div>
            <h2 style={{ fontWeight: 900, color: 'var(--text)', fontSize: 22, marginBottom: 10 }}>
              Link invalid or expired
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              This verification link may have expired or already been used.
              Please log in directly.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/requester/login" style={{ background: 'var(--rose)', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                Requester Login
              </a>
              <a href="/tasker/login" style={{ background: 'var(--surface)', color: 'var(--text)', padding: '12px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14, border: '1px solid var(--border)' }}>
                Tasker Login
              </a>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    </>
  );
}
