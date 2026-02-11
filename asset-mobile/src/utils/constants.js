import { Platform } from 'react-native';

// สำหรับ development - เปลี่ยนเป็น IP address ของเครื่องที่รัน API
// - iOS Simulator: ใช้ 'http://localhost/asset-management/asset_management_api'
// - Android Emulator: ใช้ 'http://10.0.2.2/asset-management/asset_management_api'
// - อุปกรณ์จริง: ใช้ IP address ของคอมพิวเตอร์ เช่น 'http://192.168.80.1/asset-management/asset_management_api'
// ตรวจสอบ IP address ด้วยคำสั่ง: ipconfig (Windows) หรือ ifconfig (Mac/Linux)

// TODO: แก้ไข IP address นี้ให้ตรงกับ IP ของเครื่องที่รัน API server
// 
// สถานการณ์ที่ 1: PC ปล่อย WiFi Hotspot, มือถือเชื่อมต่อ
//   - ใช้ IP ของ PC (ดูจาก ipconfig)
//   - ตัวอย่าง: 192.168.137.1
//
// สถานการณ์ที่ 2: มือถือปล่อย WiFi Hotspot, PC เชื่อมต่อ
//   - ใช้ IP ของ PC (ไม่ใช่ IP ของมือถือ) เพราะ PC เป็น server ที่รัน API
//   - จาก ipconfig ดูที่ IPv4 Address ของ Wi-Fi adapter
//   - ตัวอย่าง: 10.103.131.243 (IP ที่ PC ได้จาก hotspot ของมือถือ)
//
// หมายเหตุ: ถ้า PC เชื่อมต่อกับ hotspot จากมือถือ
//   - PC จะได้ IP เช่น 10.103.131.243
//   - Gateway จะเป็น IP ของมือถือ เช่น 10.103.131.17
//   - แต่ API URL ต้องใช้ IP ของ PC (10.103.131.243) ไม่ใช่ gateway
const YOUR_IP_ADDRESS = '10.88.226.98'; // IP ของ PC บน WiFi เดียวกัน

// สำหรับ Expo Go บนอุปกรณ์จริง ต้องใช้ IP address ของเครื่องที่รัน API
// สำหรับ Android Emulator ใช้ 10.0.2.2 แทน localhost
// สำหรับ iOS Simulator ใช้ localhost
const DEV_API_URL = Platform.select({
  ios: 'http://localhost/asset-management/asset_management_api', // iOS Simulator
  android: `http://${YOUR_IP_ADDRESS}/asset-management/asset_management_api`, // Android - ใช้ IP จริง
  default: `http://${YOUR_IP_ADDRESS}/asset-management/asset_management_api`, // อุปกรณ์จริง
});

export const API_BASE_URL = __DEV__
  ? DEV_API_URL
  : 'https://your-api-domain.com/asset-management/asset_management_api';

export const ASSET_STATUS = {
  AVAILABLE: 'ใช้งานได้',
  MAINTENANCE: 'รอซ่อม',
  PENDING_DISPOSAL: 'รอจำหน่าย',
  DISPOSED: 'จำหน่ายแล้ว',
  MISSING: 'ไม่พบ'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  INSPECTOR: 'Inspector',
  VIEWER: 'Viewer'
};

