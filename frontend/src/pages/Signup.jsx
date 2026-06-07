import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const Signup = () => {
  useSEO({ title: 'Create Free Account — Thankeeu', description: 'Join 50,000+ people using Thankeeu to celebrate every milestone together.', canonical: '/signup' });
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
      toast.success('Account created! Welcome to Thankeeu 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally { setLoading(false); }
  };

  const strength = form.password.length >= 12 ? 4 : form.password.length >= 10 ? 3 : form.password.length >= 8 ? 2 : form.password.length >= 4 ? 1 : 0;
  const strengthColors = ['bg-gray-200','bg-rose-400','bg-amber-400','bg-teal-400','bg-primary-500'];
  const strengthLabels = ['','Weak','Fair','Good','Strong 💪'];

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 50%,#FFF1F3 100%)' }}>
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center gap-1 text-3xl mb-4">
              {['🎂','💌','🎁','🎊','💜'].map((e,i) => (
                <span key={i} className="animate-float" style={{ animationDelay:`${i*0.15}s` }}>{e}</span>
              ))}
            </div>
            <h1 className="font-display text-3xl font-bold text-warm-900 mb-2">Start celebrating</h1>
            <p className="text-warm-500 text-sm">Free to join · No credit card needed</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-warm-800 mb-1.5">Your name 👤</label>
                <input type="text" className="input" placeholder="Your full name" required
                  value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-800 mb-1.5">Email address 📧</label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-800 mb-1.5">Password 🔐</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-16" placeholder="At least 8 characters" required minLength={8}
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600">
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-warm-500">{strengthLabels[strength]}</p>
                  </div>
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account…</span>
                  : '🎉 Create free account'}
              </button>
            </form>
            <p className="text-center text-xs text-warm-400 mt-4">
              By signing up you agree to our{' '}
              <Link to="/policy#terms" className="text-primary-500 font-semibold">Terms</Link> &{' '}
              <Link to="/policy#privacy" className="text-primary-500 font-semibold">Privacy</Link>
            </p>
            <div className="mt-6 pt-6 border-t border-purple-50 text-center">
              <p className="text-sm text-warm-600">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-primary-500 hover:text-primary-700">Sign in →</Link>
              </p>
            </div>
          </div>
          <p className="text-center text-xs text-warm-400 mt-5">🔒 Secure · 50,000+ people worldwide</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
