import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import Icon from './ui/Icon';

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

const Navbar = ({ onBookDemo }) => {
  const { user, logout }              = useAuth();
  const { company, logout: coLogout } = useCompanyAuth();
  const { member, logout: memLogout } = useMemberAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [teamsOpen, setTeamsOpen]       = useState(false);
  const teamsRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { setOpen(false); setDropdownOpen(false); setTeamsOpen(false); }, [location.pathname]);

  // Close teams dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (teamsRef.current && !teamsRef.current.contains(e.target)) setTeamsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    if (open) document.body.classList.add('no-scroll');
    else       document.body.classList.remove('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  const handleLogout        = () => { logout();    navigate('/'); };
  const handleCompanyLogout = () => { coLogout();  navigate('/'); };
  const handleMemberLogout  = () => { memLogout(); navigate('/member/login'); };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-purple-50/95 backdrop-blur-md shadow-sm border-b border-purple-200'
          : 'bg-purple-50 border-b border-purple-100'
      }`}>
        <div className="section-container">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link to="/" onClick={scrollTop} className="flex items-center gap-2.5 flex-shrink-0 group">
              <img src="/android-chrome-192x192.png" alt="Thankeeu"
                className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
              <span style={{ fontFamily:"'Nunito',sans-serif", fontWeight:900, fontSize:"1.25rem", color:"#1A1035", letterSpacing:"-0.01em" }}>
                thank<span style={{ color:"#7C3AED" }}>eeu</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {[
                { to: '/pricing',       label: 'Pricing',       icon: 'Sparkles' },
                { to: '/how-it-works', label: 'How it works', icon: 'Lightbulb' },
                { to: '/sample',       label: 'Sample',        icon: 'Cake' },
                { to: '/blog',         label: 'Blog',          icon: 'File' },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to} onClick={scrollTop}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                    isActive(to)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-warm-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}>
                  {label}
                </Link>
              ))}

              {/* Teams dropdown */}
              <div className="relative" ref={teamsRef}>
                <button
                  onClick={() => setTeamsOpen(!teamsOpen)}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                    teamsOpen ? 'bg-primary-50 text-primary-600' : 'text-warm-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}>
                  Teams
                  <Icon name={teamsOpen ? 'ChevronUp' : 'ChevronDown'} size={13} className="opacity-60" style={{ marginLeft: 2 }} />
                </button>
                {teamsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-purple-100 py-2 z-[60] animate-fade-in">
                    <div className="px-4 py-2 mb-1" style={{ borderBottom: '1px solid #F3F0FF' }}>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-400">Thankeeu for Teams</p>
                    </div>

                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-warm-400 uppercase tracking-wider">Team Members</p>
                    <Link to="/member/login" onClick={() => { scrollTop(); setTeamsOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><Icon name="User" size={16} className="text-blue-500"/></span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">Team Member Login</p>
                        <p className="text-xs text-warm-400">Access your team workspace</p>
                      </div>
                    </Link>
                    <Link to="/member/signup" onClick={() => { scrollTop(); setTeamsOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><Icon name="Edit" size={16} className="text-green-500"/></span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">Join Your Company</p>
                        <p className="text-xs text-warm-400">Sign up with your company code</p>
                      </div>
                    </Link>

                    <div className="mx-4 my-1" style={{ borderTop: '1px solid #F3F0FF' }} />

                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-warm-400 uppercase tracking-wider">HR / Company</p>
                    <Link to="/company/login" onClick={() => { scrollTop(); setTeamsOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center"><Icon name="Building" size={16} className="text-primary-500"/></span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">Company (HR) Login</p>
                        <p className="text-xs text-warm-400">Manage your team account</p>
                      </div>
                    </Link>
                    <Link to="/company/signup" onClick={() => { scrollTop(); setTeamsOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><Icon name="Rocket" size={16} className="text-amber-500"/></span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">Create Company Account</p>
                        <p className="text-xs text-warm-400">Set up Thankeeu for Teams</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* CTA cluster */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/dashboard" onClick={scrollTop} className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5">Dashboard</Link>
                  <div className="relative">
                    <button onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm hover:bg-primary-200 transition-colors">
                      {user.full_name?.slice(0,1).toUpperCase() || <Icon name="User" size={15}/>}
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-purple-100 py-2 z-[60] animate-fade-in">
                        <div className="px-4 py-2 border-b border-purple-50 mb-1">
                          <p className="text-xs font-semibold text-warm-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-warm-500 truncate">{user.email}</p>
                        </div>
                        <Link to="/dashboard" onClick={scrollTop} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">Dashboard</Link>
                        <Link to="/create-card" onClick={scrollTop} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">New card</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors">Sign out</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : member ? (
                <div className="flex items-center gap-2">
                  <Link to="/member/dashboard" onClick={scrollTop} className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5">My Dashboard</Link>
                  <div className="relative">
                    <button onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm hover:bg-primary-200 transition-colors">
                      {member.first_name?.slice(0,1).toUpperCase() || <Icon name="User" size={15}/>}
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-purple-100 py-2 z-[60] animate-fade-in">
                        <div className="px-4 py-2 border-b border-purple-50 mb-1">
                          <p className="text-xs font-semibold text-warm-900 truncate">{member.first_name} {member.last_name}</p>
                          <p className="text-xs text-warm-400 truncate">{member.company?.name} · {member.department}</p>
                        </div>
                        <Link to="/member/dashboard" onClick={scrollTop} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">Dashboard</Link>
                        <Link to="/member/occasions" onClick={scrollTop} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">Occasions</Link>
                        <Link to="/member/settings" onClick={scrollTop} className="flex items-center gap-2 px-4 py-2 text-sm text-warm-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">Settings</Link>
                        <button onClick={handleMemberLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors">Sign out</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : company ? (
                <div className="flex items-center gap-2">
                  <Link to="/company/dashboard" onClick={scrollTop} className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5">HR Dashboard</Link>
                  <button onClick={handleCompanyLogout} className="text-xs text-warm-500 hover:text-rose-500 px-3 py-2 transition-colors font-medium">Sign out</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" onClick={scrollTop} className="text-sm font-semibold text-warm-700 hover:text-primary-600 px-3 py-2 transition-colors">Sign in</Link>
                  <Link to="/signup" onClick={scrollTop} className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-1.5">Start free</Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setOpen(!open)}
              className="lg:hidden flex items-center justify-center rounded-xl border-2 border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
              style={{ width: 48, height: 48 }}>
              <Icon name={open ? 'X' : 'Menu'} size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="mobile-nav-overlay z-[60] lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-[65px] w-80 mx-3 rounded-3xl overflow-hidden shadow-xl animate-slide-up"
            style={{ background:'#FFFFFF', border:'1.5px solid #EDE5FF' }}
            onClick={e => e.stopPropagation()}>

            {/* User/company/member info if logged in */}
            {(user || company || member) && (
              <div className="px-5 py-4 border-b border-purple-50" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF1F3)' }}>
                <p className="font-bold text-warm-900 text-sm">
                  {user?.full_name || company?.name || `${member?.first_name} ${member?.last_name}`}
                </p>
                <p className="text-xs text-warm-500 mt-0.5">
                  {user?.email || company?.email || member?.email}
                </p>
                {member && <p className="text-xs text-primary-500 mt-0.5 font-medium">{member.company?.name} · {member.department}</p>}
              </div>
            )}

            <div className="p-4 space-y-1">
              {[
                { to: '/pricing',       label: 'Pricing',       icon: 'Sparkles' },
                { to: '/how-it-works', label: 'How it works', icon: 'Lightbulb' },
                { to: '/sample',       label: 'Sample',        icon: 'Cake' },
                { to: '/blog',         label: 'Blog',          icon: 'File' },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to} onClick={scrollTop}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-warm-800 hover:bg-primary-50 hover:text-primary-600 transition-all">
                  {label}
                </Link>
              ))}

              {/* Teams section in mobile */}
              <div className="pt-2 pb-1">
                <p className="px-4 py-1 text-xs font-bold text-warm-400 uppercase tracking-wider">Teams</p>
              </div>
              <Link to="/member/login" onClick={scrollTop} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-warm-800 hover:bg-blue-50 hover:text-blue-700 transition-all">
                Team Member Login
              </Link>
              <Link to="/member/signup" onClick={scrollTop} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-warm-800 hover:bg-green-50 hover:text-green-700 transition-all">
                Join Your Company
              </Link>
              <Link to="/company/login" onClick={scrollTop} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-warm-800 hover:bg-purple-50 hover:text-primary-600 transition-all">
                Company (HR) Login
              </Link>
              <Link to="/company/signup" onClick={scrollTop} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-warm-800 hover:bg-amber-50 hover:text-amber-700 transition-all">
                Create Company Account
              </Link>
            </div>

            <div className="p-4 pt-0 space-y-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={scrollTop} className="btn-primary w-full text-sm inline-flex items-center justify-center gap-1.5"><Icon name="Dashboard" size={15}/> Dashboard</Link>
                  <Link to="/create-card" onClick={scrollTop} className="btn-secondary w-full text-sm text-center inline-flex items-center justify-center gap-1.5"><Icon name="Plus" size={15}/> Create card</Link>
                  <button onClick={handleLogout} className="w-full text-sm text-rose-500 font-semibold py-2.5 hover:bg-rose-50 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"><Icon name="LogOut" size={15}/> Sign out</button>
                </>
              ) : member ? (
                <>
                  <Link to="/member/dashboard" onClick={scrollTop} className="btn-primary w-full text-sm inline-flex items-center justify-center gap-1.5"><Icon name="Home" size={15}/> My Dashboard</Link>
                  <Link to="/member/occasions" onClick={scrollTop} className="btn-secondary w-full text-sm text-center inline-flex items-center justify-center gap-1.5"><Icon name="Party" size={15}/> Occasions</Link>
                  <button onClick={handleMemberLogout} className="w-full text-sm text-rose-500 font-semibold py-2.5 hover:bg-rose-50 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"><Icon name="LogOut" size={15}/> Sign out</button>
                </>
              ) : company ? (
                <>
                  <Link to="/company/dashboard" onClick={scrollTop} className="btn-primary w-full text-sm inline-flex items-center justify-center gap-1.5"><Icon name="Building" size={15}/> HR Dashboard</Link>
                  <button onClick={handleCompanyLogout} className="w-full text-sm text-rose-500 font-semibold py-2.5">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/signup" onClick={scrollTop} className="btn-primary w-full text-sm inline-flex items-center justify-center gap-1.5"><Icon name="Sparkles" size={15}/> Start free — no credit card</Link>
                  <Link to="/login" onClick={scrollTop} className="btn-secondary w-full text-sm text-center">Sign in</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
