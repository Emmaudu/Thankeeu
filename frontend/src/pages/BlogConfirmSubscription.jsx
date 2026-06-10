import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { blogAPI } from '../utils/api';

export default function BlogConfirmSubscription() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('confirming');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!token || !email) { setStatus('invalid'); return; }
    // Call GET /blog/confirm-subscription?token=...&email=...
    const base = import.meta.env.VITE_API_URL || '/api';
    fetch(`${base}/blog/confirm-subscription?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(r => r.json()).then(d => setStatus(d.error ? 'invalid' : 'confirmed')).catch(() => setStatus('invalid'));
  }, []);

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(160deg,#F5F0FF 0%,#FDFCFF 100%)' }}>
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center max-w-md">
          {status === 'confirming' && (
            <><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-warm-500">Confirming subscription...</p></>
          )}
          {status === 'confirmed' && (
            <><div className="text-6xl mb-4">🎉</div>
            <h1 className="font-display text-2xl font-bold text-warm-900 mb-3">You're subscribed!</h1>
            <p className="text-warm-500 mb-6">You'll receive new Thankeeu blog posts, HR tips, and product updates in your inbox.</p>
            <a href="/blog" className="btn-primary px-6 py-3 text-sm">Browse the blog →</a></>
          )}
          {status === 'invalid' && (
            <><div className="text-5xl mb-4">⚠️</div>
            <h1 className="font-display text-2xl font-bold text-warm-900 mb-3">Invalid link</h1>
            <p className="text-warm-500">This confirmation link has expired or is invalid. Please try subscribing again.</p></>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
