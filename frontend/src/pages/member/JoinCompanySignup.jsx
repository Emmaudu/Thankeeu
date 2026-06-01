import { useSEO, SCHEMAS } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import ThankeeuLogo from '../../components/ThankeeuLogo';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const DEFAULT_DEPTS = [
  'Engineering','Product Management','Design','Data Science','DevOps',
  'Finance','Accounting','Human Resources','Legal','Compliance',
  'Marketing','Sales','Customer Success','Operations','Administration',
  'Oil & Gas','Telecoms','Healthcare','Agriculture','Retail','Other'
];

const JoinCompanySignup = () => {
  useSEO({
    title:       'Join Your Company Workspace — Thankeeu for Teams',
    description: 'Join your company on Thankeeu for Teams to celebrate your colleagues and receive updates on team occasions like birthdays, farewells and promotions.',
    canonical:   '/member/signup',
    jsonLd:      [SCHEMAS.organization, SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Join Company', url: '/member/signup' }])],
  });


  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCode = searchParams.get('code') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [departments, setDepartments] = useState(DEFAULT_DEPTS);
  const [form, setForm] = useState({
    company_code: prefillCode,
    first_name: '', last_name: '', email: '',
    password: '', role: 'team_member',
    department: '', custom_department: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (form.company_code?.length === 36) {
      memberAPI.getDepartments(form.company_code)
        .then(res => setDepartments(res.data?.length ? res.data : DEFAULT_DEPTS))
        .catch(() => {});
    }
  }, [form.company_code]);

  const handleNext = () => {
    if (!form.company_code) return toast.error('Enter your company code');
    if (form.company_code.length < 10) return toast.error('Company code looks invalid');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email)
      return toast.error('All fields are required');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    const dept = form.department === 'other' ? form.custom_department : form.department;
    if (!dept) return toast.error('Please select or enter your department');

    setLoading(true);
    try {
      await memberAPI.signup({ ...form, department: dept });
      toast.success('Account submitted! Awaiting HR/Team Leader approval. Check your email.');
      navigate('/member/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><ThankeeuLogo size={36} textSize="text-2xl" className="mb-5 mx-auto" /></Link>
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
            👥 Join your company
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">Create team account</h1>
          <p className="text-gray-500 text-sm">Join your company's Thankeeu workspace</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1,2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                s < step ? 'bg-primary-400 text-white' : s === step ? 'bg-primary-400 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-500'
              }`}>{s < step ? '✓' : s}</div>
              <span className={`text-xs font-medium ${s <= step ? 'text-gray-700' : 'text-gray-400'}`}>
                {s === 1 ? 'Company code' : 'Your details'}
              </span>
              {s < 2 && <div className={`w-6 h-0.5 ${step > 1 ? 'bg-primary-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-primary-50 rounded-2xl p-4 text-sm text-primary-700">
                <p className="font-semibold mb-1">📋 How to find your company code</p>
                <p className="text-xs leading-relaxed">Ask your HR manager for the company code. It's the company's account ID, available in the HR dashboard under Settings.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company code <span className="text-red-400">*</span></label>
                <input className="input font-mono text-sm" placeholder="e.g. a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={form.company_code} onChange={e => set('company_code', e.target.value.trim())} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">I am joining as</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'team_member', icon: '👤', label: 'Team Member', desc: 'Celebrate colleagues' },
                    { id: 'team_leader', icon: '👑', label: 'Team Leader', desc: 'Manage department' },
                  ].map(r => (
                    <button key={r.id} type="button" onClick={() => set('role', r.id)}
                      className={`rounded-2xl p-3 text-left border-2 transition-all ${form.role === r.id ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="text-xl mb-1">{r.icon}</div>
                      <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleNext} className="btn-primary w-full py-3.5">Continue →</button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First name *</label>
                  <input className="input" placeholder="Amaka" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last name *</label>
                  <input className="input" placeholder="Okafor" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company email * <span className="text-gray-400 font-normal">(must match your company domain)</span></label>
                <input type="email" className="input" placeholder="amaka@company.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department *</label>
                <select className="input" value={form.department} onChange={e => set('department', e.target.value)} required>
                  <option value="">Select your department...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  <option value="other">Other (type below)</option>
                </select>
              </div>
              {form.department === 'other' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Enter department name</label>
                  <input className="input" placeholder="e.g. Supply Chain" value={form.custom_department}
                    onChange={e => set('custom_department', e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="At least 8 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} minLength={8} required />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{show ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⏳</span>
                <span>
                  {form.role === 'team_leader'
                    ? 'Team leader accounts are approved by HR. You will be notified by email once approved.'
                    : 'Your account will be reviewed by your Team Leader or HR. You will receive an email once approved.'}
                </span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary px-4">← Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</span>
                    : 'Submit for approval 👥'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 text-center space-y-1.5">
            <p className="text-xs text-gray-500">Already have a team account? <Link to="/member/login" className="text-primary-400 font-medium">Sign in</Link></p>
            <p className="text-xs text-gray-400">HR? <Link to="/company/login" className="text-primary-400">Company login →</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCompanySignup;
