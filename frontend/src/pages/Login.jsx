import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { cardsAPI } from '../utils/api';

const Login = () => {
  useSEO({ title: 'Sign In — Thankeeu', noIndex: true });
  const { login }                = useAuth();
  const { logout: memberLogout } = useMemberAuth();
  const { logout: companyLogout }= useCompanyAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo       = searchParams.get('returnTo') || searchParams.get('redirect');
  const sessionExpired = searchParams.get('reason') === 'session_expired';
  const claimSlug      = searchParams.get('claim_slug');
  const claimToken     = searchParams.get('claim_token');

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    memberLogout(); companyLogout();
    localStorage.removeItem('thankeeu_member_token');
    localStorage.removeItem('thankeeu_member');
    localStorage.removeItem('thankeeu_company_token');
    localStorage.removeItem('thankeeu_company');
    try {
      await login(form.email, form.password);

      // Claim a guest-created draft card if claim params are present
      if (claimSlug && claimToken) {
        try {
          await cardsAPI.claimDraft(claimSlug, claimToken);
          toast.success('Welcome back! Your card has been added to your account. 🎉');
          navigate(`/card/${claimSlug}`);
          return;
        } catch {
          // Claim failed — still navigate to dashboard, card may already be claimed
          toast.success('Welcome back!');
          navigate(returnTo || '/dashboard');
          return;
        }
      }

      toast.success('Welcome back!');
      navigate(returnTo || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg-dots" />
      <div className="auth-bg-glow" />
      <Navbar />

      <div className="relative flex items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">

          {returnTo && (
            <div className="mb-5 p-4 rounded-2xl text-center"
              style={{ background:'rgba(124,58,237,0.06)', border:'1.5px solid rgba(124,58,237,0.18)' }}>
              <p className="text-sm font-bold text-primary-700 flex items-center justify-center gap-1.5">
                <Icon name="Edit" size={14} /> Sign in to continue signing the card
              </p>
              <p className="text-xs mt-1 text-warm-500">You'll be redirected back after login</p>
            </div>
          )}

          {sessionExpired && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-sm font-semibold text-center"
              style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', color:'#92400E' }}>
              <Icon name="Clock" size={14} className="inline mr-1.5" /> Your session expired. Please sign in again.
            </div>
          )}

          {claimSlug && claimToken && (
            <div className="mb-5 p-4 rounded-2xl text-center"
              style={{ background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', border:'1.5px solid #C4B5FD' }}>
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm font-bold text-primary-700 mb-1">
                Sign in to save your card to your account
              </p>
              <p className="text-xs text-warm-500">
                Your card draft will be linked to your account so you can manage it from your dashboard, schedule delivery, and track signatures.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
              <Icon name="Heart" size={26} className="text-white" />
            </div>
            <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'2rem', color:'#1A1035', letterSpacing:'-0.025em', margin:0 }}>
              Welcome back
            </h1>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'1rem', color:'#7A6CA8', marginTop:'0.35rem' }}>
              Sign in to your Thankeeu account
            </p>
          </div>

          <div className="auth-card">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="auth-label">Email address</label>
                  <input type="email" className="input" placeholder="you@example.com" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="auth-label" style={{ marginBottom:0 }}>Password</label>
                    <Link to="/forgot-password" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.8125rem', fontWeight:600, color:'#7C3AED' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} className="input pr-16"
                      required value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
                      style={{ color:'#7C3AED', background:'rgba(124,58,237,0.08)' }}>
                      {show ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </span>
                    : <span className="inline-flex items-center justify-center gap-2">
                        <Icon name="Zap" size={16} /> Sign in
                      </span>}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop:'1.5px solid #EDE9FE' }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.8125rem', color:'#A898CC' }}>
                    No account yet?
                  </span>
                </div>
              </div>

              <Link to={`/signup${claimSlug ? `?claim_slug=${claimSlug}&claim_token=${claimToken}` : (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '')}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-colors"
                style={{ border:'2px solid #DDD6FE', color:'#6D28D9', fontFamily:'Plus Jakarta Sans,sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.background='#F5F0FF'; e.currentTarget.style.borderColor='#A78BFA'; }}
                onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.borderColor='#DDD6FE'; }}>
                <Icon name="Sparkles" size={15} /> Create a free account <Icon name="ArrowRight" size={15} />
              </Link>
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#A898CC' }}>
            Are you a team member?{' '}
            <Link to="/member/login" style={{ color:'#7C3AED', fontWeight:700 }}>Member login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
