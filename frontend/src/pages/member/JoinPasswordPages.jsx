import { useSEO } from '../../hooks/useSEO';
import Navbar from '../../components/Navbar';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export const JoinForgotPassword = () => {
  useSEO({ title: 'Reset Team Member Password — Thankeeu', description: 'Reset your Thankeeu team member password.', canonical: '/member/forgot-password', noIndex: true });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await memberAPI.forgotPassword(email); setSent(true); }
    catch { toast.error('Something went wrong. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex items-center justify-center p-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center"><span className="text-white font-bold">T</span></div>
            <span className="font-display font-semibold text-2xl text-gray-900">Thankeeu</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">👥 Team account</div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">Reset password</h1>
          <p className="text-gray-500 text-sm">We'll send a reset link to your company email</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-gray-500 text-sm mb-5">If <strong>{email}</strong> has an account, a reset link has been sent.</p>
              <Link to="/member/login" className="btn-primary w-full inline-block text-center">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company email</label>
                <input type="email" className="input" placeholder="you@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span> : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-gray-500"><Link to="/member/login" className="text-primary-400 font-medium">← Back to sign in</Link></p>
            </form>
          )}
        </div>
      </div>
    </div></div>
  );
};

export const JoinResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex items-center justify-center p-4 py-12 md:py-20">
      <div className="text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Invalid reset link</h2>
        <Link to="/member/forgot-password" className="btn-primary mt-4 inline-block">Request new link</Link>
      </div>
    </div></div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await memberAPI.resetPassword({ token, password: form.password });
      setDone(true);
      toast.success('Password reset!');
      setTimeout(() => navigate('/member/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed — link may have expired');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex items-center justify-center p-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center"><span className="text-white font-bold">T</span></div>
            <span className="font-display font-semibold text-2xl text-gray-900">Thankeeu</span>
          </Link>
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">👥 Team account</div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">Set new password</h1>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">Password updated!</h3>
              <p className="text-gray-400 text-sm">Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="At least 8 characters"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} minLength={8} required />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{show ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                <input type="password" className="input" placeholder="Repeat new password"
                  value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required />
                {form.confirm && form.password !== form.confirm && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              </div>
              <button type="submit" disabled={loading || form.password !== form.confirm} className="btn-primary w-full py-3.5 disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</span> : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div></div>
  );
};
