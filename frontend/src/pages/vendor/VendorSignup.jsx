import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAxios } from '../../utils/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const CATEGORIES = ['cakes', 'flowers', 'chocolates', 'jewellery', 'hampers', 'balloons', 'gift_wrapping', 'general'];

export default function VendorSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: '', email: '', password: '', phone: '',
    category: 'cakes', description: '', slug: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await vendorAxios.post('/vendor/signup', form);
      toast.success('Application submitted! Check your email. We review within 24 hours.');
      navigate('/vendor/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FDFCFF,#FFF1F3)' }}>
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl mx-auto mb-4">🏪</div>
            <h1 className="text-2xl font-extrabold text-warm-900">Apply to become a vendor</h1>
            <p className="text-warm-500 text-sm mt-1">Cakes, flowers, chocolates, jewellery & more</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Business name *</label>
                  <input className="input w-full" placeholder="Sweet Dreams Bakery"
                    value={form.business_name} onChange={e => set('business_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Store URL slug *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 text-xs">thankeeu.com/store/</span>
                    <input className="input w-full pl-32 text-sm" placeholder="sweet-dreams"
                      value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Email *</label>
                  <input type="email" className="input w-full" placeholder="you@store.com"
                    value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone</label>
                  <input type="tel" className="input w-full" placeholder="+234..."
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Category *</label>
                <select className="input w-full capitalize" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">Password *</label>
                <input type="password" className="input w-full" placeholder="Min 8 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1.5">About your store</label>
                <textarea className="input w-full" rows={3} placeholder="Describe what you sell and where you deliver..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 font-bold disabled:opacity-60">
                {loading ? 'Submitting application…' : 'Submit vendor application →'}
              </button>
            </form>
            <p className="text-center text-sm text-warm-500 mt-5">
              Already approved?{' '}
              <Link to="/vendor/login" className="text-primary-500 font-bold hover:underline">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
