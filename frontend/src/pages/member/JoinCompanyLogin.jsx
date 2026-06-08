import { useSEO, SCHEMAS } from '../../hooks/useSEO';
// JoinCompanyLogin.jsx
import { useState } from 'react';
import ThankeeuLogo from '../../components/ThankeeuLogo';
import Navbar from '../../components/Navbar';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import { useMemberAuth } from '../../context/MemberAuthContext';
import toast from 'react-hot-toast';

const JoinCompanyLogin = () => {
  useSEO({
    title:       'Team Member Sign In — Thankeeu for Teams',
    description: 'Sign in to your team account on Thankeeu for Teams.',
    canonical:   '/member/login',
    jsonLd:      [SCHEMAS.organization, SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Team Sign In', url: '/member/login' }])],
  });


  const { login } = useMemberAuth();
  const { logout: userLogout } = useAuth();
  const { logout: companyLogout } = useCompanyAuth();
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
      const res = await login(form.email, form.password);
      toast.success(`Welcome back, ${res.member.first_name}!`);
      navigate(returnTo || '/member/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen"><Navbar /><div className="flex items-center justify-center p-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">👥 Team account</div>
          <h1 className="font-display text-2xl font-semibold text-warm-900 mb-1">Team member sign in</h1>
          <p className="text-warm-500 text-sm">Sign in to your company workspace</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7 border border-purple-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Company email</label>
              <input type="email" className="input" placeholder="you@company.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-warm-700">Password</label>
                <Link to="/member/forgot-password" className="text-xs text-primary-400 hover:text-primary-600">Forgot?</Link>
              </div>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Your password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-700 text-xs">{show ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</span> : 'Sign in'}
            </button>
          </form>
          <div className="mt-5 text-center space-y-1.5">
            <p className="text-xs text-warm-500">No team account yet? <Link to="/member/signup" className="text-primary-400 font-medium">Join your company</Link></p>
            <p className="text-xs text-warm-700">HR manager? <Link to="/company/login" className="text-primary-400">Company login →</Link></p>
          </div>
        </div>
      </div>
    </div></div>
  );
};

export default JoinCompanyLogin;
