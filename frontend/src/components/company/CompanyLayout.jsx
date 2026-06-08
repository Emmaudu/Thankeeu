import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompanyAuth } from '../../context/CompanyAuthContext';

const NAV = [
  { path: '/company/dashboard',    icon: '🏠', label: 'Dashboard' },
  { path: '/company/teams',        icon: '🎉', label: 'Occasions' },
  { path: '/company/members',      icon: '👥', label: 'Team Members' },
  { path: '/company/deductions',   icon: '💰', label: 'Requests' },
  { path: '/company/subscription', icon: '💳', label: 'Subscription' },
  { path: '/company/hris',         icon: '🔗', label: 'HRIS Sync' },
  { path: '/company/settings',     icon: '⚙️', label: 'Settings' },
  { path: '/company/support',      icon: '💬', label: 'Support' },
];

const CompanyLayout = ({ children, title, subtitle }) => {
  const { company, logout } = useCompanyAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/company/login'); };
  const isActive = (p) => location.pathname === p;

  const initials = company?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CO';

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg,#1E1438 0%,#14102E 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(124,110,255,0.12)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', boxShadow: '0 0 14px rgba(92,75,223,0.5)' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'Space Grotesk,sans-serif' }}>T</span>
        </div>
        <div>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 14, color: '#E4E2F6' }}>
            Thank<span style={{ color: '#7C6EFF' }}>eeu</span>
          </span>
          <span className="block text-xs" style={{ color: '#6B678A', marginTop: -2 }}>for Teams</span>
        </div>
      </div>

      {/* Company chip */}
      <div className="px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#EC4899,#7C6EFF)', color: '#fff' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#E4E2F6' }}>{company?.name || 'Company'}</p>
            <p className="text-xs" style={{ color: '#6B678A' }}>HR Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon, label }) => (
          <Link key={path} to={path}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              paddingLeft: 12, paddingRight: 12,
              borderLeft: `3px solid ${isActive(path) ? '#7C6EFF' : 'transparent'}`,
              paddingLeft: isActive(path) ? 9 : 12,
              background: isActive(path) ? 'rgba(124,110,255,0.15)' : 'transparent',
              color: isActive(path) ? '#B8B4FF' : '#6B678A',
            }}>
            <span className="text-base flex-shrink-0">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 flex-shrink-0 space-y-2">
        <Link to="/company/subscription"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff', boxShadow: '0 2px 10px rgba(92,75,223,0.35)' }}>
          💳 Manage subscription
        </Link>
        <button onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
          style={{ color: '#4A4870' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E4E2F6'}
          onMouseLeave={e => e.currentTarget.style.color = '#4A4870'}>
          🚪 Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0F0D24' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0" style={{ width: 220 }}>
        <div className="fixed top-0 left-0 h-screen overflow-hidden" style={{ width: 220 }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div style={{ width: 240 }}><SidebarContent /></div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0" style={{ background: '#F5F3FF', borderRadius: '20px 0 0 0', minHeight: '100vh' }}>
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE9FF' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl"
            style={{ background: 'rgba(124,110,255,0.1)', color: '#5B4BDF' }}>☰</button>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#1A1730', fontSize: 14 }}>
            Thank<span style={{ color: '#7C6EFF' }}>eeu</span> Teams
          </span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#EC4899,#7C6EFF)', color: '#fff' }}>{initials}</div>
        </div>

        {/* Page content */}
        <div className="px-4 md:px-8 py-6 md:py-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#1A1730' }}>{title}</h1>}
              {subtitle && <p className="text-sm mt-1" style={{ color: '#7A7898' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default CompanyLayout;
