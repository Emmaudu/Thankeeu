import { useState, useEffect } from 'react';
import SEO from '../../components/seo/SEO';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, X, Upload, Info , Check } from 'lucide-react';
import { teamsApi, enterpriseApi } from '../../utils/api';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

const STEPS = ['Task Type & Price', 'Deployment', 'Description', 'Schedule & Approval', 'Review'];

export default function PostEnterpriseTask() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [taskTypes, setTaskTypes] = useState([]);
  const [member, setMember] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [form, setForm] = useState({
    task_type_id: '',
    custom_task_type: '',
    base_price: 0,
    adjustment_type: 'none',
    adjustment_value: '',
    adjusted_price: 0,
    title: '',
    description: '',
    attachments: [],
    state_deployments: [{ state: '', region: '', people_needed: 1, full_address: '', task_type_override: '', notes: '' }],
    commence_date: '',
    duration_days: 1,
    sla_hours: 24,
    line_manager_name: '',
    line_manager_email: '',
    member_department: '',
    member_role: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ttRes, memRes] = await Promise.all([teamsApi.getTaskTypes(), teamsApi.getMemberProfile()]);
        setTaskTypes(ttRes.data.task_types || []);
        setMember(memRes.data.member);
        set('member_department', memRes.data.member?.member_department || memRes.data.member?.department?.name || '');
        set('member_role', memRes.data.member?.job_role || '');

        if (memRes.data.member?.company_id) {
          const walRes = await teamsApi.getWallet(memRes.data.member.company_id);
          setWallet(walRes.data.wallet);
        }
      } catch {}
    };
    loadData();
  }, []);

  const selectedType = taskTypes.find(t => t.id === form.task_type_id);

  // Calculate adjusted price
  const calcAdjusted = (base, adjType, adjVal) => {
    const val = parseFloat(adjVal) || 0;
    const b = parseFloat(base) || 0;
    switch (adjType) {
      case 'add':      return b + val;
      case 'subtract': return Math.max(0, b - val);
      case 'multiply': return b * (val || 1);
      case 'divide':   return val > 0 ? b / val : b;
      default:         return b;
    }
  };

  const handleTypeSelect = (type) => {
    const adj = calcAdjusted(type.base_price, form.adjustment_type, form.adjustment_value);
    set('task_type_id', type.id);
    set('base_price', type.base_price);
    set('adjusted_price', adj);
    if (!form.title) set('title', type.name);
  };

  const handleAdjustment = (adjType, adjVal) => {
    set('adjustment_type', adjType);
    set('adjustment_value', adjVal);
    const adj = calcAdjusted(form.base_price, adjType, adjVal);
    set('adjusted_price', adj);
  };

  // Apply bulk adjustment to all deployments simultaneously
  const applyBulkAdjustment = (adjType, adjVal) => {
    handleAdjustment(adjType, adjVal);
    // Also update adjusted_price for display
  };

  // State deployments
  const addDeployment = () => set('state_deployments', [...form.state_deployments, { state:'', region:'', people_needed:1, full_address:'', task_type_override:'', notes:'' }]);
  const removeDeployment = (i) => set('state_deployments', form.state_deployments.filter((_, idx) => idx !== i));
  const setDeploy = (i, k, v) => {
    const arr = [...form.state_deployments];
    arr[i] = { ...arr[i], [k]: v };
    set('state_deployments', arr);
  };

  const totalPeople = form.state_deployments.reduce((s, d) => s + (parseInt(d.people_needed) || 1), 0);
  const totalCost = (form.adjusted_price || form.base_price) * totalPeople;

  const canProceed = () => {
    if (step === 0) return form.task_type_id || form.custom_task_type;
    if (step === 1) return form.state_deployments.every(d => d.state);
    if (step === 2) return form.title?.length >= 5 && form.description?.length >= 10;
    if (step === 3) return form.commence_date && form.line_manager_name && form.line_manager_email;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        base_price_per_person: form.base_price,
        adjusted_price_per_person: form.adjusted_price || form.base_price,
        custom_task_type: !form.task_type_id ? form.custom_task_type : null,
      };
      const { data } = await enterpriseApi.createTask(payload);
      toast.success('Task submitted for line manager approval!');
      navigate('/teams/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  const categories = ['All', ...new Set(taskTypes.map(t => t.category))];
  const [activeCat, setActiveCat] = useState('All');
  const filteredTypes = activeCat === 'All' ? taskTypes : taskTypes.filter(t => t.category === activeCat);

  return (
    <div className="pt-20 min-h-screen bg-surface pb-16">
      <div className="container-xl py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-dark">Post Enterprise Task</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted">
            {member && <><span>{member.company?.company_name}</span><span>·</span><span>{member.job_role}</span></>}
            {wallet && <><span>·</span><span className={clsx('font-semibold', parseFloat(wallet.available_balance) < totalCost ? 'text-red-500' : 'text-rose-600')}>
              Wallet: ₦{Number(wallet.available_balance || 0).toLocaleString()}
            </span></>}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                i < step ? 'bg-rose-500 text-white' : i === step ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-gray-200 text-gray-500')}>
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs"
                  style={{ borderColor: i <= step ? 'rgba(255,255,255,0.7)' : 'rgba(107,114,128,0.5)' }}>
                  {i < step ? <Check size={14} /> : i + 1}
                </span>
                {label}
              </div>
              {i < STEPS.length - 1 && <div className={clsx('w-6 h-px mx-1', i < step ? 'bg-rose-400' : 'bg-gray-300')} />}
            </div>
          ))}
        </div>

        <div className="card p-6 md:p-8">

          {/* ── STEP 0: Task Type & Price ──────────────────────── */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading font-bold text-xl text-dark">Select Task Type & Set Price</h2>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCat(cat)}
                    className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                      activeCat === cat ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200')}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Task type grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {filteredTypes.map(t => (
                  <button key={t.id} onClick={() => handleTypeSelect(t)}
                    className={clsx('p-3 rounded-2xl border-2 text-left transition-all',
                      form.task_type_id === t.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                    <p className={clsx('font-semibold text-xs leading-tight', form.task_type_id === t.id ? 'text-rose-700' : 'text-gray-800')}>{t.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-muted">{t.category}</span>
                      <span className={clsx('text-xs font-bold', form.task_type_id === t.id ? 'text-rose-600' : 'text-gray-700')}>
                        ₦{Number(t.base_price).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
                {/* Custom type option */}
                <button onClick={() => { set('task_type_id', ''); set('custom_task_type', 'Custom Task'); }}
                  className={clsx('p-3 rounded-2xl border-2 text-left transition-all',
                    !form.task_type_id && form.custom_task_type ? 'border-rose-500 bg-rose-50' : 'border-dashed border-gray-300 hover:border-rose-300')}>
                  <p className="font-semibold text-xs text-rose-600">Custom Task Type</p>
                  <p className="text-xs text-muted mt-1">Not in the list? Define your own</p>
                </button>
              </div>

              {/* Custom task type input */}
              {!form.task_type_id && (
                <div>
                  <label className="label">Custom Task Type Name *</label>
                  <input value={form.custom_task_type} onChange={e => set('custom_task_type', e.target.value)} placeholder="e.g. Smart Meter Installation Verification" className="input"/>
                </div>
              )}

              {/* Price adjustment */}
              {(form.task_type_id || form.custom_task_type) && (
                <div className="p-4 bg-surface rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold text-sm text-gray-800">Price Adjustment (Bulk — applies to all states)</p>
                    {form.task_type_id && (
                      <span className="text-xs text-muted">Base: ₦{Number(form.base_price).toLocaleString()}/person</span>
                    )}
                  </div>

                  {!form.task_type_id && (
                    <div>
                      <label className="label">Base Price per Person (₦) *</label>
                      <input type="number" min={1000} value={form.base_price}
                        onChange={e => { set('base_price', parseFloat(e.target.value) || 0); set('adjusted_price', parseFloat(e.target.value) || 0); }}
                        placeholder="Enter base price" className="input"/>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Adjustment Type</label>
                      <select value={form.adjustment_type} onChange={e => applyBulkAdjustment(e.target.value, form.adjustment_value)} className="input">
                        <option value="none">No adjustment</option>
                        <option value="add">Add fixed amount</option>
                        <option value="subtract">Subtract fixed amount</option>
                        <option value="multiply">Multiply by factor</option>
                        <option value="divide">Divide by factor</option>
                      </select>
                    </div>
                    {form.adjustment_type !== 'none' && (
                      <div>
                        <label className="label">{form.adjustment_type === 'multiply' || form.adjustment_type === 'divide' ? 'Factor' : 'Amount (₦)'}</label>
                        <input type="number" min={0} step="0.01" value={form.adjustment_value}
                          onChange={e => applyBulkAdjustment(form.adjustment_type, e.target.value)}
                          placeholder={form.adjustment_type === 'multiply' ? 'e.g. 1.5' : 'e.g. 2000'} className="input"/>
                      </div>
                    )}
                  </div>

                  {/* Price preview */}
                  <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="text-sm text-rose-700 font-medium">Adjusted Price per Person</span>
                    <span className="font-heading font-bold text-rose-700 text-lg">
                      ₦{Number(form.adjusted_price || form.base_price).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: State Deployments ──────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl text-dark">State Deployments</h2>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">Total: <span className="text-rose-600">{totalPeople} people · ₦{Number(totalCost).toLocaleString()}</span></p>
                </div>
              </div>

              {form.state_deployments.map((dep, i) => (
                <div key={i} className="p-4 bg-surface rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-700">Deployment {i + 1}</p>
                    {form.state_deployments.length > 1 && (
                      <button onClick={() => removeDeployment(i)} className="text-red-400 hover:text-red-600">
                        <X size={16}/>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">State *</label>
                      <select required value={dep.state} onChange={e => setDeploy(i, 'state', e.target.value)} className="input">
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Region / LGA</label>
                      <input value={dep.region} onChange={e => setDeploy(i, 'region', e.target.value)} placeholder="e.g. Ikeja" className="input"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">People Needed *</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setDeploy(i, 'people_needed', Math.max(1, (dep.people_needed||1)-1))}
                          className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700">−</button>
                        <input type="number" min={1} value={dep.people_needed}
                          onChange={e => setDeploy(i, 'people_needed', parseInt(e.target.value)||1)}
                          className="input text-center w-20 py-2"/>
                        <button type="button" onClick={() => setDeploy(i, 'people_needed', (dep.people_needed||1)+1)}
                          className="w-9 h-9 rounded-lg bg-rose-100 hover:bg-rose-200 flex items-center justify-center font-bold text-rose-700">+</button>
                      </div>
                      <p className="text-xs text-muted mt-1">Cost: ₦{Number((form.adjusted_price||form.base_price)*(dep.people_needed||1)).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="label">Task Type Override</label>
                      <select value={dep.task_type_override} onChange={e => setDeploy(i, 'task_type_override', e.target.value)} className="input">
                        <option value="">Same as main task</option>
                        {taskTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Full Address / Landmark</label>
                    <input value={dep.full_address} onChange={e => setDeploy(i, 'full_address', e.target.value)} placeholder="e.g. 14 Broad Street, Marina, Lagos" className="input"/>
                  </div>
                  <div>
                    <label className="label">Additional Notes for Tasker</label>
                    <input value={dep.notes} onChange={e => setDeploy(i, 'notes', e.target.value)} placeholder="e.g. Call the site manager on arrival" className="input"/>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addDeployment} className="w-full py-3 border-2 border-dashed border-rose-200 rounded-2xl text-rose-600 font-semibold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={16}/> Add Another State / Region
              </button>

              {/* Cost summary */}
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-800">Total Estimated Cost</span>
                  <span className="font-heading font-bold text-2xl text-rose-700">₦{Number(totalCost).toLocaleString()}</span>
                </div>
                <p className="text-xs text-rose-600 mt-1">{totalPeople} person(s) × ₦{Number(form.adjusted_price||form.base_price).toLocaleString()}/person</p>
                {wallet && parseFloat(wallet.available_balance) < totalCost && (
                  <p className="text-xs text-red-600 mt-2 font-semibold">Insufficient wallet balance. Available: ₦{Number(wallet.available_balance||0).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Description ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading font-bold text-xl text-dark">Task Details</h2>
              <div>
                <label className="label">Task Title *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Q1 Merchant KYC Verification — Lagos Network" className="input"/>
              </div>
              <div>
                <label className="label">Department & Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.member_department} onChange={e => set('member_department', e.target.value)} placeholder="Department" className="input"/>
                  <input value={form.member_role} onChange={e => set('member_role', e.target.value)} placeholder="Your Role" className="input"/>
                </div>
              </div>
              <div>
                <label className="label">Detailed Description * <span className="text-muted font-normal">(be specific — taskers will use this as their brief)</span></label>
                <textarea required rows={6} value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe exactly what needs to be done at each location. Include entry requirements, what to verify, what photos to take, who to contact, etc."
                  className="input resize-none"/>
              </div>
              <div>
                <label className="label">Attachments (optional) — briefing docs, templates, sample photos</label>
                <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors">
                  <input type="file" multiple accept="image/*,application/pdf,.doc,.docx" className="hidden"
                    onChange={e => set('attachments', Array.from(e.target.files).map(f => f.name))}/>
                  <Upload size={16} className="text-rose-500"/>
                  <span className="text-sm text-gray-500">Upload attachments (PDF, images, Word)</span>
                </label>
              </div>
              <div>
                <label className="label">⏱️ SLA (hours to complete after acceptance)</label>
                <select value={form.sla_hours} onChange={e => set('sla_hours', parseInt(e.target.value))} className="input">
                  {[4, 8, 12, 24, 48, 72].map(h => <option key={h} value={h}>{h} hours</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 3: Schedule & Approval ───────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-heading font-bold text-xl text-dark">Schedule & Approval</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Commencement Date & Time *</label>
                  <input required type="datetime-local" value={form.commence_date}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={e => set('commence_date', e.target.value)} className="input"/>
                </div>
                <div>
                  <label className="label">Duration (days) *</label>
                  <input type="number" min={1} max={30} value={form.duration_days}
                    onChange={e => set('duration_days', parseInt(e.target.value)||1)} className="input"/>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <p className="text-sm text-amber-800 font-medium">Line Manager Approval Required</p>
                </div>
                <p className="text-xs text-amber-700">Before this task goes live, your line manager must approve it. They will receive an email notification immediately.</p>
                <div>
                  <label className="label">Line Manager Full Name *</label>
                  <input required value={form.line_manager_name} onChange={e => set('line_manager_name', e.target.value)} placeholder="Adewale Ogundimu" className="input"/>
                </div>
                <div>
                  <label className="label">Line Manager Email *</label>
                  <input required type="email" value={form.line_manager_email} onChange={e => set('line_manager_email', e.target.value)}
                    placeholder="manager@yourcompany.com" className="input"/>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review ────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-heading font-bold text-xl text-dark">Review & Submit</h2>
              <div className="space-y-3">
                {[
                  { label: 'Task Type', value: selectedType?.name || form.custom_task_type || '—' },
                  { label: 'Title', value: form.title },
                  { label: 'Price per Person', value: `₦${Number(form.adjusted_price||form.base_price).toLocaleString()}` },
                  { label: 'Total People', value: totalPeople.toString() },
                  { label: 'Total Cost', value: `₦${Number(totalCost).toLocaleString()}` },
                  { label: 'States', value: form.state_deployments.filter(d=>d.state).map(d=>`${d.state} (${d.people_needed})`).join(', ') },
                  { label: 'Commencement', value: form.commence_date ? new Date(form.commence_date).toLocaleString('en-NG') : '—' },
                  { label: 'Duration', value: `${form.duration_days} day(s)` },
                  { label: 'SLA', value: `${form.sla_hours} hours` },
                  { label: 'Line Manager', value: `${form.line_manager_name} (${form.line_manager_email})` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-surface rounded-xl">
                    <span className="text-xs font-semibold text-gray-500 w-36 flex-shrink-0">{label}</span>
                    <span className="text-sm text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700">
                After submission, your line manager will receive an email to approve this task. Once approved, it goes live for taskers in the selected states to bid on.
                ₦{Number(totalCost).toLocaleString()} will be reserved from your wallet/department budget.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-ghost">← Back</button>
            ) : (
              <button onClick={() => navigate('/teams/dashboard')} className="btn-ghost">← Cancel</button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="btn-primary disabled:opacity-50">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || (wallet && parseFloat(wallet.available_balance) < totalCost)} className="btn-primary btn-lg disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
