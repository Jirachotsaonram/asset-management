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

export default function BorrowsScreen({ navigation }) {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBorrows();
  }, []);

  const loadBorrows = async () => {
    try {
      setLoading(true);
      const response = await api.get('/borrows');
      if (response.data.success) {
        setBorrows(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading borrows:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการยืม-คืนได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBorrows();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'borrowed':
        return '#F59E0B';
      case 'returned':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'borrowed':
        return 'กำลังยืม';
      case 'returned':
        return 'คืนแล้ว';
      default:
        return status;
    }
  };

  const renderBorrowItem = ({ item }) => (
    <TouchableOpacity style={styles.borrowItem}>
      <View style={styles.borrowItemHeader}>
        <View style={styles.borrowItemLeft}>
          <Text style={styles.assetId}>{item.asset_id}</Text>
          <Text style={styles.assetName} numberOfLines={1}>
            {item.asset_name}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.borrowItemDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.borrower_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            ยืม: {new Date(item.borrow_date).toLocaleDateString('th-TH')}
          </Text>
        </View>
        {item.return_date && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              คืน: {new Date(item.return_date).toLocaleDateString('th-TH')}
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
        <Text style={styles.headerTitle}>การยืม-คืน</Text>
        <Text style={styles.headerSubtitle}>ทั้งหมด {borrows.length} รายการ</Text>
      </View>

      <FlatList
        data={borrows}
        renderItem={renderBorrowItem}
        keyExtractor={(item, index) =>
          item.borrow_id?.toString() || index.toString()
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>ไม่มีข้อมูลการยืม-คืน</Text>
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
  borrowItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  borrowItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  borrowItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  assetId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  borrowItemDetails: {
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
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});

