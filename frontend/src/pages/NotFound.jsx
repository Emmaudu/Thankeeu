import { useSEO } from '../hooks/useSEO';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icon from '../components/ui/Icon';

const NotFound = () => {
  useSEO({ title: 'Page Not Found — Thankeeu', noIndex: true });
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#F0EBFF 0%,#FDFCFF 60%,#FFF0F5 100%)' }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[82vh] px-4 text-center">
        <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 animate-float"
          style={{ background:'linear-gradient(135deg,#EDE9FE,#FCE7F3)', border:'2px solid #DDD6FE' }}>
          <Icon name="Gift" size={52} className="text-primary-400" />
        </div>
        <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:900, fontSize:'5rem', color:'#EDE9FE', lineHeight:1, marginBottom:'0.25rem' }}>404</p>
        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'1.75rem', color:'#1A1035', margin:'0 0 0.5rem' }}>
          This page got lost in the mail
        </h1>
        <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'1.0625rem', color:'#7A6CA8', maxWidth:400, lineHeight:1.65, marginBottom:'2.5rem' }}>
          The page you're looking for doesn't exist, was moved, or the link is broken.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/"          className="btn-primary px-8 py-3.5 text-base inline-flex items-center gap-2"><Icon name="Home" size={16} /> Go to homepage</Link>
          <Link to="/dashboard" className="btn-secondary px-8 py-3.5 text-base inline-flex items-center gap-2"><Icon name="Heart" size={16} /> My dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
