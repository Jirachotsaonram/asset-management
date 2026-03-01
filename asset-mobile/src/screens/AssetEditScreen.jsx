import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ASSET_STATUS } from '../utils/constants';

export default function AssetEditScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { asset: initialAsset, mode = 'edit' } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        asset_name: '',
        serial_number: '',
        barcode: '',
        price: '',
        quantity: '1',
        unit: 'ชิ้น',
        status: ASSET_STATUS.AVAILABLE,
        department_id: null,
        location_id: null,
        room_text: '',
        description: '',
        faculty_name: '',
        reference_number: '',
        delivery_number: '',
        fund_code: '',
        plan_code: '',
        project_code: '',
    });

    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        fetchMetadata();
        if (mode === 'edit' && initialAsset) {
            // Pre-fill form
            setFormData({
                ...initialAsset,
                price: initialAsset.price ? String(initialAsset.price) : '',
                quantity: initialAsset.quantity ? String(initialAsset.quantity) : '1',
            });
        }
    }, []);

    const fetchMetadata = async () => {
        try {
            const [deptRes, locRes] = await Promise.all([
                api.get('/departments'),
                api.get('/locations')
            ]);
            if (deptRes.data.success) setDepartments(deptRes.data.data);
            if (locRes.data.success) setLocations(locRes.data.data);
        } catch (error) {
            console.error('Error fetching metadata:', error);
            // Non-critical error, just log it. Data fields will remain empty/uneditable if they rely on this.
        }
    };

    const handleSave = async () => {
        if (!formData.asset_name) {
            Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อครุภัณฑ์');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                price: formData.price ? parseFloat(formData.price) : 0,
                quantity: formData.quantity ? parseInt(formData.quantity) : 1,
            };

            let response;
            if (mode === 'edit') {
                response = await api.put(`/assets/${initialAsset.asset_id}`, payload);
            } else {
                response = await api.post('/assets', payload);
            }

            if (response.data.success) {
                Alert.alert('สำเร็จ', mode === 'edit' ? 'แก้ไขข้อมูลเรียบร้อยแล้ว' : 'เพิ่มครุภัณฑ์เรียบร้อยแล้ว', [
                    { text: 'ตกลง', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Error saving asset:', error);
            let errorMessage = 'ไม่สามารถบันทึกข้อมูลได้';

            if (error.response) {
                // The server responded with a status code outside the range of 2xx
                errorMessage = error.response.data?.message || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${error.response.status})`;
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ IP Address ในการเชื่อมต่อ';
            } else {
                errorMessage = error.message;
            }

            if (error.response && error.response.status === 403) {
                errorMessage = 'ท่านไม่มีสิทธิ์เพิ่ม/แก้ไขครุภัณฑ์\nกรุณาติดต่อผู้ดูแลระบบให้เปลี่ยน Role เป็น Inspector หรือ Admin';
            }
            Alert.alert('เกิดข้อผิดพลาด', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label, key, placeholder, keyboardType = 'default', multiline = false) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={String(formData[key] || '')}
                onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
                placeholder={placeholder}
                keyboardType={keyboardType}
                multiline={multiline}
                editable={!loading}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );

    const formContent = (
        <ScrollView
            style={styles.formContent}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ข้อมูลพื้นฐาน</Text>
                {renderInput('ชื่อครุภัณฑ์ *', 'asset_name', 'เช่น คอมพิวเตอร์ตั้งโต๊ะ')}
                {renderInput('Serial Number', 'serial_number', 'S/N จากผู้ผลิต')}
                {renderInput('Barcode / QR Code', 'barcode', 'รหัสที่ติดบนตัวเครื่อง')}
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>{renderInput('ราคา', 'price', '0.00', 'numeric')}</View>
                    <View style={{ flex: 1, marginLeft: 15 }}>{renderInput('จำนวน', 'quantity', '1', 'numeric')}</View>
                </View>
                {renderInput('หน่วย', 'unit', 'เช่น เครื่อง, ชุด, ชิ้น')}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ตำแหน่งและสถานที่</Text>
                {renderInput('คณะ/ภาควิชา', 'faculty_name', 'เช่น คณะเทคโนโลยีสารสนเทศ')}
                {renderInput('พื้นที่ (ห้อง/อาคาร)', 'room_text', 'ระบุรายละเอียดสถานที่')}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>งบประมาณและโครงการ</Text>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>{renderInput('รหัสกองทุน', 'fund_code', '')}</View>
                    <View style={{ flex: 1, marginLeft: 15 }}>{renderInput('รหัสแผน', 'plan_code', '')}</View>
                </View>
                {renderInput('รหัสโครงการ', 'project_code', '')}
                {renderInput('เลขที่ใบส่งของ', 'delivery_number', '')}
                {renderInput('เลขที่ใบตรวจรับ', 'reference_number', '')}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>สถานะ</Text>
                <View style={styles.statusRow}>
                    {Object.values(ASSET_STATUS).map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[
                                styles.statusChip,
                                formData.status === s && styles.statusChipActive,
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, status: s }))}
                        >
                            <Text style={[
                                styles.statusChipText,
                                formData.status === s && styles.statusChipTextActive,
                            ]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>อื่น ๆ</Text>
                {renderInput('รายละเอียด/หมายเหตุ', 'description', 'ระบุข้อมูลเพิ่มเติม...', 'default', true)}
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{mode === 'edit' ? 'แก้ไขครุภัณฑ์' : 'เพิ่มครุภัณฑ์ใหม่'}</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>{loading ? '...' : 'บันทึก'}</Text>
                </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={64}>
                    {formContent}
                </KeyboardAvoidingView>
            ) : (
                formContent
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        height: 64,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    formContent: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 48,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    statusRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        marginBottom: 4,
    },
    statusChipActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    statusChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    statusChipTextActive: {
        color: '#2563EB',
        fontWeight: '700',
    },
});
