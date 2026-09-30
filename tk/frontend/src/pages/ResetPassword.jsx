import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  useSEO({ title: 'Set New Password — Thankeeu', noIndex: true });
  const [searchParams] = useSearchParams();
  const token    = searchParams.get('token');
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);
  const [done,    setDone]    = useState(false);

  if (!token) return (
    <div className="auth-root"><div className="auth-bg-dots" /><Navbar />
      <div className="flex items-center justify-center p-4 py-24">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:'#FEE2E2' }}>
            <Icon name="Link" size={26} className="text-red-500" />
          </div>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#1A1035', marginBottom:'0.5rem' }}>Invalid reset link</h2>
          <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#7A6CA8', marginBottom:'1.5rem' }}>This link is invalid or has already been used.</p>
          <Link to="/forgot-password" className="btn-primary">Request a new link</Link>
        </div>
      </div>
    </div>
  );

  const pwStrength = form.password.length >= 12 ? 'strong' : form.password.length >= 8 ? 'good' : form.password.length > 0 ? 'weak' : null;
  const pwMatch    = form.password && form.confirm && form.password === form.confirm;

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: form.password });
      setDone(true);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed. The link may have expired — request a new one.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-root"><div className="auth-bg-dots" /><div className="auth-bg-glow" /><Navbar />
      <div className="relative flex items-center justify-center px-4 py-16 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
              <Icon name="Lock" size={26} className="text-white" />
            </div>
            <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'2rem', color:'#1A1035', letterSpacing:'-0.025em', margin:0 }}>Set a new password</h1>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'1rem', color:'#7A6CA8', marginTop:'0.35rem' }}>Make it strong — at least 8 characters</p>
          </div>
          <div className="auth-card">
            <div className="p-8">
              {done ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background:'#DCFCE7' }}>
                    <Icon name="Check" size={28} className="text-green-600" />
                  </div>
                  <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'1.25rem', color:'#1A1035', marginBottom:'0.5rem' }}>Password updated!</h3>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.9375rem', color:'#7A6CA8', marginBottom:'1.5rem' }}>You can now sign in with your new password.</p>
                  <Link to="/login" className="btn-primary px-8 py-3 inline-block">Sign in now →</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="auth-label">New password</label>
                    <div className="relative">
                      <input type={show ? 'text' : 'password'} className="input pr-16"
                        placeholder="Minimum 8 characters" value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                      <button type="button" onClick={() => setShow(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ color:'#7C3AED', background:'rgba(124,58,237,0.08)' }}>
                        {show ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {pwStrength && (
                      <div className="flex items-center gap-2 mt-2">
                        {['weak','good','strong'].map(s => (
                          <div key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{
                            background: pwStrength === 'strong' ? '#4ADE80' : pwStrength === 'good' && s !== 'strong' ? '#FCD34D' : s === 'weak' ? '#F87171' : '#DDD6FE'
                          }} />
                        ))}
                        <span className="text-xs font-bold capitalize" style={{ color: pwStrength === 'strong' ? '#16A34A' : pwStrength === 'good' ? '#D97706' : '#DC2626' }}>{pwStrength}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="auth-label">Confirm password</label>
                    <input type="password" className="input"
                      placeholder="Repeat password" value={form.confirm}
                      onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                      style={{ borderColor: form.confirm ? (pwMatch ? '#4ADE80' : '#F87171') : '' }} required />
                    {form.confirm && !pwMatch && <p className="text-xs mt-1 font-semibold" style={{ color:'#DC2626' }}>Passwords don't match</p>}
                  </div>
                  <button type="submit" disabled={loading || !pwMatch} className="btn-primary w-full py-4 text-base disabled:opacity-50">
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating…</span>
                      : 'Update password'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
