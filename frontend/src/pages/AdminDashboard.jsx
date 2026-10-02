import { useState, useEffect, useRef } from 'react';
import { taskPrice, costLines } from '../utils/taskPrice';
import { createPortal } from 'react-dom';
import SEO from '../components/seo/SEO';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Eye, ChevronRight, Shield, AlertTriangle, RefreshCw, LayoutDashboard, Users, ClipboardList, DollarSign, RotateCcw, FileText, ScrollText, LogOut, MessageSquare, Building2, Send, Search, Filter, UserCheck, CheckCircle, Inbox, Radio, XCircle, Clock, ChevronLeft, AlertCircle, Star, MapPin, Camera, Wallet, Ban, BarChart2, Globe, TrendingUp, MousePointer, Settings, ToggleLeft, ToggleRight, Gift, Link2, Bell, Zap, EyeOff } from 'lucide-react';
import { adminApi, demoApi, supportApi, contactApi, pushApi } from '../utils/api';
import AdminBlogManager from '../components/admin/AdminBlogManager';
import AdminPayoutsPanel from '../components/admin/AdminPayoutsPanel';
import { formatMoney } from '../utils/market';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ── NAV ─────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',      Icon: LayoutDashboard, label: 'Overview' },
  { id: 'analytics',     Icon: BarChart2,        label: 'Analytics' },
  { id: 'taskers',       Icon: UserCheck,       label: 'Tasker KYC',       badge: 'kyc' },
  { id: 'kyc-requests',  Icon: AlertCircle,     label: 'KYC Requests',     badge: 'kyc-requests' },
  { id: 'users',         Icon: Users,           label: 'All Users' },
  { id: 'companies',     Icon: Building2,       label: 'Companies' },
  { id: 'tasks',         Icon: ClipboardList,   label: 'All Tasks' },
  { id: 'payments',      Icon: DollarSign,      label: 'Revenue & Earnings' },
  { id: 'refunds',       Icon: RotateCcw,       label: 'Refunds' },
  { id: 'payouts',       Icon: Wallet,          label: 'Intl Payouts' },
  { id: 'support',       Icon: MessageSquare,   label: 'Support',          badge: 'support' },
  { id: 'contacts',      Icon: Inbox,           label: 'Contacts',         badge: 'contacts' },
  { id: 'broadcast',     Icon: Radio,           label: 'Broadcast' },
  { id: 'push',          Icon: Bell,            label: 'Push Alerts' },
  { id: 'referrals',     Icon: Gift,            label: 'Refer Program' },
  { id: 'blog',          Icon: FileText,        label: 'Blog Posts' },
  { id: 'demos',         Icon: ScrollText,      label: 'Demo Requests' },
  { id: 'audit',         Icon: ScrollText,      label: 'Audit Log' },
  { id: 'settings',      Icon: Settings,        label: 'Settings' },
];

// ── STATUS TAG ───────────────────────────────────────────────────────
function Tag({ color, bg, label }) {
  return (
    <span style={{ background: bg, color, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function TaskTag({ status }) {
  const map = {
    open: { bg: '#dcfce7', color: '#166534', label: 'Open' },
    bidding: { bg: '#fef9c3', color: '#854d0e', label: 'Bidding' },
    ongoing: { bg: '#dbeafe', color: '#1e40af', label: 'Ongoing' },
    completed: { bg: '#f1f5f9', color: '#475569', label: 'Completed' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  };
  const s = map[status] || map.open;
  return <Tag {...s} />;
}

function VerifTag({ status }) {
  const map = {
    pending:  { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return <Tag {...s} />;
}

function UserRoleTag({ role }) {
  const map = {
    requester: { bg: '#dbeafe', color: '#1e40af', label: 'Requester' },
    tasker:    { bg: '#f3e8ff', color: '#6b21a8', label: 'Tasker' },
    admin:     { bg: '#ffeef3', color: '#be1a4b', label: 'Admin' },
  };
  const s = map[role] || map.requester;
  return <Tag {...s} />;
}

function SupportStatusTag({ status }) {
  const map = {
    open:         { bg: '#fef9c3', color: '#854d0e',  label: 'Open' },
    in_progress:  { bg: '#dbeafe', color: '#1e40af',  label: 'In Progress' },
    waiting_user: { bg: '#f3e8ff', color: '#6b21a8',  label: 'Waiting User' },
    resolved:     { bg: '#dcfce7', color: '#166534',  label: 'Resolved' },
    closed:       { bg: '#f1f5f9', color: '#475569',  label: 'Closed' },
  };
  const s = map[status] || map.open;
  return <Tag {...s} />;
}

// ── SIDEBAR ──────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, pendingCount, supportCount, contactCount, kycReqCount, isMobile, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <aside className={clsx('dash-sidebar', isMobile && 'open')}>
      <div className="dash-sidebar-logo flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
          <span className="font-black text-white text-xl" style={{ letterSpacing: '-0.03em' }}>Taskeeu</span>
        </Link>
        {isMobile && <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X size={20} /></button>}
      </div>

      <div className="mx-3 mt-4 mb-2 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))' }}>
            {user?.full_name?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{user?.full_name || 'Admin'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={10} style={{ color: 'var(--rose)' }} />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Administrator</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="dash-sidebar-nav">
        <p className="sidebar-section-label">Management</p>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setActive(item.id); onClose?.(); }}
            className={clsx('sidebar-link', active === item.id && 'active')}>
            <span className="sidebar-icon"><item.Icon size={16} /></span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge === 'kyc' && pendingCount > 0 && (
              <span style={{ minWidth: 20, height: 20, borderRadius: 6, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
            {item.badge === 'support' && supportCount > 0 && (
              <span style={{ minWidth: 20, height: 20, borderRadius: 6, background: '#f97316', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {supportCount > 99 ? '99+' : supportCount}
              </span>
            )}
            {item.badge === 'contacts' && contactCount > 0 && (
              <span style={{ minWidth: 20, height: 20, borderRadius: 6, background: '#8b5cf6', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {contactCount > 99 ? '99+' : contactCount}
              </span>
            )}
            {item.badge === 'kyc-requests' && kycReqCount > 0 && (
              <span style={{ minWidth: 20, height: 20, borderRadius: 6, background: '#f59e0b', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {kycReqCount > 99 ? '99+' : kycReqCount}
              </span>
            )}
          </button>
        ))}
        <div className="pt-4">
          <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
          <button onClick={() => { logout(); navigate('/'); }} className="sidebar-link" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="sidebar-icon"><LogOut size={16} /></span><span>Log Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}

// ── TOPBAR ──────────────────────────────────────────────────────────
function Topbar({ active, onMenuOpen, onRefresh, loading }) {
  const label = NAV.find(n => n.id === active)?.label || 'Admin Panel';
  return (
    <header className="dash-topbar">
      <div className="flex items-center gap-3">
        <button onClick={onMenuOpen} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <Menu size={20} />
        </button>
        <h1 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.02em' }}>{label}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} disabled={loading}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-40">
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
}

// ── OVERVIEW ─────────────────────────────────────────────────────────
function Overview({ stats, pendingTaskers, recentTasks, onTabChange }) {
  const metrics = [
    { Icon: Users,       label: 'Total Users',   value: stats.total_users || 0,    color: '#3b82f6', bg: '#eff6ff' },
    { Icon: ClipboardList, label: 'Total Tasks', value: stats.total_tasks || 0,    color: '#8b5cf6', bg: '#f5f3ff' },
    { Icon: Zap,           label: 'Vooom Tasks', value: stats.total_vooom_tasks || 0, color: '#ff2d62', bg: '#fff0f4' },
    { Icon: DollarSign,  label: 'Payments received', value: `₦${Number(stats.total_revenue||0).toLocaleString()}`, color: '#00C37E', bg: '#f0fdf4' },
    { Icon: TrendingUp,  label: 'Taskeeu earnings (fees)', value: stats.platform_earnings ? `₦${Number(stats.platform_earnings.earned_all_time||0).toLocaleString()}` : '—', color: '#7c3aed', bg: '#f5f3ff',
      sub: stats.platform_earnings ? `This month ₦${Number(stats.platform_earnings.earned_this_month||0).toLocaleString()} · due ₦${Number(stats.platform_earnings.due_on_withdrawal||0).toLocaleString()}` : null,
      onClick: () => onTabChange('payments') },
    { Icon: AlertTriangle, label: 'Pending KYC', value: stats.pending_tasker_approvals || 0, color: '#f97316', bg: '#fff7ed' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ Icon, label, value, color, bg, sub, onClick }) => (
          <div key={label} className="stat-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} data-testid={onClick ? 'earnings-stat' : undefined}>
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <p className="stat-value" style={{ color }}>{value}</p>
            <p className="stat-label">{label}</p>
            {sub && <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Users by role */}
      {stats.users_by_role && (
        <div className="card p-5">
          <h3 style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>Platform Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { role: 'requester', Icon: Users,     label: 'Requesters', color: '#3b82f6', bg: '#eff6ff' },
              { role: 'tasker',    Icon: UserCheck,  label: 'Taskers',    color: '#8b5cf6', bg: '#f5f3ff' },
              { role: 'admin',     Icon: Shield,     label: 'Admins',     color: 'var(--rose)', bg: 'var(--rose-light)' },
            ].map(({ role, Icon, label, color, bg }) => {
              const count = stats.users_by_role?.[role] || 0;
              return (
                <div key={role} className="text-center p-4 rounded-2xl" style={{ background: bg }}>
                  <Icon size={20} style={{ color, margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', letterSpacing: '-0.04em' }}>{count}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending KYC alert */}
      {pendingTaskers?.length > 0 && (
        <div className="card overflow-hidden" style={{ borderLeft: '4px solid #f97316' }}>
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: '#f97316' }} />
              <h3 style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>
                {pendingTaskers.length} Pending KYC Reviews
              </h3>
            </div>
            <button onClick={() => onTabChange('taskers')} style={{ color: 'var(--rose)', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
              Review All
            </button>
          </div>
          {pendingTaskers.slice(0, 3).map(t => (
            <div key={t.user_id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ background: '#fffbeb', borderColor: 'var(--border-light)' }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: 'var(--rose)' }}>
                {t.user?.avatar_url ? <img src={t.user.avatar_url} alt="" className="w-full h-full object-cover" /> : t.user?.full_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">{t.user?.full_name}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t.task_city}, {t.task_state} · {t.created_at ? formatDistanceToNow(new Date(t.created_at), { addSuffix: true }) : ""}</p>
              </div>
              <button onClick={() => onTabChange('taskers', t)} className="btn-primary btn-sm">Review</button>
            </div>
          ))}
        </div>
      )}

      {/* Recent tasks */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <h3 style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>Recent Tasks</h3>
          <button onClick={() => onTabChange('tasks')} style={{ color: 'var(--rose)', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
            View All
          </button>
        </div>
        {recentTasks?.slice(0, 8).map(task => (
          <div key={task.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">{task.title}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>by {task.requester?.full_name} · {task.task_city}</p>
            </div>
            <TaskTag status={task.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ANALYTICS ────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]   = useState('7d');
  const [resetting, setResetting] = useState(false);

  useEffect(() => { load(); }, [range]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getAnalytics(range);
      setData(res);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const resetViews = async () => {
    if (!window.confirm('Reset all page view counts to 0? This cannot be undone.')) return;
    setResetting(true);
    try {
      await adminApi.resetAnalytics();
      toast.success('Page view counts reset to 0');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset analytics');
    } finally { setResetting(false); }
  };

  const maxPageViews  = data ? Math.max(...(data.byPage.map(p => p.views)), 1) : 1;
  const maxCountryViews = data ? Math.max(...(data.byCountry.map(c => c.views)), 1) : 1;
  const maxDaily      = data ? Math.max(...(data.dailyViews.map(d => d.views)), 1) : 1;

  const rangeLabel = { '1d': 'Today', '7d': 'Last 7 Days', '30d': 'Last 30 Days' }[range];

  // Country flag emoji helper (works for most countries)
  const flag = (country) => {
    try {
      const code = ({
        'Nigeria': 'NG', 'United States': 'US', 'United Kingdom': 'GB',
        'Canada': 'CA', 'Ghana': 'GH', 'South Africa': 'ZA', 'Kenya': 'KE',
        'Germany': 'DE', 'France': 'FR', 'Netherlands': 'NL', 'Sweden': 'SE',
        'Australia': 'AU', 'India': 'IN', 'China': 'CN', 'Brazil': 'BR',
        'Italy': 'IT', 'Spain': 'ES', 'Norway': 'NO', 'Denmark': 'DK',
        'Finland': 'FI', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
        'Ireland': 'IE', 'Portugal': 'PT', 'Poland': 'PL', 'UAE': 'AE',
        'Saudi Arabia': 'SA', 'Qatar': 'QA', 'Cameroon': 'CM', 'Senegal': 'SN',
      })[country];
      if (!code) return '';
      return String.fromCodePoint(...[...code].map(c => 0x1F1A5 + c.charCodeAt(0)));
    } catch { return ''; }
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
    catch { return iso; }
  };

  const card = {
    background: 'white',
    borderRadius: 16,
    border: '1px solid var(--border-light)',
    padding: '20px 24px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  };

  if (loading) return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="stat-card"><div className="skeleton h-16 w-full" /></div>)}
      </div>
      <div className="skeleton h-56 w-full rounded-2xl" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            Site Analytics
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{rangeLabel} · real visitors to public pages</p>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {[['1d','Today'],['7d','7 Days'],['30d','30 Days']].map(([val, lbl]) => (
            <button key={val} onClick={() => setRange(val)}
              style={{
                padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: range === val ? 'var(--rose)' : 'white',
                color: range === val ? 'white' : 'var(--text)',
                border: range === val ? '1.5px solid var(--rose)' : '1.5px solid var(--border-light)',
              }}>
              {lbl}
            </button>
          ))}
          <button onClick={load} style={{ padding: '7px 12px', borderRadius: 10, background: 'white', border: '1.5px solid var(--border-light)', cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ color: 'var(--muted)' }} />
          </button>
          <button onClick={resetViews} disabled={resetting}
            style={{ padding: '7px 14px', borderRadius: 10, background: '#fff1f2', border: '1.5px solid #fecdd3', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#be123c', display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw size={12} /> {resetting ? 'Resetting…' : 'Reset views'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { Icon: Eye,          label: 'Total Page Views',   value: data.summary.totalViews.toLocaleString(),    color: '#3b82f6', bg: '#eff6ff' },
          { Icon: MousePointer, label: 'Unique Sessions',    value: data.summary.uniqueSessions.toLocaleString(), color: '#8b5cf6', bg: '#f5f3ff' },
          { Icon: Globe,        label: 'Countries',          value: data.byCountry.length,                        color: '#00C37E', bg: '#f0fdf4' },
          { Icon: TrendingUp,   label: 'Pages Tracked',      value: data.byPage.length,                           color: '#f97316', bg: '#fff7ed' },
        ].map(({ Icon, label, value, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}><Icon size={20} style={{ color }} /></div>
            <p className="stat-value" style={{ color }}>{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily bar chart */}
      <div style={card}>
        <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 20 }}>Page Views Per Day
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, overflowX: 'auto' }}>
          {data.dailyViews.map(({ date, views }) => {
            const pct = (views / maxDaily) * 100;
            return (
              <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 28 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{views || ''}</span>
                <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 6, height: 110, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', borderRadius: 6,
                    height: `${Math.max(pct, views > 0 ? 4 : 0)}%`,
                    background: 'linear-gradient(to top, var(--rose), #ff8fa3)',
                    transition: 'height 0.3s ease',
                  }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatDate(date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Countries + Pages side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* By Country */}
        <div style={card}>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 16 }}>Visitors by Country
          </h3>
          {data.byCountry.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No country data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.byCountry.map(({ country, views }) => {
                const pct = Math.round((views / maxCountryViews) * 100);
                return (
                  <div key={country}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {flag(country)} {country}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{views.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(to right, var(--rose), #ff8fa3)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Page */}
        <div style={card}>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 16 }}>Top Pages
          </h3>
          {data.byPage.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No page data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.byPage.map(({ page, views }) => {
                const pct = Math.round((views / maxPageViews) * 100);
                return (
                  <div key={page}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{views.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(to right, #8b5cf6, #a78bfa)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent raw events */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Recent Visits</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Page', 'Country', 'City', 'Referrer', 'Time'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent.map((ev, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-light)' }} className="table-row-hover">
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.page}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {flag(ev.country)} {ev.country}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ev.city || '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.referrer ? (() => { try { return new URL(ev.referrer).hostname; } catch { return ev.referrer.slice(0, 30); } })() : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {ev.visited_at ? formatDistanceToNow(new Date(ev.visited_at), { addSuffix: true }) : '—'}
                  </td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No visits recorded yet. Data appears within minutes of the first page load.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ── TASKER KYC ───────────────────────────────────────────────────────
/* ── Per-tasker platform fee (standard 20%; admin may lower it, down to 0%) ── */
const STANDARD_FEE_PCT = 20;
const feePctOf = (t) => (t?.platform_fee_rate === null || t?.platform_fee_rate === undefined || t?.platform_fee_rate === '')
  ? null : Math.round(Number(t.platform_fee_rate) * 10000) / 100;

function TaskerFeeCard({ tasker, onSaved }) {
  const current = feePctOf(tasker);             // null = standard
  const effective = current ?? STANDARD_FEE_PCT;
  const [pct, setPct] = useState(String(effective));
  const [note, setNote] = useState(tasker.platform_fee_note || '');
  const [saving, setSaving] = useState(false);

  const save = async (value) => {
    if (saving) return;
    let body;
    if (value === null) body = { fee_percent: null, note: '' };
    else {
      const n = Number(value);
      if (value === '' || !Number.isFinite(n) || n < 0 || n > STANDARD_FEE_PCT) { toast.error(`Enter a fee from 0 to ${STANDARD_FEE_PCT}%.`); return; }
      body = { fee_percent: n, note };
    }
    setSaving(true);
    try {
      const { data } = await adminApi.setTaskerFee(tasker.user_id, body);
      toast.success(data?.message || 'Fee updated');
      const p = data.profile || {};
      onSaved?.({ user_id: tasker.user_id, platform_fee_rate: p.platform_fee_rate ?? null, platform_fee_note: p.platform_fee_note ?? null, platform_fee_updated_at: p.platform_fee_updated_at ?? null });
      if (value === null) { setPct(String(STANDARD_FEE_PCT)); setNote(''); }
    } catch (err) { toast.error(err.response?.data?.message || 'Could not update the fee'); }
    finally { setSaving(false); }
  };

  const preview = Number(pct);
  const valid = pct !== '' && Number.isFinite(preview) && preview >= 0 && preview <= STANDARD_FEE_PCT;
  return (
    <div data-testid="tasker-fee-card" style={{ background: current !== null ? '#ecfdf5' : 'var(--surface)', border: `1px solid ${current !== null ? '#a7f3d0' : 'var(--border-light)'}`, borderRadius: 12, padding: '14px 16px' }}>
      <div className="flex items-center justify-between gap-2 flex-wrap" style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform fee on this tasker's earnings</p>
        <span style={{ fontSize: 12, fontWeight: 800, borderRadius: 999, padding: '3px 10px', background: current !== null ? '#10b981' : '#e2e8f0', color: current !== null ? 'white' : '#475569' }}>
          {current === null ? `Standard ${STANDARD_FEE_PCT}%` : current === 0 ? 'No fee — keeps 100%' : `Custom ${current}% — keeps ${Math.round((100 - current) * 100) / 100}%`}
        </span>
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Fee %</label>
          <input type="number" min={0} max={STANDARD_FEE_PCT} step={0.5} value={pct} onChange={e => setPct(e.target.value)}
            aria-label="Platform fee percent" className="input" style={{ width: 110, display: 'block' }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Reason (admins only)</label>
          <input type="text" maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Launch partner — fee waived"
            aria-label="Fee note" className="input" style={{ display: 'block' }} />
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0' }}>
        {valid ? <>On a ₦10,000 balance the tasker receives <strong>₦{Math.round(10000 * (100 - preview) / 100).toLocaleString()}</strong> (Taskeeu keeps ₦{Math.round(10000 * preview / 100).toLocaleString()}).</> : `Enter 0 to ${STANDARD_FEE_PCT}.`}
        {' '}Applies to the tasker's next withdrawal, including balances already waiting.
      </p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => save(pct)} disabled={saving || !valid} className="btn-green btn-sm" style={{ padding: '8px 14px' }}>{saving ? 'Saving…' : 'Save fee'}</button>
        <button onClick={() => { setPct('0'); save('0'); }} disabled={saving || current === 0} className="btn-sm" style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid #a7f3d0', background: 'white', color: '#047857', fontWeight: 700, cursor: 'pointer' }}>Remove fee (100% to tasker)</button>
        {current !== null && (
          <button onClick={() => save(null)} disabled={saving} className="btn-sm" style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'white', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer' }}>Reset to standard {STANDARD_FEE_PCT}%</button>
        )}
      </div>
      {tasker.platform_fee_updated_at && (
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Last changed {format(new Date(tasker.platform_fee_updated_at), 'MMM d, yyyy · h:mm a')}</p>
      )}
    </div>
  );
}

/* ── Tasker bank details (admin only) with copy buttons ── */
function BankDetails({ bank, compact = false }) {
  const rows = [
    ['Bank name', bank?.bank_name],
    ['Account number', bank?.bank_account_number],
    ['Account name', bank?.bank_account_name],
  ];
  const has = rows.some(([, v]) => v);
  const copy = async (label, v) => {
    try { await navigator.clipboard.writeText(String(v)); toast.success(`${label} copied`); }
    catch { toast.error('Could not copy. Select and copy it manually.'); }
  };
  return (
    <div data-testid="bank-details" style={{ background: compact ? 'transparent' : 'var(--surface)', borderRadius: 10, padding: compact ? 0 : '12px 14px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Bank details</p>
      {!has ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>This tasker has not added bank details yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {rows.map(([label, v]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', width: 110 }}>{label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, fontFamily: label === 'Account number' ? 'monospace' : undefined, letterSpacing: label === 'Account number' ? '0.05em' : undefined }}>{v || 'Not set'}</span>
              {v && (
                <button type="button" onClick={() => copy(label, v)} aria-label={`Copy ${label.toLowerCase()}`}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--rose)', background: 'white', border: '1px solid #ffd1dc', borderRadius: 8, padding: '2px 8px', cursor: 'pointer' }}>
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskerKYC({ preSelected, onClearPreSelected }) {
  const [taskers, setTaskers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(preSelected || null);
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // If a preSelected tasker arrives (from Overview Review button), open it immediately
  useEffect(() => {
    if (preSelected) {
      setSelected(preSelected);
      onClearPreSelected?.();
    }
  }, [preSelected]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const { data } = await adminApi.getTaskers(params);
      setTaskers(data.taskers || []);
    } catch (err) {
      toast.error('Could not load taskers');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const approve = async (userId) => {
    setActing(true);
    try { await adminApi.approveTasker(userId, {}); toast.success('Tasker approved'); load(); setSelected(null); }
    catch { toast.error('Could not approve'); } finally { setActing(false); }
  };
  const reject = async (userId) => {
    setActing(true);
    try { await adminApi.rejectTasker(userId, { reason: rejectReason }); toast.success('Tasker rejected'); load(); setSelected(null); setRejectReason(''); }
    catch { toast.error('Could not reject'); } finally { setActing(false); }
  };

  const FILTERS = ['pending','approved','rejected','all'];

  if (selected) return (
    <div style={{ maxWidth: 760 }}>
      <button onClick={() => setSelected(null)} className="flex items-center gap-2 mb-6" style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
        <ChevronLeft size={16} /> Back to list
      </button>
      <div className="card p-6 space-y-5">

        {/* ── Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-2xl flex-shrink-0" style={{ background: 'var(--rose)' }}>
            {selected.user?.avatar_url ? <img src={selected.user.avatar_url} className="w-full h-full object-cover" alt="" /> : selected.user?.full_name?.[0]}
          </div>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>{selected.user?.full_name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{selected.user?.email} · {selected.user?.phone}</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <VerifTag status={selected.verification_status} />
              {selected.user?.username && <span style={{ fontSize: 12, background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>@{selected.user.username}</span>}
              {selected.country && <span style={{ fontSize: 12, background: '#f1f5f9', color: '#475569', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{selected.country}</span>}
            </div>
          </div>
        </div>

        {/* ── Account & Location Info */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Account & Location</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Full Name', value: selected.user?.full_name },
              { label: 'Username', value: selected.user?.username ? `@${selected.user.username}` : '—' },
              { label: 'Email', value: selected.user?.email },
              { label: 'Phone', value: selected.user?.phone },
              { label: 'Country', value: selected.country || 'NG' },
              { label: 'Task City', value: selected.task_city },
              { label: 'Task State', value: selected.task_state },
              { label: 'Home Address', value: selected.home_address },
              { label: 'Applied', value: selected.created_at ? format(new Date(selected.created_at), 'MMM d, yyyy · h:mm a') : '—' },
              { label: 'Last Active', value: selected.user?.last_seen ? formatDistanceToNow(new Date(selected.user.last_seen), { addSuffix: true }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</p>
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, wordBreak: 'break-word' }}>{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── LinkedIn / Social */}
        {selected.linkedin_url && (
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>LinkedIn / Social Profile</p>
            <a href={selected.linkedin_url} target="_blank" rel="noreferrer" style={{ color: 'var(--rose)', fontWeight: 700, fontSize: 13, wordBreak: 'break-all' }}>{selected.linkedin_url}</a>
          </div>
        )}

        {/* ── Skills */}
        {selected.skills?.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Physical Task Skills</p>
            <div className="flex flex-wrap gap-2">
              {selected.skills.map(s => (
                <span key={s} style={{ background: 'var(--rose-light)', color: 'var(--rose)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Pitch / Bio */}
        {selected.bio && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Their Pitch to Requesters (Bio)</p>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{selected.bio}</p>
          </div>
        )}

        {/* ── Motivation */}
        {selected.motivation && (
          <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Why They Want to Be a Tasker</p>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{selected.motivation}</p>
          </div>
        )}

        {/* ── Platform Feedback */}
        {selected.platform_feedback && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Their Thoughts on Taskeeu</p>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{selected.platform_feedback}</p>
          </div>
        )}

        {/* ── Bank Details (admin only, e.g. to send money manually) */}
        <BankDetails bank={selected} />

        {/* ── KYC Documents */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>KYC Documents</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'National ID / NIN Slip', url: selected.national_id_url },
              { label: "Driver's License", url: selected.driver_license_url },
              { label: 'Passport', url: selected.passport_url },
              { label: 'Proof of Address', url: selected.proof_of_address_url },
              { label: 'Resume / CV', url: selected.resume_url },
            ].map(({ label, url }) => url ? (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all" style={{ background: 'var(--rose-light)', color: 'var(--rose)', textDecoration: 'none' }}>
                <Eye size={14} /> {label}
              </a>
            ) : (
              <div key={label} className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: '#f8fafc', color: '#94a3b8', border: '1px dashed #e2e8f0' }}>
                <Eye size={14} /> {label} — not uploaded
              </div>
            ))}
          </div>
        </div>

        {/* ── Platform fee (per tasker) */}
        <TaskerFeeCard key={selected.user_id} tasker={selected}
          onSaved={(p) => { setSelected(prev => prev && prev.user_id === p.user_id ? { ...prev, ...p } : prev); setTaskers(prev => prev.map(t => t.user_id === p.user_id ? { ...t, ...p } : t)); }} />

        {/* ── Admin Notes */}
        {selected.admin_notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Admin Notes</p>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{selected.admin_notes}</p>
          </div>
        )}

        {selected.verification_status === 'pending' && (
          <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
            <div className="flex gap-3">
              <button onClick={() => approve(selected.user_id)} disabled={acting} className="btn-green flex-1 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> {acting ? 'Processing...' : 'Approve Tasker'}
              </button>
              <button
                onClick={() => reject(selected.user_id)} disabled={acting}
                className="flex-1 flex items-center justify-center gap-2 font-bold rounded-2xl transition-all" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', padding: '14px 24px', fontSize: 15 }}
              >
                <XCircle size={16} /> Reject
              </button>
            </div>
            <textarea
              placeholder="Reason for rejection (required for reject)" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={2} className="input resize-none"/>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize" style={filter === f
              ? { background: 'var(--rose)', color: 'white' }
              : { background: 'white', color: 'var(--muted)', border: '1px solid var(--border-light)' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : taskers.length === 0 ? (
        <div className="card empty-state"><UserCheck size={40} className="mb-3" style={{ color: 'var(--muted-light)' }} /><p style={{ fontWeight: 700, color: 'var(--muted)' }}>No {filter} taskers</p></div>
      ) : (
        <div className="card overflow-hidden">
          {taskers.map((t, i) => (
            <div key={t.user_id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover cursor-pointer" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}
              onClick={() => setSelected(t)}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: 'var(--rose)' }}>
                {t.user?.avatar_url ? <img src={t.user.avatar_url} className="w-full h-full object-cover" alt="" /> : t.user?.full_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">{t.user?.full_name} {t.user?.username && <span style={{ fontWeight: 400, color: 'var(--muted)' }}>@{t.user.username}</span>}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t.user?.email} · {t.task_city}{t.country && t.country !== 'NG' ? ` · ${t.country}` : ''}{t.skills?.length ? ` · ${t.skills.length} skill${t.skills.length > 1 ? 's' : ''}` : ''}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {feePctOf(t) !== null && (
                  <span title="Custom platform fee" style={{ fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '2px 8px', background: '#d1fae5', color: '#047857' }}>
                    Fee {feePctOf(t)}%
                  </span>
                )}
                <VerifTag status={t.verification_status} />
                <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ALL USERS ─────────────────────────────────────────────────────────
function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [acting, setActing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // user object to confirm deletion

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await adminApi.getUsers(params);
      setUsers(data.users || []);
    }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [roleFilter]);

  const toggleStatus = async (user) => {
    setActing(user.id + '_status');
    try {
      await adminApi.setUserStatus(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
      load();
    } catch { toast.error('Could not update status'); }
    finally { setActing(null); }
  };

  const verifyEmail = async (user) => {
    setActing(user.id + '_verify');
    try {
      const { data } = await adminApi.verifyUserEmail(user.id);
      toast.success(data.message || 'User verified');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not verify user'); }
    finally { setActing(null); }
  };

  const deleteUser = async (user) => {
    setActing(user.id + '_delete');
    try {
      const { data } = await adminApi.deleteUser(user.id);
      toast.success(data.message || 'User deleted');
      setConfirmDelete(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not delete user'); }
    finally { setActing(null); }
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return !search ||
      u.full_name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.username?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s);
  });

  return (
    <div>
      {/* Confirm delete modal */}
      {confirmDelete && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(22px, 4vw, 32px)', maxWidth: 420, width: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 8 }}>Permanently Delete User?</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 6 }}>
              You are about to permanently delete:
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{confirmDelete.full_name}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{confirmDelete.email} · {confirmDelete.role}</p>
            </div>
            <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 20 }}>This permanently removes this user, their profile, tasks, bids, and messages from the database. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost btn-sm flex-1">Cancel</button>
              <button onClick={() => deleteUser(confirmDelete)} disabled={acting === confirmDelete.id + '_delete'}
                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {acting === confirmDelete.id + '_delete' ? 'Deleting...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input type="text" placeholder="Search name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 40 }} />
        </div>
        <button onClick={load} className="btn-ghost btn-sm border">
          Search
        </button>
        {['all','requester','tasker','admin'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize" style={roleFilter === r
              ? { background: 'var(--rose)', color: 'white' }
              : { background: 'white', color: 'var(--muted)', border: '1px solid var(--border-light)' }}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)' }}>
                  {['User','Email','Phone','Location','Role','Joined','Status','Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden text-sm" style={{ background: 'var(--rose)' }}>
                          {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : u.full_name?.[0]}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {u.full_name}
                          {u.username && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> @{u.username}</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {u.task_city || u.task_state
                        ? [u.task_city, u.task_state].filter(Boolean).join(', ')
                        : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}><UserRoleTag role={u.role} /></td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{(u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag
                          bg={u.is_active ? '#dcfce7' : '#fee2e2'}
                          color={u.is_active ? '#166534' : '#991b1b'}
                          label={u.is_active ? 'Active' : 'Inactive'}
                        />
                        {u.role === 'requester' && !u.email_verified && (
                          <Tag bg="#fef3c7" color="#92400e" label="Unverified" />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.role !== 'admin' && (
                        <div className="flex items-center gap-2">
                          {u.role === 'requester' && !u.email_verified && (
                            <button
                              onClick={() => verifyEmail(u)}
                              disabled={acting === u.id + '_verify'}
                              title="Manually mark this requester's email as verified so they can log in" style={{
                                background: '#dbeafe', color: '#1d4ed8',
                                border: 'none', cursor: 'pointer', padding: '5px 10px',
                                borderRadius: 8, fontSize: 12, fontWeight: 700,
                              }}
                            >
                              {acting === u.id + '_verify' ? '...' : 'Verify Email'}
                            </button>
                          )}
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={acting === u.id + '_status'}
                            style={{
                              background: u.is_active ? '#fee2e2' : '#dcfce7',
                              color: u.is_active ? '#991b1b' : '#166534',
                              border: 'none', cursor: 'pointer', padding: '5px 10px',
                              borderRadius: 8, fontSize: 12, fontWeight: 700,
                            }}
                          >
                            {acting === u.id + '_status' ? '...' : u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={!!acting}
                            title="Permanently delete user from database" style={{
                              background: '#fff1f2', color: '#ef4444', border: '1px solid #fecdd3',
                              cursor: 'pointer', padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state py-12">
                <Users size={36} style={{ color: 'var(--muted-light)', marginBottom: 12 }} />
                <p style={{ fontWeight: 700, color: 'var(--muted)' }}>No users found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMPANIES ─────────────────────────────────────────────────────────
function CompaniesPanel() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('taskeeu_token');
        const res = await fetch('/api/teams/admin/companies', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        setCompanies(json.companies || json.data || []);
      } catch { setCompanies([]); } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : companies.length === 0 ? (
        <div className="card empty-state">
          <Building2 size={40} style={{ color: 'var(--muted-light)', marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: 'var(--muted)' }}>No companies yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {companies.map((c, i) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0" style={{ background: 'var(--rose)' }}>
                {c.company_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">{c.company_name}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{c.industry} · {c.company_size} employees</p>
              </div>
              <Tag
                bg={c.subscription_status === 'active' ? '#dcfce7' : '#fee2e2'}
                color={c.subscription_status === 'active' ? '#166534' : '#991b1b'}
                label={c.subscription_status === 'active' ? 'Active' : 'Inactive'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ALL TASKS ─────────────────────────────────────────────────────────
function TaskDetailModal({ taskId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview | chat | activity

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi.getTaskDetail(taskId)
      .then(({ data }) => { if (active) setDetail(data); })
      .catch(() => { if (active) toast.error('Could not load task detail'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);

  const [actFilter, setActFilter] = useState('all');
  const ACTIVITY_ICON = {
    task: ClipboardList, bid: DollarSign, message: MessageSquare,
    payment: DollarSign, custom_payment: DollarSign, completion: CheckCircle, refund: RotateCcw,
    advance: Wallet, proof: Camera, review: Star, cancel: Ban,
  };
  // Colour per event type (icon tile) and per actor (who did it).
  const TYPE_COLOR = {
    task: ['#eef2ff', '#4338ca'], bid: ['#f5f3ff', '#6d28d9'], message: ['#f1f5f9', '#475569'],
    payment: ['#ecfdf5', '#047857'], custom_payment: ['#ecfdf5', '#047857'], completion: ['#dcfce7', '#15803d'],
    refund: ['#fff7ed', '#c2410c'], advance: ['#eff6ff', '#1d4ed8'], proof: ['#faf5ff', '#7e22ce'],
    review: ['#fffbeb', '#b45309'], cancel: ['#fff1f2', '#be123c'],
  };
  const ACTOR_CHIP = {
    requester: ['Requester', '#e0f2fe', '#0369a1'], tasker: ['Tasker', '#fae8ff', '#a21caf'],
    admin: ['Admin', '#fee2e2', '#b91c1c'], system: ['System', '#f1f5f9', '#475569'],
  };
  const ACT_FILTERS = [
    ['all', 'Everything', () => true],
    ['money', 'Money & advances', (a) => ['payment', 'custom_payment', 'advance', 'refund'].includes(a.type)],
    ['work', 'Proofs & completion', (a) => ['proof', 'completion'].includes(a.type)],
    ['review', 'Ratings & reviews', (a) => a.type === 'review'],
    ['people', 'Bids, choices & cancels', (a) => ['bid', 'cancel', 'task'].includes(a.type)],
    ['message', 'Chat', (a) => a.type === 'message'],
  ];

  const BID_STATUS = {
    pending:  { label: 'Pending',  bg: '#fef3c7', color: '#92400e', Icon: Clock },
    accepted: { label: 'Accepted', bg: '#dcfce7', color: '#166534', Icon: CheckCircle },
    rejected: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b', Icon: XCircle },
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto', overscrollBehavior: 'contain' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 4vw, 32px)', maxWidth: 720, width: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: 19, color: 'var(--text)', marginBottom: 4 }}>
              {loading ? 'Loading…' : detail?.task?.title}
            </h3>
            {!loading && detail?.task && <TaskTag status={detail.task.status} />}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}><X size={20} /></button>
        </div>

        {!loading && detail?.task && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
            {[
              ['overview', 'Overview'],
              ['chat', `Chat${detail.messages?.length ? ` (${detail.messages.length})` : ''}`],
              ['activity', `Activity Log${detail.activity?.length ? ` (${detail.activity.length})` : ''}`],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)}
                style={{
                  padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, color: tab === val ? 'var(--rose)' : 'var(--muted)',
                  borderBottom: tab === val ? '2px solid var(--rose)' : '2px solid transparent', marginBottom: -1,
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
        ) : !detail?.task ? (
          <p style={{ color: 'var(--muted)' }}>Task not found.</p>
        ) : tab === 'chat' ? (
          <div>
            {(detail.chat_rooms?.length || 0) > 1 && (
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
                {detail.chat_rooms.length} separate chats on this task (the requester can talk to several bidders). Each message shows which chat it belongs to.
              </p>
            )}
            {!detail.chat_room && !(detail.chat_rooms?.length) ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>No chat has started for this task yet.</p>
            ) : detail.messages.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>Chat room exists but no messages have been sent.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {detail.messages.map(m => (
                  <div key={m.id} style={{ border: m.is_bot ? '1px solid #f5d0fe' : '1px solid var(--border-light)', borderRadius: 12, padding: '10px 14px', background: m.is_bot ? 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' : m.sender?.role === 'tasker' ? '#fdf9ff' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                        {m.is_bot ? `👩🏾 ${m.bot_name || 'Keeu'}` : (m.sender?.full_name || 'Unknown')}
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginLeft: 6, textTransform: 'capitalize' }}>{m.is_bot ? 'chat assistant' : m.sender?.role}</span>
                        {(detail.chat_rooms?.length || 0) > 1 && m.room_tasker_name && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', borderRadius: 6, padding: '1px 6px', marginLeft: 6 }}>chat with {m.room_tasker_name}</span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{m.created_at ? format(new Date(m.created_at), 'MMM d, HH:mm') : ''}</span>
                    </div>
                    {m.is_deleted ? (
                      <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>(message deleted by user — still visible to admin)</p>
                    ) : (
                      <>
                        {m.content && <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</p>}
                        {m.media_url && (
                          <a href={m.media_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 700 }}>
                            View {m.media_type || 'attachment'} →
                          </a>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'activity' ? (
          <div>
            {detail.activity.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, padding: '20px 0' }}>No activity recorded yet.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {ACT_FILTERS.map(([val, label, fn]) => {
                    const n = detail.activity.filter(fn).length;
                    if (val !== 'all' && n === 0) return null;
                    return (
                      <button key={val} onClick={() => setActFilter(val)}
                        style={{ padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: actFilter === val ? '1px solid var(--rose)' : '1px solid var(--border-light)',
                          background: actFilter === val ? 'var(--rose)' : 'white', color: actFilter === val ? 'white' : 'var(--text)' }}>
                        {label} <span style={{ opacity: 0.7 }}>{n}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ position: 'relative', paddingLeft: 8 }}>
                  {detail.activity.filter((ACT_FILTERS.find(f => f[0] === actFilter) || ACT_FILTERS[0])[2]).map((a, i) => {
                    const Icon = ACTIVITY_ICON[a.type] || Clock;
                    const [tileBg, tileColor] = TYPE_COLOR[a.type] || ['var(--surface)', 'var(--rose)'];
                    const chip = ACTOR_CHIP[a.actor];
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: tileBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} style={{ color: tileColor }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {chip && <span style={{ fontSize: 10.5, fontWeight: 800, background: chip[1], color: chip[2], borderRadius: 6, padding: '1px 7px' }}>{chip[0]}</span>}
                            <span>{a.label}</span>
                          </p>
                          {a.rating ? (
                            <span style={{ display: 'inline-flex', gap: 1, marginTop: 3 }} aria-label={`${a.rating} out of 5 stars`}>
                              {[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} style={{ color: n <= a.rating ? '#f59e0b' : '#d1d5db', fill: n <= a.rating ? '#f59e0b' : 'none' }} />)}
                            </span>
                          ) : null}
                          {a.detail && !a.links?.length && <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '2px 0 0', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{a.detail}</p>}
                          {a.links?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              {a.links.map((l, j) => (
                                <a key={j} href={l.url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 12, fontWeight: 700, color: '#7e22ce', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '2px 8px', textDecoration: 'none', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  📎 {l.name}
                                </a>
                              ))}
                            </div>
                          )}
                          <p style={{ fontSize: 11, color: 'var(--muted-light)', margin: '3px 0 0' }}>{a.ts ? format(new Date(a.ts), 'MMM d, yyyy · HH:mm:ss') : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, background: 'var(--surface)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Task price</p>
                <p style={{ fontWeight: 800, color: '#00C37E', fontSize: 15 }}>
                  {taskPrice(detail.task) ? formatMoney(taskPrice(detail.task), detail.task.currency) : 'Not set'}
                </p>
                {costLines(detail.task).map(([label, v]) => (
                  <p key={label} style={{ fontSize: 12, color: 'var(--muted)' }}>{label}: {formatMoney(v, detail.task?.currency)}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Location</p>
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} /> {detail.task.task_city}, {detail.task.task_state}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Requester</p>
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{detail.task.requester?.full_name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{detail.task.requester?.email}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Accepted Tasker</p>
                {detail.task.accepted_tasker ? (
                  <>
                    <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{detail.task.accepted_tasker.full_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{detail.task.accepted_tasker.email}</p>
                    <div style={{ marginTop: 8 }}><BankDetails bank={detail.task.accepted_tasker.bank} compact /></div>
                  </>
                ) : <p style={{ fontSize: 13, color: 'var(--muted)' }}>None yet</p>}
              </div>
            </div>

            {/* All bids */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                All Bids ({detail.bids.length})
              </p>
              {detail.bids.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>No bids placed on this task yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.bids.map(bid => {
                    const bs = BID_STATUS[bid.status] || BID_STATUS.pending;
                    return (
                      <div key={bid.id} style={{ border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{bid.tasker?.full_name}</p>
                            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{bid.tasker?.email}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 800, color: '#00C37E', fontSize: 15 }}>{formatMoney(bid.workmanship_price, detail.task?.currency)}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: bs.bg, color: bs.color }}>
                              <bs.Icon size={11} /> {bs.label}
                            </span>
                          </div>
                        </div>
                        {bid.message && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>{bid.message}</p>}
                        <p style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 6 }}>{bid.created_at ? format(new Date(bid.created_at), 'MMM d, yyyy HH:mm') : ''}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment / escrow progress */}
            {(detail.payments.length > 0 || detail.custom_payment) && (
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Payment & Escrow Progress
                </p>
                {detail.payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>{p.payment_type}</span>
                    <span style={{ color: 'var(--muted)' }}>{formatMoney(p.amount, p.currency || detail.task?.currency)}</span>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize', color: p.status === 'completed' ? '#166534' : p.status === 'failed' ? '#991b1b' : '#92400e' }}>{p.status}</span>
                  </div>
                ))}
                {detail.custom_payment && (
                  <div style={{ marginTop: 10, background: 'var(--surface)', borderRadius: 12, padding: 14, fontSize: 13 }}>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>Equipment/Shipment Flow — status: <span style={{ textTransform: 'capitalize' }}>{detail.custom_payment.status}</span></p>
                    <p style={{ color: 'var(--muted)' }}>
                      Equipment: ₦{Number(detail.custom_payment.equipment_cost || 0).toLocaleString()} ({detail.custom_payment.equipment_paid ? 'paid' : 'unpaid'}) ·{' '}
                      Shipment: ₦{Number(detail.custom_payment.shipment_cost || 0).toLocaleString()} ·{' '}
                      Workmanship: ₦{Number(detail.custom_payment.workmanship_cost || 0).toLocaleString()} ({detail.custom_payment.workmanship_paid ? 'paid' : 'unpaid'})
                    </p>
                    {(detail.custom_payment.equipment_proof_urls?.length > 0 || detail.custom_payment.shipment_proof_urls?.length > 0) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {[...(detail.custom_payment.equipment_proof_urls || []), ...(detail.custom_payment.shipment_proof_urls || [])].map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 700 }}>Proof {i + 1} →</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Refunds / disputes */}
            {detail.refunds?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Refunds & Disputes ({detail.refunds.length})
                </p>
                {detail.refunds.map(r => (
                  <div key={r.id} style={{ border: '1px solid #fecdd3', background: '#fff1f2', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#991b1b' }}>{formatMoney(r.amount, detail.task?.currency)}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: 'white', color: '#991b1b', textTransform: 'capitalize' }}>{r.status}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 6, lineHeight: 1.6 }}>{r.reason}</p>
                    {r.tasker_response && <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Tasker: {r.tasker_response}</p>}
                    {r.admin_notes && <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Admin notes: {r.admin_notes}</p>}
                    <p style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 6 }}>{r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy HH:mm') : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function TasksTable() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [visFilter, setVisFilter] = useState('all'); // all | visible | hidden

  // Hide or show a task on the public browse page.
  // Does not touch status, bids, or chat — purely browse visibility.
  const toggleVisibility = async (task) => {
    const hiding = !task.is_hidden;
    let reason = null;
    if (hiding) {
      reason = window.prompt(
        `Hide "${task.title}" from the public browse page?\n\nOptional reason (for the audit log):`,
        ''
      );
      if (reason === null) return; // cancelled
    }
    setTogglingId(task.id);
    try {
      const { data } = await adminApi.setTaskVisibility(task.id, hiding, reason);
      setTasks(prev => prev.map(t => t.id === task.id
        ? { ...t, is_hidden: data.task.is_hidden, hidden_at: data.task.hidden_at, hidden_reason: data.task.hidden_reason }
        : t));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update visibility');
    } finally { setTogglingId(null); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const { data } = await adminApi.getTasks({ limit: 200 }); setTasks(data.tasks || []); }
      catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = tasks.filter(t => {
    const matchesSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.task_city?.toLowerCase().includes(search.toLowerCase());
    const matchesVis =
      visFilter === 'all' ? true :
      visFilter === 'hidden' ? !!t.is_hidden : !t.is_hidden;
    return matchesSearch && matchesVis;
  });
  const hiddenCount = tasks.filter(t => t.is_hidden).length;

  return (
    <div>
      {selectedId && <TaskDetailModal taskId={selectedId} onClose={() => setSelectedId(null)} />}
      <div className="mb-5" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 40 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['visible', 'On browse'], ['hidden', `Hidden${hiddenCount ? ` (${hiddenCount})` : ''}`]].map(([val, label]) => (
            <button key={val} onClick={() => setVisFilter(val)}
              style={{
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: visFilter === val ? 'var(--rose)' : 'var(--surface)',
                color: visFilter === val ? 'white' : 'var(--text)',
                border: visFilter === val ? 'none' : '1px solid var(--border-light)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)' }}>
                  {['Task','Requester','City','Budget','Bids','Status','Date','Browse'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((t, i) => (
                  <tr key={t.id} className="table-row-hover" onClick={() => setSelectedId(t.id)}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      background: t.is_hidden ? '#fff7ed' : (i % 2 === 0 ? 'transparent' : '#fdf9ff'),
                      cursor: 'pointer',
                      opacity: t.is_hidden ? 0.72 : 1,
                    }}>
                    <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text)' }} className="truncate">{t.title}</p>
                      {t.is_hidden && (
                        <p style={{ fontSize: 11, color: '#c2410c', fontWeight: 700, marginTop: 2 }}>
                          Hidden from browse{t.hidden_reason ? ` — ${t.hidden_reason}` : ''}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.requester?.full_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.is_remote ? 'Remote' : t.task_city}{t.country && t.country !== 'NG' ? ` (${t.country === 'GB' ? 'UK' : t.country})` : ''}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#00C37E', whiteSpace: 'nowrap' }}>
                      {taskPrice(t) ? formatMoney(taskPrice(t), t.currency) : 'Not set'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.bids?.[0]?.count ?? 0}</td>
                    <td style={{ padding: '12px 16px' }}><TaskTag status={t.status} /></td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{(t.created_at ? format(new Date(t.created_at), 'MMM d') : '—')}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => toggleVisibility(t)}
                        disabled={togglingId === t.id}
                        title={t.is_hidden
                          ? 'Currently hidden — click to show on the public browse page'
                          : 'Currently visible — click to hide from the public browse page'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          cursor: togglingId === t.id ? 'wait' : 'pointer',
                          background: t.is_hidden ? '#fff7ed' : '#f0fdf4',
                          color: t.is_hidden ? '#c2410c' : '#15803d',
                          border: `1px solid ${t.is_hidden ? '#fed7aa' : '#bbf7d0'}`,
                          opacity: togglingId === t.id ? 0.6 : 1,
                        }}>
                        {t.is_hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        {togglingId === t.id ? '…' : (t.is_hidden ? 'Show' : 'Hide')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state py-12">
                <ClipboardList size={36} style={{ color: 'var(--muted-light)', marginBottom: 12 }} />
                <p style={{ fontWeight: 700, color: 'var(--muted)' }}>No tasks found</p>
              </div>
            )}
            {filtered.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--muted)' }}>
                Showing {Math.min(filtered.length, 200)} of {filtered.length} matching
                {filtered.length > 200 ? ' — narrow the search to see the rest' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── REVENUE ───────────────────────────────────────────────────────────
function EarningsSection() {
  const [fin, setFin] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    adminApi.getFinance().then(({ data }) => { if (alive) setFin(data); }).catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, []);
  const n = (v) => `₦${Number(v || 0).toLocaleString()}`;
  if (err) return <div className="card p-5 text-sm" style={{ color: 'var(--muted)' }}>Could not load Taskeeu earnings.</div>;
  if (!fin) return <div className="card p-6 flex justify-center"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>;
  if (fin.ready === false) return <div className="card p-5 text-sm" style={{ color: '#92400e', background: '#fffbeb' }}>{fin.message}</div>;
  const t = fin.totals;
  return (
    <div className="space-y-4" data-testid="earnings-section">
      <div className="card overflow-hidden" style={{ border: '1px solid #ddd6fe' }}>
        <div style={{ background: 'linear-gradient(120deg,#6d28d9,#db2777)', color: 'white', padding: '16px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .85 }}>Taskeeu earnings — platform fees kept</p>
          <p style={{ fontSize: 30, fontWeight: 900 }} data-testid="earned-all-time">{n(t.earned_all_time)}</p>
          <p style={{ fontSize: 12.5, opacity: .9 }}>from {t.payouts_count} task payout{t.payouts_count === 1 ? '' : 's'} · {n(t.task_value_paid_out)} task value · {n(t.paid_to_taskers)} paid to taskers</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4">
          {[
            ['Today', t.earned_today, '#047857', '#ecfdf5'],
            ['This month', t.earned_this_month, '#1d4ed8', '#eff6ff'],
            [`Due — ${t.due_count} completed task${t.due_count === 1 ? '' : 's'} not yet withdrawn`, t.due_on_withdrawal, '#b45309', '#fffbeb'],
            [`Upcoming — ${t.upcoming_count} funded task${t.upcoming_count === 1 ? '' : 's'} in progress`, t.upcoming_from_ongoing, '#6d28d9', '#f5f3ff'],
            ['Awaiting bank confirmation', t.pending_confirmation, '#be123c', '#fff1f2'],
          ].map(([label, v, color, bg]) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '10px 12px' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color }}>{n(v)}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', padding: '0 16px 14px' }}>
          The fee is 20% of the full amount the requester paid for a task (or the lower rate an admin set for that tasker). It is taken once, when the tasker withdraws the final balance.
        </p>
      </div>

      {fin.by_currency?.length > 0 && (
        <div className="card overflow-hidden" data-testid="intl-earnings">
          <p className="p-4 border-b" style={{ fontWeight: 900, fontSize: 15, borderColor: 'var(--border-light)' }}>International earnings (kept separate from Naira)</p>
          {fin.by_currency.map(c => (
            <div key={c.currency} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <p style={{ fontWeight: 800, width: 60 }}>{c.currency}</p>
              <p style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{c.count} payout{c.count === 1 ? '' : 's'} · task value {formatMoney(c.gross, c.currency)}{c.pending_fees ? ` · ${formatMoney(c.pending_fees, c.currency)} awaiting payout` : ''}</p>
              <p style={{ fontWeight: 900, color: '#7c3aed' }}>{formatMoney(c.earned_fees, c.currency)}</p>
            </div>
          ))}
        </div>
      )}

      {fin.months?.length > 0 && (
        <div className="card overflow-hidden">
          <p className="p-4 border-b" style={{ fontWeight: 900, fontSize: 15, borderColor: 'var(--border-light)' }}>By month</p>
          {fin.months.map(m => (
            <div key={m.month} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
              <p style={{ fontWeight: 700, width: 90 }}>{format(new Date(m.month + '-01T12:00:00'), 'MMM yyyy')}</p>
              <p style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{m.count} payout{m.count === 1 ? '' : 's'} · task value {n(m.gross)} · to taskers {n(m.payouts)}</p>
              <p style={{ fontWeight: 900, color: '#7c3aed' }}>{n(m.fees)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <p className="p-4 border-b" style={{ fontWeight: 900, fontSize: 15, borderColor: 'var(--border-light)' }}>Fee records</p>
        {fin.recent?.length ? fin.recent.map(r => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: 'var(--border-light)' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{r.task_title || 'Task'}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                {r.tasker_name || 'Tasker'} · paid {n(r.gross_amount)} · fee {Math.round(Number(r.fee_rate) * 10000) / 100}%
                {Number(r.advance_deducted) > 0 ? ` · advance ${n(r.advance_deducted)}` : ''} · tasker got {n(r.tasker_payout)}
                {r.created_at ? ` · ${format(new Date(r.created_at), 'MMM d, yyyy HH:mm')}` : ''}
              </p>
            </div>
            {r.status === 'pending' && <Tag bg="#fff1f2" color="#be123c" label="awaiting bank" />}
            {r.source === 'backfill' && <Tag bg="#f1f5f9" color="#475569" label="before ledger" />}
            <p style={{ fontWeight: 900, color: '#7c3aed', fontSize: 15 }}>{n(r.fee_amount)}</p>
          </div>
        )) : <p className="p-6 text-sm" style={{ color: 'var(--muted)' }}>No fee records yet. They appear when taskers withdraw completed-task balances.</p>}
      </div>
    </div>
  );
}

function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const { data } = await adminApi.getPayments(); setPayments(data.payments || []); }
      catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  // Naira only: international payments are reported per currency in the earnings card.
  const ngn = (p) => (p.currency || 'NGN') === 'NGN';
  const total = payments.filter(p => p.status === 'completed' && ngn(p)).reduce((s, p) => s + Number(p.amount), 0);
  const escrow = payments.filter(p => p.status === 'escrow' && ngn(p)).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      <EarningsSection />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Payments received (recent 100)', value: `₦${total.toLocaleString()}`, color: '#00C37E', bg: '#f0fdf4', Icon: DollarSign },
          { label: 'In Escrow', value: `₦${escrow.toLocaleString()}`, color: '#3b82f6', bg: '#eff6ff', Icon: Clock },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}><Icon size={20} style={{ color }} /></div>
            <p className="stat-value" style={{ color }}>{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : (
        <div className="card overflow-hidden">
          {payments.slice(0, 50).map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">
                  {p.task?.title || 'Payment'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{p.payment_type} · {(p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : '—')}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p style={{ fontWeight: 900, color: '#00C37E', fontSize: 15 }}>{formatMoney(p.amount, p.currency)}</p>
                <Tag
                  bg={p.status === 'completed' ? '#dcfce7' : p.status === 'escrow' ? '#dbeafe' : '#f1f5f9'}
                  color={p.status === 'completed' ? '#166534' : p.status === 'escrow' ? '#1e40af' : '#475569'}
                  label={p.status}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── REFUNDS ───────────────────────────────────────────────────────────
function RefundsPanel() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const { data } = await adminApi.getRefunds(); setRefunds(data.refunds || []); }
      catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return loading ? (
    <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
  ) : (
    <div className="card overflow-hidden">
      {refunds.length === 0 ? (
        <div className="empty-state"><RotateCcw size={36} style={{ color: 'var(--muted-light)', marginBottom: 12 }} /><p style={{ fontWeight: 700, color: 'var(--muted)' }}>No refund requests</p></div>
      ) : refunds.map((r, i) => (
        <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">{r.task?.title || 'Refund'}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>From: {r.requester?.full_name} · {(r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—')}</p>
            {r.reason && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }} className="truncate">{r.reason}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p style={{ fontWeight: 900, color: 'var(--rose)', fontSize: 15 }}>₦{Number(r.amount).toLocaleString()}</p>
            <Tag
              bg={r.status === 'processed' ? '#dcfce7' : r.status === 'processing' ? '#dbeafe' : '#fef9c3'}
              color={r.status === 'processed' ? '#166534' : r.status === 'processing' ? '#1e40af' : '#854d0e'}
              label={r.status}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ADMIN SUPPORT ──────────────────────────────────────────────────────
function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef(null);

  const STATUS_OPTIONS = ['open','in_progress','waiting_user','resolved','closed'];

  const [loadError, setLoadError] = useState('');

  useEffect(() => { loadTickets(); }, [statusFilter]);
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await supportApi.adminGetTickets({ status: statusFilter === 'all' ? undefined : statusFilter });
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Load tickets error:', err);
      setLoadError(err.response?.data?.message || 'Could not load tickets');
    } finally { setLoading(false); }
  };

  const openTicket = async (ticket) => {
    setSelected(ticket);
    setThreadLoading(true);
    try {
      const { data } = await supportApi.getTicket(ticket.id);
      setSelected(data.ticket);
      setMessages(data.messages || []);
    } catch { toast.error('Could not load ticket'); }
    finally { setThreadLoading(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      const { data } = await supportApi.adminReplyTicket(selected.id, { message: replyText });
      setMessages(prev => [...prev, data.message]);
      setReplyText('');
      setSelected(prev => ({ ...prev, status: 'in_progress' }));
      loadTickets();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not send reply'); }
    finally { setReplying(false); }
  };

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      await supportApi.adminUpdateStatus(selected.id, { status });
      setSelected(prev => ({ ...prev, status }));
      toast.success(`Status updated to ${status.replace('_',' ')}`);
      loadTickets();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not update status'); }
    finally { setUpdatingStatus(false); }
  };

  const STATUS_STYLES = {
    open:         { bg: '#fef9c3', color: '#854d0e',  label: 'Open' },
    in_progress:  { bg: '#dbeafe', color: '#1e40af',  label: 'In Progress' },
    waiting_user: { bg: '#f3e8ff', color: '#6b21a8',  label: 'Waiting User' },
    resolved:     { bg: '#dcfce7', color: '#166534',  label: 'Resolved' },
    closed:       { bg: '#f1f5f9', color: '#475569',  label: 'Closed' },
  };

  const PRIORITY_COLORS = { low: '#64748b', normal: '#3b82f6', high: '#f97316', urgent: '#ef4444' };

  if (selected) return (
    <div style={{ maxWidth: 720, height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <button onClick={() => { setSelected(null); setMessages([]); }} className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={15} /> All tickets
          </button>
          <h2 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>{selected.subject}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'monospace' }}>#{selected.ticket_number}</span>
            <SupportStatusTag status={selected.status} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: PRIORITY_COLORS[selected.priority] }}>{selected.priority}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>— {selected.user?.full_name} ({selected.user?.role})</span>
          </div>
        </div>
        {/* Status control */}
        <select
          value={selected.status}
          onChange={e => updateStatus(e.target.value)}
          disabled={updatingStatus}
          style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 12,
            padding: '8px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text)',
            fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer', flexShrink: 0,
          }}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>)}
        </select>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', background: '#fdf9ff',
        borderRadius: 16, border: '1px solid var(--border-light)', padding: 20, marginBottom: 16,
      }}>
        {threadLoading ? (
          <div className="flex items-center justify-center h-full"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => {
              const isMine = msg.is_admin;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 10 }}>
                  {!isMine && (
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: '#e2d9f3', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--muted)', fontWeight: 800, fontSize: 12,
                    }}>
                      {msg.sender?.full_name?.[0]}
                    </div>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    {!isMine && (
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>{msg.sender?.full_name}</p>
                    )}
                    <div style={{
                      background: isMine ? 'linear-gradient(135deg, var(--rose), var(--rose-dark))' : 'white',
                      color: isMine ? 'white' : 'var(--text)',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '12px 16px',
                      border: isMine ? 'none' : '1px solid var(--border-light)',
                    }}>
                      <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                      {(msg.created_at ? format(new Date(msg.created_at), 'MMM d · h:mm a') : '—')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply */}
      {selected.status !== 'closed' ? (
        <div style={{ flexShrink: 0, background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', padding: 16 }}>
          <div className="flex items-end gap-3">
            <textarea
              rows={2} value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Type your reply to the user..." onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
              style={{
                flex: 1, background: '#fdf9ff', border: '1px solid var(--border)', borderRadius: 12,
                padding: '10px 14px', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
                resize: 'none', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--rose)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={sendReply} disabled={replying || !replyText.trim()}
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: replyText.trim() ? 'var(--rose)' : '#f1f5f9',
                color: replyText.trim() ? 'white' : 'var(--muted)',
                border: 'none', cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {replying ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 6 }}>Enter to send · Shift+Enter for new line</p>
        </div>
      ) : (
        <div style={{ flexShrink: 0, textAlign: 'center', padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Ticket is closed</p>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['open','in_progress','waiting_user','resolved','closed','all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize" style={statusFilter === s
              ? { background: 'var(--rose)', color: 'white' }
              : { background: 'white', color: 'var(--muted)', border: '1px solid var(--border-light)' }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : loadError ? (
        <div className="card empty-state">
          <p style={{ fontWeight: 700, color: '#e53e3e' }}>{loadError}</p>
          <button onClick={loadTickets} className="btn-ghost mt-3 text-sm">Retry</button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card empty-state">
          <MessageSquare size={40} style={{ color: 'var(--muted-light)', marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: 'var(--muted)' }}>No {statusFilter === 'all' ? '' : statusFilter.replace('_',' ')} tickets</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {tickets.map((t, i) => (
            <div key={t.id} className="flex items-start gap-4 px-5 py-4 border-b table-row-hover cursor-pointer" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}
              onClick={() => openTicket(t)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: 'var(--rose)', fontSize: 13 }}>
                {t.user?.full_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--muted)' }}>#{t.ticket_number}</span>
                  <SupportStatusTag status={t.status} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }} className="truncate">{t.subject}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {t.user?.full_name} ({t.user?.role}) · {t.updated_at ? formatDistanceToNow(new Date(t.updated_at), { addSuffix: true }) : ""}
                </p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 4 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PRIORITY_COLORS = { low: '#64748b', normal: '#3b82f6', high: '#f97316', urgent: '#ef4444' };

// ── DEMO REQUESTS ─────────────────────────────────────────────────────
function DemoRequests() {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const { data } = await demoApi.getRequests(); setDemos(data.requests || []); }
      catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return loading ? (
    <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
  ) : (
    <div className="card overflow-hidden">
      {demos.length === 0 ? (
        <div className="empty-state"><FileText size={36} style={{ color: 'var(--muted-light)', marginBottom: 12 }} /><p style={{ fontWeight: 700, color: 'var(--muted)' }}>No demo requests</p></div>
      ) : demos.map((d, i) => (
        <div key={d.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{d.company_name}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{d.contact_name} · {d.email} · {d.phone}</p>
            {d.industry && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{d.industry} · {d.company_size}</p>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{(d.created_at ? format(new Date(d.created_at), 'MMM d, yyyy') : '—')}</p>
        </div>
      ))}
    </div>
  );
}

// ── SITE SETTINGS ─────────────────────────────────────────────────────
// Generic toggle panel for public-facing UI settings. Currently one
// toggle (nav visibility of Browse Taskers); built so more toggles can
// be added later by just adding another entry to TOGGLES below.
const TOGGLES = [
  {
    key: 'nav_show_browse_taskers',
    label: 'Show "Browse Taskers" in main menu',
    description: 'Controls whether the "Browse Taskers" link appears in the site navigation for visitors. Turning this off hides the menu link — the /taskers page itself still works for anyone with a direct link.',
    default: true,
  },
];

function SiteSettingsPanel() {
  const [values, setValues] = useState({}); // key -> boolean
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key currently being saved
  // Refer banner (editable text + enable toggle)
  const [bannerText, setBannerText] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);
  const DEFAULT_BANNER_TEXT = 'Refer and earn: get 10% commission when people you invite complete tasks.';
  const [heroEdits, setHeroEdits] = useState({
    home_hero_heading: '',
    home_hero_subheading: '',
    vooom_hero_heading: '',
    vooom_hero_subheading: '',
  });
  const [savingHero, setSavingHero] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getSettings();
      const map = {};
      for (const t of TOGGLES) map[t.key] = t.default;
      let bt = DEFAULT_BANNER_TEXT, be = true;
      for (const row of data.settings || []) {
        if (TOGGLES.some(t => t.key === row.key)) map[row.key] = row.value === 'true';
        if (row.key === 'refer_banner_text') bt = row.value;
        if (row.key === 'refer_banner_enabled') be = row.value === 'true';
        if (['home_hero_heading','home_hero_subheading','vooom_hero_heading','vooom_hero_subheading'].includes(row.key)) {
          setHeroEdits(prev => ({ ...prev, [row.key]: row.value }));
        }
      }
      setValues(map);
      setBannerText(bt);
      setBannerEnabled(be);
    } catch {
      toast.error('Could not load settings');
      const map = {};
      for (const t of TOGGLES) map[t.key] = t.default;
      setValues(map);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveBanner = async () => {
    if (bannerText.trim().length < 5) { toast.error('Banner text is too short'); return; }
    setSavingBanner(true);
    try {
      await adminApi.updateSetting('refer_banner_text', bannerText.trim());
      await adminApi.updateSetting('refer_banner_enabled', bannerEnabled);
      toast.success('Refer banner updated');
      try { sessionStorage.removeItem('taskeeu_public_settings'); } catch {}
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save banner');
    } finally { setSavingBanner(false); }
  };

  const saveHeroText = async (page) => {
    const keys = page === 'home'? ['home_hero_heading', 'home_hero_subheading']
      : ['vooom_hero_heading', 'vooom_hero_subheading'];
    setSavingHero(page);
    try {
      await Promise.all(keys.map(k => adminApi.updateSetting(k, heroEdits[k])));
      toast.success(`${page === 'home' ? 'Homepage' : 'Vooom'} hero text updated`);
      // Bust the public settings cache
      try { sessionStorage.removeItem('taskeeu_public_settings'); } catch {}
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save hero text');
    } finally { setSavingHero(null); }
  };

  const toggle = async (t) => {
    const next = !values[t.key];
    setSaving(t.key);
    // Optimistic update — flip immediately, revert on failure
    setValues(v => ({ ...v, [t.key]: next }));
    try {
      await adminApi.updateSetting(t.key, next);
      toast.success(next ? 'Now visible in navigation' : 'Now hidden from navigation');
    } catch (err) {
      setValues(v => ({ ...v, [t.key]: !next })); // revert
      toast.error(err.response?.data?.message || 'Could not update setting');
    } finally { setSaving(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Site Settings</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Toggle visibility of public-facing navigation elements. Changes apply immediately, site-wide.</p>
      </div>

      <div className="card" style={{ padding: 4 }}>
        {TOGGLES.map((t, i) => (
          <div key={t.key} style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20,
            padding: '18px 20px', borderBottom: i < TOGGLES.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{t.label}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{t.description}</p>
            </div>
            <button
              onClick={() => toggle(t)}
              disabled={saving === t.key}
              title={values[t.key] ? 'Visible — click to hide' : 'Hidden — click to show'}
              style={{ background: 'none', border: 'none', cursor: saving === t.key ? 'wait' : 'pointer', padding: 0, flexShrink: 0, opacity: saving === t.key ? 0.5 : 1 }}
            >
              {values[t.key]
                ? <ToggleRight size={34} style={{ color: 'var(--rose)' }} />
                : <ToggleLeft size={34} style={{ color: 'var(--muted-light, #cbd5e1)' }} />}
            </button>
          </div>
        ))}
      </div>

      {/* Homepage hero copy editor */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Homepage hero text</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
          The main heading and subtitle shown in the hero section of the homepage. Changes apply immediately site-wide.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:5 }}>Heading</label>
            <input
              className="input" value={heroEdits.home_hero_heading}
              onChange={e => setHeroEdits(v => ({ ...v, home_hero_heading: e.target.value }))}
              placeholder="Need someone to run an errand for you in Nigeria?" style={{ width:'100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:5 }}>Subtitle</label>
            <textarea
              className="input" rows={3}
              value={heroEdits.home_hero_subheading}
              onChange={e => setHeroEdits(v => ({ ...v, home_hero_subheading: e.target.value }))}
              style={{ width:'100%', resize:'vertical' }}
            />
          </div>
        </div>
        <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => saveHeroText('home')} disabled={savingHero === 'home'} className="btn-primary" style={{ padding:'9px 20px' }}>
            {savingHero === 'home' ? 'Saving…' : 'Save homepage hero'}
          </button>
        </div>
      </div>

      {/* Vooom hero copy editor */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Vooom hero text</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
          The heading and subtitle shown in the Vooom landing page hero section.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:5 }}>Heading</label>
            <input
              className="input" value={heroEdits.vooom_hero_heading}
              onChange={e => setHeroEdits(v => ({ ...v, vooom_hero_heading: e.target.value }))}
              placeholder="Send anything across Nigeria or worldwide…" style={{ width:'100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--muted)', display:'block', marginBottom:5 }}>Subtitle</label>
            <textarea
              className="input" rows={3}
              value={heroEdits.vooom_hero_subheading}
              onChange={e => setHeroEdits(v => ({ ...v, vooom_hero_subheading: e.target.value }))}
              style={{ width:'100%', resize:'vertical' }}
            />
          </div>
        </div>
        <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => saveHeroText('vooom')} disabled={savingHero === 'vooom'} className="btn-primary" style={{ padding:'9px 20px' }}>
            {savingHero === 'vooom' ? 'Saving…' : 'Save Vooom hero'}
          </button>
        </div>
      </div>

      {/* Refer & Earn banner editor */}
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Refer &amp; Earn banner</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              The clickable strip above the navbar on public pages. Edit the message and toggle it on or off. The  icon and &ldquo;Learn how&rdquo; link are added automatically.
            </p>
          </div>
          <button
            onClick={() => setBannerEnabled(v => !v)}
            title={bannerEnabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            {bannerEnabled ? <ToggleRight size={34} style={{ color: 'var(--rose)' }} /> : <ToggleLeft size={34} style={{ color: 'var(--muted-light, #cbd5e1)' }} />}
          </button>
        </div>

        <textarea
          value={bannerText}
          onChange={e => setBannerText(e.target.value.slice(0, 160))}
          rows={2}
          placeholder={DEFAULT_BANNER_TEXT}
          className="input" style={{ width: '100%', resize: 'vertical', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{bannerText.length}/160 characters</span>
          <button onClick={saveBanner} disabled={savingBanner} className="btn-primary" style={{ padding: '9px 20px' }}>
            {savingBanner ? 'Saving…' : 'Save banner'}
          </button>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Preview</p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
            padding: '7px 16px', borderRadius: 8, textAlign: 'center', lineHeight: 1.4,
            background: 'linear-gradient(90deg, #ff2d62, #ff6b8f)', color: 'white', fontSize: 13, fontWeight: 700,
            opacity: bannerEnabled ? 1 : 0.4,
          }}>
            <span>{bannerText || DEFAULT_BANNER_TEXT}</span>
            <span style={{ textDecoration: 'underline' }}>Learn how →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AUDIT LOG ─────────────────────────────────────────────────────────
function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const { data } = await adminApi.auditLog(); setLogs(data.logs || []); }
      catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return loading ? (
    <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
  ) : (
    <div className="card overflow-hidden">
      {logs.length === 0 ? (
        <div className="empty-state"><ScrollText size={36} style={{ color: 'var(--muted-light)', marginBottom: 12 }} /><p style={{ fontWeight: 700, color: 'var(--muted)' }}>No audit logs</p></div>
      ) : logs.map((l, i) => (
        <div key={l.id} className="flex items-center gap-4 px-5 py-4 border-b table-row-hover" style={{ borderColor: 'var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{l.action}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Admin: {l.admin?.full_name} · Target: {l.target_user?.full_name || l.target_user_id}</p>
            {l.notes && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{l.notes}</p>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{(l.created_at ? format(new Date(l.created_at), 'MMM d · HH:mm') : '—')}</p>
        </div>
      ))}
    </div>
  );
}

// ── CONTACTS PANEL ────────────────────────────────────────────────
function ContactsPanel() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await contactApi.getInquiries(); setInquiries(data.inquiries || []); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openInquiry = async (inq) => {
    setSelected(inq);
    setReply('');
    if (inq.status === 'unread') {
      await contactApi.markRead(inq.id).catch(() => {});
      setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: 'read' } : i));
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) { alert('Enter a reply'); return; }
    setSending(true);
    try {
      await contactApi.reply(selected.id, { reply });
      setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, status: 'replied', admin_reply: reply } : i));
      setSelected(prev => ({ ...prev, status: 'replied', admin_reply: reply }));
      setReply('');
      alert('Reply sent successfully!');
    } catch (err) { alert(err.response?.data?.message || 'Could not send reply'); }
    finally { setSending(false); }
  };

  const STATUS_BADGE = {
    unread:  { label: 'Unread',  bg: '#fef2f2', color: '#dc2626' },
    read:    { label: 'Read',    bg: '#fffbeb', color: '#d97706' },
    replied: { label: 'Replied', bg: '#f0fdf4', color: '#16a34a' },
  };

  const CATEGORY_LABELS = { general: 'General', support: 'Account', enterprise: 'Enterprise', partnership: 'Partnership', feedback: 'Feedback' };

  const filtered = filter ? inquiries.filter(i => i.status === filter) : inquiries;
  const unreadCount = inquiries.filter(i => i.status === 'unread').length;

  if (loading) return <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: 20 }}>
      {/* List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, fontSize: 17, color: 'var(--text)', margin: 0 }}>
            Contact Inquiries {unreadCount > 0 && <span style={{ background: 'var(--rose)', color: 'white', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99, marginLeft: 6 }}>{unreadCount}</span>}
          </h3>
          <select className="input" style={{ width: 120, padding: '6px 10px', fontSize: 13 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
        </div>
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="empty-state"><Inbox size={32} style={{ color: 'var(--muted-light)', marginBottom: 10 }} /><p style={{ color: 'var(--muted)', fontWeight: 700 }}>No inquiries</p></div>
          ) : filtered.map((inq, i) => {
            const badge = STATUS_BADGE[inq.status] || STATUS_BADGE.read;
            return (
              <div key={inq.id} onClick={() => openInquiry(inq)}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
                  background: selected?.id === inq.id ? 'var(--rose-light)' : inq.status === 'unread' ? '#fffbeb' : i % 2 === 0 ? 'transparent' : '#fdf9ff',
                  transition: 'background 0.1s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <p style={{ fontWeight: inq.status === 'unread' ? 900 : 700, fontSize: 14, color: 'var(--text)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.subject}</p>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{inq.name} · {CATEGORY_LABELS[inq.category] || inq.category}</p>
                <p style={{ fontSize: 11, color: 'var(--muted-light)', margin: '2px 0 0' }}>{inq.created_at ? format(new Date(inq.created_at), 'MMM d, yyyy HH:mm') : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail & Reply */}
      {selected && (
        <div className="card p-6 space-y-5" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontWeight: 900, fontSize: 17, color: 'var(--text)', margin: 0 }}>{selected.subject}</h4>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><X size={18} /></button>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 18px', fontSize: 14 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text)' }}>{selected.name}</p>
            <p style={{ margin: '0 0 2px', color: 'var(--muted)', fontSize: 13 }}>{selected.email}</p>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Category: {CATEGORY_LABELS[selected.category] || selected.category} · {selected.created_at ? format(new Date(selected.created_at), 'MMM d, yyyy HH:mm') : ''}</p>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Their Message</p>
            <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap', background: 'white', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border-light)' }}>{selected.message}</p>
          </div>
          {selected.admin_reply && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Previous Reply</p>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap', background: '#f0fdf4', borderRadius: 12, padding: '14px 18px', border: '1px solid #bbf7d0' }}>{selected.admin_reply}</p>
            </div>
          )}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {selected.status === 'replied' ? 'Send Another Reply' : 'Reply to'} {selected.name}
            </p>
            <textarea
              rows={5} value={reply} onChange={e => setReply(e.target.value)}
              placeholder={`Type your reply to ${selected.name}...`}
              className="input resize-none" style={{ marginBottom: 12 }}
            />
            <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-primary flex items-center gap-2">
              <Send size={15} /> {sending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BROADCAST PANEL ───────────────────────────────────────────────
function ReferralsPanel() {
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.getReferrals()
      .then(({ data }) => setReferrers(data.referrers || []))
      .catch(() => toast.error('Could not load referral data'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `\u20a6${Number(n || 0).toLocaleString()}`;
  const filtered = referrers.filter(r => !search ||
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.slug?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLORS = {
    available: { bg: '#dcfce7', color: '#166534', label: 'Available to withdraw' },
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'Pending (task not complete)' },
    withdrawn: { bg: '#e0e7ff', color: '#3730a3', label: 'Withdrawn' },
  };

  if (loading) return <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div>
      <div className="mb-5">
        <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Referral Program</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 14 }}>
          Everyone who created a custom referral link, who they referred, those users' task activity, and commission settlement. Referrer earns 10% of a completed task (from Taskeeu's 20% fee).
        </p>
        <div className="relative" style={{ maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input type="text" placeholder="Search by name, link or email..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: 40 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Gift size={36} style={{ color: 'var(--muted-light)', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, color: 'var(--muted)' }}>No referrers yet</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Once users create referral links, they'll appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(ref => (
            <div key={ref.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Referrer header row */}
              <button onClick={() => setExpanded(expanded === ref.id ? null : ref.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: 15 }}>{ref.full_name}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'capitalize', background: 'var(--surface)', padding: '2px 8px', borderRadius: 6 }}>{ref.role}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Link2 size={12} /> taskeeu.com/refer/{ref.slug}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Referred</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{ref.referred_count}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Available</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#00c37e' }}>{fmt(ref.wallet.available)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pending</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>{fmt(ref.wallet.pending)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Withdrawn</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{fmt(ref.wallet.withdrawn)}</p>
                </div>
                {expanded === ref.id ? <ChevronLeft size={18} style={{ transform: 'rotate(-90deg)', color: 'var(--muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--muted)' }} />}
              </button>

              {/* Expanded: referred users + their tasks + commission */}
              {expanded === ref.id && (
                <div style={{ borderTop: '1px solid var(--border-light)', padding: 16, background: 'var(--surface)' }}>
                  {ref.referred.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>No signups through this link yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {ref.referred.map(u => (
                        <div key={u.id} style={{ background: 'white', borderRadius: 12, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.full_name} <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>({u.role})</span></p>
                              <p style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email} · joined {u.joined_at ? format(new Date(u.joined_at), 'MMM d, yyyy') : ''}</p>
                            </div>
                          </div>
                          {u.tasks.length === 0 ? (
                            <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>No tasks posted yet.</p>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    {['Task', 'Status', 'Bids', 'Accepted', 'Paid', 'Commission'].map(h => (
                                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {u.tasks.map(t => {
                                    const comm = u.commission.find(c => c.task_id === t.id);
                                    const sc = comm ? STATUS_COLORS[comm.status] : null;
                                    return (
                                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--text)', maxWidth: 180 }} className="truncate">{t.title}</td>
                                        <td style={{ padding: '7px 10px' }}><TaskTag status={t.status} /></td>
                                        <td style={{ padding: '7px 10px', color: 'var(--muted)' }}>{t.bids}</td>
                                        <td style={{ padding: '7px 10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.accepted_amount ? fmt(t.accepted_amount) : '—'}</td>
                                        <td style={{ padding: '7px 10px', fontWeight: 700, color: t.amount_paid > 0 ? '#00c37e' : 'var(--muted)', whiteSpace: 'nowrap' }}>{t.amount_paid > 0 ? fmt(t.amount_paid) : '—'}</td>
                                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                          {comm ? (
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: sc.bg, color: sc.color }} title={sc.label}>
                                              {fmt(comm.amount)} · {comm.status}
                                            </span>
                                          ) : <span style={{ color: 'var(--muted-light)' }}>—</span>}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PushPanel() {
  const [form, setForm] = useState({ title: '', body: '', url: '/', audience: 'all' });
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [posterStats, setPosterStats] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadStats = () => {
    adminApi.getPwaPushAnalytics().then(({ data }) => setStats(data)).catch(() => {});
    adminApi.getPosterAnalytics().then(({ data }) => setPosterStats(data)).catch(() => {});
  };
  useEffect(() => { loadStats(); }, []);

  const AUDIENCE = [
    { value: 'all', label: 'Everyone' },
    { value: 'requesters', label: 'Requesters' },
    { value: 'taskers', label: 'Taskers' },
  ];

  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and message are required'); return; }
    if (!window.confirm(`Send this push notification to ${form.audience === 'all' ? 'everyone' : form.audience}?`)) return;
    setSending(true);
    try {
      const { data } = await pushApi.adminSend(form);
      toast.success(data.message || 'Push sent');
      setForm({ title: '', body: '', url: '/', audience: 'all' });
      setTimeout(loadStats, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send push');
    } finally { setSending(false); }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="mb-5">
        <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Push Alerts</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Send a push notification to users who have enabled notifications (works on Android, Windows, Mac, and installed iOS home-screen apps).
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value.slice(0, 60))} className="input" placeholder="e.g. New tasks near you" />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{form.title.length}/60</p>
        </div>
        <div>
          <label className="label">Message</label>
          <textarea value={form.body} onChange={e => set('body', e.target.value.slice(0, 160))} rows={3} className="input" style={{ resize: 'vertical' }} placeholder="Short message shown in the notification" />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{form.body.length}/160</p>
        </div>
        <div>
          <label className="label">Link when tapped (optional)</label>
          <input value={form.url} onChange={e => set('url', e.target.value)} className="input" placeholder="/" />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Where users go when they tap. Default is the home page.</p>
        </div>
        <div>
          <label className="label">Audience</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {AUDIENCE.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => set('audience', value)}
                style={{
                  padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  background: form.audience === value ? 'var(--rose)' : 'var(--surface)',
                  color: form.audience === value ? 'white' : 'var(--text)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: 'linear-gradient(135deg,#ff2d62,#ff6b8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={18} style={{ color: 'white' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text)' }}>{form.title || 'Notification title'}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{form.body || 'Your message preview appears here.'}</p>
          </div>
        </div>

        <button onClick={send} disabled={sending || !form.title.trim() || !form.body.trim()} className="btn-primary flex items-center gap-2">
          <Bell size={16} /> {sending ? 'Sending…' : 'Send push notification'}
        </button>
      </div>

      {/* Analytics */}
      {stats && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>App install analytics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 10 }}>
            <div className="card p-4">
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total installs</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--rose)' }}>{stats.installs.total}</p>
            </div>
            {Object.entries(stats.installs.by_platform || {}).map(([plat, n]) => (
              <div key={plat} className="card p-4">
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'capitalize' }}>{plat}</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{n}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 24 }}>
            By device: {Object.entries(stats.installs.by_device || {}).map(([d, n]) => `${d} (${n})`).join(', ') || 'none yet'}
          </p>

          <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>Push campaigns — sent vs opened</h3>
          {(!stats.push_campaigns || stats.push_campaigns.length === 0) ? (
            <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>No push notifications sent yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {['Notification', 'Delivered', 'Opened', 'Open rate', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.push_campaigns.map((c, i) => {
                    const delivered = c.shown || c.sent || 0;
                    const rate = delivered > 0 ? Math.round((c.opened / delivered) * 100) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text)', maxWidth: 200 }} className="truncate">{c.title || '(no title)'}</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{delivered}</td>
                        <td style={{ padding: '9px 12px', color: '#00c37e', fontWeight: 700 }}>{c.opened}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text)' }}>{rate}%</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{c.created_at ? format(new Date(c.created_at), 'MMM d, HH:mm') : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Poster analytics ── */}
      {posterStats && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>Marketing poster usage</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'Unique users', val: posterStats.totals?.unique_users || 0 },
              { label: 'Total downloads', val: posterStats.totals?.total_downloads || 0 },
              { label: 'Link copies', val: posterStats.totals?.total_copies || 0 },
            ].map(({ label, val }) => (
              <div key={label} className="card p-4">
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--rose)', margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
          {posterStats.rows?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {['User', 'Role', 'Downloads', 'Link copies', 'Last active'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posterStats.rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text)' }}>{r.user?.full_name || 'Anonymous'}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--muted)', textTransform: 'capitalize' }}>{r.role || r.user?.role || 'unknown'}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--rose)', fontWeight: 700 }}>{r.downloads}</td>
                      <td style={{ padding: '9px 12px', color: '#7c3aed', fontWeight: 700 }}>{r.copies}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{r.last_at ? format(new Date(r.last_at), 'MMM d, HH:mm') : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>No poster activity yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function BroadcastPanel() {
  const [form, setForm] = useState({ subject: '', body: '', audience: 'all' });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [announceSending, setAnnounceSending] = useState(false);
  const [announceView, setAnnounceView] = useState('collapsed'); // collapsed | compose | history
  const [announceSubject, setAnnounceSubject] = useState('');
  const [announceFeatures, setAnnounceFeatures] = useState([]);
  const [announceHistory, setAnnounceHistory] = useState([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingAnnounceHistory, setLoadingAnnounceHistory] = useState(false);

  const openAnnounceCompose = async () => {
    if (announceFeatures.length > 0) { setAnnounceView('compose'); return; }
    setLoadingTemplate(true);
    try {
      const { data } = await adminApi.getAnnouncementTemplate();
      setAnnounceSubject(data.defaultSubject || '');
      setAnnounceFeatures(data.defaultFeatures || []);
      setAnnounceView('compose');
    } catch { toast.error('Could not load template'); }
    finally { setLoadingTemplate(false); }
  };

  const openAnnounceHistory = async () => {
    setAnnounceView('history');
    setLoadingAnnounceHistory(true);
    try {
      const { data } = await adminApi.getAnnouncementHistory();
      setAnnounceHistory(data.announcements || []);
    } catch { toast.error('Could not load history'); }
    finally { setLoadingAnnounceHistory(false); }
  };

  const addFeatureRow = () => setAnnounceFeatures(f => [...f, { title: '', body: '' }]);
  const removeFeatureRow = (i) => setAnnounceFeatures(f => f.filter((_, idx) => idx !== i));
  const updateFeature = (i, key, val) => setAnnounceFeatures(f => f.map((row, idx) => idx === i ? { ...row, [key]: val } : row));

  const sendAnnouncement = async () => {
    if (!announceSubject.trim()) { toast.error('Subject is required'); return; }
    const validFeatures = announceFeatures.filter(f => f.title.trim() && f.body.trim());
    if (!validFeatures.length) { toast.error('At least one feature with title and description is required'); return; }
    if (!window.confirm(`Send this announcement to ALL users? This cannot be undone.`)) return;
    setAnnounceSending(true);
    try {
      const { data } = await adminApi.sendFeatureAnnouncement({ subject: announceSubject, features: validFeatures });
      toast.success(data.message || 'Announcement sent!');
      setAnnounceView('collapsed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send announcement');
    } finally { setAnnounceSending(false); }
  };

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [view, setView] = useState('compose'); // compose | history | tracking
  const [emailStats, setEmailStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Recipient picker state (only used when audience === 'specific')
  const [pickerUsers, setPickerUsers] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerRoleFilter, setPickerRoleFilter] = useState('all'); // all | requester | tasker
  const [pickerStateFilter, setPickerStateFilter] = useState('all'); // 'all' or a state name
  const [pickerCityFilter, setPickerCityFilter] = useState(''); // free-text city contains
  const [selectedIds, setSelectedIds] = useState([]); // array of user ids

  useEffect(() => {
    if (view === 'tracking' && !emailStats) {
      setLoadingStats(true);
      adminApi.getEmailAnalytics()
        .then(({ data }) => setEmailStats(data.broadcasts || []))
        .catch(() => toast.error('Could not load email tracking'))
        .finally(() => setLoadingStats(false));
    }
  }, [view]);

  useEffect(() => {
    contactApi.broadcastHistory()
      .then(({ data }) => setHistory(data.broadcasts || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  // Lazy-load the full user list the first time "Specific people" is chosen
  const loadPickerUsers = async () => {
    if (pickerLoaded || pickerLoading) return;
    setPickerLoading(true);
    try {
      // Pull a large page so the picker has everyone; getUsers already
      // returns id, full_name, email, role.
      const { data } = await adminApi.getUsers({ limit: 1000 });
      setPickerUsers(data.users || []);
      setPickerLoaded(true);
    } catch { toast.error('Could not load users for selection'); }
    finally { setPickerLoading(false); }
  };

  const chooseAudience = (value) => {
    set('audience', value);
    if (value === 'specific') loadPickerUsers();
  };

  const toggleRecipient = (id) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  const filteredPicker = pickerUsers.filter(u => {
    if (pickerRoleFilter !== 'all' && u.role !== pickerRoleFilter) return false;
    if (pickerStateFilter !== 'all' && (u.task_state || '') !== pickerStateFilter) return false;
    if (pickerCityFilter && !(u.task_city || '').toLowerCase().includes(pickerCityFilter.toLowerCase())) return false;
    if (!pickerSearch) return true;
    const s = pickerSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  // States that actually have at least one user with a location set (taskers).
  // Built from the loaded list so the dropdown never offers an empty state.
  const availableStates = Array.from(
    new Set(pickerUsers.map(u => u.task_state).filter(Boolean))
  ).sort();

  const selectAllFiltered = () => {
    const ids = filteredPicker.map(u => u.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
  };
  const clearSelection = () => setSelectedIds([]);

  const sendBroadcast = async () => {
    if (!form.subject.trim() || !form.body.trim()) { toast.error('Subject and message are required'); return; }
    if (form.audience === 'specific' && selectedIds.length === 0) { toast.error('Select at least one recipient'); return; }

    const audienceLabel = form.audience === 'all' ? 'all users': form.audience === 'specific' ? `${selectedIds.length} selected recipient${selectedIds.length !== 1 ? 's' : ''}`
      : form.audience;
    if (!window.confirm(`Send this email to ${audienceLabel}? This cannot be undone.`)) return;

    setSending(true);
    try {
      const payload = form.audience === 'specific'? { ...form, user_ids: selectedIds }
        : form;
      const { data } = await contactApi.broadcast(payload);
      toast.success(data.message || 'Broadcast sent');
      setHistory(prev => [{ ...form, recipient_count: data.sent, created_at: new Date().toISOString(), status: 'sent', sent_by: { full_name: 'You' } }, ...prev]);
      setForm({ subject: '', body: '', audience: 'all' });
      setSelectedIds([]);
    } catch (err) { toast.error(err.response?.data?.message || 'Broadcast failed'); }
    finally { setSending(false); }
  };

  const AUDIENCE_OPTS = [
    { value: 'all',        label: 'All Users (requesters + taskers)' },
    { value: 'requesters', label: 'Requesters only' },
    { value: 'taskers',    label: 'Taskers only' },
    { value: 'specific',   label: 'Specific people…' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[['compose', 'Compose Email'], ['history', 'Sent History'], ['tracking', 'Open & Click Tracking']].map(([val, label]) => (
          <button key={val} onClick={() => setView(val)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: view === val ? 'var(--rose)' : 'white', color: view === val ? 'white' : 'var(--muted)',
              boxShadow: view === val ? '0 2px 10px rgba(255,45,98,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {view === 'compose' && (
        <div className="card p-8 space-y-5" style={{ maxWidth: 760 }}>
          {/* Feature announcement composer */}
          <div style={{ border: '1px solid #fecdd3', borderRadius: 14, overflow: 'hidden', marginBottom: 4 }}>
            {/* Header row */}
            <div style={{ background: 'linear-gradient(135deg,#fff0f4,#fce7f3)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#be123c', margin: '0 0 2px' }}>Feature announcement email</p>
                <p style={{ fontSize: 12.5, color: '#9f1239', margin: 0 }}>Compose, edit features, and send to all users. Each send is saved to history.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={openAnnounceHistory}
                  style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(190,18,60,0.1)', border: '1px solid #fecdd3', color: '#be123c', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                  History
                </button>
                <button onClick={announceView === 'compose' ? () => setAnnounceView('collapsed') : openAnnounceCompose}
                  disabled={loadingTemplate}
                  style={{ padding: '8px 14px', borderRadius: 9, background: '#ff2d62', border: 'none', color: 'white', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                  {loadingTemplate ? 'Loading…' : announceView === 'compose' ? 'Collapse' : 'Compose'}
                </button>
              </div>
            </div>

            {/* Compose view */}
            {announceView === 'compose' && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Email subject</label>
                  <input value={announceSubject} onChange={e => setAnnounceSubject(e.target.value)} className="input" placeholder="New on Taskeeu: …" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Features list</label>
                    <button onClick={addFeatureRow}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>
                      + Add feature
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {announceFeatures.map((f, i) => (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 14 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input value={f.title} onChange={e => updateFeature(i, 'title', e.target.value)}
                            placeholder="Feature title" className="input" style={{ flex: 1, fontSize: 13, fontWeight: 700 }} />
                          <button onClick={() => removeFeatureRow(i)}
                            style={{ flexShrink: 0, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: '#be123c', fontWeight: 700, fontSize: 16 }}>×</button>
                        </div>
                        <textarea value={f.body} onChange={e => updateFeature(i, 'body', e.target.value)}
                          placeholder="Explain this feature clearly and briefly…" rows={2}
                          className="input" style={{ fontSize: 13, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={sendAnnouncement} disabled={announceSending} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
                  {announceSending ? 'Sending to all users…' : `Send to all users (${announceFeatures.filter(f => f.title && f.body).length} features)`}
                </button>
              </div>
            )}

            {/* History view */}
            {announceView === 'history' && (
              <div style={{ padding: 20 }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>Announcement history</p>
                {loadingAnnounceHistory ? (
                  <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>
                ) : announceHistory.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: 13 }}>No announcements sent yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {announceHistory.map(a => (
                      <div key={a.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <p style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)', margin: '0 0 3px' }}>{a.subject}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                            Sent to {a.recipient_count?.toLocaleString() || 0} users · {a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy HH:mm') : ''}
                          </p>
                        </div>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Sent</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', margin: '0 0 6px' }}>Broadcast Email</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Send a message directly to users' inboxes. Emails are sent with proper headers to maximise inbox delivery.
            </p>
          </div>

          <div>
            <label className="label">Audience</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AUDIENCE_OPTS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => chooseAudience(value)}
                  style={{
                    padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    background: form.audience === value ? 'var(--rose)' : 'var(--surface)', color: form.audience === value ? 'white' : 'var(--text)',
                    boxShadow: form.audience === value ? '0 2px 10px rgba(255,45,98,0.2)' : 'none', transition: 'all 0.15s',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient picker — one-on-one or hand-picked group */}
          {form.audience === 'specific' && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', margin: 0 }}>
                  Select recipients {selectedIds.length > 0 && <span style={{ color: 'var(--rose)' }}>({selectedIds.length} selected)</span>}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={selectAllFiltered} style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)', background: 'none', border: 'none', cursor: 'pointer' }}>Select all shown</button>
                  <button type="button" onClick={clearSelection} style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Search name or email…" className="input" style={{ flex: 1, minWidth: 180 }} />
                <select value={pickerRoleFilter} onChange={e => setPickerRoleFilter(e.target.value)} className="input" style={{ maxWidth: 160 }}>
                  <option value="all">All roles</option>
                  <option value="requester">Requesters</option>
                  <option value="tasker">Taskers</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <select value={pickerStateFilter} onChange={e => setPickerStateFilter(e.target.value)} className="input" style={{ flex: 1, minWidth: 160 }}>
                  <option value="all">All states</option>
                  {availableStates.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <input value={pickerCityFilter} onChange={e => setPickerCityFilter(e.target.value)} placeholder="Filter by city…" className="input" style={{ flex: 1, minWidth: 160 }} />
              </div>
              {(pickerStateFilter !== 'all' || pickerCityFilter) && (
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                  Note: location filtering matches taskers (only taskers have a service city/state). Requesters have no location on file and are hidden while a location filter is active.
                </p>
              )}

              {pickerLoading ? (
                <div className="flex justify-center py-8"><RefreshCw size={18} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 10 }}>
                  {filteredPicker.length === 0 ? (
                    <p style={{ padding: 16, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>No matching users.</p>
                  ) : filteredPicker.slice(0, 300).map(u => {
                    const checked = selectedIds.includes(u.id);
                    return (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', background: checked ? 'rgba(255,45,98,0.05)' : 'transparent' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRecipient(u.id)} style={{ accentColor: 'var(--rose)', width: 16, height: 16, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0 }} className="truncate">{u.full_name || '(no name)'}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }} className="truncate">{u.email}</p>
                          {(u.task_city || u.task_state) && (
                            <p style={{ fontSize: 11, color: 'var(--rose)', margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 3 }} className="truncate">
                              <MapPin size={10} /> {[u.task_city, u.task_state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'capitalize', flexShrink: 0 }}>{u.role}</span>
                      </label>
                    );
                  })}
                  {filteredPicker.length > 300 && (
                    <p style={{ padding: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Showing first 300 — narrow your search to see more.</p>
                  )}
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                Only active, email-verified users can receive broadcasts. Selecting one person lets you email them one-on-one.
              </p>
            </div>
          )}

          <div>
            <label className="label">Subject Line *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Important update from Taskeeu" className="input" />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Keep it clear and specific — avoid ALL CAPS or excessive punctuation (spam triggers)</p>
          </div>

          <div>
            <label className="label">Email Body *</label>
            <textarea rows={10} value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Write your message here. You can use plain text — it will be formatted nicely in the email.

The recipient's first name will be added automatically as a greeting (e.g. 'Hi Chidi,').

Tip: Keep it personal, clear, and under 300 words for best engagement." className="input resize-none" />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Plain text only. The email template adds branding automatically. The greeting "Hi [Name]," is added automatically.
            </p>
          </div>

          {/* Preview */}
          {form.subject && form.body && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: 'var(--surface)', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', borderBottom: '1px solid var(--border-light)' }}>
                Preview (how it looks to recipient)
              </div>
              <div style={{ padding: '20px 24px', background: 'white' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--muted)', margin: '0 0 4px' }}>Subject: <span style={{ color: 'var(--text)' }}>{form.subject}</span></p>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--muted)', margin: '0 0 16px' }}>To: {form.audience === 'all' ? 'All users' : form.audience === 'specific' ? `${selectedIds.length} selected recipient${selectedIds.length !== 1 ? 's' : ''}` : form.audience}</p>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: 'var(--text)', margin: '0 0 8px', fontWeight: 600 }}>Hi [Name],</p>
                <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{form.body}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={sendBroadcast} disabled={sending || !form.subject.trim() || !form.body.trim() || (form.audience === 'specific' && selectedIds.length === 0)} className="btn-primary flex items-center gap-2">
              <Radio size={16} /> {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>This action is irreversible. A confirmation dialog will appear.</p>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="card overflow-hidden">
          {loadingHistory ? (
            <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
          ) : history.length === 0 ? (
            <div className="empty-state"><Radio size={32} style={{ color: 'var(--muted-light)', marginBottom: 10 }} /><p style={{ color: 'var(--muted)', fontWeight: 700 }}>No broadcasts sent yet</p></div>
          ) : history.map((b, i) => (
            <div key={b.id || i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: i % 2 === 0 ? 'transparent' : '#fdf9ff' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', margin: '0 0 3px' }}>{b.subject}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 2px' }}>
                    To: <strong>{b.audience}</strong> · {b.recipient_count} recipients
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted-light)', margin: 0 }}>
                    Sent by {b.sent_by?.full_name || 'Admin'} · {b.created_at ? format(new Date(b.created_at), 'MMM d, yyyy HH:mm') : '—'}
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a' }}>
                  Sent
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'tracking' && (
        <div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            Open and click tracking requires Resend webhooks to be enabled on your account (Resend dashboard → Webhooks → point to <strong>/api/contact/resend-webhook</strong>). Until then these columns stay at zero even though emails are delivered.
          </div>
          {loadingStats ? (
            <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
          ) : (!emailStats || emailStats.length === 0) ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No broadcasts sent yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {['Subject', 'Sent to', 'Delivered', 'Opened', 'Clicked', 'Open rate', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emailStats.map(b => {
                    const base = b.delivered || b.recipient_count || 0;
                    const rate = base > 0 ? Math.round((b.opened / base) * 100) : 0;
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text)', maxWidth: 200 }} className="truncate">{b.subject}</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{b.recipient_count}</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{b.delivered}</td>
                        <td style={{ padding: '9px 12px', color: '#00c37e', fontWeight: 700 }}>{b.opened}</td>
                        <td style={{ padding: '9px 12px', color: '#7c3aed', fontWeight: 700 }}>{b.clicked}</td>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text)' }}>{rate}%</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{b.created_at ? format(new Date(b.created_at), 'MMM d, yyyy') : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────
// ── KYC REQUESTS PANEL ──────────────────────────────────────────────
function KYCRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const TYPE_LABELS = {
    kyc_submission: 'KYC Submission',
    edit: 'KYC Edit Request',
    delete_account: 'Account Deletion',
  };

  const STATUS_STYLE = {
    pending:  { bg: '#fffbeb', color: '#b45309' },
    approved: { bg: '#f0fdf4', color: '#15803d' },
    rejected: { bg: '#fff1f2', color: '#9f1239' },
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const { data } = await adminApi.getKYCRequests(params);
      setRequests(data.requests || []);
    } catch { toast.error('Could not load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [typeFilter, statusFilter]);

  const handleAction = async (action) => {
    if (!selected) return;
    setProcessing(true);
    try {
      await adminApi.reviewKYCRequest(selected.id, { action, admin_note: adminNote });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
      setSelected(null);
      setAdminNote('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not process request'); }
    finally { setProcessing(false); }
  };

  const DocLink = ({ url, label }) => url ? (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--rose)', fontWeight: 600, textDecoration: 'underline', marginRight: 12 }}>
      {label} ↗
    </a>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-black text-xl" style={{ color: 'var(--text)' }}>KYC Change Requests</h2>
        <div className="flex gap-2 ml-auto flex-wrap">
          {['all', 'kyc_submission', 'edit', 'delete_account'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${typeFilter === t ? 'btn-primary' : 'btn-ghost border'}`}>
              {t === 'all' ? 'All Types' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${statusFilter === s ? 'btn-primary' : 'btn-ghost border'}`}>
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card p-6 space-y-4" style={{ border: '2px solid var(--rose-light)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ ...STATUS_STYLE[selected.status], padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{selected.status}</span>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{TYPE_LABELS[selected.request_type]}</span>
              </div>
              <p className="font-black text-base" style={{ color: 'var(--text)' }}>{selected.tasker?.full_name}</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{selected.tasker?.email} · {selected.tasker?.phone}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Submitted {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</p>
            </div>
            <button onClick={() => { setSelected(null); setAdminNote(''); }} className="btn-ghost btn-sm">Close</button>
          </div>

          {/* Reason */}
          <div className="p-4 rounded-xl" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--muted)' }}>
              {selected.request_type === 'kyc_submission' ? 'SUBMITTED FOR' : 'REASON FROM TASKER'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.7 }}>{selected.reason || <em style={{ color: 'var(--muted)' }}>No reason provided (KYC document submission)</em>}</p>
          </div>

          {/* KYC Document links — only for kyc_submission and edit types */}
          {selected.request_type === 'kyc_submission' && (
            <div className="p-4 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-xs font-bold mb-3" style={{ color: '#14532d' }}>UPLOADED DOCUMENTS — Click to verify</p>
              <div className="space-y-2">
                {selected.national_id_url     && <div><span className="text-xs text-gray-500">National ID: </span><DocLink url={selected.national_id_url} label="View Document" /></div>}
                {selected.driver_license_url  && <div><span className="text-xs text-gray-500">Driver's License: </span><DocLink url={selected.driver_license_url} label="View Document" /></div>}
                {selected.passport_url        && <div><span className="text-xs text-gray-500">Passport: </span><DocLink url={selected.passport_url} label="View Document" /></div>}
                {selected.proof_of_address_url && <div><span className="text-xs text-gray-500">Proof of Address: </span><DocLink url={selected.proof_of_address_url} label="View Document" /></div>}
                {selected.home_address        && <div className="text-xs text-gray-600">Address: {selected.home_address}</div>}
                {selected.social_url          && <div className="text-xs"><span className="text-gray-500">Social: </span><a href={selected.social_url} target="_blank" rel="noreferrer" style={{ color: 'var(--rose)' }}>{selected.social_url}</a></div>}
                {!selected.national_id_url && !selected.driver_license_url && !selected.passport_url && !selected.proof_of_address_url && (
                  <p className="text-sm text-gray-500">No document URLs in this request.</p>
                )}
              </div>
            </div>
          )}

          {/* Action for pending requests */}
          {selected.status === 'pending' && (
            <>
              <div>
                <label className="label">Admin Note <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(sent to tasker — required when rejecting)</span></label>
                <textarea rows={2} placeholder="Add a note for the tasker..." value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  className="input resize-none text-sm" />
              </div>

              {/* Warning for irreversible actions */}
              {selected.request_type === 'kyc_submission' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#14532d' }}><strong>Approve</strong>: Grants enterprise task access. Sets kyc_complete = true.
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecdd3', fontSize: 12, color: '#9f1239' }}><strong>Reject</strong>: Clears uploaded documents. Tasker must re-upload and resubmit. Include reason in admin note.
                  </div>
                </div>
              )}
              {selected.request_type === 'edit' && (
                <p className="text-xs font-semibold text-amber-700">Approving will clear all KYC documents and allow the tasker to re-upload and resubmit.</p>
              )}
              {selected.request_type === 'delete_account' && (
                <p className="text-xs font-semibold text-red-600">Approving will immediately deactivate this tasker's account. This cannot be undone.</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => handleAction('approve')} disabled={processing}
                  className="btn-primary btn-sm flex-1">
                  {processing ? '…' : `Approve ${TYPE_LABELS[selected.request_type]}`}
                </button>
                <button onClick={() => handleAction('reject')} disabled={processing}
                  className="btn-ghost btn-sm border flex-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                  {processing ? '…' : 'Reject'}
                </button>
              </div>
            </>
          )}

          {/* Already reviewed */}
          {selected.status !== 'pending' && (
            <div className="p-3 rounded-xl" style={STATUS_STYLE[selected.status] || STATUS_STYLE.rejected}>
              <p className="text-sm font-bold">
                {selected.status === 'approved' ? 'Approved' : 'Rejected'} by {selected.reviewer?.full_name || 'Admin'}
                {selected.reviewed_at ? ` on ${new Date(selected.reviewed_at).toLocaleDateString()}` : ''}
              </p>
              {selected.admin_note && <p className="text-xs mt-1">Note: {selected.admin_note}</p>}
            </div>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : requests.length === 0 ? (
        <div className="card empty-state">
          <CheckCircle size={40} style={{ color: 'var(--muted-light)', marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: 'var(--muted)' }}>No requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} onClick={() => { setSelected(r); setAdminNote(r.admin_note || ''); }}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeft: `4px solid ${r.status === 'pending' ? '#f59e0b' : r.status === 'approved' ? '#00c37e' : '#ef4444'}` }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ ...STATUS_STYLE[r.status], padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{TYPE_LABELS[r.request_type]}</span>
                  </div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{r.tasker?.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.tasker?.email}</p>
                  <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>
                    {r.reason ? `"${r.reason.substring(0, 80)}${r.reason.length > 80 ? '…' : ''}"` : <em>No reason provided</em>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</p>
                  <span className="text-xs font-semibold" style={{ color: 'var(--rose)' }}>Review →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('overview');
  const [preSelectedTasker, setPreSelectedTasker] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // onTabChange accepts optional preselect data (e.g. a tasker object from Overview)
  const handleTabChange = (tab, preselect = null) => {
    setActive(tab);
    if (preselect) setPreSelectedTasker(preselect);
    else setPreSelectedTasker(null);
  };
  const [dashData, setDashData] = useState({ stats: {}, pending_taskers: [], recent_tasks: [] });
  const [supportStats, setSupportStats] = useState({ open: 0 });
  const [contactCount, setContactCount] = useState(0);
  const [kycReqCount, setKycReqCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, supportRes, contactRes, kycReqRes] = await Promise.all([
        adminApi.dashboard(),
        supportApi.adminGetStats().catch(() => ({ data: { stats: { open: 0 } } })),
        contactApi.getInquiries({ status: 'unread' }).catch(() => ({ data: { inquiries: [] } })),
        adminApi.getKYCRequests({ status: 'pending' }).catch(() => ({ data: { requests: [] } })),
      ]);
      setDashData(dashRes.data);
      setSupportStats(supportRes.data.stats || { open: 0 });
      setContactCount(contactRes.data.inquiries?.length || 0);
      setKycReqCount(kycReqRes.data.requests?.length || 0);
    } catch (err) {
      console.error('Admin dashboard load error:', err);
      toast.error('Dashboard load failed — check your connection and try refreshing.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading && !dashData.stats.total_users) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading admin panel...</p>
      </div>
    </div>
  );

  return (
    <>
      <SEO title="Admin Panel — Taskeeu" description="Taskeeu administration panel." />
      <div className="dash-wrapper">
        {sidebarOpen && <div className="dash-overlay lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <Sidebar
          active={active} setActive={handleTabChange} user={user}
          pendingCount={dashData.stats?.pending_tasker_approvals || 0}
          supportCount={supportStats.open || 0}
          contactCount={contactCount}
          kycReqCount={kycReqCount}
          isMobile={sidebarOpen} onClose={() => setSidebarOpen(false)}
        />
        <div className="dash-main">
          <Topbar active={active} onMenuOpen={() => setSidebarOpen(true)} onRefresh={load} loading={loading} />
          <main className="dash-content page-enter">
            {active === 'overview'&& <Overview stats={dashData.stats} pendingTaskers={dashData.pending_taskers} recentTasks={dashData.recent_tasks} onTabChange={handleTabChange} />}
            {active === 'analytics' && <AnalyticsPanel />}
            {active === 'taskers'&& <TaskerKYC preSelected={preSelectedTasker} onClearPreSelected={() => setPreSelectedTasker(null)} />}
            {active === 'kyc-requests' && <KYCRequestsPanel />}
            {active === 'users'&& <UsersTable />}
            {active === 'companies' && <CompaniesPanel />}
            {active === 'tasks'&& <TasksTable />}
            {active === 'payments'&& <PaymentsPanel />}
            {active === 'refunds'&& <RefundsPanel />}
            {active === 'payouts' && <AdminPayoutsPanel />}
            {active === 'support'&& <AdminSupport />}
            {active === 'contacts'&& <ContactsPanel />}
            {active === 'broadcast'&& <BroadcastPanel />}
            {active === 'push'&& <PushPanel />}
            {active === 'referrals'&& <ReferralsPanel />}
            {active === 'blog'&& <AdminBlogManager />}
            {active === 'demos'&& <DemoRequests />}
            {active === 'audit'&& <AuditLog />}
            {active === 'settings'&& <SiteSettingsPanel />}
          </main>
        </div>
      </div>
    </>
  );
}
