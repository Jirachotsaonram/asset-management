import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      // เก็บข้อมูล token expiry
      if (response.data.data.expires_in) {
        const expiryTime = Math.floor(Date.now() / 1000) + response.data.data.expires_in;
        localStorage.setItem('token_expiry', expiryTime.toString());
      }
      localStorage.setItem('last_activity', Date.now().toString());
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('last_activity');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getTokenExpiry() {
    const expiry = localStorage.getItem('token_expiry');
    return expiry ? parseInt(expiry) : null;
  },

  isTokenExpired() {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() / 1000 > expiry;
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    // ตรวจสอบว่า token หมดอายุหรือไม่
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  },

  updateLastActivity() {
    localStorage.setItem('last_activity', Date.now().toString());
  }
};