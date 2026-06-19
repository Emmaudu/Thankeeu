import { createContext, useContext, useState, useEffect } from 'react';
import { companyAPI } from '../utils/api';


const _SESSION_MS = 30 * 60 * 1000; // 30 min inactivity
let _actTimer = null;
const _resetTimer = (logoutFn, loginPath = '/company/login') => {
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

const CompanyAuthContext = createContext(null);

export const CompanyAuthProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  
  // 30-min inactivity logout
  useEffect(() => {
    const isLoggedIn = () => !!localStorage.getItem('thankeeu_company_token');
    const h = () => { if (isLoggedIn()) _resetTimer(() => { logout?.(); }); };
    _EVENTS.forEach(e => window.addEventListener(e, h, { passive: true }));
    return () => _EVENTS.forEach(e => window.removeEventListener(e, h));
  }, []);

useEffect(() => {
    const token = localStorage.getItem('thankeeu_company_token');
    const saved = localStorage.getItem('thankeeu_company');
    if (token && saved) {
      try { setCompany(JSON.parse(saved)); } catch { /* corrupted localStorage — ignore */ }
      companyAPI.getMe()
        .then(res => { setCompany(res.data); localStorage.setItem('thankeeu_company', JSON.stringify(res.data)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await companyAPI.login({ email, password });
    localStorage.setItem('thankeeu_company_token', res.data.token);
    localStorage.setItem('thankeeu_company', JSON.stringify(res.data.company));
    setCompany(res.data.company);
    return res.data;
  };

  const signup = async (data) => {
    const res = await companyAPI.signup(data);
    localStorage.setItem('thankeeu_company_token', res.data.token);
    localStorage.setItem('thankeeu_company', JSON.stringify(res.data.company));
    setCompany(res.data.company);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('thankeeu_company_token');
    localStorage.removeItem('thankeeu_company');
    setCompany(null);
  };

  const updateCompany = (updates) => {
    const updated = { ...company, ...updates };
    setCompany(updated);
    localStorage.setItem('thankeeu_company', JSON.stringify(updated));
  };

  return (
    <CompanyAuthContext.Provider value={{ company, loading, login, signup, logout, updateCompany }}>
      {children}
    </CompanyAuthContext.Provider>
  );
};

export const useCompanyAuth = () => useContext(CompanyAuthContext);
