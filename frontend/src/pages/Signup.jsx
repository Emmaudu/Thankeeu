import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const Signup = () => {
  useSEO({ title: 'Create a Free Account — Thankeeu', noIndex: false });
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [form, setForm] = useState({
    full_name: '', email: '', username: '', password: '',
    confirm_password: '', date_of_birth: '', terms_accepted: false,
  });
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);

  const pwMatch   = form.password && form.confirm_password && form.password === form.confirm_password;
  const pwNoMatch = form.confirm_password && form.password !== form.confirm_password;
  const pwStrength = form.password.length >= 12 ? 'strong' : form.password.length >= 8 ? 'good' : form.password.length > 0 ? 'weak' : null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.terms_accepted) return toast.error('Please accept the Terms of Service to continue');
    if (!form.username.trim())   return toast.error('Username is required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await signup(form.full_name, form.email, form.password, form.username, form.date_of_birth);
      toast.success('Account created! Welcome to Thankeeu 💜');
      navigate(returnTo || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 50%,#FFF1F3 100%)' }}>
      <Navbar />

      {/* Subtle dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(124,58,237,0.07) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
      }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-72 pointer-events-none" style={{
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)',
      }} />

      <div className="relative flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">

          {/* Return-to banner */}
          {returnTo && (
            <div className="mb-5 p-4 rounded-2xl text-center border"
              style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.18)' }}>
              <p className="text-sm font-semibold text-primary-700">✍️ Create an account to sign this card</p>
              <p className="text-xs mt-0.5 text-warm-500">Takes 1 minute · You'll be redirected back to sign</p>
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-primary-600 mb-4"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.15)' }}>
              ✨ Free forever · No credit card
            </div>
            <h1 className="font-display text-3xl font-bold text-warm-900">Create your account</h1>
            <p className="text-warm-500 text-sm mt-1">Join thousands celebrating milestones together</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full name */}
              <div>
                <label className="text-xs font-semibold text-warm-600 uppercase tracking-wide block mb-1.5">
                  Full name
                </label>
                <input className="input" placeholder="Your full name" required
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-semibold text-warm-600 uppercase tracking-wide block mb-1.5">
                  Username <span className="text-pink-500 normal-case">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 font-medium text-sm">@</span>
                  <input className="input pl-8" placeholder="yourname" required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
                </div>
                <p className="text-xs mt-1 text-warm-400">Letters, numbers, underscores only. Used for card transfers.</p>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-warm-600 uppercase tracking-wide block mb-1.5">
                  Email address
                </label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-warm-600 uppercase tracking-wide block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-16"
                    placeholder="At least 8 characters" required minLength={8}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwStrength && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{
                        background: pwStrength === 'strong' ? '#10B981'
                          : pwStrength === 'good' && i < 2 ? '#F59E0B'
                          : pwStrength === 'weak' && i < 1 ? '#EF4444'
                          : '#E5E7EB',
                      }} />
                    ))}
                    <span className={`text-xs font-semibold ml-1 ${
                      pwStrength === 'strong' ? 'text-emerald-600'
                      : pwStrength === 'good'   ? 'text-amber-600'
                      : 'text-red-500'
                    }`}>
                      {pwStrength === 'strong' ? 'Strong 💪' : pwStrength === 'good' ? 'Good' : 'Too short'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-xs font-semibold text-warm-600 uppercase tracking-wide block mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input type={showCf ? 'text' : 'password'} className="input pr-16"
                    placeholder="Repeat your password" required
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    style={{ borderColor: pwNoMatch ? '#EF4444' : pwMatch ? '#10B981' : undefined }} />
                  <button type="button" onClick={() => setShowCf(!showCf)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors">
                    {showCf ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwNoMatch && <p className="text-xs mt-1 text-red-500">⚠ Passwords do not match</p>}
                {pwMatch   && <p className="text-xs mt-1 text-emerald-600">✓ Passwords match</p>}
              </div>

              {/* Birthday */}
              <div className="rounded-2xl border border-purple-100 p-4" style={{ background: '#FDFAFF' }}>
                <label className="text-sm font-semibold text-warm-800 block mb-1">
                  🎂 Your birthday
                  <span className="text-xs font-normal text-warm-400 ml-1">(optional but loved)</span>
                </label>
                <input type="date" className="input mt-1"
                  value={form.date_of_birth || ''}
                  onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                />
                <p className="text-xs mt-2 text-warm-400">
                  We'll remind you 7 days before your birthday to create a card and collect wishes! 🥳
                </p>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 rounded-2xl border border-purple-100 p-4 cursor-pointer"
                style={{ background: '#FDFAFF' }}
                onClick={() => setForm(f => ({ ...f, terms_accepted: !f.terms_accepted }))}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  form.terms_accepted ? 'bg-primary-600 border-primary-600' : 'border-warm-300 bg-white'
                }`}>
                  {form.terms_accepted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <p className="text-sm text-warm-600 select-none">
                  I agree to Thankeeu's{' '}
                  <a href="/policy" target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-primary-600 font-semibold hover:underline">
                    Terms of Service & Privacy Policy
                  </a>
                </p>
              </div>

              <button type="submit" disabled={loading || !!pwNoMatch || !form.terms_accepted}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  : '✨ Create my free account'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-warm-400">Already have an account?</span>
              </div>
            </div>

            <Link to={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-primary-200 text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors">
              Sign in instead →
            </Link>
          </div>

          <p className="text-center text-xs text-warm-400 mt-6">
            HR team?{' '}
            <Link to="/company/signup" className="text-primary-600 font-medium hover:underline">Company sign-up →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
