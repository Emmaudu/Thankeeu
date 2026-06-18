import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';

const Login = () => {
  useSEO({ title: 'Sign In — Thankeeu', noIndex: true });
  const { login }              = useAuth();
  const { logout: memberLogout }  = useMemberAuth();
  const { logout: companyLogout } = useCompanyAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo       = searchParams.get('returnTo') || searchParams.get('redirect');
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow]   = useState(false);

  const claimSlug  = searchParams.get('claim_slug');
  const claimToken = searchParams.get('claim_token');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    memberLogout();
    companyLogout();
    localStorage.removeItem('thankeeu_member_token');
    localStorage.removeItem('thankeeu_member');
    localStorage.removeItem('thankeeu_company_token');
    localStorage.removeItem('thankeeu_company');
    try {
      await login(form.email, form.password);

      if (claimSlug && claimToken) {
        try {
          const { cardsAPI } = await import('../utils/api');
          await cardsAPI.claimDraft(claimSlug, claimToken);
          localStorage.removeItem('thankeeu_anon_draft');
        } catch (claimErr) {
          console.error('Could not link draft card to account:', claimErr.response?.data?.error || claimErr.message);
        }
      }

      toast.success('Welcome back!');
      navigate(claimSlug ? `/card/${claimSlug}` : (returnTo || '/dashboard'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 50%,#FFF1F3 100%)' }}>
      <Navbar />

      {/* Subtle dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(124,58,237,0.07) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Glow blob */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-72 pointer-events-none" style={{
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)',
      }} />

      <div className="relative flex items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">

          {/* Return-to card banner */}
          {returnTo && (
            <div className="mb-5 p-4 rounded-2xl text-center border"
              style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.18)' }}>
              <p className="text-sm font-semibold text-primary-700 flex items-center justify-center gap-1.5"><Icon name="Edit" size={14}/> Sign in to continue signing</p>
              <p className="text-xs mt-0.5 text-warm-500">You'll be redirected back after login</p>
            </div>
          )}

          {/* Session expired banner */}
          {sessionExpired && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-sm font-medium border bg-amber-50 border-amber-200 text-amber-800 text-center flex items-center justify-center gap-1.5">
              <Icon name="Clock" size={14}/> Your session expired. Please sign in again.
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
              <Icon name="Heart" size={24} className="text-white"/>
            </div>
            <h1 className="font-display text-3xl font-bold text-warm-900">Welcome back</h1>
            <p className="text-warm-500 text-sm mt-1">Sign in to your Thankeeu account</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="text-xs font-semibold text-warm-600 block mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email" className="input" placeholder="you@example.com"
                  required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-warm-600 uppercase tracking-wide">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} className="input pr-16"
                    required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-1">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  : <span className="inline-flex items-center justify-center gap-2"><Icon name="Zap" size={16}/> Sign in</span>}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-warm-400">No account yet?</span>
              </div>
            </div>

            <Link
              to={`/signup${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-primary-200 text-primary-700 font-semibold text-sm hover:bg-primary-50 transition-colors">
              <Icon name="Sparkles" size={15}/> Create a free account <Icon name="ArrowRight" size={15}/>
            </Link>
          </div>

          <p className="text-center text-xs text-warm-400 mt-6">
            Are you a team member?{' '}
            <Link to="/member/login" className="text-primary-600 font-medium hover:underline">Member login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
