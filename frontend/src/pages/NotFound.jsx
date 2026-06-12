import { useSEO } from '../hooks/useSEO';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';

const NotFound = () => {
  useSEO({ title: 'Page Not Found', description: 'The page you are looking for does not exist. Go back to Thankeeu to create group cards and gifts.', noIndex: true });

  useEffect(() => {
    document.title = 'Page Not Found — Thankeeu';
    const r = document.querySelector('meta[name="robots"]');
    if (r) r.setAttribute('content', 'noindex,nofollow');
    else {
      const m = document.createElement('meta');
      m.setAttribute('name', 'robots');
      m.setAttribute('content', 'noindex,nofollow');
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-primary-50 flex items-center justify-center mb-6 animate-float"><Icon name="Gift" size={48} className="text-primary-400"/></div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold text-warm-900 mb-4">404</h1>
        <p className="text-lg sm:text-xl text-warm-600 mb-2 font-display">This page got lost in the mail</p>
        <p className="text-warm-400 text-sm mb-10 max-w-sm leading-relaxed">
          The page you are looking for does not exist, was moved, or the link is broken.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/"          className="btn-primary  px-8 py-3">Go to homepage</Link>
          <Link to="/dashboard" className="btn-secondary px-8 py-3">My dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
