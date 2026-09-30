import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { palAPI } from '../../utils/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

export default function PalLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ group_username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await palAPI.login(form);
      localStorage.setItem('tk_pal', res.data.token);
      localStorage.setItem('thankeeu_pal', JSON.stringify({ group: res.data.group, member: res.data.member }));
      toast.success(`Welcome back, ${res.data.group.group_name}! 🎉`);
      navigate('/pals/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
            <h1 className="text-2xl font-extrabold text-warm-900">Thankeeu Pals Login</h1>
            <p className="text-warm-500 text-sm mt-1">Each member can sign in with their own password</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Group username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 text-sm">@</span>
                  <input className="input w-full pl-7" placeholder="lagos-crew"
                    value={form.group_username}
                    onChange={e => setForm(p => ({ ...p, group_username: e.target.value.toLowerCase() }))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Your password</label>
                <input type="password" className="input w-full"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60">
                {loading ? 'Signing in...' : 'Log in'}
              </button>
              <p className="text-center text-xs text-warm-400">
                New here?{' '}
                <Link to="/pals/signup" className="text-primary-600 font-semibold">Create a Pals group</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
