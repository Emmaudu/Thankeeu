import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../../context/MemberAuthContext';

const MemberLayout = ({ children, title, subtitle }) => {
  const { member, logout } = useMemberAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeader = member?.role === 'team_leader';
  const handleLogout = () => { logout(); navigate('/member/login'); };
  const isActive = p => location.pathname === p;

  const NAV = [
    { path: '/member/dashboard',   icon: '🏠', label: 'Dashboard' },
    { path: '/member/occasions',   icon: '🎉', label: 'Occasions' },
    { path: '/member/cards',       icon: '💌', label: 'My Cards' },
    { path: '/member/received',    icon: '🎁', label: 'Received' },
    { path: '/member/pending',     icon: '✍️', label: 'Pending to Sign' },
    { path: '/member/finances',    icon: '💰', label: 'Financials' },
    { path: '/member/reminders',   icon: '⏰', label: 'Reminders' },
    ...(isLeader ? [
      { path: '/member/approvals',  icon: '✅', label: 'Approvals' },
      { path: '/member/deductions', icon: '💳', label: 'Deductions' },
    ] : []),
    { path: '/member/settings',    icon: '⚙️', label: 'Settings' },
    { path: '/member/support',     icon: '💬', label: 'Support' },
  ];

  const initials = member ? `${member.first_name?.[0]||''}${member.last_name?.[0]||''}`.toUpperCase() : '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background:'linear-gradient(180deg,#1A1438 0%,#120E2A 100%)', minHeight:'100vh' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0" style={{ borderBottom:'1px solid rgba(124,110,255,0.15)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#7C6EFF,#5B4BDF)', boxShadow:'0 0 14px rgba(92,75,223,0.5)' }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:14, fontFamily:'Space Grotesk,sans-serif' }}>T</span>
        </div>
        <div>
          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:16, color:'#E4E2F6' }}>
            Thank<span style={{ color:'#7C6EFF' }}>eeu</span>
          </span>
          <span className="block text-xs" style={{ color:'#6B678A', marginTop:-2 }}>for Teams</span>
        </div>
      </div>

      {/* Member chip */}
      <div className="px-3 py-3 flex-shrink-0">
        <Link to="/member/settings" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
          {member?.profile_picture_url
            ? <img src={member.profile_picture_url} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#7C6EFF,#EC4899)', color:'#fff' }}>{initials}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color:'#E4E2F6' }}>{member?.first_name} {member?.last_name}</p>
            <p className="text-xs truncate" style={{ color:'#6B678A' }}>
              {isLeader ? '👑 Team Leader' : '👤 Team Member'}{member?.department ? ` · ${member.department}` : ''}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto" style={{ scrollbarWidth:'none' }}>
        <div className="space-y-0.5 pb-4">
          {NAV.map(({ path, icon, label }) => (
            <Link key={path} to={path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                paddingLeft: isActive(path) ? 9 : 13, paddingRight: 12,
                borderLeft: `3px solid ${isActive(path) ? '#7C6EFF' : 'transparent'}`,
                background: isActive(path) ? 'rgba(124,110,255,0.16)' : 'transparent',
                color: isActive(path) ? '#B8B4FF' : '#7A7898',
              }}>
              <span className="text-lg flex-shrink-0">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Company tag + Sign out */}
      <div className="px-3 pb-5 pt-2 flex-shrink-0" style={{ borderTop:'1px solid rgba(124,110,255,0.1)' }}>
        {member?.company?.name && (
          <div className="px-3 py-2 mb-3 rounded-xl text-xs" style={{ background:'rgba(255,255,255,0.04)', color:'#4A4870' }}>
            🏢 {member.company.name}
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color:'#7A7898', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}>
          🚪 <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex" style={{ minHeight:'100vh', background:'#0F0D24' }}>
      {/* Desktop sidebar — LEFT */}
      <div className="hidden md:block flex-shrink-0" style={{ width:240 }}>
        <div className="fixed top-0 left-0 h-screen overflow-hidden" style={{ width:240 }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar — RIGHT side */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div style={{ width:260 }}><SidebarContent /></div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0" style={{ background:'#F5F3FF', borderRadius:'20px 0 0 0', minHeight:'100vh' }}>
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 sticky top-0 z-30"
          style={{ background:'#F5F3FF', borderBottom:'1px solid #EDE9FF' }}>
          <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, color:'#1A1730', fontSize:16 }}>
            Thank<span style={{ color:'#7C6EFF' }}>eeu</span>
          </div>
          {/* Hamburger on RIGHT for mobile */}
          <button onClick={() => setMobileOpen(true)}
            className="p-2.5 rounded-xl"
            style={{ background:'rgba(124,110,255,0.1)', color:'#5B4BDF', fontSize:18 }}>
            ☰
          </button>
        </div>

        {/* Page */}
        <div className="px-5 md:px-8 py-6 md:py-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'1.6rem', color:'#1A1730', lineHeight:1.2 }}>{title}</h1>}
              {subtitle && <p className="text-base mt-1" style={{ color:'#7A7898' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default MemberLayout;
