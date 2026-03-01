import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import offlineService from '../services/offlineService';
import { useNetwork } from '../hooks/useNetwork';
import { Ionicons } from '@expo/vector-icons';
import { ASSET_STATUS } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function ScanScreen({ navigation }) {
  const { user } = useAuth();
  const { isConnected } = useNetwork();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkStatus, setCheckStatus] = useState(ASSET_STATUS.AVAILABLE);
  const [remark, setRemark] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOfflineResult, setIsOfflineResult] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Load pending count on mount
  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    const count = await offlineService.getPendingCount();
    setPendingCount(count);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    await searchAsset(data);
  };

  const searchAsset = async (barcode) => {
    if (!barcode || !barcode.trim()) return;

    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
    setLoading(true);
    setIsOfflineResult(false);
    try {
      let foundAsset = null;
      let searchValue = barcode;
      let richData = null;

      try {
        const qrData = JSON.parse(barcode);
        if (qrData.id) {
          searchValue = qrData.id;
          richData = qrData;
        }
      } catch {
        searchValue = barcode;
      }

      // 1. Try Rich Data first
      if (richData) {
        foundAsset = {
          asset_id: richData.id,
          asset_name: richData.name,
          barcode: richData.barcode,
          serial_number: richData.serial,
          status: richData.status,
          department_name: richData.dept,
          building_name: richData.building,
          room_number: richData.room
        };
      }

      // 2. Try Cache
      const cached = await offlineService.searchCachedAsset(searchValue);
      if (cached) {
        foundAsset = cached;
        setIsOfflineResult(true);
      }

      // 3. Try API if online
      if (isConnected) {
        try {
          // In the new API structure, searching by ID is better
          const response = await api.get(`/assets/${searchValue}`).catch(() => null);
          if (response?.data?.success) {
            foundAsset = response.data.data;
            setIsOfflineResult(false);
          } else {
            // Fallback: search in list if direct ID lookup fails
            const listRes = await api.get('/assets', { params: { search: searchValue, limit: 1 } });
            if (listRes.data.success && listRes.data.data.items.length > 0) {
              foundAsset = listRes.data.data.items[0];
              setIsOfflineResult(false);
            }
          }
        } catch (err) {
          console.log('Server search failed, using cache:', err.message);
        }
      }

      if (foundAsset) {
        setScannedAsset(foundAsset);
        setCheckStatus(foundAsset.status || ASSET_STATUS.AVAILABLE);
        setRemark('');
        setShowCamera(false);
      } else {
        Alert.alert(
          'ไม่พบข้อมูล',
          `ไม่พบครุภัณฑ์ที่ตรงกับรหัส: ${searchValue}\n\n${!isConnected ? 'กำลังใช้โหมดออฟไลน์' : 'ลองตรวจสอบรหัสครุภัณฑ์อีกครั้ง'}`
        );
      }
    } catch (error) {
      console.error('Error searching asset:', error);
      let errorMessage = 'ไม่สามารถค้นหาครุภัณฑ์ได้';
      if (error.request && !error.response) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ IP Address ในการเชื่อมต่อ';
      }
      Alert.alert('เกิดข้อผิดพลาด', errorMessage);
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอก Barcode หรือรหัสครุภัณฑ์');
      return;
    }
    searchAsset(manualBarcode.trim());
  };

  const handleCheckAsset = async () => {
    if (!scannedAsset) return;
    setLoading(true);

    try {
      const requestData = {
        asset_id: scannedAsset.asset_id,
        check_status: checkStatus,
        remark: remark || 'Mobile Scan Check',
        check_date: new Date().toISOString().split('T')[0],
      };

      if (!isConnected) {
        const queued = await offlineService.queueCheck(requestData);
        if (queued) {
          await loadPendingCount();
          Alert.alert('📋 บันทึกลงคิวแล้ว', 'ข้อมูลจะถูกซิงค์เมื่อเชื่อมต่อเน็ต', [{ text: 'ตกลง', onPress: handleReset }]);
        }
        return;
      }

      const response = await api.post('/checks', requestData);
      if (response.data.success) {
        Alert.alert('สำเร็จ', 'บันทึกการตรวจสอบเรียบร้อยแล้ว', [{ text: 'ตกลง', onPress: handleReset }]);
      }
    } catch (error) {
      console.error('Check failed:', error);

      // If it's a validation error from server, show it instead of falling back to offline
      if (error.response && error.response.status === 400) {
        Alert.alert('ผิดพลาด', error.response.data?.message || 'ข้อมูลไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // Fallback to offline queue for other errors (like network/500)
      const queued = await offlineService.queueCheck({
        asset_id: scannedAsset.asset_id,
        check_status: checkStatus,
        remark: remark || 'Mobile Scan Check (Offline Fallback)',
        check_date: new Date().toISOString().split('T')[0],
      });
      if (queued) {
        await loadPendingCount();
        Alert.alert('📋 ระบบบันทึกลงคิว', 'เกิดข้อผิดพลาดในการส่งข้อมูล แต่เราบันทึกไว้ให้แล้ว', [{ text: 'ตกลง', onPress: handleReset }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPending = async () => {
    if (!isConnected) {
      Alert.alert('ออฟไลน์', 'กรุณาเชื่อมต่ออินเทอร์เน็ต');
      return;
    }
    setLoading(true);
    const results = await offlineService.syncPendingChecks();
    setLoading(false);
    await loadPendingCount();
    Alert.alert('🔄 ซิงค์เสร็จสิ้น', `สำเร็จ: ${results.success}, ล้มเหลว: ${results.failed}`);
  };

  const handleReset = () => {
    setScannedAsset(null);
    setManualBarcode('');
    setCheckStatus(ASSET_STATUS.AVAILABLE);
    setRemark('');
    setScanned(false);
    setShowCamera(false);
    setShowMore(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ASSET_STATUS.AVAILABLE: return '#10B981';
      case ASSET_STATUS.MAINTENANCE: return '#F59E0B';
      case ASSET_STATUS.PENDING_DISPOSAL: return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (showCamera) {
    if (!permission) {
      // Camera permissions are still loading
      return <View style={styles.container}><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    if (!permission.granted) {
      // Camera permissions are not granted yet
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>เราต้องขอสิทธิ์เข้าถึงกล้องเพื่อสแกนรหัส</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>ขอสิทธิ์ใช้งานกล้อง</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={() => setShowCamera(false)}>
            <Text style={styles.cancelLinkText}>ย้อนกลับ</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <StatusBar hidden />
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'codabar']
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.scanTarget}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanInstruction}>วางรหัสในกรอบเพื่อสแกน</Text>
        </View>
        <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setShowCamera(false)}>
          <Ionicons name="close-circle" size={44} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตรวจสอบครุภัณฑ์</Text>
        <View style={styles.headerRight}>
          {!isConnected && <Ionicons name="cloud-offline" size={20} color="#EF4444" />}
          {pendingCount > 0 && (
            <TouchableOpacity style={styles.badgeBtn} onPress={handleSyncPending}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
              <Ionicons name="sync" size={24} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {!scannedAsset ? (
          <View style={styles.mainContent}>
            <View style={styles.introCard}>
              <View style={styles.introIconContainer}>
                <Ionicons name="qr-code" size={40} color="#2563EB" />
              </View>
              <Text style={styles.introTitle}>พร้อมสแกนหรือยัง?</Text>
              <Text style={styles.introText}>สแกน QR Code หรือ Barcode บนตัวครุภัณฑ์เพื่อเริ่มการตรวจสอบ</Text>

              <TouchableOpacity style={styles.bigScanBtn} onPress={() => setShowCamera(true)}>
                <Ionicons name="camera" size={28} color="#fff" />
                <Text style={styles.bigScanBtnText}>เปิดกล้องสแกน</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.manualSearchCard}>
              <Text style={styles.manualLabel}>ค้นหาด้วยรหัสด้วยตนเอง</Text>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="รหัสครุภัณฑ์ / บาร์โค้ด"
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  onSubmitEditing={handleManualSearch}
                />
                <TouchableOpacity style={styles.manualSearchBtn} onPress={handleManualSearch}>
                  <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {/* Found Asset Card */}
            <View style={styles.assetCard}>
              <View style={styles.assetCardHeader}>
                <View style={styles.assetIconBox}>
                  <Ionicons name="cube" size={24} color="#fff" />
                </View>
                <View style={styles.assetHeaderInfo}>
                  <Text style={styles.assetIdText}>{scannedAsset.asset_id}</Text>
                  <Text style={styles.assetNameText} numberOfLines={2}>{scannedAsset.asset_name}</Text>
                </View>
              </View>

              <View style={styles.assetDetailsGrid}>
                <View style={styles.assetDetailItem}>
                  <Text style={styles.detailLabel}>สถานที่</Text>
                  <Text style={styles.detailValue}>{scannedAsset.building_name || '-'} {scannedAsset.room_number || ''}</Text>
                </View>
                <View style={styles.assetDetailItem}>
                  <Text style={styles.detailLabel}>สถานะเดิม</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(scannedAsset.status) }]}>{scannedAsset.status}</Text>
                </View>
              </View>

              {/* Show More Button */}
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => setShowMore(!showMore)}
              >
                <Text style={styles.showMoreText}>
                  {showMore ? 'ย่อรายละเอียด' : 'ดูรายละเอียดเพิ่มเติม'}
                </Text>
                <Ionicons
                  name={showMore ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#3B82F6"
                />
              </TouchableOpacity>

              {/* Expandable Info */}
              {showMore && (
                <View style={styles.expandedInfo}>
                  <View style={styles.detailRow}>
                    <Text style={styles.expandLabel}>ราคาต่อหน่วย:</Text>
                    <Text style={styles.expandValue}>
                      {scannedAsset.price ? Number(scannedAsset.price).toLocaleString('th-TH') + ' บาท' : '-'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.expandLabel}>ปีงบประมาณ:</Text>
                    <Text style={styles.expandValue}>
                      {(() => {
                        if (!scannedAsset.received_date) return '-';
                        const date = new Date(scannedAsset.received_date);
                        const year = date.getFullYear() + 543;
                        return date.getMonth() + 1 >= 10 ? year + 1 : year;
                      })()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.expandLabel}>หน่วยงาน:</Text>
                    <Text style={styles.expandValue}>{scannedAsset.department_name || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.expandLabel}>คณะ/ภาควิชา:</Text>
                    <Text style={styles.expandValue}>{scannedAsset.faculty_name || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.expandLabel}>รหัสโครงการ:</Text>
                    <Text style={styles.expandValue}>{scannedAsset.project_code || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.expandLabel}>รหัสกองทุน/แผน:</Text>
                    <Text style={styles.expandValue}>
                      {scannedAsset.fund_code || '-'}{scannedAsset.plan_code ? ` / ${scannedAsset.plan_code}` : ''}
                    </Text>
                  </View>
                  <View style={styles.descSection}>
                    <Text style={styles.expandLabel}>รายละเอียด:</Text>
                    <Text style={styles.expandValue}>{scannedAsset.description || '-'}</Text>
                  </View>
                </View>
              )}

              {isOfflineResult && (
                <View style={styles.offlineIndicator}>
                  <Ionicons name="cloud-offline" size={12} color="#6B7280" />
                  <Text style={styles.offlineIndicatorText}>แสดงผลจากข้อมูลออฟไลน์</Text>
                </View>
              )}

              {/* Borrow/Return Quick Action */}
              <View style={styles.quickActionContainer}>
                {scannedAsset.status === ASSET_STATUS.AVAILABLE ? (
                  <TouchableOpacity
                    style={styles.borrowQuickBtn}
                    onPress={() => navigation.navigate('Borrows', { scanAsset: scannedAsset })}
                  >
                    <Ionicons name="share-outline" size={20} color="#fff" />
                    <Text style={styles.borrowQuickBtnText}>ยืมครุภัณฑ์นี้</Text>
                  </TouchableOpacity>
                ) : scannedAsset.status === 'ยืม' ? (
                  <TouchableOpacity
                    style={[styles.borrowQuickBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => navigation.navigate('Borrows', { scanAsset: scannedAsset })}
                  >
                    <Ionicons name="return-down-back-outline" size={20} color="#fff" />
                    <Text style={styles.borrowQuickBtnText}>คืนครุภัณฑ์นี้</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Checkin Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>ผลการตรวจสอบ</Text>

              <View style={styles.statusGrid}>
                {[ASSET_STATUS.AVAILABLE, ASSET_STATUS.MAINTENANCE, ASSET_STATUS.PENDING_DISPOSAL, ASSET_STATUS.DISPOSED, ASSET_STATUS.MISSING].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusSelectBtn,
                      checkStatus === status && { backgroundColor: getStatusColor(status) + '20', borderColor: getStatusColor(status) }
                    ]}
                    onPress={() => setCheckStatus(status)}
                  >
                    <View style={[styles.statusRadio, checkStatus === status && { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[styles.statusSelectText, checkStatus === status && { color: getStatusColor(status), fontWeight: 'bold' }]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>หมายเหตุ (ถ้ามี)</Text>
              <TextInput
                style={styles.remarkInput}
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                value={remark}
                onChangeText={setRemark}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCheckAsset} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save" size={22} color="#fff" />
                    <Text style={styles.submitBtnText}>บันทึกการตรวจสอบ</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
                <Text style={styles.cancelBtnText}>ยกเลิกและสแกนใหม่</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    height: 18,
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainContent: {
    padding: 20,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  introIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  bigScanBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  bigScanBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  manualSearchCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  manualSearchBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#4B5563',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContainer: {
    padding: 20,
  },
  assetCard: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  assetCardHeader: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 15,
  },
  assetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetHeaderInfo: {
    flex: 1,
  },
  assetIdText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assetNameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  assetDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetDetailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 5,
  },
  offlineIndicatorText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  quickActionContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 15,
  },
  borrowQuickBtn: {
    backgroundColor: '#3B82F6',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  borrowQuickBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusSelectBtn: {
    width: (width - 100) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusRadio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  statusSelectText: {
    fontSize: 13,
    color: '#4B5563',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  remarkInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanTarget: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanInstruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraCloseBtn: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#374151',
    lineHeight: 26,
  },
  permissionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelLink: {
    marginTop: 20,
    padding: 10,
  },
  cancelLinkText: {
    color: '#6B7280',
    fontSize: 15,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 15,
    gap: 8,
  },
  showMoreText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  expandedInfo: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  expandLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  expandValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 10,
  },
  descSection: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
});



