import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../components/ThankeeuLogo';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  useSEO({ title: 'Admin Login', noIndex: true });

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/">
            <ThankeeuLogo size={36} textSize="text-2xl" className="mb-5 mx-auto [&_span]:text-white" />
          </Link>
          <div className="inline-flex items-center gap-2 bg-primary-400/20 text-primary-200 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
            🛡️ Admin Access
          </div>
          <h1 className="font-display text-2xl font-semibold text-white mb-2">Admin Login</h1>
          <p className="text-gray-500 text-sm">Authorized personnel only</p>
        </div>

        <div className="bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input type="email" className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500" placeholder="admin@thankeeu.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input bg-gray-800 border-gray-700 text-white placeholder-gray-500 pr-10" placeholder="Admin password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</span> : '🛡️ Access Admin Panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          <Link to="/" className="text-gray-500 hover:text-gray-400">← Back to Thankeeu</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
