import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

// Event emitter สำหรับแจ้งเตือนเมื่อ token หมดอายุ
export const authEventEmitter = {
  listeners: [],
  on(event, callback) {
    if (event === 'logout') {
      this.listeners.push(callback);
    }
  },
  emit(event, data) {
    if (event === 'logout') {
      this.listeners.forEach(callback => callback(data));
    }
  },
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor เพื่อเพิ่ม token ทุกครั้งที่เรียก API
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor สำหรับจัดการ error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear storage when unauthorized
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        console.log('Token cleared due to 401 error');
        // แจ้งเตือนว่า token หมดอายุ
        authEventEmitter.emit('logout', { reason: 'session_expired' });
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

