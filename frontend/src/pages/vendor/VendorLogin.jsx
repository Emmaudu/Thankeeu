import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAxios } from '../../utils/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

export default function VendorLogin() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await vendorAxios.post('/vendor/login', form);
      localStorage.setItem('thankeeu_vendor_token', res.data.token);
      localStorage.setItem('thankeeu_vendor', JSON.stringify(res.data.vendor));
      toast.success(`Welcome back, ${res.data.vendor.business_name}!`);
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your email and password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl mx-auto mb-4">🏪</div>
            <h1 className="text-2xl font-extrabold text-warm-900">Vendor Sign In</h1>
            <p className="text-warm-500 text-sm mt-1">Access your store dashboard</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Email address</label>
                <input type="email" className="input w-full" placeholder="store@example.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Password</label>
                <input type="password" className="input w-full" placeholder="Your password"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 font-bold disabled:opacity-60">
                {loading ? 'Signing in…' : 'Sign in to dashboard →'}
              </button>
            </form>
            <p className="text-center text-sm text-warm-500 mt-5">
              No vendor account?{' '}
              <Link to="/vendor/signup" className="text-primary-500 font-bold hover:underline">Apply to join →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
