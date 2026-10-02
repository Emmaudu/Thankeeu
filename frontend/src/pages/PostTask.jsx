import { cpath, marketFromPath } from '../utils/market';
import { useCountryContent } from '../components/country/content';
import CountrySEO from '../components/country/CountrySEO';
import SEO from '../components/seo/SEO';
import CostFields, { emptyCosts, costsValid } from '../components/task/CostFields';
import { costNumber, costTotal, naira } from '../utils/taskPrice';
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { tasksApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Truck, MapPin, ShoppingCart, Zap, CheckCircle, ArrowLeft, ArrowRight, Clock, DollarSign, List, Package, Lock, LogIn, Laptop, Users } from 'lucide-react';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

const TASK_TYPES = [
  { value: 'pickup_delivery', Icon: Truck,        title: 'Pickup & Delivery',  desc: 'Pick something up and deliver to another location.' },
  { value: 'location_only',  Icon: MapPin,        title: 'On-Location Only',   desc: 'Do something at a specific location only.' },
  { value: 'purchase_ship',  Icon: ShoppingCart,  title: 'Purchase & Ship',    desc: 'Buy something and ship it to you.' },
  { value: 'general',        Icon: Zap,           title: 'General Errand',     desc: 'Anything else: queue, collect, verify, etc.' },
];

const STEPS = ['Task Type', 'Location', 'Details', 'Costs & Deadline', 'Review'];
const DRAFT_KEY = 'taskeeu_draft_task';

export default function PostTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  // The task is posted on the country site it is created on (/uk/post-task → UK, in GBP).
  const mk = marketFromPath(location.pathname);
  const intl = !!mk.slug;
  const countryContent = useCountryContent(mk.slug || 'none');
  const REGIONS = intl ? (countryContent?.regions || []) : NIGERIAN_STATES;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false); // gate at last step

  const [form, setForm] = useState(() => {
    // Restore draft if user was redirected back after auth
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      task_type: '', from_address: '', from_city: '', from_state: '',
      to_address: '', to_city: '', to_state: '',
      task_city: '', task_state: '', task_full_address: '',
      title: '', description: '', tags: '',
      is_equipment_required: false, equipment_description: '',
      ...emptyCosts(), deadline: '', is_remote: false,
    };
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedType = TASK_TYPES.find(t => t.value === form.task_type);
  const remote = !!form.is_remote;
  const needsFrom = !remote && ['pickup_delivery', 'purchase_ship'].includes(form.task_type);
  const needsTo = !remote && form.task_type === 'pickup_delivery';
  const setRemote = (on) => setForm(f => ({ ...f, is_remote: on, task_type: on ? 'general' : (f.is_remote ? '' : f.task_type) }));

  const canProceed = () => {
    if (step === 0) return !!form.task_type;
    if (step === 1) return remote || (form.task_city && form.task_state);
    if (step === 2) return form.title?.length >= 5 && form.description?.length >= 10;
    if (step === 3) return !!form.deadline && costsValid(form);
    return true;
  };

  const handleContinue = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    // Last step — if not authenticated, show auth gate
    if (!isAuthenticated) {
      // Save draft to sessionStorage so it survives redirect
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, country: mk.code }));
      setShowAuth(true);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { budget_min: _bmin, budget_max: _bmax, ...rest } = form;
      // Send the breakdown AND the single total, so the price is saved even by a
      // server that does not know the breakdown fields yet.
      const payload = { ...rest, country: mk.code, is_remote: remote, budget_min: costTotal(form), budget_max: costTotal(form) };
      if (remote) { payload.task_type = 'general'; payload.task_city = ''; payload.task_full_address = ''; }
      if (form.tags) payload.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { data } = await tasksApi.create(payload);
      // Clear draft
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success('Task posted! Taskers near you will be notified.');
      navigate(cpath(`/tasks/${data.task?.id || ''}`));
    } catch (err) {
      const d = err?.response?.data;
      if (d?.code === 'WRONG_COUNTRY') {
        toast.error(d.message, { duration: 8000 });
        navigate(`${d.country_slug ? `/${d.country_slug}` : ''}/post-task`);
        return;
      }
      toast.error(d?.message || 'Failed to post task');
    } finally { setLoading(false); }
  };

  // Auth gate — shown when unauthenticated user hits Review & Post
  if (showAuth) return (
    <div className="pt-20 min-h-screen" style={{ background: 'var(--surface)' }}>
      <div className="container-xl py-12">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="card p-8 text-center">
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={32} style={{ color: 'var(--rose)' }} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.03em' }}>
              Almost there! Sign in to post
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your task details are saved. Create a free account or sign in to publish your task and start receiving bids.
            </p>

            {/* Task summary */}
            <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Your task
              </p>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15, marginBottom: 4 }}>{form.title || 'Untitled task'}</p>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{remote ? 'Remote (online)' : <>{form.task_city}{form.task_state ? `, ${form.task_state}` : ''}</>}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to={cpath(`/requester/signup?next=/post-task`)}
                onClick={() => sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, country: mk.code }))}
                className="btn-primary w-full"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              >
                Create Free Account & Post Task
              </Link>
              <Link
                to={cpath(`/requester/login?next=/post-task`)}
                onClick={() => sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, country: mk.code }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 24px', borderRadius: 16, border: '2px solid var(--border)',
                  color: 'var(--text)', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all 0.15s'
                }}
              >
                <LogIn size={16} /> Sign In to Existing Account
              </Link>
              <button
                onClick={() => setShowAuth(false)}
                style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                ← Back to review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {intl
        ? <CountrySEO market={mk} title={`Post a Task for Free in ${mk.name} | Taskeeu`} description={`Describe your task, set a price in ${mk.currency} and get bids from verified local taskers in ${mk.name}. In person or remote. Free to post.`} path={`/${mk.slug}/post-task`} alternatesPath="/post-task" />
        : <SEO
        title="Post a Task | Hire a Verified Tasker"
        description="Post your task in minutes and get bids from verified taskers across Africa."
        canonical="https://taskeeu.com/post-task"
      />}
      <div className="pt-20 min-h-screen" style={{ background: 'var(--surface)' }}>
        <div className="container-xl py-10">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>

            <div className="text-center mb-8">
              <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Post a Task
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 15 }}>
                Describe what you need done, and verified taskers near you will bid.
              </p>
              {!isAuthenticated && (
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                  No account needed until the end.{' '}
                  <Link to={cpath("/requester/login")} style={{ color: 'var(--rose)', fontWeight: 700 }}>Already have one?</Link>
                </p>
              )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center mb-8">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      i < step ? 'bg-rose-500 text-white' :
                      i === step ? 'bg-rose-500 text-white ring-4 ring-rose-100' :
                      'bg-gray-200 text-gray-400'
                    )}>
                      {i < step ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span className={clsx('text-xs mt-1 hidden sm:block font-medium', i === step ? 'text-rose-600 font-semibold' : 'text-gray-400')}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={clsx('flex-1 h-0.5 mx-2 transition-colors', i < step ? 'bg-rose-500' : 'bg-gray-200')} />
                  )}
                </div>
              ))}
            </div>

            <div className="card p-6 md:p-8">

              {/* STEP 0: Task Type */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>Where will the work be done?</h2>
                  <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="In person or remote">
                    {[
                      { on: false, Icon: Users, title: 'In person', desc: 'A tasker comes to a place.' },
                      { on: true, Icon: Laptop, title: 'Remote (online)', desc: 'Done online or by phone. No address.' },
                    ].map(o => (
                      <button key={o.title} type="button" role="radio" aria-checked={remote === o.on} data-testid={o.on ? 'mode-remote' : 'mode-in-person'}
                        onClick={() => setRemote(o.on)}
                        className={clsx('flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all', remote === o.on ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                        <o.Icon size={20} className={remote === o.on ? 'text-rose-500' : 'text-gray-400'} />
                        <span>
                          <span className={clsx('block font-bold text-sm', remote === o.on ? 'text-rose-700' : 'text-gray-800')}>{o.title}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{o.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {!remote && <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', margin: '12px 0 12px' }}>What kind of task is this?</h2>}
                  {!remote && TASK_TYPES.map(type => (
                    <button key={type.value} type="button" onClick={() => set('task_type', type.value)}
                      className={clsx('w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                        form.task_type === type.value ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}>
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        form.task_type === type.value ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500')}>
                        <type.Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className={clsx('font-bold text-sm', form.task_type === type.value ? 'text-rose-700' : 'text-gray-800')}>{type.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{type.desc}</p>
                      </div>
                      {form.task_type === type.value && <CheckCircle size={18} className="text-rose-500 flex-shrink-0 mt-1" />}
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 1: Location */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }} className="flex items-center gap-2">
                    <MapPin size={20} className="text-rose-500" /> {remote ? 'Remote task' : 'Where is the task?'}
                  </h2>
                  {remote && (
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                      <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                        No address needed. Taskers anywhere in {intl ? mk.name : 'Nigeria'} can bid, and you share files and updates in the task chat.
                      </p>
                      <div>
                        <label className="label">{intl ? mk.regionLabel : 'State'} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional, if you prefer someone nearby)</span></label>
                        <select value={form.task_state} onChange={e => set('task_state', e.target.value)} className="input"><option value="">Anywhere</option>{REGIONS.map(s => <option key={s}>{s}</option>)}</select>
                      </div>
                    </div>
                  )}
                  {needsFrom && (
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                      <p className="font-semibold text-sm text-gray-700 flex items-center gap-2"><Package size={14} /> Pickup Location</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">City</label><input placeholder="e.g. Ikeja" value={form.from_city} onChange={e => set('from_city', e.target.value)} className="input" /></div>
                        <div><label className="label">State</label><select value={form.from_state} onChange={e => set('from_state', e.target.value)} className="input"><option value="">Select</option>{REGIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                      </div>
                      <div><label className="label">Full Address</label><input placeholder="Street address, landmark..." value={form.from_address} onChange={e => set('from_address', e.target.value)} className="input" /></div>
                    </div>
                  )}
                  {needsTo && (
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                      <p className="font-semibold text-sm text-gray-700 flex items-center gap-2"><MapPin size={14} /> Delivery Destination</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">City</label><input placeholder="e.g. Victoria Island" value={form.to_city} onChange={e => set('to_city', e.target.value)} className="input" /></div>
                        <div><label className="label">State</label><select value={form.to_state} onChange={e => set('to_state', e.target.value)} className="input"><option value="">Select</option>{REGIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                      </div>
                      <div><label className="label">Full Address</label><input placeholder="Street address, landmark..." value={form.to_address} onChange={e => set('to_address', e.target.value)} className="input" /></div>
                    </div>
                  )}
                  {!remote && <div className="p-4 rounded-2xl space-y-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <p className="font-semibold text-sm text-amber-800 flex items-center gap-2"><MapPin size={14} /> {intl ? `${mk.cityLabel} and ${mk.regionLabel.toLowerCase()} (for matching taskers) *` : 'Task City & State (for matching taskers) *'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">City *</label><input required placeholder="Primary task city" value={form.task_city} onChange={e => set('task_city', e.target.value)} className="input" /></div>
                      <div><label className="label">{intl ? mk.regionLabel : 'State'} *</label><select required value={form.task_state} onChange={e => set('task_state', e.target.value)} className="input"><option value="">Select state</option>{REGIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                    </div>
                    <div><label className="label">{intl && mk.postcodeLabel ? `Address and ${mk.postcodeLabel.toLowerCase()}` : 'Full Address / Landmark'}</label><input placeholder={intl ? 'Street, building or landmark' : 'More specific location details...'} value={form.task_full_address} onChange={e => set('task_full_address', e.target.value)} className="input" /></div>
                  </div>}
                </div>
              )}

              {/* STEP 2: Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }} className="flex items-center gap-2">
                    <List size={20} className="text-rose-500" /> Describe your task
                  </h2>
                  <div>
                    <label className="label">Task Title *</label>
                    <input required minLength={5} maxLength={100} placeholder={remote ? 'e.g. Tidy up and format a 40 row spreadsheet' : intl ? 'e.g. Assemble a wardrobe and a chest of drawers' : 'e.g. Pick up my laptop from Surulere and bring to Lekki'} value={form.title} onChange={e => set('title', e.target.value)} className="input" />
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{form.title.length}/100</p>
                  </div>
                  <div>
                    <label className="label">Full Description *</label>
                    <textarea required rows={5} minLength={10}
                      placeholder={intl || remote ? 'Describe exactly what needs to be done, what is included, any tools needed and when you are free.' : `Describe exactly what needs to be done.\n\nExample: My laptop charger is at 14 Adeola Street, Surulere. The gateman (Mr. Bello) will hand it over. Bring to 3rd Floor, ABC Building, Lekki Phase 1.`}
                      value={form.description} onChange={e => set('description', e.target.value)} className="input resize-none" />
                  </div>
                  <div>
                    <label className="label">Tags <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional, comma-separated)</span></label>
                    <input placeholder="e.g. urgent, electronics, daytime" value={form.tags} onChange={e => set('tags', e.target.value)} className="input" />
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                          <ShoppingCart size={14} /> Does this task involve buying an item?
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Enable the equipment purchase and escrow flow</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => set('is_equipment_required', !form.is_equipment_required)}
                        className="toggle on-light"
                        data-on={String(form.is_equipment_required)}
                        aria-label="Toggle equipment required"
                      />
                    </div>
                    {form.is_equipment_required && (
                      <div className="mt-3">
                        <label className="label">Describe the item to purchase</label>
                        <textarea rows={2} placeholder={intl ? 'e.g. Paint and brushes from the local DIY shop' : 'e.g. Nexus 3-phase stabilizer, available at Alaba market'} value={form.equipment_description} onChange={e => set('equipment_description', e.target.value)} className="input resize-none mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Costs & Deadline */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }} className="flex items-center gap-2">
                    <DollarSign size={20} className="text-rose-500" /> Costs & Timeline
                  </h2>
                  <div>
                    <label className="label flex items-center gap-2"><Clock size={14} /> Task Deadline *</label>
                    <input type="datetime-local" required value={form.deadline} min={new Date().toISOString().slice(0, 16)} onChange={e => set('deadline', e.target.value)} className="input" />
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>When do you need this done by?</p>
                  </div>
                  <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Task costs</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Break the price into its parts. Taskers see one total, and you pay that total into escrow once you choose a tasker.</p>
                    <CostFields value={form} onChange={(next) => setForm(f => ({ ...f, ...next }))} />
                  </div>
                </div>
              )}

              {/* STEP 4: Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }} className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-rose-500" /> Review & Post
                  </h2>
                  <div className="space-y-2">
                    {[
                      ['Task Type', remote ? 'Remote (online)' : selectedType?.title || 'Not set'],
                      ['Title', form.title || 'Not set'],
                      ['Location', remote ? `Remote${form.task_state ? `, prefers ${form.task_state}` : ''}` : [form.task_city, form.task_state].filter(Boolean).join(', ') || 'Not set'],
                      ['Deadline', form.deadline ? new Date(form.deadline).toLocaleString(mk.locale, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'],
                      ['Workmanship', naira(costNumber(form.cost_workmanship))],
                      ...(costNumber(form.cost_transport) ? [['Transportation', naira(costNumber(form.cost_transport))]] : []),
                      ...(costNumber(form.cost_waybill) ? [['Waybill', naira(costNumber(form.cost_waybill))]] : []),
                      ...(costNumber(form.cost_items) ? [['Items or equipment', naira(costNumber(form.cost_items))]] : []),
                      ['Total price', naira(costTotal(form))],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
                        <span className="text-sm font-semibold w-28 flex-shrink-0" style={{ color: 'var(--muted)' }}>{label}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
                      </div>
                    ))}
                    {form.description && (
                      <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Description</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{form.description}</p>
                      </div>
                    )}
                  </div>
                  {!isAuthenticated && (
                    <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'var(--rose-light)', border: '1px solid rgba(255,45,98,0.2)' }}>
                      <Lock size={16} style={{ color: 'var(--rose)', flexShrink: 0 }} />
                      <p className="text-sm" style={{ color: 'var(--rose-dark)' }}>
                        <strong>One more step:</strong> You'll sign in or create a free account to publish this task.
                      </p>
                    </div>
                  )}
                  {form.task_city && !remote && (
                    <div className="p-3 rounded-xl text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                      Once posted, verified taskers in <strong>{form.task_city}</strong> will be notified and can bid. You can edit or cancel before accepting a bid.
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border-light)' }}>
                {step > 0 ? (
                  <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-2">
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <Link to={cpath("/tasks")} className="btn-ghost flex items-center gap-2"><ArrowLeft size={16} /> Cancel</Link>
                )}
                <button onClick={handleContinue} disabled={!canProceed() || loading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  {step < STEPS.length - 1
                    ? <>Continue <ArrowRight size={16} /></>
                    : loading ? 'Posting…'
                    : !isAuthenticated ? <><Lock size={15} /> Sign In & Post</>
                    : <><Zap size={16} /> Post Task</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
