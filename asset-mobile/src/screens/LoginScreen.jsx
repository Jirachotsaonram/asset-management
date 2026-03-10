import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_SERVER_IP, buildApiUrl } from '../utils/constants';
import { SERVER_IP_KEY } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  // Server Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [serverIp, setServerIp] = useState('');
  const [currentIp, setCurrentIp] = useState('');
  const [savingIp, setSavingIp] = useState(false);

  // โหลด IP ที่บันทึกไว้เมื่อเปิดแอป
  useEffect(() => {
    loadSavedIp();
  }, []);

  const loadSavedIp = async () => {
    try {
      const savedIp = await AsyncStorage.getItem(SERVER_IP_KEY);
      const ip = savedIp || DEFAULT_SERVER_IP;
      setCurrentIp(ip);
      setServerIp(ip);
    } catch (e) {
      setCurrentIp(DEFAULT_SERVER_IP);
      setServerIp(DEFAULT_SERVER_IP);
    }
  };

  const openSettings = async () => {
    await loadSavedIp();  // โหลดค่าล่าสุดก่อนเปิด
    setShowSettings(true);
  };

  const handleSaveIp = async () => {
    const ip = serverIp.trim();
    if (!ip) {
      Alert.alert('ผิดพลาด', 'กรุณากรอก IP Address หรือ URL ของ Server');
      return;
    }
    setSavingIp(true);
    try {
      await AsyncStorage.setItem(SERVER_IP_KEY, ip);
      setCurrentIp(ip);
      setShowSettings(false);
      Alert.alert('บันทึกสำเร็จ', `ตั้งค่า Server เป็น:\n${buildApiUrl(ip)}`);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSavingIp(false);
    }
  };

  const handleResetIp = async () => {
    Alert.alert(
      'คืนค่าเริ่มต้น',
      `ต้องการคืนค่า Server IP เป็นค่าเริ่มต้น?\n(${DEFAULT_SERVER_IP})`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'คืนค่า',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(SERVER_IP_KEY);
              setServerIp(DEFAULT_SERVER_IP);
              setCurrentIp(DEFAULT_SERVER_IP);
              setShowSettings(false);
              Alert.alert('คืนค่าสำเร็จ', 'ระบบจะใช้ Server IP เริ่มต้น');
            } catch (e) {
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถคืนค่าได้');
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await login({ username, password });
      if (result.success) {
        console.log('Login successful');
      } else {
        setError(result.message || 'กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      if (error.response) {
        errorMessage = error.response.data?.message || `เกิดข้อผิดพลาด (${error.response.status})`;
      } else if (error.request) {
        errorMessage = 'เชื่อมต่อ Server ไม่ได้ — กรุณาตรวจสอบ IP ในไอคอนตั้งค่า ⚙️';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsBtn} onPress={openSettings}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📦</Text>
          <Text style={styles.title}>ระบบจัดการครุภัณฑ์</Text>
          <Text style={styles.subtitle}>ภาควิชาเทคโนโลยีสารสนเทศ</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>รหัสผ่าน</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกรหัสผ่าน"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server IP indicator */}
        <TouchableOpacity onPress={openSettings} style={styles.serverIndicator}>
          <Ionicons name="server-outline" size={12} color="#C7D2FE" />
          <Text style={styles.serverText}> {currentIp || DEFAULT_SERVER_IP}</Text>
        </TouchableOpacity>

      </View>

      {/* ===== Server Settings Modal ===== */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ ตั้งค่า Server</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>IP Address หรือ URL ของ Server</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="เช่น 192.168.1.100 หรือ http://192.168.1.100"
                placeholderTextColor="#9CA3AF"
                value={serverIp}
                onChangeText={setServerIp}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <View style={styles.urlPreview}>
                <Ionicons name="link-outline" size={14} color="#6B7280" />
                <Text style={styles.urlPreviewText} numberOfLines={2}>
                  {serverIp?.trim() ? buildApiUrl(serverIp.trim()) : 'กรอก IP เพื่อดู URL'}
                </Text>
              </View>

              <Text style={styles.modalHint}>
                💡 กรอกเฉพาะ IP Address (เช่น 192.168.1.50){'\n'}
                หรือ URL เต็ม (เช่น http://192.168.1.50/path)
              </Text>

              <TouchableOpacity
                style={[styles.saveButton, savingIp && styles.buttonDisabled]}
                onPress={handleSaveIp}
                disabled={savingIp}
              >
                {savingIp ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="#fff" />
                    <Text style={styles.saveButtonText}> บันทึกการตั้งค่า</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={handleResetIp}>
                <Ionicons name="refresh-outline" size={16} color="#EF4444" />
                <Text style={styles.resetButtonText}> คืนค่าเริ่มต้น ({DEFAULT_SERVER_IP})</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  settingsBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  serverIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  serverText: {
    color: '#C7D2FE',
    fontSize: 11,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  urlPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  modalHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginBottom: 8,
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});
