import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BlogUnsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('invalid'); return; }
    const base = import.meta.env.VITE_API_URL || '/api';
    fetch(`${base}/blog/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(r => r.json()).then(() => setStatus('done')).catch(() => setStatus('invalid'));
  }, []);

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 100%)' }}>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center max-w-md">
          {status === 'processing' && <><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" /><p className="text-warm-500">Processing...</p></>}
          {status === 'done' && <><div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4"><Icon name="LogOut" size={24} className="text-purple-400"/></div><h1 className="font-display text-2xl font-bold text-warm-900 mb-3">Unsubscribed</h1><p className="text-warm-500">You've been removed from the mailing list. We'll miss you!</p></>}
          {status === 'invalid' && <><div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4"><Icon name="AlertCircle" size={24} className="text-amber-500"/></div><p className="text-warm-500">Invalid unsubscribe link.</p></>}
        </div>
      </div>
      <Footer />
    </div>
  );
}
