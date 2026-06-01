import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCompanyAuth } from '../../context/CompanyAuthContext';

const NAV = [
  { path: '/company/dashboard',    icon: '📊', label: 'Dashboard' },
  { path: '/company/teams',        icon: '🎉', label: 'Occasions' },
  { path: '/company/members',      icon: '👥', label: 'Team Members' },
  { path: '/company/deductions',   icon: '💰', label: 'Requests' },
  { path: '/company/subscription', icon: '💳', label: 'Subscription' },
  { path: '/company/settings',     icon: '⚙️', label: 'Settings' },
  { path: '/company/hris',         icon: '🔗', label: 'HRIS Sync' },
  { path: '/company/support',      icon: '💬', label: 'Support' },
];

const CompanyLayout = ({ children, title, subtitle }) => {
  const { company, logout } = useCompanyAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/company/login'); };
  const isActive  = (p) => location.pathname === p;
  const sub       = company?.subscription;
  const isSubscribed = sub?.status === 'active';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen sticky top-0">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <span className="font-display font-semibold text-gray-900 text-sm">Thankeeu</span>
              <span className="block text-xs text-primary-400 font-medium -mt-0.5">for Teams</span>
            </div>
          </Link>
        </div>

        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            {company?.logo_url
              ? <img src={company.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
              : <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold text-sm">{company?.name?.charAt(0)}</div>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{company?.name}</p>
              <p className="text-xs text-gray-400 truncate">{company?.contact_person}</p>
            </div>
          </div>
          <div className={`mt-2 text-xs px-2.5 py-1 rounded-full text-center font-medium ${isSubscribed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {isSubscribed ? `✓ Active — ${sub?.plan}` : '⚠ No subscription'}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(n.path) ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base">{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors">
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <Link to="/company/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Thankeeu Teams</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive(n.path) ? 'bg-primary-50 text-primary-600' : 'text-gray-600'}`}>
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

export default CompanyLayout;
