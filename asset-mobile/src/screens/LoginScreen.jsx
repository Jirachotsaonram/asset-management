import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ username, password });
      if (result.success) {
        // Navigation will be handled by App.jsx based on auth state
        console.log('Login successful');
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', result.message || 'กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      Alert.alert('เกิดข้อผิดพลาด', errorMessage);
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

          <Text style={styles.hint}>ทดสอบด้วย: admin / admin123</Text>
        </View>
      </View>
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
  hint: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    marginTop: 16,
  },
});

