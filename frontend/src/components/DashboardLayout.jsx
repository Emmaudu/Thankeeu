import { notificationsAPI } from '../utils/api';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Icon from './ui/Icon';

const NAV = [
  { to: '/dashboard',            icon: 'Home',     label: 'Home' },
  { to: '/dashboard/cards',      icon: 'Heart',    label: 'My Cards' },
  { to: '/dashboard/credits',    icon: 'CreditCard', label: 'Credits & Plans' },
  { to: '/dashboard/delivered',  icon: 'Send',     label: 'Delivered' },
  { to: '/dashboard/received',   icon: 'Gift',     label: 'Received' },
  { to: '/dashboard/pending',    icon: 'Edit',     label: 'Pending to Sign' },
  { to: '/dashboard/gift-cards', icon: 'Gift',     label: 'Gift Cards' },
  { to: '/dashboard/finances',   icon: 'Wallet',   label: 'Financials' },
  { to: '/dashboard/reminders',  icon: 'Bell',     label: 'Reminders' },
  { to: '/dashboard/settings',   icon: 'Settings', label: 'Settings' },
];

const SIDEBAR_W = 240;

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (to) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';

  const SidebarContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg,#1E1438 0%,#13102C 100%)',
      borderRight: '1px solid rgba(139,92,246,0.12)',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid rgba(139,92,246,0.1)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <img src="/android-chrome-192x192.png" alt="Thankeeu" style={{ width:38, height:38, borderRadius:10, flexShrink:0, objectFit:'cover' }} />
        <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16, color:'#E4E2F6', letterSpacing:'-0.01em' }}>
          Thank<span style={{ color:'#A78BFA' }}>eeu</span>
        </span>
      </div>

      {/* User chip */}
      <div style={{ padding:'0.75rem 0.75rem 0.5rem' }}>
        <Link to="/dashboard/settings" onClick={() => setOpen(false)} style={{
          display:'flex', alignItems:'center', gap:'0.625rem',
          padding:'0.625rem 0.75rem', borderRadius:14,
          textDecoration:'none', transition:'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <div style={{
            width:36, height:36, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#7C3AED,#EC4899)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'0.8rem', fontWeight:800, color:'#fff', overflow:'hidden',
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
              : initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.875rem', color:'#E4E2F6', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.full_name}
            </p>
            <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.75rem', color:'#6B5FA8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              @{user?.username || 'account'}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'0.25rem 0.75rem', overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(139,92,246,0.3) transparent' }}>
        {NAV.map(({ to, icon, label }) => {
          const active = isActive(to);
          return (
            <Link key={to} to={to} onClick={() => setOpen(false)} style={{
              display:'flex', alignItems:'center', gap:'0.625rem',
              padding:'0.6rem 0.75rem', borderRadius:12, marginBottom:2,
              textDecoration:'none', transition:'all 0.15s',
              background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: active ? '#C4B5FD' : '#6B5FA8',
              borderLeft: active ? '3px solid #7C3AED' : '3px solid transparent',
              paddingLeft: active ? 'calc(0.75rem - 3px)' : '0.75rem',
              fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight: active ? 700 : 600, fontSize:'0.875rem',
            }}
              onMouseEnter={e => { if(!active) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#A78BFA'; }}}
              onMouseLeave={e => { if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6B5FA8'; }}}>
              <Icon name={icon} size={16} style={{ flexShrink:0 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Create card CTA */}
      <div style={{ padding:'0.5rem 0.75rem' }}>
        <Link to="/create-card" onClick={() => setOpen(false)} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem',
          padding:'0.7rem', borderRadius:14, textDecoration:'none',
          background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff',
          fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.875rem',
          boxShadow:'0 4px 16px rgba(124,58,237,0.35)', transition:'filter 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter='brightness(1)'}>
          <Icon name="Plus" size={15} /> New card
        </Link>
      </div>

      {/* Sign out */}
      <div style={{ padding:'0.5rem 0.75rem 1rem' }}>
        <button onClick={handleLogout} style={{
          display:'flex', alignItems:'center', gap:'0.625rem',
          width:'100%', padding:'0.6rem 0.75rem', borderRadius:12, border:'none',
          background:'rgba(239,68,68,0.07)', cursor:'pointer', transition:'background 0.15s',
          color:'#F87171', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.875rem',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.07)'}>
          <Icon name="LogOut" size={15} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0F0D24' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0" style={{ width: SIDEBAR_W }}>
        <div style={{ position:'fixed', top:0, left:0, height:'100vh', width: SIDEBAR_W }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(3px)' }}
          onClick={() => setOpen(false)} />
      )}
      <div className="fixed top-0 left-0 h-full z-50 md:hidden" style={{
        width: SIDEBAR_W, transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .26s cubic-bezier(.4,0,.2,1)',
        boxShadow: open ? '8px 0 48px rgba(0,0,0,0.5)' : 'none',
      }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, background:'#F7F5FF', borderRadius:'24px 0 0 0', minHeight:'100vh' }}>

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between sticky top-0 z-30" style={{
          background:'rgba(247,245,255,0.97)', backdropFilter:'blur(10px)',
          borderBottom:'1.5px solid #EDE9FE', height:60, padding:'0 1rem',
        }}>
          <button onClick={() => setOpen(true)} style={{
            width:40, height:40, borderRadius:12, border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon name="Menu" size={18} />
          </button>
          <Link to="/" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, color:'#1A1035', fontSize:15, textDecoration:'none' }}>
            Thank<span style={{ color:'#7C3AED' }}>eeu</span>
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <NotificationBell fetchFn={() => notificationsAPI.getAll()} markReadFn={() => notificationsAPI.markAllRead()} />
            <Link to="/create-card" style={{
              background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff',
              fontSize:12, fontWeight:800, padding:'7px 13px', borderRadius:10,
              textDecoration:'none', whiteSpace:'nowrap', fontFamily:'Plus Jakarta Sans,sans-serif',
            }}>
              + Card
            </Link>
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding:'2rem 1.25rem', maxWidth:1080, margin:'0 auto' }} className="md:px-8 md:py-8">
          {(title || subtitle) && (
            <div style={{ marginBottom:'1.75rem' }}>
              {title    && <h1 className="dash-main-title">{title}</h1>}
              {subtitle && <p className="dash-main-sub">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
