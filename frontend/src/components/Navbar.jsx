import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import ThankeeuLogo from './ThankeeuLogo';

const Navbar = ({ onBookDemo }) => {
  const { user, logout }             = useAuth();
  const { company, logout: coLogout } = useCompanyAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]         = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [forOpen, setForOpen]   = useState(false);
  const dropRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (open) document.body.classList.add('no-scroll');
    else       document.body.classList.remove('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  const handleLogout        = () => { logout();   navigate('/'); };
  const handleCompanyLogout = () => { coLogout(); navigate('/'); };

  const NavLink = ({ to, children }) => (
    <Link to={to}
      className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
        location.pathname === to ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}>
      {children}
    </Link>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="section-container">
          <div className="flex items-center justify-between h-14 md:h-16 gap-3">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <ThankeeuLogo size={32} textSize="text-lg md:text-xl" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              <NavLink to="/pricing">Pricing</NavLink>
              <a href="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                How it works
              </a>
              <a href="/#occasions" className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                Occasions
              </a>

              {/* For Teams dropdown */}
              <div className="relative" onMouseEnter={() => setForOpen(true)} onMouseLeave={() => setForOpen(false)}>
                <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  For Teams
                  <svg className={`w-3.5 h-3.5 transition-transform ${forOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {forOpen && (
                  <div className="absolute left-0 mt-0 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-3 py-1.5 mb-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Company</p>
                    </div>
                    <Link to="/company/signup" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span>🏢</span> Create company account
                    </Link>
                    <Link to="/company/login" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span>🔑</span> Company sign in
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <a href="#book-demo" onClick={() => setForOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span>📅</span> Book a demo
                    </a>
                    <Link to="/pricing" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      <span>💳</span> Team pricing
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {/* Company logged in */}
              {company && (
                <>
                  <span className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg font-medium truncate max-w-[120px]">
                    🏢 {company.name?.split(' ')[0]}
                  </span>
                  <Link to="/company/dashboard" className="btn-primary text-sm py-2 px-4">Dashboard</Link>
                  <button onClick={handleCompanyLogout} className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2">Sign out</button>
                </>
              )}
              {/* Individual user logged in */}
              {!company && user && (
                <>
                  <Link to="/create" className="btn-pink text-sm py-2 px-4">+ Create card</Link>
                  <div className="relative" ref={dropRef}>
                    <button onClick={() => setDropOpen(!dropOpen)}
                      className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden lg:block">{user.full_name?.split(' ')[0]}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dropOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                        <Link to="/dashboard" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <span>📊</span> Dashboard
                        </Link>
                        {user.role === 'admin' && (
                          <Link to="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary-600 hover:bg-gray-50">
                            <span>🛡️</span> Admin Panel
                          </Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                          <span>🚪</span> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Guest */}
              {!company && !user && (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">
                    Sign in
                  </Link>
                  <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get started free</Link>
                </>
              )}
            </div>

            {/* Mobile: right side */}
            <div className="flex md:hidden items-center gap-2">
              {user && !company && (
                <Link to="/create" className="btn-pink text-xs py-2 px-3">+ Card</Link>
              )}
              {company && (
                <Link to="/company/dashboard" className="text-xs bg-primary-50 text-primary-600 px-3 py-2 rounded-lg font-medium">
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                aria-label="Toggle menu">
                <div className="w-5 space-y-1.5">
                  <span className={`block h-0.5 bg-current transition-all duration-300 origin-center ${open ? 'rotate-45 translate-y-2' : ''}`} />
                  <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? 'opacity-0 scale-x-0' : ''}`} />
                  <span className={`block h-0.5 bg-current transition-all duration-300 origin-center ${open ? '-rotate-45 -translate-y-2' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="mobile-nav-overlay absolute inset-0" />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <ThankeeuLogo size={28} textSize="text-base" />
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 text-lg">✕</button>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link to="/pricing"      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">💳 Pricing</Link>
              <a href="/#how-it-works" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">💡 How it works</a>
              <a href="/#occasions"    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">🎉 Occasions</a>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">For Teams</p>
                <Link to="/company/signup"   className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">🏢 Create company account</Link>
                <Link to="/company/login"    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">🔑 Company sign in</Link>
                <a href="#book-demo" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100">
                  📅 Book a free demo
                </a>
              </div>
            </div>

            {/* Bottom auth section */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              {company && (
                <button onClick={handleCompanyLogout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 w-full hover:bg-red-50">
                  🚪 Sign out ({company.name?.split(' ')[0]})
                </button>
              )}
              {!company && user && (
                <>
                  <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">📊 Dashboard</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50">🛡️ Admin Panel</Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 w-full hover:bg-red-50">
                    🚪 Sign out
                  </button>
                </>
              )}
              {!company && !user && (
                <>
                  <Link to="/login"  className="btn-secondary w-full text-center">Sign in</Link>
                  <Link to="/signup" className="btn-primary  w-full text-center">Get started free</Link>
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
