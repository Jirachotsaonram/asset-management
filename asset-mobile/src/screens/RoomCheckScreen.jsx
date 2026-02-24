import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function RoomCheckScreen({ navigation }) {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checkedIds, setCheckedIds] = useState(new Set());

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
            Alert.alert('Error', 'Could not load locations');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssetsInRoom = async (location) => {
        setSelectedLocation(location);
        setLoading(true);
        setCheckedIds(new Set());
        try {
            // ใช้ API filtering ที่สร้างใหม่ เพื่อลดภาระของ Client
            const response = await api.get('/assets', {
                params: {
                    building: location.building_name,
                    floor: location.floor,
                    room_number: location.room_number,
                    location_id: location.location_id,
                    limit: 200 // ดึงมาให้ครบในห้องเดียวเลย
                }
            });
            if (response.data.success) {
                const fetchedItems = response.data.data?.items || (Array.isArray(response.data.data) ? response.data.data : []);

                // ไม่ต้อง filter ใน JS แล้ว เพราะเรียกตรงจาก API
                // ป้องกันรายการซ้ำ (Duplicate Keys)
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
            Alert.alert('Error', 'Could not load assets for this room');
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = (assetId) => {
        const newChecked = new Set(checkedIds);
        if (newChecked.has(assetId)) {
            newChecked.delete(assetId);
        } else {
            newChecked.add(assetId);
        }
        setCheckedIds(newChecked);
    };

    const renderAssetItem = React.useCallback(({ item }) => (
        <TouchableOpacity
            style={[styles.assetItem, checkedIds.has(item.asset_id) && styles.assetItemChecked]}
            onPress={() => toggleCheck(item.asset_id)}
        >
            <View style={styles.assetInfo}>
                <Text style={styles.assetId}>{item.asset_id}</Text>
                <Text style={styles.assetName} numberOfLines={1}>{item.asset_name}</Text>
            </View>
            <Ionicons
                name={checkedIds.has(item.asset_id) ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={checkedIds.has(item.asset_id) ? "#10B981" : "#D1D5DB"}
            />
        </TouchableOpacity>
    ), [checkedIds]);

    const handleFinishCheck = async () => {
        if (checkedIds.size === 0) {
            Alert.alert('Warning', 'No assets checked yet');
            return;
        }

        setLoading(true);
        try {
            // In a real scenario, we might want a bulk check endpoint
            // For now, we'll just log that the check is complete or navigate back
            Alert.alert(
                'Check Complete',
                `You checked ${checkedIds.size} out of ${assets.length} assets in this room.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert('Error', 'Could not complete check');
        } finally {
            setLoading(false);
        }
    };

    if (!selectedLocation) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>เลือกห้อง/สถานที่</Text>
                </View>
                <FlatList
                    data={locations}
                    keyExtractor={(item) => item.location_id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.locationItem}
                            onPress={() => fetchAssetsInRoom(item)}
                        >
                            <View style={styles.locationIcon}>
                                <Ionicons name="business" size={24} color="#2563EB" />
                            </View>
                            <View>
                                <Text style={styles.locationName}>{item.building_name} ชั้น {item.floor}</Text>
                                <Text style={styles.roomName}>ห้อง: {item.room_number || 'ไม่ระบุ'}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.chevron} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={loading ? <ActivityIndicator size="large" /> : <Text style={styles.emptyText}>ไม่พบข้อมูลสถานที่</Text>}
                    contentContainerStyle={styles.listContent}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{selectedLocation.building_name} {selectedLocation.room_number}</Text>
                    <Text style={styles.headerSubtitle}>ตรวจสอบครุภัณฑ์รายห้อง</Text>
                </View>
            </View>

            <View style={styles.summaryBar}>
                <Text style={styles.summaryText}>ตรวจแล้ว {checkedIds.size} / {assets.length}</Text>
                <TouchableOpacity
                    style={styles.scanRoomBtn}
                    onPress={() => navigation.navigate('Scan')}
                >
                    <Ionicons name="qr-code" size={16} color="#fff" />
                    <Text style={styles.scanBtnText}>สแกนตรวจ</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={assets}
                keyExtractor={(item) => item.asset_id.toString()}
                renderItem={renderAssetItem}
                ListEmptyComponent={loading ? <ActivityIndicator size="large" /> : <Text style={styles.emptyText}>ไม่พบครุภัณฑ์ในห้องนี้</Text>}
                contentContainerStyle={styles.listContent}
                removeClippedSubviews={true}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={5}
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.finishBtn}
                    onPress={handleFinishCheck}
                >
                    <Text style={styles.finishBtnText}>เสร็จสิ้นการตรวจสอบ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 15,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    listContent: {
        padding: 16,
    },
    locationItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    locationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    roomName: {
        fontSize: 14,
        color: '#6B7280',
    },
    chevron: {
        marginLeft: 'auto',
    },
    summaryBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    summaryText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#374151',
    },
    scanRoomBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    scanBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    assetItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    assetItemChecked: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    assetInfo: {
        flex: 1,
    },
    assetId: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    assetName: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9CA3AF',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    finishBtn: {
        backgroundColor: '#10B981',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    finishBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
