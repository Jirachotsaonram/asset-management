import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CheckScreen({ navigation }) {
  const [uncheckedAssets, setUncheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUncheckedAssets();
  }, []);

  const loadUncheckedAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/unchecked?days=365');
      if (response.data.success) {
        setUncheckedAssets(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading unchecked assets:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUncheckedAssets();
  };

  const renderAssetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.assetItem}
      onPress={() => navigation.navigate('Scan', { assetId: item.asset_id })}
    >
      <View style={styles.assetItemHeader}>
        <View style={styles.assetItemLeft}>
          <Text style={styles.assetId}>{item.asset_id}</Text>
          <Text style={styles.assetName} numberOfLines={2}>
            {item.asset_name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </View>

      <View style={styles.assetItemDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.building_name} {item.room_number}
          </Text>
        </View>
        {item.last_check_date && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              ตรวจสอบล่าสุด: {new Date(item.last_check_date).toLocaleDateString('th-TH')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ครุภัณฑ์ที่ยังไม่ตรวจสอบ</Text>
        <Text style={styles.headerSubtitle}>
          ทั้งหมด {uncheckedAssets.length} รายการ
        </Text>
      </View>

      <FlatList
        data={uncheckedAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.asset_id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyText}>ไม่มีครุภัณฑ์ที่ต้องตรวจสอบ</Text>
            <Text style={styles.emptySubtext}>ทุกอย่างอัปเดตแล้ว</Text>
          </View>
        }
      />
    </View>
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
  },
  assetItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetItemHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetItemLeft: {
    flex: 1,
  },
  assetId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  assetItemDetails: {
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

