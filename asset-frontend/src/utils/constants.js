const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '10.40.143.98';

export const API_BASE_URL = isLocal
  ? 'http://localhost/asset-management/asset_management_api'
  : '/api';

export const ASSET_STATUS = {
  AVAILABLE: 'ใช้งาน',
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