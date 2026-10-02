import { useState, useEffect, useRef } from 'react';
import SEO from '../../components/seo/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, LogOut, Upload, Send, Video, Radio, CheckCircle, X, Eye, Download, Ban, BarChart3, ClipboardList, Wallet, ScrollText, Zap, RefreshCw, Building2, Check } from 'lucide-react';
import { teamsApi, enterpriseApi } from '../../utils/api';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft:'badge-gray', pending_approval:'badge-yellow', approved:'badge-blue',
  live:'badge-green', ongoing:'badge-blue', completed:'badge-gray',
  cancelled:'badge-red', rejected:'badge-red',
};

function Sidebar({ active, setActive, member }) {
  const navigate = useNavigate();
  const nav = [
    { id:'overview',  Icon:BarChart3, label:'Overview' },
    { id:'my-tasks',  Icon:ClipboardList, label:'My Tasks' },
    { id:'post',      Icon:Plus, label:'Post New Task', action: () => navigate('/teams/post-task') },
    { id:'budget',    Icon:Wallet, label:'Dept Budget' },
    { id:'history',   Icon:ScrollText, label:'Task History' },
  ];
  const logout = () => {
    localStorage.removeItem('taskeeu_token');
    localStorage.removeItem('teams_member');
    navigate('/teams');
  };
  return (
    <div className="w-full md:w-56 flex-shrink-0 space-y-3">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 overflow-hidden">
            {member?.user?.avatar_url
              ? <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-rose-600 font-bold">{member?.first_name?.[0]}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">{member?.first_name} {member?.last_name}</p>
            <p className="text-xs text-muted truncate">{member?.job_role}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className={clsx('badge text-xs capitalize',
            member?.permission_level==='hr'?'badge-red':member?.permission_level==='dept_leader'?'badge-blue':member?.permission_level==='finance'?'badge-yellow':'badge-gray')}>
            {member?.permission_level}
          </span>
          {member?.department && <span className="badge-gray text-xs">{member.department.name}</span>}
        </div>
      </div>
      <div className="card p-3 space-y-1">
        {nav.map(item => item.action ? (
          <button key={item.id} onClick={item.action} className="sidebar-link w-full text-left bg-rose-500 text-white hover:bg-rose-600 hover:text-white font-semibold">
            <item.Icon size={16} /><span>{item.label}</span>
          </button>
        ) : (
          <button key={item.id} onClick={() => setActive(item.id)}
            className={clsx('sidebar-link w-full text-left', active===item.id && 'active')}>
            <item.Icon size={16} /><span>{item.label}</span>
          </button>
        ))}
        <hr className="my-1 border-gray-100"/>
        <button onClick={logout} className="sidebar-link w-full text-left text-red-500 hover:bg-red-50">
          <LogOut size={16}/><span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showBids, setShowBids] = useState(false);
  const [showProofs, setShowProofs] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [meetingForm, setMeetingForm] = useState({ meeting_title:'', scheduled_at:'', duration_minutes:60, notes:'' });
  const [proofFiles, setProofFiles] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const proofRef = useRef();

  const bids = task.bids || [];
  const acceptedBids = bids.filter(b => b.status === 'accepted');
  const pendingBids = bids.filter(b => b.status === 'pending');

  const bidAction = async (bidId, action) => {
    setActionLoading(bidId);
    try {
      await enterpriseApi.bidAction(task.id, bidId, { action });
      toast.success(`Bid ${action}ed!`);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await enterpriseApi.broadcast(task.id, { message: broadcastMsg });
      toast.success('Broadcast sent to all accepted taskers!');
      setBroadcastMsg('');
      setShowBroadcast(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const createMeeting = async () => {
    try {
      const { data } = await enterpriseApi.createMeeting(task.id, meetingForm);
      toast.success('Meeting created! Link sent to all taskers.');
      window.open(data.meeting_url, '_blank');
      setShowMeeting(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const blacklist = async (taskerId) => {
    const reason = prompt('Reason for blacklisting this tasker?');
    if (!reason) return;
    try {
      await enterpriseApi.blacklistTasker(task.id, { tasker_id: taskerId, reason });
      toast.success('Tasker blacklisted from future tasks');
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Already blacklisted or failed'); }
  };

  return (
    <div className="card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-semibold text-gray-900 truncate">{task.title}</h3>
              <span className={clsx('badge text-xs capitalize', STATUS_COLORS[task.status]||'badge-gray')}>
                {task.status?.replace(/_/g,' ')}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {task.task_type?.name || task.custom_task_type} · ₦{Number(task.adjusted_price_per_person||0).toLocaleString()}/person ·
              {task.total_people_needed} people · Total ₦{Number(task.total_estimated_cost||0).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.state_deployments?.map(d => (
                <span key={d.id} className="badge-gray text-xs">{d.state}{d.region ? ' · '+d.region : ''} ({d.people_needed})</span>
              ))}
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-rose-500 hover:text-rose-700 text-sm font-medium flex-shrink-0">
            {expanded ? 'Collapse ↑' : 'Details ↓'}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Description */}
            <div className="p-3 bg-surface rounded-xl">
              <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{task.description}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {['live','ongoing'].includes(task.status) && pendingBids.length > 0 && (
                <button onClick={() => setShowBids(!showBids)} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors">
                  {pendingBids.length} Pending Bid{pendingBids.length>1?'s':''}
                </button>
              )}
              {acceptedBids.length > 0 && (
                <>
                  <button onClick={() => setShowBroadcast(!showBroadcast)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100">
                    <Radio size={13}/> Broadcast
                  </button>
                  <button onClick={() => setShowMeeting(!showMeeting)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100">
                    <Video size={13}/> Schedule Meeting
                  </button>
                </>
              )}
              {task.status === 'ongoing' && (
                <button onClick={() => setShowProofs(!showProofs)} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100">
                  Review Proofs
                </button>
              )}
              {task.line_manager_name && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs">
                  Pending: {task.line_manager_name}
                </div>
              )}
            </div>

            {/* Bids panel */}
            {showBids && (
              <div className="space-y-3">
                <p className="font-semibold text-sm text-gray-800">Bids</p>
                {bids.map(bid => (
                  <div key={bid.id} className={clsx('p-3 rounded-xl border', bid.status==='accepted'?'border-rose-200 bg-rose-50':bid.status==='rejected'?'border-red-100 bg-red-50':'border-gray-200 bg-white')}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 overflow-hidden flex-shrink-0">
                        {bid.tasker?.avatar_url ? <img src={bid.tasker.avatar_url} alt="" className="w-full h-full object-cover"/> :
                         <div className="w-full h-full flex items-center justify-center text-rose-600 text-xs font-bold">{bid.tasker?.full_name?.[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800">{bid.tasker?.full_name}</p>
                        {bid.tasker?.profile && (
                          <p className="text-xs text-muted">{parseFloat(bid.tasker.profile.rating_average||0).toFixed(1)} · {bid.tasker.profile.total_tasks_completed} tasks</p>
                        )}
                        {bid.message && <p className="text-xs text-gray-600 mt-1 italic">"{bid.message}"</p>}
                        <span className={clsx('badge text-xs mt-1', bid.status==='accepted'?'badge-green':bid.status==='rejected'?'badge-red':'badge-yellow')}>{bid.status}</span>
                      </div>
                      {bid.status === 'pending' && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => bidAction(bid.id,'accept')} disabled={actionLoading===bid.id}
                            className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600">Accept</button>
                          <button onClick={() => bidAction(bid.id,'reject')} disabled={actionLoading===bid.id}
                            className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs hover:bg-red-100">Reject</button>
                          <button onClick={() => bidAction(bid.id,'ignore')} disabled={actionLoading===bid.id}
                            className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-gray-200">Ignore</button>
                          <button onClick={() => blacklist(bid.tasker_id)}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200" title="Blacklist tasker">
                            <Ban size={12}/>
                          </button>
                        </div>
                      )}
                      {bid.status === 'accepted' && bid.authorization_letter_url && (
                        <a href={bid.authorization_letter_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs hover:bg-rose-100 flex-shrink-0">
                          <Download size={12}/> Auth Letter
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Broadcast panel */}
            {showBroadcast && (
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                <p className="font-semibold text-sm text-blue-800">Broadcast to {acceptedBids.length} accepted tasker(s)</p>
                <textarea rows={3} value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                  placeholder="Type your message to all taskers..." className="input resize-none text-sm"/>
                <div className="flex gap-2">
                  <button onClick={sendBroadcast} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                    <Send size={14}/> Send Broadcast
                  </button>
                  <button onClick={() => setShowBroadcast(false)} className="btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Meeting panel */}
            {showMeeting && (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-3">
                <p className="font-semibold text-sm text-purple-800">Schedule Video Meeting (via Jitsi)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Meeting Title</label>
                    <input value={meetingForm.meeting_title} onChange={e => setMeetingForm(f=>({...f,meeting_title:e.target.value}))} placeholder="Task Briefing" className="input text-sm"/>
                  </div>
                  <div>
                    <label className="label text-xs">Scheduled At</label>
                    <input type="datetime-local" value={meetingForm.scheduled_at} onChange={e => setMeetingForm(f=>({...f,scheduled_at:e.target.value}))} className="input text-sm"/>
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Duration (minutes)</label>
                  <select value={meetingForm.duration_minutes} onChange={e => setMeetingForm(f=>({...f,duration_minutes:parseInt(e.target.value)}))} className="input text-sm">
                    {[30,45,60,90,120].map(m => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Notes (optional)</label>
                  <textarea rows={2} value={meetingForm.notes} onChange={e => setMeetingForm(f=>({...f,notes:e.target.value}))} className="input resize-none text-sm" placeholder="Meeting agenda..."/>
                </div>
                <p className="text-xs text-purple-700">A meeting link will be emailed to all {acceptedBids.length} accepted tasker(s). Click to join directly — no account required.</p>
                <div className="flex gap-2">
                  <button onClick={createMeeting} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
                    <Video size={14}/> Create & Send Link
                  </button>
                  <button onClick={() => setShowMeeting(false)} className="btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Proofs review */}
            {showProofs && (
              <ProofsReview taskId={task.id}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProofsReview({ taskId }) {
  const [proofs, setProofs] = useState([]);
  useEffect(() => {
    enterpriseApi.getTask(taskId).then(({ data }) => {
      // proofs would be fetched separately in production
    });
  }, [taskId]);

  return (
    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
      <p className="font-semibold text-sm text-green-800 mb-3">GPS Proof Review</p>
      {proofs.length === 0 ? (
        <p className="text-xs text-green-700">No proofs uploaded yet by taskers. Proofs will appear here once taskers submit GPS-stamped photos.</p>
      ) : proofs.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-white rounded-xl mb-2">
          <img src={p.file_url} alt="proof" className="w-14 h-14 rounded-lg object-cover cursor-pointer" onClick={() => window.open(p.file_url,'_blank')}/>
          <div className="flex-1">
            {p.gps_lat && <p className="text-xs text-muted">{p.gps_lat}, {p.gps_lng}</p>}
            {p.gps_address && <p className="text-xs text-muted">{p.gps_address}</p>}
            {p.taken_at && <p className="text-xs text-muted">{(p.taken_at ? format(new Date(p.taken_at), 'MMM d, h:mm a') : '—')}</p>}
          </div>
          {p.is_approved === null || p.is_approved === undefined ? (
            <div className="flex gap-1.5">
              <button onClick={() => enterpriseApi.approveProof(taskId, p.id, { approved: true }).then(() => toast.success('Proof approved'))}
                className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 inline-flex items-center gap-1"><Check size={12} /> OK</button>
              <button onClick={() => enterpriseApi.approveProof(taskId, p.id, { approved: false, rejection_note: 'GPS data required' }).then(() => toast.error('Proof rejected'))}
                className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 inline-flex items-center gap-1"><X size={12} /> Reject</button>
            </div>
          ) : (
            <span className={clsx('badge text-xs', p.is_approved ? 'badge-green' : 'badge-red')}>
              {p.is_approved ? 'Approved' : 'Rejected'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function BudgetPanel({ member }) {
  const dept = member?.department;
  if (!dept) return (
    <div className="empty-state py-12"><Building2 size={34} className="text-gray-300 mb-2 mx-auto" /><p className="text-muted">No department assigned yet</p></div>
  );
  const pct = dept.budget_allocated > 0 ? Math.min(100, (dept.budget_spent/dept.budget_allocated)*100) : 0;
  const available = Math.max(0, parseFloat(dept.budget_allocated||0) - parseFloat(dept.budget_spent||0));
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <h3 className="font-heading font-semibold text-gray-800 mb-5">{dept.name} Department Budget</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label:'Total Allocated', value:`₦${Number(dept.budget_allocated||0).toLocaleString()}`, color:'text-blue-600', bg:'bg-blue-50', emoji:'' },
            { label:'Spent / Reserved', value:`₦${Number(dept.budget_spent||0).toLocaleString()}`, color:'text-red-500', bg:'bg-red-50', emoji:'' },
            { label:'Available', value:`₦${Number(available).toLocaleString()}`, color:'text-rose-600', bg:'bg-rose-50', Icon:CheckCircle },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-2 mx-auto', s.bg)}><s.Icon size={16} /></div>
              <p className={clsx('font-heading font-bold text-xl', s.color)}>{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>Budget utilisation</span><span>{pct.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full transition-all', pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-rose-500')}
              style={{ width:`${pct}%` }}/>
          </div>
          {pct > 90 && <p className="text-xs text-red-600 mt-2 font-semibold">Budget nearly exhausted. Contact HR for top-up.</p>}
        </div>
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [member, setMember] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [memRes, taskRes] = await Promise.all([
        teamsApi.getMemberProfile(),
        enterpriseApi.listTasks({ my_tasks: true }),
      ]);
      setMember(memRes.data.member);
      setTasks(taskRes.data.tasks || []);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error('No active company membership. Please contact your HR.'); navigate('/teams/login');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>;

  const stats = [
    { Icon:ClipboardList, label:'My Tasks', value: tasks.length, color:'text-blue-600', bg:'bg-blue-50' },
    { Icon:Zap, label:'Live', value: tasks.filter(t=>t.status==='live').length, color:'text-green-600', bg:'bg-green-50' },
    { Icon:RefreshCw, label:'Ongoing', value: tasks.filter(t=>t.status==='ongoing').length, color:'text-amber-600', bg:'bg-amber-50' },
    { Icon:CheckCircle, label:'Completed', value: tasks.filter(t=>t.status==='completed').length, color:'text-gray-600', bg:'bg-gray-50' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="container-xl py-8">
        {/* Banner */}
        <div className="mb-6 p-5 rounded-3xl text-white flex items-center justify-between flex-wrap gap-3"
          style={{ background:'linear-gradient(135deg,#0D1117,#0a2e1a)' }}>
          <div>
            <h1 className="font-heading text-xl font-bold">Hey, {member?.first_name}!</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {member?.company?.company_name} · {member?.department?.name || 'No department'} · {member?.job_role}
            </p>
          </div>
          <Link to="/teams/post-task" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
            <Plus size={16}/> Post Enterprise Task
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar active={active} setActive={setActive} member={member}/>
          <div className="flex-1 min-w-0">

            {active === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="card p-5">
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3', s.bg)}><s.Icon size={16} /></div>
                      <p className={clsx('font-heading font-bold text-2xl', s.color)}>{s.value}</p>
                      <p className="text-xs text-muted mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Budget preview */}
                {member?.department && (
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-gray-800">Dept Budget</h3>
                      <button onClick={() => setActive('budget')} className="text-sm text-rose-600 hover:underline">Details →</button>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted">Available</span>
                      <span className="font-bold text-rose-600">₦{Number(Math.max(0,(member.department.budget_allocated||0)-(member.department.budget_spent||0))).toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full"
                        style={{ width:`${Math.min(100,member.department.budget_allocated>0?((member.department.budget_spent||0)/member.department.budget_allocated)*100:0)}%` }}/>
                    </div>
                  </div>
                )}
                {/* Recent tasks */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold">Recent Tasks</h3>
                    <button onClick={() => setActive('my-tasks')} className="text-sm text-rose-600 hover:underline">View all →</button>
                  </div>
                  {tasks.slice(0,3).map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                        <p className="text-xs text-muted">{formatDistanceToNow(new Date(t.created_at),{addSuffix:true})}</p>
                      </div>
                      <span className={clsx('badge text-xs capitalize', STATUS_COLORS[t.status]||'badge-gray')}>{t.status?.replace('_',' ')}</span>
                    </div>
                  ))}
                  {tasks.length === 0 && <div className="text-center py-6"><p className="text-muted text-sm">No tasks yet</p><Link to="/teams/post-task" className="btn-primary btn-sm mt-3 inline-block">Post Your First Task</Link></div>}
                </div>
              </div>
            )}

            {(active === 'my-tasks' || active === 'history') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-gray-800">{active==='history'?'Task History':'My Tasks'}</h3>
                  <Link to="/teams/post-task" className="btn-primary btn-sm flex items-center gap-1"><Plus size={13}/> New Task</Link>
                </div>
                {tasks.length === 0 ? (
                  <div className="empty-state py-12"><ClipboardList size={34} className="text-gray-300 mb-2 mx-auto" /><p className="text-muted">No tasks yet. Post your first enterprise task!</p></div>
                ) : tasks.map(t => <TaskCard key={t.id} task={t} onRefresh={load}/>)}
              </div>
            )}

            {active === 'budget' && <BudgetPanel member={member}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
