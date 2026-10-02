import { cpath, marketFromPath, prefixOf } from '../../utils/market';
import COUNTRY_INDEX from '../../content/countries/index';
import CountrySwitcher from './CountrySwitcher';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard, ClipboardList, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatApi, settingsApi } from '../../utils/api';
import { clsx } from 'clsx';

const SETTINGS_CACHE_KEY = 'taskeeu_public_settings';

export default function Navbar({ dashboard = false, teamsMode = false }) {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false); // login/signup dropdown
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  // Default true so the link doesn't flash away while settings load, and
  // stays visible if the settings fetch fails (fail open).
  const [showBrowseTaskers, setShowBrowseTaskers] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(SETTINGS_CACHE_KEY) || '{}');
      return cached.nav_show_browse_taskers !== false;
    } catch { return true; }
  });
  const DEFAULT_BANNER = 'Refer & Earn: get 10% commission when people you invite complete tasks.';
  const [referBanner, setReferBanner] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(SETTINGS_CACHE_KEY) || '{}');
      return {
        enabled: cached.refer_banner_enabled !== false,
        text: cached.refer_banner_text || DEFAULT_BANNER,
      };
    } catch { return { enabled: true, text: DEFAULT_BANNER }; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const authMenuRef = useRef(null);
  const navRef = useRef(null);
  const bannerRef = useRef(null);
  const [navHeight, setNavHeight] = useState(64);
  // Only the bar and the refer banner count; an open mobile menu overlays the page.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return undefined;
    const measure = () => setNavHeight(64 + Math.round(bannerRef.current?.getBoundingClientRect().height || 0));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    settingsApi.getPublic()
      .then(({ data }) => {
        if (data?.settings) {
          setShowBrowseTaskers(data.settings.nav_show_browse_taskers !== false);
          setReferBanner({
            enabled: data.settings.refer_banner_enabled !== false,
            text: data.settings.refer_banner_text || DEFAULT_BANNER,
          });
          try { sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data.settings)); } catch {}
        }
      })
      .catch(() => {}); // fail open — keep whatever was cached/default
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadNotifications();
    const interval = isAuthenticated ? setInterval(loadNotifications, 30000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (authMenuRef.current && !authMenuRef.current.contains(e.target)) setAuthMenuOpen(false);
      if (servicesRef.current && !servicesRef.current.contains(e.target)) setServicesOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await chatApi.getNotifications();
      setNotifications(data.notifications || []);
      setUnread((data.notifications || []).filter(n => !n.is_read).length);
    } catch {}
  };

  const markAllRead = async () => {
    await chatApi.markNotificationsRead([]);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  // The site being viewed (/uk/... → UK). Dashboards always open on the
  // site of the account's own country.
  const market = marketFromPath(location.pathname);
  const intl = !!market.slug;
  const getDashboardPath = () => {
    if (!user) return cpath('/auth');
    if (isAdmin) return '/admin';
    const home = prefixOf(user.market || 'NG');
    if (user.role === 'tasker') return `${home}/tasker`;
    return `${home}/requester`;
  };

  const isActive = path => location.pathname === path;
  const onHero = !scrolled && !dashboard;

  const navLinks = intl ? [
    { to: cpath('/tasks'), label: 'Browse Tasks' },
    { to: cpath('/remote'), label: 'Remote Tasks' },
    { to: cpath('/post-task'), label: 'Post a Task' },
    { to: cpath('/tasker/signup'), label: 'Become a Tasker' },
  ] : (teamsMode ? [
    { to: '/teams', label: 'Home' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/how-it-works', label: 'How It Works' },
  ] : [
    { to: '/tasks', label: 'Browse Tasks' },
    { to: '/taskers', label: 'Browse Taskers' },
    { to: '/vooom', label: 'Vooom' },
    { to: '/post-task', label: 'Post a Task' },
    { to: '/teams', label: 'For Teams' },
    { to: '/blog', label: 'Blog' },
    { to: '/pricing', label: 'Pricing' },
  ]).filter(link => showBrowseTaskers || link.to !== '/taskers');

  const serviceLinks = intl ? (COUNTRY_INDEX[market.slug]?.services || []).map((sv) => ({ to: cpath(`/services/${sv.slug}`), label: sv.name })) : [
    { to: '/delivery', label: 'Delivery' },
    { to: '/errands', label: 'Errands' },
    { to: '/property-inspection', label: 'Property Inspection' },
    { to: '/field-engineers', label: 'Field Engineers' },
    { to: '/installations', label: 'Installations' },
    { to: '/office-support', label: 'Office Support' },
    { to: '/document-pickup', label: 'Document Pickup' },
    { to: '/asset-verification', label: 'Asset Verification' },
    { to: '/merchandising', label: 'Merchandising' },
    { to: '/business-support', label: 'Business Support' },
  ];

  const menuItemStyle = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
    color: 'var(--text)', transition: 'background 0.12s', width: '100%',
    border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
  };

  return (
    <>
    <nav ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{
        background: scrolled || dashboard ? 'rgba(255,255,255,0.97)' : '#12091a',
        backdropFilter: scrolled || dashboard ? 'blur(16px)' : 'none',
        borderBottom: scrolled || dashboard ? '1px solid #ede4f5' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: scrolled || dashboard ? '0 2px 20px rgba(18,9,26,0.07)' : 'none',
      }}
    >
      {!dashboard && !intl && referBanner.enabled && (
        <Link ref={bannerRef} to="/refer-and-earn" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '7px 16px', textDecoration: 'none', textAlign: 'center',
            background: '#ff2d62', color: 'white',
            fontSize: 13, fontWeight: 700, flexWrap: 'wrap', lineHeight: 1.4,
          }}>
          <span>{referBanner.text}</span>
          <span style={{ textDecoration: 'underline' }}>Learn how&nbsp;→</span>
        </Link>
      )}
      <div className="container-xl">
        <div className="flex items-center justify-between" style={{ height: 64 }}>

          {/* Logo */}
          <Link to={cpath("/")} className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.svg" alt="Taskeeu" className="w-9 h-9 rounded-xl" />
            <span className="font-black text-xl" style={{ color: onHero ? 'white' : 'var(--text)', letterSpacing: '-0.03em' }}>
              Taskeeu
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150" style={{
                  color: isActive(link.to) ? 'var(--rose)' : onHero ? 'rgba(255,255,255,0.82)' : 'var(--text-2)',
                  background: isActive(link.to) && !onHero ? 'var(--rose-light)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive(link.to)) e.currentTarget.style.color = onHero ? 'white' : 'var(--rose)'; }}
                onMouseLeave={e => { if (!isActive(link.to)) e.currentTarget.style.color = isActive(link.to) ? 'var(--rose)' : onHero ? 'rgba(255,255,255,0.82)' : 'var(--text-2)'; }}
              >
                {link.label}
              </Link>
            ))}
            {/* Services mega-dropdown */}
            {!teamsMode && (
              <div ref={servicesRef} className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center gap-1" style={{ color: servicesOpen ? 'var(--rose)' : onHero ? 'rgba(255,255,255,0.82)' : 'var(--text-2)', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.color = onHero ? 'white' : 'var(--rose)'}
                  onMouseLeave={e => { if (!servicesOpen) e.currentTarget.style.color = onHero ? 'rgba(255,255,255,0.82)' : 'var(--text-2)'; }}
                >
                  Services <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {servicesOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 16, minWidth: 520, zIndex: 200 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {serviceLinks.map(({ to, label }) => (
                        <Link key={to} to={to} onClick={() => setServicesOpen(false)}
                          style={{ display: 'block', padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fff5f7'; e.currentTarget.style.color = '#F43F6C'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; }}>
                          {label}
                        </Link>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                      <Link to={cpath("/post-task")} onClick={() => setServicesOpen(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F43F6C', color: 'white', borderRadius: 10, padding: '8px 20px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                        Post Your Task
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {!teamsMode && <CountrySwitcher dark={onHero} />}
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2.5 rounded-xl transition-colors" style={{ color: onHero ? 'rgba(255,255,255,0.8)' : 'var(--muted)', background: notifOpen ? (onHero ? 'rgba(255,255,255,0.1)' : 'var(--rose-light)') : 'transparent' }}>
                    <Bell size={19} />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center font-bold" style={{ background: 'var(--rose)', fontSize: 10 }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(18,9,26,0.15)', zIndex: 50 }}>
                      <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Notifications</p>
                        {unread > 0 && <button onClick={markAllRead} className="text-xs font-semibold" style={{ color: 'var(--rose)' }}>Mark all read</button>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell size={28} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>All caught up</p>
                          </div>
                        ) : notifications.slice(0, 10).map(n => (
                          <div key={n.id} className="px-4 py-3.5 border-b cursor-pointer" style={{ borderColor: 'var(--border-light)', background: !n.is_read ? 'rgba(255,45,98,0.03)' : 'transparent' }}
                            onClick={() => { if (n.action_url) navigate(n.action_url); setNotifOpen(false); }}>
                            {!n.is_read && <span className="inline-block w-2 h-2 rounded-full mb-1" style={{ background: 'var(--rose)' }} />}
                            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{n.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div ref={userMenuRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-xl p-1.5 transition-colors" style={{ background: userMenuOpen ? 'rgba(255,45,98,0.08)' : 'transparent' }}>
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--rose)' }}>
                      {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : user?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold hidden lg:block" style={{ color: onHero ? 'rgba(255,255,255,0.9)' : 'var(--text)' }}>
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={13} style={{ color: onHero ? 'rgba(255,255,255,0.6)' : 'var(--muted)' }} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(18,9,26,0.15)', zIndex: 50 }}>
                      <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                        <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{user?.full_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{user?.email}</p>
                        <span className="badge badge-rose mt-1.5 capitalize">{user?.role}</span>
                      </div>
                      <div className="p-1.5">
                        <Link to={getDashboardPath()} onClick={() => setUserMenuOpen(false)}
                          style={{ ...menuItemStyle }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <LayoutDashboard size={15} style={{ color: 'var(--rose)' }} /> Dashboard
                        </Link>
                        <hr style={{ borderColor: 'var(--border-light)', margin: '4px 0' }} />
                        <button onClick={logout}
                          style={{ ...menuItemStyle, color: '#dc2626' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Unauthenticated: Login dropdown + Get Started ── */
              <div className="flex items-center gap-2">
                {/* Login dropdown with Tasker / Requester options */}
                <div ref={authMenuRef} className="relative">
                  <button onClick={() => setAuthMenuOpen(!authMenuOpen)}
                    className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all" style={{
                      color: onHero ? 'rgba(255,255,255,0.85)' : 'var(--text-2)',
                      background: authMenuOpen ? (onHero ? 'rgba(255,255,255,0.1)' : 'var(--rose-light)') : 'transparent',
                    }}>
                    Log In <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: authMenuOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  {authMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(18,9,26,0.15)', zIndex: 50, minWidth: 220 }}>
                      <div className="px-4 pt-3 pb-2">
                        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sign in as</p>
                      </div>
                      <div className="p-1.5 space-y-1">
                        <Link to={cpath("/requester/login")} onClick={() => setAuthMenuOpen(false)}
                          style={{ ...menuItemStyle, background: 'var(--rose-light)' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ffd6e2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--rose-light)'}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ClipboardList size={15} style={{ color: 'white' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Requester</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Post tasks & hire</p>
                          </div>
                        </Link>
                        <Link to={cpath("/tasker/login")} onClick={() => setAuthMenuOpen(false)}
                          style={{ ...menuItemStyle }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#12091a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={15} style={{ color: 'white' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Tasker</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Complete tasks & earn</p>
                          </div>
                        </Link>
                      </div>
                      <div className="px-3 pb-3 pt-1">
                        <hr style={{ borderColor: 'var(--border-light)', marginBottom: 10 }} />
                        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                          No account?{' '}
                          <Link to={cpath('/auth')} onClick={() => setAuthMenuOpen(false)} style={{ color: 'var(--rose)', fontWeight: 700 }}>Sign up free</Link>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <Link to={cpath("/post-task")} className="btn-primary btn-sm">
                  Post a Task
                </Link>
              </div>
            )}
          </div>

          {/* Country (mobile) + hamburger */}
          {!teamsMode && <div className="md:hidden ml-auto mr-1"><CountrySwitcher dark={onHero} compact /></div>}
          <button className="md:hidden p-2.5 rounded-xl" style={{ color: onHero ? 'white' : 'var(--text)' }}
            onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t" style={{ background: 'white', borderColor: 'var(--border-light)' }}>
          <div className="container-xl py-4 space-y-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="block px-4 py-3 rounded-xl text-sm font-semibold" style={{ color: isActive(link.to) ? 'var(--rose)' : 'var(--text-2)' }}
                onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {/* Services section in mobile menu */}
            {!teamsMode && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 8, marginTop: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', padding: '8px 16px 4px' }}>Services</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: '0 8px' }}>
                  {serviceLinks.map(({ to, label }) => (
                    <Link key={to} to={to} onClick={() => setOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-semibold" style={{ color: isActive(to) ? 'var(--rose)' : 'var(--text-2)', fontSize: 13 }}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--border-light)' }}>
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardPath()}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-2)' }} onClick={() => setOpen(false)}>
                    <LayoutDashboard size={16} style={{ color: 'var(--rose)' }} /> My Dashboard
                  </Link>
                  <button onClick={() => { logout(); setOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full" style={{ color: '#dc2626' }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <p className="px-4 pt-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Sign In as</p>
                  <Link to={cpath("/requester/login")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold" style={{ color: 'var(--rose)', background: 'var(--rose-light)' }}
                    onClick={() => setOpen(false)}>
                    <ClipboardList size={16} /> Requester Login
                  </Link>
                  <Link to={cpath("/tasker/login")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold" style={{ color: 'var(--text-2)' }}
                    onClick={() => setOpen(false)}>
                    <Briefcase size={16} /> Tasker Login
                  </Link>
                  <Link to={cpath('/auth')} className="block btn-primary btn-sm text-center" onClick={() => setOpen(false)}>
                    Create Free Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    {/* Pages are laid out for a 64px bar. When the bar is taller (the refer
        banner wraps on phones) this spacer pushes the page down so no text
        ever sits under the navigation. */}
    <div aria-hidden="true" data-testid="nav-spacer" style={{ height: Math.max(0, navHeight - 64) }} />
    </>
  );
}
