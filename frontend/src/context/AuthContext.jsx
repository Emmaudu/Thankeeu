import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';


const _SESSION_MS = 30 * 60 * 1000; // 30 min inactivity
let _actTimer = null;
const _resetTimer = (logoutFn, loginPath = '/login') => {
  clearTimeout(_actTimer);
  _actTimer = setTimeout(() => {
    logoutFn();
    // Redirect to login — works even if the React tree doesn't re-render
    if (!window.location.pathname.startsWith(loginPath)) {
      window.location.href = loginPath + '?reason=session_expired';
    }
  }, _SESSION_MS);
};
const _EVENTS = ['click','keydown','mousemove','touchstart','scroll'];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  // 30-min inactivity logout
  useEffect(() => {
    const isLoggedIn = () => !!localStorage.getItem('thankeeu_token');
    const h = () => { if (isLoggedIn()) _resetTimer(() => { logout?.(); }); };
    _EVENTS.forEach(e => window.addEventListener(e, h, { passive: true }));
    return () => _EVENTS.forEach(e => window.removeEventListener(e, h));
  }, []);

useEffect(() => {
    const token = localStorage.getItem('thankeeu_token');
    const savedUser = localStorage.getItem('thankeeu_user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { /* corrupted localStorage — ignore */ }
      authAPI.getMe().then(res => {
        setUser(res.data);
        localStorage.setItem('thankeeu_user', JSON.stringify(res.data));
      }).catch(() => logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('thankeeu_token', res.data.token);
    localStorage.setItem('thankeeu_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (full_name, email, password, username) => {
    const res = await authAPI.signup({ full_name, email, password, username });
    localStorage.setItem('thankeeu_token', res.data.token);
    localStorage.setItem('thankeeu_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('thankeeu_token');
    localStorage.removeItem('thankeeu_user');
    localStorage.removeItem('thankeeu_pending_card');
    setUser(null);
  };

  // Authenticate using a token/user pair already obtained from a raw API call
  // (e.g. account creation during card-signing). Avoids a second API round-trip.
  const loginWithToken = (token, userObj) => {
    localStorage.setItem('thankeeu_token', token);
    localStorage.setItem('thankeeu_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('thankeeu_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
