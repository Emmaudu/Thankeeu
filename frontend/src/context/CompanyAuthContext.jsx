import { createContext, useContext, useState, useEffect } from 'react';
import { companyAPI } from '../utils/api';

const CompanyAuthContext = createContext(null);

export const CompanyAuthProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('thankeeu_company_token');
    const saved = localStorage.getItem('thankeeu_company');
    if (token && saved) {
      setCompany(JSON.parse(saved));
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
