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
        department_id: '',
        location_id: '',
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
            Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
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
            />
        </View>
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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.formContent} contentContainerStyle={{ paddingBottom: 40 }}>
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
                        {/* Simple selection simulation since we don't have a picker library installed yet */}
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
                        <Text style={styles.sectionTitle}>อื่น ๆ</Text>
                        {renderInput('รายละเอียด/หมายเหตุ', 'description', 'ระบุข้อมูลเพิ่มเติม...', 'default', true)}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        height: 44,
        fontSize: 15,
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
});
