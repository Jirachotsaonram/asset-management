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
import {
  TextInput,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';

const OVERDUE_THRESHOLD_DAYS = 365;
const CRITICAL_OVERDUE_DAYS = 730; // 2 years

export default function CheckScreen({ navigation }) {
  const [uncheckedAssets, setUncheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    days: 365,
    building: 'all',
    floor: 'all',
    department_id: 'all'
  });
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const searchTimeout = React.useRef(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch data whenever filters or searchQuery changes
  useEffect(() => {
    const controller = new AbortController();

    // Use a small timeout for debouncing searches, but fetch immediately for filter chips
    const delay = searchQuery ? 500 : 0;
    const timeoutId = setTimeout(() => {
      loadUncheckedAssets(1, false, controller.signal);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [filters, searchQuery]);

  const fetchFilterOptions = async () => {
    try {
      const [locRes, deptRes] = await Promise.all([
        api.get('/locations'),
        api.get('/departments')
      ]);

      if (locRes.data.success) {
        // Handle null building names by replacing them with a displayable label
        const uniqueBuildings = [...new Set(locRes.data.data.map(l => l.building_name || 'ไม่ระบุอาคาร'))].sort();
        setBuildings(uniqueBuildings);
      }
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const loadUncheckedAssets = async (pageNum = 1, isRefresh = false, signal = null) => {
    try {
      if (pageNum === 1) {
        setLoading(!isRefresh);
        if (!isRefresh) {
          setUncheckedAssets([]); // Clear list for initial load
          setTotal(0);
        }
      } else {
        setLoadingMore(true);
      }

      const params = {
        days: filters.days,
        page: pageNum,
        limit: 20,
        search: searchQuery || undefined,
        building: filters.building !== 'all' ? filters.building : undefined,
        floor: filters.floor !== 'all' ? filters.floor : undefined,
        department_id: filters.department_id !== 'all' ? filters.department_id : undefined,
      };

      const response = await api.get('/reports/unchecked', { params, signal });

      if (response.data.success) {
        const data = response.data.data;
        const newItems = data.items || [];
        const totalItems = data.total || 0;

        if (pageNum === 1) {
          setUncheckedAssets(newItems);
          setHasMore(newItems.length < totalItems);
        } else {
          setUncheckedAssets(prev => {
            const existingIds = new Set(prev.map(a => a.asset_id));
            const uniqueNewItems = newItems.filter(item => !existingIds.has(item.asset_id));
            const updated = [...prev, ...uniqueNewItems];
            setHasMore(updated.length < totalItems);
            return updated;
          });
        }

        setTotal(totalItems);
        setPage(pageNum);
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('Error loading unchecked assets:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    // debouncing is handled by useEffect dependency and maybe a small delay if needed,
    // but React state updates are better handled directly here for UX
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    onRefresh();
  };

  const resetFilters = () => {
    setFilters({
      days: 365,
      building: 'all',
      floor: 'all',
      department_id: 'all'
    });
  };

  const getUrgencyInfo = (days) => {
    if (!days || days === null) return { color: '#2563EB', text: 'ยังไม่เคยตรวจสอบ', bg: '#EFF6FF' };
    if (days >= CRITICAL_OVERDUE_DAYS) return { color: '#DC2626', text: `เกินกำหนด ${Math.floor(days / 365)} ปี+`, bg: '#FEF2F2' };
    if (days >= OVERDUE_THRESHOLD_DAYS) return { color: '#EA580C', text: 'เกินกำหนด 1 ปี', bg: '#FFF7ED' };
    return { color: '#6B7280', text: `ตรวจสอบเมื่อ ${days} วันที่แล้ว`, bg: '#F9FAFB' };
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadUncheckedAssets(1, true);
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      loadUncheckedAssets(page + 1);
    }
  };

  const renderAssetItem = React.useCallback(({ item }) => {
    const urgency = getUrgencyInfo(item.days_since_check);

    return (
      <TouchableOpacity
        style={styles.assetItem}
        onPress={() => navigation.navigate('Scan', { assetId: item.asset_id })}
        activeOpacity={0.7}
      >
        <View style={styles.assetItemHeader}>
          <View style={styles.assetItemLeft}>
            <Text style={styles.assetId}>{item.asset_id}</Text>
            <Text style={styles.assetName} numberOfLines={2}>
              {item.asset_name}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </View>

        <View style={styles.assetItemDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.location}
            </Text>
          </View>

          <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
            <Ionicons name="time-outline" size={12} color={urgency.color} />
            <Text style={[styles.urgencyText, { color: urgency.color }]}>
              {urgency.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  };

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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>ตรวจสอบครุภัณฑ์</Text>
            <Text style={styles.headerSubtitle}>
              มี {total} รายการที่ต้องตรวจสอบ
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={20} color="#2563EB" />
            <Text style={styles.filterBtnText}>ตัวกรอง</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหารหัส หรือชื่อครุภัณฑ์..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.buildingScroll}
          contentContainerStyle={styles.buildingScrollContent}
        >
          <TouchableOpacity
            style={[styles.buildingChip, filters.building === 'all' && styles.activeBuildingChip]}
            onPress={() => {
              setFilters(prev => ({ ...prev, building: 'all' }));
            }}
          >
            <Text style={[styles.buildingChipText, filters.building === 'all' && styles.activeBuildingChipText]}>
              ทั้งหมด
            </Text>
          </TouchableOpacity>
          {buildings.map(b => (
            <TouchableOpacity
              key={b || 'unspecified'}
              style={[styles.buildingChip, filters.building === b && styles.activeBuildingChip]}
              onPress={() => {
                setFilters(prev => ({ ...prev, building: b }));
              }}
            >
              <Text style={[styles.buildingChipText, filters.building === b && styles.activeBuildingChipText]}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={uncheckedAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.asset_id?.toString()}
        contentContainerStyle={styles.listContainer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
        }
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyText}>ไม่พบครุภัณฑ์ที่ต้องตรวจสอบ</Text>
            <Text style={styles.emptySubtext}>ลองเปลี่ยนเงื่อนไขการค้นหา</Text>
          </View>
        }
      />

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
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalLabel}>เกินกำหนดตรวจสอบ (วัน)</Text>
              <View style={styles.dayOptions}>
                {[30, 90, 180, 365].map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayOption, filters.days === d && styles.activeDayOption]}
                    onPress={() => setFilters(prev => ({ ...prev, days: d }))}
                  >
                    <Text style={[styles.dayOptionText, filters.days === d && styles.activeDayOptionText]}>
                      {d} วัน
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>หน่วยงาน</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalChipScroll}>
                <TouchableOpacity
                  style={[styles.modalChip, filters.department_id === 'all' && styles.activeModalChip]}
                  onPress={() => setFilters(prev => ({ ...prev, department_id: 'all' }))}
                >
                  <Text style={[styles.modalChipText, filters.department_id === 'all' && styles.activeModalChipText]}>
                    ทั้งหมด
                  </Text>
                </TouchableOpacity>
                {departments.map(d => (
                  <TouchableOpacity
                    key={d.department_id}
                    style={[styles.modalChip, filters.department_id === d.department_id && styles.activeModalChip]}
                    onPress={() => setFilters(prev => ({ ...prev, department_id: d.department_id }))}
                  >
                    <Text style={[styles.modalChipText, filters.department_id === d.department_id && styles.activeModalChipText]}>
                      {d.department_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>ชั้น</Text>
              <View style={styles.dayOptions}>
                {['all', '1', '2', '3', '4', '5', 'ไม่ระบุชั้น'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.dayOption, filters.floor === f && styles.activeDayOption]}
                    onPress={() => setFilters(prev => ({ ...prev, floor: f }))}
                  >
                    <Text style={[styles.dayOptionText, filters.floor === f && styles.activeDayOptionText]}>
                      {f === 'all' ? 'ทั้งหมด' : (f === 'ไม่ระบุชั้น' ? 'ไม่ระบุชั้น' : `ชั้น ${f}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>ล้างทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>นำไปใช้</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  buildingScroll: {
    marginTop: 15,
  },
  buildingScrollContent: {
    paddingRight: 20,
    gap: 10,
  },
  buildingChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeBuildingChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  buildingChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeBuildingChipText: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  assetItem: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F9FAFB',
  },
  assetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  assetId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  assetItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginTop: 20,
  },
  dayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeDayOption: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeDayOptionText: {
    color: '#fff',
  },
  modalChipScroll: {
    paddingBottom: 10,
  },
  modalChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeModalChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modalChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeModalChipText: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  resetBtn: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyBtn: {
    flex: 2,
    height: 52,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
