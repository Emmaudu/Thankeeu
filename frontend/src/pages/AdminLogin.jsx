import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password, 'admin');
      if (data.user.role !== 'admin') {
        // Not an admin — log them out and show error
        localStorage.removeItem('taskeeu_token');
        localStorage.removeItem('taskeeu_user');
        setError('Access denied. This portal is for admin accounts only.');
        setLoading(false);
        return;
      }
      toast.success(`Welcome back, ${data.user.full_name?.split(' ')[0] || 'Admin'}`);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in as admin, redirect
  if (isAuthenticated && user?.role === 'admin') {
    navigate('/admin', { replace: true });
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(150deg, #12091a 0%, #2a0a1f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(255,45,98,0.15) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, rgba(0,195,126,0.08) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <img src="/logo.svg" alt="Taskeeu" style={{ width: 48, height: 48, borderRadius: 14 }} />
            <span style={{ fontWeight: 900, fontSize: 24, color: 'white', letterSpacing: '-0.03em' }}>
              Taskeeu
            </span>
          </Link>
          <div
            className="inline-flex items-center gap-2 rounded-full" style={{
              background: 'rgba(255,45,98,0.15)',
              border: '1px solid rgba(255,45,98,0.3)',
              padding: '6px 16px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            <Shield size={12} style={{ color: 'var(--rose)' }} />
            ADMIN PORTAL
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: 36,
            backdropFilter: 'blur(20px)',
          }}
        >
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 26, marginBottom: 6, letterSpacing: '-0.03em' }}>
            Admin Sign In
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28 }}>
            Restricted access — admin credentials only
          </p>

          {error && (
            <div
              className="flex items-start gap-3 rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,45,98,0.12)', border: '1px solid rgba(255,45,98,0.25)' }}
            >
              <AlertCircle size={16} style={{ color: 'var(--rose)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#ff6b9d', fontSize: 14, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Admin Email
              </label>
              <input
                type="email"required
                placeholder="Enter admin email" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  color: 'white',
                  fontSize: 15,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--rose)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"required
                  placeholder="Admin password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 16,
                    padding: '14px 52px 14px 18px',
                    color: 'white',
                    fontSize: 15,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--rose)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full" style={{ marginTop: 8 }}
            >
              {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.7 }}>This portal is restricted to authorised admin personnel only.<br />
              Unauthorised access attempts are logged and monitored.
            </p>
          </div>

        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Not an admin?{' '}
          <Link to="/auth" style={{ color: 'var(--rose)', fontWeight: 600 }}>Go to main login</Link>
        </p>
      </div>
    </div>
  );
}
