import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Building2, Zap, Upload, CheckCircle, User, Briefcase, Check } from 'lucide-react';
import { teamsApi } from '../../utils/api';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const INDUSTRIES = ['Banking & Finance','Telecoms','Insurance','FMCG & Retail','Real Estate','Energy & Utilities','Logistics','NGO / Non-profit','Government','Technology','Healthcare','Education','Manufacturing','Agriculture','Other'];

/* ── HR Company Registration ─────────────────────────────────────── */
function HRRegister({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [form, setForm] = useState({
    company_name:'', company_domain:'', branch_name:'', branch_address:'',
    industry:'', company_size:'', company_address:'',
    hr_first_name:'', hr_last_name:'', email:'', hr_phone:'', password:'', confirm_password:'',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (!form.company_domain) { toast.error('Company domain is required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      const { data } = await teamsApi.registerCompany(fd);
      localStorage.setItem('taskeeu_token', data.token);
      localStorage.setItem('taskeeu_user', JSON.stringify(data.user));
      localStorage.setItem('teams_company', JSON.stringify(data.company));
      localStorage.setItem('teams_member', JSON.stringify(data.member));
      toast.success(`Company "${data.company.company_name}" registered!`);
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-bold text-dark">Register Your Company</h2>
        <p className="text-muted text-sm mt-1">Create a Taskeeu for Teams company account. You will be the HR Administrator.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              s < step ? 'bg-rose-500 text-white' : s === step ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-gray-200 text-gray-400')}>
              {s < step ? <Check size={14} /> : s}
            </div>
            <span className={clsx('text-xs', s === step ? 'text-rose-600 font-semibold' : 'text-muted')}>
              {s === 1 ? 'Company Info' : 'HR Details'}
            </span>
            {s < 2 && <div className={clsx('flex-1 h-px', s < step ? 'bg-rose-500' : 'bg-gray-200')} />}
          </div>
        ))}
      </div>

      <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className="label">Company Name *</label>
              <input required value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Huawei Technologies Nigeria" className="input" />
            </div>
            <div>
              <label className="label">Company Email Domain *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-medium">@</span>
                <input required value={form.company_domain}
                  onChange={e => set('company_domain', e.target.value.toLowerCase().replace('@','').trim())}
                  placeholder="huawei.com" className="input pl-7" />
              </div>
              <p className="text-xs text-muted mt-1">Only employees with this email domain can join your company account.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Branch Name *</label>
                <input required value={form.branch_name} onChange={e => set('branch_name', e.target.value)}
                  placeholder="e.g. Ikeja Branch, Lekki HQ" className="input"/>
                <p className="text-xs text-muted mt-1">e.g. "Head Office", "Ikeja Branch"</p>
              </div>
              <div>
                <label className="label">Branch Address</label>
                <input value={form.branch_address} onChange={e => set('branch_address', e.target.value)}
                  placeholder="Branch street address" className="input"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Industry</label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)} className="input">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Company Size</label>
                <select value={form.company_size} onChange={e => set('company_size', e.target.value)} className="input">
                  <option value="">Select size</option>
                  <option>1 to 10</option><option>11 to 50</option><option>51 to 200</option>
                  <option>201 to 1000</option><option>1000+</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Company Address</label>
              <input value={form.company_address} onChange={e => set('company_address', e.target.value)} placeholder="Head office address" className="input" />
            </div>
            <div>
              <label className="label">Company Logo (optional)</label>
              <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
                <Upload size={16} className="text-rose-500" />
                <span className="text-sm text-gray-500">{logoFile ? logoFile.name : 'Upload logo (PNG, JPG)'}</span>
              </label>
            </div>
            <button type="submit" className="btn-primary w-full py-3">Continue: HR Details →</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700">
              <strong>ℹ️ HR Administrator:</strong> You will have full access to manage members, departments, wallet, and all tasks.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First Name *</label><input required value={form.hr_first_name} onChange={e => set('hr_first_name', e.target.value)} placeholder="Adeola" className="input" /></div>
              <div><label className="label">Last Name *</label><input required value={form.hr_last_name} onChange={e => set('hr_last_name', e.target.value)} placeholder="Okafor" className="input" /></div>
            </div>
            <div>
              <label className="label">Work Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder={`you@${form.company_domain || 'yourcompany.com'}`} className="input" />
              <p className="text-xs text-muted mt-1">Can be your company domain email or a personal email for HR admin access.</p>
            </div>
            <div>
              <label className="label">Phone *</label>
              <input required type="tel" value={form.hr_phone} onChange={e => set('hr_phone', e.target.value)} placeholder="08012345678" className="input" />
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input required type={showPw ? 'text' : 'password'} minLength={8} value={form.password} onChange={e => set('password', e.target.value)} className="input pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input required type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} className="input" />
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
              By registering, you agree to Taskeeu for Teams Terms of Service. Subscription required to activate full access.
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost border border-gray-200 flex-1">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-2 py-3 flex-1">
                {loading ? 'Creating Account...' : 'Create Company Account'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

/* ── Member Signup ───────────────────────────────────────────────── */
function MemberSignup({ onSuccess, onSwitchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ first_name:'', last_name:'', work_email:'', password:'', department:'', job_role:'', requested_role:'member' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await teamsApi.memberSignup(form);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="text-center py-6 animate-fade-in">
      <CheckCircle size={52} className="text-green-500 mb-4 mx-auto" />
      <h3 className="font-heading text-xl font-bold text-dark mb-2">Account Created!</h3>
      <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
        Your account is active. You can log in right away with your company email and password.
      </p>
      <button onClick={() => onSwitchToLogin ? onSwitchToLogin() : setDone(false)} className="btn-primary btn-sm mt-5">Log In Now →</button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-bold text-dark">Join Your Company</h2>
        <p className="text-muted text-sm mt-1">Use your company email to automatically match your organisation.</p>
      </div>
      <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700">
        ℹ️ Your company email domain will be verified against your organisation's registered domain. Your account will be pending HR approval.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">First Name *</label><input required value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Chidi" className="input"/></div>
          <div><label className="label">Last Name *</label><input required value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Okonkwo" className="input"/></div>
        </div>
        <div>
          <label className="label">Company Email *</label>
          <input required type="email" value={form.work_email} onChange={e => set('work_email', e.target.value)} placeholder="chidi.okonkwo@yourcompany.com" className="input"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Department *</label><input required value={form.department} onChange={e => set('department', e.target.value)} placeholder="Operations" className="input"/></div>
          <div><label className="label">Job Role *</label><input required value={form.job_role} onChange={e => set('job_role', e.target.value)} placeholder="Field Manager" className="input"/></div>
        </div>
        <div>
          <label className="label">I am joining as</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value:'member', Icon: User, title:'Team Member', desc:'Standard access to post tasks' },
              { value:'team_leader', Icon: Briefcase, title:'Team Leader', desc:'Request leader rights (HR approves)' },
            ].map(r => (
              <button key={r.value} type="button" onClick={() => set('requested_role', r.value)}
                className={clsx('p-3 rounded-xl border-2 text-left transition-all',
                  form.requested_role === r.value ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300')}>
                <div className="text-xl mb-1"></div>
                <p className={clsx('font-semibold text-xs', form.requested_role === r.value ? 'text-rose-700' : 'text-gray-700')}>{r.title}</p>
                <p className="text-xs text-muted mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
          {form.requested_role === 'team_leader' && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-100">
              ℹ️ You will get immediate member access. HR will be notified to approve your Team Leader privileges.
            </p>
          )}
        </div>
        <div>
          <label className="label">Password * (min 8 characters)</label>
          <div className="relative">
            <input required type={showPw ? 'text' : 'password'} minLength={8} value={form.password} onChange={e => set('password', e.target.value)} className="input pr-12"/>
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Submitting...' : 'Create Account & Wait for Approval'}
        </button>
      </form>
    </div>
  );
}

/* ── Member Login ────────────────────────────────────────────────── */
function MemberLogin({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email:'', password:'' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await teamsApi.memberLogin({ email: form.email, password: form.password });
      localStorage.setItem('taskeeu_token', data.token);
      localStorage.setItem('taskeeu_user', JSON.stringify(data.user));
      localStorage.setItem('teams_member', JSON.stringify(data.member));
      localStorage.setItem('teams_permissions', JSON.stringify(data.permissions));
      toast.success(`Welcome back, ${data.member.first_name}!`);
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-bold text-dark">Team Member Login</h2>
        <p className="text-muted text-sm mt-1">Log in with your company email and password.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Company Email</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@yourcompany.com" className="input"/>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="input pr-12"/>
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Logging in...' : 'Sign In to Company Account →'}
        </button>
      </form>
    </div>
  );
}

/* ── Main Auth Page ──────────────────────────────────────────────── */
export default function TeamsAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initMode = searchParams.get('mode') || (location.pathname === '/teams/register' ? 'register' : 'login');
  const [mode, setMode] = useState(initMode);

  const handleSuccess = (data) => {
    if (data?.member?.is_hr || data?.member?.permission_level === 'hr') {
      navigate('/teams/hr');
    } else {
      navigate('/teams/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0a2e1a 100%)' }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse at 20% 60%, rgba(0,195,126,0.15) 0%, transparent 60%)' }} />
        <Link to="/teams" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center"><Zap size={16} className="text-white" fill="white"/></div>
          <div>
            <span className="text-white font-heading font-bold">Taskeeu</span>
            <span className="text-rose-400 font-heading font-bold"> for Teams</span>
          </div>
        </Link>
        <div className="relative z-10">
          <h2 className="font-heading text-3xl font-bold text-white leading-tight mb-4">
            Africa's Field Operations Infrastructure
          </h2>
          <p className="text-white/60 text-base mb-8">Deploy verified field agents across Africa with GPS proof, SLA tracking, and escrow payments.</p>
          <div className="space-y-3">
            {['Domain-verified team access','GPS timestamp proof system','Department wallet management','Auto authorization letters','Integrated video meetings','80/20 tasker payout model'].map(f => (
              <div key={f} className="flex items-center gap-3 text-white/70 text-sm">
                <CheckCircle size={15} className="text-rose-400 flex-shrink-0"/>{f.substring(2)}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs relative z-10">₦200,000/month · ₦2,400,000/year</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <Link to="/teams" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center"><Zap size={16} className="text-white" fill="white"/></div>
            <div><span className="font-heading font-bold text-dark">Taskeeu</span><span className="text-rose-600 font-heading font-bold"> for Teams</span></div>
          </Link>

          {mode === 'register' && <HRRegister onSuccess={handleSuccess}/>}
          {mode === 'signup' && <MemberSignup onSuccess={() => setMode('login')} onSwitchToLogin={() => setMode('login')}/>}
          {mode === 'login' && <MemberLogin onSuccess={handleSuccess}/>}

          {/* Mode switcher */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-3 text-center text-sm">
            {mode !== 'login' && (
              <p className="text-muted">Already have an account? <button onClick={() => setMode('login')} className="text-rose-600 font-semibold hover:underline">Sign in →</button></p>
            )}
            {mode !== 'signup' && (
              <p className="text-muted">Employee joining your company? <button onClick={() => setMode('signup')} className="text-rose-600 font-semibold hover:underline">Sign up →</button></p>
            )}
            {mode !== 'register' && (
              <p className="text-muted">New company? <button onClick={() => setMode('register')} className="text-rose-600 font-semibold hover:underline">Register company →</button></p>
            )}
            <p className="text-muted pt-1"><Link to="/teams" className="text-gray-400 hover:text-gray-600">← Back to Teams page</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
