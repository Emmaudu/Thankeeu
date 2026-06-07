import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../components/ThankeeuLogo';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  useSEO({ title: 'Reset Your Password', description: 'Reset your Thankeeu account password.', noIndex: true });


  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex items-center justify-center p-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-gray-500 text-sm">We'll send a reset link to your email</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-gray-500 text-sm mb-6">If <strong>{email}</strong> has an account, we've sent a reset link. Check your spam folder if you don't see it.</p>
              <Link to="/login" className="btn-primary w-full inline-block text-center">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span>
                  : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="text-primary-400 font-medium hover:text-primary-600">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ForgotPassword;
