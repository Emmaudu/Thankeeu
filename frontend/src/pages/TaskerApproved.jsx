import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function TaskerApproved() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | expired

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('expired'); return; }

    // Store the token and navigate to dashboard
    localStorage.setItem('taskeeu_token', token);

    // Small delay so AuthContext can pick up the token
    setTimeout(() => {
      // Reload auth state then redirect
      window.location.href = '/tasker';
    }, 1500);

    setStatus('success');
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
            <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Activating your account…</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} style={{ color: '#00c37e' }} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.03em' }}>
              You're approved!
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Welcome to Taskeeu. Taking you to your dashboard now…
            </p>
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
          </>
        )}

        {status === 'expired' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={32} style={{ color: '#ef4444' }} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 12 }}>Link expired or invalid</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
              This approval link has expired (links are valid for 7 days). Please log in directly with your email and password.
            </p>
            <Link to="/tasker/login?reason=link_expired" className="btn-primary w-full block">
              Go to Tasker Login
            </Link>
          </>
        )}
      </div>
    </div>
    </>
  );
}
