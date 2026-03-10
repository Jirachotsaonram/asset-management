import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, buildApiUrl } from '../utils/constants';

export const SERVER_IP_KEY = 'custom_server_ip';

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

// Interceptor เพื่อเพิ่ม token และตรวจสอบ IP แบบ Dynamic ทุกครั้งที่เรียก API
api.interceptors.request.use(
  async (config) => {
    try {
      // โหลด custom IP ที่ผู้ใช้ตั้งค่าไว้
      const customIp = await AsyncStorage.getItem(SERVER_IP_KEY);
      if (customIp && customIp.trim()) {
        config.baseURL = buildApiUrl(customIp.trim());
      }

      // เพิ่ม token ใน header
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
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
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        authEventEmitter.emit('logout', { reason: 'session_expired' });
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
