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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AssetDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { asset } = route.params || {};
  const [loading, setLoading] = useState(!asset);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ใช้งานได้':
        return '#10B981';
      case 'รอซ่อม':
        return '#F59E0B';
      case 'รอจำหน่าย':
        return '#EF4444';
      case 'จำหน่ายแล้ว':
        return '#6B7280';
      case 'ไม่พบ':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      {icon && <Ionicons name={icon} size={20} color="#6B7280" style={styles.infoIcon} />}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!asset) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>ไม่พบข้อมูลครุภัณฑ์</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายละเอียดครุภัณฑ์</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Asset ID Badge */}
        <View style={styles.assetIdBadge}>
          <Text style={styles.assetIdText}>{asset.asset_id}</Text>
        </View>

        {/* Asset Name */}
        <Text style={styles.assetName}>{asset.asset_name}</Text>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(asset.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(asset.status) }]}>
            {asset.status}
          </Text>
        </View>

        {/* Image */}
        {asset.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: asset.image }}
              style={styles.assetImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลครุภัณฑ์</Text>
          <View style={styles.infoCard}>
            <InfoRow label="รหัสครุภัณฑ์" value={asset.asset_id} icon="barcode-outline" />
            <InfoRow label="Serial Number" value={asset.serial_number} icon="code-outline" />
            <InfoRow label="Barcode" value={asset.barcode} icon="qr-code-outline" />
            <InfoRow label="จำนวน" value={`${asset.quantity} ${asset.unit || 'หน่วย'}`} icon="cube-outline" />
            <InfoRow label="ราคา" value={`${parseFloat(asset.price || 0).toLocaleString('th-TH')} บาท`} icon="cash-outline" />
            <InfoRow label="วันที่ได้รับ" value={asset.received_date ? new Date(asset.received_date).toLocaleDateString('th-TH') : '-'} icon="calendar-outline" />
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>สถานที่ตั้ง</Text>
          <View style={styles.infoCard}>
            <InfoRow label="อาคาร" value={asset.building_name} icon="business-outline" />
            <InfoRow label="ชั้น" value={asset.floor} icon="layers-outline" />
            <InfoRow label="ห้อง" value={asset.room_number} icon="location-outline" />
            <InfoRow label="หน่วยงาน" value={asset.department_name} icon="people-outline" />
          </View>
        </View>

        {/* Check History Section */}
        {asset.last_check_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ประวัติการตรวจสอบ</Text>
            <View style={styles.infoCard}>
              <InfoRow label="ตรวจสอบล่าสุด" value={new Date(asset.last_check_date).toLocaleDateString('th-TH')} icon="checkmark-circle-outline" />
              <InfoRow label="ผู้ตรวจสอบ" value={asset.last_checker} icon="person-outline" />
              {asset.last_check_status && (
                <InfoRow label="สถานะการตรวจสอบ" value={asset.last_check_status} icon="clipboard-outline" />
              )}
              {asset.next_check_date && (
                <InfoRow label="ตรวจสอบครั้งต่อไป" value={new Date(asset.next_check_date).toLocaleDateString('th-TH')} icon="calendar-outline" />
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scan', { assetId: asset.asset_id })}
          >
            <Ionicons name="qr-code-outline" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>สแกน QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  assetIdBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  assetIdText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  assetName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetImage: {
    width: '100%',
    height: 200,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 8,
    marginBottom: 32,
  },
  scanButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
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
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
});

