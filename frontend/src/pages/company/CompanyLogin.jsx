import { useSEO, SCHEMAS } from '../../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../../components/ThankeeuLogo';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const CompanyLogin = () => {
  useSEO({
    title:       'Company Sign In — Thankeeu for Teams',
    description: 'Sign in to your Thankeeu for Teams HR dashboard to manage employee occasion cards.',
    canonical:   '/company/login',
    jsonLd:      [SCHEMAS.organization, SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Company Sign In', url: '/company/login' }])],
  });


  const { login } = useCompanyAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(returnTo || '/company/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center p-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
              🏢 For Teams
            </div>
            <h1 className="text-3xl font-semibold text-warm-900 mb-2">Company sign in</h1>
            <p className="text-warm-500 text-sm">Access your HR dashboard</p>
          </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
          <form onSubmit={handleSubmit} className="space-y-5">
          {searchParams.get('reason') === 'session_expired' && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 border border-amber-200 text-amber-800">
              ⏱️ Your session expired due to inactivity. Please sign in again.
            </div>
          )}

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Company email</label>
              <input type="email" className="input" placeholder="hr@company.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-warm-700">Password</label>
                <Link to="/company/forgot-password" className="text-xs text-primary-400 hover:text-primary-600">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Your password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-700 text-xs">
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</span>
                : 'Sign in to dashboard'}
            </button>
          </form>
          <p className="text-center text-sm text-warm-500 mt-6">
            No company account yet?{' '}
            <Link to="/company/signup" className="text-primary-400 font-medium hover:text-primary-600">Create one free</Link>
          </p>
          <p className="text-center text-xs text-warm-700 mt-2">
            Personal account?{' '}
            <Link to="/login" className="text-primary-400 font-medium">Sign in here →</Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
