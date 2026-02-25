import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Storage keys
const STORAGE_KEYS = {
    ASSETS: '@offline_assets',
    PENDING_CHECKS: '@pending_checks',
    LAST_SYNC: '@last_sync',
    LOCATIONS: '@offline_locations',
    DEPARTMENTS: '@offline_departments',
    ASSET_CHUNKS_COUNT: '@asset_chunks_count',
};

const CHUNK_SIZE = 500; // Number of items per chunk

class OfflineService {
    constructor() {
        this.isOnline = true;
    }

    // Set online status
    setOnlineStatus(status) {
        this.isOnline = status;
    }

    // ================== ASSETS CACHING ==================

    /**
     * Download all assets for offline use
     * @returns {Promise<{success: boolean, count: number, message: string}>}
     */
    async downloadAssetsForOffline() {
        try {
            // Step 1: Get total count first or just start paginating
            const firstRes = await api.get('/assets', { params: { page: 1, limit: 100 } });
            if (!firstRes.data.success) {
                return { success: false, count: 0, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' };
            }

            const total = firstRes.data.data.total;
            const totalPages = firstRes.data.data.totalPages;
            let allAssets = firstRes.data.data.items;

            // Step 2: Clear old chunks
            await this.clearAssetChunks();

            // Step 3: Fetch remaining pages
            for (let p = 2; p <= totalPages; p++) {
                const res = await api.get('/assets', { params: { page: p, limit: 100 } });
                if (res.data.success) {
                    allAssets = allAssets.concat(res.data.data.items);
                }
            }

            if (allAssets.length === 0) {
                await AsyncStorage.setItem(STORAGE_KEYS.ASSET_CHUNKS_COUNT, '0');
                return { success: true, count: 0, message: 'ไม่มีข้อมูลครุภัณฑ์' };
            }

            // Step 4: Chunk and save
            const chunks = [];
            for (let i = 0; i < allAssets.length; i += CHUNK_SIZE) {
                chunks.push(allAssets.slice(i, i + CHUNK_SIZE));
            }

            const savePromises = chunks.map((chunk, index) =>
                AsyncStorage.setItem(`${STORAGE_KEYS.ASSETS}_${index}`, JSON.stringify(chunk))
            );

            await Promise.all(savePromises);
            await AsyncStorage.setItem(STORAGE_KEYS.ASSET_CHUNKS_COUNT, chunks.length.toString());
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

            return {
                success: true,
                count: allAssets.length,
                message: `ดาวน์โหลด ${allAssets.length.toLocaleString()} รายการสำเร็จ (${chunks.length} ส่วน)`
            };
        } catch (error) {
            console.error('Error downloading assets:', error);
            return {
                success: false,
                count: 0,
                message: error.message || 'เกิดข้อผิดพลาดในการดาวน์โหลด'
            };
        }
    }

    async clearAssetChunks() {
        try {
            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.ASSET_CHUNKS_COUNT);
            if (countStr) {
                const count = parseInt(countStr);
                const keys = [];
                for (let i = 0; i < count; i++) {
                    keys.push(`${STORAGE_KEYS.ASSETS}_${i}`);
                }
                if (keys.length > 0) await AsyncStorage.multiRemove(keys);
            }
            await AsyncStorage.removeItem(STORAGE_KEYS.ASSETS); // Old legacy key
        } catch (err) {
            console.error('Error clearing chunks:', err);
        }
    }

    /**
     * Get cached assets from local storage
     * @returns {Promise<Array>}
     */
    async getCachedAssets() {
        try {
            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.ASSET_CHUNKS_COUNT);

            // Fallback for legacy data (single row)
            if (countStr === null) {
                const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
                return legacyData ? JSON.parse(legacyData) : [];
            }

            const count = parseInt(countStr);
            if (count === 0) return [];

            const keys = [];
            for (let i = 0; i < count; i++) {
                keys.push(`${STORAGE_KEYS.ASSETS}_${i}`);
            }

            const chunkData = await AsyncStorage.multiGet(keys);
            let allAssets = [];

            chunkData.forEach(([key, value]) => {
                if (value) {
                    try {
                        const parsed = JSON.parse(value);
                        if (Array.isArray(parsed)) allAssets = allAssets.concat(parsed);
                    } catch (e) {
                        console.error(`Error parsing chunk ${key}:`, e);
                    }
                }
            });

            return allAssets;
        } catch (error) {
            console.error('Error getting cached assets:', error);
            return [];
        }
    }

    /**
     * Get last sync time
     * @returns {Promise<string|null>}
     */
    async getLastSyncTime() {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        } catch (error) {
            return null;
        }
    }

    /**
     * Search asset in cached data
     * @param {string} query - barcode, serial number, or asset id
     * @returns {Promise<Object|null>}
     */
    async searchCachedAsset(query) {
        if (!query) return null;

        try {
            const assets = await this.getCachedAssets();
            const searchValue = String(query).toLowerCase();

            // Try to parse JSON QR code
            let parsedId = searchValue;
            try {
                const qrData = typeof query === 'string' && query.startsWith('{') ? JSON.parse(query) : null;
                if (qrData && qrData.id) parsedId = String(qrData.id).toLowerCase();
            } catch {
                // Not JSON, use as is
            }

            return assets.find(
                asset =>
                    String(asset.barcode || '').toLowerCase() === parsedId ||
                    String(asset.barcode || '').toLowerCase() === searchValue ||
                    String(asset.serial_number || '').toLowerCase() === searchValue ||
                    String(asset.asset_id || '').toLowerCase() === searchValue ||
                    String(asset.asset_id || '').toLowerCase() === parsedId
            ) || null;
        } catch (error) {
            console.error('Error searching cached asset:', error);
            return null;
        }
    }

    // ================== PENDING CHECKS QUEUE ==================

    /**
     * Queue a check operation for later sync
     * @param {Object} checkData - The check data to queue
     * @returns {Promise<boolean>}
     */
    async queueCheck(checkData) {
        try {
            const pendingChecks = await this.getPendingChecks();
            const newCheck = {
                ...checkData,
                queued_at: new Date().toISOString(),
                id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            pendingChecks.push(newCheck);
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHECKS, JSON.stringify(pendingChecks));
            return true;
        } catch (error) {
            console.error('Error queuing check:', error);
            return false;
        }
    }

    /**
     * Get all pending checks
     * @returns {Promise<Array>}
     */
    async getPendingChecks() {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHECKS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting pending checks:', error);
            return [];
        }
    }

    /**
     * Get count of pending checks
     * @returns {Promise<number>}
     */
    async getPendingCount() {
        const checks = await this.getPendingChecks();
        return checks.length;
    }

    /**
     * Sync all pending checks to server
     * @returns {Promise<{success: number, failed: number, errors: Array}>}
     */
    async syncPendingChecks() {
        const results = { success: 0, failed: 0, errors: [] };

        try {
            const pendingChecks = await this.getPendingChecks();
            if (pendingChecks.length === 0) {
                return results;
            }

            const stillPending = [];

            for (const check of pendingChecks) {
                try {
                    // Remove queue metadata before sending
                    const { id, queued_at, ...checkData } = check;

                    const response = await api.post('/checks', checkData);
                    if (response.data.success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push({
                            asset_id: check.asset_id,
                            error: response.data.message
                        });
                        stillPending.push(check);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        asset_id: check.asset_id,
                        error: error.message
                    });
                    stillPending.push(check);
                }
            }

            // Update storage with remaining failed items
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHECKS, JSON.stringify(stillPending));

            return results;
        } catch (error) {
            console.error('Error syncing pending checks:', error);
            return results;
        }
    }

    /**
     * Clear a specific pending check by id
     * @param {string} pendingId - The pending check id to remove
     */
    async removePendingCheck(pendingId) {
        try {
            const pendingChecks = await this.getPendingChecks();
            const filtered = pendingChecks.filter(check => check.id !== pendingId);
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHECKS, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error removing pending check:', error);
        }
    }

    /**
     * Clear all pending checks
     */
    async clearAllPendingChecks() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_CHECKS);
        } catch (error) {
            console.error('Error clearing pending checks:', error);
        }
    }

    // ================== OFFLINE STATS ==================

    /**
     * Get offline statistics
     * @returns {Promise<Object>}
     */
    async getOfflineStats() {
        try {
            const assets = await this.getCachedAssets();
            const pendingCount = await this.getPendingCount();
            const lastSync = await this.getLastSyncTime();

            return {
                totalAssets: assets.length,
                pendingChecks: pendingCount,
                lastSync: lastSync,
                hasData: assets.length > 0,
            };
        } catch (error) {
            return {
                totalAssets: 0,
                pendingChecks: 0,
                lastSync: null,
                hasData: false,
            };
        }
    }

    // ================== CACHE MANAGEMENT ==================

    /**
     * Clear all offline data
     */
    async clearAllOfflineData() {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ASSETS,
                STORAGE_KEYS.PENDING_CHECKS,
                STORAGE_KEYS.LAST_SYNC,
                STORAGE_KEYS.LOCATIONS,
                STORAGE_KEYS.DEPARTMENTS,
            ]);
            return true;
        } catch (error) {
            console.error('Error clearing offline data:', error);
            return false;
        }
    }

    /**
     * Get cache size info
     * @returns {Promise<Object>}
     */
    async getCacheInfo() {
        try {
            const assets = await AsyncStorage.getItem(STORAGE_KEYS.ASSETS);
            const pending = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHECKS);

            const assetsSize = assets ? new Blob([assets]).size : 0;
            const pendingSize = pending ? new Blob([pending]).size : 0;

            return {
                assetsSize: this.formatBytes(assetsSize),
                pendingSize: this.formatBytes(pendingSize),
                totalSize: this.formatBytes(assetsSize + pendingSize),
            };
        } catch (error) {
            return { assetsSize: '0 B', pendingSize: '0 B', totalSize: '0 B' };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default new OfflineService();
