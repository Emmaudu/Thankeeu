import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../utils/api';

// Generate or reuse a random session ID stored in sessionStorage
function getSessionId() {
  try {
    let sid = sessionStorage.getItem('_tsid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('_tsid', sid);
    }
    return sid;
  } catch {
    return 'nostorage';
  }
}

// Pages that should NOT be tracked (dashboards, auth callbacks, admin)
const SKIP_PREFIXES = ['/admin', '/requester', '/tasker', '/payment', '/auth/verified', '/auth/tasker'];

export default function usePageTracking() {
  const location = useLocation();
  const lastTracked = useRef('');

  useEffect(() => {
    const path = location.pathname;

    // Skip internal/dashboard pages
    if (SKIP_PREFIXES.some(p => path.startsWith(p))) return;

    // Skip duplicates within the same render cycle
    if (path === lastTracked.current) return;
    lastTracked.current = path;

    adminApi.trackPageView({
      page: path,
      referrer: document.referrer || '',
      session_id: getSessionId(),
    });
  }, [location.pathname]);
}
