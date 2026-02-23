import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, ASSET_STATUS } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function AssetDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { asset: initialAsset } = route.params || {};
  const [asset, setAsset] = useState(initialAsset);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialAsset?.asset_id) {
      fetchAssetDetail();
    }
  }, []);

  const fetchAssetDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assets/${initialAsset.asset_id}`);
      if (response.data.success) {
        setAsset(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching asset detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case ASSET_STATUS.AVAILABLE: return { color: '#10B981', bg: '#D1FAE5' };
      case ASSET_STATUS.MAINTENANCE: return { color: '#F59E0B', bg: '#FEF3C7' };
      case ASSET_STATUS.PENDING_DISPOSAL: return { color: '#EF4444', bg: '#FEE2E2' };
      case ASSET_STATUS.DISPOSED: return { color: '#6B7280', bg: '#F3F4F6' };
      case ASSET_STATUS.MISSING: return { color: '#991B1B', bg: '#FEE2E2' };
      default: return { color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const InfoItem = ({ label, value, icon, fullWidth = false }) => (
    <View style={[styles.infoItem, fullWidth && styles.infoItemFull]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#2563EB" />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );

  if (!asset && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>ไม่พบข้อมูลครุภัณฑ์</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>กลับหน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyle(asset?.status);
  const imageUrl = asset?.image
    ? { uri: `${API_BASE_URL.replace('/api', '')}/${asset.image}` }
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView bounces={false} style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Image Section */}
        <View style={styles.imageHeaderContainer}>
          {imageUrl ? (
            <Image source={imageUrl} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, styles.placeholderImage]}>
              <Ionicons name="cube-outline" size={80} color="#D1D5DB" />
            </View>
          )}

          {/* Top Actions */}
          <SafeAreaView style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActionRight}>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{asset?.status}</Text>
              </View>
            </View>
          </SafeAreaView>

          {/* Asset Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.assetIdLabel}>{asset?.asset_id}</Text>
            <Text style={styles.assetNameTitle}>{asset?.asset_name}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
              <Text style={styles.cardTitle}>ข้อมูลพื้นฐาน</Text>
            </View>
            <View style={styles.grid}>
              <InfoItem label="Serial Number" value={asset?.serial_number} icon="barcode-outline" />
              <InfoItem label="Barcode" value={asset?.barcode} icon="qr-code-outline" />
              <InfoItem label="จำนวน" value={`${asset?.quantity || 1} ${asset?.unit || ''}`} icon="apps-outline" />
              <InfoItem label="ราคา" value={asset?.price ? `${Number(asset.price).toLocaleString('th-TH')} ฿` : '-'} icon="cash-outline" />
              <InfoItem label="วันที่ได้รับ" value={asset?.received_date} icon="calendar-outline" />
              <InfoItem label="หน่วยงาน" value={asset?.department_name} icon="business-outline" />
            </View>
          </View>

          {/* Location Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color="#2563EB" />
              <Text style={styles.cardTitle}>สถานที่และตำแหน่ง</Text>
            </View>
            <View style={styles.grid}>
              <InfoItem label="อาคาร" value={asset?.building_name} icon="map-outline" />
              <InfoItem label="อาคาร (ระบุเอง)" value={asset?.room_text} icon="create-outline" />
              <InfoItem label="ชั้น" value={asset?.floor} icon="layers-outline" />
              <InfoItem label="ห้อง" value={asset?.room_number} icon="door-open-outline" />
              <InfoItem label="คณะ" value={asset?.faculty_name} icon="school-outline" fullWidth />
            </View>
          </View>

          {/* Finance & Project Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet" size={20} color="#2563EB" />
              <Text style={styles.cardTitle}>การเงินและโครงการ</Text>
            </View>
            <View style={styles.grid}>
              <InfoItem label="รหัสกองทุน" value={asset?.fund_code} icon="cash-outline" />
              <InfoItem label="รหัสแผน" value={asset?.plan_code} icon="document-text-outline" />
              <InfoItem label="รหัสโครงการ" value={asset?.project_code} icon="construct-outline" />
              <InfoItem label="เลขที่ใบส่งของ" value={asset?.delivery_number} icon="clipboard-outline" />
            </View>
          </View>

          {/* Extra Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-attach" size={20} color="#2563EB" />
              <Text style={styles.cardTitle}>รายละเอียดเพิ่มเติม</Text>
            </View>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{asset?.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</Text>
            </View>
            {asset?.reference_number && (
              <View style={styles.refBox}>
                <Text style={styles.refLabel}>อ้างอิงใบตรวจรับ:</Text>
                <Text style={styles.refValue}>{asset.reference_number}</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={() => navigation.navigate('Scan', { assetId: asset?.asset_id })}
        >
          <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
          <Text style={styles.mainActionButtonText}>ตรวจสอบครุภัณฑ์นี้</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageHeaderContainer: {
    height: 350,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionRight: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  assetIdLabel: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  assetNameTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  detailsContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  infoItem: {
    width: (width - 100) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItemFull: {
    width: '100%',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  descriptionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  refBox: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
  },
  refLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  refValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mainActionButton: {
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  mainActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});



