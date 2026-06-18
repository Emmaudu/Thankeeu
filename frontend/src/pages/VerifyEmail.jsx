import { useSEO } from '../hooks/useSEO';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';

const VerifyEmail = () => {
  useSEO({ title: 'Verify Email — Thankeeu', noIndex: true });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { updateUser } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | success | error | already

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authAPI.verifyEmail(token)
      .then(res => {
        if (res.data.alreadyVerified) {
          setStatus('already');
        } else {
          setStatus('success');
          // Update local user state if logged in
          updateUser?.({ is_verified: true });
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const states = {
    loading: {
      icon: <div className="w-16 h-16 border-4 border-t-primary-500 rounded-full animate-spin mx-auto mb-5" style={{ borderColor: 'rgba(124,110,255,0.2)', borderTopColor: '#7C6EFF' }} />,
      title: 'Verifying your email...',
      body: 'Please wait a moment.',
    },
    success: {
      icon: <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"><Icon name="Check" size={30} className="text-green-600"/></div>,
      title: 'Email verified!',
      body: "You're all set. Your Thankeeu account is fully active — you can now send cards, collect gifts, and do everything.",
      cta: <Link to="/dashboard" className="btn-primary px-8 py-3 text-sm">Go to my dashboard →</Link>,
    },
    already: {
      icon: <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"><Icon name="Check" size={30} className="text-green-600"/></div>,
      title: 'Already verified!',
      body: "Your email was already verified. You're good to go.",
      cta: <Link to="/dashboard" className="btn-primary px-8 py-3 text-sm">Go to my dashboard →</Link>,
    },
    error: {
      icon: <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5"><Icon name="AlertCircle" size={30} className="text-amber-500"/></div>,
      title: 'Invalid or expired link',
      body: "This verification link is invalid or has expired. You can request a new one from your dashboard.",
      cta: <Link to="/dashboard" className="btn-secondary px-8 py-3 text-sm">Back to dashboard</Link>,
    },
  };

  const s = states[status];

  return (
    <div style={{ minHeight: '100vh', background: '#12102A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,110,255,0.2)', borderRadius: 20, padding: '2.5rem', textAlign: 'center' }}>
        {s.icon}
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#E4E2F6', marginBottom: 10 }}>{s.title}</h1>
        <p style={{ color: '#9490C8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{s.body}</p>
        {s.cta && s.cta}
      </div>
    </div>
  );
};

export default VerifyEmail;
