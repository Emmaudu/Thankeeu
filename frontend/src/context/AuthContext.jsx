import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('thankeeu_token');
    const savedUser = localStorage.getItem('thankeeu_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
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

  const signup = async (full_name, email, password) => {
    const res = await authAPI.signup({ full_name, email, password });
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

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('thankeeu_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
