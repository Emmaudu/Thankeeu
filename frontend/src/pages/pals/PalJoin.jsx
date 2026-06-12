import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { palAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

export default function PalJoin() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ password: '', confirm_password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setError('Missing invite token'); setLoading(false); return; }
    palAPI.previewInvite(token)
      .then(res => setPreview(res.data))
      .catch(err => setError(err.response?.data?.error || 'Invalid or expired invite link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      const res = await palAPI.acceptInvite({ token, ...form });
      localStorage.setItem('tk_pal', res.data.token);
      localStorage.setItem('thankeeu_pal', JSON.stringify({ group: res.data.group, member: res.data.member }));
      toast.success(res.data.message);
      navigate('/pals/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join group');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 text-center">
              <div className="text-5xl mb-4">😕</div>
              <h1 className="text-xl font-bold text-warm-900 mb-2">Invite not valid</h1>
              <p className="text-warm-500 text-sm mb-6">{error}</p>
              <Link to="/pals/login" className="btn-secondary px-6 py-3 inline-block">Go to login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                {preview.logo_url
                  ? <img src={preview.logo_url} className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4" />
                  : <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl mx-auto mb-4">👥</div>}
                <h1 className="text-2xl font-extrabold text-warm-900">Join {preview.group_name}</h1>
                <p className="text-warm-500 text-sm mt-1">Hi {preview.name}! Set a password to access the shared group dashboard.</p>
              </div>
              <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Choose a password</label>
                    <input type="password" className="input w-full" placeholder="Min. 8 characters"
                      value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-700 mb-1.5">Confirm password</label>
                    <input type="password" className="input w-full"
                      value={form.confirm_password} onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))} required />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60">
                    {submitting ? 'Joining...' : `Join ${preview.group_name} →`}
                  </button>
                  <p className="text-center text-xs text-warm-400">
                    You'll log in any time at <strong>/pals/login</strong> using @{preview.group_username} + this password
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
