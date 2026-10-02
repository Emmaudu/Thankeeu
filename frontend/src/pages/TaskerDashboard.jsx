import { useCountryContent } from '../components/country/content';
import { cpath } from '../utils/market';
import { money, sym, activeMarket, minAmount } from '../utils/market';
import IntlPayoutCard from '../components/task/IntlPayoutCard';
import { useState, useEffect, useRef } from 'react';
import { CostBreakdown } from '../components/task/CostFields';
import { taskPrice } from '../utils/taskPrice';
import { createPortal } from 'react-dom';
import SEO from '../components/seo/SEO';
import ReferWalletPanel from '../components/ReferWalletPanel';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, RefreshCw, LayoutDashboard, ClipboardList, CheckSquare, Briefcase, Building2, Award, MessageSquare, DollarSign, User, LogOut, Banknote, Download, Star, Zap, Upload, Camera, CheckCircle, Gift, Megaphone, Navigation } from 'lucide-react';
import MarketingPosterTab from '../components/MarketingPosterTab';
import VooomDashTab, { SwitchToRequesterModal } from '../components/VooomDashTab';
import { tasksApi, taskersApi, chatApi, paymentsApi, enterpriseApi, authApi } from '../utils/api';
import { COUNTRIES, getStates, getFlutterwaveBankCountry } from '../utils/countryStates';
import EnterpriseCertification from '../components/ui/EnterpriseCertification';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ui/ChatWindow';
import SupportWidget from '../components/ui/SupportWidget';
import { ReviewGate, ReviewsReceived, RatingBadge, TaskReviews } from '../components/ui/Reviews';
import { taskerProfilePath, taskerProfileUrl } from '../utils/profileLink';
import { requestOpenTask, takePendingTask } from '../utils/openTask';
import { TaskerCompletionFlow, TaskAdvancePanel } from '../components/task/TaskWorkspace';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  open: 'badge-green', bidding: 'badge-yellow',
  ongoing: 'badge-blue', completed: 'badge-gray', cancelled: 'badge-red'
};
// NIGERIAN_STATES removed — use getStates('NG') from countryStates.js
const SKILLS_LIST = [
  'Delivery & Courier','Pickup & Drop-off','Errand Running','Shopping & Purchasing',
  'Queuing & Waiting','Physical Inspections','On-Site Verifications','Field Marketing',
  'Flyer & Pamphlet Distribution','Door-to-Door Campaigns','Bill Payment (NEPA/Utility)',
  'Government Office Visits','Document Collection & Submission','Moving & Relocation Help',
  'Cleaning & Housekeeping','Driving & Chauffeur','Event Support & Ushering',
  'Photography & Videography','Grocery & Market Runs','Medical Sample/Prescription Runs',
];

const NAV = [
  { id: 'overview',       Icon: LayoutDashboard,  label: 'Overview' },
  { id: 'browse',         Icon: Search,            label: 'Browse Tasks' },
  { id: 'my-tasks',       Icon: CheckSquare,       label: 'My Tasks' },
  { id: 'bids',           Icon: Briefcase,         label: 'My Bids' },
  { id: 'enterprise',     Icon: Building2,         label: 'Enterprise Tasks' },
  { id: 'certifications', Icon: Award,             label: 'Certifications' },
  { id: 'chat',           Icon: MessageSquare,     label: 'Messages' },
  { id: 'payments',       Icon: DollarSign,        label: 'Earnings' },
  { id: 'refer-wallet',   Icon: Gift,              label: 'Refer Wallet' },
  { id: 'marketing',      Icon: Megaphone,         label: 'Marketing' },
  { id: 'vooom',          Icon: Navigation,        label: 'Vooom' },
  { id: 'kyc',            Icon: Banknote,          label: 'KYC Verification' },
  { id: 'profile',        Icon: User,              label: 'My Profile' },
  { id: 'support',        Icon: MessageSquare,     label: 'Support' },
];

function Sidebar({ active, setActive, user, profile, isAvailable, onToggle, isMobile, onClose, pendingActionCount = 0 }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <aside className={clsx('dash-sidebar', isMobile && 'open')}>
      <div className="dash-sidebar-logo flex items-center justify-between">
        <Link to={cpath("/")} className="flex items-center gap-2">
          <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
          <span className="font-black text-white text-xl tracking-tight">Taskeeu</span>
        </Link>
        {isMobile && <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X size={20} /></button>}
      </div>

      {/* Tasker info */}
      <div className="mx-3 mt-4 mb-1 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 overflow-hidden" style={{ background: 'var(--primary)' }}>
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : (user?.full_name?.[0] || 'T')}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.full_name || 'Tasker'}</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}><Star size={11} style={{color:'#fbbf24'}} /> {parseFloat(profile?.rating_average || 0).toFixed(1)} · {profile?.total_tasks_completed || 0} tasks</p>
          </div>
        </div>
        {/* Availability toggle */}
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p className="text-xs font-bold" style={{ color: isAvailable ? '#33d99b' : 'rgba(255,255,255,0.4)' }}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{isAvailable ? 'Receiving tasks' : 'Hidden from search'}</p>
          </div>
          <button
            onClick={onToggle}
            className="toggle" data-on={String(isAvailable)}
            aria-label={isAvailable ? 'Go unavailable' : 'Go available'}
          />
        </div>
      </div>

      <nav className="dash-sidebar-nav">
        <p className="sidebar-section-label">Menu</p>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setActive(item.id); onClose?.(); }}
            className={clsx('sidebar-link', active === item.id && 'active')}>
            <span className="sidebar-icon"><item.Icon size={16} /></span>
            <span>{item.label}</span>
            {item.id === 'payments' && pendingActionCount > 0 && (
              <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                {pendingActionCount}
              </span>
            )}
          </button>
        ))}
        <div className="pt-6">
          <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
          {/* Switch to requester toggle — only shows if tasker has a dual account */}
          {user?.has_requester_account && (
            <button
              onClick={() => navigate(cpath('/requester'))}
              style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'9px 14px', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontWeight:700, fontSize:12.5, display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:15 }}></span> Switch to Requester
            </button>
          )}
          <button onClick={() => { logout(); navigate(cpath('/')); }} className="sidebar-link" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span className="sidebar-icon"><LogOut size={16} /></span><span>Log Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}

function Topbar({ active, onMenuOpen, onRefresh, loading, onTabChange }) {
  const label = NAV.find(n => n.id === active)?.label || 'Dashboard';
  return (
    <header className="dash-topbar">
      <div className="flex items-center gap-4">
        <button onClick={onMenuOpen} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
          <Menu size={22} />
        </button>
        <h1 className="font-black text-lg text-gray-900">{label}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className={clsx('p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500', loading && 'opacity-50 pointer-events-none')}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => onTabChange('browse')} className="btn-primary btn-sm hidden sm:flex">
          <Search size={16} /> Browse Tasks
        </button>
      </div>
    </header>
  );
}

/* ── Overview ────────────────────────────────────────────────── */
function Overview({ dashData, onTabChange, user }) {
  const { profile, pending_bids, active_tasks } = dashData;
  const stats = [
    { icon: 'check', value: profile?.total_tasks_completed || 0, label: 'Tasks Completed', bg: 'bg-emerald-50', val: 'text-emerald-700' },
    { icon: 'star', value: parseFloat(profile?.rating_average || 0).toFixed(1), label: 'Average Rating', bg: 'bg-amber-50', val: 'text-amber-700' },
    { icon: 'brief', value: pending_bids?.length || 0, label: 'Active Bids', bg: 'bg-blue-50', val: 'text-blue-700' },
    { icon: 'task', value: active_tasks?.length || 0, label: 'Ongoing Tasks', bg: 'bg-rose-50', val: 'text-rose-700' },
  ];

  // Profile link comes from the server (permanent /tasker/<name-slug>) and is
  // built for the site you're on — never a hard-coded domain.
  const [link, setLink] = useState(null);
  useEffect(() => {
    let alive = true;
    taskersApi.myProfileLink()
      .then(r => { if (alive) setLink(r.data); })
      .catch(() => {
        // Older server without the endpoint: fall back to username / id.
        if (alive) setLink({ path: taskerProfilePath({ username: user?.username, id: user?.id || profile?.user_id }), is_public: profile?.verification_status === 'approved' });
      });
    return () => { alive = false; };
  }, [user?.id]);
  const profileUrl = link?.path ? taskerProfileUrl(link.path) : null;
  const profileIsPublic = link?.is_public !== false;

  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Show pending review banner for taskers not yet approved */}
      {profile?.verification_status === 'pending' && (
        <div style={{ padding: '14px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⏳</span>
          <div>
            <p style={{ fontWeight: 800, color: '#92400e', marginBottom: 2 }}>Application Under Review</p>
            <p style={{ fontSize: 13, color: '#b45309', lineHeight: 1.6 }}>
              Our team is reviewing your application. You'll receive an email within 24–48 hours once a decision has been made. You can browse the platform while you wait.
            </p>
          </div>
        </div>
      )}
      {profile?.verification_status === 'rejected' && (
        <div style={{ padding: '14px 20px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16 }}>
          <p style={{ fontWeight: 800, color: '#c41445', marginBottom: 2 }}>Application Not Approved</p>
          <p style={{ fontSize: 13, color: '#c41445', lineHeight: 1.6 }}>Your tasker application was not approved. Please contact support for more information.</p>
        </div>
      )}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={clsx('stat-icon', s.bg)}>{s.icon === 'check' ? <CheckSquare size={18} className="text-emerald-600" /> : s.icon === 'star' ? <Star size={18} className="text-amber-600" /> : s.icon === 'brief' ? <Briefcase size={18} className="text-blue-600" /> : <ClipboardList size={18} className="text-rose-600" />}</div>
            <p className={clsx('stat-value', s.val)}>{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Profile Share Link ── */}
      {profileUrl && (
        <div className="card p-5" style={{ background: '#1a2e1a', border: '1px solid rgba(0,195,126,0.25)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm mb-1 flex items-center gap-2">
                <span style={{ fontSize: 18 }}></span> Your Tasker Profile Link
              </p>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Share this link with clients, post it on LinkedIn, add it to your CV — every visit builds your reputation.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-0" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}></span>
                  <span className="text-xs font-mono truncate" style={{ color: '#00C37E' }}>{profileUrl}</span>
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs flex-shrink-0 transition-all" style={{ background: copied ? 'rgba(0,195,126,0.2)' : '#00C37E', color: copied ? '#00C37E' : 'white', border: copied ? '1px solid #00C37E' : 'none' }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              {!profileIsPublic && (
                <p className="text-xs mt-2 font-semibold" style={{ color: '#fbbf24' }}>
                  Your profile becomes public once Taskeeu approves your account — until then this link shows a "not approved yet" message.
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <a href={profileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  ↗ View Profile
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
                  target="_blank" rel="noreferrer" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0077b5'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>Share on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {active_tasks?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-black text-gray-900 flex items-center gap-2"><ClipboardList size={16} /> Ongoing Tasks</h3>
            <button onClick={() => onTabChange('my-tasks')} className="text-sm font-semibold" style={{ color: 'var(--loveeu-rose)' }}>View All →</button>
          </div>
          {active_tasks.map(task => (
            <div key={task.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                <p className="text-sm text-gray-400">{task.task_city} · {task.deadline ? `Due ${formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}` : 'Flexible deadline'}</p>
                {task.deadline && new Date(task.deadline) < new Date() && (
                  <p style={{ fontSize: 12, color: '#b45309', fontWeight: 700, marginTop: 3 }}>
                    Deadline passed — chat the requester to request an extension
                  </p>
                )}
              </div>
              <button onClick={() => onTabChange('my-tasks')} className="btn-primary btn-sm">Handle Task</button>
            </div>
          ))}
        </div>
      )}

      {pending_bids?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-black text-gray-900 flex items-center gap-2"><Briefcase size={16} /> Recent Bids</h3>
            <button onClick={() => onTabChange('bids')} className="text-sm font-semibold" style={{ color: 'var(--loveeu-rose)' }}>View All →</button>
          </div>
          {pending_bids.slice(0, 3).map(bid => (
            <div key={bid.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{bid.task?.title}</p>
                <p className="text-sm text-gray-400">Your bid: {money(bid.workmanship_price)}</p>
              </div>
              <span className={clsx('badge', bid.status==='accepted'?'badge-green':bid.status==='rejected'?'badge-red':'badge-yellow')}>{bid.status}</span>
            </div>
          ))}
        </div>
      )}

      {active_tasks?.length === 0 && pending_bids?.length === 0 && (
        <div className="card p-6 text-center" style={{ background: 'var(--rose)' }}>
          <Zap size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="text-white font-black text-xl mb-2">Start Earning Today</h3>
          <p className="text-white/60 text-sm mb-4">Browse tasks near you and place bids. Once accepted, complete the task and get paid instantly.</p>
          <button onClick={() => onTabChange('browse')} className="btn-primary btn-sm inline-flex">Browse Available Tasks</button>
        </div>
      )}
    </div>
  );
}

/* ── Pending Guard (reusable) ──────────────────────────────────── */
function PendingGuard({ children }) {
  const { isPendingTasker } = useAuth();
  if (!isPendingTasker) return children;
  return (
    <div className="card p-10 text-center" style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <h3 className="font-black text-xl" style={{ color: 'var(--text)', marginBottom: 10 }}>
        Application Under Review
      </h3>
      <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>
        Your application is being verified by our admin team. You'll have full access
        to all features once approved — this usually takes 24–48 hours.
      </p>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
        We'll notify you by email when your account is approved.
      </p>
    </div>
  );
}

/* ── Browse Tasks ──────────────────────────────────────────────── */
function BrowseTasks({ taskerProfile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(null);
  const [bidForm, setBidForm] = useState({ price: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTasks = async () => {
    try {
      // Only tasks in this tasker's own country; remote tasks from anywhere in it.
      const mk = activeMarket();
      const inMarket = (p) => (mk.slug ? { ...p, country: mk.slug } : p);
      const [cityRes, stateRes, remoteRes] = await Promise.all([
        tasksApi.list(inMarket({ city: taskerProfile?.task_city, status: 'open,bidding,ongoing', limit: 20 })),
        taskerProfile?.task_state
          ? tasksApi.list(inMarket({ state: taskerProfile.task_state, status: 'open,bidding,ongoing', limit: 20 }))
          : Promise.resolve({ data: { tasks: [] } }),
        tasksApi.list(inMarket({ remote: '1', status: 'open,bidding,ongoing', limit: 20 })).catch(() => ({ data: { tasks: [] } })),
      ]);

      const cityTasks  = cityRes.data.tasks  || [];
      const stateTasks = stateRes.data.tasks || [];
      const seen       = new Set(cityTasks.map(t => t.id));
      const stateOnly  = stateTasks.filter(t => !seen.has(t.id) && seen.add(t.id));
      const remoteOnly = (remoteRes.data.tasks || []).filter(t => !seen.has(t.id));

      // Only keep truly open/bidding tasks in case any went stale
      const all = [...cityTasks, ...stateOnly, ...remoteOnly].filter(t =>
        t.status === 'open' || t.status === 'bidding');
      setTasks(all);
    } catch {}
  };

  // Keep a ref to always call the latest loadTasks (avoids stale closure in interval/visibilitychange)
  const loadTasksRef = useRef(loadTasks);
  useEffect(() => { loadTasksRef.current = loadTasks; });

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      await loadTasksRef.current();
      if (!cancelled) setLoading(false);
    };
    init();

    const tick = () => loadTasksRef.current();
    const interval = setInterval(tick, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') loadTasksRef.current(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [taskerProfile?.task_city, taskerProfile?.task_state]);

  const openDetail = async (task) => {
    setViewingTask(task.id);
    setDetailLoading(true);
    setTaskDetail(null);
    try {
      const { data } = await tasksApi.get(task.id);
      setTaskDetail(data.task || data);
    } catch { toast.error('Could not load task details'); setViewingTask(null); }
    finally { setDetailLoading(false); }
  };

  const submitBid = async (taskId) => {
    if (!bidForm.price) { toast.error('Enter your asking price'); return; }
    setSubmitting(true);
    try {
      await tasksApi.bid(taskId, { workmanship_price: bidForm.price, message: bidForm.message });
      toast.success('Bid submitted! The requester will be notified.');
      setBidding(null);
      setBidForm({ price: '', message: '' });
      // Remove the task from local list immediately after bidding
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (viewingTask === taskId) { setViewingTask(null); setTaskDetail(null); }
    } catch (err) { toast.error(err.response?.data?.message || 'Could not submit bid'); }
    finally { setSubmitting(false); }
  };

  // ── Inline Task Detail View ──
  if (viewingTask) {
    return (
      <div>
        <button
          onClick={() => { setViewingTask(null); setTaskDetail(null); setBidding(null); }}
          className="flex items-center gap-2 mb-5" style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Back to tasks
        </button>

        {detailLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : taskDetail ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <span className={clsx('badge', STATUS_COLORS[taskDetail.status] || 'badge-gray')}>
                  {taskDetail.status}
                </span>
                {taskDetail.is_equipment_required && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#fff7ed', color: '#c2410c' }}>
                    Equipment needed
                  </span>
                )}
              </div>
              <h2 className="font-black text-2xl" style={{ color: 'var(--text)', marginBottom: 8 }}>
                {taskDetail.title}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                <span>{taskDetail.task_city}, {taskDetail.task_state}</span>
                {taskDetail.requester_rating && <RatingBadge label="Requester" average={taskDetail.requester_rating.average} count={taskDetail.requester_rating.count} />}
                <span>{taskDetail.deadline ? format(new Date(taskDetail.deadline), 'MMM d, yyyy') : 'Flexible deadline'}</span>
                {taskPrice(taskDetail) && (
                  <span className="font-bold" style={{ color: 'var(--primary)' }}>{money(taskPrice(taskDetail))}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="card p-6">
              <h4 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Description</h4>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {taskDetail.description}
              </p>
            </div>

            {/* Requester info */}
            {taskDetail.requester && (
              <div className="card p-6">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Posted by</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base" style={{ background: 'var(--loveeu-rose)' }}>
                    {taskDetail.requester.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text)' }}>@{taskDetail.requester.username || 'requester'}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {taskDetail.requester.total_tasks_posted || 0} tasks posted
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bid form */}
            {(taskDetail.status === 'open' || taskDetail.status === 'bidding') && (
              <div className="card p-6">
                <h4 className="font-black text-lg mb-4" style={{ color: 'var(--text)' }}>Place Your Bid</h4>
                {bidding === taskDetail.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Your Price ({sym()}) *</label>
                      <input
                        type="number" min={minAmount()} step="any" placeholder={`e.g. ${(minAmount() * 25).toLocaleString()}`} value={bidForm.price}
                        onChange={e => setBidForm({ ...bidForm, price: e.target.value })}
                        className="input"/>
                    </div>
                    <div>
                      <label className="label">Message to requester <span className="font-normal text-gray-400">(optional)</span></label>
                      <textarea
                        rows={3} placeholder="Why are you the best person for this task?" value={bidForm.message}
                        onChange={e => setBidForm({ ...bidForm, message: e.target.value })}
                        className="input resize-none"/>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => submitBid(taskDetail.id)} disabled={submitting} className="btn-primary flex-1">
                        {submitting ? 'Submitting...' : 'Submit Bid'}
                      </button>
                      <button onClick={() => setBidding(null)} className="btn-ghost">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setBidding(taskDetail.id); setBidForm({ price: '', message: '' }); }}
                    className="btn-primary w-full">
                    Place Bid on This Task
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // ── Task List ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Tasks Near You</h3>
          {taskerProfile?.task_city && <p className="text-sm text-gray-400 mt-0.5">Showing tasks in {taskerProfile.task_city}, {taskerProfile.task_state}</p>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>
      ) : tasks.length === 0 ? (
        <div className="card empty-state">
          <Search size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold text-gray-700">No open tasks in your area</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon — new tasks are posted daily</p>
        </div>
      ) : tasks.map(task => (
        <div key={task.id} className="card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-base">{task.title}</h4>
              {taskPrice(task) && <p className="font-black text-base mt-0.5" style={{ color: 'var(--primary)' }}>{money(taskPrice(task))}</p>}
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                <span>{task.task_city}, {task.task_state}</span>
                <span>Due {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : 'Flexible'}</span>
                {taskPrice(task) && <span className="font-semibold" style={{ color: 'var(--primary)' }}>{money(taskPrice(task))}</span>}
                {task.is_equipment_required && <span className="badge-orange text-xs">Equipment needed</span>}
              </div>
            </div>
          </div>

          {bidding === task.id ? (
            <div className="mt-4 p-4 rounded-2xl space-y-3" style={{ background: 'var(--primary-light)', border: '1px solid rgba(255,45,98,0.2)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--rose-dark)' }}>Your Bid</p>
              <div>
                <label className="label">Your Price ({sym()}) *</label>
                <input type="number" min={minAmount()} step="any" placeholder={`e.g. ${(minAmount() * 25).toLocaleString()}`} value={bidForm.price} onChange={e => setBidForm({...bidForm, price: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Message to requester <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea rows={2} placeholder="Why are you the best person for this task?" value={bidForm.message} onChange={e => setBidForm({...bidForm, message: e.target.value})} className="input resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => submitBid(task.id)} disabled={submitting} className="btn-primary btn-sm">
                  {submitting ? 'Sending...' : 'Submit Bid'}
                </button>
                <button onClick={() => setBidding(null)} className="btn-ghost btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => openDetail(task)}
                className="btn-ghost btn-sm border" style={{ borderColor: 'var(--border)' }}
              >
                View Details
              </button>
              <button onClick={() => { setBidding(task.id); setBidForm({ price: '', message: '' }); }} className="btn-primary btn-sm">
                Place Bid
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


/* ── My Tasks ──────────────────────────────────────────────────── */
function MyTasks({ tasks, onOpenChat, onUpdate }) {
  // Escrow balances (funded − advances) per task, from the shared backend calculator.
  const [escrowByTask, setEscrowByTask] = useState({});
  const loadEscrow = () => {
    paymentsApi.escrow()
      .then(r => setEscrowByTask(Object.fromEntries((r.data.escrow || []).map(e => [e.task_id, e]))))
      .catch(() => {});
  };
  useEffect(() => { loadEscrow(); }, [tasks]);
  const [viewing, setViewing] = useState(null); // taskId being viewed inline
  const [taskDetail, setTaskDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (task) => {
    setViewing(task.id);
    setDetailLoading(true);
    setTaskDetail(null);
    try {
      const { data } = await tasksApi.get(task.id);
      setTaskDetail(data.task || data);
    } catch { toast.error('Could not load task details'); setViewing(null); }
    finally { setDetailLoading(false); }
  };

  // Opened from Earnings / a notification link → go straight to that task.
  useEffect(() => {
    const first = takePendingTask('tasker');
    if (first) openDetail({ id: first });
    const onOpen = (e) => {
      if (e.detail?.scope !== 'tasker') return;
      const id = takePendingTask('tasker');
      if (id) openDetail({ id });
    };
    window.addEventListener('open-task', onOpen);
    return () => window.removeEventListener('open-task', onOpen);
  }, []);

  // Step 3 accepted the code (or the task was finished elsewhere): re-read the
  // task so the whole page switches to its completed state straight away.
  const handleCompleted = async (taskId) => {
    try {
      const { data } = await tasksApi.get(taskId);
      const fresh = data.task || data;
      setTaskDetail(prev => (prev?.id === taskId ? fresh : prev));
    } catch {
      setTaskDetail(prev => (prev?.id === taskId ? { ...prev, status: 'completed' } : prev));
    }
    loadEscrow();
    onUpdate?.(); // refresh tasks + earnings
  };

  const EscrowBadge = ({ task }) => {
    const e = escrowByTask[task.id];
    if (!task.is_funded && !e) return null;
    const funded = e ? e.funded : Number(task.funded_amount || 0);
    const advance = e ? e.advance_withdrawn + (task.status === 'ongoing' ? e.advance_approved : 0) : 0;
    return (
      <span style={{ fontSize: 11, background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
        {advance > 0
          ? <>Escrow {money(funded)} · Advance −{money(advance)} · Balance {money((e?.remaining ?? funded))}</>
          : <>Funded: {money(funded)}</>}
      </span>
    );
  };

  if (viewing) {
    const inWorkspace = taskDetail && ['ongoing', 'completed'].includes(taskDetail.status);
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
              <span className={clsx('badge mb-3 inline-block', STATUS_COLORS[taskDetail.status] || 'badge-gray')}>{taskDetail.status}</span>
              <h2 className="font-black text-2xl mb-2" style={{ color: 'var(--text)' }}>{taskDetail.title}</h2>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--muted)' }}>
                <span>{taskDetail.task_city}, {taskDetail.task_state}</span>
                {taskDetail.requester_rating && <RatingBadge label="Requester" average={taskDetail.requester_rating.average} count={taskDetail.requester_rating.count} />}
                <span>{taskDetail.deadline ? format(new Date(taskDetail.deadline), 'MMM d, yyyy') : 'Flexible'}</span>
                {taskPrice(taskDetail) && <span className="font-bold" style={{ color: 'var(--primary)' }}>{money(taskPrice(taskDetail))}</span>}
              </div>
              <CostBreakdown task={taskDetail} />
              {taskDetail.status === 'ongoing' && (
                <button onClick={() => { onOpenChat?.(taskDetail); setViewing(null); }}
                  className="btn-primary btn-sm mt-4 flex items-center gap-2">
                  <MessageSquare size={15} /> Chat with Requester
                </button>
              )}
            </div>

            {inWorkspace && (
              <TaskerCompletionFlow key={taskDetail.id + taskDetail.status} task={taskDetail}
                requesterName={taskDetail.requester?.username ? '@' + taskDetail.requester.username : null}
                balance={escrowByTask[taskDetail.id]?.net_payout ?? null}
                onCompleted={() => handleCompleted(taskDetail.id)} />
            )}

            {inWorkspace && (
              <TaskAdvancePanel key={'adv' + taskDetail.id + taskDetail.status} task={taskDetail} role="tasker" onChanged={loadEscrow} />
            )}

            <div className="card p-6">
              <h4 className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Description</h4>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{taskDetail.description}</p>
            </div>

            {taskDetail.status === 'completed' && (
              <TaskReviews taskId={taskDetail.id} taskTitle={taskDetail.title} otherLabel="Requester"
                otherName={taskDetail.requester?.username ? '@' + taskDetail.requester.username : null} />
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="card empty-state">
          <CheckSquare size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-bold text-gray-700">No active tasks yet</p>
          <p className="text-gray-400 text-sm mt-1">Browse tasks and place bids to get started</p>
        </div>
      ) : tasks.map(task => (
        <div key={task.id} className="card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={clsx('badge', STATUS_COLORS[task.status] || 'badge-gray')}>{task.status}</span>
                <EscrowBadge task={task} />
                {task.status === 'ongoing' && !task.is_funded && (
                  <span style={{ fontSize: 11, background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    ⏳ Awaiting Payment
                  </span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 text-base">{task.title}</h4>
              {taskPrice(task) && <p className="font-black text-base mt-0.5" style={{ color: 'var(--primary)' }}>{money(taskPrice(task))}</p>}
              <p className="text-sm text-gray-400 mt-0.5">{task.task_city}, {task.task_state} ·  Due {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : 'Flexible'}</p>
              {task.requester && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-gray-500">Requester: <strong className="text-gray-800">{task.requester.username ? '@'+task.requester.username : 'Requester'}</strong></span>
                  {task.requester.phone && <a href={`tel:${task.requester.phone}`} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Call</a>}
                </div>
              )}
            </div>
          </div>

          {/* Awaiting payment nudge */}
          {task.status === 'ongoing' && !task.is_funded && (
            <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>The requester hasn't paid yet. Remind them via chat to fund the task before you begin work. Payment is held securely in escrow once they pay.
            </div>
          )}

          {task.status === 'ongoing' && (
            <button onClick={() => openDetail(task)} data-testid="open-workspace"
              className="mt-4 w-full flex items-center gap-3 text-left"
              style={{ background: '#fff5f7', border: '1px solid #ffd1dc', borderRadius: 16, padding: '12px 14px', cursor: 'pointer' }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={18} color="white" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-black text-sm" style={{ color: '#c41445' }}>Finish task & get paid</span>
                <span className="block text-xs" style={{ color: '#ff2d62' }}>1. Upload proof · 2. Rate · 3. Enter code — plus advance payment</span>
              </span>
              <span className="font-black" style={{ color: '#ff2d62' }}>→</span>
            </button>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={() => openDetail(task)} className="btn-ghost btn-sm border" style={{ borderColor: 'var(--border)' }}>
              View Details
            </button>
            {task.status === 'ongoing' && (
              <button onClick={() => onOpenChat?.(task)}
                className="btn-primary btn-sm flex items-center gap-1.5">
                <MessageSquare size={13} /> Chat
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
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
              <p className="text-xs text-gray-400 mt-1">Win a bid to start chatting with requesters</p>
            </div>
          ) : rooms.map(room => {
            const partner = room.requester;
            const lastMsg = room.last_message?.[0];
            return (
              <button key={room.id} onClick={() => setSelectedRoom(room)}
                className={clsx('w-full flex items-start gap-3 p-4 border-b text-left transition-colors',
                  selectedRoom?.id === room.id ? 'bg-rose-50' : 'hover:bg-gray-50')}
                style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: 'var(--primary)' }}>
                  {partner?.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-800 truncate">{partner?.full_name}</p>
                    {lastMsg && <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })}</span>}
                  </div>
                  {(room.display_title || room.task?.title) && (
                    <p className="text-xs text-gray-400 truncate">{room.display_title || room.task?.title}</p>
                  )}
                  {lastMsg && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content || 'File'}</p>}
                  {room.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-black mt-1" style={{ background: 'var(--primary)' }}>{room.unread_count}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className={clsx('flex-1 min-w-0', !selectedRoom && 'hidden sm:block')}>
        {selectedRoom ? <ChatWindow room={selectedRoom} onClose={() => setSelectedRoom(null)} /> : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-gray-700 text-lg">Pick a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Select from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Earnings ─────────────────────────────────────────────────── */
function TaskerPayments({ payments, refunds, cancelRequests, profile, onUpdate }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [showBankReminder, setShowBankReminder] = useState(false);
  const [tab, setTab] = useState(
    ((cancelRequests || []).some(c => c.status === 'pending') || (refunds || []).some(r => r.status === 'pending'))
      ? 'actions' : 'earnings');
  const [respondingRefund, setRespondingRefund] = useState(null);
  const [refundNote, setRefundNote] = useState('');
  const [respondingCancel, setRespondingCancel] = useState(null);
  const [cancelNote, setCancelNote] = useState('');
  const [acting, setActing] = useState(false);

  // ── Advance + escrow state ──
  const [myAdvances, setMyAdvances] = useState([]);
  // Balances come from the server's single escrow calculator (funded − advances),
  // so this screen always matches what the withdrawal endpoint will pay.
  const [escrowRows, setEscrowRows] = useState([]);
  const [escrowSummary, setEscrowSummary] = useState({ available_gross: 0, platform_fee: 0, available_net: 0 });
  const [escrowLoaded, setEscrowLoaded] = useState(false);

  const reloadAdvances = () => paymentsApi.getMyAdvanceRequests()
    .then(r => setMyAdvances(r.data.advances || []))
    .catch(() => {});
  const reloadEscrow = () => paymentsApi.escrow()
    .then(r => { setEscrowRows(r.data.escrow || []); setEscrowSummary(r.data.summary || { available_gross: 0, platform_fee: 0, available_net: 0 }); })
    .catch(() => {})
    .finally(() => setEscrowLoaded(true));
  const reloadAll = () => { reloadAdvances(); reloadEscrow(); onUpdate?.(); };

  useEffect(() => { reloadAdvances(); reloadEscrow(); }, []);

  const escrowByTask = Object.fromEntries(escrowRows.map(e => [e.task_id, e]));
  const ongoingEscrow = escrowRows.filter(e => e.task_status === 'ongoing');
  const availableEscrow = escrowRows.filter(e => e.payout_status === 'available');
  const tipsAvailable = Number(escrowSummary.tips_available || 0);
  const receiveTotal = Number(escrowSummary.available_net || 0) + tipsAvailable;
  const canWithdrawAll = Number(escrowSummary.available_gross || 0) + tipsAvailable >= minAmount();
  const intlMarket = !!activeMarket().slug;
  const hasBank = intlMarket ? !!profile?.payout_details?.account_holder : (profile?.bank_account_number && profile?.bank_name);

  const pendingRefunds = refunds?.filter(r => r.status === 'pending') || [];
  const pendingCancels = cancelRequests?.filter(c => c.status === 'pending') || [];
  const actionCount = pendingRefunds.length + pendingCancels.length;

  const handleWithdraw = async () => {
    if (withdrawing) return;
    if (!hasBank) { setShowBankReminder(true); return; }
    if (!canWithdrawAll) {
      toast.error('Your balance becomes available after the requester confirms completion with the 6-digit code. Before that, only an approved advance can be withdrawn.');
      return;
    }
    setWithdrawing(true);
    try {
      const { data, status } = await paymentsApi.requestWithdrawal();
      if (data?.queued) toast.success(data.message, { duration: 9000 });
      else if (status === 202 || data?.pending_confirmation) toast(data.message, { duration: 9000, icon: '⏳' });
      else toast.success(data?.message || 'Withdrawal sent! Funds arrive in 1–3 minutes.', { duration: 6000 });
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) toast('No response from the server — refreshing your balance. If the amount is gone, the transfer went through.', { duration: 8000, icon: '⏳' });
      else if (status === 409) toast.success('This withdrawal is already being processed.');
      else toast.error(err.response?.data?.message || 'Withdrawal failed. Ensure your bank details are correct.');
    } finally { setWithdrawing(false); reloadAll(); }
  };

  const respondToRefund = async (refundId, status) => {
    if (acting) return;
    setActing(true);
    try {
      await paymentsApi.respondRefund(refundId, { status, response_message: refundNote });
      toast.success(status === 'approved' ? 'Refund approved.' : 'Refund denied.');
      setRespondingRefund(null); setRefundNote(''); onUpdate?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not process response'); }
    finally { setActing(false); }
  };

  const respondToCancel = async (taskId, decision) => {
    if (acting) return;
    setActing(true);
    try {
      const { data } = await tasksApi.respondCancel(taskId, { decision, response_note: cancelNote });
      toast.success(data?.message || (decision === 'approve' ? 'Task cancelled. Refund processed.' : 'Cancellation denied. Task continues.'));
      setRespondingCancel(null); setCancelNote(''); reloadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not process response'); }
    finally { setActing(false); }
  };

  const naira = (n) => `${money(n || 0)}`;


  const TABS = [
    { id: 'earnings', label: 'Earnings' },
    { id: 'advance', label: 'Advances' },
    { id: 'actions', label: `Action Needed${actionCount > 0 ? ` (${actionCount})` : ''}` },
  ];

  return (
    <div className="space-y-4">
      {actionCount > 0 && tab !== 'actions' && (
        <div className="card p-4 flex items-center gap-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: '#92400e' }}>{actionCount} request{actionCount > 1 ? 's' : ''} need your response</p>
            <p className="text-xs" style={{ color: '#b45309' }}>
              {pendingCancels.length > 0 && `${pendingCancels.length} cancellation${pendingCancels.length > 1 ? 's' : ''}`}
              {pendingCancels.length > 0 && pendingRefunds.length > 0 && ' · '}
              {pendingRefunds.length > 0 && `${pendingRefunds.length} refund${pendingRefunds.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => setTab('actions')} className="btn-primary btn-sm">Review →</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('px-4 py-2 rounded-xl text-sm font-bold transition-all', tab === t.id ? 'text-white' : 'bg-white border text-gray-500')}
            style={tab === t.id ? { background: 'var(--primary)' } : { borderColor: 'var(--border)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'earnings' && (
        <>
          <div className="card p-6 relative overflow-hidden" style={{ background: 'var(--rose)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(255,45,98,0.4), transparent 60%)' }} />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Available to Withdraw</p>
                <p className="text-white font-black text-3xl">{naira(Number(escrowSummary.available_gross || 0) + tipsAvailable)}</p>
                {canWithdrawAll ? (
                  <div className="mt-2 space-y-0.5">
                    {availableEscrow.some(e => e.advance_withdrawn > 0) && (
                      <>
                        <p className="text-white/40 text-xs">Escrow: {naira(availableEscrow.reduce((s, e) => s + e.funded, 0))}</p>
                        <p className="text-rose-400 text-xs">Advance already paid: &minus;{naira(availableEscrow.reduce((s, e) => s + e.advance_withdrawn, 0))}</p>
                      </>
                    )}
                    {availableEscrow.length === 0 ? null : escrowSummary.platform_fee_rate === 0
                      ? <p className="text-emerald-300 text-xs font-bold">No platform fee: you keep 100%</p>
                      : <p className="text-white/40 text-xs">Taskeeu fee ({Math.round((escrowSummary.platform_fee_rate ?? 0.2) * 10000) / 100}% of the full task payment{availableEscrow.length > 1 ? 's' : ''} {naira(availableEscrow.reduce((s, e) => s + e.funded, 0))}): &minus;{naira(escrowSummary.platform_fee)}</p>}
                    {tipsAvailable > 0 && <p className="text-emerald-300 text-xs">Tips and extra money: +{naira(tipsAvailable)} (no fee)</p>}
                    <p className="text-emerald-400 text-xs font-bold">You receive: {naira(receiveTotal)}</p>
                  </div>
                ) : (
                  <p className="text-white/40 text-xs mt-1">
                    {escrowLoaded && ongoingEscrow.length > 0
                      ? 'Your balance is released when the requester confirms completion with the 6-digit code.'
                      : 'Completed tasks will appear here.'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleWithdraw} disabled={withdrawing || !canWithdrawAll || !hasBank}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'var(--primary)' }}>
                  {withdrawing ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                  {withdrawing ? 'Sending to bank…' : canWithdrawAll ? `Withdraw ${naira(receiveTotal)}` : 'Withdraw Earnings'}
                </button>
                {!hasBank && <p className="text-amber-400 text-xs text-center">Set bank details in Profile first</p>}
                {hasBank && !canWithdrawAll && <p className="text-white/50 text-xs text-center">Locked until task is completed</p>}
              </div>
            </div>
          </div>
          {showBankReminder && (
            <div className="card p-4 border-l-4 border-amber-400 bg-amber-50">
              <p className="font-semibold text-amber-800 text-sm">Bank details required</p>
              <p className="text-amber-700 text-xs mt-1">Go to <strong>My Profile</strong> → bank section to add your account details.</p>
              <button onClick={() => setShowBankReminder(false)} className="text-xs text-amber-600 underline mt-2">Dismiss</button>
            </div>
          )}

          {escrowRows.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-black text-gray-900 flex items-center gap-2"><Banknote size={16} /> Task Balances</h3>
                <p className="text-xs text-gray-400 mt-1">Escrow minus any advance you have received. Taskeeu's fee is a share of the full task payment, taken at withdrawal.</p>
              </div>
              {escrowRows.map(e => {
                const advance = e.advance_withdrawn + (e.task_status === 'ongoing' ? e.advance_approved : 0);
                const label = {
                  locked: { text: 'In escrow — awaiting completion code', cls: 'bg-amber-100 text-amber-700' },
                  available: { text: 'Ready to withdraw', cls: 'bg-emerald-100 text-emerald-700' },
                  withdrawn: { text: 'Paid out', cls: 'bg-blue-100 text-blue-700' },
                  cancelled: { text: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
                }[e.payout_status] || { text: e.payout_status, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={e.task_id} className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{e.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Escrow {naira(e.funded)}
                          {advance > 0 && <> · Advance <span className="text-rose-600">&minus;{naira(advance)}</span></>}
                          {' '}· Balance {naira(e.remaining)}
                          {e.task_status !== 'cancelled' && e.payout_status !== 'withdrawn' && (
                            <>{' '}· Taskeeu fee <span className="text-rose-600">&minus;{naira(e.platform_fee)}</span> ({Math.round((e.platform_fee_rate ?? 0.2) * 10000) / 100}% of {naira(e.funded)})
                            {' '}· <strong className="text-gray-800">You get {naira(e.net_payout)}</strong></>
                          )}
                        </p>
                        {e.task_status !== 'ongoing' && e.advance_approved > 0 && (
                          <p className="text-xs text-gray-500 mt-1">Approved advance of {naira(e.advance_approved)} was not withdrawn, so it is included in this balance.</p>
                        )}
                      </div>
                      <span className={clsx('text-xs font-bold px-2 py-1 rounded-full flex-shrink-0', label.cls)}>{label.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-black text-gray-900 flex items-center gap-2"><DollarSign size={16} /> Earnings History</h3>
            </div>
            {payments.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-gray-600">No earnings yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete tasks to see your payments here</p>
              </div>
            ) : payments.map(p => {
              const paidOut = !!p.withdrawn_at;
              const statusText = paidOut ? 'paid out' : p.task?.status === 'completed' ? 'ready to withdraw' : p.status === 'completed' ? 'in escrow' : p.status;
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border)' }}>
                  <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', p.status === 'completed' || paidOut ? 'bg-emerald-50' : 'bg-gray-50')}>
                    {p.status === 'completed' || paidOut ? <CheckSquare size={18} className="text-emerald-600" /> : <RefreshCw size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 capitalize">{p.payment_type} payment</p>
                    <p className="text-sm text-gray-400 truncate">{p.task?.title || 'General'} · {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-emerald-700 text-base">+&#8358;{Number(p.amount).toLocaleString()}</p>
                    <span className={clsx('text-xs font-semibold', paidOut || p.task?.status === 'completed' ? 'text-emerald-600' : 'text-amber-500')}>{statusText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'advance' && (
        <div className="space-y-4">
          <div className="card overflow-hidden" style={{ border: '1px solid #ffd1dc' }}>
            <div style={{ background: 'var(--rose)', padding: '16px 20px', color: 'white' }}>
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 }}>Advances now live inside each task</p>
              <p style={{ fontSize: 17, fontWeight: 900 }}>Open a task to request, track and withdraw its advance</p>
            </div>
            <div className="p-5 text-sm" style={{ color: '#c41445' }}>
              You can request up to <strong>50%</strong> of a task's escrow for materials or transport. The requester approves it inside the same task, and you withdraw it there. Example: {money(200)} escrow less a {money(100)} advance leaves <strong>a {money(100)} balance</strong>, paid when the task is completed.
            </div>
          </div>

          {ongoingEscrow.length === 0 && myAdvances.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-bold text-gray-700">No funded tasks in progress</p>
              <p className="text-sm text-gray-400 mt-1">Once a requester pays for a task you are doing, you can request an advance from that task's page.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {[...new Map([
                ...ongoingEscrow.map(e => [e.task_id, { task_id: e.task_id, title: e.title, e }]),
                ...myAdvances.map(a => [a.task_id, { task_id: a.task_id, title: a.task?.title || a.escrow?.title || 'Task', e: a.escrow || escrowByTask[a.task_id] }]),
              ]).values()].map(row => {
                const advs = myAdvances.filter(a => a.task_id === row.task_id);
                const act = advs.find(a => a.status === 'pending' || a.status === 'approved');
                const ongoing = (row.e?.task_status) === 'ongoing';
                const status = act?.status === 'pending' ? ['Waiting for requester', 'bg-amber-100 text-amber-700']
                  : act?.status === 'approved' && ongoing ? ['Approved — withdraw in task', 'bg-emerald-100 text-emerald-700']
                  : advs.some(a => a.status === 'withdrawn') ? ['Advance received', 'bg-blue-100 text-blue-700']
                  : ongoing && row.e?.advance_available >= 100 ? [`Up to ${naira(row.e.advance_available)} available`, 'bg-rose-100 text-rose-700']
                  : ['No active advance', 'bg-gray-100 text-gray-600'];
                return (
                  <div key={row.task_id} className="p-4 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{row.title}</p>
                      {row.e && <p className="text-xs text-gray-500 mt-0.5">Escrow {naira(row.e.funded)} · Balance {naira(row.e.remaining)}</p>}
                    </div>
                    <span className={clsx('text-xs font-bold px-2 py-1 rounded-full', status[1])}>{status[0]}</span>
                    <button onClick={() => requestOpenTask('tasker', row.task_id)} className="btn-primary btn-sm">Open task →</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {tab === 'actions' && (
        <div className="space-y-4">

          {/* ── Cancellation Requests ── */}
          {pendingCancels.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: '#fff7ed' }}>
                <span style={{ fontSize: 16 }}></span>
                <h3 className="font-black text-gray-900">Task Cancellation Requests</h3>
                <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#f97316', color: 'white' }}>{pendingCancels.length}</span>
              </div>
              {pendingCancels.map(req => (
                <div key={req.id} className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold" style={{ color: 'var(--text)' }}>{req.task?.title}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {req.requester?.full_name} · {req.created_at ? formatDistanceToNow(new Date(req.created_at), { addSuffix: true }) : ''}
                        {req.task?.deadline && ` · Due ${format(new Date(req.task.deadline), 'MMM d')}`}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl mb-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#c2410c' }}>REASON FROM REQUESTER</p>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{req.reason}</p>
                  </div>
                  <div className="p-3 rounded-xl mb-3 text-xs" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
                    ℹ️ If you <strong>approve</strong>, the task is cancelled and any payment held is automatically refunded to the requester. If you <strong>deny</strong>, the task continues as normal.
                  </div>
                  {respondingCancel?.id === req.id ? (
                    <div className="space-y-3">
                      <textarea rows={2} placeholder="Optional: add a note for the requester..." value={cancelNote} onChange={e => setCancelNote(e.target.value)}
                        className="input resize-none text-sm" />
                      <div className="flex gap-3">
                        <button onClick={() => respondToCancel(req.task_id, 'approve')} disabled={acting}
                          style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                          {acting ? '...' : 'Approve Cancellation'}
                        </button>
                        <button onClick={() => respondToCancel(req.task_id, 'deny')} disabled={acting}
                          style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                          {acting ? '...' : 'Deny — Keep Task'}
                        </button>
                      </div>
                      <button onClick={() => { setRespondingCancel(null); setCancelNote(''); }} className="text-xs" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setRespondingCancel(req)} className="btn-primary btn-sm">
                      Respond to Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Refund Requests ── */}
          {pendingRefunds.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: '#fff5f7' }}>
                <span style={{ fontSize: 16 }}></span>
                <h3 className="font-black text-gray-900">Refund Requests</h3>
                <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#ff2d62', color: 'white' }}>{pendingRefunds.length}</span>
              </div>
              {pendingRefunds.map(r => (
                <div key={r.id} className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold" style={{ color: 'var(--text)' }}>{r.task?.title}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}
                      </p>
                    </div>
                    <p className="font-black text-lg flex-shrink-0" style={{ color: '#ff2d62' }}>{money(r.amount)}</p>
                  </div>
                  <div className="p-3 rounded-xl mb-3" style={{ background: '#fff5f7', border: '1px solid #ffd1dc' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: '#ff2d62' }}>REASON FROM REQUESTER</p>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{r.reason}</p>
                  </div>
                  {respondingRefund?.id === r.id ? (
                    <div className="space-y-3">
                      <textarea rows={2} placeholder="Optional: explain your decision to the requester..." value={refundNote} onChange={e => setRefundNote(e.target.value)}
                        className="input resize-none text-sm" />
                      <div className="flex gap-3">
                        <button onClick={() => respondToRefund(r.id, 'approved')} disabled={acting}
                          className="btn-primary btn-sm flex-1">{acting ? '...' : 'Approve Refund'}</button>
                        <button onClick={() => respondToRefund(r.id, 'rejected')} disabled={acting}
                          className="btn-ghost btn-sm flex-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                          {acting ? '...' : 'Deny Refund'}
                        </button>
                      </div>
                      <button onClick={() => { setRespondingRefund(null); setRefundNote(''); }} className="text-xs" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button>
                    </div>
                  ) : (
                    <button onClick={() => setRespondingRefund(r)} className="btn-primary btn-sm">
                      Respond to Refund
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Past resolved actions */}
          {pendingCancels.length === 0 && pendingRefunds.length === 0 && (
            <div className="card empty-state">
              <CheckCircle size={36} className="mx-auto mb-3" style={{ color: '#00c37e' }} />
              <p className="font-bold text-gray-700">All caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No pending cancellation or refund requests</p>
            </div>
          )}

          {/* Resolved history */}
          {(cancelRequests?.filter(c => c.status !== 'pending').length > 0 || refunds?.filter(r => r.status !== 'pending').length > 0) && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-black text-gray-900 text-sm">Resolved Requests</h3>
              </div>
              {cancelRequests?.filter(c => c.status !== 'pending').map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{c.task?.title}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Cancellation · {c.responded_at ? format(new Date(c.responded_at), 'MMM d') : ''}</p>
                  </div>
                  <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg', c.status === 'approved' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>
                    {c.status === 'approved' ? 'Approved' : 'Denied'}
                  </span>
                </div>
              ))}
              {refunds?.filter(r => r.status !== 'pending').map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.task?.title}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Refund {money(r.amount)} · {r.created_at ? format(new Date(r.created_at), 'MMM d') : ''}</p>
                  </div>
                  <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg',
                    r.status === 'approved' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}>
                    {r.status === 'approved' ? 'Approved' : 'Denied'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ── Profile ──────────────────────────────────────────────────── */
function TaskerProfileTab({ user, profile, onUpdate }) {
  const { refreshProfile } = useAuth();
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);

  // Keep preview in sync with user prop after refresh
  useEffect(() => { setAvatarPreview(user?.avatar_url || null); }, [user?.avatar_url]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview immediately
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await authApi.uploadAvatar(fd);
      await refreshProfile();
      toast.success('Profile picture updated!');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload photo. Check Cloudinary is configured.');
      setAvatarPreview(user?.avatar_url || null); // revert preview
    } finally {
      setAvatarUploading(false);
      e.target.value = ''; // reset file input
    }
  };

  const regionsContent = useCountryContent(activeMarket().slug || 'none');
  const [form, setForm] = useState({
    bio: profile?.bio || '',
    task_city: profile?.task_city || '',
    task_state: profile?.task_state || '',
    country: profile?.country || user?.country || 'NG',
    skills: profile?.skills || [],
  });
  // Bank details state (separate)
  const [bankForm, setBankForm] = useState({
    bank_name: profile?.bank_name || '',
    bank_code: profile?.bank_code || '',
    account_number: profile?.bank_account_number || '',
    account_name: profile?.bank_account_name || '',
  });
  const [banks, setBanks] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [bankEdited, setBankEdited] = useState(false);
  // Pre-verified if profile already has all bank fields saved
  const [verified, setVerified] = useState(
    !!(profile?.bank_account_name && profile?.bank_account_number && profile?.bank_name)
  );
  const [saving, setSaving] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);

  // Load banks list - re-fetch when country is known
  useEffect(() => {
    if (activeMarket().slug) return; // international taskers use local bank fields, not the Flutterwave bank list
    const country = profile?.country || form.country || 'NG';
    const flwCountry = getFlutterwaveBankCountry(country);
    setBanksLoading(true);
    authApi.getBanks(flwCountry)
      .then(({ data }) => setBanks(data.banks || []))
      .catch(() => {
        // Retry once after 2 seconds on failure
        setTimeout(() => {
          authApi.getBanks(flwCountry)
            .then(({ data }) => setBanks(data.banks || []))
            .catch(() => {});
        }, 2000);
      })
      .finally(() => setBanksLoading(false));
  }, [profile?.country, form.country]);

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

  // Track whether user has changed account fields since load
  // Auto-verify when account_number is 10 digits and bank_code is selected,
  // but ONLY if the user has actually changed something (not on initial load)
  useEffect(() => {
    if (!bankEdited) return; // don't auto-verify on first render
    if (bankForm.account_number.length === 10 && bankForm.bank_code) {
      verifyAccount();
    } else {
      setVerified(false);
      setBankForm(f => ({ ...f, account_name: '' }));
    }
  }, [bankForm.account_number, bankForm.bank_code]);

  const verifyAccount = async () => {
    setVerifying(true);
    setVerified(false);
    setBankForm(f => ({ ...f, account_name: '' }));
    try {
      const { data } = await authApi.resolveAccount({
        account_number: bankForm.account_number,
        bank_code: bankForm.bank_code,
        country: getFlutterwaveBankCountry(profile?.country || form.country || 'NG'),
      });
      setBankForm(f => ({ ...f, account_name: data.account_name }));
      setVerified(true);
      toast.success(`Account verified: ${data.account_name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify account');
      setVerified(false);
    } finally { setVerifying(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await taskersApi.updateProfile({ bio: form.bio, skills: form.skills });
      // Update task address and country together
      if (form.task_city && form.task_state) {
        await taskersApi.updateTaskAddress({
          task_city: form.task_city,
          task_state: form.task_state,
          country: form.country || 'NG',
        });
      }
      await refreshProfile();
      toast.success('Profile updated!');
      onUpdate?.();
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error(err.response?.data?.message || 'Could not save profile. Try again.');
    }
    finally { setSaving(false); }
  };

  const saveBank = async () => {
    if (!verified) { toast.error('Please verify your account number first'); return; }
    setSavingBank(true);
    try {
      await taskersApi.updateBankDetails({
        bank_name: bankForm.bank_name,
        bank_code: bankForm.bank_code,
        bank_account_number: bankForm.account_number,
        country: getFlutterwaveBankCountry(profile?.country || form.country || 'NG'),
      });
      await refreshProfile();
      toast.success('Bank details saved!');
      onUpdate?.();
    } catch { toast.error('Could not save bank details.'); }
    finally { setSavingBank(false); }
  };

  const toggleSkill = (skill) => setForm(f => ({
    ...f, skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
  }));

  const selectedBank = banks.find(b => b.code === bankForm.bank_code);

  return (
    <div style={{ maxWidth: 600 }} className="space-y-5">
      {/* Profile info card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Clickable avatar upload */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))' }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                : (user?.full_name?.[0] || 'T')}
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
            <h3 className="font-black text-xl" style={{ color: 'var(--text)' }}>{user?.full_name}</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="text-amber-500" />
              <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                {parseFloat(profile?.rating_average || 0).toFixed(1)} rating · {profile?.total_tasks_completed || 0} tasks done
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">About Me</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
              placeholder="Pitch yourself to requesters — what physical tasks do you excel at, what's your coverage area, how fast do you respond?" className="input resize-none" />
          </div>

          <div>
            <label className="label">Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS_LIST.map(skill => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border" style={form.skills.includes(skill)
                    ? { background: 'var(--rose)', color: 'white', borderColor: 'var(--rose)' }
                    : { background: 'white', color: 'var(--muted)', borderColor: 'var(--border)' }}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
              <label className="label">Country</label>
              <select value={form.country} onChange={e => setForm({...form, country: e.target.value, task_state: ''})} className="input">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Task City</label>
              <input value={form.task_city} onChange={e => setForm({...form, task_city: e.target.value})} className="input" placeholder={activeMarket().slug ? activeMarket().cityLabel : 'e.g. Lagos Island'} />
            </div>
            <div>
              <label className="label">Task State / Region</label>
              <select value={form.task_state} onChange={e => setForm({...form, task_state: e.target.value})} className="input">
                <option value="">Select {form.country === 'US' ? 'state' : form.country === 'GB' ? 'region' : 'state'}</option>
                {(activeMarket().slug ? (regionsContent?.regions || []) : getStates(form.country || 'NG')).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving} className="btn-primary btn-sm mt-5">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Bank Details card */}
      {activeMarket().slug ? <IntlPayoutCard profile={profile} onUpdate={onUpdate} /> : (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Banknote size={18} style={{ color: 'var(--rose)' }} />
          <h4 className="font-black text-lg" style={{ color: 'var(--text)' }}>Bank Details</h4>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
          Select your bank and enter your 10-digit account number — we'll verify your name automatically via Flutterwave.
        </p>

        <div className="space-y-4">
          {/* Bank selector */}
          <div>
            <label className="label">Bank {banksLoading && <span className="text-xs font-normal text-gray-400 ml-1">(loading…)</span>}</label>
            <select
              value={bankForm.bank_code}
              onChange={e => {
                const bank = banks.find(b => b.code === e.target.value);
                setBankEdited(true);
                setBankForm(f => ({ ...f, bank_code: e.target.value, bank_name: bank?.name || '' }));
              }}
              className="input" disabled={banksLoading}
            >
              <option value="">{banksLoading ? 'Loading banks…' : banks.length === 0 ? 'No banks loaded — check connection' : 'Select your bank...'}</option>
              {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
            {!banksLoading && banks.length === 0 && (
              <button
                type="button" className="text-xs mt-1 underline" style={{ color: 'var(--rose)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => {
                  const country = profile?.country || form.country || 'NG';
                  setBanksLoading(true);
                  authApi.getBanks(getFlutterwaveBankCountry(country))
                    .then(({ data }) => setBanks(data.banks || []))
                    .catch(() => {})
                    .finally(() => setBanksLoading(false));
                }}
              >
                ↺ Retry loading banks
              </button>
            )}
          </div>

          {/* Account number */}
          <div>
            <label className="label">Account Number</label>
            <div className="relative">
              <input
                type="text" maxLength={10}
                value={bankForm.account_number}
                onChange={e => { setBankEdited(true); setBankForm(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '') })); }}
                placeholder="Enter 10-digit NUBAN number" className="input pr-12"/>
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {verifying && <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--muted)' }} />}
                {!verifying && verified && <CheckSquare size={16} style={{ color: '#00C37E' }} />}
              </div>
            </div>
          </div>

          {/* Verified account name */}
          {verified && bankForm.account_name && (
            <div
              className="flex items-center gap-3 rounded-2xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <CheckSquare size={18} style={{ color: '#00C37E', flexShrink: 0 }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#166534' }}>Account Verified</p>
                <p className="font-black text-base" style={{ color: '#166534' }}>{bankForm.account_name}</p>
                {selectedBank && <p className="text-xs" style={{ color: '#15803d' }}>{selectedBank.name}</p>}
              </div>
            </div>
          )}

          {verifying && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <RefreshCw size={14} className="animate-spin" /> Verifying your account...
            </div>
          )}
        </div>

        <button
          onClick={saveBank}
          disabled={savingBank || !verified}
          className="btn-primary btn-sm mt-5" style={{ opacity: (!verified) ? 0.5 : 1 }}
        >
          {savingBank ? 'Saving...' : 'Save Bank Details'}
        </button>

        {!verified && bankForm.account_number.length > 0 && bankForm.account_number.length < 10 && (
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Enter all 10 digits to verify automatically
          </p>
        )}
      </div>
      )}

      {/* Username */}
      <AccountSettings user={user} onUpdate={onUpdate} />
    </div>
  );
}

/* ── Account Settings (shared by Tasker & Requester) ─────────── */
function AccountSettings({ user, onUpdate }) {
  const { refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [savingUser, setSavingUser] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeletePw, setShowDeletePw] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    if (!deletePassword.trim()) { toast.error('Enter your password to confirm'); return; }
    setDeletingAccount(true);
    try {
      await authApi.deleteAccount({ password: deletePassword });
      toast.success('Your account has been permanently deleted.');
      logout();
      navigate(cpath('/'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

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
      toast.success('Password changed successfully!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not change password'); }
    finally { setSavingPw(false); }
  };

  return (
    <>
      {/* Username */}
      <div className="card p-6">
        <h4 className="font-black text-base mb-1" style={{ color: 'var(--text)' }}>Username</h4>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Your public @handle visible to others on the platform.</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--muted)' }}>@</span>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="yourhandle" className="input pl-8" maxLength={30} />
          </div>
          <button onClick={saveUsername} disabled={savingUser} className="btn-primary btn-sm">
            {savingUser ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h4 className="font-black text-base mb-1" style={{ color: 'var(--text)' }}>Change Password</h4>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Choose a strong password you don't use elsewhere.</p>
        <div className="space-y-3">
          <div className="relative">
            <input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)}
              placeholder="Current password" className="input pr-10" />
            <button type="button" onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted)' }}>
              {showOld ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="New password (min 8 characters)" className="input pr-10" />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted)' }}>
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            placeholder="Confirm new password" className="input" />
          <button onClick={savePassword} disabled={savingPw} className="btn-primary btn-sm w-full">
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* ── Danger Zone: Delete Account ── */}
      <div className="card p-6" style={{ border: '1px solid #fecdd3', background: '#fff8f8' }}>
        <h4 className="font-black text-base mb-1" style={{ color: '#c41445' }}>Delete Account</h4>
        <p className="text-sm mb-4" style={{ color: '#c41445' }}>
          Permanently delete your Taskeeu account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteConfirmText(''); }}
          style={{ background: 'white', border: '1.5px solid #ef4444', color: '#ef4444', borderRadius: 10, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Delete My Account
        </button>
      </div>

      {showDeleteModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto', overscrollBehavior: 'contain' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 4vw, 28px)', maxWidth: 420, width: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 16, color: '#111' }}>Delete your account?</p>
                <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>This is permanent and cannot be undone.</p>
              </div>
            </div>
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#c41445', lineHeight: 1.6 }}>
                Deleting your account will permanently remove your profile, task history, earnings record, and all personal data from Taskeeu.
              </p>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Enter your password to confirm</label>
                <div className="relative">
                  <input type={showDeletePw ? 'text' : 'password'} value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your current password" className="input pr-14" style={{ fontSize: 13 }} />
                  <button type="button" onClick={() => setShowDeletePw(!showDeletePw)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9ca3af', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showDeletePw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Type <strong>DELETE</strong> to confirm</label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE" className="input" style={{ fontSize: 13, letterSpacing: 1 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'DELETE' || !deletePassword}
                style={{ flex: 1, background: deleteConfirmText === 'DELETE' && deletePassword ? '#ef4444' : '#fca5a5', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13, color: 'white', cursor: deleteConfirmText === 'DELETE' && deletePassword ? 'pointer' : 'not-allowed' }}>
                {deletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ── KYC Verification Tab ──────────────────────────────────────── */
function KYCTab({ profile, onUpdate }) {
  const { refreshProfile } = useAuth();
  const [files, setFiles] = useState({});
  const [homeAddress, setHomeAddress] = useState(profile?.home_address || '');
  const [socialUrl, setSocialUrl] = useState(profile?.linkedin_url || '');
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [showEditRequest, setShowEditRequest] = useState(false);
  const [showDeleteRequest, setShowDeleteRequest] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const isKycComplete        = profile?.kyc_complete;
  const kycSubmissionStatus  = profile?.kyc_submission_status || 'not_submitted';
  const hasId  = profile?.national_id_url || profile?.driver_license_url || profile?.passport_url;
  const hasPoa = profile?.proof_of_address_url;

  const pendingSubmission = requests.find(r => r.request_type === 'kyc_submission' && r.status === 'pending');
  const rejectedSubmission = requests.find(r => r.request_type === 'kyc_submission' && r.status === 'rejected');
  const pendingEdit   = requests.find(r => r.request_type === 'edit' && r.status === 'pending');
  const pendingDelete = requests.find(r => r.request_type === 'delete_account' && r.status === 'pending');
  const approvedEdit  = requests.find(r => r.request_type === 'edit' && r.status === 'approved');

  // Docs locked once submitted for review (unless edit was approved)
  const docsLocked = (hasId || hasPoa) && !approvedEdit;
  // Can submit new KYC only if: not complete, not pending, and (no docs OR edit was approved)
  const canSubmitKYC = !isKycComplete && !pendingSubmission && (!hasId || !hasPoa || approvedEdit);

  useEffect(() => {
    setLoadingReqs(true);
    taskersApi.getMyKYCRequests()
      .then(({ data }) => setRequests(data.requests || []))
      .catch(() => {})
      .finally(() => setLoadingReqs(false));
  }, []);

  const setDoc = (k, v) => setFiles(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasAnyFile = Object.values(files).some(Boolean);
    if (!hasAnyFile && !homeAddress && !socialUrl) { toast.error('Please upload at least one document'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      if (homeAddress) fd.append('home_address', homeAddress);
      if (socialUrl)   fd.append('linkedin_url', socialUrl);
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });

      const { data } = await taskersApi.updateKYC(fd);
      toast.success(data.message);
      setFiles({});
      await refreshProfile();
      onUpdate?.();
      taskersApi.getMyKYCRequests().then(({ data }) => setRequests(data.requests || [])).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit KYC documents');
    }
    finally { setSaving(false); }
  };

  const submitChangeRequest = async (type) => {
    const reason = type === 'edit' ? editReason : deleteReason;
    if (!reason.trim() || reason.trim().length < 20) {
      toast.error('Please provide a detailed reason (at least 20 characters)'); return;
    }
    setSubmittingReq(true);
    try {
      await taskersApi.submitKYCRequest({ request_type: type, reason: reason.trim() });
      toast.success('Request submitted. Our team will review within 24–48 hours.');
      if (type === 'edit') { setEditReason(''); setShowEditRequest(false); }
      else { setDeleteReason(''); setShowDeleteRequest(false); }
      taskersApi.getMyKYCRequests().then(({ data }) => setRequests(data.requests || [])).catch(() => {});
    } catch (err) { toast.error(err.response?.data?.message || 'Could not submit request'); }
    finally { setSubmittingReq(false); }
  };

  function DocRow({ label, name, currentUrl, locked, onFile }) {
    const [file, setFile] = useState(null);
    const handleFile = (f) => { setFile(f); onFile(name, f); };
    if (locked && currentUrl) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid #bbf7d0', borderRadius: 12, background: '#f0fdf4' }}>
          <CheckCircle size={15} style={{ color: '#00c37e', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#166534', fontWeight: 600, flex: 1 }}>{label} — uploaded</span>
          <a href={currentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600, textDecoration: 'underline' }}>View</a>
        </div>
      );
    }
    return (
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `2px dashed ${currentUrl ? '#00c37e' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rose)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = currentUrl ? '#00c37e' : 'var(--border)'}>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) handleFile(f); }} />
          <div style={{ width: 34, height: 34, borderRadius: 8, background: currentUrl ? '#f0fdf4' : 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {currentUrl ? <CheckCircle size={14} style={{ color: '#00c37e' }} /> : <Upload size={14} style={{ color: 'var(--rose)' }} />}
          </div>
          <div style={{ flex: 1 }}>
            {file
              ? <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--rose)' }}>{file.name}</p>
              : currentUrl
                ? <p style={{ fontSize: 13, color: '#00c37e', fontWeight: 600 }}>Uploaded  — click to replace</p>
                : <p style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</p>
            }
          </div>
        </label>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }} className="space-y-5">

      {/* ── Status Banner ── */}
      {isKycComplete && (
        <div className="card p-5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="flex items-center gap-3">
            <CheckCircle size={22} style={{ color: '#00c37e', flexShrink: 0 }} />
            <div>
              <p className="font-black" style={{ color: '#14532d' }}>KYC Verified — Enterprise Tasks Unlocked</p>
              <p className="text-sm" style={{ color: '#166534' }}>You have full access to enterprise tasks and all platform features.</p>
            </div>
          </div>
        </div>
      )}

      {!isKycComplete && kycSubmissionStatus === 'pending_review' && (
        <div className="card p-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div className="flex items-center gap-3">
            <RefreshCw size={20} style={{ color: '#b45309', flexShrink: 0 }} />
            <div>
              <p className="font-black text-amber-800">KYC Under Review</p>
              <p className="text-sm text-amber-700">Your documents have been submitted and are being reviewed by our team. You'll be notified within 24–48 hours.</p>
            </div>
          </div>
        </div>
      )}

      {!isKycComplete && kycSubmissionStatus === 'rejected' && (
        <div className="card p-5" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
          <p className="font-black mb-1" style={{ color: '#c41445' }}>KYC Submission Rejected</p>
          <p className="text-sm mb-2" style={{ color: '#c41445' }}>
            {rejectedSubmission?.admin_note
              ? `Reason: ${rejectedSubmission.admin_note}`
              : 'Your documents were not accepted. Please re-upload valid documents and resubmit.'}
          </p>
          <p className="text-xs" style={{ color: '#c41445' }}>Your previous documents have been cleared. Upload new ones below.</p>
        </div>
      )}

      {!isKycComplete && kycSubmissionStatus === 'not_submitted' && (
        <div className="card p-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p className="font-bold text-sm text-amber-800 mb-1">Complete KYC to unlock enterprise tasks</p>
          <p className="text-xs text-amber-700">Upload your ID and proof of address. Our team will review and approve within 24–48 hours. Normal tasks are always available without KYC.</p>
        </div>
      )}

      {/* ── Lock notice with change request buttons ── */}
      {docsLocked && !approvedEdit && (
        <div className="card p-4" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
          <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>Documents locked</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            Uploaded documents are locked for security. To replace them, request admin approval below.
            To permanently delete your account, use the separate button.
          </p>
          {!pendingSubmission && (
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => { setShowEditRequest(!showEditRequest); setShowDeleteRequest(false); }}
                className="btn-ghost btn-sm border" style={{ fontSize: 12 }}>
                Request to Edit Documents
              </button>
              <button onClick={() => { setShowDeleteRequest(!showDeleteRequest); setShowEditRequest(false); }}
                style={{ background: 'white', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Request Account Deletion
              </button>
            </div>
          )}

          {showEditRequest && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              {pendingEdit ? (
                <p className="text-sm font-semibold text-amber-800">
                  Edit request pending since {new Date(pendingEdit.created_at).toLocaleDateString()}. Awaiting admin review.
                </p>
              ) : (
                <>
                  <p className="font-bold text-sm text-amber-800 mb-2">Why do you need to edit your documents?</p>
                  <textarea rows={3} placeholder="e.g. Uploaded wrong document, document expired..." value={editReason}
                    onChange={e => setEditReason(e.target.value)} className="input resize-none text-sm mb-3" maxLength={500} />
                  <button onClick={() => submitChangeRequest('edit')} disabled={submittingReq} className="btn-primary btn-sm">
                    {submittingReq ? 'Submitting…' : 'Submit Edit Request'}
                  </button>
                </>
              )}
            </div>
          )}

          {showDeleteRequest && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}>
              {pendingDelete ? (
                <p className="text-sm font-semibold" style={{ color: '#c41445' }}>
                  Deletion request pending since {new Date(pendingDelete.created_at).toLocaleDateString()}. Awaiting admin review.
                </p>
              ) : (
                <>
                  <p className="font-bold text-sm mb-1" style={{ color: '#c41445' }}>Request Account Deletion</p>
                  <p className="text-xs mb-2" style={{ color: '#c41445' }}>This permanently deletes your account once approved. Cannot be undone.</p>
                  <textarea rows={3} placeholder="Why do you want to delete your account?" value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)} className="input resize-none text-sm mb-3" maxLength={500} />
                  <button onClick={() => submitChangeRequest('delete_account')} disabled={submittingReq}
                    style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                    {submittingReq ? 'Submitting…' : 'Submit Deletion Request'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Approved edit notice ── */}
      {approvedEdit && (
        <div className="card p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p className="font-bold text-sm" style={{ color: '#14532d' }}>Edit approved — upload new documents below and resubmit</p>
          <p className="text-xs mt-1" style={{ color: '#166534' }}>Your previous documents were cleared. Upload replacements and click Submit for review.</p>
        </div>
      )}

      {/* ── KYC Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Contact Details — always editable */}
        <div className="card p-6">
          <h4 className="font-black text-base mb-4" style={{ color: 'var(--text)' }}>Contact Details</h4>
          <div className="space-y-3">
            <div>
              <label className="label">Home Address</label>
              <input type="text" placeholder="Your full home address" value={homeAddress}
                onChange={e => setHomeAddress(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Social Media / LinkedIn URL</label>
              <input type="url" placeholder="https://linkedin.com/in/yourname or Instagram/Twitter link" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Identity Documents */}
        <div className="card p-6">
          <h4 className="font-black text-base mb-1" style={{ color: 'var(--text)' }}>Identity Documents</h4>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Upload at least one government-issued ID.</p>
          <div className="space-y-3">
            <DocRow label="National ID Card" name="national_id" currentUrl={profile?.national_id_url} locked={docsLocked && !approvedEdit} onFile={setDoc} />
            <DocRow label="Driver's License" name="driver_license" currentUrl={profile?.driver_license_url} locked={docsLocked && !approvedEdit} onFile={setDoc} />
            <DocRow label="International Passport" name="passport" currentUrl={profile?.passport_url} locked={docsLocked && !approvedEdit} onFile={setDoc} />
          </div>
        </div>

        {/* Proof of Address */}
        <div className="card p-6">
          <h4 className="font-black text-base mb-1" style={{ color: 'var(--text)' }}>Proof of Address</h4>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Utility bill, bank statement, or any official document with your address on it.</p>
          <DocRow label="Proof of Address" name="proof_of_address" currentUrl={profile?.proof_of_address_url} locked={docsLocked && !approvedEdit} onFile={setDoc} />
        </div>

        {/* Submit button — only when upload form is active */}
        {canSubmitKYC && (
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Uploading & submitting…' : 'Submit Documents for Review'}
          </button>
        )}

        {/* Contact-only save */}
        {(homeAddress !== (profile?.home_address || '') || socialUrl !== (profile?.linkedin_url || '')) && (
          <button type="submit" disabled={saving} className="btn-ghost btn-sm border w-full">
            {saving ? 'Saving…' : 'Save Contact Details'}
          </button>
        )}
      </form>

      {/* ── Request history ── */}
      {!loadingReqs && requests.filter(r => r.status !== 'pending').length > 0 && (
        <div className="card p-4">
          <p className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Request History</p>
          <div className="space-y-2">
            {requests.filter(r => r.status !== 'pending').map(r => (
              <div key={r.id} style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, background: r.status === 'approved' ? '#f0fdf4' : '#fff1f2' }}>
                <span className="font-bold" style={{ color: r.status === 'approved' ? '#14532d' : '#c41445' }}>
                  {r.request_type === 'kyc_submission' ? 'KYC submission' : r.request_type === 'edit' ? 'Edit request' : 'Deletion request'} — {r.status}
                </span>
                {r.admin_note && <p style={{ color: '#555', marginTop: 2 }}>Admin note: {r.admin_note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Enterprise Tasks ──────────────────────────────────────────── */
function EnterpriseTasksTab({ user }) {
  const [tab, setTab] = useState('available');
  const [availTasks, setAvailTasks] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(null);
  const [bidMsg, setBidMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kycRequired, setKycRequired] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [avail, bids] = await Promise.all([enterpriseApi.taskerAvailable(), enterpriseApi.taskerMyTasks()]);
      setAvailTasks(avail.data.tasks || []);
      setMyBids(bids.data.bids || []);
      setKycRequired(false);
    } catch (err) {
      if (err.response?.data?.kyc_required) {
        setKycRequired(true);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (kycRequired) return (
    <div className="card p-8 text-center" style={{ maxWidth: 500 }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Banknote size={26} style={{ color: '#b45309' }} />
      </div>
      <h3 className="font-black text-lg mb-2" style={{ color: 'var(--text)' }}>KYC Required for Enterprise Tasks</h3>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
        Enterprise tasks require identity verification. Upload your ID document and proof of address to unlock this feature.
        Normal tasks from requesters are always available without KYC.
      </p>
      <button onClick={() => window.dispatchEvent(new CustomEvent('tasker-nav', { detail: 'kyc' }))}
        className="btn-primary btn-sm">
        Complete KYC Verification
      </button>
    </div>
  );

  const submitBid = async (taskId) => {
    setSubmitting(true);
    try {
      await enterpriseApi.placeBid(taskId, { message: bidMsg });
      toast.success('Application submitted! The company will review and get back to you.');
      setBidding(null); setBidMsg(''); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not submit'); }
    finally { setSubmitting(false); }
  };

  const uploadProof = async (bidId, taskId, files) => {
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('proofs', f));
      fd.append('bid_id', bidId);
      await enterpriseApi.uploadProofs(taskId, fd);
      toast.success(`${files.length} proof file(s) uploaded!`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-black text-gray-900 text-lg">Enterprise Tasks</h3>
        <div className="flex gap-2">
          {[['available','Available'],['my-bids',`My Applications (${myBids.length})`]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                tab === t ? 'text-white' : 'bg-white border text-gray-500')}
              style={tab === t ? { background: 'var(--primary)' } : { borderColor: 'var(--border)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>
      ) : tab === 'available' ? (
        availTasks.length === 0 ? (
          <div className="card empty-state">
            <Building2 size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-700">No enterprise tasks in your area</p>
            <p className="text-gray-400 text-sm mt-1">Update your task city in your profile to see more</p>
          </div>
        ) : availTasks.map(task => (
          <div key={task.id} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                {task.company?.company_logo_url ? <img src={task.company.company_logo_url} alt="" className="w-full h-full object-cover"/> : task.company?.company_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-400">{task.company?.company_name} · {task.task_type?.name || task.custom_task_type}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.state_deployments?.map(d => (
                    <span key={d.id} className="badge-gray text-xs">{d.state} ({d.people_needed} needed)</span>
                  ))}
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span style={{ color: 'var(--primary)' }} className="font-bold">{money(task.adjusted_price_per_person||0)}/person</span>
                  <span>⏱️ SLA: {task.sla_hours}h</span>
                </div>
              </div>
            </div>
            {bidding === task.id ? (
              <div className="mt-4 p-4 rounded-2xl space-y-3" style={{ background: 'var(--primary-light)', border: '1px solid rgba(255,45,98,0.2)' }}>
                <p className="font-bold text-sm" style={{ color: 'var(--rose-dark)' }}>Your Application Message</p>
                <textarea rows={3} value={bidMsg} onChange={e => setBidMsg(e.target.value)}
                  placeholder="Introduce yourself, your location, and why you're right for this..." className="input resize-none text-sm"/>
                <p className="text-xs bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-100">
                  If accepted, you must upload GPS-stamped timestamp photos as proof of work. Install a GPS Timestamp Camera app before you accept.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => submitBid(task.id)} disabled={submitting} className="btn-primary btn-sm">
                    {submitting ? 'Submitting...' : 'Apply Now'}
                  </button>
                  <button onClick={() => { setBidding(null); setBidMsg(''); }} className="btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setBidding(task.id)} className="btn-primary btn-sm mt-4">Apply for This Task</button>
            )}
          </div>
        ))
      ) : (
        myBids.length === 0 ? (
          <div className="card empty-state"><Briefcase size={36} className="mx-auto mb-3 text-gray-300" /><p className="font-bold text-gray-700">No applications yet</p></div>
        ) : myBids.map(bid => (
          <div key={bid.id} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                {bid.enterprise_task?.company?.company_logo_url ? <img src={bid.enterprise_task.company.company_logo_url} alt="" className="w-full h-full object-cover"/> : bid.enterprise_task?.company?.company_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{bid.enterprise_task?.title}</p>
                <p className="text-sm text-gray-400">{bid.enterprise_task?.company?.company_name}</p>
                <span className={clsx('badge mt-1',
                  bid.status==='accepted'?'badge-green':bid.status==='rejected'?'badge-red':bid.status==='ignored'?'badge-gray':'badge-yellow')}>
                  {bid.status}
                </span>
              </div>
            </div>
            {bid.status === 'accepted' && (
              <div className="mt-4 space-y-3">
                {bid.authorization_letter_url && (
                  <a href={bid.authorization_letter_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--rose-dark)' }}>
                    Download Your Authorization Letter
                  </a>
                )}
                <div className="p-3 rounded-xl border" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                  <p className="font-bold text-xs text-amber-800 mb-2">Upload Proof of Work</p>
                  <p className="text-xs text-amber-700 mb-3">Upload GPS-stamped photos and any other evidence. All photos must show your GPS coordinates and timestamp.</p>
                  <label className="cursor-pointer inline-flex">
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => uploadProof(bid.id, bid.enterprise_task_id, e.target.files)}/>
                    <span className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#f59e0b' }}>Upload Proof Files</span>
                  </label>
                </div>
                {bid.proofs?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {bid.proofs.map(p => (
                      <div key={p.id} className="relative rounded-xl overflow-hidden aspect-square border" style={{ borderColor: 'var(--border)' }}>
                        <img src={p.file_url} alt="proof" className="w-full h-full object-cover"/>
                        <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-xs text-center">
                          {p.is_approved === true ? 'Approved' : p.is_approved === false ? 'Rejected' : 'Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function TaskerDashboard() {
  const { user, profile, isApprovedTasker, isPendingTasker } = useAuth();
  const [active, setActive] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    // Every sidebar tab is valid; older link names (used in notifications) map to the real tab.
    const ALIASES = { earnings: 'payments', 'active-tasks': 'my-tasks', completed: 'my-tasks', referrals: 'refer-wallet' };
    const resolved = ALIASES[tab] || tab;
    return NAV.some(n => n.id === resolved) ? resolved : 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Allow child components (like EnterpriseTasksTab) to trigger tab changes
  useEffect(() => {
    const handler = (e) => setActive(e.detail);
    window.addEventListener('tasker-nav', handler);
    const onOpen = (e) => { if (e.detail?.scope === 'tasker') setActive('my-tasks'); };
    window.addEventListener('open-task', onOpen);
    return () => { window.removeEventListener('tasker-nav', handler); window.removeEventListener('open-task', onOpen); };
  }, []);

  // Links such as /tasker?tab=my-tasks&task=<id> (notifications) open that
  // task's page — also when the dashboard is already on screen.
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskParam = params.get('task');
    const tab = params.get('tab');
    const ALIASES = { earnings: 'payments', 'active-tasks': 'my-tasks', completed: 'my-tasks', referrals: 'refer-wallet' };
    const resolved = ALIASES[tab] || tab;
    if (taskParam) { setActive('my-tasks'); requestOpenTask('tasker', taskParam); }
    else if (resolved && NAV.some(n => n.id === resolved)) setActive(resolved);
  }, [location.search]);
  const [dashData, setDashData] = useState({ profile: null, pending_bids: [], active_tasks: [] });
  const [activeTasks, setActiveTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Sync availability from loaded profile
  useEffect(() => {
    if (dashData.profile?.is_available !== undefined) {
      setIsAvailable(dashData.profile.is_available);
    }
  }, [dashData.profile?.is_available]);

  const load = async () => {
    setLoading(true);
    try {
      // Use allSettled so a 403 on one endpoint doesn't kill the whole load
      const [dash, tasks, roomsRes, paymentsRes, refundsRes, cancelRes] = await Promise.allSettled([
        taskersApi.dashboard(), tasksApi.myTaskerTasks(),
        chatApi.getRooms(), paymentsApi.history(), paymentsApi.refunds(),
        tasksApi.myCancelRequests(),
      ]);
      if (dash.status === 'fulfilled') {
        setDashData(dash.value.data);
        setIsAvailable(dash.value.data.profile?.is_available ?? true);
      }
      if (tasks.status === 'fulfilled') setActiveTasks(tasks.value.data.tasks || []);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data.rooms || []);
      if (paymentsRes.status === 'fulfilled') setPayments(paymentsRes.value.data.payments || []);
      if (refundsRes.status === 'fulfilled') setRefunds(refundsRes.value.data.refunds || []);
      if (cancelRes.status === 'fulfilled') setCancelRequests(cancelRes.value.data.requests || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await taskersApi.updateAvailability({ is_available: next });
      toast.success(next ? 'You are now visible to requesters' : 'You are now hidden from search');
    } catch { setIsAvailable(!next); toast.error('Could not update availability'); }
  };

  // Count actions needing the tasker's response — pending cancellations +
  // pending refund requests both live under Earnings → Action Needed.
  const pendingCancelCount = (cancelRequests || []).filter(c => c.status === 'pending').length;
  const pendingRefundCount = (refunds || []).filter(r => r.status === 'pending').length;
  const pendingActionCount = pendingCancelCount + pendingRefundCount;

  if (loading && activeTasks.length === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <>
      <SEO title="Tasker Dashboard — Taskeeu" description="Manage your tasks, bids, and earnings on Taskeeu." />
      <ReviewGate />
      <div className="dash-wrapper">
        {sidebarOpen && <div className="dash-overlay lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <Sidebar
          active={active} setActive={setActive} user={user}
          profile={dashData.profile} isAvailable={isAvailable}
          onToggle={toggleAvailability} isMobile={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          pendingActionCount={pendingActionCount}
        />
        <div className="dash-main">
          <Topbar active={active} onMenuOpen={() => setSidebarOpen(true)} onRefresh={load} loading={loading} onTabChange={setActive} />
          <main className="dash-content page-enter">
            {isPendingTasker && (
              <div style={{
                background: '#fef9c3',
                border: '1px solid #fde68a', borderRadius: 16,
                padding: '14px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>⏳</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, color: '#92400e', fontSize: 14, marginBottom: 2 }}>
                    Application Under Review
                  </p>
                  <p style={{ color: '#a16207', fontSize: 13 }}>
                    Our team is verifying your documents — you'll hear back within 24–48 hours at <strong>{user?.email}</strong>. 
                    You can complete your profile below while you wait.
                  </p>
                </div>
              </div>
            )}
            {active === 'overview' && pendingCancelCount > 0 && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca', borderRadius: 16,
                padding: '16px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}></span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontWeight: 800, color: '#991b1b', fontSize: 14, marginBottom: 2 }}>
                    {pendingCancelCount} cancellation request{pendingCancelCount > 1 ? 's' : ''} awaiting your response
                  </p>
                  <p style={{ color: '#b91c1c', fontSize: 13 }}>
                    A requester wants to cancel {pendingCancelCount > 1 ? 'tasks' : 'a task'} you're assigned to. Review the reason and approve or deny.
                  </p>
                </div>
                <button onClick={() => setActive('payments')}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
                  Review Now
                </button>
              </div>
            )}
            {active === 'overview'&& <Overview dashData={dashData} onTabChange={setActive} user={user} />}
            {active === 'browse'&& <PendingGuard><BrowseTasks taskerProfile={dashData.profile} /></PendingGuard>}
            {active === 'my-tasks'&& <PendingGuard><MyTasks tasks={activeTasks} onUpdate={load} onOpenChat={(task) => {
              // Find the chat room for this task and open it
              const room = rooms.find(r => r.task_id === task.id);
              if (room) { setSelectedRoom(room); setActive('chat'); }
              else { toast.error('No chat room found for this task yet.'); }
            }} /></PendingGuard>}
            {active === 'bids'&& (
              <PendingGuard>
              <div className="space-y-4">
                <h3 className="font-black text-gray-900 text-lg">My Bids</h3>
                {dashData.pending_bids?.length === 0 ? (
                  <div className="card empty-state">
                    <Briefcase size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-bold text-gray-700">No active bids</p>
                    <p className="text-gray-400 text-sm mt-1">Browse tasks and start bidding</p>
                  </div>
                ) : dashData.pending_bids?.map(bid => (
                  <div key={bid.id} className="card p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <Link to={cpath(`/tasks/${bid.task?.id}`)} className="font-bold text-gray-900 hover:underline truncate block">{bid.task?.title}</Link>
                        <p className="text-sm text-gray-400 mt-0.5">{bid.task?.task_city} · {bid.task?.deadline ? format(new Date(bid.task.deadline), 'MMM d') : 'TBD'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-black" style={{ color: 'var(--primary)' }}>{money(bid.workmanship_price)}</p>
                        <span className={clsx('badge', bid.status==='accepted'?'badge-green':bid.status==='rejected'?'badge-red':'badge-yellow')}>{bid.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </PendingGuard>
            )}
            {active === 'enterprise'&& <PendingGuard><EnterpriseTasksTab user={user} /></PendingGuard>}
            {active === 'certifications' && <EnterpriseCertification userId={user?.id} />}
            {active === 'chat'&& <PendingGuard><Messages rooms={rooms} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} /></PendingGuard>}
            {active === 'payments'&& <PendingGuard><TaskerPayments payments={payments} refunds={refunds} cancelRequests={cancelRequests} profile={dashData.profile} onUpdate={load} /></PendingGuard>}
            {active === 'refer-wallet'&& <ReferWalletPanel />}
            {active === 'marketing'&& <MarketingPosterTab user={user} profile={dashData?.profile} role="tasker" />}
            {active === 'vooom'&& <VooomDashTab user={user} role="tasker" />}
            {active === 'profile'&& <div className="space-y-5"><TaskerProfileTab user={user} profile={dashData.profile} onUpdate={load} /><ReviewsReceived as="tasker" /></div>}
            {active === 'kyc'&& <KYCTab profile={dashData.profile} onUpdate={load} />}
            {active === 'support'&& <SupportWidget />}
          </main>
        </div>
      </div>
    </>
  );
}
