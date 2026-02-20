import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionTimerRef = useRef(null);
  const activityTimerRef = useRef(null);

  // Session timeout: 30 นาที ไม่มีกิจกรรม จะ logout อัตโนมัติ
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    const tokenExpiry = authService.getTokenExpiry();

    if (currentUser && tokenExpiry) {
      const now = Date.now();
      if (tokenExpiry * 1000 > now) {
        setUser(currentUser);
        // ตั้ง auto-logout เมื่อ token หมดอายุ
        const timeUntilExpiry = (tokenExpiry * 1000) - now;
        sessionTimerRef.current = setTimeout(() => {
          handleLogout();
        }, timeUntilExpiry);
      } else {
        // Token หมดอายุแล้ว → ล้าง session
        authService.logout();
      }
    }
    setLoading(false);

    // Track user activity
    const handleActivity = () => {
      resetActivityTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, []);

  const resetActivityTimer = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    // ถ้าไม่มี activity ใน 30 นาที → auto-logout
    if (user) {
      activityTimerRef.current = setTimeout(() => {
        handleLogout();
      }, SESSION_TIMEOUT);
    }
  }, [user]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.data.user);

    // ตั้ง auto-logout เมื่อ token หมดอายุ
    if (data.data.expires_in) {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = setTimeout(() => {
        handleLogout();
      }, data.data.expires_in * 1000);
    }

    // เริ่ม activity tracking
    resetActivityTimer();
    return data;
  };

  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    window.location.href = '/login';
  }, []);

  const logout = () => {
    handleLogout();
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user && authService.isAuthenticated(),
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};