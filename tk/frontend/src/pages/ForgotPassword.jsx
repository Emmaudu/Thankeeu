import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  useSEO({ title: 'Reset Your Password — Thankeeu', noIndex: true });
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try { await authAPI.forgotPassword(email); setSent(true); }
    catch { toast.error('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg-dots" /><div className="auth-bg-glow" />
      <Navbar />
      <div className="relative flex items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
              <Icon name="Mail" size={26} className="text-white" />
            </div>
            <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'2rem', color:'#1A1035', letterSpacing:'-0.025em', margin:0 }}>
              Reset your password
            </h1>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'1rem', color:'#7A6CA8', marginTop:'0.35rem' }}>
              We'll send a reset link to your email
            </p>
          </div>
          <div className="auth-card">
            <div className="p-8">
              {sent ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background:'#DCFCE7' }}>
                    <Icon name="Check" size={28} className="text-green-600" />
                  </div>
                  <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'1.25rem', color:'#1A1035', marginBottom:'0.5rem' }}>
                    Check your inbox
                  </h3>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.9375rem', color:'#7A6CA8', lineHeight:1.65, marginBottom:'1.5rem' }}>
                    If <strong style={{ color:'#1A1035' }}>{email}</strong> has an account, we've sent a reset link. Check your spam folder if you don't see it.
                  </p>
                  <Link to="/login" className="btn-primary px-8 py-3 inline-block text-center">Back to sign in</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="auth-label">Email address</label>
                    <input type="email" className="input" placeholder="you@example.com" required
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
                      : 'Send reset link'}
                  </button>
                  <p className="text-center text-sm" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#A898CC' }}>
                    Remember your password?{' '}
                    <Link to="/login" style={{ color:'#7C3AED', fontWeight:700 }}>Sign in</Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
