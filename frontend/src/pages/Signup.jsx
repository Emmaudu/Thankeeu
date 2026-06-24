import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const Signup = () => {
  useSEO({ title: 'Create a Free Account — Start Your First Group Card | Thankeeu', description: 'Sign up free and create your first group card in minutes. No credit card needed to get started. Send it when everyone has signed.', noIndex: false });
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo  = searchParams.get('returnTo');

  const [step,     setStep]    = useState('details'); // 'details' | 'verify'
  const [loading,  setLoading] = useState(false);
  const [showPw,   setShowPw]  = useState(false);
  const [code,     setCode]    = useState('');

  const [form, setForm] = useState({
    full_name: '', email: '', username: '', password: '',
    confirm_password: '', date_of_birth: '', terms_accepted: false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const pwStrength = form.password.length >= 12 ? 'strong' : form.password.length >= 8 ? 'good' : form.password.length > 0 ? 'weak' : null;
  const pwMatch    = form.password && form.confirm_password && form.password === form.confirm_password;

  // Step 1: validate and send code
  const handleSendCode = async e => {
    e.preventDefault();
    if (!form.terms_accepted) return toast.error('Please accept the Terms of Service');
    if (!form.username.trim()) return toast.error('Username is required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await axios.post(`${BASE}/auth/send-code`, {
        full_name:    form.full_name,
        email:        form.email,
        username:     form.username,
        password:     form.password,
        date_of_birth: form.date_of_birth || undefined,
      });
      toast.success(`Verification code sent to ${form.email}`);
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send code. Please try again.');
    } finally { setLoading(false); }
  };

  const claimSlug  = searchParams.get('claim_slug');
  const claimToken = searchParams.get('claim_token');

  // Step 2: verify code and create account
  const handleVerifyCode = async e => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) return toast.error('Enter the 6-digit code from your email');
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/auth/verify-code`, {
        email: form.email,
        code:  code.trim(),
      });
      // Log them in with the returned token
      const { token, user } = res.data;
      localStorage.setItem('thankeeu_token', token);
      localStorage.setItem('thankeeu_user',  JSON.stringify(user));

      // If they came from the no-login card flow, attach that draft to
      // their new account now that they're authenticated.
      if (claimSlug && claimToken) {
        try {
          const { cardsAPI } = await import('../utils/api');
          await cardsAPI.claimDraft(claimSlug, claimToken);
          localStorage.removeItem('thankeeu_anon_draft');
        } catch (claimErr) {
          // Don't block signup on a claim failure — they can still find
          // their card via the share link even if this didn't link it.
          console.error('Could not link draft card to new account:', claimErr.response?.data?.error || claimErr.message);
        }
      }

      toast.success('Account created! Welcome to Thankeeu!');
      navigate(claimSlug ? `/card/${claimSlug}` : (returnTo || '/dashboard'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Incorrect or expired code. Please try again.');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-primary-400 focus:outline-none bg-white text-warm-900 text-sm transition-colors';

  return (
    <div className="min-h-screen section-dots" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 50%,#FFF1F3 100%)' }}>
      <Navbar />

      <div className="relative flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-warm-900 mb-2">Create your account</h1>
            <p className="text-warm-500 text-sm">
              {step === 'details'
                ? 'Free forever for personal use. No credit card required.'
                : `We sent a 6-digit code to ${form.email}`}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">

            {/* Step indicator */}
            <div className="flex border-b border-purple-100">
              {['Details', 'Verify email'].map((label, i) => (
                <div key={i} className={`flex-1 py-3.5 text-center text-xs font-bold transition-colors ${
                  (i === 0 && step === 'details') || (i === 1 && step === 'verify')
                    ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500'
                    : i < (step === 'verify' ? 1 : 0)
                      ? 'text-green-600 bg-green-50'
                      : 'text-warm-400'
                }`}>
                  {i < (step === 'verify' ? 1 : 0) ? '✓ ' : ''}{label}
                </div>
              ))}
            </div>

            <div className="p-7">

              {/* ── STEP 1: Details ── */}
              {step === 'details' && (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
                    <input className={inputCls} placeholder="Your full name" value={form.full_name}
                      onChange={e => set('full_name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Email address *</label>
                    <input type="email" className={inputCls} placeholder="you@example.com" value={form.email}
                      onChange={e => set('email', e.target.value)} required />
                    <p className="text-xs text-warm-400 mt-1">We'll send a verification code here</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Username *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400 text-sm">@</span>
                      <input className={`${inputCls} pl-8`} placeholder="yourname" value={form.username}
                        onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} className={`${inputCls} pr-12`}
                        placeholder="Minimum 8 characters" value={form.password}
                        name="new-password" autoComplete="new-password"
                        onChange={e => set('password', e.target.value)} required />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-700">
                        <Icon name={showPw ? 'EyeOff' : 'Eye'} size={18}/>
                      </button>
                    </div>
                    {pwStrength && (
                      <div className="flex items-center gap-2 mt-1.5">
                        {['weak','good','strong'].map(s => (
                          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                            pwStrength === 'strong' ? 'bg-green-400'
                            : pwStrength === 'good' && s !== 'strong' ? 'bg-amber-400'
                            : s === 'weak' ? 'bg-red-400' : 'bg-gray-200'
                          }`} />
                        ))}
                        <span className={`text-xs font-semibold capitalize ${
                          pwStrength === 'strong' ? 'text-green-600' : pwStrength === 'good' ? 'text-amber-600' : 'text-red-500'
                        }`}>{pwStrength}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Confirm password *</label>
                    <input type="password" className={`${inputCls} ${
                      form.confirm_password ? (pwMatch ? 'border-green-400' : 'border-red-400') : ''
                    }`} placeholder="Repeat password" value={form.confirm_password}
                      name="confirm-password" autoComplete="new-password"
                      onChange={e => set('confirm_password', e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Date of birth (optional)</label>
                    <input type="date" className={inputCls} value={form.date_of_birth}
                      onChange={e => set('date_of_birth', e.target.value)} />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <input type="checkbox" className="mt-1 w-4 h-4 accent-primary-500 flex-shrink-0"
                      checked={form.terms_accepted} onChange={e => set('terms_accepted', e.target.checked)} />
                    <span className="text-xs text-warm-600 leading-relaxed">
                      I agree to the <Link to="/policy" className="text-primary-500 font-semibold underline">Terms of Service & Privacy Policy</Link>
                    </span>
                  </label>

                  <button type="submit" disabled={loading || !form.terms_accepted}
                    className="btn-primary w-full py-3.5 text-sm font-bold mt-2 disabled:opacity-60">
                    {loading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                          Sending code…
                        </span>
                      : 'Continue — send verification code →'}
                  </button>

                  <p className="text-center text-sm text-warm-500 mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-500 font-bold hover:underline">Sign in</Link>
                  </p>
                </form>
              )}

              {/* ── STEP 2: Verify code ── */}
              {step === 'verify' && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-semibold text-primary-800 mb-1">Check your inbox</p>
                    <p className="text-xs text-primary-600">
                      We sent a 6-digit code to <strong>{form.email}</strong>.<br/>
                      It expires in 15 minutes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-2 text-center">Enter your 6-digit code</label>
                    <input
                      className="w-full text-center text-4xl font-extrabold tracking-[0.4em] py-4 px-6 rounded-2xl border-2 border-purple-200 focus:border-primary-500 focus:outline-none bg-white text-warm-900 transition-colors"
                      placeholder="000000"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                    />
                  </div>

                  <button type="submit" disabled={loading || code.length !== 6}
                    className="btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-60">
                    {loading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                          Verifying…
                        </span>
                      : 'Verify & create account'}
                  </button>

                  <div className="text-center space-y-2">
                    <button type="button" onClick={() => { setStep('details'); setCode(''); }}
                      className="text-xs text-warm-400 hover:text-warm-700">
                      ← Change email or details
                    </button>
                    <br/>
                    <button type="button" onClick={handleSendCode} disabled={loading}
                      className="text-xs text-primary-500 font-semibold hover:underline disabled:opacity-50">
                      Resend code
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
