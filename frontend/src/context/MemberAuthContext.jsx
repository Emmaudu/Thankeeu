import { createContext, useContext, useState, useEffect } from 'react';
import { memberAPI } from '../utils/api';

const MemberAuthContext = createContext(null);

export const MemberAuthProvider = ({ children }) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

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
