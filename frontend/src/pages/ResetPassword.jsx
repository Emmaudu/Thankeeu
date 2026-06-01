import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../components/ThankeeuLogo';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  useSEO({ title: 'Set New Password', description: 'Set a new password for your Thankeeu account.', noIndex: true });


  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Invalid reset link</h2>
        <p className="text-gray-500 mb-6 text-sm">This link is invalid or has already been used.</p>
        <Link to="/forgot-password" className="btn-primary">Request a new link</Link>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed — link may have expired');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><ThankeeuLogo size={36} textSize="text-2xl" className="mb-5 mx-auto" /></Link>
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Set new password</h1>
          <p className="text-gray-500 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">Password updated!</h3>
              <p className="text-gray-500 text-sm mb-1">Your password has been reset successfully.</p>
              <p className="text-xs text-gray-400">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        form.password.length > i * 2 + 3 ? 'bg-primary-400' : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repeat new password"
                  required
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                />
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !form.password || form.password !== form.confirm}
                className="btn-primary w-full py-3.5 disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </span>
                  : 'Reset password'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-primary-400 font-medium hover:text-primary-600">← Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
