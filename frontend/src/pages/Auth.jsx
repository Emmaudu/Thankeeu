import { cpath, prefixOf } from '../utils/market';
import AuthCountryNotice from '../components/layout/AuthCountryNotice';
import { useState, useEffect } from 'react';
import SEO from '../components/seo/SEO';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ClipboardList, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState('login'); // login | signup
  // Show inactivity message if redirected due to timeout
  useEffect(() => {
    if (searchParams.get('reason') === 'inactive') {
      toast('You were logged out after 30 minutes of inactivity.', { icon: '⏱', duration: 6000 });
    }
  }, []);
  const [role, setRole] = useState('requester'); // requester | tasker
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const home = prefixOf(user.market || 'NG');
      const dest = user.role === 'admin' ? '/admin' : user.role === 'tasker' ? `${home}/tasker` : `${home}/requester`;
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, authLoading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Enter your email and password'); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.full_name?.split(' ')[0]}!`);
      const home = prefixOf(data.user.market || 'NG');
      const dest = data.user.role === 'admin' ? '/admin' : data.user.role === 'tasker' ? `${home}/tasker` : `${home}/requester`;
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Incorrect email or password');
    } finally { setLoading(false); }
  };

  if (authLoading) return null;

  return (
    <>
      <SEO title="Sign In | Taskeeu" description="Sign in or create your Taskeeu account." />
      {/* Slim top bar visible on mobile */}
      <div className="lg:hidden flex items-center justify-between px-5 py-3 border-b bg-white" style={{ borderColor: 'var(--border-light)' }}>
        <Link to={cpath("/")} className="flex items-center gap-2">
          <img src="/logo.svg" alt="Taskeeu" className="w-8 h-8 rounded-xl" />
          <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--dark)', letterSpacing: '-0.03em' }}>Taskeeu</span>
        </Link>
        <Link to={cpath("/")} style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>← Home</Link>
      </div>
      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--surface)' }}>

        {/* Left dark panel */}
        <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12"
          style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)' }}>
          <Link to={cpath("/")} className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Taskeeu" style={{ width: 38, height: 38, borderRadius: 12 }} />
            <span style={{ fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '-0.03em' }}>Taskeeu</span>
          </Link>
          <div>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Africa's task<br />outsourcing platform
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.8 }}>
              Post tasks, hire verified taskers, and get things done across Africa.
            </p>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Payments secured by Flutterwave</p>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 24px' }}>
          <div style={{ width: '100%', maxWidth: 440 }}>

            {/* Tab switcher */}
            <div style={{ display: 'flex', background: '#f1f0f5', borderRadius: 16, padding: 4, marginBottom: 32 }}>
              {[['login', 'Sign In'], ['signup', 'Create Account']].map(([val, label]) => (
                <button key={val} onClick={() => setTab(val)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: tab === val ? 'white' : 'transparent',
                    color: tab === val ? 'var(--text)' : 'var(--muted)',
                    boxShadow: tab === val ? '0 1px 8px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h1 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>
                    Welcome back
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>Sign in to continue to your dashboard</p>
                </div>

                <div>
                  <label className="label">Email address</label>
                  <input type="email" required placeholder="you@example.com" autoComplete="email"
                    value={form.email} onChange={e => set('email', e.target.value)} className="input" />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} required placeholder="Your password"
                      autoComplete="current-password"
                      value={form.password} onChange={e => set('password', e.target.value)}
                      className="input" style={{ paddingRight: 48 }} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: 4 }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  No account?{' '}
                  <button type="button" onClick={() => setTab('signup')}
                    style={{ color: 'var(--rose)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Create one free
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGNUP ── */}
            {tab === 'signup' && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>
                    Create your account
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>What do you want to do on Taskeeu?</p>
                </div>
                <AuthCountryNotice role={role} mode="signup" />

                {/* Role picker */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <button type="button" onClick={() => setRole('requester')}
                    style={{
                      padding: '18px 16px', borderRadius: 16, border: `2px solid ${role === 'requester' ? 'var(--rose)' : 'var(--border-light)'}`,
                      background: role === 'requester' ? 'var(--rose-light)' : 'white',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: role === 'requester' ? 'var(--rose)' : '#f1f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <ClipboardList size={18} style={{ color: role === 'requester' ? 'white' : 'var(--muted)' }} />
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>Post Tasks</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>Hire taskers to get things done</p>
                  </button>

                  <button type="button" onClick={() => setRole('tasker')}
                    style={{
                      padding: '18px 16px', borderRadius: 16, border: `2px solid ${role === 'tasker' ? 'var(--rose)' : 'var(--border-light)'}`,
                      background: role === 'tasker' ? 'var(--rose-light)' : 'white',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: role === 'tasker' ? 'var(--rose)' : '#f1f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Briefcase size={18} style={{ color: role === 'tasker' ? 'white' : 'var(--muted)' }} />
                    </div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>Earn Money</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>Complete tasks and get paid</p>
                  </button>
                </div>

                <Link to={cpath(role === 'tasker' ? '/tasker/signup' : '/requester/signup')}
                  className="btn-primary w-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: 8 }}>
                  Continue as {role === 'tasker' ? 'Tasker' : 'Requester'} →
                </Link>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')}
                    style={{ color: 'var(--rose)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
