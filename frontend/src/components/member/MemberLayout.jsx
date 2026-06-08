import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../../context/MemberAuthContext';
import NotificationBell from '../NotificationBell';
import { memberAPI } from '../../utils/api';

const memberNotifFetch = () => memberAPI.getMe ? import('../../utils/api').then(m => m.memberAxios.get('/notifications')) : Promise.resolve({ data: [] });

const MIN_W = 180;
const MAX_W = 320;
const DEF_W = 220;

const MemberLayout = ({ children, title, subtitle }) => {
  const { member, logout } = useMemberAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarW, setSidebarW] = useState(() => {
    const saved = parseInt(localStorage.getItem('tk_sidebar_w'), 10);
    return (saved >= MIN_W && saved <= MAX_W) ? saved : DEF_W;
  });
  const dragging = useRef(false);
  const startX  = useRef(0);
  const startW  = useRef(DEF_W);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    startX.current   = e.clientX;
    startW.current   = sidebarW;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarW]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      const newW = Math.min(MAX_W, Math.max(MIN_W, startW.current + delta));
      setSidebarW(newW);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('tk_sidebar_w', sidebarW);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [sidebarW]);

  const isLeader = member?.role === 'team_leader';
  const handleLogout = () => { logout(); navigate('/member/login'); };
  const isActive = (p) => location.pathname === p;

  const NAV = [
    { path: '/member/dashboard',   icon: '🏠', label: 'Dashboard' },
    { path: '/member/occasions',   icon: '🎉', label: 'Occasions' },
    ...(isLeader ? [
      { path: '/member/approvals',  icon: '✅', label: 'Approvals' },
      { path: '/member/deductions', icon: '💰', label: 'Deductions' },
    ] : []),
    { path: '/member/settings',    icon: '⚙️', label: 'Settings' },
    { path: '/member/support',     icon: '💬', label: 'Support' },
  ];

  const initials = member ? `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() : '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg,#1A1438 0%,#120E2A 100%)' }}>
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

      {/* Member chip */}
      <div className="px-3 py-3 flex-shrink-0">
        <Link to="/member/settings" className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-all">
          {member?.profile_picture_url
            ? <img src={member.profile_picture_url} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" />
            : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#7C6EFF,#EC4899)', color: '#fff' }}>{initials}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#E4E2F6' }}>{member?.first_name} {member?.last_name}</p>
            <p className="text-xs truncate" style={{ color: '#6B678A' }}>
              {isLeader ? '👑 Leader' : '👤 Member'}{member?.username ? ` · @${member.username}` : ''}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon, label }) => (
          <Link key={path} to={path}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              paddingLeft: isActive(path) ? 9 : 12, paddingRight: 12,
              borderLeft: `3px solid ${isActive(path) ? '#7C6EFF' : 'transparent'}`,
              background: isActive(path) ? 'rgba(124,110,255,0.15)' : 'transparent',
              color: isActive(path) ? '#B8B4FF' : '#6B678A',
            }}>
            <span className="text-base flex-shrink-0">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Company tag */}
      {member?.company?.name && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: '#4A4870' }}>
            🏢 {member.company.name}
          </div>
        </div>
      )}

      <div className="px-3 pb-5 flex-shrink-0">
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
      {/* Desktop sidebar — draggable resize */}
      <div className="hidden md:block flex-shrink-0 relative" style={{ width: sidebarW }}>
        <div className="fixed top-0 left-0 h-screen overflow-hidden" style={{ width: sidebarW }}>
          <SidebarContent />
        </div>
        {/* Drag handle */}
        <div onMouseDown={onMouseDown} title="Drag to resize"
          className="absolute top-0 right-0 w-2 h-full z-10 cursor-col-resize group"
          style={{ background: 'transparent' }}>
          <div className="w-0.5 h-full mx-auto opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(124,110,255,0.5)' }} />
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
        <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: '#F5F3FF', borderBottom: '1px solid #EDE9FF' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl"
            style={{ background: 'rgba(124,110,255,0.1)', color: '#5B4BDF' }}>☰</button>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: '#1A1730', fontSize: 14 }}>
            Thank<span style={{ color: '#7C6EFF' }}>eeu</span> Teams
          </span>
          <div className="flex items-center gap-1">
            <NotificationBell
              fetchFn={() => import('../../utils/api').then(m => m.memberAxios.get('/notifications'))}
              markReadFn={() => import('../../utils/api').then(m => m.memberAxios.post('/notifications/mark-read'))}
            />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#7C6EFF,#EC4899)', color: '#fff' }}>{initials}</div>
          </div>
        </div>

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

export default MemberLayout;
