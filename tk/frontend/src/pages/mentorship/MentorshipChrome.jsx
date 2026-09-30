import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../../components/ui/Icon';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function MentorshipNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 backdrop-blur-md border-primary-100 shadow-sm' : 'bg-white/80 backdrop-blur-sm border-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-purple">
            <Icon name="GraduationCap" size={20} />
          </span>
          <span className="font-display font-extrabold text-lg text-warm-900 leading-tight">
            Thankeeu <span className="text-primary-600">Mentorship</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${loc.pathname === n.to ? 'text-primary-600 bg-primary-50' : 'text-warm-600 hover:text-primary-600 hover:bg-primary-50/60'}`}>
              {n.label}
            </Link>
          ))}
          <Link to="/apply" className="ml-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 shadow-purple transition-all">
            Enroll your child
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-lg text-warm-700" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <Icon name={open ? 'X' : 'Menu'} size={22} />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-primary-100 bg-white px-4 py-3 space-y-1">
          {NAV.map(n => (
            <Link key={n.to} to={n.to}
              className={`block px-3 py-2.5 rounded-xl text-sm font-bold ${loc.pathname === n.to ? 'text-primary-600 bg-primary-50' : 'text-warm-700'}`}>
              {n.label}
            </Link>
          ))}
          <Link to="/apply" className="block text-center mt-2 px-5 py-3 rounded-xl bg-primary-500 text-white text-sm font-bold">
            Enroll your child
          </Link>
        </div>
      )}
    </nav>
  );
}

export function MentorshipFooter() {
  return (
    <footer className="border-t border-primary-100 bg-warm-50 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <Icon name="GraduationCap" size={17} />
              </span>
              <span className="font-display font-extrabold text-warm-900">Thankeeu Mentorship</span>
            </div>
            <p className="text-sm text-warm-500 leading-relaxed">
              Connecting students with real career professionals who mentor, guide, and give them purpose.
            </p>
          </div>
          <div>
            <p className="font-bold text-warm-900 text-sm mb-3">Explore</p>
            <ul className="space-y-2 text-sm text-warm-500">
              <li><Link to="/how-it-works" className="hover:text-primary-600">How it works</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-600">Pricing</Link></li>
              <li><Link to="/apply" className="hover:text-primary-600">Enroll your child</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-warm-900 text-sm mb-3">Company</p>
            <ul className="space-y-2 text-sm text-warm-500">
              <li><Link to="/about" className="hover:text-primary-600">About us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
              <li><a href="https://www.thankeeu.com" className="hover:text-primary-600">Thankeeu.com</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-warm-900 text-sm mb-3">Get started</p>
            <p className="text-sm text-warm-500 mb-3">Give your child a mentor this term.</p>
            <Link to="/apply" className="inline-block px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600">
              Enroll now
            </Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-primary-100 text-center text-xs text-warm-400">
          © {new Date().getFullYear()} Thankeeu Mentorship — a subsidiary of Thankeeu, a global digital greeting card company.
        </div>
      </div>
    </footer>
  );
}
