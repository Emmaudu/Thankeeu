import { prefixOf } from '../utils/market';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { authApi } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// ─── Inactivity timeout config ────────────────────────────────────
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS     = 2 * 60 * 1000;  // warn 2 min before logout
const ACTIVITY_EVENTS       = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

// Is the app running as an installed PWA (standalone mode)?
// When true, we disable inactivity logout — you don't get logged out
// of a native app just for not touching it for 30 minutes.
const IS_INSTALLED_PWA = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer  = useRef(null);
  const warningTimer     = useRef(null);
  const warningToastId   = useRef(null);
  const lastActivityRef  = useRef(Date.now());

  // ── Load user on mount ─────────────────────────────────────────
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('taskeeu_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      setProfile(data.profile);
      // Keep localStorage in sync so refreshes don't revert to stale data
      try { localStorage.setItem('taskeeu_user', JSON.stringify(data.user)); } catch (_) {}
    } catch (err) {
      const status = err?.response?.status;
      // Only clear token on explicit auth failures (401 Unauthorized, 403 Forbidden)
      // Do NOT clear on network errors (no status) or server errors (500) — those are transient
      if (status === 401 || status === 403) {
        localStorage.removeItem('taskeeu_token');
        localStorage.removeItem('taskeeu_user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ── Silent token refresh ───────────────────────────────────────
  // Decodes the stored JWT, calculates when it expires, and refreshes it
  // 24 hours before expiry. Runs on mount and periodically. This means the
  // user is NEVER logged out due to token expiry as long as they open the
  // app at least once every 29 days (with the 30-day default expiry).
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const token = localStorage.getItem('taskeeu_token');
        if (!token) return;
        // Decode expiry from the JWT payload (no library needed — it's base64).
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // ms
        const refreshAt = expiresAt - 24 * 60 * 60 * 1000; // 24h before expiry
        if (Date.now() < refreshAt) return; // not yet time
        const { data } = await authApi.refresh();
        if (data?.token) localStorage.setItem('taskeeu_token', data.token);
      } catch (_) { /* silently ignore — next open will try again */ }
    };
    tryRefresh();
    // Re-check every hour (handles long-lived sessions without hammering the server).
    const interval = setInterval(tryRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback((reason) => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(warningTimer.current);
    if (warningToastId.current) toast.dismiss(warningToastId.current);

    const wasAdmin = (() => {
      try { return JSON.parse(localStorage.getItem('taskeeu_user'))?.role === 'admin'; }
      catch { return false; }
    })();
    // Send people back to their own country's site after signing out.
    const home = (() => {
      try { return prefixOf(JSON.parse(localStorage.getItem('taskeeu_user'))?.market || 'NG'); }
      catch { return ''; }
    })();

    localStorage.removeItem('taskeeu_token');
    localStorage.removeItem('taskeeu_user');
    setUser(null);
    setProfile(null);

    if (wasAdmin) {
      window.location.href = '/admin/login';
    } else if (reason === 'inactivity') {
      window.location.href = `${home}/auth?reason=inactive`;
    } else {
      window.location.href = home || '/';
    }
  }, []);

  // ── Inactivity timer management ────────────────────────────────
  const resetTimers = useCallback(() => {
    if (!user) return; // only apply when logged in

    clearTimeout(inactivityTimer.current);
    clearTimeout(warningTimer.current);
    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
      warningToastId.current = null;
    }

    lastActivityRef.current = Date.now();

    // Warn 2 min before timeout
    warningTimer.current = setTimeout(() => {
      warningToastId.current = toast(
        '⏱ You\'ll be logged out in 2 minutes due to inactivity.',
        { duration: WARNING_BEFORE_MS, icon: '' }
      );
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Auto-logout after full timeout
    inactivityTimer.current = setTimeout(() => {
      logout('inactivity');
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, logout]);

  // ── Attach / detach activity listeners ────────────────────────
  useEffect(() => {
    // Installed PWA behaves like a native app — never log out due to
    // inactivity. The user is on their own device; inactivity timeout is
    // a browser-session security measure, not appropriate here.
    if (IS_INSTALLED_PWA) return;

    if (!user) {
      // Not logged in — clear any lingering timers
      clearTimeout(inactivityTimer.current);
      clearTimeout(warningTimer.current);
      return;
    }

    // Start timer on login
    resetTimers();

    // Throttled activity handler (max once per 10 s)
    let lastReset = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset > 10_000) {
        lastReset = now;
        resetTimers();
      }
    };

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity));
      clearTimeout(inactivityTimer.current);
      clearTimeout(warningTimer.current);
    };
  }, [user, resetTimers]);

  // ── Login ──────────────────────────────────────────────────────
  const login = async (email, password, role) => {
    const payload = { email, password };
    if (role) payload.role = role;
    // Include the cached push subscription endpoint if present, so the
    // backend can link any anonymous push subscription to this user.
    try {
      const ep = localStorage.getItem('taskeeu_push_endpoint');
      if (ep) payload.push_endpoint = ep;
    } catch (_) {}
    const { data } = await authApi.login(payload);
    localStorage.setItem('taskeeu_token', data.token);
    localStorage.setItem('taskeeu_user', JSON.stringify(data.user));
    setUser(data.user);
    // Load profile in background so isPendingTasker/isApprovedTasker work immediately
    loadUser().catch(() => {});
    return data;
  };

  const refreshProfile = () => loadUser();

  const isAuthenticated   = !!user;
  const isRequester       = user?.role === 'requester';
  const isTasker          = user?.role === 'tasker';
  const isAdmin           = user?.role === 'admin';
  const isApprovedTasker  = isTasker && profile?.verification_status === 'approved';
  const isPendingTasker   = isTasker && profile?.verification_status === 'pending';

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      login, logout, refreshProfile,
      isAuthenticated, isRequester, isTasker, isAdmin, isApprovedTasker, isPendingTasker,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
