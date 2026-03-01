const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal
  ? 'http://localhost/asset-management/asset_management_api'
  : 'http://202.44.47.45/asset-management/asset_management_api';

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