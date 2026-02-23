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
  const [stats, setStats] = useState({
    total: 0,
    checked: 0,
    unchecked: 0,
    available: 0,
    maintenance: 0,
    missing: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Optimized: Fetch summary stats instead of full asset list
      const [statusRes, uncheckedRes] = await Promise.all([
        api.get('/reports/by-status').catch(() => ({ data: { data: [] } })),
        api.get('/reports/unchecked?days=365').catch(() => ({ data: { data: [] } })),
      ]);

      const statusData = statusRes.data.data || [];
      const uncheckedAssets = uncheckedRes.data.data || [];

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
        checked: total - uncheckedAssets.length,
        unchecked: uncheckedAssets.length,
        available,
        maintenance,
        missing,
      });
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>ยินดีต้อนรับ,</Text>
        <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
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
});

