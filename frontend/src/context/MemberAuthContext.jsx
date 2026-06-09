import { createContext, useContext, useState, useEffect } from 'react';
import { memberAPI } from '../utils/api';


const _SESSION_MS = 30 * 60 * 1000; // 30 min inactivity
let _actTimer = null;
const _resetTimer = (logoutFn, loginPath = '/member/login') => {
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

const MemberAuthContext = createContext(null);

export const MemberAuthProvider = ({ children }) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  
  // 30-min inactivity logout
  useEffect(() => {
    const isLoggedIn = () => !!localStorage.getItem('thankeeu_token') || !!localStorage.getItem('thankeeu_company_token') || !!localStorage.getItem('thankeeu_member_token');
    const h = () => { if (isLoggedIn()) _resetTimer(() => { logout?.(); }); };
    _EVENTS.forEach(e => window.addEventListener(e, h, { passive: true }));
    return () => _EVENTS.forEach(e => window.removeEventListener(e, h));
  }, []);

useEffect(() => {
    const token = localStorage.getItem('thankeeu_member_token');
    const saved  = localStorage.getItem('thankeeu_member');
    if (token && saved) {
      setMember(JSON.parse(saved));
      memberAPI.getMe()
        .then(res => { setMember(res.data); localStorage.setItem('thankeeu_member', JSON.stringify(res.data)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await memberAPI.login({ email, password });
    localStorage.setItem('thankeeu_member_token', res.data.token);
    localStorage.setItem('thankeeu_member', JSON.stringify(res.data.member));
    setMember(res.data.member);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('thankeeu_member_token');
    localStorage.removeItem('thankeeu_member');
    setMember(null);
  };

  const updateMember = (updates) => {
    const updated = { ...member, ...updates };
    setMember(updated);
    localStorage.setItem('thankeeu_member', JSON.stringify(updated));
  };

  return (
    <MemberAuthContext.Provider value={{ member, loading, login, logout, updateMember }}>
      {children}
    </MemberAuthContext.Provider>
  );
};

export const useMemberAuth = () => useContext(MemberAuthContext);
