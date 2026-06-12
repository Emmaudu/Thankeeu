import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

const NAV = [
  { path: '/pals/dashboard',          icon: 'Dashboard', label: 'Overview' },
  { path: '/pals/dashboard/invite',   icon: 'UserPlus',  label: 'Invite Friends' },
  { path: '/pals/dashboard/members',  icon: 'Users',     label: 'Members' },
  { path: '/pals/dashboard/cards',    icon: 'Cake',      label: 'My Cards' },
  { path: '/pals/dashboard/support',  icon: 'Message',   label: 'Support' },
  { path: '/pals/dashboard/settings', icon: 'Settings',  label: 'Settings' },
];

export default function PalLayout({ children, title, subtitle }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('thankeeu_pal') || 'null');
      if (!s) { nav('/pals/login'); return; }
      setSession(s);
    } catch { nav('/pals/login'); }
  }, []);

  const logout = () => {
    localStorage.removeItem('tk_pal');
    localStorage.removeItem('thankeeu_pal');
    nav('/pals/login');
  };

  const group = session?.group;
  const member = session?.member;

  return (
    <div className="min-h-screen flex" style={{ background: '#F8F7FF', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300
        ${open ? 'w-64' : 'w-16'} md:w-64 bg-white border-r border-purple-100 shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-purple-50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {group?.logo_url
              ? <img src={group.logo_url} className="w-full h-full object-cover" />
              : <Icon name="Users" size={16} className="text-white" />}
          </div>
          <span className={`font-bold text-warm-900 truncate transition-opacity ${open ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            {group?.group_name || 'Pals'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = loc.pathname === item.path || (item.path !== '/pals/dashboard' && loc.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-primary-50 text-primary-700' : 'text-warm-600 hover:bg-purple-50 hover:text-warm-900'}`}>
                <Icon name={item.icon} size={18} className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-warm-400'}`} />
                <span className={`transition-opacity ${open ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 hidden md:block" />}
              </Link>
            );
          })}
        </nav>

        {/* Logged-in member info + logout */}
        <div className="px-2 pb-4 border-t border-purple-50 pt-3">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity ${open ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(member?.name || group?.group_name || 'P').charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-warm-900 truncate">{member?.name || 'Group owner'}</p>
              <p className="text-xs text-warm-400 truncate">@{group?.group_username}</p>
            </div>
          </div>
          <button onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-warm-500 hover:bg-red-50 hover:text-red-500 transition-all mt-1 ${open ? '' : 'justify-center md:justify-start'}`}>
            <Icon name="LogOut" size={16} />
            <span className={`transition-opacity ${open ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${open ? 'ml-64' : 'ml-16 md:ml-64'}`}>
        <header className="bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <button className="md:hidden mr-3 text-warm-500" onClick={() => setOpen(p => !p)}>
              <Icon name="Grid" size={20} />
            </button>
            <h1 className="text-lg font-bold text-warm-900 inline">{title}</h1>
            {subtitle && <p className="text-sm text-warm-400 mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-600 font-semibold">
            {group?.group_size || 15} member cap
          </span>
        </header>

        <div className="flex-1 px-4 md:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
