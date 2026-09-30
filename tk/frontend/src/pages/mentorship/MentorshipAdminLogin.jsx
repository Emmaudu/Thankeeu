import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';
import { useAuth } from '../../context/AuthContext';

export default function MentorshipAdminLogin() {
  useSEO({ title: 'Admin Login — Thankeeu Mentorship', noIndex: true });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.user?.role !== 'admin') {
        toast.error('This account does not have admin access');
        setLoading(false);
        return;
      }
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 60%,#EDE5FF 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-white border-2 border-primary-200">
            <Icon name="GraduationCap" size={28} className="text-primary-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-warm-900 mb-1">Mentorship Admin</h1>
          <p className="text-warm-500 text-sm">Authorised personnel only</p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border border-primary-100 p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-warm-800 mb-1.5">Admin email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900"
                placeholder="admin@thankeeu.com" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-warm-800 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900 pr-11"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400">
                  <Icon name={show ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="Shield" size={18} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
