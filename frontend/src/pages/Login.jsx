import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const Login = () => {
  useSEO({ title: 'Sign In — Thankeeu', noIndex: true });
  const { login } = useAuth();
  const { logout: memberLogout } = useMemberAuth();
  const { logout: companyLogout } = useCompanyAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    // Log out other session types first
    memberLogout();
    companyLogout();
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 💜');
      navigate(returnTo || '/dashboard');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#12102A', color:'#E4E2F6' }}>
      <Navbar />
      <div className="fixed inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(92,75,223,0.2) 0%, transparent 60%)' }} />
      <div className="relative flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {returnTo && (
            <div className="mb-5 p-4 rounded-2xl text-center" style={{ background:'rgba(124,110,255,0.1)', border:'1px solid rgba(124,110,255,0.25)' }}>
              <p className="text-sm font-semibold" style={{ color:'#B8B4FF' }}>✍️ Sign in to continue signing</p>
              <p className="text-xs mt-1" style={{ color:'#7A7898' }}>You'll be redirected back after login</p>
            </div>
          )}
          <div className="text-center mb-6">
            <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'1.8rem', color:'#E4E2F6' }}>Welcome back 👋</h1>
          </div>
          <div className="rounded-2xl p-7" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(124,110,255,0.2)' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color:'#9490C8' }}>Email address</label>
                <input type="email" className="input" placeholder="you@example.com" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color:'#9490C8' }}>Password</label>
                  <Link to="/forgot-password" className="text-xs" style={{ color:'#7C6EFF' }}>Forgot?</Link>
                </div>
                <div className="relative">
                  <input type={show?'text':'password'} className="input pr-14" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
                  <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-lg" style={{ color:'#6B678A', background:'rgba(124,110,255,0.1)' }}>{show?'Hide':'Show'}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</span> : '⚡ Sign in'}
              </button>
            </form>
            <p className="text-center text-sm mt-4" style={{ color:'#6B678A' }}>
              No account? <Link to={`/signup${returnTo?`?returnTo=${encodeURIComponent(returnTo)}`:''}`} style={{ color:'#7C6EFF' }} className="font-medium">Create one free →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
