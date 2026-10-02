import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../utils/api';
import SEO from '../components/seo/SEO';
import toast from 'react-hot-toast';

/**
 * /auth/reset-password
 *
 * Handles two distinct states:
 *  1. No `token` in URL  →  "Forgot password" form — user enters email.
 *  2. `token` in URL     →  "Set new password" form — user enters new password.
 *
 * Both requester and tasker are supported via the `role` query param.
 * The "Forgot password?" links in login pages pre-fill the role param.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token   = searchParams.get('token')  || '';
  const roleParam = searchParams.get('role') || '';   // 'requester' | 'tasker' | ''

  // ── Step 1: Forgot-password form state ──────────────────────────
  const [email,    setEmail]    = useState('');
  const [role,     setRole]     = useState(roleParam === 'tasker' ? 'tasker' : 'requester');
  const [sent,     setSent]     = useState(false);

  // ── Step 2: Set-new-password form state ─────────────────────────
  const [newPw,    setNewPw]    = useState('');
  const [confirmPw,setConfirmPw]= useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [tokenRole,setTokenRole]= useState(roleParam === 'tasker' ? 'tasker' : 'requester');

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Sync role from URL when component mounts (handles direct email link)
  useEffect(() => {
    if (token && roleParam) setTokenRole(roleParam);
  }, [token, roleParam]);

  // ── Step 1 handler ──────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase(), role });
      setSent(true);
    } catch (err) {
      // Even on network error we show the same message to prevent enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 handler ──────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, role: tokenRole, new_password: newPw });
      setDone(true);
      toast.success('Password reset! You can now log in.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not reset password. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginUrl = tokenRole === 'tasker' ? '/tasker/login' : '/requester/login';

  // ── Shared card wrapper ─────────────────────────────────────────
  const Card = ({ children }) => (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link to="/" style={{ display: 'inline-block', fontWeight: 900, fontSize: 20, color: 'var(--text)', textDecoration: 'none', marginBottom: 32, letterSpacing: '-0.03em' }}>
          Taskeeu
        </Link>
        <div className="card p-8">
          {children}
        </div>
      </div>
    </div>
  );

  // ── CASE A: token present → set new password ────────────────────
  if (token) {
    // Success state
    if (done) return (
      <Card>
        <SEO title="Password Reset | Taskeeu" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={28} style={{ color: 'var(--rose)' }} />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.03em' }}>
            Password updated!
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <Link to={loginUrl} className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to {tokenRole === 'tasker' ? 'Tasker' : 'Requester'} Login
          </Link>
        </div>
      </Card>
    );

    // Set new password form
    return (
      <Card>
        <SEO title="Set New Password | Taskeeu" />
        <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.03em' }}>
          Set a new password
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Choose a strong password with at least 8 characters.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#dc2626', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">New password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Min 8 characters"
                autoComplete="new-password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="input"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              required
              placeholder="Repeat your new password"
              autoComplete="new-password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className="input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: 4 }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            <Link to={loginUrl} style={{ color: 'var(--rose)', fontWeight: 600 }}>
              Back to login
            </Link>
          </p>
        </form>
      </Card>
    );
  }

  // ── CASE B: no token → forgot-password request form ─────────────

  // Success: email sent
  if (sent) return (
    <Card>
      <SEO title="Check Your Email | Taskeeu" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Mail size={28} style={{ color: 'var(--rose)' }} />
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.03em' }}>
          Check your inbox
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 6, lineHeight: 1.7 }}>
          If <strong>{email}</strong> is registered as a {role}, we've sent a password reset link to that address.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>
          The link expires in <strong>1 hour</strong>. Check your spam folder if you don't see it.
        </p>
        <button
          onClick={() => setSent(false)}
          className="btn-primary w-full"
          style={{ marginBottom: 12 }}
        >
          Send again
        </button>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          <Link to={role === 'tasker' ? '/tasker/login' : '/requester/login'} style={{ color: 'var(--rose)', fontWeight: 600 }}>
            Back to login
          </Link>
        </p>
      </div>
    </Card>
  );

  // Forgot-password form
  return (
    <Card>
      <SEO title="Forgot Password | Taskeeu" />
      <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.03em' }}>
        Forgot your password?
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Enter the email linked to your account and we'll send you a reset link.
      </p>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Role selector — in case user arrives without a pre-filled role */}
        <div>
          <label className="label">I am a</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['requester', 'Requester'], ['tasker', 'Tasker']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setRole(val)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: role === val ? '2px solid var(--rose)' : '2px solid var(--border)',
                  background: role === val ? 'var(--rose-light)' : 'transparent',
                  color: role === val ? 'var(--rose)' : 'var(--muted)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: 4 }}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Remember your password?{' '}
          <Link
            to={role === 'tasker' ? '/tasker/login' : '/requester/login'}
            style={{ color: 'var(--rose)', fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
