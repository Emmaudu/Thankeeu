import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { palAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

export default function PalSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    group_name: '', group_username: '', email: '',
    password: '', confirm_password: '', group_size: 15, description: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm_password) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await palAPI.signup(form);
      toast.success(res.data.message || 'Application submitted!');
      navigate('/pals/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
            <h1 className="text-2xl font-extrabold text-warm-900">Create your Thankeeu Pals group</h1>
            <p className="text-warm-500 text-sm mt-1">A shared space for up to 15 best friends, family, or teammates to celebrate together — free</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Group name *</label>
                  <input className="input w-full" placeholder="The Lagos Crew"
                    value={form.group_name} onChange={e => set('group_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Group username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 text-sm">@</span>
                    <input className="input w-full pl-7" placeholder="lagos-crew"
                      value={form.group_username}
                      onChange={e => set('group_username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required />
                  </div>
                  <p className="text-xs text-warm-400 mt-1">Used to log in — letters, numbers, underscores only</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Group email *</label>
                  <input type="email" className="input w-full" placeholder="group@example.com"
                    value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Group size (max 15) *</label>
                  <input type="number" min="2" max="15" className="input w-full"
                    value={form.group_size} onChange={e => set('group_size', e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Password *</label>
                  <input type="password" className="input w-full" placeholder="Min. 8 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Confirm password *</label>
                  <input type="password" className="input w-full"
                    value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Group description</label>
                <textarea rows={3} className="input w-full" placeholder="Tell us a little about your group..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60">
                {loading ? 'Submitting...' : 'Apply to create group'}
              </button>

              <p className="text-center text-xs text-warm-400">
                Applications are reviewed within 24 hours. Already approved?{' '}
                <Link to="/pals/login" className="text-primary-600 font-semibold">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
