import axios from 'axios';

// --------------------------------------------------------
// 1. การจัดการ Base URL (ใช้ Environment Variable เพื่อความยืดหยุ่น)
// --------------------------------------------------------
// URL ฐานของ API ที่คุณยืนยันมา
// (ใช้ import.meta.env.VITE_API_BASE_URL ถ้าใช้ Vite/React)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/asset-management/asset_api/';


// --------------------------------------------------------
// 2. ฟังก์ชัน API สำหรับ Authentication (login.php)
// --------------------------------------------------------
/**
 * ฟังก์ชันสำหรับ Login
 * @param {string} username - ชื่อบัญชีผู้ใช้
 * @param {string} password - รหัสผ่าน
 */
export const login = async (username, password) => {
    try {
        const response = await axios.post(API_BASE_URL + 'login.php', {
            username,
            password,
        });
        
        if (response.data.success) {
            return response.data; // { success: true, user: {...} }
        } else {
            throw new Error(response.data.message || 'Login failed.');
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Server connection error. Check if API is running.');
    }
};


// --------------------------------------------------------
// 3. ฟังก์ชัน API สำหรับ Assets (CRUD)
// --------------------------------------------------------

/**
 * ดึงรายการครุภัณฑ์ทั้งหมด (get_assets.php)
 */
export const getAssets = async () => {
    try {
        const response = await axios.get(API_BASE_URL + 'get_assets.php');
        if (response.data.success) {
            return response.data.data; // Array ของ Assets
        } else {
            throw new Error('Failed to fetch assets.');
        }
    } catch (error) {
        throw new Error(error.message || 'Error fetching asset data.');
    }
};

/**
 * เพิ่มครุภัณฑ์ใหม่ (add_asset.php)
 * @param {object} assetData - ข้อมูลครุภัณฑ์ที่ต้องการเพิ่ม
 */
export const addAsset = async (assetData) => {
    try {
        const response = await axios.post(API_BASE_URL + 'add_asset.php', assetData);
        if (response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to add asset.');
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error adding asset.');
    }
};

/**
 * แก้ไขข้อมูลครุภัณฑ์ (update_asset.php)
 * @param {object} assetData - ข้อมูลครุภัณฑ์ที่ต้องการแก้ไข (ต้องมี asset_id)
 */
export const updateAsset = async (assetData) => {
    try {
        // ใช้ POST method ใน PHP แต่ตั้งใจให้ทำหน้าที่เป็น PUT/PATCH
        const response = await axios.post(API_BASE_URL + 'update_asset.php', assetData); 
        if (response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to update asset.');
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error updating asset.');
    }
};


// --------------------------------------------------------
// 4. ฟังก์ชัน API สำหรับ Master Data (Locations, Departments)
// --------------------------------------------------------

/**
 * ดึงรายการ Master Data ทั้งหมด (Locations)
 */
export const getLocations = async () => {
    const response = await axios.get(API_BASE_URL + 'manage_locations.php');
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error('Failed to fetch locations.');
};

/**
 * ดึงรายการ Master Data ทั้งหมด (Departments)
 */
export const getDepartments = async () => {
    const response = await axios.get(API_BASE_URL + 'manage_departments.php');
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error('Failed to fetch departments.');
};


// --------------------------------------------------------
// 5. ฟังก์ชัน API สำหรับ Mobile/Inspector (Scan, Check, Move)
// --------------------------------------------------------

/**
 * ดึงข้อมูลครุภัณฑ์ด้วย Barcode (get_asset_by_barcode.php)
 * @param {string} barcode - Barcode หรือ QR Code ที่สแกนมา
 */
export const getAssetByBarcode = async (barcode) => {
    try {
        const response = await axios.get(API_BASE_URL + 'get_asset_by_barcode.php', {
            params: { barcode }
        });
        
        if (response.data.success) {
            return response.data.data; // ข้อมูลครุภัณฑ์ 1 รายการ
        } else {
            throw new Error(response.data.message || 'Asset not found for the provided barcode.');
        }
    } catch (error) {
        // จัดการ Error 404/500
        throw new Error(error.response?.data?.message || 'Error fetching asset by barcode.');
    }
};

/**
 * บันทึกผลการตรวจสอบครุภัณฑ์ (check_asset.php)
 * @param {object} checkData - ข้อมูลผลการตรวจสอบ
 */
export const recordAssetCheck = async (checkData) => {
    try {
        const response = await axios.post(API_BASE_URL + 'check_asset.php', checkData);
        if (response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to record asset check.');
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error recording asset check.');
    }
};

/**
 * บันทึกการเคลื่อนย้ายครุภัณฑ์ (move_asset.php)
 * @param {object} moveData - ข้อมูลการเคลื่อนย้าย
 */
export const recordAssetMove = async (moveData) => {
    try {
        const response = await axios.post(API_BASE_URL + 'move_asset.php', moveData);
        if (response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to record asset move.');
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error recording asset move.');
    }
};