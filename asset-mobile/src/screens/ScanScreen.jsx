import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ScanScreen({ navigation }) {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkStatus, setCheckStatus] = useState('ใช้งานได้');
  const [remark, setRemark] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    await searchAsset(data);
  };

  const searchAsset = async (barcode) => {
    setLoading(true);
    try {
      let foundAsset = null;
      
      // Parse QR Code data (อาจเป็น JSON หรือ string)
      let searchValue = barcode;
      try {
        const qrData = JSON.parse(barcode);
        if (qrData.id) {
          searchValue = qrData.id;
        }
      } catch {
        // ไม่ใช่ JSON ใช้ค่าเดิม
        searchValue = barcode;
      }

      // วิธีที่ 1: ค้นหาจาก /assets ทั้งหมด
      try {
        const response = await api.get('/assets');
        if (response.data.success) {
          foundAsset = response.data.data.find(
            (a) =>
              a.barcode === searchValue ||
              a.serial_number === searchValue ||
              a.asset_id == searchValue ||
              a.barcode === barcode ||
              a.serial_number === barcode ||
              a.asset_id == barcode
          );
        }
      } catch (err) {
        console.log('Method 1 failed:', err.message);
      }

      // วิธีที่ 2: ลอง endpoint /assets/{id}
      if (!foundAsset) {
        try {
          const response = await api.get(`/assets/${searchValue}`);
          if (response.data.success) {
            foundAsset = response.data.data;
          }
        } catch (err) {
          console.log('Method 2 failed:', err.message);
        }
      }

      // วิธีที่ 3: ลอง query parameter
      if (!foundAsset) {
        try {
          const response = await api.get(`/assets?barcode=${encodeURIComponent(searchValue)}`);
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            foundAsset = response.data.data[0];
          }
        } catch (err) {
          console.log('Method 3 failed:', err.message);
        }
      }

      // วิธีที่ 4: ลอง endpoint /assets/barcode/{barcode}
      if (!foundAsset) {
        try {
          const response = await api.get(`/assets/barcode/${encodeURIComponent(searchValue)}`);
          if (response.data.success) {
            foundAsset = response.data.data;
          }
        } catch (err) {
          console.log('Method 4 failed:', err.message);
        }
      }

      if (foundAsset) {
        setScannedAsset(foundAsset);
        setCheckStatus(foundAsset.status || 'ใช้งานได้');
        setRemark('');
        setShowCamera(false);
        Alert.alert('สำเร็จ', `พบครุภัณฑ์: ${foundAsset.asset_name}`);
      } else {
        Alert.alert(
          'ไม่พบข้อมูล', 
          `ไม่พบครุภัณฑ์ที่ตรงกับรหัส: ${searchValue}\n\nลองตรวจสอบ:\n- รหัสครุภัณฑ์ถูกต้องหรือไม่\n- มีครุภัณฑ์นี้ในระบบหรือไม่`
        );
      }
    } catch (error) {
      console.error('Error searching asset:', error);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถค้นหาครุภัณฑ์ได้: ${error.message || 'Unknown error'}`);
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
    if (!scannedAsset) {
      Alert.alert('ผิดพลาด', 'ไม่พบข้อมูลครุภัณฑ์');
      return;
    }

    if (!user) {
      Alert.alert('ผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณา Login ใหม่');
      return;
    }

    setLoading(true);
    try {
      // API จะใช้ user_id จาก authentication token ไม่ต้องส่งใน body
      const requestData = {
        asset_id: scannedAsset.asset_id,
        check_status: checkStatus,
        remark: remark || 'ตรวจสอบผ่าน Mobile App',
        check_date: new Date().toISOString().split('T')[0],
      };

      const response = await api.post('/checks', requestData);

      if (response.data.success) {
        // ดึงข้อมูล asset ใหม่เพื่อแสดงสถานะที่อัพเดตแล้ว
        try {
          const assetResponse = await api.get(`/assets/${scannedAsset.asset_id}`);
          if (assetResponse.data.success) {
            setScannedAsset(assetResponse.data.data);
          }
        } catch (refreshError) {
          console.log('Could not refresh asset data:', refreshError);
          // ไม่จำเป็นต้องแสดง error ถ้าดึงข้อมูลใหม่ไม่สำเร็จ
        }
        
        Alert.alert('สำเร็จ', 'บันทึกการตรวจสอบสำเร็จ\nสถานะครุภัณฑ์ได้ถูกอัพเดตแล้ว', [
          { text: 'OK', onPress: handleReset },
        ]);
      } else {
        Alert.alert('ผิดพลาด', response.data.message || 'ไม่สามารถบันทึกได้');
      }
    } catch (error) {
      console.error('Error checking asset:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // แสดง error message ที่ชัดเจนขึ้น
      let errorMessage = 'ไม่สามารถบันทึกการตรวจสอบได้';
      
      if (error.response) {
        // มี response จาก server
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || '';
        
        if (status === 401) {
          errorMessage = 'Session หมดอายุ กรุณา Logout และ Login ใหม่';
          // Logout user เพื่อให้ redirect ไปหน้า login
          // AuthContext จะจัดการเองเมื่อ token ถูก clear
        } else if (status === 403) {
          errorMessage = 'คุณไม่มีสิทธิ์บันทึกการตรวจสอบ\n\nต้องเป็น Admin หรือ Inspector เท่านั้น';
        } else if (status === 400) {
          errorMessage = message || 'ข้อมูลไม่ถูกต้อง';
        } else if (status === 500) {
          errorMessage = 'เกิดข้อผิดพลาดที่ server: ' + message;
        } else {
          errorMessage = `เกิดข้อผิดพลาด (${status}): ${message}`;
        }
      } else if (error.message) {
        errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
      }
      
      Alert.alert('ผิดพลาด', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedAsset(null);
    setManualBarcode('');
    setCheckStatus('ใช้งานได้');
    setRemark('');
    setScanned(false);
    setShowCamera(false);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.errorText}>กำลังโหลด...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>ไม่ได้รับสิทธิ์ใช้งานกล้อง</Text>
        <Text style={styles.errorSubtext}>
          กรุณาอนุญาตการใช้งานกล้องเพื่อสแกน QR Code
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>ขอสิทธิ์ใช้งานกล้อง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showCamera && permission.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>สแกน QR Code</Text>
        </View>
        <TouchableOpacity
          style={styles.closeCameraButton}
          onPress={() => {
            setShowCamera(false);
            setScanned(false);
          }}
        >
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!scannedAsset ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>ค้นหาครุภัณฑ์</Text>
            <Text style={styles.sectionSubtitle}>
              สแกน QR Code หรือกรอกรหัสครุภัณฑ์
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Barcode / Serial Number / Asset ID"
                placeholderTextColor="#9CA3AF"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                onSubmitEditing={handleManualSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleManualSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="search" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.dividerText}>หรือ</Text>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowCamera(true)}
              disabled={loading}
            >
              <Ionicons name="qr-code-outline" size={32} color="#fff" />
              <Text style={styles.scanButtonText}>สแกน QR Code</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.placeholderContainer}>
            <Ionicons name="cube-outline" size={80} color="#D1D5DB" />
            <Text style={styles.placeholderText}>ยังไม่ได้สแกนครุภัณฑ์</Text>
            <Text style={styles.placeholderSubtext}>
              กรุณาสแกน QR Code หรือกรอกรหัสครุภัณฑ์
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.assetContainer}>
          <View style={styles.assetHeader}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.assetHeaderText}>พบครุภัณฑ์</Text>
          </View>

          <View style={styles.assetInfo}>
            <View style={styles.assetInfoRow}>
              <Text style={styles.assetLabel}>รหัสครุภัณฑ์</Text>
              <Text style={styles.assetValue}>{scannedAsset.asset_id}</Text>
            </View>

            <View style={styles.assetInfoRow}>
              <Text style={styles.assetLabel}>ชื่อครุภัณฑ์</Text>
              <Text style={styles.assetValue}>{scannedAsset.asset_name}</Text>
            </View>

            {scannedAsset.serial_number && (
              <View style={styles.assetInfoRow}>
                <Text style={styles.assetLabel}>Serial Number</Text>
                <Text style={styles.assetValue}>{scannedAsset.serial_number}</Text>
              </View>
            )}

            <View style={styles.assetInfoRow}>
              <Text style={styles.assetLabel}>สถานที่</Text>
              <Text style={styles.assetValue}>
                {scannedAsset.building_name} {scannedAsset.room_number}
              </Text>
            </View>

            <View style={styles.assetInfoRow}>
              <Text style={styles.assetLabel}>สถานะปัจจุบัน</Text>
              <View
                style={[
                  styles.statusBadge,
                  scannedAsset.status === 'ใช้งานได้' && styles.statusBadgeSuccess,
                  scannedAsset.status === 'รอซ่อม' && styles.statusBadgeWarning,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    scannedAsset.status === 'ใช้งานได้' && styles.statusTextSuccess,
                  ]}
                >
                  {scannedAsset.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.checkForm}>
            <Text style={styles.formTitle}>บันทึกการตรวจสอบ</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>สถานะหลังตรวจสอบ</Text>
              <View style={styles.statusButtons}>
                {['ใช้งานได้', 'รอซ่อม', 'รอจำหน่าย', 'จำหน่ายแล้ว', 'ไม่พบ'].map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        checkStatus === status && styles.statusButtonActive,
                      ]}
                      onPress={() => setCheckStatus(status)}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          checkStatus === status && styles.statusButtonTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>หมายเหตุ</Text>
              <TextInput
                style={styles.textArea}
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                placeholderTextColor="#9CA3AF"
                value={remark}
                onChangeText={setRemark}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCheckAsset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>บันทึกการตรวจสอบ</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>สแกนใหม่</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  closeCameraButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8,
  },
  searchContainer: {
    padding: 16,
  },
  searchSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  dividerText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 16,
  },
  scanButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  assetContainer: {
    padding: 16,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  assetHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  assetInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  assetInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  assetLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  assetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusTextSuccess: {
    color: '#065F46',
  },
  checkForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

