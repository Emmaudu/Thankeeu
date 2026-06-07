import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../../context/MemberAuthContext';

const MemberLayout = ({ children, title, subtitle }) => {
  const { member, logout } = useMemberAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeader = member?.role === 'team_leader';

  const NAV = [
    { path: '/member/dashboard',  icon: '📊', label: 'Dashboard' },
    { path: '/member/occasions',  icon: '🎉', label: 'Occasions' },
    ...(isLeader ? [
      { path: '/member/approvals',  icon: '✅', label: 'Approvals' },
      { path: '/member/deductions', icon: '💰', label: 'Deductions' },
    ] : []),
    { path: '/member/settings',   icon: '⚙️', label: 'Settings' },
    { path: '/member/support',    icon: '💬', label: 'Support' },
  ];

  const handleLogout = () => { logout(); navigate('/member/login'); };
  const isActive = (p) => location.pathname === p;

  const roleBadge = isLeader
    ? 'bg-amber-100 text-amber-700'
    : 'bg-primary-100 text-primary-600';

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen sticky top-0">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <span className="font-display font-semibold text-gray-900 text-sm block">Thankeeu</span>
              <span className="text-xs text-primary-400 font-medium -mt-0.5 block">for Teams</span>
            </div>
          </Link>
        </div>

        {/* Member info */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            {member?.profile_picture_url
              ? <img src={member.profile_picture_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                  {member?.first_name?.[0]}{member?.last_name?.[0]}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{member?.first_name} {member?.last_name}</p>
              <p className="text-xs text-gray-400 truncate">{member?.department}</p>
            </div>
          </div>
          <span className={`mt-2 inline-block text-xs px-2.5 py-1 rounded-full font-medium ${roleBadge}`}>
            {isLeader ? '👑 Team Leader' : '👤 Team Member'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(n.path) ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-400 truncate">{member?.company?.name}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors">
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <Link to="/member/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">{member?.company?.name}</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-xl">
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-14 bottom-0 w-64 bg-white p-4 space-y-1 overflow-y-auto" onClick={e => e.stopPropagation()}>
            {NAV.map(n => (
              <Link key={n.path} to={n.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(n.path) ? 'bg-primary-50 text-primary-600' : 'text-gray-600'}`}>
                <span>{n.icon}</span>{n.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 w-full mt-2">
              <span>🚪</span> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 min-w-0">
        {title && (
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default MemberLayout;
