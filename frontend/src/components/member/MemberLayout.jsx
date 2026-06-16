import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useMemberAuth } from '../../context/MemberAuthContext';
import { useCompanyAuth } from '../../context/CompanyAuthContext';

const MemberLayout = ({ children, title, subtitle }) => {
  const { member, logout } = useMemberAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeader = member?.role === 'team_leader';
  const handleLogout = () => { logout(); navigate('/member/login'); };
  const isActive = p => location.pathname === p;

  const NAV = [
    { path: '/member/dashboard',   icon: 'Home', label: 'Dashboard' },
    { path: '/member/occasions',   icon: 'Cake', label: 'Occasions' },
    { path: '/member/cards',       icon: 'Heart', label: 'My Cards' },
    { path: '/member/received',    icon: 'Gift', label: 'Received' },
    { path: '/member/pending',     icon: 'Edit', label: 'Pending to Sign' },
    { path: '/member/gift-cards',  icon: 'Gift',   label: 'Gift Cards' },
    { path: '/member/finances',    icon: 'Wallet', label: 'Financials' },
    { path: '/member/reminders',   icon: 'Clock', label: 'Reminders' },
    ...(isLeader ? [
      { path: '/member/approvals',  icon: 'Check', label: 'Approvals' },
      { path: '/member/deductions', icon: 'Card', label: 'Deductions' },
    ] : []),
    { path: '/member/settings',    icon: 'Settings', label: 'Settings' },
    { path: '/member/support',     icon: 'Message', label: 'Support' },
  ];

  const initials = member ? `${member.first_name?.[0]||''}${member.last_name?.[0]||''}`.toUpperCase() : '?';

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background:'linear-gradient(180deg,#1A1438 0%,#120E2A 100%)', minHeight:'100vh' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0" style={{ borderBottom:'1px solid rgba(124,110,255,0.15)' }}>
        <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,#A855F7,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 14px rgba(124,58,237,0.45)'}}>
          <span style={{fontSize:20}}>💌</span>
        </div>
        <div>
          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:17, color:'#E4E2F6' }}>
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


      {/* Sign Out — top of sidebar for easy access */}
      <div className="px-3 pb-2 flex-shrink-0">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all"
          style={{ fontSize:15, color:'#FF8A80', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
          <span style={{fontSize:18}}>🚪</span>
          <span>Sign out</span>
        </button>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto sidebar-nav" style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(124,110,255,0.35) transparent' }}>
        <div className="space-y-0.5 pb-4">
          {NAV.map(({ path, icon, label }) => (
            <Link key={path} to={path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 rounded-xl text-base font-semibold transition-all"
              style={{
                paddingLeft: isActive(path) ? 9 : 13, paddingRight: 12,
                borderLeft: `3px solid ${isActive(path) ? '#7C6EFF' : 'transparent'}`,
                background: isActive(path) ? 'rgba(124,110,255,0.16)' : 'transparent',
                color: isActive(path) ? '#B8B4FF' : '#7A7898',
              }}>
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center"><Icon name={icon} size={16} /></span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Company tag + Sign out */}
      <div className="px-3 pb-5 pt-2 flex-shrink-0" style={{ borderTop:'1px solid rgba(124,110,255,0.1)' }}>
        {/* Core team: switch to HR dashboard (core team only, not regular leaders) */}
        {member?.is_core_team && (
          <div className="px-3 mb-2">
            <button
              onClick={async () => {
                try {
                  const base = import.meta.env.VITE_API_URL || '/api';
                  const tok  = localStorage.getItem('thankeeu_member_token');
                  const r    = await fetch(`${base}/core-team/get-company-access`, {
                    method:  'POST',
                    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
                  });
                  const d = await r.json();
                  if (!r.ok) { import('react-hot-toast').then(m => m.default.error(d.error || 'Access denied')); return; }
                  // Store the temporary company token so CompanyProtectedRoute passes
                  localStorage.setItem('thankeeu_company_token', d.token);
                  localStorage.setItem('thankeeu_company',       JSON.stringify(d.company));
                  window.location.href = '/company/dashboard';
                } catch {
                  import('react-hot-toast').then(m => m.default.error('Could not switch to HR view'));
                }
              }}
              className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              style={{ background:'rgba(124,110,255,0.12)', color:'#9D95FF', border:'1.5px solid rgba(124,110,255,0.25)' }}>
              <span className="text-base">🏢</span>
              <span>Switch to HR View</span>
            </button>
          </div>
        )}
        {member?.company?.name && (
          <div className="px-3 py-2 rounded-xl text-sm" style={{ background:'rgba(255,255,255,0.04)', color:'#6B678A' }}>
            🏢 {member.company.name}
          </div>
        )}
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
        <div className="fixed inset-0 z-50 md:hidden" style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(2px)' }}
          onClick={() => setMobileOpen(false)} />
      )}
      <div className="fixed top-0 left-0 h-full z-50 md:hidden" style={{
        width:265, transform:mobileOpen?'translateX(0)':'translateX(-100%)',
        transition:'transform .28s cubic-bezier(.4,0,.2,1)',
        boxShadow:mobileOpen?'6px 0 40px rgba(0,0,0,0.45)':'none',
      }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0" style={{ background:'#F5F3FF', borderRadius:'20px 0 0 0', minHeight:'100vh' }}>
        {/* Mobile topbar */}
             <div className="md:hidden flex items-center justify-between sticky top-0 z-30"
          style={{ background:'rgba(15,13,36,0.98)', backdropFilter:'blur(8px)', borderBottom:'1px solid rgba(124,110,255,0.15)', height:56, padding:'0 16px' }}>
          <button onClick={() => setMobileOpen(true)}
            style={{ width:44, height:44, borderRadius:12, border:'none', background:'linear-gradient(135deg,#7C6EFF,#5B4BDF)', color:'#fff', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            ☰
          </button>
          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:15, color:'#E4E2F6' }}>
            Thank<span style={{ color:'#7C6EFF' }}>eeu</span>
          </span>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#7C6EFF,#EC4899)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>
            {initials}
          </div>
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
