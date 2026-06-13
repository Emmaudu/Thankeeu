import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useCompanyAuth } from '../../context/CompanyAuthContext';

const NAV = [
  { path: '/company/dashboard',    icon: 'Home', label: 'Dashboard' },
  { path: '/company/occasions',    icon: 'Cake', label: 'Occasions Manager' },
  { path: '/create-card',          icon: 'Heart', label: 'Create Card' },
  { path: '/company/my-cards',     icon: 'Gift', label: 'My Cards' },
  { path: '/company/activity',     icon: 'File', label: 'Activity Log' },
  { path: '/company/team-members', icon: 'Users', label: 'Team Members' },
  { path: '/company/core-team',    icon: 'Building', label: 'Core Team' },
  { path: '/company/members',      icon: 'Check', label: 'Approvals' },
  { path: '/company/deductions',   icon: 'Wallet', label: 'Deductions' },
  { path: '/company/subscription', icon: 'Card', label: 'Subscription' },
  { path: '/company/gift-cards',   icon: 'Gift', label: 'Gift Cards' },
  { path: '/company/hris',         icon: 'Link', label: 'HRIS Sync' },
  { path: '/company/settings',     icon: 'Settings', label: 'Settings' },
  { path: '/company/support',      icon: 'Message', label: 'Support' },
];

const CompanyLayout = ({ children, title, subtitle }) => {
  const { company, logout } = useCompanyAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/company/login'); };
  const isActive = (p) => location.pathname === p;
  // Check if this company session was obtained via core team switching
  const companyData = (() => {
    try { return JSON.parse(localStorage.getItem('thankeeu_company') || '{}'); } catch { return {}; }
  })();
  const isViaCoreTeam = (() => {
    try {
      const tok = localStorage.getItem('thankeeu_company_token');
      if (!tok) return false;
      const payload = JSON.parse(atob(tok.split('.')[1]));
      return !!payload.via_core_team;
    } catch { return false; }
  })();

  const initials = company?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CO';

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg,#1E1438 0%,#14102E 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(124,110,255,0.12)' }}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,#A855F7,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 14px rgba(124,58,237,0.45)'}}>
          <span style={{fontSize:20}}>💌</span>
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#EC4899,#7C6EFF)', color: '#fff' }}>
            {company?.logo_url
              ? <img src={company.logo_url} alt="logo" className="w-full h-full object-cover rounded-xl" />
              : <span>{initials}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#E4E2F6' }}>{company?.name || 'Company'}</p>
            <p className="text-xs" style={{ color: '#6B678A' }}>HR Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      

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

<nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto sidebar-nav" style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(124,110,255,0.35) transparent' }}>
        {NAV.map(({ path, icon, label }) => (
          <Link key={path} to={path}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              paddingRight: 12,
              borderLeft: `3px solid ${isActive(path) ? '#7C6EFF' : 'transparent'}`,
              paddingLeft: isActive(path) ? 9 : 12,
              background: isActive(path) ? 'rgba(124,110,255,0.15)' : 'transparent',
              color: isActive(path) ? '#B8B4FF' : '#6B678A',
            }}>
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center"><Icon name={icon} size={16} /></span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 flex-shrink-0 space-y-2">
        {(() => {
          const isPilot = company?.subscription_status === 'pilot' &&
            company?.pilot_ends_at && new Date(company.pilot_ends_at) > new Date();
          const pilotDays = isPilot
            ? Math.max(0, Math.ceil((new Date(company.pilot_ends_at) - new Date()) / 86400000))
            : 0;
          return isPilot ? (
            <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
              style={{ background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff' }}>
              🧪 Pilot — {pilotDays}d left
            </div>
          ) : (
            <Link to="/company/subscription"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color: '#fff', boxShadow: '0 2px 10px rgba(92,75,223,0.35)' }}>
              💳 Manage subscription
            </Link>
          );
        })()}
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
            style={{ background: 'rgba(124,110,255,0.1)', color: '#5B4BDF', fontSize: '1.5rem', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#1A1730', fontSize: 14 }}>
            Thank<span style={{ color: '#7C6EFF' }}>eeu</span> Teams
          </span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
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
