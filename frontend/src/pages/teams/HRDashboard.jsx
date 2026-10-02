import { useState, useEffect } from 'react';
import SEO from '../../components/seo/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Users, LayoutDashboard, CreditCard, ClipboardList, Shield, BarChart3, Settings, LogOut, Plus, Eye, Check, X, Ban, ChevronRight, Bell, Wallet, Briefcase, CheckCircle, FolderOpen, KeyRound, Zap, Lock } from 'lucide-react';
import FileHistory from '../../components/ui/FileHistory';
import { certificationsApi } from '../../utils/api';
import { teamsApi, enterpriseApi } from '../../utils/api';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const PERMISSIONS = ['approve_members','manage_wallet','manage_departments','approve_tasks','view_all_tasks','manage_subscriptions'];

function Sidebar({ active, setActive, company, pendingCount, leaderPendingCount }) {
  const navigate = useNavigate();
  const nav = [
    { id:'overview',    Icon:BarChart3, label:'Overview' },
    { id:'members',     Icon:Users, label:'Team Members', badge: pendingCount },
    { id:'leaders',     Icon:Briefcase, label:'Leader Rights', badge: leaderPendingCount },
    { id:'departments', Icon:Building2, label:'Departments' },
    { id:'tasks',       Icon:ClipboardList, label:'All Tasks' },
    { id:'approvals',   Icon:CheckCircle, label:'Pending Approvals' },
    { id:'wallet',      Icon:CreditCard, label:'Task Wallet' },
    { id:'file-history',Icon:FolderOpen, label:'File History' },
    { id:'subscription',Icon:KeyRound, label:'Subscription' },
  ];
  const logout = () => {
    localStorage.removeItem('taskeeu_token');
    localStorage.removeItem('teams_member');
    localStorage.removeItem('teams_company');
    navigate('/teams');
  };
  return (
    <div className="w-full md:w-60 flex-shrink-0 space-y-3">
      {company && (
        <div className="card p-4">
          <div className="flex items-center gap-3">
            {company.company_logo_url
              ? <img src={company.company_logo_url} alt="" className="w-10 h-10 rounded-xl object-cover"/>
              : <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">{company.company_name?.[0]}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{company.company_name}</p>
              <p className="text-xs text-muted">@{company.company_domain}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={clsx('badge text-xs', company.subscription_status === 'active' ? 'badge-green' : 'badge-red')}>
              {company.subscription_status === 'active' ? 'Active' : '' + company.subscription_status}
            </span>
            <span className="badge-blue text-xs">HR Admin</span>
          </div>
        </div>
      )}
      <div className="card p-3 space-y-1">
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className={clsx('sidebar-link w-full text-left', active === item.id && 'active')}>
            <item.Icon size={16} />
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{item.badge}</span>}
          </button>
        ))}
        <hr className="my-1 border-gray-100"/>
        <button onClick={logout} className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={16}/><span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function Overview({ company, stats, wallet, recentTasks, onTabChange }) {
  const kpis = [
    { Icon:Users, label:'Total Members', value: stats.total_members || 0, color:'text-blue-600', bg:'bg-blue-50' },
    { Icon:ClipboardList, label:'Total Tasks', value: stats.total_tasks || 0, color:'text-purple-600', bg:'bg-purple-50' },
    { Icon:Zap, label:'Ongoing Tasks', value: stats.ongoing_tasks || 0, color:'text-amber-600', bg:'bg-amber-50' },
    { Icon:CreditCard, label:'Wallet Balance', value: `₦${Number(wallet?.available_balance||0).toLocaleString()}`, color:'text-green-600', bg:'bg-green-50' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(s => (
          <div key={s.label} className="card p-5">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3', s.bg)}><s.Icon size={16} /></div>
            <p className={clsx('font-heading font-bold text-2xl', s.color)}>{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {stats.pending_members > 0 && (
        <div className="card p-5 border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-amber-800">{stats.pending_members} member(s) awaiting approval</p>
            <button onClick={() => onTabChange('members')} className="text-sm text-rose-600 hover:underline">Review →</button>
          </div>
        </div>
      )}
      {stats.leader_pending > 0 && (
        <div className="card p-5 border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-blue-800">{stats.leader_pending} Team Leader(s) awaiting rights approval</p>
            <button onClick={() => onTabChange('leaders')} className="text-sm text-rose-600 hover:underline">Grant Rights →</button>
          </div>
        </div>
      )}
      {stats.pending_tasks > 0 && (
        <div className="card p-5 border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-blue-800">{stats.pending_tasks} task(s) pending line manager approval</p>
            <button onClick={() => onTabChange('approvals')} className="text-sm text-rose-600 hover:underline">Review →</button>
          </div>
        </div>
      )}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold">Recent Tasks</h3>
          <button onClick={() => onTabChange('tasks')} className="text-sm text-rose-600 hover:underline">View all →</button>
        </div>
        <div className="space-y-3">
          {recentTasks?.slice(0,5).map(t => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                <p className="text-xs text-muted">{t.member?.first_name} {t.member?.last_name} · {formatDistanceToNow(new Date(t.created_at), {addSuffix:true})}</p>
              </div>
              <span className={clsx('badge text-xs capitalize',
                t.status==='live'?'badge-green':t.status==='ongoing'?'badge-blue':t.status==='completed'?'badge-gray':t.status==='pending_approval'?'badge-yellow':'badge-red')}>
                {t.status.replace('_',' ')}
              </span>
            </div>
          ))}
          {(!recentTasks || recentTasks.length === 0) && <p className="text-muted text-sm text-center py-4">No tasks yet</p>}
        </div>
      </div>
    </div>
  );
}

function MembersPanel({ company }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [permModal, setPermModal] = useState(null);
  const [depts, setDepts] = useState([]);
  const [approveForm, setApproveForm] = useState({ permission_level:'member', department_id:'' });
  const [selectedPerms, setSelectedPerms] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        teamsApi.getCompanyMembers(company.id, { status: filter }),
        teamsApi.getDepartments(company.id),
      ]);
      setMembers(mRes.data.members || []);
      setDepts(dRes.data.departments || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (company?.id) load(); }, [company?.id, filter]);

  const approve = async (memberId) => {
    try {
      await teamsApi.approveMember(company.id, memberId, approveForm);
      toast.success('Member approved!');
      load();
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const action = async (memberId, act) => {
    try {
      await teamsApi.memberAction(company.id, memberId, { action: act });
      toast.success(`Member ${act}d`);
      load();
    } catch { toast.error('Failed'); }
  };

  const savePermissions = async (memberId) => {
    try {
      await teamsApi.setPermissions(company.id, memberId, { permissions: selectedPerms, permission_level: approveForm.permission_level });
      toast.success('Permissions updated!');
      setPermModal(null);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['pending','active','suspended','removed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors border',
              filter===s?'bg-rose-500 text-white border-rose-500':'bg-white text-gray-600 border-gray-200')}>
            {s}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <div className="p-8 text-center text-muted">Loading...</div> :
         members.length === 0 ? <div className="p-8 text-center text-muted"><p className="text-3xl mb-2"></p>No {filter} members</div> :
         members.map(m => (
          <div key={m.id} className={clsx('flex items-center gap-4 p-4 border-b border-gray-50 last:border-0', selected?.id===m.id && 'bg-rose-50')}>
            <div className="w-10 h-10 rounded-xl bg-rose-100 overflow-hidden flex-shrink-0">
              {m.user?.avatar_url ? <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover"/> :
               <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">{m.first_name?.[0]}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800">{m.first_name} {m.last_name}</p>
              <p className="text-xs text-muted truncate">{m.work_email} · {m.job_role}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx('badge text-xs capitalize',
                  m.permission_level==='hr'?'badge-red':m.permission_level==='dept_leader'?'badge-blue':m.permission_level==='finance'?'badge-yellow':'badge-gray')}>
                  {m.permission_level}
                </span>
                {m.department && <span className="badge-gray text-xs">{m.department.name}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {m.status === 'pending' && (
                <>
                  <button onClick={() => setSelected(selected?.id===m.id?null:m)} className="btn-primary btn-sm text-xs">Review</button>
                </>
              )}
              {m.status === 'active' && (
                <>
                  <button onClick={() => { setPermModal(m); setSelectedPerms([]); setApproveForm(f=>({...f, permission_level: m.permission_level})); }} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">Perms</button>
                  <button onClick={() => action(m.id,'suspend')} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs hover:bg-amber-100">Suspend</button>
                  <button onClick={() => action(m.id,'remove')} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">Remove</button>
                </>
              )}
              {m.status === 'suspended' && (
                <button onClick={() => action(m.id,'activate')} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs hover:bg-green-100">Reactivate</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Approve panel */}
      {selected && (
        <div className="card p-5 border-l-4 border-rose-500 animate-fade-in space-y-4">
          <h3 className="font-semibold text-gray-800">Approve: {selected.first_name} {selected.last_name}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Permission Level</label>
              <select value={approveForm.permission_level} onChange={e => setApproveForm(f=>({...f,permission_level:e.target.value}))} className="input">
                <option value="member">Member</option>
                <option value="dept_leader">Dept Leader</option>
                <option value="finance">Finance</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select value={approveForm.department_id} onChange={e => setApproveForm(f=>({...f,department_id:e.target.value}))} className="input">
                <option value="">Unassigned</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(selected.id)} className="btn-primary btn-sm">Approve</button>
            <button onClick={() => setSelected(null)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {permModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
            <h3 className="font-heading font-bold text-lg mb-4">{permModal.first_name}'s Permissions</h3>
            <div className="mb-4">
              <label className="label">Permission Level</label>
              <select value={approveForm.permission_level} onChange={e => setApproveForm(f=>({...f,permission_level:e.target.value}))} className="input">
                <option value="member">Member</option><option value="dept_leader">Dept Leader</option>
                <option value="finance">Finance</option><option value="hr">HR</option>
              </select>
            </div>
            <div className="space-y-2 mb-5">
              <label className="label">Specific Permissions</label>
              {PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedPerms.includes(p)} onChange={e => setSelectedPerms(prev => e.target.checked ? [...prev,p] : prev.filter(x=>x!==p))} className="rounded"/>
                  <span className="text-sm text-gray-700 capitalize">{p.replace(/_/g,' ')}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => savePermissions(permModal.id)} className="btn-primary btn-sm flex-1">Save</button>
              <button onClick={() => setPermModal(null)} className="btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentsPanel({ company }) {
  const [depts, setDepts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', leader_member_id:'', budget_allocated:'' });
  const load = async () => {
    setLoading(true);
    try {
      const [dRes, mRes] = await Promise.all([teamsApi.getDepartments(company.id), teamsApi.getCompanyMembers(company.id, {status:'active'})]);
      setDepts(dRes.data.departments || []);
      setMembers(mRes.data.members || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (company?.id) load(); }, [company?.id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await teamsApi.createDepartment(company.id, form);
      toast.success('Department created!');
      setShowForm(false);
      setForm({ name:'', description:'', leader_member_id:'', budget_allocated:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-gray-800">Departments</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm flex items-center gap-1"><Plus size={14}/> Add Department</button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="card p-5 animate-fade-in space-y-3">
          <h4 className="font-semibold text-gray-800">New Department</h4>
          <div><label className="label">Name *</label><input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Field Operations" className="input"/></div>
          <div><label className="label">Description</label><input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Optional" className="input"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Dept Leader</label>
              <select value={form.leader_member_id} onChange={e => setForm(f=>({...f,leader_member_id:e.target.value}))} className="input">
                <option value="">No leader yet</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>
            <div><label className="label">Budget (₦)</label><input type="number" min={0} value={form.budget_allocated} onChange={e => setForm(f=>({...f,budget_allocated:e.target.value}))} placeholder="0" className="input"/></div>
          </div>
          <div className="flex gap-2"><button type="submit" className="btn-primary btn-sm">Create</button><button type="button" onClick={() => setShowForm(false)} className="btn-ghost btn-sm">Cancel</button></div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p className="text-muted text-sm">Loading...</p> :
         depts.length === 0 ? <div className="col-span-2 empty-state py-8"><Building2 size={34} className="text-gray-300 mb-2 mx-auto" /><p className="text-muted">No departments yet. Create your first one.</p></div> :
         depts.map(d => (
          <div key={d.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div><h4 className="font-heading font-bold text-gray-900">{d.name}</h4>{d.description && <p className="text-xs text-muted mt-0.5">{d.description}</p>}</div>
            </div>
            {d.leader && <p className="text-xs text-muted mb-2">Leader: {d.leader.first_name} {d.leader.last_name}</p>}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100 text-sm">
              <div><p className="text-xs text-muted">Budget Allocated</p><p className="font-bold text-gray-800">₦{Number(d.budget_allocated||0).toLocaleString()}</p></div>
              <div><p className="text-xs text-muted">Budget Spent</p><p className="font-bold text-red-500">₦{Number(d.budget_spent||0).toLocaleString()}</p></div>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, d.budget_allocated > 0 ? (d.budget_spent/d.budget_allocated)*100 : 0)}%` }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletPanel({ company, wallet, onRefresh }) {
  const [depts, setDepts] = useState([]);
  const [topupAmt, setTopupAmt] = useState('');
  const [allocForm, setAllocForm] = useState({ department_id:'', amount:'', use_general_purse: wallet?.use_general_purse ?? true });
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    teamsApi.getDepartments(company.id).then(r => setDepts(r.data.departments||[])).catch(()=>{});
    teamsApi.getWallet(company.id).then(r => setTxns(r.data.transactions||[])).catch(()=>{});
  }, [company?.id]);

  const handleTopup = async () => {
    if (!topupAmt || isNaN(topupAmt)) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const { data } = await teamsApi.topupWallet(company.id, { amount: parseFloat(topupAmt) });
      window.open(data.authorization_url, '_blank');
      toast.success('Redirecting to Flutterwave...');
      setTopupAmt('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleAllocate = async () => {
    try {
      await teamsApi.allocateBudget(company.id, allocForm);
      toast.success('Budget allocated!');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { Icon:Wallet, label:'Total Balance', value: `₦${Number(wallet?.total_balance||0).toLocaleString()}`, color:'text-green-600', bg:'bg-green-50' },
          { Icon:Lock, label:'Reserved', value: `₦${Number(wallet?.reserved_balance||0).toLocaleString()}`, color:'text-amber-600', bg:'bg-amber-50' },
          { Icon:CheckCircle, label:'Available', value: `₦${Number(wallet?.available_balance||0).toLocaleString()}`, color:'text-rose-600', bg:'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3', s.bg)}><s.Icon size={16} /></div>
            <p className={clsx('font-heading font-bold text-2xl', s.color)}>{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top up */}
      <div className="card p-5">
        <h3 className="font-heading font-semibold mb-4">Fund Wallet via Flutterwave</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-semibold">₦</span>
              <input type="number" min={1000} value={topupAmt} onChange={e => setTopupAmt(e.target.value)} placeholder="Enter amount (min ₦1,000)" className="input pl-8"/>
            </div>
          </div>
          <button onClick={handleTopup} disabled={loading} className="btn-primary">
            {loading ? '...' : 'Top Up'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[50000,100000,200000,500000].map(amt => (
            <button key={amt} onClick={() => setTopupAmt(amt.toString())}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors font-medium">
              ₦{Number(amt).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Budget mode + allocation */}
      <div className="card p-5">
        <h3 className="font-heading font-semibold mb-4">Budget Allocation</h3>
        <div className="flex items-center justify-between p-3 bg-surface rounded-xl mb-4">
          <div>
            <p className="font-semibold text-sm text-gray-800">Use General Purse</p>
            <p className="text-xs text-muted">All departments share one wallet</p>
          </div>
          <button
            onClick={() => setAllocForm(f => ({...f, use_general_purse: !f.use_general_purse}))}
            className="toggle on-light"
            data-on={String(allocForm.use_general_purse)}
            aria-label="Toggle general purse"
          />
        </div>
        {!allocForm.use_general_purse && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Allocate funds from general wallet to a specific department:</p>
            <div className="grid grid-cols-2 gap-3">
              <select value={allocForm.department_id} onChange={e => setAllocForm(f=>({...f,department_id:e.target.value}))} className="input">
                <option value="">Select department</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-semibold">₦</span>
                <input type="number" min={0} value={allocForm.amount} onChange={e => setAllocForm(f=>({...f,amount:e.target.value}))} placeholder="Amount" className="input pl-8"/>
              </div>
            </div>
            <button onClick={handleAllocate} className="btn-primary btn-sm">Allocate to Department</button>
          </div>
        )}
        <button onClick={() => teamsApi.allocateBudget(company.id, { use_general_purse: allocForm.use_general_purse }).then(() => { toast.success('Updated!'); onRefresh(); })} className="btn-outline btn-sm mt-3">
          Save Budget Mode
        </button>
      </div>

      {/* Transaction history */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100"><h3 className="font-heading font-semibold">Wallet Transactions</h3></div>
        {txns.length === 0 ? <div className="p-6 text-center text-muted text-sm">No transactions yet</div> :
         txns.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-4 border-b border-gray-50 last:border-0">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-base', t.transaction_type==='topup'?'bg-green-50':'bg-amber-50')}>
              
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 capitalize">{t.transaction_type.replace(/_/g,' ')}</p>
              <p className="text-xs text-muted truncate">{t.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={clsx('font-semibold text-sm', t.transaction_type==='topup'?'text-green-600':'text-amber-600')}>
                {t.transaction_type==='topup'?'+':'-'}₦{Number(t.amount).toLocaleString()}
              </p>
              <p className="text-xs text-muted">{(t.created_at ? format(new Date(t.created_at), 'MMM d') : '—')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksPanel({ tasks, isApprovals }) {
  const [actionLoading, setActionLoading] = useState(null);
  const displayed = isApprovals ? tasks.filter(t => t.status === 'pending_approval') : tasks;

  const handleApprove = async (taskId, approved) => {
    setActionLoading(taskId);
    try {
      await enterpriseApi.approveLine(taskId, { approved, notes: approved ? '' : 'Rejected by HR' });
      toast.success(approved ? 'Task approved and live!' : 'Task rejected');
      window.location.reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-gray-800">{isApprovals ? 'Pending Approvals' : 'All Tasks'}</h3>
        <span className="badge-gray text-xs">{displayed.length} task(s)</span>
      </div>
      {displayed.length === 0 ? (
        <div className="empty-state py-12"><ClipboardList size={34} className="text-gray-300 mb-2 mx-auto" /><p className="text-muted">{isApprovals ? 'No pending approvals' : 'No tasks yet'}</p></div>
      ) : displayed.map(t => (
        <div key={t.id} className="card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-heading font-semibold text-gray-900 truncate">{t.title}</h4>
                <span className={clsx('badge text-xs capitalize',
                  t.status==='live'?'badge-green':t.status==='ongoing'?'badge-blue':t.status==='completed'?'badge-gray':t.status==='pending_approval'?'badge-yellow':'badge-red')}>
                  {t.status?.replace('_',' ')}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                by {t.member?.first_name} {t.member?.last_name} · {t.member_department} · ₦{Number(t.total_estimated_cost||0).toLocaleString()} · {formatDistanceToNow(new Date(t.created_at),{addSuffix:true})}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {t.state_deployments?.map(d => <span key={d.id} className="badge-gray text-xs">{d.state} ({d.people_needed})</span>)}
              </div>
            </div>
            {isApprovals && (
              <div className="flex gap-2">
                <button onClick={() => handleApprove(t.id, true)} disabled={actionLoading===t.id} className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600">
                  <Check size={13}/> Approve
                </button>
                <button onClick={() => handleApprove(t.id, false)} disabled={actionLoading===t.id} className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600">
                  <X size={13}/> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubscriptionPanel({ company, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const subscribe = async (plan) => {
    setLoading(true);
    try {
      const { data } = await teamsApi.subscribe(company.id, { plan });
      window.open(data.authorization_url, '_blank');
      toast.success('Redirecting to Flutterwave...');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-heading font-semibold mb-4">Subscription Status</h3>
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl">
          <div className={clsx('w-3 h-3 rounded-full', company?.subscription_status==='active'?'bg-rose-500 animate-pulse':'bg-red-400')}/>
          <div>
            <p className="font-semibold text-sm text-gray-800 capitalize">{company?.subscription_status || 'Inactive'}</p>
            {company?.subscription_end && <p className="text-xs text-muted">Expires: {(company.subscription_end ? format(new Date(company.subscription_end), 'MMM d, yyyy') : '—')}</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { plan:'monthly', label:'Monthly', price:'₦200,000', period:'/month', desc:'Billed monthly. Cancel anytime.' },
          { plan:'yearly',  label:'Yearly',  price:'₦2,400,000', period:'/year', desc:'Save ₦1.2M vs monthly billing.', popular:true },
        ].map(p => (
          <div key={p.plan} className={clsx('card p-6', p.popular && 'border-2 border-rose-500')}>
            {p.popular && <div className="badge-green mb-3 inline-flex">Best Value</div>}
            <p className="font-heading font-bold text-2xl text-dark">{p.price}<span className="text-muted text-sm font-normal">{p.period}</span></p>
            <p className="text-sm text-muted mb-4">{p.desc}</p>
            <button onClick={() => subscribe(p.plan)} disabled={loading} className="btn-primary w-full">
              {loading ? '...' : `Subscribe ${p.label}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


function LeaderRightsPanel({ company }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await teamsApi.getCompanyMembers(company.id, { status: 'active' });
      const pending = (data.members || []).filter(m => m.leader_right_status === 'pending');
      setMembers(pending);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (company?.id) load(); }, [company?.id]);

  const handleAction = async (memberId, action) => {
    setActionLoading(memberId);
    try {
      await certificationsApi.grantLeaderRights(company.id, memberId, { action });
      toast.success(action === 'approve' ? 'Team Leader rights granted!' : 'Request declined');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-gray-800 mb-1">Team Leader Rights Approvals</h3>
        <p className="text-sm text-muted">Members who joined as Team Leaders and are awaiting full privileges.</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-7 h-7 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>
      ) : members.length === 0 ? (
        <div className="empty-state py-10">
          <Briefcase size={34} className="text-gray-300 mb-2 mx-auto" />
          <p className="font-semibold text-gray-700">No pending leader rights requests</p>
          <p className="text-muted text-sm mt-1">When employees request Team Leader access, they will appear here.</p>
        </div>
      ) : members.map(m => (
        <div key={m.id} className="card p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-rose-100 overflow-hidden flex-shrink-0">
              {m.user?.avatar_url
                ? <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold text-lg">{m.first_name?.[0]}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-gray-900">{m.first_name} {m.last_name}</p>
              <p className="text-sm text-muted">{m.work_email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="badge-yellow text-xs">Leader Rights Pending</span>
                {m.department && <span className="badge-gray text-xs">{m.department.name}</span>}
                <span className="text-xs text-muted">{m.job_role}</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Joined {m.approved_at ? new Date(m.approved_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }) : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleAction(m.id, 'approve')}
                disabled={actionLoading === m.id}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                <Check size={14}/> Grant Leader Rights
              </button>
              <button
                onClick={() => handleAction(m.id, 'reject')}
                disabled={actionLoading === m.id}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-sm font-medium transition-colors">
                <X size={14}/> Decline
              </button>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
            <strong>ℹ️ Granting Team Leader rights will:</strong> allow this person to manage their department members, approve or reject new member bids, and view all department task history.
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [company, setCompany] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const compRes = await teamsApi.getMyCompany();
      setCompany(compRes.data.company);
      setWallet(compRes.data.company.wallet);

      const taskRes = await enterpriseApi.listTasks();
      const taskList = taskRes.data.tasks || [];
      setTasks(taskList);

      const membersRes = await teamsApi.getCompanyMembers(compRes.data.company.id);
      const allMembers = membersRes.data.members || [];
      setStats({
        total_members: allMembers.filter(m => m.status==='active').length,
        pending_members: allMembers.filter(m => m.status==='pending').length,
        leader_pending: allMembers.filter(m => m.leader_right_status==='pending').length,
        total_tasks: taskList.length,
        ongoing_tasks: taskList.filter(t => t.status==='ongoing').length,
        pending_tasks: taskList.filter(t => t.status==='pending_approval').length,
      });
    } catch (err) {
      if (err.response?.status === 404) { toast.error('No company found. Please register first.'); navigate('/teams/register'); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-xl py-8">
        {/* Banner */}
        <div className="mb-6 p-5 rounded-3xl text-white flex items-center justify-between flex-wrap gap-3"
          style={{ background:'linear-gradient(135deg,#0D1117,#1a2e3a)' }}>
          <div className="flex items-center gap-4">
            {company?.company_logo_url
              ? <img src={company.company_logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover"/>
              : <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-2xl font-bold">{company?.company_name?.[0]}</div>}
            <div>
              <h1 className="font-heading text-xl font-bold">{company?.company_name}{company?.branch_name && <span className="text-rose-400 font-medium text-base ml-2">— {company.branch_name}</span>}</h1>
              <p className="text-gray-400 text-sm">HR Dashboard · @{company?.company_domain}</p>
            </div>
          </div>
          <Link to="/teams/post-task" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
            <Plus size={16}/> Post Enterprise Task
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar active={active} setActive={setActive} company={company} pendingCount={stats.pending_members||0} leaderPendingCount={stats.leader_pending||0}/>
          <div className="flex-1 min-w-0">
            {active==='overview'     && <Overview company={company} stats={stats} wallet={wallet} recentTasks={tasks} onTabChange={setActive}/>}
            {active==='members'      && <MembersPanel company={company}/>}
            {active==='leaders'      && <LeaderRightsPanel company={company}/>}
            {active==='departments'  && <DepartmentsPanel company={company}/>}
            {active==='tasks'        && <TasksPanel tasks={tasks} isApprovals={false}/>}
            {active==='approvals'    && <TasksPanel tasks={tasks} isApprovals={true}/>}
            {active==='wallet'       && <WalletPanel company={company} wallet={wallet} onRefresh={load}/>}
            {active==='file-history' && <FileHistory companyId={company?.id}/>}
            {active==='subscription' && <SubscriptionPanel company={company} onRefresh={load}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
