import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import offlineService from '../services/offlineService';
import { useNetwork } from '../hooks/useNetwork';
import { Ionicons } from '@expo/vector-icons';

export default function AssetsScreen({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { isConnected } = useNetwork();

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchQuery, assets]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // Try to load from cache first (fast)
      const cachedAssets = await offlineService.getCachedAssets();
      if (cachedAssets.length > 0) {
        setAssets(cachedAssets);
        setIsOfflineData(true);
      }

      // Then try to fetch from server
      if (isConnected) {
        try {
          const response = await api.get('/assets');
          if (response.data.success) {
            setAssets(response.data.data || []);
            setIsOfflineData(false);
            // Update cache silently
            await offlineService.downloadAssetsForOffline();
          }
        } catch (error) {
          console.log('Using cached data due to network error');
          // Keep using cached data
        }
      } else if (cachedAssets.length === 0) {
        Alert.alert('ออฟไลน์', 'ไม่มีข้อมูลในเครื่อง กรุณาดาวน์โหลดข้อมูลเมื่อมีอินเทอร์เน็ต');
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownloadForOffline = async () => {
    if (!isConnected) {
      Alert.alert('ออฟไลน์', 'กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อดาวน์โหลดข้อมูล');
      return;
    }
    
    setDownloading(true);
    const result = await offlineService.downloadAssetsForOffline();
    setDownloading(false);
    
    if (result.success) {
      Alert.alert('สำเร็จ', result.message);
      loadAssets(); // Refresh the list
    } else {
      Alert.alert('ผิดพลาด', result.message);
    }
  };

  const filterAssets = () => {
    if (!searchQuery.trim()) {
      setFilteredAssets(assets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = assets.filter(
      (asset) =>
        asset.asset_id?.toLowerCase().includes(query) ||
        asset.asset_name?.toLowerCase().includes(query) ||
        asset.serial_number?.toLowerCase().includes(query) ||
        asset.barcode?.toLowerCase().includes(query)
    );
    setFilteredAssets(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssets();
  };

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

  const renderAssetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.assetItem}
      onPress={() => navigation.navigate('AssetDetail', { asset: item })}
    >
      <View style={styles.assetItemHeader}>
        <View style={styles.assetItemLeft}>
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
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.assetItemDetails}>
        {item.serial_number && (
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.serial_number}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.building_name} {item.room_number}
          </Text>
        </View>
        {item.department_name && (
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.department_name}</Text>
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
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาครุภัณฑ์..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Offline Status Bar */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>โหมดออฟไลน์</Text>
        </View>
      )}

      {/* Offline indicator and download button */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>
            ทั้งหมด {filteredAssets.length} รายการ
            {isOfflineData && <Text style={styles.offlineLabel}> (ข้อมูลออฟไลน์)</Text>}
          </Text>
          <TouchableOpacity 
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]} 
            onPress={handleDownloadForOffline}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={16} color="#fff" />
                <Text style={styles.downloadButtonText}>ดาวน์โหลด</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.asset_id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'ไม่พบข้อมูล' : 'ไม่มีข้อมูลครุภัณฑ์'}
            </Text>
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  assetItem: {
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
  assetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetItemLeft: {
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
  assetItemDetails: {
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
  // Offline mode styles
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    gap: 8,
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineLabel: {
    color: '#F59E0B',
    fontSize: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

