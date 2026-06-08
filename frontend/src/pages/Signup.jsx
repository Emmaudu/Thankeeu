import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const Signup = () => {
  useSEO({ title: 'Create a Free Account — Thankeeu', noIndex: false });
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const pwMatch = form.password && form.confirm_password && form.password === form.confirm_password;
  const pwNoMatch = form.confirm_password && form.password !== form.confirm_password;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username.trim()) return toast.error('Username is required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await signup(form.full_name, form.email, form.password, form.username);
      toast.success('Account created! Welcome 💜');
      navigate(returnTo || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#12102A', color: '#E4E2F6' }}>
      <Navbar />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(92,75,223,0.2) 0%, transparent 60%)' }} />
      <div className="relative flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">

          {returnTo && (
            <div className="mb-5 p-4 rounded-2xl text-center" style={{ background: 'rgba(124,110,255,0.1)', border: '1px solid rgba(124,110,255,0.25)' }}>
              <p className="text-sm font-semibold" style={{ color: '#B8B4FF' }}>✍️ Create an account to sign this card</p>
              <p className="text-xs mt-1" style={{ color: '#7A7898' }}>Takes 1 minute · You'll be redirected back to sign</p>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="pill mx-auto mb-3">✨ Free forever</div>
            <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.8rem', color: '#E4E2F6' }}>Create your account</h1>
            <p className="text-sm mt-1" style={{ color: '#7A7898' }}>No credit card needed</p>
          </div>

          <div className="rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,110,255,0.2)' }}>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full name */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9490C8' }}>Full name</label>
                <input className="input" placeholder="Your full name" required
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9490C8' }}>
                  Username <span style={{ color: '#EC4899' }}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B678A' }}>@</span>
                  <input className="input pl-7" placeholder="yourname" required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
                </div>
                <p className="text-xs mt-1" style={{ color: '#6B678A' }}>Letters, numbers, underscores only. Used for card transfers.</p>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9490C8' }}>Email address</label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9490C8' }}>Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-14"
                    placeholder="At least 8 characters" required minLength={8}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
                    style={{ color: '#6B678A', background: 'rgba(124,110,255,0.1)' }}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{
                        background: form.password.length > i * 2 + 3
                          ? i < 2 ? '#F59E0B' : '#10B981'
                          : 'rgba(255,255,255,0.08)'
                      }} />
                    ))}
                    <span className="text-xs ml-1" style={{ color: form.password.length >= 12 ? '#10B981' : form.password.length >= 8 ? '#F59E0B' : '#EF4444' }}>
                      {form.password.length >= 12 ? 'Strong' : form.password.length >= 8 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9490C8' }}>Confirm password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} className="input pr-14"
                    placeholder="Repeat your password" required
                    value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    style={{ borderColor: pwNoMatch ? '#EF4444' : pwMatch ? '#10B981' : undefined }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg"
                    style={{ color: '#6B678A', background: 'rgba(124,110,255,0.1)' }}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {pwNoMatch && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>⚠ Passwords do not match</p>}
                {pwMatch && <p className="text-xs mt-1" style={{ color: '#10B981' }}>✓ Passwords match</p>}
              </div>

              <button type="submit" disabled={loading || pwNoMatch}
                className="btn-primary w-full py-3.5 mt-1 disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  : '✨ Create account'}
              </button>
            </form>

            <p className="text-center text-sm mt-4" style={{ color: '#6B678A' }}>
              Already have an account?{' '}
              <Link to={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                style={{ color: '#7C6EFF' }} className="font-medium">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
