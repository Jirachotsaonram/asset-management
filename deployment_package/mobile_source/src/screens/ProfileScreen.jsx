import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบหรือไม่?', [
      {
        text: 'ยกเลิก',
        style: 'cancel',
      },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color="#2563EB" />
        </View>
        <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
        <Text style={styles.userRole}>{user?.role || 'ผู้ใช้'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ข้อมูลผู้ใช้</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชื่อผู้ใช้</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
          {user?.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>อีเมล</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          )}
          {user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เบอร์โทร</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>สิทธิ์การใช้งาน</Text>
            <View
              style={[
                styles.roleBadge,
                user?.role === 'Admin' && styles.roleBadgeAdmin,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  user?.role === 'Admin' && styles.roleTextAdmin,
                ]}
              >
                {user?.role || 'Viewer'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>การจัดการข้อมูล</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Import')}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#2563EB" />
          <Text style={styles.menuText}>นำเข้าข้อมูล (File / OCR)</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Offline')}
        >
          <Ionicons name="cloud-offline-outline" size={24} color="#2563EB" />
          <Text style={styles.menuText}>จัดการข้อมูลออฟไลน์</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={[styles.menuText, styles.logoutText]}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Asset Management Mobile App</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    padding: 16,
    paddingBottom: 8,
  },
  infoCard: {
    padding: 16,
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  roleBadgeAdmin: {
    backgroundColor: '#DBEAFE',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  roleTextAdmin: {
    color: '#1E40AF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  logoutText: {
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});

