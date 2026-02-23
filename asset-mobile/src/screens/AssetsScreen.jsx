import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Modal,
  Image,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import offlineService from '../services/offlineService';
import { useNetwork } from '../hooks/useNetwork';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, ASSET_STATUS } from '../utils/constants';

const ITEMS_PER_PAGE = 20;

export default function AssetsScreen({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    building: 'all',
    floor: 'all'
  });

  // Metadata for filters
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [uniqueBuildings, setUniqueBuildings] = useState([]);
  const [uniqueFloors, setUniqueFloors] = useState([]);

  const { isConnected } = useNetwork();
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchMetadata();
    loadAssets(1, true);
  }, []);

  const fetchMetadata = async () => {
    try {
      const [deptRes, locRes] = await Promise.all([
        api.get('/departments'),
        api.get('/locations')
      ]);

      if (deptRes.data.success) {
        setDepartments(deptRes.data.data || []);
      }

      if (locRes.data.success) {
        const locs = locRes.data.data || [];
        setLocations(locs);

        // Extract unique buildings and floors
        const buildings = [...new Set(locs.map(l => l.building_name).filter(Boolean))];
        const floors = [...new Set(locs.map(l => l.floor).filter(Boolean))].sort((a, b) => a - b);

        setUniqueBuildings(buildings);
        setUniqueFloors(floors);
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const loadAssets = async (pageNum = 1, shouldRefresh = false) => {
    if (pageNum === 1) {
      if (shouldRefresh) setRefreshing(true);
      else setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      if (!isConnected) {
        const cached = await offlineService.getCachedAssets();
        // Client-side filtering for offline mode
        const filtered = cached.filter(asset => {
          const matchSearch = !searchQuery ||
            asset.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.asset_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());

          const matchStatus = filters.status === 'all' || asset.status === filters.status;
          const matchDept = filters.department === 'all' || String(asset.department_id) === String(filters.department);
          const matchBuilding = filters.building === 'all' || asset.building_name === filters.building;
          const matchFloor = filters.floor === 'all' || String(asset.floor) === String(filters.floor);

          return matchSearch && matchStatus && matchDept && matchBuilding && matchFloor;
        });

        setAssets(filtered);
        setTotalItems(filtered.length);
        setHasMore(false);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      const params = {
        page: pageNum,
        limit: ITEMS_PER_PAGE,
        sort: 'created_at',
        order: 'DESC'
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.department !== 'all') params.department_id = filters.department;
      if (filters.building !== 'all') params.building = filters.building;
      if (filters.floor !== 'all') params.floor = filters.floor;

      const response = await api.get('/assets', { params });

      if (response.data.success) {
        const data = response.data.data;
        const newItems = data.items || [];
        const total = data.total || 0;

        if (pageNum === 1) {
          setAssets(newItems);
        } else {
          setAssets(prev => [...prev, ...newItems]);
        }

        setTotalItems(total);
        setPage(pageNum);
        setHasMore(assets.length + newItems.length < total);

        // Update offline cache if it's the first page of a refresh
        if (pageNum === 1 && !searchQuery && Object.values(filters).every(v => v === 'all')) {
          // Ideally we'd only update cache for certain conditions
          // async function to update cache in background
          offlineService.downloadAssetsForOffline().catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setPage(1);
    loadAssets(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && isConnected) {
      loadAssets(page + 1);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadAssets(1);
    }, 500);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    setPage(1);
    loadAssets(1);
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      department: 'all',
      building: 'all',
      floor: 'all'
    });
    // Closing modal and loading will happen if user clicks apply or we can do it here
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

  const renderAssetItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    // Normalize image path - remove '/api' if it's there
    const imageUrl = item.image
      ? { uri: `${API_BASE_URL.replace('/api', '')}/${item.image}` }
      : null;

    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => navigation.navigate('AssetDetail', { asset: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={imageUrl} style={styles.assetImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.assetIdText}>{item.asset_id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.assetNameText} numberOfLines={1}>{item.asset_name}</Text>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.building_name || 'ไม่ระบุ'} {item.floor ? `ชั้น ${item.floor}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="business-outline" size={12} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.department_name || '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.footerLoaderText}>กำลังโหลดเพิ่ม...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Search & Header */}
      <View style={styles.headerContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="ค้นชื่อ, ID, Barcode..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, Object.values(filters).some(v => v !== 'all') && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="filter"
            size={22}
            color={Object.values(filters).some(v => v !== 'all') ? "#fff" : "#4B5563"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: '#10B981', borderColor: '#059669' }]}
          onPress={() => navigation.navigate('AssetEdit', { mode: 'add' })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {loading ? 'กำลังโหลด...' : `รายการทั้งหมด ${totalItems.toLocaleString()} รายการ`}
        </Text>
        {!isConnected && (
          <View style={styles.offlineTag}>
            <Ionicons name="cloud-offline" size={12} color="#EF4444" />
            <Text style={styles.offlineTagText}>ออฟไลน์</Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>กำลังดึงข้อมูล...</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.asset_id}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>ไม่พบข้อมูลครุภัณฑ์</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>ลองใหม่อีกครั้ง</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ตัวกรองขั้นสูง</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.filterLabel}>สถานะ</Text>
              <View style={styles.filterOptions}>
                {['all', ...Object.values(ASSET_STATUS)].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.optionChip, filters.status === status && styles.optionChipSelected]}
                    onPress={() => setFilters(prev => ({ ...prev, status }))}
                  >
                    <Text style={[styles.optionChipText, filters.status === status && styles.optionChipTextSelected]}>
                      {status === 'all' ? 'ทั้งหมด' : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>อาคาร</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {['all', ...uniqueBuildings].map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.optionChip, filters.building === b && styles.optionChipSelected]}
                    onPress={() => setFilters(prev => ({ ...prev, building: b }))}
                  >
                    <Text style={[styles.optionChipText, filters.building === b && styles.optionChipTextSelected]}>
                      {b === 'all' ? 'ทั้งหมด' : b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>ชั้น</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {['all', ...uniqueFloors].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.optionChip, filters.floor === String(f) && styles.optionChipSelected]}
                    onPress={() => setFilters(prev => ({ ...prev, floor: String(f) }))}
                  >
                    <Text style={[styles.optionChipText, filters.floor === String(f) && styles.optionChipTextSelected]}>
                      {f === 'all' ? 'ทั้งหมด' : `ชั้น ${f}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>หน่วยงาน</Text>
              <View style={styles.selectContainer}>
                {/* Simple mapping for departments as chips to keep it premium look */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {['all', ...departments].map(d => (
                    <TouchableOpacity
                      key={d === 'all' ? 'all' : d.department_id}
                      style={[
                        styles.optionChip,
                        (d === 'all' ? filters.department === 'all' : String(filters.department) === String(d.department_id)) && styles.optionChipSelected
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, department: d === 'all' ? 'all' : d.department_id }))}
                    >
                      <Text style={[
                        styles.optionChipText,
                        (d === 'all' ? filters.department === 'all' : String(filters.department) === String(d.department_id)) && styles.optionChipTextSelected
                      ]}>
                        {d === 'all' ? 'ทั้งหมด' : d.department_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetModalButton} onPress={resetFilters}>
                <Text style={styles.resetModalButtonText}>รีเซ็ต</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>นำไปใช้</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  offlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  offlineTagText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  assetCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  assetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assetIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  assetNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: '90%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  footerLoaderText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  optionChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  optionChipText: {
    fontSize: 14,
    color: '#4B5563',
  },
  optionChipTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  horizontalScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  resetModalButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  resetModalButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


