import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../components/ThankeeuLogo';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  useSEO({
    title:       'Sign In to Thankeeu',
    description: 'Sign in to your Thankeeu account to manage your group cards and gifts.',
    canonical:   '/login',
    jsonLd:      [SCHEMAS.organization, SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Sign In', url: '/login' }])],
  });


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
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><ThankeeuLogo size={36} textSize="text-2xl" className="mb-5 mx-auto" /></Link>
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" className="input" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-600">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Enter your password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</span> : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 font-medium hover:text-primary-600">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
