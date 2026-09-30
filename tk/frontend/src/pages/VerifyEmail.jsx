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
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authAPI.verifyEmail(token)
      .then(res => { if (res.data.alreadyVerified) setStatus('already'); else { setStatus('success'); updateUser?.({ is_verified: true }); } })
      .catch(() => setStatus('error'));
  }, [token]);

  const CONFIG = {
    loading: { icon:'⏳', title:'Verifying your email…', body:'Please wait a moment.', cta:null },
    success: { icon:'✅', title:'Email verified!', body:"You're all set. Your Thankeeu account is fully active.", cta:<Link to="/dashboard" className="btn-primary px-8 py-3 inline-flex items-center gap-2"><Icon name="ArrowRight" size={15}/>Go to my dashboard</Link> },
    already: { icon:'✅', title:'Already verified!', body:"Your email was already verified. You're good to go.", cta:<Link to="/dashboard" className="btn-primary px-8 py-3 inline-flex items-center gap-2"><Icon name="ArrowRight" size={15}/>Go to my dashboard</Link> },
    error:   { icon:'⚠️', title:'Invalid or expired link', body:'This verification link is invalid or has expired. Request a new one from your dashboard.', cta:<Link to="/dashboard" className="btn-secondary px-8 py-3">Back to dashboard</Link> },
  };

  const s = CONFIG[status];

  return (
    <div style={{ minHeight:'100vh', background:'#12102A', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ maxWidth:420, width:'100%', background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(139,92,246,0.2)', borderRadius:24, padding:'2.5rem', textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>{s.icon}</div>
        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#E4E2F6', marginBottom:'0.625rem' }}>{s.title}</h1>
        <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#9490C8', fontSize:'0.9375rem', lineHeight:1.65, marginBottom:s.cta?'1.5rem':'0' }}>{s.body}</p>
        {s.cta && s.cta}
      </div>
    </div>
  );
};

export default VerifyEmail;
