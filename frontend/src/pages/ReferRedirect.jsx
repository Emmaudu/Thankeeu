import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { referralsApi } from '../utils/api';

// Stores the referral slug so registration can attribute the signup even
// after the visitor navigates through the signup flow.
export const REFERRAL_STORAGE_KEY = 'taskeeu_referral_slug';

export default function ReferRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState('checking'); // checking | valid | invalid
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    let active = true;
    referralsApi.resolve(slug)
      .then(({ data }) => {
        if (!active) return;
        if (data.valid) {
          try { localStorage.setItem(REFERRAL_STORAGE_KEY, data.slug); } catch (_) {}
          setReferrerName(data.referrer_name || '');
          setState('valid');
          // Brief pause so the visitor sees who invited them, then go to signup.
          setTimeout(() => navigate('/requester/signup?ref=1', { replace: true }), 1800);
        } else {
          setState('invalid');
        }
      })
      .catch(() => { if (active) setState('invalid'); });
    return () => { active = false; };
  }, [slug, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--surface, #faf7ff)' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        {state === 'checking' && (
          <>
            <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-5" />
            <p style={{ color: '#6b7280' }}>Checking your invite…</p>
          </>
        )}
        {state === 'valid' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 30 }}></div>
            <h1 style={{ fontWeight: 900, fontSize: 24, color: '#111', marginBottom: 10, letterSpacing: '-0.02em' }}>
              {referrerName ? `${referrerName} invited you to Taskeeu` : 'Welcome to Taskeeu'}
            </h1>
            <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 8 }}>
              Post any errand or task and get it done by verified, trusted people near you. Taking you to sign up…
            </p>
            <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mt-4" />
          </>
        )}
        {state === 'invalid' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 30 }}></div>
            <h1 style={{ fontWeight: 900, fontSize: 22, color: '#111', marginBottom: 10 }}>This invite link isn't valid</h1>
            <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              The referral link may be mistyped or no longer active, but you can still join Taskeeu directly.
            </p>
            <Link to="/requester/signup" className="btn-primary" style={{ padding: '12px 28px', borderRadius: 12 }}>Sign Up</Link>
          </>
        )}
      </div>
    </div>
  );
}
