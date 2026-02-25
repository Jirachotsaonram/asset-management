import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import offlineService from '../services/offlineService';
import { useNetwork } from '../hooks/useNetwork';

export default function OfflineScreen({ navigation }) {
    const { isConnected } = useNetwork();
    const [stats, setStats] = useState({
        totalAssets: 0,
        pendingChecks: 0,
        lastSync: null,
        hasData: false,
    });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const data = await offlineService.getOfflineStats();
        setStats(data);
        setLoading(false);
    };

    const handleDownload = async () => {
        if (!isConnected) {
            Alert.alert('ออฟไลน์', 'กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อดาวน์โหลดข้อมูลข้อมูล');
            return;
        }

        Alert.alert(
            'ดาวน์โหลดข้อมูล',
            'ระบบจะดาวน์โหลดข้อมูลครุภัณฑ์ทั้งหมดมาเก็บไว้ในเครื่อง เพื่อใช้สแกนขณะไม่มีรหัสอินเทอร์เน็ต\n\nกระบวนการนี้อาจใช้เวลาครู่หนึ่ง',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'เริ่มดาวน์โหลด',
                    onPress: async () => {
                        setDownloading(true);
                        const result = await offlineService.downloadAssetsForOffline();
                        setDownloading(false);
                        if (result.success) {
                            Alert.alert('สำเร็จ', result.message);
                            loadStats();
                        } else {
                            Alert.alert('ข้อผิดพลาด', result.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSync = async () => {
        if (!isConnected) {
            Alert.alert('ออฟไลน์', 'กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อซิงค์ข้อมูล');
            return;
        }

        if (stats.pendingChecks === 0) {
            Alert.alert('ไม่มีข้อมูล', 'ไม่มีรายการที่รอการซิงค์');
            return;
        }

        setSyncing(true);
        const result = await offlineService.syncPendingChecks();
        setSyncing(false);

        if (result.success > 0 || result.failed > 0) {
            Alert.alert(
                'ซิงค์เสร็จสิ้น',
                `ส่งข้อมูลสำเร็จ: ${result.success} รายการ\nล้มเหลว: ${result.failed} รายการ`
            );
            loadStats();
        }
    };

    const handleClearCache = () => {
        Alert.alert(
            'ล้างข้อมูลออฟไลน์',
            'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลครุภัณฑ์ที่บันทึกไว้ในเครื่อง? (ข้อมูลที่รอซิงค์จะไม่ถูกลบ)',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ล้างข้อมูล',
                    style: 'destructive',
                    onPress: async () => {
                        await offlineService.clearAssetChunks();
                        loadStats();
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>จัดการข้อมูลออฟไลน์</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statRow}>
                    <View style={styles.statIconContainer}>
                        <Ionicons name="cube-outline" size={24} color="#2563EB" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>ครุภัณฑ์ในเครื่อง</Text>
                        <Text style={styles.statValue}>{stats.totalAssets.toLocaleString()} รายการ</Text>
                    </View>
                </View>

                <View style={styles.statRow}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#FEF2F2' }]}>
                        <Ionicons name="sync-outline" size={24} color="#EF4444" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>รอดำเนินการ (Pending)</Text>
                        <Text style={[styles.statValue, stats.pendingChecks > 0 && { color: '#EF4444' }]}>
                            {stats.pendingChecks} รายการ
                        </Text>
                    </View>
                </View>

                <View style={styles.statRow}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#F0F9FF' }]}>
                        <Ionicons name="time-outline" size={24} color="#0EA5E9" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>อัปเดตล่าสุด</Text>
                        <Text style={styles.statValue}>
                            {stats.lastSync ? new Date(stats.lastSync).toLocaleString('th-TH') : 'ยังไม่เคยโหลด'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>การดำเนินการ</Text>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleDownload}
                    disabled={downloading}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="cloud-download-outline" size={20} color="#2563EB" />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionLabel}>ดาวน์โหลดข้อมูลใหม่</Text>
                        <Text style={styles.actionDesc}>อัปเดตรายชื่อครุภัณฑ์ล่าสุดเข้าเครื่อง</Text>
                    </View>
                    {downloading ? (
                        <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleSync}
                    disabled={syncing}
                >
                    <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="sync" size={20} color="#16A34A" />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionLabel}>ซิงค์ข้อมูลตอนนี้</Text>
                        <Text style={styles.actionDesc}>ส่งรายการที่บันทึกไว้เข้าสู่เซิร์ฟเวอร์</Text>
                    </View>
                    {syncing ? (
                        <ActivityIndicator size="small" color="#16A34A" />
                    ) : (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={handleClearCache}>
                    <View style={[styles.actionIcon, { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons name="trash-outline" size={20} color="#4B5563" />
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionLabel}>ล้างข้อมูลแคช</Text>
                        <Text style={styles.actionDesc}>ลบข้อมูลครุภัณฑ์เพื่อนื้นที่ว่าง</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                    ระบบจะบันทึกข้อมูลการสแกนไว้ในเครื่องโดยอัตโนมัติหากตรวจพบว่าไม่มีสัญญาณอินเทอร์เน็ต
                    กรุณาหมั่นเข้ามาซิงค์ข้อมูลเมื่อเชื่อมต่อเน็ตได้แล้ว
                </Text>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backBtn: {
        padding: 4,
    },
    statsCard: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        gap: 20,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statInfo: {
        flex: 1,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    actionSection: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionInfo: {
        flex: 1,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    actionDesc: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    infoBox: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
});
