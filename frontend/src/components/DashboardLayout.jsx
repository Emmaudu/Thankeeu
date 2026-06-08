import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV = [
  { to: '/dashboard',           icon: '🏠', label: 'Home' },
  { to: '/dashboard/cards',     icon: '💌', label: 'My Cards' },
  { to: '/dashboard/delivered', icon: '🚀', label: 'Delivered' },
  { to: '/dashboard/received',  icon: '🎁', label: 'Received' },
  { to: '/dashboard/pending',   icon: '✍️', label: 'Pending to Sign' },
  { to: '/dashboard/finances',  icon: '💰', label: 'Financials' },
  { to: '/dashboard/reminders', icon: '⏰', label: 'Reminders' },
  { to: '/dashboard/settings',  icon: '⚙️', label: 'Settings' },
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
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', boxShadow: '0 0 14px rgba(92,75,223,0.5)' }}>
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>T</span>
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
            <p className="text-xs font-semibold truncate" style={{ color: '#E4E2F6' }}>{user?.full_name}</p>
            <p className="text-xs truncate" style={{ color: '#6B678A' }}>@{user?.username || 'no username'}</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={isActive(to)
              ? { background: 'rgba(124,110,255,0.18)', color: '#B8B4FF', borderLeft: '3px solid #7C6EFF', paddingLeft: '9px' }
              : { color: '#6B678A', borderLeft: '3px solid transparent', paddingLeft: '9px' }}>
            <span className="text-base flex-shrink-0">{icon}</span>
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
      <div className="px-3 pb-5">
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs transition-all text-left"
          style={{ color: '#4A4870' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E4E2F6'}
          onMouseLeave={e => e.currentTarget.style.color = '#4A4870'}>
          🚪 Sign out
        </button>
      </div>
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
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl" style={{ background: 'rgba(124,110,255,0.1)', color: '#5B4BDF' }}>☰</button>
          <Link to="/" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#1A1730', fontSize: 15 }}>
            Thank<span style={{ color: '#7C6EFF' }}>eeu</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell
              fetchFn={() => import('../utils/api').then(m => m.api.get('/notifications'))}
              markReadFn={() => import('../utils/api').then(m => m.api.post('/notifications/mark-read'))}
            />
            <Link to="/create-card" className="text-xs font-semibold px-3 py-1.5 rounded-xl"
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
