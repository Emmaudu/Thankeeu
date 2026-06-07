import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const Login = () => {
  useSEO({ title: 'Sign In — Thankeeu', description: 'Sign in to your Thankeeu account.', canonical: '/login', noIndex: true });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 50%,#FFF1F3 100%)' }}>
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-bounce-soft">🎉</div>
            <h1 className="font-display text-3xl font-bold text-warm-900 mb-2">Welcome back!</h1>
            <p className="text-warm-500 text-sm">Sign in to manage your cards & gifts</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-warm-800 mb-1.5">Email address</label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-warm-800">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary-500 hover:text-primary-700">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-16" placeholder="Your password" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</span>
                  : '✨ Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-purple-50 text-center">
              <p className="text-sm text-warm-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold text-primary-500 hover:text-primary-700">Create one free 🎁</Link>
              </p>
            </div>
          </div>

          {/* Social proof */}
          <p className="text-center text-xs text-warm-400 mt-5">
            🔒 Secure · Used by 50,000+ people worldwide
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
