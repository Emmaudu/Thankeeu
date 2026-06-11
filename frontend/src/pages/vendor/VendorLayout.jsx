import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

const NAV = [
  { path: '/vendor/dashboard',  icon: 'Dashboard',    label: 'Overview' },
  { path: '/vendor/products',   icon: 'Package',       label: 'Products' },
  { path: '/vendor/orders',     icon: 'Cart',          label: 'Orders' },
  { path: '/vendor/customers',  icon: 'Users',         label: 'Customers' },
  { path: '/vendor/storefront', icon: 'Store',         label: 'Storefront' },
  { path: '/vendor/analytics',  icon: 'BarChart',      label: 'Analytics' },
  { path: '/vendor/bank',       icon: 'Wallet',        label: 'Bank Account' },
  { path: '/vendor/support',    icon: 'Message',       label: 'Support' },
  { path: '/vendor/settings',   icon: 'Settings',      label: 'Settings' },
];

export default function VendorLayout({ children, title, subtitle }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('thankeeu_vendor') || 'null');
      if (!v) { nav('/vendor/login'); return; }
      setVendor(v);
    } catch { nav('/vendor/login'); }
  }, []);

  const logout = () => {
    localStorage.removeItem('thankeeu_vendor_token');
    localStorage.removeItem('thankeeu_vendor');
    nav('/vendor/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F8F7FF', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300
        ${open ? 'w-64' : 'w-16'} md:w-64 bg-white border-r border-purple-100 shadow-sm`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-purple-50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            <Icon name="Store" size={16} className="text-white" />
          </div>
          <span className={`font-bold text-warm-900 truncate transition-opacity ${open ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            {vendor?.business_name || 'Vendor'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = loc.pathname === item.path || loc.pathname.startsWith(item.path + '/');
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

        {/* Vendor info + logout */}
        <div className="px-2 pb-4 border-t border-purple-50 pt-3">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity ${open ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(vendor?.business_name||'V').charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-warm-900 truncate">{vendor?.business_name}</p>
              <p className="text-xs text-warm-400 truncate capitalize">{vendor?.category}</p>
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
        {/* Top bar */}
        <header className="bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <button className="md:hidden mr-3 text-warm-500" onClick={() => setOpen(p => !p)}>
              <Icon name="Grid" size={20} />
            </button>
            <h1 className="text-lg font-bold text-warm-900 inline">{title}</h1>
            {subtitle && <p className="text-sm text-warm-400 mt-0.5">{subtitle}</p>}
          </div>
          <a href={`/c/${vendor?.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
            <Icon name="ExternalLink" size={14} /> View storefront
          </a>
        </header>

        <div className="flex-1 px-4 md:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
