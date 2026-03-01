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
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function BorrowsScreen({ route, navigation }) {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const searchTimeout = React.useRef(null);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [dueDate, setDueDate] = useState('');

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default to 7 days from now
    return date.toISOString().split('T')[0];
  };

  const isOverdue = (dateString, status) => {
    if (!dateString || status === 'คืนแล้ว' || status === 'returned') return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  useEffect(() => {
    // Initial fetch for data is now handled by the useEffect below watching filters/search
  }, []);

  // Fetch data whenever filters or searchQuery changes
  useEffect(() => {
    const controller = new AbortController();

    // Apply debounce to search, but immediate fetch for filters
    const delay = searchQuery ? 500 : 0;
    const timeoutId = setTimeout(() => {
      loadBorrows(1, false, controller.signal);
    }, delay);

    // Handle navigation from ScanScreen
    if (route.params?.scanAsset) {
      setSelectedAsset(route.params.scanAsset);
      setShowBorrowModal(true);
      setDueDate(getDefaultDueDate()); // Set default due date
      // Clear params to avoid modal popping up again on refresh
      navigation.setParams({ scanAsset: null });
    }

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [filterStatus, searchQuery, route.params?.scanAsset]);

  const loadBorrows = async (pageNum = 1, isRefresh = false, signal = null) => {
    try {
      if (pageNum === 1) {
        setLoading(!isRefresh);
        if (!isRefresh) {
          setBorrows([]); // Clear for fresh load
          setTotal(0);
        }
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
        search: searchQuery || undefined,
        status: filterStatus !== 'all' ? (filterStatus === 'active' ? 'ยืม' : 'คืนแล้ว') : undefined
      };

      const response = await api.get('/borrows', { params, signal });
      if (response.data.success) {
        const data = response.data.data;
        const newItems = data.items || [];
        const totalItems = data.total || 0;

        if (pageNum === 1) {
          setBorrows(newItems);
          setHasMore(newItems.length < totalItems);
        } else {
          setBorrows(prev => {
            const existingIds = new Set(prev.map(b => b.borrow_id));
            const uniqueNew = newItems.filter(item => !existingIds.has(item.borrow_id));
            const updated = [...prev, ...uniqueNew];
            setHasMore(updated.length < totalItems);
            return updated;
          });
        }

        setTotal(totalItems);
        setPage(pageNum);
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('Error loading borrows:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการยืม-คืนได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadBorrows(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadBorrows(page + 1);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const updateStatusFilter = (status) => {
    setFilterStatus(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ยืม':
      case 'borrowed':
        return '#F59E0B';
      case 'คืนแล้ว':
      case 'returned':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ยืม':
      case 'borrowed':
        return 'กำลังยืม';
      case 'คืนแล้ว':
      case 'returned':
        return 'คืนแล้ว';
      default:
        return status;
    }
  };

  const handleOpenDetails = (borrow) => {
    setSelectedBorrow(borrow);
    setShowModal(true);
  };

  const handleReturn = async () => {
    if (!selectedBorrow) return;

    Alert.alert(
      'ยืนยันการคืน',
      `คุณต้องการบันทึกการคืน ${selectedBorrow.asset_name} ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยันการคืน',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.put(`/borrows/${selectedBorrow.borrow_id}/return`, {
                asset_id: selectedBorrow.asset_id,
                return_date: new Date().toISOString().split('T')[0]
              });

              if (response.data.success) {
                Alert.alert('สำเร็จ', 'บันทึกการคืนเรียบร้อยแล้ว');
                setShowModal(false);
                loadBorrows();
              }
            } catch (error) {
              console.error('Error returning asset:', error);
              Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกการคืนได้');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateBorrow = async () => {
    if (!borrowerName.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อผู้ยืม');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/borrows', {
        asset_id: selectedAsset.asset_id,
        borrower_name: borrowerName,
        due_date: dueDate || null,
        borrow_date: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        Alert.alert('สำเร็จ', 'บันทึกการยืมเรียบร้อยแล้ว');
        setShowBorrowModal(false);
        setBorrowerName('');
        setDueDate('');
        loadBorrows();
      }
    } catch (error) {
      console.error('Error creating borrow:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกการยืมได้');
    } finally {
      setLoading(false);
    }
  };

  const renderBorrowItem = React.useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.borrowItem}
      onPress={() => handleOpenDetails(item)}
      activeOpacity={0.7}
    >
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
            { backgroundColor: getStatusColor(item.status) + '15' },
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
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>{item.borrower_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isOverdue(item.due_date, item.status) ? '#EF4444' : '#6B7280'}
            />
            <Text style={[
              styles.detailText,
              isOverdue(item.due_date, item.status) && { color: '#EF4444', fontWeight: 'bold' }
            ]}>
              {item.status === 'คืนแล้ว' || item.status === 'returned'
                ? `คืนเมื่อ: ${new Date(item.return_date).toLocaleDateString('th-TH')}`
                : `คืนภายใน: ${item.due_date ? new Date(item.due_date).toLocaleDateString('th-TH') : '-'}`
              }
              {isOverdue(item.due_date, item.status) && ' (เกินกำหนด!)'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

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
            <Text style={styles.headerTitle}>การยืม-คืน</Text>
            <Text style={styles.headerSubtitle}>ทั้งหมด {total} รายการ</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อผู้ยืม, ครุภัณฑ์ หรือรหัส..."
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
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'all' && styles.activeFilterChip]}
            onPress={() => updateStatusFilter('all')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'all' && styles.activeFilterChipText]}>ทั้งหมด</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'active' && styles.activeFilterChip]}
            onPress={() => updateStatusFilter('active')}
          >
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.filterChipText, filterStatus === 'active' && styles.activeFilterChipText]}>กำลังยืม</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'returned' && styles.activeFilterChip]}
            onPress={() => updateStatusFilter('returned')}
          >
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.filterChipText, filterStatus === 'returned' && styles.activeFilterChipText]}>คืนแล้ว</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={borrows}
        renderItem={renderBorrowItem}
        keyExtractor={(item) => item.borrow_id?.toString()}
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
            <Ionicons name="swap-horizontal-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>ไม่พบข้อมูลการยืม-คืน</Text>
            <Text style={styles.emptySubtext}>ลองเปลี่ยนเงื่อนไขการค้นหา</Text>
          </View>
        }
      />

      {/* Details Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียด</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeIconBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedBorrow && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <View style={styles.assetIconContainer}>
                    <View style={styles.assetIconCircle}>
                      <Ionicons name="cube" size={32} color="#6366F1" />
                    </View>
                  </View>

                  <Text style={styles.modalAssetName}>{selectedBorrow.asset_name}</Text>
                  <Text style={styles.modalAssetId}>{selectedBorrow.asset_id}</Text>

                  <View style={styles.modalBadgeContainer}>
                    <Text style={styles.modalBadgeLabel}>BORROW DETAILS</Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>รหัสครุภัณฑ์</Text>
                      <Text style={styles.infoValue}>{selectedBorrow.asset_id}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Serial Number</Text>
                      <Text style={styles.infoValue}>{selectedBorrow.serial_number || '-'}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>ผู้ยืม</Text>
                      <Text style={styles.infoValue}>{selectedBorrow.borrower_name}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>วันที่ยืม</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedBorrow.borrow_date).toLocaleDateString('th-TH')}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>กำหนดคืน</Text>
                      <Text style={styles.infoValue}>
                        {selectedBorrow.due_date
                          ? new Date(selectedBorrow.due_date).toLocaleDateString('th-TH')
                          : '-'}
                      </Text>
                    </View>

                    {selectedBorrow.status === 'คืนแล้ว' && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>วันที่คืนจริง</Text>
                        <Text style={styles.infoValue}>
                          {selectedBorrow.return_date
                            ? new Date(selectedBorrow.return_date).toLocaleDateString('th-TH')
                            : '-'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>สถานะปัจจุบัน</Text>
                      <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>
                        {getStatusText(selectedBorrow.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedBorrow.status === 'ยืม' && (
                  <TouchableOpacity
                    style={styles.returnBtn}
                    onPress={handleReturn}
                  >
                    <Ionicons name="return-down-back-outline" size={20} color="#fff" />
                    <Text style={styles.returnBtnText}>บันทึกการคืน</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCloseBtnText}>ปิด</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* New Borrow Modal */}
      <Modal
        visible={showBorrowModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBorrowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>บันทึกการยืม</Text>
              <TouchableOpacity onPress={() => setShowBorrowModal(false)} style={styles.closeIconBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.borrowFormContainer}>
              <View style={styles.assetMiniCard}>
                <Ionicons name="cube" size={24} color="#2563EB" />
                <View>
                  <Text style={styles.assetMiniName} numberOfLines={1}>{selectedAsset?.asset_name}</Text>
                  <Text style={styles.assetMiniId}>{selectedAsset?.asset_id}</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>ชื่อผู้ยืม *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="กรอกชื่อสมมติ/เจ้าหน้าที่"
                  value={borrowerName}
                  onChangeText={setBorrowerName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>กำหนดคืน (ระบุวันที่)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="เช่น 2026-03-31"
                  value={dueDate}
                  onChangeText={setDueDate}
                />
                <Text style={styles.inputHint}>* รูปแบบ ปี-เดือน-วัน (ค.ศ.)</Text>
              </View>

              <TouchableOpacity
                style={styles.submitBorrowBtn}
                onPress={handleCreateBorrow}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitBorrowBtnText}>บันทึกข้อมูล</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { margin: 0, marginTop: 12 }]}
                onPress={() => setShowBorrowModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 15,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
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
  filterScroll: {
    marginBottom: 5,
  },
  filterScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  borrowItem: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  borrowItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  borrowItemLeft: {
    flex: 1,
  },
  assetId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  assetName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  borrowItemDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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
  loaderFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 32,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeIconBtn: {
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
    padding: 24,
  },
  assetIconContainer: {
    marginBottom: 16,
  },
  assetIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAssetName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
  },
  modalAssetId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
    letterSpacing: 1,
  },
  modalBadgeContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  modalBadgeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  infoGrid: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  returnBtn: {
    backgroundColor: '#10B981',
    marginHorizontal: 24,
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  returnBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    margin: 24,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  // Borrow Form Styles
  borrowFormContainer: {
    padding: 24,
  },
  assetMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  assetMiniName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  assetMiniId: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  inputHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  submitBorrowBtn: {
    backgroundColor: '#2563EB',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  submitBorrowBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

