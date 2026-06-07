import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../components/ThankeeuLogo';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const Signup = () => {
  useSEO({
    title:       'Create a Free Account — Start Sending Group Cards',
    description: 'Sign up free and create your first group card in 2 minutes. Collect messages from everyone and send meaningful gifts. No credit card required.',
    canonical:   '/signup',
    jsonLd:      [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Sign Up', url: '/signup' }]),
    ],
  });

  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await signup(form.full_name, form.email, form.password);
      toast.success('Account created! Welcome to Thankeeu 💜');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center p-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-500 text-sm">Free to join. No credit card needed.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input type="text" className="input" placeholder="Your full name" required
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="At least 8 characters" required minLength={8}
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
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
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</span>
                  : 'Create free account 💜'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              By signing up, you agree to our{' '}
              <Link to="/policy#terms" className="text-primary-400">Terms</Link> and{' '}
              <Link to="/policy#privacy" className="text-primary-400">Privacy Policy</Link>
            </p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 font-medium hover:text-primary-600">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
