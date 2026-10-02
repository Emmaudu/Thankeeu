import { cpath, marketFromPath, getMarket, prefixOf, MARKETS } from '../utils/market';
import AuthCountryNotice from '../components/layout/AuthCountryNotice';
import { useCountryContent } from '../components/country/content';
import { useState, useEffect } from 'react';
import SEO from '../components/seo/SEO';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Upload, CheckCircle, Briefcase, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../utils/api';
import toast from 'react-hot-toast';
import { COUNTRIES, getStates } from '../utils/countryStates';
import PhoneInput from '../components/ui/PhoneInput';

const SKILLS_LIST = [
  'Delivery & Courier','Pickup & Drop-off','Errand Running','Shopping & Purchasing',
  'Queuing & Waiting','Physical Inspections','On-Site Verifications','Field Marketing',
  'Flyer & Pamphlet Distribution','Door-to-Door Campaigns','Bill Payment (NEPA/Utility)',
  'Government Office Visits','Document Collection & Submission','Moving & Relocation Help',
  'Cleaning & Housekeeping','Driving & Chauffeur','Event Support & Ushering',
  'Photography & Videography','Grocery & Market Runs','Medical Sample/Prescription Runs',
];

const ID_TYPES = [
  { value: 'national_id',    label: 'National ID Card' },
  { value: 'passport',       label: 'International Passport' },
  { value: 'driver_license', label: "Driver's License" },
  { value: 'nin_slip',       label: 'NIN Slip' },
];
// Outside Nigeria: the photo IDs Airtasker and TaskRabbit accept.
const INTL_ID_TYPES = [
  { value: 'passport',       label: 'Passport' },
  { value: 'driver_license', label: 'Driving licence' },
  { value: 'national_id',    label: 'National or state ID card' },
];

/* ── Persistent helpers ───────────────────────────────────────── */
const SS_STEP    = 'tku_step';
const SS_FORM    = 'tku_form';
const SS_PROFILE = 'tku_profile';
const SS_AVATAR  = 'tku_avatar';

const ssGet = (key, fallback) => {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const ssSet = (key, val) => { try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {} };
const ssClear = () => {
  [SS_STEP, SS_FORM, SS_PROFILE, SS_AVATAR].forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
};

/* ── UI sub-components ────────────────────────────────────────── */
function StepDot({ n, current, done }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800,
      background: done ? '#00c37e' : current ? 'var(--rose)' : '#e5e7eb',
      color: (done || current) ? 'white' : '#9ca3af',
    }}>
      {done ? <CheckCircle size={13} /> : n}
    </div>
  );
}

function StepBar({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map(n => (
        <div key={n} className="flex items-center flex-1">
          <StepDot n={n} current={n === step} done={n < step} />
          {n < 3 && <div style={{ flex: 1, height: 2, background: n < step ? '#00c37e' : 'var(--border)', margin: '0 4px' }} />}
        </div>
      ))}
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 mb-6 text-sm font-semibold" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <ArrowLeft size={15} /> Back to previous step
    </button>
  );
}

function FileUploadBox({ label, sublabel, accept, required, file, onFile, locked }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span style={{ color: 'var(--rose)' }}>*</span>}
        {sublabel && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 4 }}>({sublabel})</span>}
      </label>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: 12,
        border: `2px dashed ${file ? 'var(--rose)' : 'var(--border)'}`,
        borderRadius: 12, cursor: locked ? 'not-allowed' : 'pointer',
        background: locked ? '#f9f9f9' : 'white', transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => { if (!locked) e.currentTarget.style.borderColor = 'var(--rose)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = file ? 'var(--rose)' : 'var(--border)'; }}>
        <input type="file" accept={accept} className="hidden" disabled={locked}
          onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }} />
        <div style={{ width: 34, height: 34, borderRadius: 8, background: file ? 'var(--rose-light)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {file ? <CheckCircle size={15} style={{ color: 'var(--rose)' }} /> : <Upload size={15} style={{ color: 'var(--muted)' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {file
            ? <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            : <p style={{ fontSize: 13, color: 'var(--muted)' }}>Click to {required ? 'upload' : 'optionally upload'} {label.toLowerCase()}</p>
          }
        </div>
        {file && (
          <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); onFile(null); }}
            style={{ flexShrink: 0, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>
            ×
          </button>
        )}
      </label>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   Steps: 1=Basic Info, 2=Photo, 3=Profile+Docs, 4=Done
   Account is ONLY created at step 3 submission.
   No authentication token required for any signup step.
   All progress is persisted to sessionStorage.
══════════════════════════════════════════════════════════════ */
export default function TaskerAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  // The country site this signup is on. Taskers can only work where they live.
  const mk = marketFromPath(location.pathname);
  const intl = !!mk.slug;
  const countryContent = useCountryContent(mk.slug || 'none');
  const docInfo = (key) => countryContent?.tasker?.documents?.find((d) => d.key === key);

  const initMode = searchParams.get('mode') === 'signup' || location.pathname.endsWith('/signup') ? 'signup' : 'login';
  const [mode, setMode] = useState(initMode);
  const [step, setStepRaw] = useState(() => ssGet(SS_STEP, 1));
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const setStep = (n) => { ssSet(SS_STEP, n); setStepRaw(n); };

  // ── Step 1: account fields ─────────────────────────────────
  const [form, setFormRaw] = useState(() => ssGet(SS_FORM, {
    email: '', full_name: '', username: '', phone: '',
    password: '', confirm_password: '', country: 'NG',
  }));
  const setForm = (updater) => {
    setFormRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      ssSet(SS_FORM, next);
      return next;
    });
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Step 2: avatar ─────────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(() => ssGet(SS_AVATAR, null));

  // ── Step 3: profile + docs ─────────────────────────────────
  const [profile, setProfileRaw] = useState(() => ssGet(SS_PROFILE, {
    linkedin_url: '', task_city: '', task_state: '',
    bio: '', skills: [], motivation: '',
  }));
  const setProfile = (updater) => {
    setProfileRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      ssSet(SS_PROFILE, next);
      return next;
    });
  };
  const setPD = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const toggleSkill = (s) => setPD('skills', profile.skills.includes(s) ? profile.skills.filter(x => x !== s) : [...profile.skills, s]);

  const [resumeFile, setResumeFile] = useState(null);
  const [idDocFile, setIdDocFile] = useState(null);
  const [idDocType, setIdDocType] = useState('national_id');
  const [poaFile, setPoaFile] = useState(null); // proof of address — optional in Nigeria, required elsewhere
  const [rtwFile, setRtwFile] = useState(null);   // right to work — international markets
  const [policeFile, setPoliceFile] = useState(null); // police / background check — optional
  const idTypes = intl ? INTL_ID_TYPES : ID_TYPES;
  useEffect(() => { if (intl && !INTL_ID_TYPES.some((t) => t.value === idDocType)) setIdDocType('passport'); }, [intl]);

  const countryStates = intl ? (countryContent?.regions || []) : getStates(form.country || 'NG');

  // Clear state when country changes and state is no longer valid
  useEffect(() => {
    if (profile.task_state && countryStates.length && !countryStates.includes(profile.task_state)) {
      setPD('task_state', '');
    }
  }, [form.country, mk.code, countryStates.length]);

  // Signing up on the Nigerian site but living in one of our other countries:
  // send them to that country's own tasker signup.
  const pickCountry = (code) => {
    const target = MARKETS.find((m) => m.code === code && m.slug);
    if (target) {
      toast(`Taskeeu has a separate site for ${target.name}. Taking you to the ${target.short} tasker signup.`, { duration: 6000 });
      navigate(`/${target.slug}/tasker/signup`);
      return;
    }
    set('country', code);
  };

  useEffect(() => {
    if (searchParams.get('reason') === 'link_expired') {
      toast('Your approval link has expired. Please log in with your email and password.', { duration: 6000 });
    }
  }, []);

  // Username check
  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameStatus(null); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { data } = await authApi.checkUsername(form.username, 'tasker');
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(null); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.username]);

  /* ── Login ────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const data = await login(form.email, form.password, 'tasker');
      const home = getMarket(data.user?.market || 'NG');
      if (home.code !== mk.code) {
        toast(`Your tasker account is on Taskeeu ${home.name}, so we have taken you there.`, { duration: 6000 });
      } else {
        toast.success(`Welcome back, ${data.user.full_name?.split(' ')[0]}!`);
      }
      navigate(`${prefixOf(home.code)}/tasker`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your email and password.');
    } finally { setLoading(false); }
  };

  /* ── Step 1 → Step 2 ─────────────────────────────────────── */
  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Please enter your full name'); return; }
    if (!form.phone.trim() || form.phone.trim().length < 6) { toast.error('Please enter your phone number with country code'); return; }
    // Check local part (after dial code) has at least 5 digits
    const localPart = form.phone.replace(/^\+\d+\s?/, '').replace(/\D/g, '');
    if (localPart.length < 5) { toast.error('Please enter a valid phone number after the country code'); return; }
    if (!form.username || form.username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    if (usernameStatus === 'taken') { toast.error('That username is taken. Please choose another.'); return; }
    if (!form.email.trim()) { toast.error('Please enter your email address'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (!agreedToTerms) { toast.error('You must agree to the Terms & Conditions to continue'); return; }
    setLoading(true);
    try {
      await authApi.taskerStep1Validate({ email: form.email, full_name: form.full_name, username: form.username, phone: form.phone, password: form.password, market: mk.code });
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err) {
      const d = err.response?.data;
      if (d?.code === 'WRONG_COUNTRY') {
        toast.error(d.message, { duration: 7000 });
        setMode('login');
        navigate(`${d.country_slug ? `/${d.country_slug}` : ''}/tasker/login`, { replace: true });
        return;
      }
      toast.error(d?.message || 'Please check your details and try again.');
    } finally { setLoading(false); }
  };

  /* ── Step 2 → Step 3 ─────────────────────────────────────── */
  const handleStep2 = async () => {
    if (!avatarFile) { toast.error('Please choose a profile photo to continue'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      const { data } = await authApi.taskerStep2(fd);
      const url = data.avatar_url || null;
      setAvatarUrl(url);
      ssSet(SS_AVATAR, url);
      toast.success('Photo uploaded!');
      setStep(3);
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed. Please check your connection and try again.');
    } finally { setLoading(false); }
  };

  /* ── Step 3 → Submit ─────────────────────────────────────── */
  const handleStep3 = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!profile.task_city?.trim()) { toast.error('Task city is required'); return; }
    if (!profile.task_state) { toast.error('Please select your task state'); return; }
    if (!(profile.bio || '').trim() || (profile.bio || '').trim().length < 30) {
      toast.error('Please write your pitch/bio (at least 30 characters). Requesters need this to choose you'); return;
    }
    if (!(profile.motivation || '').trim() || (profile.motivation || '').trim().length < 30) {
      toast.error('Please share your motivation (at least 30 characters)'); return;
    }
    if (!idDocFile) {
      toast.error(intl ? 'A photo ID is required. Upload your passport, driving licence or ID card.' : "An identity document is required. Upload your passport, national ID, driver's license, or NIN slip."); return;
    }
    if (intl && !poaFile) { toast.error('Proof of address is required. Upload a recent utility bill, bank statement or official letter.'); return; }
    if (intl && !rtwFile) { toast.error('Proof of your right to work is required.'); return; }

    setLoading(true);
    try {
      const fd = new FormData();

      // Account fields
      fd.append('email', form.email);
      fd.append('full_name', form.full_name);
      fd.append('username', form.username);
      fd.append('phone', form.phone);
      fd.append('password', form.password);
      fd.append('country', intl ? mk.code : (form.country || 'NG'));
      fd.append('market', mk.code);
      try { const rs = localStorage.getItem('taskeeu_referral_slug'); if (rs) fd.append('referral_slug', rs); } catch (_) {}

      // Photo
      if (avatarUrl) fd.append('avatar_url', avatarUrl);

      // Profile
      fd.append('task_city', profile.task_city);
      fd.append('task_state', profile.task_state);
      fd.append('motivation', profile.motivation);
      if (profile.bio) fd.append('bio', profile.bio);
      if (profile.linkedin_url) fd.append('linkedin_url', profile.linkedin_url);
      profile.skills.forEach(s => fd.append('skills[]', s));

      // ID document (required)
      fd.append('id_document', idDocFile);
      fd.append('id_document_type', idDocType);

      // Resume (optional, upload separately first)
      if (resumeFile) {
        try {
          const rfd = new FormData();
          rfd.append('resume', resumeFile);
          const { data: rd } = await authApi.taskerStep2Upload(rfd);
          if (rd.resume_url) fd.append('resume_url', rd.resume_url);
        } catch {
          toast('Resume upload failed. You can add it later from your dashboard.', { duration: 4000 });
        }
      }

      // Proof of address (optional at signup)
      if (poaFile) fd.append('proof_of_address', poaFile);
      if (intl && rtwFile) fd.append('right_to_work', rtwFile);
      if (intl && policeFile) fd.append('police_check', policeFile);

      const { data } = await authApi.taskerStep3(fd);

      if (data.token) localStorage.setItem('taskeeu_token', data.token);
      ssClear();
      setStep(4);
      window.scrollTo(0, 0);
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(msg);
      // Don't advance step — let user fix the issue and resubmit
    } finally { setLoading(false); }
  };

  /* ── Step 4: Success ──────────────────────────────────────── */
  if (step === 4) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--surface)' }}>
      <div style={{ maxWidth: 440, width: '100%', background: 'white', borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: '0 8px 40px rgba(18,9,26,0.12)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} style={{ color: '#00c37e' }} />
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.03em' }}>Application Submitted!</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
          Our team will review your application within <strong>24 to 48 hours</strong> and notify you at <strong>{form.email}</strong>.
        </p>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28, fontSize: 13 }}>
          Once approved, you can also add your proof of address and bank details in your dashboard for full verification and enterprise task access.
        </p>
        <Link to={cpath("/")} className="btn-primary w-full justify-center">Back to Home</Link>
      </div>
    </div>
  );

  const LEFT_PANEL = (
    <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12" style={{ background: 'linear-gradient(160deg, #12091a 0%, #1a0d2e 60%, #12091a 100%)' }}>
      <Link to={cpath("/")} className="flex items-center gap-2.5">
        <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
        <span style={{ fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: '-0.03em' }}>Taskeeu</span>
      </Link>
      <div>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,45,98,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Briefcase size={26} style={{ color: 'var(--rose)' }} />
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.03em' }}>
          Earn money doing<br />tasks near you
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
          {intl ? `Join verified taskers earning on their own schedule across ${mk.name}.` : 'Join verified taskers earning consistent income across Nigeria and beyond.'}
        </p>
        {[
          'Get paid per task, with no salary cap',
          'Work your own hours, your own city',
          'Build reputation through ratings',
          'Enterprise tasks for KYC-verified taskers',
        ].map(f => (
          <div key={f} className="flex items-center gap-3 mb-3">
            <CheckCircle size={14} style={{ color: 'var(--rose)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{f}</span>
          </div>
        ))}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>3-step signup · Progress saved · Reviewed within 24 to 48 hrs</p>
    </div>
  );

  return (
    <>
      <SEO title="Tasker Signup | Taskeeu" description="Sign up or log in as a tasker on Taskeeu and start earning." />
      {/* Slim top bar visible on mobile */}
      <div className="lg:hidden flex items-center justify-between px-5 py-3 border-b bg-white" style={{ borderColor: 'var(--border-light)' }}>
        <Link to={cpath("/")} className="flex items-center gap-2">
          <img src="/logo.svg" alt="Taskeeu" className="w-8 h-8 rounded-xl" />
          <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--dark)', letterSpacing: '-0.03em' }}>Taskeeu</span>
        </Link>
        <Link to={cpath("/")} style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>← Home</Link>
      </div>
      <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
        {step === 1 && LEFT_PANEL}

        <div className="flex-1 flex items-start justify-center p-6 md:p-10 overflow-y-auto">
          <div className="w-full max-w-lg py-8">

            {/* ════════ STEP 1 — Login / Basic Info ════════ */}
            {step === 1 && (
              <>
                <div className="flex rounded-2xl p-1 mb-8" style={{ background: 'var(--border-light)' }}>
                  {[['login', 'Sign In'], ['signup', 'Become a Tasker']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setMode(val)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={mode === val
                        ? { background: 'white', color: 'var(--text)', boxShadow: '0 1px 8px rgba(0,0,0,0.1)' }
                        : { background: 'transparent', color: 'var(--muted)' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {mode === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>Welcome back</h1>
                      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Sign in to your tasker account</p>
                    </div>
                    <AuthCountryNotice role="tasker" mode="login" />
                    <div>
                      <label className="label">Email address</label>
                      <input type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" value={form.password} onChange={e => set('password', e.target.value)} className="input pr-12" />
                        <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      <Link to="/auth/reset-password?role=tasker" style={{ color: 'var(--rose)', fontWeight: 600 }}>
                        Forgot your password?
                      </Link>
                    </p>
                    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      Need to post tasks?{' '}
                      <Link to={cpath("/requester/login")} style={{ color: 'var(--rose)', fontWeight: 700 }}>Requester login</Link>
                    </p>
                  </form>
                )}

                {mode === 'signup' && (
                  <form onSubmit={handleStep1} className="space-y-4">
                    <div>
                      <h1 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>Create your account</h1>
                      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>3 steps · Reviewed within 24 to 48 hrs</p>
                      <p style={{ color: '#00c37e', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>Progress is saved automatically, so you won't lose your work</p>
                    </div>
                    <AuthCountryNotice role="tasker" mode="signup" />

                    <div>
                      <label className="label">Full Name <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <input type="text" required autoComplete="name" placeholder="e.g. Emeka Obi" value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input w-full" />
                    </div>
                    <div>
                      <label className="label">Phone <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <PhoneInput
                        required
                        value={form.phone}
                        onChange={v => set('phone', v)}
                        placeholder="8012345678"
                        className="w-full"/>
                    </div>

                    <div>
                      <label className="label">Username <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <div className="relative">
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontWeight: 700 }}>@</span>
                        <input type="text" required minLength={3} maxLength={30} placeholder="yourhandle" value={form.username}
                          onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="input" style={{ paddingLeft: 28, paddingRight: 36, borderColor: usernameStatus === 'taken' ? '#ef4444' : usernameStatus === 'available' ? '#00c37e' : undefined }} />
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                          {usernameStatus === 'checking' && <span style={{ color: 'var(--muted)' }}>⏳</span>}
                          {usernameStatus === 'available' && <span style={{ color: '#00c37e' }}></span>}
                          {usernameStatus === 'taken' && <span style={{ color: '#ef4444' }}></span>}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: usernameStatus === 'taken' ? '#ef4444' : usernameStatus === 'available' ? '#00c37e' : 'var(--muted)', marginTop: 4 }}>
                        {usernameStatus === 'taken' ? 'Username taken. Try another.' : usernameStatus === 'available' ? 'Username available!' : 'Visible to requesters. Letters, numbers, underscores only.'}
                      </p>
                    </div>

                    {!intl && (
                    <div>
                      <label className="label">Country <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <select value={form.country} onChange={e => pickCountry(e.target.value)} className="input">
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                        {MARKETS.filter(m => m.slug && !COUNTRIES.some(c => c.code === m.code)).map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                      </select>
                    </div>
                    )}

                    <div>
                      <label className="label">Email <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <input type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} className="input" />
                    </div>

                    <div>
                      <label className="label">Password <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} required minLength={8} autoComplete="new-password" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} className="input pr-12" />
                        <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="label">Confirm Password <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <input type="password" required autoComplete="new-password" placeholder="Repeat your password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} className="input" />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                        style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, accentColor: 'var(--rose)', cursor: 'pointer' }} />
                      <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                        I agree to Taskeeu's{' '}
                        <a href="/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--rose)', fontWeight: 600 }}>Terms of Service</a>
                        {' '}and{' '}
                        <a href="/policy" target="_blank" rel="noreferrer" style={{ color: 'var(--rose)', fontWeight: 600 }}>Privacy Policy</a>.
                        I confirm I am 18 or older.
                      </span>
                    </label>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? 'Checking…' : 'Continue: Upload Photo →'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ════════ STEP 2 — Profile Photo ════════ */}
            {step === 2 && (
              <div>
                <BackBtn onClick={() => setStep(1)} />
                <StepBar step={2} />
                <h1 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.03em' }}>Upload Profile Photo</h1>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
                  A clear face photo helps requesters trust and choose you. This step is required.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 120, height: 120, borderRadius: 24, border: '2px dashed var(--rose)', overflow: 'hidden', background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Upload size={30} style={{ color: 'var(--rose)', opacity: 0.5 }} />
                      }
                    </div>
                    {avatarPreview && (
                      <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); setAvatarUrl(null); ssSet(SS_AVATAR, null); }}
                        style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
                        ×
                      </button>
                    )}
                  </div>

                  <label style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: 12, border: '2px solid var(--rose)', color: 'var(--rose)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
                        setAvatarFile(f);
                        setAvatarPreview(URL.createObjectURL(f));
                      }} />
                    <Upload size={15} /> {avatarPreview ? 'Change Photo' : 'Choose Photo'}
                  </label>
                  <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>JPG, PNG or WEBP · Max 5MB · Must be a clear face photo</p>
                </div>

                <button type="button" onClick={handleStep2} disabled={loading || !avatarFile}
                  className="btn-primary w-full" style={{ opacity: !avatarFile ? 0.6 : 1 }}>
                  {loading ? 'Uploading…' : 'Continue: Complete Profile →'}
                </button>
              </div>
            )}

            {/* ════════ STEP 3 — Profile + Docs ════════ */}
            {step === 3 && (
              <div>
                <BackBtn onClick={() => setStep(2)} />
                <StepBar step={3} />
                <h1 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.03em' }}>Complete Your Profile</h1>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 4 }}>Almost done! Write your pitch, select the physical tasks you do, and upload your ID document.</p>
                <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, marginBottom: 24, fontSize: 12, color: '#b45309' }}>
                  <strong>Required:</strong> Identity document (passport, national ID, driver's license, or NIN slip). Proof of address is optional here; you can add it later for enterprise task access.
                </div>

                <form onSubmit={handleStep3} className="space-y-5">

                  {/* ① LinkedIn / Social */}
                  <div className="card p-5">
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>LinkedIn or Social Media Profile</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Optional but recommended. LinkedIn, Instagram, Twitter, or any active profile.</p>
                    <input type="url" placeholder="https://linkedin.com/in/yourname  OR  https://instagram.com/yourhandle" value={profile.linkedin_url} onChange={e => setPD('linkedin_url', e.target.value)} className="input" />
                  </div>

                  {/* ② Resume */}
                  <div className="card p-5">
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Resume / CV <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>PDF, Word document, or image. Helps requesters see your experience.</p>
                    <FileUploadBox
                      label="Resume / CV" sublabel="optional" accept=".pdf,.doc,.docx,.txt,image/*" file={resumeFile} onFile={setResumeFile}
                    />
                  </div>

                  {/* ③ Task Location */}
                  <div className="card p-5">
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Task Location <span style={{ color: 'var(--rose)' }}>*</span></p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      The city where you want to receive tasks. We'll notify you when tasks are posted nearby.
                      {intl ? <>Areas shown are for <strong>{mk.name}</strong>.</> : <>States shown are for <strong>{COUNTRIES.find(c => c.code === form.country)?.name || form.country}</strong>.</>}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Task City <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <input type="text" required
                          placeholder={intl ? mk.cityLabel : form.country === 'NG' ? 'e.g. Lekki, Ikeja' : 'Your task city'}
                          value={profile.task_city} onChange={e => setPD('task_city', e.target.value)} className="input" />
                      </div>
                      <div>
                        <label className="label">{intl ? mk.regionLabel : 'State / Region'} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <select required value={profile.task_state} onChange={e => setPD('task_state', e.target.value)} className="input">
                          <option value="">Select</option>
                          {countryStates.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ④ Identity Document — REQUIRED */}
                  <div className="card p-5" style={{ border: `1px solid ${idDocFile ? '#bbf7d0' : 'var(--border-light)'}`, background: idDocFile ? '#f0fdf4' : 'white' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={16} style={{ color: idDocFile ? '#00c37e' : 'var(--rose)', flexShrink: 0 }} />
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', margin: 0 }}>Identity Document <span style={{ color: 'var(--rose)' }}>*</span></p>
                      {idDocFile && <CheckCircle size={14} style={{ color: '#00c37e', marginLeft: 'auto' }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      {intl ? (docInfo('id_document')?.help || 'Upload one valid photo ID. PNG, JPG or PDF.') : <>Upload <strong>one</strong> of: International Passport, National ID Card, Driver's License, or NIN Slip. PNG, JPG or PDF.</>}
                    </p>
                    <div className="mb-3">
                      <label className="label">Document type <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        {idTypes.map(t => (
                          <label key={t.value} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                            border: `1.5px solid ${idDocType === t.value ? 'var(--rose)' : 'var(--border)'}`,
                            background: idDocType === t.value ? 'var(--rose-light)' : 'white',
                            fontSize: 13, fontWeight: idDocType === t.value ? 700 : 400,
                            color: idDocType === t.value ? 'var(--rose)' : 'var(--muted)',
                          }}>
                            <input type="radio" name="id_type" value={t.value} checked={idDocType === t.value}
                              onChange={() => setIdDocType(t.value)} style={{ display: 'none' }} />
                            {t.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <FileUploadBox
                      label={idTypes.find(t => t.value === idDocType)?.label || 'Identity Document'}
                      required accept="image/*,application/pdf" file={idDocFile} onFile={setIdDocFile}
                    />
                    {!idDocFile && (
                      <div className="flex items-center gap-2 mt-2" style={{ fontSize: 12, color: '#b45309' }}>
                        <AlertCircle size={12} style={{ flexShrink: 0 }} />
                        <span>This is required to submit your application</span>
                      </div>
                    )}
                  </div>

                  {/* ⑤ Proof of Address — optional at signup */}
                  <div className="card p-5">
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                      Proof of Address {intl ? <span style={{ color: 'var(--rose)' }}>*</span> : <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>(optional at signup)</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      {intl ? (docInfo('proof_of_address')?.help || `A recent utility bill, bank statement or official letter showing your address in ${mk.name}.`) : 'Utility bill, bank statement, or any official document showing your address. You can also add this later in your dashboard to unlock enterprise tasks.'}
                    </p>
                    <FileUploadBox
                      label="Proof of Address" sublabel="utility bill or bank statement" accept="image/*,application/pdf" file={poaFile} onFile={setPoaFile}
                    />
                  </div>

                  {intl && (
                    <div className="card p-5" style={{ border: `1px solid ${rtwFile ? '#bbf7d0' : 'var(--border-light)'}`, background: rtwFile ? '#f0fdf4' : 'white' }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                        {docInfo('right_to_work')?.label || 'Right to work'} <span style={{ color: 'var(--rose)' }}>*</span>
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                        {docInfo('right_to_work')?.help || `A passport, visa, residence permit or work permit showing you can work in ${mk.name}.`}
                      </p>
                      <FileUploadBox label="Right to work document" required accept="image/*,application/pdf" file={rtwFile} onFile={setRtwFile} />
                    </div>
                  )}

                  {intl && (
                    <div className="card p-5">
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                        {docInfo('police_check')?.label || 'Police or background check'} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                        {docInfo('police_check')?.help || 'Optional. A recent police or background check helps requesters choose you.'}
                      </p>
                      <FileUploadBox label="Police or background check" sublabel="optional" accept="image/*,application/pdf" file={policeFile} onFile={setPoliceFile} />
                    </div>
                  )}

                  {/* ⑥ Bio + Skills */}
                  <div className="card p-5">
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 14 }}>
                      Your Pitch & Physical Task Skills <span style={{ color: 'var(--rose)' }}>*</span>
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Your Pitch: Short Bio <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                          Requesters read this before accepting your bid on a task. Sell yourself: mention the physical tasks you're best at, how fast/reliable you are, and your area coverage. Keep it punchy.
                        </p>
                        <textarea rows={4} required placeholder={intl ? "e.g. 'I assemble flat pack furniture, mount TVs and help with small moves across my area. I have my own tools and a car, reply quickly and send photos when the job is done.'" : "e.g. 'I specialise in same-day deliveries, errand runs, and queue-waiting across Lagos Island & Mainland. I own a bike, respond within 5 mins, and have completed 80+ verified errands. Punctuality and proof-of-completion photos are my standard.'"} value={profile.bio} onChange={e => setPD('bio', e.target.value)}
                          className="input resize-none" maxLength={400} />
                        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', marginTop: 2 }}>{(profile.bio || '').length}/400</p>
                      </div>
                      <div>
                        <label className="label">Physical Task Skills</label>
                        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Select all the real-world tasks you can handle. Requesters filter by skill when posting tasks.</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {SKILLS_LIST.map(skill => (
                            <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={profile.skills.includes(skill)
                                ? { background: 'var(--rose)', color: 'white', border: '1px solid var(--rose)' }
                                : { background: 'white', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ⑦ Motivation — required */}
                  <div className="card p-5">
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                      Your Motivation <span style={{ color: 'var(--rose)' }}>*</span>
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      Why do you want to be a Taskeeu tasker? What experience do you bring? What do you think about the platform?
                    </p>
                    <textarea rows={5} required
                      placeholder="e.g. I want to join Taskeeu because I'm reliable, physically available, and experienced doing real-world tasks like deliveries, bank runs, and errands for people in Lagos. I own a vehicle, I'm reachable 7 days a week, and I understand the value of completing tasks on time. I believe Taskeeu is the right platform to connect trustworthy people like me with those who need help on the ground..." value={profile.motivation} onChange={e => setPD('motivation', e.target.value)}
                      className="input resize-none" maxLength={1000} />
                    <p style={{ fontSize: 11, marginTop: 4, textAlign: 'right', color: (profile.motivation || '').length < 30 ? '#b45309' : 'var(--muted)' }}>
                      {(profile.motivation || '').length}/1000 {(profile.motivation || '').length < 30 && '· minimum 30 characters'}
                    </p>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border-light)', lineHeight: 1.6 }}>
                    By submitting you confirm all information is accurate. Bank details and proof of address can be added from your dashboard after approval for full verification and enterprise task access.
                  </div>

                  <button type="submit" disabled={loading || !idDocFile}
                    className="btn-primary w-full" style={{ opacity: !idDocFile ? 0.7 : 1 }}>
                    {loading ? 'Uploading & submitting…' : !idDocFile ? 'Upload ID document to continue' : 'Submit Application'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
