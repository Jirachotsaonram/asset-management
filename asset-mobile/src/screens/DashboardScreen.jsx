import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, checked: 0, unchecked: 0, available: 0, maintenance: 0, missing: 0 });
  const [allNotifications, setAllNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statusRes, uncheckedRes, allNotifsRes] = await Promise.all([
        api.get('/reports/by-status').catch((e) => { console.warn('Status API error:', e.message); return { data: { data: [] } }; }),
        api.get('/reports/unchecked?days=365').catch((e) => { console.warn('Unchecked API error:', e.message); return { data: { data: [] } }; }),
        api.get('/check-schedules/all-notifications').catch((e) => { console.warn('Notifications API error:', e.message); return { data: { data: [] } }; }),
      ]);

      const statusData = statusRes.data.data || [];
      const uncheckedData = uncheckedRes.data.data || { items: [], total: 0 };
      const uncheckedCount = typeof uncheckedData.total === 'number' ? uncheckedData.total : (uncheckedData.items?.length || 0);

      // Map status data to stats
      let total = 0;
      let available = 0;
      let maintenance = 0;
      let missing = 0;

      statusData.forEach(item => {
        const count = parseInt(item.count);
        total += count;
        if (item.status === 'ใช้งานได้') available = count;
        if (item.status === 'รอซ่อม') maintenance = count;
        if (item.status === 'ไม่พบ') missing = count;
      });

      setStats({
        total,
        checked: Math.max(0, total - uncheckedCount),
        unchecked: uncheckedCount,
        available,
        maintenance,
        missing,
      });

      setAllNotifications(allNotifsRes.data.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const StatCard = ({ title, value, icon, color, bgColor, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statContent}>
        <View style={styles.statLeft}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
        <Ionicons name={icon} size={40} color={color} style={styles.statIcon} />
      </View>
    </TouchableOpacity>
  );

  // จัดกลุ่ม notifications ตามประเภท
  const groupedNotifications = allNotifications.reduce((groups, notif) => {
    const type = notif.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(notif);
    return groups;
  }, {});

  const typeLabels = {
    overdue_check: '🔴 เลยกำหนดตรวจสอบ',
    upcoming_check: '🟡 ใกล้ถึงกำหนดตรวจสอบ',
    active_borrow: '🟣 ยืมค้าง',
    never_checked: '🟠 ยังไม่เคยตรวจสอบ',
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>ยินดีต้อนรับ,</Text>
          <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={28} color="#1F2937" />
          {allNotifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {allNotifications.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="ครุภัณฑ์ทั้งหมด"
          value={stats.total}
          icon="cube-outline"
          color="#2563EB"
          bgColor="#DBEAFE"
          onPress={() => navigation.navigate('Assets')}
        />

        <StatCard
          title="ตรวจสอบแล้ว"
          value={stats.checked}
          icon="checkmark-circle-outline"
          color="#10B981"
          bgColor="#D1FAE5"
          onPress={() => navigation.navigate('Assets', { status: 'ใช้งานได้' })}
        />

        <StatCard
          title="ยังไม่ตรวจสอบ"
          value={stats.unchecked}
          icon="alert-circle-outline"
          color="#F59E0B"
          bgColor="#FEF3C7"
          onPress={() => navigation.navigate('Assets', { unchecked: true })}
        />

        <StatCard
          title="ใช้งานได้"
          value={stats.available}
          icon="checkmark-outline"
          color="#10B981"
          bgColor="#D1FAE5"
          onPress={() => navigation.navigate('Assets', { status: 'ใช้งานได้' })}
        />

        <StatCard
          title="รอซ่อม"
          value={stats.maintenance}
          icon="build-outline"
          color="#F59E0B"
          bgColor="#FEF3C7"
          onPress={() => navigation.navigate('Assets', { status: 'รอซ่อม' })}
        />

        <StatCard
          title="ไม่พบ"
          value={stats.missing}
          icon="close-circle-outline"
          color="#EF4444"
          bgColor="#FEE2E2"
          onPress={() => navigation.navigate('Assets', { status: 'ไม่พบ' })}
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>เมนูด่วน</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="qr-code-outline" size={32} color="#2563EB" />
            <Text style={styles.actionText}>สแกน QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Assets')}
          >
            <Ionicons name="list-outline" size={32} color="#2563EB" />
            <Text style={styles.actionText}>รายการครุภัณฑ์</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Check')}
          >
            <Ionicons name="checkmark-done-outline" size={32} color="#2563EB" />
            <Text style={styles.actionText}>ตรวจสอบ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Borrows')}
          >
            <Ionicons name="swap-horizontal-outline" size={32} color="#2563EB" />
            <Text style={styles.actionText}>ยืม/คืน</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RoomCheck')}
          >
            <Ionicons name="business-outline" size={32} color="#2563EB" />
            <Text style={styles.actionText}>ตรวจสอบรายห้อง</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Modal */}
      {showNotifications && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>การแจ้งเตือน</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationList}>
              {Object.entries(groupedNotifications).map(([type, items]) => (
                <View key={type} style={styles.notificationSection}>
                  <Text style={styles.sectionTitleSmall}>
                    {typeLabels[type] || type} ({items.length})
                  </Text>
                  {items.map((item, idx) => (
                    <TouchableOpacity
                      key={`${type}-${idx}`}
                      style={styles.notificationItem}
                      onPress={() => {
                        setShowNotifications(false);
                        if (type === 'active_borrow') {
                          navigation.navigate('Borrows');
                        } else {
                          navigation.navigate('Scan', { assetId: item.asset_id });
                        }
                      }}
                    >
                      <View style={[styles.notifIcon, { backgroundColor: item.bgColor }]}>
                        <Ionicons name={item.icon} size={20} color={item.color} />
                      </View>
                      <View style={styles.notifText}>
                        <Text style={styles.notifTitle}>{item.title}</Text>
                        <Text style={styles.notifDesc}>{item.message}</Text>
                        {item.detail ? <Text style={styles.notifDetail}>{item.detail}</Text> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              {allNotifications.length === 0 && (
                <View style={styles.emptyNotif}>
                  <Ionicons name="happy-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyNotifText}>ไม่มีการแจ้งเตือนใหม่</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
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
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLeft: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statIcon: {
    opacity: 0.5,
  },
  quickActions: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  notificationList: {
    paddingBottom: 20,
  },
  notificationSection: {
    marginBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifText: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  notifDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notifDetail: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  emptyNotif: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNotifText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

