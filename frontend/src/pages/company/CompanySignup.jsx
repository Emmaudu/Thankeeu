import { useSEO, SCHEMAS } from '../../hooks/useSEO';
import { useState } from 'react';
import ThankeeuLogo from '../../components/ThankeeuLogo';
import { Link, useNavigate } from 'react-router-dom';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const INDUSTRIES = ['Technology','Finance & Banking','Healthcare','Education','Manufacturing','Retail & FMCG','Oil & Gas','Telecoms','Media & Entertainment','Construction','Logistics','Hospitality','Other'];

const CompanySignup = () => {
  useSEO({
    title:       'Thankeeu for Teams — Create Company Account',
    description: 'Create a company account on Thankeeu for Teams. Automate birthday cards, farewell cards, new hire welcome and promotions for your entire workforce. HRIS integration included.',
    canonical:   '/company/signup',
    jsonLd:      [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Thankeeu for Teams', url: '/company/signup' }]),
    ],
  });


  const { signup } = useCompanyAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', contact_person: '', phone: '', industry: '', city: '', state: '', branch_name: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNext = () => {
    if (!form.name || !form.email) return toast.error('Company name and email are required');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_person || !form.password) return toast.error('All fields required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await signup(form);
      toast.success('Company account created! Welcome to Thankeeu for Teams 🎉');
      navigate('/company/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen"><Navbar /><div className="flex items-center justify-center p-4 py-10 md:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
            🏢 For Teams
          </div>
          <h1 className="font-display text-3xl font-semibold text-warm-900 mb-2">Create a company account</h1>
          <p className="text-warm-500 text-sm">Automate birthday celebrations for your entire team</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          {[1,2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                s < step ? 'bg-primary-400 text-white' : s === step ? 'bg-primary-400 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-warm-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              <span className={`text-xs font-medium ${s <= step ? 'text-warm-800' : 'text-warm-700'}`}>
                {s === 1 ? 'Company info' : 'Account setup'}
              </span>
              {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-purple-100">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Company name <span className="text-red-400">*</span></label>
                <input className="input" placeholder="e.g. Your Company Name" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Company email <span className="text-red-400">*</span></label>
                <input type="email" className="input" placeholder="hr@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Industry</label>
                <select className="input" value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Phone number</label>
                <input className="input" placeholder="+234 800 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1.5">City</label>
                  <input className="input" placeholder="e.g. Lagos, Abuja" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1.5">State</label>
                  <input className="input" placeholder="e.g. Lagos State" value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-700 mb-1.5">Branch name <span className="text-warm-700 font-normal">(optional)</span></label>
                <input className="input" placeholder="e.g. Ikeja Branch, Lekki Office, HQ Abuja" value={form.branch_name} onChange={e => set('branch_name', e.target.value)} />
                <p className="text-xs text-warm-700 mt-1">You can add more branches later from Settings</p>
              </div>
              <button onClick={handleNext} className="btn-primary w-full py-3.5">
                Continue →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Contact person (HR manager) <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Full name" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} minLength={8} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-700 text-xs">{show ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div className="bg-primary-50 rounded-xl p-3 text-xs text-primary-700">
                <p className="font-semibold mb-1">📋 What happens next:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>Download the team data template</li>
                  <li>Fill in employee details and upload</li>
                  <li>Subscribe to activate birthday emails</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary px-4">← Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span> : 'Create company account 🏢'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-warm-700 mt-5">
            Already have a company account?{' '}
            <Link to="/company/login" className="text-primary-400 font-medium hover:text-primary-600">Sign in</Link>
          </p>
          <p className="text-center text-xs text-warm-700 mt-2">
            Individual user?{' '}
            <Link to="/signup" className="text-primary-400 font-medium">Personal account →</Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CompanySignup;
