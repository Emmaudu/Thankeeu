import { useSEO } from '../../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../../components/ThankeeuLogo';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import { companyAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CompanyForgotPassword = () => {
  useSEO({ title: 'Reset Company Password — Thankeeu for Teams', description: 'Reset your company account password.', noIndex: true });

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await companyAPI.forgotPassword(email);
      setSent(true);
    } catch { toast.error('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen"><Navbar /><div className="flex items-center justify-center p-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">🏢 For Teams</div>
          <h1 className="font-display text-3xl font-semibold text-warm-900 mb-2">Reset company password</h1>
          <p className="text-warm-500 text-sm">We'll send a reset link to your company email</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
              <h3 className="font-display text-xl font-semibold text-warm-900 mb-2">Check your inbox</h3>
              <p className="text-warm-500 text-sm mb-6">If <strong>{email}</strong> has a company account, a reset link has been sent.</p>
              <Link to="/company/login" className="btn-primary w-full inline-block text-center">Back to company login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Company email address</label>
                <input type="email" className="input" placeholder="hr@company.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span> : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-warm-500">
                <Link to="/company/login" className="text-primary-400 font-medium hover:text-primary-600">← Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div></div>
  );
};

export default CompanyForgotPassword;
