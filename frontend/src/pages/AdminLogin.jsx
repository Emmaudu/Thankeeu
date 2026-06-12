import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../components/ThankeeuLogo';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  useSEO({ title: 'Admin Login — Thankeeu', noIndex: true });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 60%,#EDE5FF 100%)' }}>

      {/* Purple header bar */}
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><Icon name="Gift" size={16} className="text-white"/></div>
          <span className="font-display font-bold text-white text-lg">Thankeeu</span>
        </Link>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ background:'rgba(255,255,255,0.15)', color:'#fff' }}><Icon name="Shield" size={12}/> Admin</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background:'linear-gradient(135deg,#F5F0FF,#EDE5FF)', border:'2px solid #DDD6FE' }}>
              <Icon name="Shield" size={28} className="text-primary-500"/>
            </div>
            <h1 className="font-display text-2xl font-bold text-warm-900 mb-2">Admin Access</h1>
            <p className="text-warm-500 text-sm">Authorised personnel only</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-warm-800 mb-1.5">Admin email</label>
                <input type="email" className="input" placeholder="admin@thankeeu.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-800 mb-1.5">Password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-16" placeholder="Admin password" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying…</span>
                  : <span className="inline-flex items-center justify-center gap-2"><Icon name="Shield" size={16}/> Access admin panel</span>}
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-warm-400 mt-5">
            <Link to="/" className="hover:text-primary-500 transition-colors">← Back to Thankeeu</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
