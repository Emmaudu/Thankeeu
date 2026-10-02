import { cpath, activeMarket, getMarket, prefixOf } from '../utils/market';
import AuthCountryNotice from '../components/layout/AuthCountryNotice';
import { useState, useEffect } from 'react';
import SEO from '../components/seo/SEO';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, ClipboardList, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../utils/api';
import toast from 'react-hot-toast';
import PhoneInput from '../components/ui/PhoneInput';

const DRAFT_KEY = 'taskeeu_draft_task';

async function postDraftIfExists(token) {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    const form = JSON.parse(saved);
    if (!form.title || !form.task_type) return;
    const payload = { ...form };
    if (form.tags) payload.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await fetch((import.meta.env.VITE_API_URL || '/api') + '/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success('Your task has been posted!');
    }
  } catch {}
}

export default function RequesterAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const redirectTo = searchParams.get('redirect') || cpath('/requester');

  const [mode, setMode] = useState(
    searchParams.get('mode') === 'signup' || location.pathname.endsWith('/signup') ? 'signup' : 'login');
  const [step, setStep] = useState('form'); // form | done
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [form, setForm] = useState({ email: '', full_name: '', username: '', phone: '', password: '', confirm_password: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Debounced username availability check
  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameStatus(null); return; }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await authApi.checkUsername(form.username, 'requester');
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(null); }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = await login(form.email, form.password, 'requester');
      toast.success(`Welcome back, ${data.user.full_name?.split(' ')[0]}!`);
      await postDraftIfExists(data.token);
      // An account belongs to one country. Logging in on another country's
      // site takes the person to their own country's dashboard.
      const home = getMarket(data.user?.market || 'NG');
      if (home.code !== activeMarket().code) {
        toast(`Your account is on Taskeeu ${home.name}, so we have taken you there.`, { duration: 6000 });
        navigate(`${prefixOf(home.code)}/requester`, { replace: true });
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const code = err.response?.data?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first. Check your inbox.', { duration: 5000 });
      } else {
        toast.error(msg);
      }
    }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username || form.username.length < 3) { toast.error('Please enter a username'); return; }
    if (usernameStatus === 'taken') { toast.error('That username is taken. Please choose another.'); return; }
    if (!form.phone || !form.phone.trim()) { toast.error('Please enter your phone number with country code'); return; }
    const localPart = form.phone.replace(/^\+\d+\s?/, '').replace(/\D/g, '');
    if (localPart.length < 5) { toast.error('Please enter a valid phone number after the country code'); return; }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!agreedToTerms) { toast.error('Please agree to the Terms & Conditions to continue'); return; }
    setLoading(true);
    try {
      await authApi.registerRequester({
        email: form.email, full_name: form.full_name,
        username: form.username, phone: form.phone, password: form.password,
        market: activeMarket().code,
        referral_slug: (() => { try { return localStorage.getItem('taskeeu_referral_slug') || undefined; } catch { return undefined; } })(),
        referral_pin: (() => { try { return localStorage.getItem('taskeeu_referral_pin') || undefined; } catch { return undefined; } })(),
      });
      try { localStorage.removeItem('taskeeu_referral_slug'); localStorage.removeItem('taskeeu_referral_pin'); } catch (_) {}
      setRegisteredEmail(form.email);
      setStep('done');
    } catch (err) {
      const d = err.response?.data;
      if (d?.code === 'WRONG_COUNTRY') {
        toast.error(d.message, { duration: 7000 });
        setMode('login');
        navigate(`${d.country_slug ? `/${d.country_slug}` : ''}/requester/login`, { replace: true });
      } else toast.error(d?.message || 'Registration failed');
    }
    finally { setLoading(false); }
  };

  return (
    <>
      <SEO title="Requester Sign Up | Taskeeu" description="Sign in or create a requester account to post tasks on Taskeeu." />
      {/* Slim top bar visible on mobile (left panel handles desktop branding) */}
      <div className="lg:hidden flex items-center justify-between px-5 py-3 border-b bg-white" style={{ borderColor: 'var(--border-light)' }}>
        <Link to={cpath("/")} className="flex items-center gap-2">
          <img src="/logo.svg" alt="Taskeeu" className="w-8 h-8 rounded-xl" />
          <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--dark)', letterSpacing: '-0.03em' }}>Taskeeu</span>
        </Link>
        <Link to={cpath("/")} style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>← Home</Link>
      </div>
      <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>

        {/* Left panel */}
        <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)' }}>
          <Link to={cpath("/")} className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
            <span style={{ fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '-0.03em' }}>Taskeeu</span>
          </Link>
          <div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,45,98,0.2)' }}>
              <ClipboardList size={28} style={{ color: 'var(--rose)' }} />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.03em' }}>
              Get anything done<br />{activeMarket().code === 'NG' ? 'across Africa' : `across ${activeMarket().name}`}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Post tasks, hire verified taskers, and outsource errands, deliveries, and more, safely and affordably.
            </p>
            {['Post tasks in under 2 minutes', 'Escrow-protected payments', 'KYC-verified taskers only', 'Real-time chat & tracking'].map(f => (
              <div key={f} className="flex items-center gap-3 mb-3">
                <CheckCircle size={15} style={{ color: 'var(--rose)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Payments secured by {activeMarket().code === 'NG' ? 'Flutterwave' : 'Rapyd'}</p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Tab toggle */}
            {step === 'form' && (
              <div className="flex rounded-2xl p-1 mb-8" style={{ background: 'var(--border-light)' }}>
                {[['login', 'Sign In'], ['signup', 'Create Account']].map(([val, label]) => (
                  <button key={val} onClick={() => setMode(val)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={mode === val
                      ? { background: 'white', color: 'var(--text)', boxShadow: '0 1px 8px rgba(0,0,0,0.1)' }
                      : { background: 'transparent', color: 'var(--muted)' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ── CHECK EMAIL (after signup) ── */}
            {step === 'done' && (
              <div style={{ textAlign: 'center' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--rose-light)' }}>
                  <Mail size={32} style={{ color: 'var(--rose)' }} />
                </div>
                <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.03em' }}>
                  Check your email
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
                  We've sent a verification link to
                </p>
                <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 20 }}>
                  {registeredEmail}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Click the link in the email to verify your account and access your requester dashboard.
                  The link expires in <strong>24 hours</strong>.
                </p>
                <div style={{ background: 'var(--rose-light)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                  <p style={{ fontSize: 13, color: 'var(--rose-dark)', fontWeight: 600, margin: 0 }}>Didn't get the email? Check your spam folder or{' '}
                    <button onClick={() => setStep('form')} style={{ color: 'var(--rose)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      try again
                    </button>.
                  </p>
                </div>
                <button onClick={() => { setMode('login'); setStep('form'); }}
                  className="btn-primary w-full">
                  Back to Sign In
                </button>
              </div>
            )}

            {/* ── LOGIN ── */}
            {step === 'form' && mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>Welcome back</h1>
                  <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Sign in to your requester account</p>
                </div>
                <AuthCountryNotice role="requester" mode="login" />
                <div>
                  <label className="label">Email address</label>
                  <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} className="input pr-12" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  <Link to="/auth/reset-password?role=requester" style={{ color: 'var(--rose)', fontWeight: 600 }}>
                    Forgot your password?
                  </Link>
                </p>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  Are you a tasker?{' '}
                  <Link to={cpath("/tasker/login")} style={{ color: 'var(--rose)', fontWeight: 700 }}>Tasker login</Link>
                </p>
              </form>
            )}

            {/* ── SIGNUP ── */}
            {step === 'form' && mode === 'signup' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>Create your account</h1>
                  <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Sign up to start posting tasks</p>
                </div>
                <AuthCountryNotice role="requester" mode="signup" />
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" required placeholder="e.g. Chidi Okafor" value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input w-full" />
                </div>
                <div>
                  <label className="label">Phone <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <PhoneInput required value={form.phone} onChange={v => set('phone', v)} placeholder="8012345678" className="w-full" />
                </div>
                <div>
                  <label className="label">Username *</label>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>@</span>
                    <input
                      type="text" required minLength={3} maxLength={30}
                      placeholder="e.g. chidi_tasks" value={form.username}
                      onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="input" style={{ paddingLeft: 28, paddingRight: 36, borderColor: usernameStatus === 'taken' ? '#ef4444' : usernameStatus === 'available' ? '#00c37e' : undefined }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                      {usernameStatus === 'checking' && <span style={{ color: 'var(--muted)' }}>⏳</span>}
                      {usernameStatus === 'available' && <span style={{ color: '#00c37e' }}></span>}
                      {usernameStatus === 'taken' && <span style={{ color: '#ef4444' }}></span>}
                    </span>
                  </div>
                  {usernameStatus === 'taken' && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Username taken. Try another.</p>}
                  {usernameStatus === 'available' && <p style={{ fontSize: 11, color: '#00c37e', marginTop: 4 }}>Username available!</p>}
                  {!usernameStatus && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Shown publicly on your tasks. Letters, numbers, underscores only.</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required minLength={8} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} className="input pr-12" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" required placeholder="Repeat password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Referral code <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></span>
                  </label>
                  <input
                    type="text" maxLength={4} placeholder="e.g. AB3X" style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}
                    onChange={e => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      try { if (v) localStorage.setItem('taskeeu_referral_pin', v); else localStorage.removeItem('taskeeu_referral_pin'); } catch (_) {}
                    }}
                    className="input" />
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Got a 4-letter code from a Taskeeu ambassador? Enter it here.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Creating account…' : 'Create Requester Account'}
                </button>
                {/* Terms & Conditions */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
                  <input
                    type="checkbox" checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: 'var(--rose)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                    I agree to Taskeeu's{' '}
                    <a href="/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--rose)', fontWeight: 600 }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="/policy" target="_blank" rel="noreferrer" style={{ color: 'var(--rose)', fontWeight: 600 }}>Privacy Policy</a>.
                    By signing up, I confirm I am 18 years or older.
                  </span>
                </label>
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                  Want to earn as a tasker?{' '}
                  <Link to={cpath("/tasker/signup")} style={{ color: 'var(--rose)', fontWeight: 700 }}>Sign up as Tasker</Link>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
