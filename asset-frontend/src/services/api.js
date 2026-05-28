import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Interceptor เพื่อแก้ปัญหา URL และ Token
api.interceptors.request.use(
  (config) => {
    // แก้ปัญหา 404: ถ้า URL เริ่มด้วย / ให้ตัดออกเพื่อให้ต่อกับ baseURL ได้ถูกต้อง
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    // ลบ Content-Type ถ้าเป็นการส่งไฟล์ (FormData)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = localStorage.getItem('token');
    if (token) {
      // ตรวจสอบ token expiry ก่อนส่ง request
      const expiry = localStorage.getItem('token_expiry');
      if (expiry && Date.now() / 1000 > parseInt(expiry)) {
        // Token หมดอายุ → ล้าง session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expiry');
        localStorage.removeItem('last_activity');
        window.location.href = '#/login';
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
      // ส่งผ่าน Custom Header เผื่อกรณีที่เซิร์ฟเวอร์มหาลัย (Apache) ริบ Authorization ทิ้ง
      config.headers['X-Auth-Token'] = token;
      
      // ไม้ตายสุดท้าย: ส่งผ่าน Query Parameter
      if (config.method === 'get') {
        config.params = { ...config.params, token: token };
      } else {
        // สำหรับ POST/PUT/DELETE
        if (config.url.includes('?')) {
          config.url += `&token=${token}`;
        } else {
          config.url += `?token=${token}`;
        }
      }
    }
    // อัปเดต last activity
    localStorage.setItem('last_activity', Date.now().toString());
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor สำหรับจัดการ error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token ไม่ถูกต้องหรือหมดอายุ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('last_activity');
      window.location.href = '#/login';
    } else if (error.response?.status === 429) {
      // Rate limited
      console.warn('Rate limited - too many requests');
    }
    return Promise.reject(error);
  }
);

export default api;