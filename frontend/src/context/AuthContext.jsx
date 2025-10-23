import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('role'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else localStorage.removeItem('role');
  }, [role]);

  const login = (newToken, userPayload, userRole = 'user') => {
    setToken(newToken);
    setRole(userRole);
    if (userPayload) setUser(userPayload);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const value = { token, role, user, setUser, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}