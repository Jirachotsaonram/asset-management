import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { authEventEmitter } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();

    // ฟัง event เมื่อ token หมดอายุ
    const handleLogout = async () => {
      console.log('Session expired, logging out...');
      setUser(null);
      await authService.logout();
    };

    authEventEmitter.on('logout', handleLogout);

    return () => {
      authEventEmitter.removeListener(handleLogout);
    };
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const hasToken = await authService.isAuthenticated();
      
      // ถ้ามี token แต่ไม่มี user หรือ user ไม่ถูกต้อง ให้ลบ token
      if (hasToken && !currentUser) {
        await authService.logout();
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.success) {
      await loadUser();
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

