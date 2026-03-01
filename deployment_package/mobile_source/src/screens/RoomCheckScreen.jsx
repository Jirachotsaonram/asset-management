import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ASSET_STATUS } from '../utils/constants';

export default function RoomCheckScreen({ navigation }) {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [checkedIds, setCheckedIds] = useState(new Set());
    const [checkStatus, setCheckStatus] = useState(ASSET_STATUS.AVAILABLE);
    const [remark, setRemark] = useState('');
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const response = await api.get('/locations');
            if (response.data.success) {
                setLocations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
            Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดรายการห้องได้');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssetsInRoom = async (location) => {
        setSelectedLocation(location);
        setLoading(true);
        setCheckedIds(new Set());
        setSearchText('');
        try {
            const response = await api.get('/assets', {
                params: { location_id: location.location_id, limit: 500 }
            });
            if (response.data.success) {
                const fetchedItems = response.data.data?.items || (Array.isArray(response.data.data) ? response.data.data : []);
                const uniqueAssets = [];
                const seenIds = new Set();
                fetchedItems.forEach(item => {
                    if (!seenIds.has(item.asset_id)) {
                        seenIds.add(item.asset_id);
                        uniqueAssets.push(item);
                    }
                });
                setAssets(uniqueAssets);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
            Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดครุภัณฑ์ในห้องได้');
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = (assetId) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(assetId)) next.delete(assetId);
            else next.add(assetId);
            return next;
        });
    };

    const filteredAssets = assets.filter(a =>
        !searchText ||
        a.asset_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        String(a.asset_id).includes(searchText)
    );

    const checkAll = () => {
        if (checkedIds.size === filteredAssets.length && filteredAssets.length > 0) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(filteredAssets.map(a => a.asset_id)));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case ASSET_STATUS.AVAILABLE: return '#10B981';
            case ASSET_STATUS.MAINTENANCE: return '#F59E0B';
            case ASSET_STATUS.PENDING_DISPOSAL: return '#EF4444';
            case ASSET_STATUS.DISPOSED: return '#6B7280';
            case ASSET_STATUS.MISSING: return '#DC2626';
            default: return '#6B7280';
        }
    };

    const handleFinishCheck = () => {
        if (checkedIds.size === 0) {
            Alert.alert('ยังไม่ได้เลือก', 'กรุณาแตะครุภัณฑ์ที่ตรวจสอบแล้วอย่างน้อย 1 รายการ');
            return;
        }
        Alert.alert(
            'ยืนยันการบันทึก',
            `บันทึกผลการตรวจสอบ ${checkedIds.size} รายการ\nสถานะ: ${checkStatus}`,
            [
                { text: 'ยกเลิก', style: 'cancel' },
                { text: 'บันทึก', onPress: submitChecks },
            ]
        );
    };

    const submitChecks = async () => {
        setSubmitting(true);
        let success = 0;
        let failed = 0;
        const today = new Date().toISOString().split('T')[0];
        for (const assetId of Array.from(checkedIds)) {
            try {
                const res = await api.post('/checks', {
                    asset_id: assetId,
                    check_status: checkStatus,
                    remark: remark || `ตรวจสอบรายห้อง: ${selectedLocation.building_name} ห้อง ${selectedLocation.room_number || ''}`,
                    check_date: today,
                });
                if (res.data.success) success++;
                else failed++;
            } catch {
                failed++;
            }
        }
        setSubmitting(false);
        Alert.alert(
            failed === 0 ? '✅ บันทึกเสร็จสิ้น' : '⚠️ บันทึกบางส่วน',
            `สำเร็จ: ${success} รายการ${failed > 0 ? `\nล้มเหลว: ${failed} รายการ` : ''}\n\nทั้งหมดในห้อง: ${assets.length} รายการ`,
            [{ text: 'ตกลง', onPress: () => { setCheckedIds(new Set()); setRemark(''); } }]
        );
    };

    const renderAssetItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={[styles.assetItem, checkedIds.has(item.asset_id) && styles.assetItemChecked]}
            onPress={() => toggleCheck(item.asset_id)}
        >
            <View style={styles.assetInfo}>
                <Text style={styles.assetId}>ID: {item.asset_id}</Text>
                <Text style={styles.assetName} numberOfLines={2}>{item.asset_name}</Text>
                {item.status && (
                    <Text style={[styles.assetStatus, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                )}
            </View>
            <Ionicons
                name={checkedIds.has(item.asset_id) ? 'checkmark-circle' : 'ellipse-outline'}
                size={30}
                color={checkedIds.has(item.asset_id) ? '#10B981' : '#D1D5DB'}
            />
        </TouchableOpacity>
    ), [checkedIds]);

    // ─── Location List ─────────────────────────────────────────────────
    if (!selectedLocation) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>เลือกห้อง/สถานที่</Text>
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={locations}
                        keyExtractor={(item) => item.location_id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.locationItem} onPress={() => fetchAssetsInRoom(item)}>
                                <View style={styles.locationIcon}>
                                    <Ionicons name="business" size={24} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.locationName}>{item.building_name} ชั้น {item.floor}</Text>
                                    <Text style={styles.roomName}>ห้อง: {item.room_number || 'ไม่ระบุ'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>ไม่พบข้อมูลสถานที่</Text>}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </SafeAreaView>
        );
    }

    // ─── Room Asset Check ─────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSelectedLocation(null)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{selectedLocation.building_name} {selectedLocation.room_number || ''}</Text>
                    <Text style={styles.headerSubtitle}>ตรวจสอบครุภัณฑ์รายห้อง</Text>
                </View>
            </View>

            <View style={styles.summaryBar}>
                <Text style={styles.summaryText}>ตรวจแล้ว {checkedIds.size} / {assets.length}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.outlineBtn} onPress={checkAll}>
                        <Text style={styles.outlineBtnText}>
                            {checkedIds.size === filteredAssets.length && filteredAssets.length > 0 ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.scanRoomBtn} onPress={() => navigation.navigate('Scan')}>
                        <Ionicons name="qr-code" size={16} color="#fff" />
                        <Text style={styles.scanBtnText}>สแกนตรวจ</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="ค้นหาชื่อหรือ ID..."
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40, flex: 1 }} />
            ) : (
                <FlatList
                    data={filteredAssets}
                    keyExtractor={(item) => item.asset_id.toString()}
                    renderItem={renderAssetItem}
                    ListEmptyComponent={<Text style={styles.emptyText}>ไม่พบครุภัณฑ์ในห้องนี้</Text>}
                    contentContainerStyle={styles.listContent}
                    removeClippedSubviews={true}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}

            <View style={styles.footer}>
                <Text style={styles.footerLabel}>ผลการตรวจสอบ:</Text>
                <View style={styles.statusRow}>
                    {Object.values(ASSET_STATUS).map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.statusChip, checkStatus === s && { borderColor: getStatusColor(s), backgroundColor: getStatusColor(s) + '20' }]}
                            onPress={() => setCheckStatus(s)}
                        >
                            <Text style={[styles.statusChipText, checkStatus === s && { color: getStatusColor(s), fontWeight: '700' }]}>
                                {s}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    style={styles.remarkInput}
                    placeholder="หมายเหตุ (ถ้ามี)..."
                    value={remark}
                    onChangeText={setRemark}
                />
                <TouchableOpacity
                    style={[styles.finishBtn, checkedIds.size === 0 && styles.finishBtnDisabled]}
                    onPress={handleFinishCheck}
                    disabled={submitting || checkedIds.size === 0}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="save" size={20} color="#fff" />
                            <Text style={styles.finishBtnText}>
                                บันทึกผลตรวจสอบ {checkedIds.size > 0 ? `(${checkedIds.size})` : ''}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        padding: 16, backgroundColor: '#fff',
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12,
    },
    backBtn: { padding: 4 },
    headerTextContainer: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#6B7280' },
    summaryBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    summaryText: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
    outlineBtn: { borderWidth: 1, borderColor: '#2563EB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    outlineBtnText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
    scanRoomBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
    scanBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12,
        borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 8,
    },
    searchInput: { flex: 1, height: 42, fontSize: 14 },
    listContent: { padding: 16, paddingBottom: 8 },
    locationItem: {
        backgroundColor: '#fff', padding: 16, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', marginBottom: 10,
        borderWidth: 1, borderColor: '#E5E7EB', gap: 12,
    },
    locationIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    locationName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    roomName: { fontSize: 13, color: '#6B7280' },
    assetItem: {
        backgroundColor: '#fff', padding: 16, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', marginBottom: 10,
        borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    assetItemChecked: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
    assetInfo: { flex: 1 },
    assetId: { fontSize: 11, color: '#2563EB', fontWeight: 'bold', marginBottom: 2 },
    assetName: { fontSize: 14, color: '#374151', fontWeight: '500', marginBottom: 2 },
    assetStatus: { fontSize: 12, fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontSize: 15 },
    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    footerLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
    statusChipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    remarkInput: {
        backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
        fontSize: 14, minHeight: 44, marginBottom: 10,
    },
    finishBtn: { backgroundColor: '#10B981', height: 50, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    finishBtnDisabled: { backgroundColor: '#D1FAE5' },
    finishBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
