import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    ScrollView,
    Platform,
} from 'react-native';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_MAP = {
    never: { color: '#2563EB', bg: '#EFF6FF', icon: 'alert-circle-outline', text: 'ยังไม่เคยตรวจสอบ' },
    critical: { color: '#DC2626', bg: '#FEF2F2', icon: 'warning-outline' },
    overdue: { color: '#EA580C', bg: '#FFF7ED', icon: 'time-outline' },
    ok: { color: '#6B7280', bg: '#F9FAFB', icon: 'checkmark-circle-outline' },
};

function getUrgency(days) {
    if (days === null || days === undefined) return { ...STATUS_MAP.never };
    if (days >= 730) return { ...STATUS_MAP.critical, text: `เกินกำหนด ${Math.floor(days / 365)} ปี+` };
    if (days >= 365) return { ...STATUS_MAP.overdue, text: 'เกินกำหนด 1 ปี' };
    return { ...STATUS_MAP.ok, text: `ตรวจสอบเมื่อ ${days} วันที่แล้ว` };
}

const DEFAULT_FILTERS = { days: 365, building: 'all', floor: 'all', department_id: 'all', status: 'all' };

const STATUS_OPTIONS = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'never', label: 'ยังไม่เคยตรวจ' },
    { value: 'overdue', label: 'เกินกำหนด' },
    { value: 'nearly', label: 'ใกล้กำหนด' },
    { value: 'checked', label: 'ตรวจแล้ว' },
];

export default function CheckByAsset({ navigation }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [globalPeriod, setGlobalPeriod] = useState({ start: null, end: null, fetched: false });

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        if (!globalPeriod.fetched) return;
        const controller = new AbortController();
        const delay = searchQuery ? 500 : 0;
        const id = setTimeout(() => {
            loadAssets(1, false, controller.signal);
        }, delay);
        return () => { clearTimeout(id); controller.abort(); };
    }, [filters, searchQuery, globalPeriod]);

    const fetchFilterOptions = async () => {
        try {
            const [locRes, deptRes, settingsRes] = await Promise.all([
                api.get('/locations'),
                api.get('/departments'),
                api.get('/settings').catch(() => ({ data: { data: {} } }))
            ]);
            if (locRes.data.success) {
                const locs = locRes.data.data || [];
                setBuildings([...new Set(locs.map(l => l.building_name || 'ไม่ระบุอาคาร'))].sort());
                setFloors([...new Set(locs.map(l => l.floor).filter(Boolean))].sort((a, b) => a - b));
            }
            if (deptRes.data.success) setDepartments(deptRes.data.data || []);
            
            const settings = settingsRes.data?.data || {};
            setGlobalPeriod({
                start: settings.annual_check_start || null,
                end: settings.annual_check_end || null,
                fetched: true
            });
        } catch (e) {
            console.error('fetchFilterOptions error:', e);
            setGlobalPeriod({ start: null, end: null, fetched: true });
        }
    };

    const loadAssets = async (pageNum = 1, isRefresh = false, signal = null) => {
        try {
            if (pageNum === 1) {
                if (!isRefresh) setLoading(true);
                setAssets([]);
                setTotal(0);
            } else {
                setLoadingMore(true);
            }

            const params = {
                days: filters.days,
                page: pageNum,
                limit: 20,
                ...(searchQuery && { search: searchQuery }),
                ...(filters.building !== 'all' && { building: filters.building }),
                ...(filters.floor !== 'all' && { floor: filters.floor }),
                ...(filters.department_id !== 'all' && { department_id: filters.department_id }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(globalPeriod.start && { start_date: globalPeriod.start }),
                ...(globalPeriod.end && { end_date: globalPeriod.end }),
            };

            const res = await api.get('/reports/unchecked', { params, signal });
            if (res.data.success) {
                const { items = [], total: tot = 0 } = res.data.data;
                if (pageNum === 1) {
                    setAssets(items);
                    setHasMore(items.length < tot);
                } else {
                    setAssets(prev => {
                        const ids = new Set(prev.map(a => a.asset_id));
                        const merged = [...prev, ...items.filter(i => !ids.has(i.asset_id))];
                        setHasMore(merged.length < tot);
                        return merged;
                    });
                }
                setTotal(tot);
                setPage(pageNum);
            }
        } catch (e) {
            if (e.name === 'CanceledError' || e.name === 'AbortError') return;
            console.error('loadAssets error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAssets(1, true);
    }, [filters, searchQuery]);

    const loadMore = useCallback(() => {
        if (!loading && !loadingMore && hasMore) loadAssets(page + 1);
    }, [loading, loadingMore, hasMore, page]);

    const openFilterModal = () => { setDraftFilters(filters); setShowFilterModal(true); };
    const applyFilters = () => { setFilters(draftFilters); setShowFilterModal(false); };
    const resetFilters = () => setDraftFilters(DEFAULT_FILTERS);

    const activeFilterCount = [
        filters.building !== 'all',
        filters.floor !== 'all',
        filters.department_id !== 'all',
        filters.days !== 365,
        filters.status !== 'all',
    ].filter(Boolean).length;

    const renderItem = useCallback(({ item }) => {
        const urgency = getUrgency(item.days_since_check);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Scan', { assetId: item.asset_id })}
                activeOpacity={0.75}
            >
                <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.assetId}>{item.barcode || item.asset_id}</Text>
                        <Text style={styles.assetName} numberOfLines={2}>{item.asset_name}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                </View>
                <View style={styles.cardBottom}>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.locationText} numberOfLines={1}>{item.location || '-'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: urgency.bg }]}>
                        <Ionicons name={urgency.icon} size={12} color={urgency.color} />
                        <Text style={[styles.badgeText, { color: urgency.color }]}>{urgency.text}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [navigation]);

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search + Filter */}
            <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="ค้นหารหัส หรือชื่อครุภัณฑ์..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {!!searchQuery && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                    onPress={openFilterModal}
                >
                    <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? '#fff' : '#2563EB'} />
                    <Text style={[styles.filterBtnText, activeFilterCount > 0 && { color: '#fff' }]}>ตัวกรอง</Text>
                    {activeFilterCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Count */}
            <Text style={styles.countText}>พบ {total.toLocaleString()} รายการที่ต้องตรวจสอบ</Text>

            {/* List */}
            <FlatList
                data={assets}
                renderItem={renderItem}
                keyExtractor={item => (item.barcode || item.asset_id)?.toString()}
                contentContainerStyle={styles.list}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 20 }} color="#2563EB" /> : null}
                removeClippedSubviews
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={7}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                        <Text style={styles.emptyText}>ไม่พบครุภัณฑ์ที่ต้องตรวจสอบ</Text>
                        <Text style={styles.emptySubtext}>ลองเปลี่ยนเงื่อนไขการค้นหา</Text>
                    </View>
                }
            />

            {/* Filter Modal */}
            <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>ตัวกรองขั้นสูง</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ marginBottom: 16 }} showsVerticalScrollIndicator={false}>
                            <FilterSection label="สถานะ">
                                <View style={styles.chipRow}>
                                    {STATUS_OPTIONS.map(s => (
                                        <TouchableOpacity
                                            key={s.value}
                                            style={[styles.optionChip, draftFilters.status === s.value && styles.optionChipActive]}
                                            onPress={() => setDraftFilters(p => ({ ...p, status: s.value }))}
                                        >
                                            <Text style={[styles.optionChipText, draftFilters.status === s.value && styles.optionChipTextActive]}>
                                                {s.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </FilterSection>
                            <FilterSection label="เกินกำหนดตรวจสอบ (วัน)">
                                <View style={styles.chipRow}>
                                    {[30, 90, 180, 365, 730].map(d => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[styles.optionChip, draftFilters.days === d && styles.optionChipActive]}
                                            onPress={() => setDraftFilters(p => ({ ...p, days: d }))}
                                        >
                                            <Text style={[styles.optionChipText, draftFilters.days === d && styles.optionChipTextActive]}>
                                                {d >= 365 ? `${d / 365} ปี` : `${d} วัน`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </FilterSection>
                            <FilterSection label="อาคาร">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {['all', ...buildings].map(b => (
                                        <TouchableOpacity
                                            key={b}
                                            style={[styles.optionChip, draftFilters.building === b && styles.optionChipActive, { marginRight: 8 }]}
                                            onPress={() => setDraftFilters(p => ({ ...p, building: b }))}
                                        >
                                            <Text style={[styles.optionChipText, draftFilters.building === b && styles.optionChipTextActive]}>
                                                {b === 'all' ? 'ทั้งหมด' : b}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </FilterSection>
                            <FilterSection label="ชั้น">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {['all', ...floors].map(f => (
                                        <TouchableOpacity
                                            key={f}
                                            style={[styles.optionChip, draftFilters.floor === f && styles.optionChipActive, { marginRight: 8 }]}
                                            onPress={() => setDraftFilters(p => ({ ...p, floor: f }))}
                                        >
                                            <Text style={[styles.optionChipText, draftFilters.floor === f && styles.optionChipTextActive]}>
                                                {f === 'all' ? 'ทั้งหมด' : `ชั้น ${f}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </FilterSection>
                            <FilterSection label="หน่วยงาน">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {[{ department_id: 'all', department_name: 'ทั้งหมด' }, ...departments].map(d => (
                                        <TouchableOpacity
                                            key={d.department_id}
                                            style={[styles.optionChip, draftFilters.department_id === d.department_id && styles.optionChipActive, { marginRight: 8 }]}
                                            onPress={() => setDraftFilters(p => ({ ...p, department_id: d.department_id }))}
                                        >
                                            <Text style={[styles.optionChipText, draftFilters.department_id === d.department_id && styles.optionChipTextActive]}>
                                                {d.department_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </FilterSection>
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

function FilterSection({ label, children }) {
    return (
        <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>{label}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, fontSize: 15, color: '#1F2937', height: '100%' },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
    filterBtnActive: { backgroundColor: '#2563EB' },
    filterBtnText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
    filterBadge: { backgroundColor: '#fff', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    filterBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
    countText: { fontSize: 12, color: '#6B7280', paddingHorizontal: 16, marginBottom: 4, marginTop: 4 },
    list: { padding: 16, paddingTop: 8 },
    card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardLeft: { flex: 1, marginRight: 10 },
    assetId: { fontSize: 11, fontWeight: '700', color: '#2563EB', backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 5 },
    assetName: { fontSize: 15, fontWeight: '600', color: '#1F2937', lineHeight: 21 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, marginRight: 8 },
    locationText: { fontSize: 13, color: '#6B7280', fontWeight: '500', flex: 1 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4, flexShrink: 0 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyText: { fontSize: 17, fontWeight: 'bold', color: '#374151', marginTop: 16 },
    emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    optionChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    optionChipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    optionChipTextActive: { color: '#fff' },
    modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    resetBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
    resetBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    applyBtn: { flex: 2, height: 50, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
    applyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
