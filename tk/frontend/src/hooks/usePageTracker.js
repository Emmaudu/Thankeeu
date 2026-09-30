import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';

// Generates or retrieves a persistent session ID for this browser tab
function getSessionId() {
  let id = sessionStorage.getItem('tk_session');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('tk_session', id);
  }
  return id;
}

export function usePageTracker() {
  const location  = useLocation();
  const { user }    = useAuth();
  const { member }  = useMemberAuth();
  const { company } = useCompanyAuth();
  const lastPath  = useRef(null);

  useEffect(() => {
    const path = location.pathname;
    // Don't double-track same path (React strict mode fires effects twice)
    if (path === lastPath.current) return;
    lastPath.current = path;

    // Skip admin paths from public analytics
    if (path.startsWith('/admin')) return;

    const userType = company ? 'company' : member ? 'member' : user ? 'user' : 'anonymous';
    const BASE = import.meta.env.VITE_API_URL || '/api';

    fetch(`${BASE}/analytics/track`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer:   document.referrer || null,
        session_id: getSessionId(),
        user_type:  userType,
      }),
    })
    .then(r => r.json())
    .then(d => { if (!d.ok) console.warn('[analytics] track failed:', d.error || d) })
    .catch(err => console.warn('[analytics] track error:', err.message));
  }, [location.pathname]);
}
