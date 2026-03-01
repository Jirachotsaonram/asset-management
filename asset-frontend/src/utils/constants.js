const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal 
  ? 'http://localhost/asset-management/asset_management_api' 
  : 'https://your-domain.com/asset-management/asset_management_api'; // แก้ไขเป็น URL ของ server จริง

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