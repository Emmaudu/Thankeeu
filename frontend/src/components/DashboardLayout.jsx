import { notificationsAPI } from '../utils/api';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Icon from './ui/Icon';

const NAV = [
  { to: '/dashboard',           icon: 'Home',     label: 'Home' },
  { to: '/dashboard/cards',     icon: 'Heart',    label: 'My Cards' },
  { to: '/dashboard/credits',   icon: 'Card',     label: 'Credits & Plans' },
  { to: '/dashboard/delivered', icon: 'Send',     label: 'Delivered' },
  { to: '/dashboard/received',  icon: 'Gift',     label: 'Received' },
  { to: '/dashboard/pending',   icon: 'Edit',     label: 'Pending to Sign' },
  { to: '/dashboard/finances',  icon: 'Wallet',   label: 'Financials' },
  { to: '/dashboard/reminders', icon: 'Clock',    label: 'Reminders' },
  { to: '/dashboard/settings',  icon: 'Settings', label: 'Settings' },
];

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (to) => location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

  const Sidebar = ({ mobile }) => (
    <aside className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col h-full`}
      style={{ width: mobile ? '100%' : '220px', background: 'linear-gradient(180deg, #1E1438 0%, #14102E 100%)', borderRight: '1px solid rgba(124,110,255,0.15)', minHeight: '100vh' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid rgba(124,110,255,0.12)' }}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,#A855F7,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 14px rgba(124,58,237,0.45)'}}>
          <Icon name="Heart" size={18} style={{color:'#fff'}}/>
        </div>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: '#E4E2F6' }}>
          Thank<span style={{ color: '#7C6EFF' }}>eeu</span>
        </span>
      </div>

      {/* User chip */}
      <div className="px-3 py-3">
        <Link to="/dashboard/settings" className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-all">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7C6EFF,#EC4899)', color: '#fff' }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              : user?.full_name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#E4E2F6' }}>{user?.full_name}</p>
            <p className="text-xs truncate" style={{ color: '#6B678A' }}>@{user?.username || 'no username'}</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      
      {/* ─── Sign Out — above nav for easy access ─── */}
      <div className="px-3 pt-1 pb-2 flex-shrink-0">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all"
          style={{ fontSize:15, color:'#FF8A80', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
          <span style={{fontSize:18}}>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
<nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto sidebar-nav" style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(124,110,255,0.35) transparent" }}>
        {NAV.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={isActive(to)
              ? { background: 'rgba(124,110,255,0.18)', color: '#B8B4FF', borderLeft: '3px solid #7C6EFF', paddingLeft: '9px' }
              : { color: '#6B678A', borderLeft: '3px solid transparent', paddingLeft: '9px' }}>
            <Icon name={icon} size={16} className="flex-shrink-0"/>
            {label}
          </Link>
        ))}
      </nav>

      {/* Create card CTA */}
      <div className="px-3 pb-3">
        <Link to="/create-card"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff', boxShadow: '0 2px 10px rgba(92,75,223,0.35)' }}>
          ✨ New card
        </Link>
      </div>

      {/* Logout */}
      
    </aside>

  );

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0F0D24' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0" style={{ width: 220 }}>
        <div className="fixed top-0 left-0 h-screen" style={{ width: 220 }}>
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 h-full"><Sidebar mobile /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0" style={{ background: '#F5F3FF', borderRadius: '20px 0 0 0', minHeight: '100vh' }}>

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE9FF' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-3 rounded-xl" style={{ background: 'rgba(124,110,255,0.1)', color: '#5B4BDF', fontSize: '1.5rem', lineHeight: 1, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <Link to="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#1A1730', fontSize: 15 }}>
            Thank<span style={{ color: '#7C6EFF' }}>eeu</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell
              fetchFn={() => notificationsAPI.getAll()}
              markReadFn={() => notificationsAPI.markAllRead()}
            />
            <Link to="/create-card" className="text-sm font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff' }}>+ Card</Link>
          </div>
        </div>

        {/* Page content */}
        <div className="px-4 md:px-8 py-6 md:py-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#1A1730', lineHeight: 1.2 }}>{title}</h1>}
              {subtitle && <p className="text-sm mt-1" style={{ color: '#7A7898' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
