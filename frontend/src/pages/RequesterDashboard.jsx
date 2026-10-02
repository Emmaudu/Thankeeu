import { cpath } from '../utils/market';
import { minAmount, money, sym, activeMarket } from '../utils/market';
import { useCountryContent } from '../components/country/content';
import { useState, useEffect, useRef } from 'react';
import SEO from '../components/seo/SEO';
import ReferWalletPanel from '../components/ReferWalletPanel';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { tasksApi, chatApi, paymentsApi, authApi, taskersApi, vooomApi } from '../utils/api';

import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ui/ChatWindow';
import SupportWidget from '../components/ui/SupportWidget';
import { ReviewGate, ReviewsReceived, TaskReviews } from '../components/ui/Reviews';
import { taskerProfilePath } from '../utils/profileLink';
import { requestOpenTask, takePendingTask } from '../utils/openTask';
import CostFields, { emptyCosts, costsValid, CostBreakdown } from '../components/task/CostFields';
import { costNumber, costTotal, naira, taskPrice } from '../utils/taskPrice';
import { TaskAdvancePanel, TaskProgressForRequester, RequesterReleaseFlow, TipPanel } from '../components/task/TaskWorkspace';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { getFlutterwaveBankCountry, getStates } from '../utils/countryStates';
import {
  ArrowLeft, ArrowRight, Bell, Camera, CheckSquare, ChevronRight, ClipboardList, CreditCard, DollarSign,
  LayoutDashboard, LogOut, MapPin, Menu, MessageSquare, Plus, RefreshCw, RotateCcw,
  Search, ShoppingCart, Truck, User, UserCircle, X, Zap, Banknote, Trash2, AlertTriangle, Gift, Megaphone, Navigation
} from 'lucide-react';
import MarketingPosterTab from '../components/MarketingPosterTab';
import VooomDashTab from '../components/VooomDashTab';

const STATUS_COLORS = {
  open: 'badge-green', bidding: 'badge-yellow',
  ongoing: 'badge-blue', completed: 'badge-gray', cancelled: 'badge-red'
};
const STATUS_LABELS = {
  open: 'Open', bidding: 'Getting Bids', ongoing: 'In Progress',
  completed: 'Done', cancelled: 'Cancelled'
};

const NAV = [
  { id: 'overview',  Icon: LayoutDashboard,  label: 'Overview' },
  { id: 'post-task', Icon: Plus,             label: 'Post a Task' },
  { id: 'tasks',     Icon: ClipboardList,    label: 'My Tasks' },
  { id: 'chat',      Icon: MessageSquare,    label: 'Messages' },
  { id: 'payments',  Icon: DollarSign,       label: 'Payments' },
  { id: 'refer-wallet', Icon: Gift,          label: 'Refer Wallet' },
  { id: 'marketing',    Icon: Megaphone,      label: 'Marketing' },
  { id: 'vooom',        Icon: Navigation,     label: 'Vooom' },
  { id: 'profile',      Icon: UserCircle,     label: 'My Profile' },
  { id: 'support',   Icon: MessageSquare,    label: 'Support' },
];

function Sidebar({ active, setActive, user, onClose, isMobile }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => { logout(); navigate(cpath('/')); };

  return (
    <>
      <aside className={clsx('dash-sidebar', isMobile && 'open')}>
        {/* Logo */}
        <div className="dash-sidebar-logo flex items-center justify-between">
          <Link to={cpath("/")} className="flex items-center gap-2">
            <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
            <span className="font-black text-white text-xl tracking-tight">Taskeeu</span>
          </Link>
          {isMobile && (
            <button onClick={onClose} className="text-white/60 hover:text-white p-1">
              <X size={20} />
            </button>
          )}
        </div>

        {/* User card */}
        <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: 'var(--loveeu-rose)' }}>
              {user?.full_name?.[0] || 'R'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.full_name || 'Requester'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Task Requester</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="dash-sidebar-nav">
          <p className="sidebar-section-label">Main Menu</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setActive(item.id); onClose?.(); }}
              className={clsx('sidebar-link', active === item.id && 'active')}>
              <span className="sidebar-icon"><item.Icon size={16} /></span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto pt-6">
            <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
            <button onClick={() => setActive('post-task')} className="sidebar-link" style={{ background: 'rgba(0,195,126,0.15)', color: '#33d99b' }}>
              <span className="sidebar-icon" style={{ background: 'rgba(0,195,126,0.2)' }}><Plus size={16} /></span>
              <span>Post New Task</span>
            </button>
            {/* Switch to tasker — only for users who have both accounts */}
            {(user?.has_tasker_account || user?.role === 'tasker') && (
              <button
                onClick={() => navigate(cpath('/tasker'))}
                style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'9px 14px', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontWeight:700, fontSize:12.5, display:'flex', alignItems:'center', gap:8, marginBottom:4, marginTop:4 }}>
                <span style={{ fontSize:15 }}></span> Switch to Tasker
              </button>
            )}
            <button onClick={handleLogout} className="sidebar-link mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span className="sidebar-icon"><LogOut size={16} /></span>
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

function Topbar({ active, onMenuOpen, user, onRefresh, loading, onTabChange }) {
  const label = NAV.find(n => n.id === active)?.label || 'Dashboard';
  return (
    <header className="dash-topbar">
      <div className="flex items-center gap-4">
        <button onClick={onMenuOpen}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
          <Menu size={22} />
        </button>
        <div>
          <h1 className="font-black text-lg text-gray-900 leading-tight">{label}</h1>
          <p className="text-xs text-gray-400 font-medium hidden sm:block">Manage your tasks &amp; activity</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh}
          className={clsx('p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500', loading && 'opacity-50 pointer-events-none')}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => onTabChange?.('post-task')}
          className="btn-primary btn-sm hidden sm:flex">
          <Plus size={16} /> Post Task
        </button>
      </div>
    </header>
  );
}

/* ── Overview ─────────────────────────────────────────────────── */
function Overview({ tasks, onTabChange }) {
  const stats = [
    { label: 'Tasks Posted',  value: tasks.length,                                                  Icon: ClipboardList, bg: 'bg-blue-50',   val: 'text-blue-700' },
    { label: 'In Progress',   value: tasks.filter(t => t.status === 'ongoing').length,               Icon: RefreshCw,     bg: 'bg-amber-50',  val: 'text-amber-700' },
    { label: 'Completed',     value: tasks.filter(t => t.status === 'completed').length,             Icon: LayoutDashboard, bg: 'bg-emerald-50', val: 'text-emerald-700' },
    { label: 'Bids Received', value: tasks.filter(t=>t.status==='bidding').reduce((s,t)=>s+(t.bids?.[0]?.count||0),0), Icon: MessageSquare, bg: 'bg-rose-50', val: 'text-rose-700' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={clsx('stat-icon', s.bg)}><s.Icon size={18} className={s.val} /></div>
            <p className={clsx('stat-value', s.val)}>{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Welcome banner */}
      <div className="card p-6 relative overflow-hidden" style={{ background: 'var(--rose)' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(255,45,98,0.5), transparent 60%)' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Quick Action</p>
          <h3 className="text-white font-black text-xl mb-1">Need something done?</h3>
          <p className="text-white/60 text-sm mb-4">Post a task and get bids from verified taskers near you — within minutes.</p>
          <button onClick={() => onTabChange('post-task')} className="btn-primary btn-sm inline-flex"><Plus size={16} /> Post a New Task</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-black text-gray-900 text-base">Recent Tasks</h3>
          <button onClick={() => onTabChange('tasks')} className="text-sm font-semibold" style={{ color: 'var(--loveeu-rose)' }}>View All →</button>
        </div>
        <div>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={48} className="text-gray-200 mb-3 mx-auto" />
              <p className="font-bold text-gray-700 text-lg">No tasks yet</p>
              <p className="text-gray-400 text-sm mt-1">Your posted tasks will show up here</p>
              <button onClick={() => onTabChange('post-task')} className="btn-primary btn-sm mt-4 inline-flex">Post Your First Task</button>
            </div>
          ) : tasks.slice(0, 6).map(task => (
            <div key={task.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                <p className="text-sm text-gray-400 mt-0.5">{task.task_city} · Due {task.deadline ? formatDistanceToNow(new Date(task.deadline), { addSuffix: true }) : 'No deadline'}</p>
              </div>
              <span className={clsx('badge', STATUS_COLORS[task.status] || 'badge-gray')}>{STATUS_LABELS[task.status] || task.status}</span>
              <button onClick={() => onTabChange('tasks')} className="text-gray-300 hover:text-rose-500 transition-colors"><ChevronRight size={18} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── My Tasks ─────────────────────────────────────────────────── */
function MyTasks({ tasks, onRefresh, onOpenChat, onOpenChatRoom }) {
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [extendingTask, setExtendingTask] = useState(null);
  const [extendDate, setExtendDate] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);

  const handleExtendDeadline = async () => {
    if (!extendingTask || !extendDate || extendLoading) return;
    const taskId = extendingTask.id;
    const newDate = extendDate;
    setExtendLoading(true);
    try {
      await tasksApi.extendDeadline(taskId, newDate);
      toast.success('Deadline extended successfully');
      if (taskDetail?.id === taskId) setTaskDetail(d => ({ ...d, deadline: newDate }));
      setExtendingTask(null);
      setExtendDate('');
      onRefresh?.(); // was loadTasks(), which does not exist → threw after success
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not extend deadline');
    } finally { setExtendLoading(false); }
  };
  const [taskDetail, setTaskDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [taskEscrow, setTaskEscrow] = useState(null);   // funded − advances for the open task
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fund Task state ──
  const [fundingTask, setFundingTask] = useState(null); // task being funded
  const [fundAmount, setFundAmount] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  // ── Cancel Request state ──
  const [cancelTask, setCancelTask] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const FILTERS = ['all', 'open', 'bidding', 'ongoing', 'completed', 'cancelled'];

  const handleDeleteTask = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await tasksApi.cancel(deleteConfirm.id);
      toast.success('Task deleted successfully');
      setDeleteConfirm(null);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete task. Please try again.');
    } finally { setDeleting(false); }
  };

  // ── Fund Task: open Flutterwave checkout ──
  const handleFundTask = async () => {
    if (!fundingTask || !fundAmount || Number(fundAmount) < 100) {
      toast.error(`Enter an amount of at least ${money(minAmount())}`);
      return;
    }
    setFundLoading(true);
    try {
      const { data } = await paymentsApi.fundTask({ task_id: fundingTask.id, amount: fundAmount });
      toast.success('Redirecting to payment...');
      // Open Flutterwave in same tab — PaymentCallback will handle verify
      window.location.href = data.authorization_url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment setup failed. Try again.');
    } finally { setFundLoading(false); }
  };

  // ── Direct cancel for OPEN/BIDDING tasks (no tasker assigned, no approval needed) ──
  const handleDirectCancel = async () => {
    if (!cancelTask) return;
    setCancelLoading(true);
    try {
      await tasksApi.deleteTask(cancelTask.id);
      toast.success('Task cancelled and removed from Browse Tasks.');
      setCancelTask(null);
      setCancelReason('');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel task.');
    } finally { setCancelLoading(false); }
  };

  // ── Cancel Request (ONGOING tasks — needs tasker approval) ──
  const handleCancelRequest = async () => {
    if (!cancelTask || !cancelReason.trim() || cancelReason.trim().length < 10) {
      toast.error('Please provide a reason (at least 10 characters)');
      return;
    }
    setCancelLoading(true);
    try {
      await tasksApi.requestCancel(cancelTask.id, { reason: cancelReason.trim() });
      toast.success('Cancellation request sent to tasker. They must approve before the task is cancelled.');
      setCancelTask(null);
      setCancelReason('');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send cancellation request.');
    } finally { setCancelLoading(false); }
  };

  const openDetail = async (task) => {
    setViewing(task.id);
    setDetailLoading(true);
    setTaskDetail(null);
    setTaskEscrow(null);
    try {
      const { data } = await tasksApi.get(task.id);
      setTaskDetail(data.task || data);
    } catch { toast.error('Could not load task details'); setViewing(null); return; }
    finally { setDetailLoading(false); }
    // Escrow balance is secondary — never block the detail view on it.
    paymentsApi.getAdvanceForTask(task.id)
      .then(r => setTaskEscrow(r.data.escrow || null))
      .catch(() => {});
  };

  // Opened from Payments / a notification link → go straight to that task.
  useEffect(() => {
    const first = takePendingTask('requester');
    if (first) openDetail({ id: first });
    const onOpen = (e) => {
      if (e.detail?.scope !== 'requester') return;
      const id = takePendingTask('requester');
      if (id) openDetail({ id });
    };
    window.addEventListener('open-task', onOpen);
    return () => window.removeEventListener('open-task', onOpen);
  }, []);

  const refreshEscrow = (taskId) => {
    paymentsApi.getAdvanceForTask(taskId).then(r => setTaskEscrow(r.data.escrow || null)).catch(() => {});
  };

  const reloadDetail = async (taskId) => {
    try { const { data } = await tasksApi.get(taskId); setTaskDetail(data.task || data); } catch {}
  };

  const acceptBid = async (taskId, bidId) => {
    if (accepting) return;
    setAccepting(bidId);
    try {
      const { data } = await tasksApi.acceptBid(taskId, bidId);
      toast.success(data?.message || 'Tasker chosen! A chat has been opened.');
      onRefresh();
      await reloadDetail(taskId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept bid');
      if (err.response?.status === 409) reloadDetail(taskId);
    } finally { setAccepting(null); }
  };

  const rejectBid = async (taskId, bidId, isChosen) => {
    if (rejecting) return;
    if (isChosen && !window.confirm('Remove this tasker from your task? The task will be open for bids again.')) return;
    setRejecting(bidId);
    try {
      const { data } = await tasksApi.rejectBid(taskId, bidId);
      toast.success(data?.message || 'Bid declined');
      if (data?.unassigned) onRefresh();
      await reloadDetail(taskId);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not reject bid'); }
    finally { setRejecting(null); }
  };

  const [chatting, setChatting] = useState(null);
  const chatWithBidder = async (taskId, bidId) => {
    if (chatting) return;
    setChatting(bidId);
    try {
      const { data } = await tasksApi.chatWithBidder(taskId, bidId);
      toast.success(data?.message || 'Chat opened.');
      onOpenChatRoom?.(data.chat_room_id);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not open the chat'); }
    finally { setChatting(null); }
  };

  if (viewing) {
    return (
      <div>
        <button onClick={() => { setViewing(null); setTaskDetail(null); }}
          className="flex items-center gap-2 mb-5" style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to my tasks
        </button>
        {detailLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>
        ) : taskDetail ? (
          <div className="space-y-5">
            <div className="card p-6">
              <span className={clsx('badge mb-3 inline-block', STATUS_COLORS[taskDetail.status] || 'badge-gray')}>{STATUS_LABELS[taskDetail.status] || taskDetail.status}</span>
              <h2 className="font-black text-2xl mb-2" style={{ color: 'var(--text)' }}>{taskDetail.title}</h2>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                <span>{taskDetail.task_city}, {taskDetail.task_state}</span>
                <span>{taskDetail.deadline ? format(new Date(taskDetail.deadline), 'MMM d, yyyy') : 'Flexible'}</span>
                {taskPrice(taskDetail) && <span className="font-bold" style={{ color: 'var(--primary)' }}>{money(taskPrice(taskDetail))}</span>}
                {taskDetail.is_funded && (() => {
                  const e = taskEscrow;
                  const advance = e ? e.advance_withdrawn + (e.task_status === 'ongoing' ? e.advance_approved : 0) : 0;
                  return (
                    <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 10px', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
                      {e && advance > 0
                        ? <>Paid {money(e.funded)} · Advance −{money(advance)} · Balance {money(e.remaining)}</>
                        : <>Funded: {money(e?.funded ?? taskDetail.funded_amount ?? 0)}</>}
                    </span>
                  );
                })()}
              </div>
              <CostBreakdown task={taskDetail} />
              <div className="flex gap-2 mt-4 flex-wrap">
                {taskDetail.status === 'ongoing' && (
                  <button onClick={() => { onOpenChat?.(taskDetail); setViewing(null); }} className="btn-primary btn-sm flex items-center gap-1.5">
                    <MessageSquare size={13} /> Chat with Tasker
                  </button>
                )}
                {taskDetail.status === 'ongoing' && !taskDetail.is_funded && (
                  <button
                    onClick={() => { setFundingTask(taskDetail); setFundAmount(taskPrice(taskDetail) || ''); }}
                    className="btn-sm font-bold flex items-center gap-1.5" style={{ background: '#16a34a', color: 'white', borderRadius: 12, padding: '8px 16px', border: 'none', cursor: 'pointer' }}>
                    <CreditCard size={13} /> Fund This Task
                  </button>
                )}
                {['open','bidding','ongoing'].includes(taskDetail.status) && (
                  <button onClick={() => { setExtendingTask(taskDetail); setExtendDate(''); }}
                    className="btn-sm flex items-center gap-1.5" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Extend Deadline
                  </button>
                )}
              </div>
            </div>

            {taskDetail.status === 'ongoing' && taskDetail.is_funded && taskDetail.accepted_tasker_id && (
              <RequesterReleaseFlow key={'rel' + taskDetail.id} task={taskDetail}
                taskerName={taskDetail.accepted_tasker?.username ? '@' + taskDetail.accepted_tasker.username : null} />
            )}

            {['ongoing', 'completed'].includes(taskDetail.status) && taskDetail.accepted_tasker_id && (
              <TaskProgressForRequester key={'prog' + taskDetail.id + taskDetail.status} task={taskDetail} />
            )}

            {['ongoing', 'completed'].includes(taskDetail.status) && taskDetail.accepted_tasker_id && (
              <div id="add-money">
                <TipPanel key={'tip' + taskDetail.id + taskDetail.status} task={taskDetail} />
              </div>
            )}

            {['ongoing', 'completed', 'cancelled'].includes(taskDetail.status) && taskDetail.accepted_tasker_id && (
              <TaskAdvancePanel key={'adv' + taskDetail.id + taskDetail.status} task={taskDetail} role="requester"
                onChanged={() => refreshEscrow(taskDetail.id)} />
            )}

            {taskDetail.status === 'completed' && (
              <TaskReviews taskId={taskDetail.id} taskTitle={taskDetail.title} otherLabel="Tasker"
                otherName={taskDetail.accepted_tasker?.username ? '@' + taskDetail.accepted_tasker.username : null} />
            )}

            {/* ── Extend Deadline Panel ── */}
            {extendingTask?.id === taskDetail.id && (
              <div className="card p-5" style={{ border: '2px solid #fde68a', background: '#fffbeb' }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#92400e', marginBottom: 6 }}>Extend deadline</p>
                <p style={{ fontSize: 13, color: '#b45309', marginBottom: 14, lineHeight: 1.6 }}>
                  Current deadline: <strong>{taskDetail.deadline ? format(new Date(taskDetail.deadline), 'MMM d, yyyy') : 'Not set'}</strong>. Set a new deadline and the tasker will be notified.
                </p>
                <input type="date" value={extendDate}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={e => setExtendDate(e.target.value)}
                  className="input" style={{ maxWidth: 200, marginBottom: 12, display: 'block' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleExtendDeadline} disabled={!extendDate || extendLoading}
                    className="btn-primary btn-sm">{extendLoading ? 'Saving…' : 'Confirm extension'}</button>
                  <button onClick={() => setExtendingTask(null)} className="btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            )}
            {fundingTask?.id === taskDetail.id && (
              <div className="card p-6" style={{ border: '2px solid #16a34a', background: '#f0fdf4' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={18} style={{ color: '#16a34a' }} />
                  <h4 className="font-black text-lg" style={{ color: '#14532d' }}>Fund & Activate Task</h4>
                </div>
                <p className="text-sm mb-4" style={{ color: '#166534', lineHeight: 1.6 }}>
                  Enter the final agreed amount from your chat with the tasker. Payment is held securely in escrow — the tasker receives it only after you're satisfied and enter the completion code.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="label">Agreed Amount ({sym()}) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">{sym()}</span>
                      <input
                        type="number" min={minAmount()} step="any" placeholder={`e.g. ${minAmount() * 50}`} value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        className="input pl-8 text-lg font-black" style={{ fontSize: 20, fontWeight: 900 }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#166534' }}>This is the amount your tasker agreed to for the work. Minimum {money(minAmount())}.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleFundTask}
                      disabled={fundLoading || !fundAmount || Number(fundAmount) < 100}
                      className="btn-sm font-bold flex items-center gap-2 flex-1 justify-center" style={{ background: '#16a34a', color: 'white', borderRadius: 12, padding: '12px', border: 'none', cursor: 'pointer', opacity: (!fundAmount || Number(fundAmount) < 100) ? 0.5 : 1 }}>
                      {fundLoading ? <RefreshCw size={15} className="animate-spin" /> : <CreditCard size={15} />}
                      {fundLoading ? 'Redirecting...' : `Pay ${money(fundAmount || 0)} ${activeMarket().slug ? 'by card' : 'via Flutterwave'}`}
                    </button>
                    <button onClick={() => setFundingTask(null)} className="btn-ghost btn-sm">Cancel</button>
                  </div>
                  <p className="text-xs" style={{ color: '#166534' }}>Payment is held in escrow. The tasker is notified by email and must complete the task before the deadline. Your money is only released when you provide the completion code.
                  </p>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h4 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Description</h4>
              <p className="leading-relaxed" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{taskDetail.description}</p>
            </div>

            {/* Bids section */}
            {taskDetail.bids && taskDetail.bids.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    Bids ({taskDetail.bids.length})
                  </h4>
                  {taskDetail.bids.filter(b => b.status === 'pending').length > 0 && taskDetail.status !== 'ongoing' && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#fffbeb', color: '#b45309' }}>
                      {taskDetail.bids.filter(b => b.status === 'pending').length} pending review
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {[...taskDetail.bids]
                    .sort((a, b) => ({ accepted: 0, pending: 1, rejected: 2 }[a.status] ?? 1) - ({ accepted: 0, pending: 1, rejected: 2 }[b.status] ?? 1))
                    .map(bid => (
                    <div key={bid.id} className="p-4 rounded-2xl border" style={{ borderColor: bid.status === 'accepted' ? '#bbf7d0' : bid.status === 'rejected' ? '#fee2e2' : 'var(--border-light)', background: bid.status === 'accepted' ? '#f0fdf4' : 'white' }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold" style={{ color: 'var(--text)' }}>{bid.tasker?.full_name || 'Tasker'}</p>
                            {bid.tasker?.id && (
                              <Link to={taskerProfilePath({ slug: bid.tasker.profile_slug, id: bid.tasker.id })} target="_blank" rel="noreferrer"
                                className="text-xs font-semibold underline" style={{ color: 'var(--primary)' }}>
                                View profile ↗
                              </Link>
                            )}
                            {bid.tasker?.profile?.rating_average > 0 && (
                              <span className="text-xs font-semibold" style={{ color: '#b45309', background: '#fffbeb', padding: '2px 6px', borderRadius: 6 }}>{parseFloat(bid.tasker.profile.rating_average).toFixed(1)}
                              </span>
                            )}
                            {bid.status === 'rejected' && (
                              <span className='badge badge-gray' style={{ fontSize: 11 }}>declined</span>
                            )}
                          </div>
                          <p className="font-black text-lg" style={{ color: 'var(--primary)' }}>{money(bid.workmanship_price)}</p>
                          <div className="flex gap-3 mt-1 flex-wrap" style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {bid.tasker?.profile?.task_city && <span>{bid.tasker.profile.task_city}</span>}
                            {bid.tasker?.profile?.total_tasks_completed > 0 && <span>{bid.tasker.profile.total_tasks_completed} tasks done</span>}
                          </div>
                          {bid.tasker?.profile?.skills?.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {bid.tasker.profile.skills.slice(0, 4).map(s => (
                                <span key={s} style={{ fontSize: 11, background: 'var(--surface)', color: 'var(--muted)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>{s}</span>
                              ))}
                            </div>
                          )}
                          {bid.tasker?.profile?.bio && (
                            <p className="text-xs mt-2 italic" style={{ color: 'var(--muted)', lineHeight: 1.5, borderLeft: '2px solid var(--border)', paddingLeft: 8 }}>
                              {bid.tasker.profile.bio.length > 120 ? bid.tasker.profile.bio.substring(0, 120) + '…' : bid.tasker.profile.bio}
                            </p>
                          )}
                          {bid.message && <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>"{bid.message}"</p>}
                        </div>
                        {(() => {
                          const closed = ['completed', 'cancelled', 'disputed'].includes(taskDetail.status);
                          const isChosen = taskDetail.accepted_tasker_id && bid.tasker?.id === taskDetail.accepted_tasker_id;
                          const someoneChosen = !!taskDetail.accepted_tasker_id;
                          const locked = !!taskDetail.is_funded;          // paid → tasker can't change
                          if (closed || bid.status === 'rejected') return null;
                          return (
                            <div className="flex flex-col gap-2 flex-shrink-0" style={{ minWidth: 150 }}>
                              {isChosen && <span className="badge badge-green text-center" style={{ fontSize: 11 }}>✓ Chosen tasker</span>}
                              <button onClick={() => chatWithBidder(taskDetail.id, bid.id)} disabled={chatting === bid.id}
                                className="btn-ghost btn-sm border flex items-center justify-center gap-1.5" style={{ borderColor: 'var(--border)' }}>
                                <MessageSquare size={13} /> {chatting === bid.id ? 'Opening…' : 'Chat'}
                              </button>
                              {!isChosen && !locked && (
                                <button onClick={() => acceptBid(taskDetail.id, bid.id)} disabled={!!accepting} className="btn-primary btn-sm">
                                  {accepting === bid.id ? 'Choosing…' : someoneChosen ? 'Switch to this tasker' : 'Choose this tasker'}
                                </button>
                              )}
                              {isChosen && !locked && (
                                <button
                                  onClick={() => { setFundingTask(taskDetail); setFundAmount(bid.workmanship_price || ''); }}
                                  className="btn-sm font-bold flex items-center justify-center gap-1.5" style={{ background: '#16a34a', color: 'white', borderRadius: 10, padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                                  <CreditCard size={13} /> Pay {money(bid.workmanship_price)}
                                </button>
                              )}
                              {!locked && (
                                <button onClick={() => rejectBid(taskDetail.id, bid.id, isChosen)} disabled={!!rejecting} className="btn-ghost btn-sm" style={{ color: '#b91c1c' }}>
                                  {rejecting === bid.id ? '…' : isChosen ? 'Remove tasker' : 'Decline'}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel task — behaviour depends on status */}
            {['open', 'bidding'].includes(taskDetail.status) && (
              <div className="card p-5" style={{ border: '1px solid #fecdd3' }}>
                <p className="font-bold text-sm mb-1" style={{ color: '#c41445' }}>Cancel this task?</p>
                <p className="text-xs mb-3" style={{ color: '#c41445', lineHeight: 1.6 }}>
                  No tasker has been assigned yet, so you can cancel right away. The task will be closed and removed from Browse Tasks. Any taskers who bid will be notified.
                </p>
                {cancelTask?.id === taskDetail.id ? (
                  <div className="flex gap-3">
                    <button onClick={handleDirectCancel} disabled={cancelLoading}
                      style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Task'}
                    </button>
                    <button onClick={() => { setCancelTask(null); setCancelReason(''); }} className="btn-ghost btn-sm">Never mind</button>
                  </div>
                ) : (
                  <button onClick={() => setCancelTask(taskDetail)}
                    style={{ background: 'white', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    Cancel Task
                  </button>
                )}
              </div>
            )}

            {/* Cancel ongoing task — needs tasker approval */}
            {taskDetail.status === 'ongoing' && (
              <div className="card p-5" style={{ border: '1px solid #fecdd3' }}>
                <p className="font-bold text-sm mb-1" style={{ color: '#c41445' }}>Need to cancel this task?</p>
                <p className="text-xs mb-3" style={{ color: '#c41445', lineHeight: 1.6 }}>
                  A tasker is already working on this task, so cancellation requires the tasker's approval. If they approve, any funded payment will be automatically refunded to you.
                </p>
                {cancelTask?.id === taskDetail.id ? (
                  <div className="space-y-3">
                    <textarea rows={3} placeholder="Explain why you need to cancel (required by tasker to decide)..." value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                      className="input resize-none text-sm" />
                    <div className="flex gap-3">
                      <button onClick={handleCancelRequest} disabled={cancelLoading}
                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                        {cancelLoading ? 'Sending...' : 'Send Cancel Request'}
                      </button>
                      <button onClick={() => { setCancelTask(null); setCancelReason(''); }} className="btn-ghost btn-sm">Never mind</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setCancelTask(taskDetail)}
                    style={{ background: 'white', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    Request Cancellation
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx('px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all',
              filter === f ? 'text-white shadow-sm' : 'bg-white border text-gray-500 hover:border-rose-200')}
            style={filter === f ? { background: 'var(--loveeu-rose)', border: 'none' } : { borderColor: 'var(--border)' }}>
            {f === 'all' ? 'All Tasks' : STATUS_LABELS[f] || f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <Search size={48} className="text-gray-200 mb-3 mx-auto" />
          <p className="font-bold text-gray-700">No tasks here</p>
          <p className="text-gray-400 text-sm mt-1">Try a different filter or post a new task</p>
        </div>
      ) : filtered.map(task => (
        <div key={task.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={clsx('badge', STATUS_COLORS[task.status] || 'badge-gray')}>{STATUS_LABELS[task.status] || task.status}</span>
                {task.is_funded && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Funded</span>}
              </div>
              <h4 className="font-bold text-gray-900 text-base mt-1">{task.title}</h4>
              {taskPrice(task) && <p className="font-black text-lg mt-0.5" style={{ color: 'var(--primary)' }} data-testid="list-price">{money(taskPrice(task))}</p>}
              <p className="text-sm text-gray-400 mt-0.5">
                {task.task_city} · Due {task.deadline ? formatDistanceToNow(new Date(task.deadline), { addSuffix: true }) : 'No deadline'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button onClick={() => openDetail(task)} className="btn-ghost btn-sm border" style={{ borderColor: 'var(--border)' }}>
                View Details
              </button>
              {task.status === 'ongoing' && (
                <button onClick={() => onOpenChat?.(task)} className="btn-primary btn-sm flex items-center gap-1.5">
                  <MessageSquare size={13} /> Chat
                </button>
              )}
              {/* Fund Task — prominent call to action for unfunded ongoing tasks */}
              {task.status === 'ongoing' && !task.is_funded && (
                <button
                  onClick={() => { openDetail(task); setFundingTask(task); setFundAmount(taskPrice(task) || ''); }}
                  className="btn-sm font-bold flex items-center gap-1.5" style={{ background: '#16a34a', color: 'white', borderRadius: 12, padding: '8px 14px', border: 'none', cursor: 'pointer' }}>
                  <CreditCard size={13} /> Fund Task
                </button>
              )}
              {task.status === 'ongoing' && task.is_funded && (
                <button onClick={() => openDetail(task)} className="btn-sm font-bold" data-testid="release-payment-btn"
                  style={{ background: '#0ea5e9', color: 'white', borderRadius: 12, padding: '8px 14px', border: 'none', cursor: 'pointer' }}>
                  Rate & release payment →
                </button>
              )}
              {task.status === 'ongoing' && task.accepted_tasker_id && (
                <button onClick={() => { openDetail(task); setTimeout(() => document.getElementById('add-money')?.scrollIntoView({ behavior: 'smooth' }), 900); }}
                  className="btn-sm font-bold" data-testid="add-money-btn" title="Sudden unforeseen cost? Add money so your tasker can withdraw it."
                  style={{ background: 'white', color: 'var(--primary)', border: '1px solid #ffd1dc', borderRadius: 12, padding: '8px 14px', cursor: 'pointer' }}>
                  Add money for tasker
                </button>
              )}
              {['open', 'bidding'].includes(task.status) && (
                <button
                  onClick={() => setDeleteConfirm(task)}
                  className="btn-ghost btn-sm flex items-center gap-1.5" style={{ color: '#ef4444', borderColor: '#fecaca' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </div>
          {/* Fund Task inline prompt for unfunded ongoing tasks */}
          {task.status === 'ongoing' && !task.is_funded && (
            <div className="mt-3 p-3 rounded-xl flex items-center gap-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CreditCard size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#14532d' }}>Task not yet funded</p>
                <p className="text-xs" style={{ color: '#166534' }}>Pay the agreed amount to activate the task. Your money is held in escrow until completion.</p>
              </div>
              <button
                onClick={() => { openDetail(task); setFundingTask(task); setFundAmount(taskPrice(task) || ''); }}
                className="btn-sm flex-shrink-0" style={{ background: '#16a34a', color: 'white', borderRadius: 10, padding: '6px 14px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                Pay Now →
              </button>
            </div>
          )}
          {task.bids && task.bids[0]?.count > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm text-gray-500"><strong className="text-gray-700">{task.bids[0].count}</strong> bid{task.bids[0].count !== 1 ? 's' : ''}</span>
              <button onClick={() => openDetail(task)} className="text-sm font-semibold ml-auto" style={{ color: 'var(--loveeu-rose)' }}>Review Bids →</button>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* ── Delete Confirmation Modal ── */}
    {deleteConfirm && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <h3 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Delete Task?</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            This will remove the task from Browse Tasks. Any taskers who bid will be notified. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1" disabled={deleting}>Keep Task</button>
            <button onClick={handleDeleteTask} disabled={deleting}
              style={{ flex: 1, padding: '10px 20px', borderRadius: 12, border: 'none', background: deleting ? '#fca5a5' : '#ef4444', color: 'white', fontWeight: 700, fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Trash2 size={14} />
              {deleting ? 'Deleting…' : 'Yes, Delete Task'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/* ── Messages ─────────────────────────────────────────────────── */
function Messages({ rooms, selectedRoom, setSelectedRoom }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4" style={{ height: 'calc(100vh - 140px)' }}>
      <div className={clsx(
        'w-full sm:w-80 card overflow-hidden flex-shrink-0 flex-col',
        selectedRoom ? 'hidden sm:flex' : 'flex')}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-black text-gray-900">Messages</h3>
          <p className="text-xs text-gray-400 mt-0.5">{rooms.length} conversation{rooms.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="overflow-y-auto flex-1">
          {rooms.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-600 text-sm">No chats yet</p>
              <p className="text-xs text-gray-400 mt-1">Accept a bid to start chatting with a tasker</p>
            </div>
          ) : rooms.map(room => {
            const partner = room.tasker;
            const lastMsg = room.last_message?.[0];
            return (
              <button key={room.id} onClick={() => setSelectedRoom(room)}
                className={clsx('w-full flex items-start gap-3 p-4 border-b text-left transition-colors',
                  selectedRoom?.id === room.id ? 'bg-rose-50' : 'hover:bg-gray-50')}
                style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: 'var(--loveeu-rose)' }}>
                  {partner?.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-800 truncate">{partner?.full_name}</p>
                    {lastMsg && <span className="text-xs text-gray-400 flex-shrink-0">{formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })}</span>}
                  </div>
                  {(room.display_title || room.task?.title) && (
                    <p className="text-xs text-gray-400 truncate">{room.display_title || room.task?.title}</p>
                  )}
                  {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content || 'File'}</p>}
                  {room.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-black mt-1" style={{ background: 'var(--loveeu-rose)' }}>{room.unread_count}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className={clsx('flex-1 min-w-0', !selectedRoom && 'hidden sm:block')}>
        {selectedRoom ? (
          <ChatWindow room={selectedRoom} onClose={() => setSelectedRoom(null)} />
        ) : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-gray-700 text-lg">Pick a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Select from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payments ─────────────────────────────────────────────────── */
function Payments({ payments, refunds, tasks, onRefundRequest }) {
  const [tab, setTab] = useState('history');
  const [refundForm, setRefundForm] = useState({ task_id: '', amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  // ── Advance approval state ──
  const [pendingAdvances, setPendingAdvances] = useState([]);
  const [advancesLoading, setAdvancesLoading] = useState(false);

  const loadAdvances = () => {
    setAdvancesLoading(true);
    paymentsApi.getPendingAdvances()
      .then(r => setPendingAdvances(r.data.advances || []))
      .catch(() => {})
      .finally(() => setAdvancesLoading(false));
  };

  // Escrow balances per task (funded − advances), from the server's single calculator.
  const [escrowRows, setEscrowRows] = useState([]);
  const loadEscrow = () => paymentsApi.escrow()
    .then(r => setEscrowRows(r.data.escrow || []))
    .catch(() => {});

  useEffect(() => { loadAdvances(); loadEscrow(); }, []);

  // Auto-switch tab if there are pending advance requests
  useEffect(() => {
    if (pendingAdvances.length > 0 && tab === 'history') setTab('advance-approvals');
  }, [pendingAdvances.length]);

  const fundedTasks = tasks?.filter(t => t.is_funded || t.status === 'completed') || [];

  const submitRefund = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!refundForm.task_id) { toast.error('Please select a task'); return; }
    setSubmitting(true);
    try {
      await paymentsApi.requestRefund(refundForm);
      toast.success('Refund request submitted! The tasker will be notified.');
      onRefundRequest();
      setRefundForm({ task_id: '', amount: '', reason: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Request failed. Try again.'); }
    finally { setSubmitting(false); }
  };

  // Largest amount the requester may approve for this request.
  const TABS = [
    { id: 'history', label: 'Payment History' },
    { id: 'advance-approvals', label: pendingAdvances.length > 0 ? `Advance Requests (${pendingAdvances.length})` : 'Advance Requests' },
    { id: 'refunds', label: 'Refund Requests' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('px-5 py-2.5 rounded-2xl text-sm font-bold transition-all', tab === id ? 'text-white shadow' : 'bg-white border text-gray-500')}
            style={tab === id ? { background: 'var(--loveeu-rose)' } : { borderColor: 'var(--border)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' && escrowRows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-black text-gray-900">Escrow Balances</h3>
            <p className="text-xs text-gray-400 mt-1">What you paid in, minus any advance paid to the tasker.</p>
          </div>
          {escrowRows.map(e => {
            const advance = e.advance_withdrawn + (e.task_status === 'ongoing' ? e.advance_approved : 0);
            const state = e.payout_status === 'withdrawn' ? 'Paid to tasker' : e.task_status === 'completed' ? 'Released to tasker' : e.task_status === 'cancelled' ? 'Cancelled' : 'Held in escrow';
            return (
              <div key={e.task_id} className="px-5 py-4 border-b flex items-start justify-between gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{e.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Paid {money(e.funded)}
                    {advance > 0 && <> · Advance to tasker <span className="text-rose-600">−{money(advance)}</span></>}
                    {' '}· <strong className="text-gray-800">Balance {money(e.remaining)}</strong>
                  </p>
                  {e.task_status !== 'ongoing' && e.advance_approved > 0 && (
                    <p className="text-xs text-gray-500 mt-1">The {money(e.advance_approved)} advance you approved was not withdrawn, so it is paid as part of the final balance.</p>
                  )}
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">{state}</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-black text-gray-900">Payment History</h3>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state"><p className="font-semibold text-gray-500">No payments yet</p></div>
          ) : payments.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border)' }}>
              <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0', p.status === 'completed' ? 'bg-emerald-50' : 'bg-gray-50')}>
                {p.status === 'completed' ? <CheckSquare size={18} className="text-emerald-600" /> : <RefreshCw size={18} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 capitalize">{p.payment_type} payment</p>
                <p className="text-sm text-gray-400 truncate">{p.task?.title || 'General'} · {(p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : '—')}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-gray-900">{money(p.amount)}</p>
                <span className={clsx('text-xs font-semibold', p.status === 'completed' ? 'text-emerald-600' : 'text-amber-500')}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'advance-approvals' && (
        <div className="space-y-4">
          {/* Explainer for requester */}
          <div className="card p-5" style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
            <h3 className="font-black text-blue-900 text-base mb-2">💡 Advance requests are answered inside each task</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2"><span className="font-bold flex-shrink-0">•</span><span>Your tasker may need an advance from the escrowed payment to buy <strong>equipment, materials, or cover transport costs</strong> before completing the task.</span></li>
              <li className="flex gap-2"><span className="font-bold flex-shrink-0">•</span><span>They can request <strong>up to 50%</strong> of the amount you paid into escrow. You can approve the full amount or <strong>adjust it to a lower amount</strong>.</span></li>
              <li className="flex gap-2"><span className="font-bold flex-shrink-0">•</span><span>Once you approve, the tasker can withdraw the advance to their bank. It is <strong>deducted from your escrow</strong> — for example {money(200)} paid less a {money(100)} advance leaves a {money(100)} balance, held securely and released only when the task is completed.</span></li>
              <li className="flex gap-2"><span className="font-bold flex-shrink-0">•</span><span>If you are not comfortable, you can <strong>reject the request</strong> and discuss with the tasker via chat.</span></li>
            </ul>
          </div>

          {advancesLoading && pendingAdvances.length === 0 ? (
            <div className="card p-8 text-center"><div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto" /></div>
          ) : pendingAdvances.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckSquare size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-600">No pending advance requests</p>
              <p className="text-sm text-gray-400 mt-1">When your tasker requests an advance, it will appear here for your review.</p>
            </div>
          ) : (
            <div className="card overflow-hidden" style={{ border: '2px solid #fde68a' }}>
              {pendingAdvances.map(adv => (
                <div key={adv.id} className="p-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: '#fef3c7', background: '#fffbeb' }}>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {adv.tasker?.avatar_url
                      ? <img src={adv.tasker.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="font-black text-amber-700">{adv.tasker?.full_name?.[0] || sym()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{adv.tasker?.full_name || 'Your tasker'} asks for {money(adv.requested_amount)}</p>
                    <p className="text-sm text-gray-500 truncate">Task: {adv.task?.title || adv.escrow?.title}{adv.note ? ` — “${adv.note}”` : ''}</p>
                  </div>
                  <button onClick={() => requestOpenTask('requester', adv.task_id)} className="btn-primary btn-sm">Review in task →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'refunds' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-black text-gray-900 mb-4">Request a Refund</h3>
            <form onSubmit={submitRefund} className="space-y-4">
              <div><label className="label">Task ID</label><input type="text" required placeholder="Paste the task ID here" value={refundForm.task_id} onChange={e => setRefundForm({...refundForm, task_id: e.target.value})} className="input" /></div>
              <div><label className="label">Amount ({sym()})</label><input type="number" required min={1} placeholder="0" value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: e.target.value})} className="input" /></div>
              <div><label className="label">Reason for refund</label><textarea required rows={3} placeholder="Tell us what happened and why you need a refund..." value={refundForm.reason} onChange={e => setRefundForm({...refundForm, reason: e.target.value})} className="input resize-none" /></div>
              <button type="submit" disabled={submitting} className="btn-primary btn-sm">
                {submitting ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </form>
          </div>
          <div className="card overflow-hidden">
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-black text-gray-900">Your Refund Requests</h3>
            </div>
            {refunds.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No refund requests yet</div>
            ) : refunds.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{r.task?.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{r.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-gray-900">{money(r.amount)}</p>
                  <span className={clsx('text-xs font-semibold capitalize', r.status === 'completed' ? 'text-emerald-600' : r.status === 'rejected' ? 'text-red-500' : 'text-amber-500')}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/* ── Profile ──────────────────────────────────────────────────── */
function ProfileTab({ user, profile, onUpdate }) {
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const { refreshProfile } = useAuth();

  useEffect(() => { setAvatarPreview(user?.avatar_url || null); }, [user?.avatar_url]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await authApi.uploadAvatar(fd);
      await refreshProfile();
      toast.success('Profile picture updated!');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload photo. Check Cloudinary is configured.');
      setAvatarPreview(user?.avatar_url || null);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const [form, setForm] = useState({
    full_name: user?.full_name || '', phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  // Bank details state (with auto-verification)
  const [bankForm, setBankForm] = useState({
    bank_name: profile?.bank_name || '',
    bank_code: profile?.bank_code || '',
    account_number: profile?.bank_account_number || '',
    account_name: profile?.bank_account_name || '',
  });
  const [banks, setBanks] = useState([]);
  const [verifying, setVerifying] = useState(false);
  // Pre-verified if profile already has all bank fields saved
  const [verified, setVerified] = useState(
    !!(profile?.bank_account_name && profile?.bank_account_number && profile?.bank_name)
  );
  const [savingBank, setSavingBank] = useState(false);
  const [bankEdited, setBankEdited] = useState(false);

  // Load banks list on mount
  useEffect(() => {
    authApi.getBanks(getFlutterwaveBankCountry(user?.country || 'NG')).then(({ data }) => setBanks(data.banks || [])).catch(() => {});
  }, []);

  // Sync bankForm whenever profile prop is refreshed (e.g. after save → reload)
  useEffect(() => {
    if (!profile) return;
    setBankForm({
      bank_name: profile.bank_name || '',
      bank_code: profile.bank_code || '',
      account_number: profile.bank_account_number || '',
      account_name: profile.bank_account_name || '',
    });
    setVerified(!!(profile.bank_account_name && profile.bank_account_number && profile.bank_name));
    setBankEdited(false);
  }, [profile]);

  // Auto-verify when account_number is 10 digits and bank_code is selected,
  // but ONLY if the user has actually changed something (not on initial load)
  useEffect(() => {
    if (!bankEdited) return;
    if (bankForm.account_number.length === 10 && bankForm.bank_code) {
      verifyAccount();
    } else {
      setBankForm(f => ({ ...f, account_name: '' }));
      setVerified(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankForm.account_number, bankForm.bank_code]);

  const verifyAccount = async () => {
    setVerifying(true);
    setVerified(false);
    setBankForm(f => ({ ...f, account_name: '' }));
    try {
      const { data } = await authApi.resolveAccount({
        account_number: bankForm.account_number,
        bank_code: bankForm.bank_code,
        country: getFlutterwaveBankCountry(user?.country || 'NG'),
      });
      setBankForm(f => ({ ...f, account_name: data.account_name }));
      setVerified(true);
      toast.success(`Account verified: ${data.account_name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify account');
    } finally { setVerifying(false); }
  };

  const saveBank = async () => {
    if (!verified) { toast.error('Please verify your account number first'); return; }
    setSavingBank(true);
    try {
      await taskersApi.updateBankDetails({
        bank_name: bankForm.bank_name,
        bank_code: bankForm.bank_code,
        bank_account_number: bankForm.account_number,
        country: getFlutterwaveBankCountry(user?.country || 'NG'),
      });
      await refreshProfile();
      toast.success('Bank details saved!');
    } catch { toast.error('Could not save bank details.'); }
    finally { setSavingBank(false); }
  };

  const selectedBank = banks.find(b => b.code === bankForm.bank_code);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ full_name: form.full_name, phone: form.phone });
      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch { toast.error('Could not save changes. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white overflow-hidden" style={{ background: 'var(--loveeu-rose)' }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : (user?.full_name?.[0] || 'R')}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--rose)', color: 'white' }}
              title="Change profile picture">
              {avatarUploading ? <RefreshCw size={10} className="animate-spin" /> : <Camera size={10} />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-xl">{user?.full_name}</h3>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Personal Info</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name</label><input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="input" /></div>
            <div><label className="label">Phone Number</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
          </div>
          <div><label className="label">Email Address</label><input value={user?.email} disabled className="input opacity-60 cursor-not-allowed" /></div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary btn-sm mt-5">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {activeMarket().slug ? (
        <div className="card p-6">
          <h4 className="font-black text-gray-900 mb-1">Refunds</h4>
          <p className="text-sm text-gray-500">Approved refunds go back to the card you paid with, in {activeMarket().currency}. Card refunds usually show within 5 to 10 business days, depending on your bank.</p>
        </div>
      ) : (
      <div className="card p-6">
        <h4 className="font-black text-gray-900 mb-1">Bank Details <span className="text-sm font-normal text-gray-400">(for refunds)</span></h4>
        <p className="text-sm text-gray-400 mb-4">Select your bank and enter your 10-digit account number — we'll verify your name automatically.</p>

        {/* Bank selector */}
        <div className="space-y-4">
          <div>
            <label className="label">Bank</label>
            <select
              className="input" value={bankForm.bank_code}
              onChange={e => {
                const bank = banks.find(b => b.code === e.target.value);
                setBankEdited(true);
                setBankForm(f => ({ ...f, bank_code: e.target.value, bank_name: bank?.name || '' }));
              }}
            >
              <option value="">Select your bank...</option>
              {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Account Number</label>
            <div className="relative">
              <input
                type="text" inputMode="numeric" maxLength={10} className="input pr-10" placeholder="10-digit account number" value={bankForm.account_number}
                onChange={e => { setBankEdited(true); setBankForm(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '') })); }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {verifying && <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--muted)' }} />}
                {!verifying && verified && <CheckSquare size={16} style={{ color: '#00C37E' }} />}
              </span>
            </div>
          </div>

          {verified && bankForm.account_name && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#15803d' }}>Account Verified</p>
              <p className="font-black text-base" style={{ color: '#166534' }}>{bankForm.account_name}</p>
              {selectedBank && <p className="text-xs" style={{ color: '#15803d' }}>{selectedBank.name}</p>}
            </div>
          )}

          {verifying && (
            <p className="text-sm text-gray-400">Verifying account name via Flutterwave...</p>
          )}

          {!verified && bankForm.account_number.length > 0 && bankForm.account_number.length < 10 && (
            <p className="text-xs text-gray-400">{10 - bankForm.account_number.length} more digit{10 - bankForm.account_number.length !== 1 ? 's' : ''} needed</p>
          )}
        </div>

        <button
          onClick={saveBank}
          disabled={savingBank || !verified}
          className="btn-primary btn-sm mt-5" style={{ opacity: !verified ? 0.5 : 1 }}
        >
          {savingBank ? 'Saving...' : 'Save Bank Details'}
        </button>
      </div>
      )}

      {/* Username */}
      <div className="card p-6">
        <h4 className="font-bold text-gray-900 mb-1">Username</h4>
        <p className="text-sm text-gray-400 mb-4">Your public @handle visible to taskers.</p>
        <RequesterUsernamePassword user={user} onUpdate={onUpdate} />
      </div>
    </div>
  );
}


/* ── Account Settings for Requester ─────────────────────────── */
function RequesterUsernamePassword({ user, onUpdate }) {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [savingUser, setSavingUser] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const saveUsername = async () => {
    if (!username.trim()) { toast.error('Username cannot be empty'); return; }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) { toast.error('Username: 3-30 chars, letters/numbers/underscore only'); return; }
    setSavingUser(true);
    try {
      await authApi.updateProfile({ username: username.toLowerCase().trim() });
      await refreshProfile();
      toast.success('Username updated!');
      onUpdate?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not update username'); }
    finally { setSavingUser(false); }
  };

  const savePassword = async () => {
    if (!oldPw || !newPw) { toast.error('Fill in both passwords'); return; }
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword({ old_password: oldPw, new_password: newPw });
      toast.success('Password changed!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not change password'); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="space-y-5">
      {/* Username */}
      <div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">@</span>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="yourhandle" className="input pl-8" maxLength={30} />
          </div>
          <button onClick={saveUsername} disabled={savingUser} className="btn-primary btn-sm">
            {savingUser ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div>
        <h4 className="font-bold text-gray-900 mb-1">Change Password</h4>
        <p className="text-sm text-gray-400 mb-3">Choose a strong password you don't use elsewhere.</p>
        <div className="space-y-3">
          <div className="relative">
            <input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)}
              placeholder="Current password" className="input pr-14" />
            <button type="button" onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{showOld ? 'Hide' : 'Show'}</button>
          </div>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="New password (min 8 chars)" className="input pr-14" />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{showNew ? 'Hide' : 'Show'}</button>
          </div>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            placeholder="Confirm new password" className="input" />
          <button onClick={savePassword} disabled={savingPw} className="btn-primary btn-sm w-full">
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Post Task Panel (inline in RequesterDashboard) ─────────────── */
function PostTaskPanel({ onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    task_type: '', from_address: '', from_city: '', from_state: '',
    to_address: '', to_city: '', to_state: '',
    task_city: '', task_state: '', task_full_address: '',
    title: '', description: '', ...emptyCosts(), deadline: '',
    item_to_buy: '', special_instructions: '', is_remote: false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  // Tasks are posted in the requester's own country (the dashboard always opens there).
  const mk = activeMarket();
  const intl = !!mk.slug;
  const countryContent = useCountryContent(mk.slug || 'none');
  const remote = !!form.is_remote;
  const setRemote = (on) => setForm(f => ({ ...f, is_remote: on, task_type: on ? 'general' : (f.is_remote ? '' : f.task_type) }));

  const TASK_TYPES = [
    { value: 'pickup_delivery', Icon: Truck,        title: 'Pickup & Delivery',  desc: 'Pick up and deliver between locations.' },
    { value: 'location_only',   Icon: MapPin,        title: 'On-Location Only',   desc: 'Task at a specific location.' },
    { value: 'purchase_ship',   Icon: ShoppingCart,  title: 'Purchase & Ship',    desc: 'Buy something and ship to you.' },
    { value: 'general',         Icon: Zap,           title: 'General Errand',     desc: 'Queue, collect, verify, or other.' },
  ];
  const STEPS = ['Task Type', 'Location', 'Details', 'Costs & Deadline', 'Review'];
  const NIGERIAN_STATES = intl ? (countryContent?.regions || []) : getStates('NG');

  const canProceed = () => {
    if (step === 0) return !!form.task_type;
    if (step === 1 && remote) return true;
    if (step === 1) return form.task_type === 'pickup_delivery'? (form.from_city && form.from_state && form.to_city && form.to_state)
      : (form.task_city && form.task_state);
    if (step === 2) return form.title.trim().length >= 5 && form.description.trim().length >= 10;
    if (step === 3) return costsValid(form) && !!form.deadline;
    return true;
  };

  const resetForm = () => {
    setSubmitted(false); setStep(0);
    setForm({ task_type:'', from_address:'', from_city:'', from_state:'', to_address:'', to_city:'', to_state:'', task_city:'', task_state:'', task_full_address:'', title:'', description:'', ...emptyCosts(), deadline:'', item_to_buy:'', special_instructions:'', is_remote: false });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const rest = form; // cost_* fields: the server sums them into the single task price
      const payload = {
        ...rest,
        // Backend requires task_city/task_state to always be present (NOT NULL).
        // For pickup_delivery the form only collects from_/to_ locations, so
        // fall back to the pickup location for matching/notifications.
        task_city: form.task_type === 'pickup_delivery' ? form.from_city : form.task_city,
        task_state: form.task_type === 'pickup_delivery' ? form.from_state : form.task_state,
        // Single total too (the server recomputes it from the breakdown when it can).
        budget_min: costTotal(form),
        budget_max: costTotal(form),
        country: mk.code,
        is_remote: remote,
      };
      if (remote) { payload.task_type = 'general'; payload.task_city = ''; payload.task_full_address = ''; }
      await tasksApi.create(payload);
      setSubmitted(true);
      toast.success('Task posted! Taskers will start bidding soon.');
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      const msg = err?.response?.data?.message
        || (Array.isArray(apiErrors) && apiErrors[0]?.msg)
        || 'Failed to post task';
      toast.error(msg);
    }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <CheckSquare size={34} style={{ color: 'var(--rose)' }} />
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.03em' }}>Task Posted!</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Taskers in your area will start bidding soon.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button onClick={resetForm} className="btn-ghost">Post Another</button>
        <button onClick={onSuccess} className="btn-primary">View My Tasks</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.03em' }}>Post a New Task</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Get bids from verified taskers near you</p>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 4, marginBottom: 5, background: i <= step ? 'var(--rose)' : 'var(--border-light)', transition: 'background 0.3s' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: i === step ? 'var(--rose)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s}</span>
          </div>
        ))}
      </div>

      <div className="card p-6" style={{ marginBottom: 20 }}>
        {step === 0 && (
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>Where will the work be done?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }} role="radiogroup" aria-label="In person or remote">
              {[[false, 'In person', 'A tasker comes to a place.'], [true, 'Remote (online)', 'Done online or by phone. No address.']].map(([on, title, desc]) => (
                <button key={title} type="button" role="radio" aria-checked={remote === on} onClick={() => setRemote(on)}
                  style={{ padding: '14px', borderRadius: 14, border: `2px solid ${remote === on ? 'var(--rose)' : 'var(--border-light)'}`, background: remote === on ? 'var(--rose-light)' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</p>
                </button>
              ))}
            </div>
            {!remote && <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>What type of task?</p>}
            {!remote && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TASK_TYPES.map(({ value, Icon, title, desc }) => (
                <button key={value} type="button" onClick={() => set('task_type', value)}
                  style={{ padding: '16px 14px', borderRadius: 14, border: `2px solid ${form.task_type === value ? 'var(--rose)' : 'var(--border-light)'}`, background: form.task_type === value ? 'var(--rose-light)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <Icon size={20} style={{ color: form.task_type === value ? 'var(--rose)' : 'var(--muted)', marginBottom: 8 }} />
                  <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</p>
                </button>
              ))}
            </div>}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{remote ? 'Remote task' : 'Where is the task?'}</p>
            {remote ? (
              <>
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>No address needed. Taskers anywhere in {intl ? mk.name : 'Nigeria'} can bid.</p>
                <div><label className="label">{intl ? mk.regionLabel : 'State'} (optional)</label><select className="input" value={form.task_state} onChange={e => set('task_state', e.target.value)}><option value="">Anywhere</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
              </>
            ) : form.task_type === 'pickup_delivery' ? (
              <>
                <div><label className="label">Pickup Address</label><input className="input" placeholder="Full pickup address" value={form.from_address} onChange={e => set('from_address', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label className="label">Pickup City</label><input className="input" placeholder="e.g. Ikeja" value={form.from_city} onChange={e => set('from_city', e.target.value)} /></div>
                  <div><label className="label">State</label><select className="input" value={form.from_state} onChange={e => set('from_state', e.target.value)}><option value="">Select</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
                <div><label className="label">Delivery Address</label><input className="input" placeholder="Full delivery address" value={form.to_address} onChange={e => set('to_address', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label className="label">Delivery City</label><input className="input" placeholder="e.g. Lekki" value={form.to_city} onChange={e => set('to_city', e.target.value)} /></div>
                  <div><label className="label">State</label><select className="input" value={form.to_state} onChange={e => set('to_state', e.target.value)}><option value="">Select</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
              </>
            ) : (
              <>
                <div><label className="label">Task Address</label><input className="input" placeholder="Address or landmark" value={form.task_full_address} onChange={e => set('task_full_address', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label className="label">City</label><input className="input" placeholder="e.g. Lagos Island" value={form.task_city} onChange={e => set('task_city', e.target.value)} /></div>
                  <div><label className="label">State</label><select className="input" value={form.task_state} onChange={e => set('task_state', e.target.value)}><option value="">Select</option>{NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Task details</p>
            <div><label className="label">Task Title</label><input className="input" placeholder="e.g. Pick up documents from VI" value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div><label className="label">Description</label><textarea rows={4} className="input resize-none" placeholder="Clear instructions for the tasker..." value={form.description} onChange={e => set('description', e.target.value)} /></div>
            {form.task_type === 'purchase_ship' && (
              <div><label className="label">Item to Purchase</label><input className="input" placeholder="What should the tasker buy?" value={form.item_to_buy} onChange={e => set('item_to_buy', e.target.value)} /></div>
            )}
            <div><label className="label">Special Instructions (optional)</label><input className="input" placeholder="Any extra info..." value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} /></div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Costs & Deadline</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -6 }}>Break the price into its parts. Taskers see one total, and you pay that total into escrow once you choose a tasker.</p>
            <CostFields value={form} onChange={(next) => setForm(f => ({ ...f, ...next }))} />
            <div>
              <label className="label">Deadline</label>
              <input type="datetime-local" className="input" value={form.deadline} onChange={e => set('deadline', e.target.value)} min={new Date().toISOString().slice(0,16)} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>Review & Post</p>
            {[
              ['Task Type', remote ? 'Remote (online)' : TASK_TYPES.find(t => t.value === form.task_type)?.title],
              ['Title', form.title], ['Description', form.description],
              ['Location', remote ? 'Remote' : form.task_city ? `${form.task_city}, ${form.task_state}` : form.from_city ? `${form.from_city} → ${form.to_city}` : null],
              ['Workmanship', costNumber(form.cost_workmanship) ? naira(costNumber(form.cost_workmanship)) : null],
              ['Transportation', costNumber(form.cost_transport) ? naira(costNumber(form.cost_transport)) : null],
              ['Waybill', costNumber(form.cost_waybill) ? naira(costNumber(form.cost_waybill)) : null],
              ['Items or equipment', costNumber(form.cost_items) ? naira(costNumber(form.cost_items)) : null],
              ['Total price', naira(costTotal(form))],
              ['Deadline', form.deadline ? new Date(form.deadline).toLocaleString(mk.locale) : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-2"><ArrowLeft size={14} /> Back</button>
          : <div />
        }
        {step < STEPS.length - 1
          ? <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="btn-primary disabled:opacity-40 flex items-center gap-2">Continue <ArrowRight size={14} /></button>
          : <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">{loading ? 'Posting…' : <><Zap size={15} /> Post Task</>}</button>
        }
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function RequesterDashboard() {
  const { user, profile } = useAuth();
  const [active, setActive] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    // Every sidebar tab is valid; older link names (used in notifications) map to the real tab.
    const ALIASES = { 'my-tasks': 'tasks', referrals: 'refer-wallet', earnings: 'payments' };
    const resolved = ALIASES[tab] || tab;
    return NAV.some(n => n.id === resolved) ? resolved : 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Links such as /requester?tab=tasks&task=<id> (notifications) open that
  // task's page — also when the dashboard is already on screen.
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskParam = params.get('task');
    const tab = params.get('tab');
    const ALIASES = { 'my-tasks': 'tasks', referrals: 'refer-wallet', earnings: 'payments' };
    const resolved = ALIASES[tab] || tab;
    if (taskParam) { setActive('tasks'); requestOpenTask('requester', taskParam); }
    else if (resolved && NAV.some(n => n.id === resolved)) setActive(resolved);
  }, [location.search]);
  useEffect(() => {
    const onOpen = (e) => { if (e.detail?.scope === 'requester') setActive('tasks'); };
    window.addEventListener('open-task', onOpen);
    return () => window.removeEventListener('open-task', onOpen);
  }, []);
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [tasksRes, roomsRes, paymentsRes, refundsRes] = await Promise.all([
        tasksApi.myRequesterTasks(),
        chatApi.getRooms(),
        paymentsApi.history(),
        paymentsApi.refunds(),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setRooms(roomsRes.data.rooms || []);
      setPayments(paymentsRes.data.payments || []);
      setRefunds(refundsRes.data.refunds || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading && tasks.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <>
      <SEO title="My Dashboard — Taskeeu" description="Manage your tasks, messages and payments on Taskeeu." />
      <ReviewGate />
      <div className="dash-wrapper">
        {/* Overlay */}
        {sidebarOpen && (
          <div className="dash-overlay lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <Sidebar
          active={active}
          setActive={setActive}
          user={user}
          isMobile={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main */}
        <div className="dash-main">
          <Topbar
            active={active}
            onMenuOpen={() => setSidebarOpen(true)}
            user={user}
            onRefresh={load}
            loading={loading}
            onTabChange={setActive}
          />
          <main className="dash-content page-enter">
            {active === 'post-task' && <PostTaskPanel onSuccess={() => { setActive('tasks'); load(); }} />}
            {active === 'overview'&& <Overview tasks={tasks} onTabChange={setActive} />}
            {active === 'tasks'&& <MyTasks tasks={tasks} onRefresh={load} onOpenChat={(task) => {
              // Open the chat with the CHOSEN tasker (a task can have several chats).
              const room = rooms.find(r => r.task_id === task.id && (!task.accepted_tasker_id || r.tasker_id === task.accepted_tasker_id))
                || rooms.find(r => r.task_id === task.id);
              if (room) { setSelectedRoom(room); setActive('chat'); }
              else { toast.error('No chat room for this task yet.'); }
            }} onOpenChatRoom={async (roomId) => {
              try {
                const { data } = await chatApi.getRooms();
                const list = data.rooms || [];
                setRooms(list);
                const room = list.find(r => r.id === roomId);
                if (room) { setSelectedRoom(room); setActive('chat'); }
              } catch { toast.error('Chat opened — find it under Messages.'); }
            }} />}
            {active === 'chat'&& <Messages rooms={rooms} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />}
            {active === 'payments'&& <Payments payments={payments} refunds={refunds} tasks={tasks} onRefundRequest={load} />}
            {active === 'refer-wallet' && <ReferWalletPanel />}
            {active === 'marketing'&& <MarketingPosterTab user={user} profile={profile} role="requester" />}
            {active === 'vooom'&& <VooomDashTab user={user} role="requester" />}
            {active === 'profile'&& <div className="space-y-5"><ProfileTab user={user} profile={profile} onUpdate={load} /><ReviewsReceived as="requester" /></div>}
            {active === 'support'&& <SupportWidget />}
          </main>
        </div>
      </div>
    </>
  );
}
