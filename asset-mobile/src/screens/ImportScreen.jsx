import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import api from '../services/api';

const { width } = Dimensions.get('window');

// ============================================================
// EXCEL UTILITIES (Ported from Web)
// ============================================================
const COLUMN_MAP = {
    'ชื่อครุภัณฑ์': 'asset_name',
    'ชื่อครุภัณฑ์ [รหัสชุด:ชื่อชุด]': 'asset_name',
    'ชื่อตั้งเบิก': 'asset_name',
    'หมายเลขครุภัณฑ์': 'barcode',
    'หมายเลขซีเรียล': 'serial_number',
    'มูลค่าครุภัณฑ์': 'price',
    'หน่วยนับ': 'unit',
    'วันที่รับเข้าคลัง': 'received_date',
    'วันที่ส่งของ': 'received_date',
    'วันที่ตรวจรับ': 'received_date',
    'ใช้ประจำห้อง': 'location_name',
    'หมายเหตุ': 'description',
    'รายละเอียด': 'description',
    'คุณสมบัติ': 'description_extra',
    'ปีงบประมาณ': 'budget_year',
    'เลขที่ใบส่งของ': 'delivery_number',
    'ผู้ขาย': 'vendor',
    'ผู้เบิก': 'requester',
    'ชื่อคณะ': 'faculty_name',
    'ชื่อภาค/กอง': 'department_name_excel',
    'รหัสสินทรัพย์': 'asset_code',
    'รหัสกองทุน': 'fund_code',
    'รหัสแผนงาน': 'plan_code',
    'รหัสงาน/โครงการ': 'project_code',
};

function parseExcelDate(value) {
    if (!value || value === '-' || value === '') return '';
    if (typeof value === 'number' && value > 1000) {
        try {
            const date = XLSX.SSF.parse_date_code(value);
            if (date && date.y > 1900) {
                let year = date.y;
                if (year > 2400) year -= 543;
                return `${year}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
        } catch (e) { }
    }
    if (typeof value === 'string') {
        const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            let year = parseInt(m[3]);
            if (year > 2400) year -= 543;
            return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    }
    return String(value);
}

function findHeaderRow(sheetData) {
    let bestRow = 0, bestScore = 0;
    const knownCols = Object.keys(COLUMN_MAP);
    for (let i = 0; i < Math.min(sheetData.length, 10); i++) {
        const row = sheetData[i];
        if (!Array.isArray(row)) continue;
        let score = 0;
        for (const cell of row) {
            const s = String(cell).trim();
            if (!s || s.length < 2) continue;
            if (COLUMN_MAP[s]) { score += 2; continue; }
            if (knownCols.some(k => k.length >= 3 && (s.includes(k) || k.includes(s)))) score++;
        }
        if (score > bestScore) { bestScore = score; bestRow = i; }
    }
    return bestRow;
}

// ============================================================
// OCR Helper: detect category code fragments from OCR noise
// (Ported from Web)
// ============================================================
function isCategoryCodeFragment(code) {
    if (!code) return false;
    if (/^30502/.test(code)) return true;
    if (/^530502/.test(code)) return true;
    if (code.length < 12) return true;
    if (/^00/.test(code)) return true;
    return false;
}

// ============================================================
// TABLE PARSER — parse OCR text for ใบรับครุภัณฑ์เข้าคลัง format
// (Ported from Web)
// ============================================================
function parseAssetTable(text) {
    if (!text) return [];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const assets = [];

    // --- Extract date from header ---
    let docDate = '';
    const dateMatch = text.match(/วันที่[^\d]*(\d{1,2})\s*(?:ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*(\d{4})/i);
    if (dateMatch) {
        const thMonths = {
            'ม.ค': '01', 'มค': '01', 'ก.พ': '02', 'กพ': '02', 'มี.ค': '03', 'มีค': '03',
            'เม.ย': '04', 'เมย': '04', 'พ.ค': '05', 'พค': '05', 'มิ.ย': '06', 'มิย': '06',
            'ก.ค': '07', 'กค': '07', 'ส.ค': '08', 'สค': '08', 'ก.ย': '09', 'กย': '09',
            'ต.ค': '10', 'ตค': '10', 'พ.ย': '11', 'พย': '11', 'ธ.ค': '12', 'ธค': '12'
        };
        const monthStr = text.match(/วันที่[^\d]*\d{1,2}\s*(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)/i);
        if (monthStr) {
            const clean = monthStr[1].replace(/\./g, '').replace(/\s/g, '');
            for (const [k, v] of Object.entries(thMonths)) {
                if (k.replace(/\./g, '') === clean) {
                    let year = parseInt(dateMatch[2]);
                    if (year > 2500) year -= 543;
                    const day = dateMatch[1].padStart(2, '0');
                    docDate = `${year}-${v}-${day}`;
                    break;
                }
            }
        }
    }

    const detectedRows = [];
    const usedLines = new Set();

    // Strategy 1: "N  XXXXXXXXXXXXX"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(/(?:^|[^\d])(\d{1,3})\s+(\d{12,15})(?:\s|$|[^\d-])/);
        if (m) {
            const orderNum = parseInt(m[1]);
            const code = m[2];
            if (isCategoryCodeFragment(code)) continue;
            if (orderNum >= 1 && orderNum <= 500) {
                const matchEnd = m.index + m[0].length;
                detectedRows.push({ lineIdx: i, orderNum, assetCode: code, matchEnd });
                usedLines.add(i);
            }
        }
    }

    // Strategy 2: Standalone 12-15 digit codes
    if (detectedRows.length < 3) {
        detectedRows.length = 0;
        usedLines.clear();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/ลำดับ|รหัสทรัพย์สิน|รหัสทรัพย์|ราคา.หน่วย|หน่วยนับ|ลงชื่อ|ผู้นำ|หัวหน้า|รวม.*ทั้งสิ้น|มหาวิทยาลัย|ใบรับครุภัณฑ์|คณะเทคโนโลยี/)) continue;
            if (line.match(/^[^a-zA-Z\u0E00-\u0E7F]*[S!|]?\s*30502\s*[-]?\s*0{2,}/i)) continue;

            const codeMatches = [...line.matchAll(/(?<!\d)(\d{12,15})(?!\d)/g)];
            for (const cm of codeMatches) {
                const code = cm[1];
                if (isCategoryCodeFragment(code)) continue;
                if (detectedRows.some(r => r.assetCode === code && r.lineIdx === i)) continue;

                const hasPrice = line.match(/\d{1,3}(?:,\d{3})*\.\d{2}/);
                const hasUnit = line.match(/(?:เครื่อง|ชุด|อัน|ตัว|ตู้|ชิ้น)/);

                if (hasPrice || hasUnit || line.length > 40) {
                    let orderNum = detectedRows.length + 1;
                    const beforeCode = line.substring(0, cm.index);
                    const orderMatch = beforeCode.match(/(\d{1,3})\s*$/);
                    if (orderMatch) {
                        const num = parseInt(orderMatch[1]);
                        if (num >= 1 && num <= 500) orderNum = num;
                    }

                    detectedRows.push({
                        lineIdx: i,
                        orderNum,
                        assetCode: code,
                        matchEnd: cm.index + code.length
                    });
                    usedLines.add(i);
                    break;
                }
            }
        }
    }

    const uniqueRows = [];
    const seenLineIdx = new Set();
    for (const row of detectedRows) {
        if (!seenLineIdx.has(row.lineIdx)) {
            uniqueRows.push(row);
            seenLineIdx.add(row.lineIdx);
        }
    }
    uniqueRows.sort((a, b) => a.lineIdx - b.lineIdx);

    for (let r = 0; r < uniqueRows.length; r++) {
        const row = uniqueRows[r];
        const nextLineIdx = r + 1 < uniqueRows.length ? uniqueRows[r + 1].lineIdx : lines.length;

        let rowText = lines[row.lineIdx].substring(row.matchEnd);
        const beforeText = lines[row.lineIdx].substring(0, Math.max(0, row.matchEnd - row.assetCode.length - 5));

        for (let j = row.lineIdx + 1; j < nextLineIdx && j < lines.length; j++) {
            const line = lines[j];
            if (line.match(/ลงชื่อ|ผู้นำเข้า|หัวหน้า|รวม.*ทั้งสิ้น/)) break;
            if (line.match(/มหาวิทยาลัย|ใบรับครุภัณฑ์เข้าคลัง|คณะเทคโนโลยี/)) break;
            rowText += ' ' + line;
        }

        const fullRowText = (beforeText ? beforeText + ' ' : '') + row.assetCode + ' ' + rowText;

        const asset = {
            id: Date.now() + r + Math.random(),
            asset_name: '',
            serial_number: row.assetCode,
            quantity: 1,
            unit: 'เครื่อง',
            price: '',
            received_date: docDate || new Date().toISOString().split('T')[0],
            department_id: '',
            location_id: '',
            status: 'ใช้งานได้',
            barcode: '',
            description: '',
            reference_number: ''
        };

        const priceMatch = rowText.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/);
        if (priceMatch) {
            asset.price = priceMatch[1].replace(/,/g, '');
        }

        const unitMatch = rowText.match(/(เครื่อง|ชุด|อัน|ตัว|ตู้|ชิ้น)/);
        if (unitMatch) {
            asset.unit = unitMatch[1];
        }

        let assetNumMatch = rowText.match(/(\d{10,})\s*[-–—]\s*(\d{3,6})\s*[-–—]\s*(\d{3,6})/);
        if (assetNumMatch) {
            asset.barcode = `${assetNumMatch[1]}-${assetNumMatch[2]}-${assetNumMatch[3]}`;
        }

        const allNums = [...rowText.matchAll(/(?<!\d)(\d{13})(?!\d|-)/g)];
        for (const nm of allNums) {
            if (nm[1] !== row.assetCode && !nm[1].includes('-')) {
                asset.reference_number = nm[1];
                break;
            }
        }

        const descMatch = rowText.match(/คุณสมบัต[ิี]?\s*[:;\-]?\s*(.+?)(?=\d{10,}-|\b\d{13}\b|หมายเลข|$)/i);
        if (descMatch) {
            asset.description = descMatch[1].trim().replace(/\s+/g, ' ').substring(0, 500);
        }

        let nameText = fullRowText;
        nameText = nameText.replace(new RegExp(row.assetCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        if (priceMatch) nameText = nameText.replace(priceMatch[0], '');
        if (asset.barcode) nameText = nameText.replace(asset.barcode, '');
        if (asset.reference_number) nameText = nameText.replace(asset.reference_number, '');
        if (descMatch) nameText = nameText.replace(descMatch[0], '');
        nameText = nameText.replace(/(เครื่อง|ชุด|อัน|ตัว|ตู้|ชิ้น)/g, '');
        nameText = nameText.replace(/คุณสมบัต[ิี]?.*/i, '');
        nameText = nameText.replace(/\b\d{10,}\b/g, '');
        nameText = nameText.replace(/^\s*\d{1,3}\s+/, '');
        nameText = nameText.replace(/[|/\\[\]{}()]/g, ' ');
        nameText = nameText.replace(/\s+/g, ' ').trim();
        nameText = nameText.replace(/^[\s,.\-:;]+/, '').replace(/[\s,.\-:;]+$/, '');

        const nameParts = nameText.split(/(?:ครุภัณฑ์ก่อสร้าง|ครุภัณฑ์สำนักงาน|ครุภัณฑ์โรงงาน|ครุภัณฑ์การศึกษา|\[S\d+)/);
        if (nameParts[0] && nameParts[0].trim().length > 2) {
            nameText = nameParts[0].trim();
        }

        if (nameText.length > 2) {
            asset.asset_name = nameText.substring(0, 200);
        }

        assets.push(asset);
    }

    return assets;
}

const ImportScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('file'); // 'file' or 'ocr'
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [validationResults, setValidationResults] = useState({ valid: [], errors: [], stats: {} });
    const [step, setStep] = useState(1); // 1: Upload/Select, 2: Preview, 3: Validation, 4: Success

    // Reference data
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        loadReferences();
    }, []);

    const loadReferences = async () => {
        try {
            const [deptRes, locRes] = await Promise.all([
                api.get('/departments'),
                api.get('/locations')
            ]);
            if (deptRes.data.success) setDepartments(deptRes.data.data);
            if (locRes.data.success) setLocations(locRes.data.data);
        } catch (error) {
            console.error('Error loading references:', error);
        }
    };

    const handleFileSelect = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setLoading(true);

            if (file.name.endsWith('.csv')) {
                // Read CSV
                const response = await fetch(file.uri);
                const text = await response.text();
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setParsedData(results.data);
                        setStep(2);
                        setLoading(false);
                    },
                    error: (err) => {
                        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอ่านไฟล์ CSV ได้');
                        setLoading(false);
                    }
                });
            } else {
                // Read Excel
                const response = await fetch(file.uri);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.SheetNames[0];
                    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

                    if (rawData.length === 0) {
                        Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลในไฟล์ Excel');
                        setLoading(false);
                        return;
                    }

                    const headerIdx = findHeaderRow(rawData);
                    const headers = rawData[headerIdx];
                    const dataRows = rawData.slice(headerIdx + 1);

                    const mappedData = dataRows.map(row => {
                        const obj = {};
                        headers.forEach((h, i) => {
                            const field = COLUMN_MAP[String(h).trim()];
                            if (field) {
                                let val = row[i];
                                if (field === 'received_date') val = parseExcelDate(val);
                                obj[field] = val;
                            }
                        });
                        // Defaults
                        if (!obj.quantity) obj.quantity = 1;
                        if (!obj.status) obj.status = 'ใช้งานได้';
                        return obj;
                    }).filter(r => r.asset_name);

                    setParsedData(mappedData);
                    setStep(2);
                    setLoading(false);
                };
                reader.readAsArrayBuffer(blob);
            }
        } catch (error) {
            console.error('File selection error:', error);
            Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเลือกไฟล์');
            setLoading(false);
        }
    };

    const handleOcrSelect = async (useCamera = false) => {
        try {
            let result;
            if (useCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('ต้องการสิทธิ์', 'กรุณาอนุญาตให้แอปเข้าถึงกล้อง');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    quality: 0.7,
                    allowsEditing: true,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    quality: 0.7,
                    allowsEditing: true,
                });
            }

            if (result.canceled) return;

            const imageUri = result.assets[0].uri;
            runOcr(imageUri);
        } catch (error) {
            console.error('OCR selection error:', error);
            Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเลือกรูปภาพ');
        }
    };

    const runOcr = async (imageUri) => {
        setProcessing(true);
        setOcrProgress(0);
        setOcrStatus('กำลังส่งรูปประมวลผลไปยัง Server...');

        try {
            // Prepare FormData (Multipart) for more efficient upload
            const formData = new FormData();
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                name: filename,
                type: type
            });

            setOcrStatus('กำลังรอผลลัพธ์จาก Server (อาจใช้เวลา 30-60 วินาที)...');

            // Fast progress simulation
            const progressInterval = setInterval(() => {
                setOcrProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 500);

            // Use extended timeout for OCR (60s)
            const apiRes = await api.post('/import/ocr', formData, {
                timeout: 60000
            });

            clearInterval(progressInterval);
            setOcrProgress(100);

            if (apiRes.data.success && apiRes.data.data.text) {
                const text = apiRes.data.data.text;
                const assets = parseAssetTable(text);
                if (assets.length > 0) {
                    setParsedData(assets);
                    setStep(2);
                } else {
                    Alert.alert('ไม่พบข้อมูล', 'ไม่พบรายการครุภัณฑ์ในผลลัพธ์ OCR กรุณาลองใหม่อีกครั้งด้วยรูปที่ชัดเจนกว่าเดิม');
                }
            } else {
                Alert.alert('ข้อผิดพลาด', apiRes.data.message || 'การประมวลผล OCR ล้มเหลว');
            }
        } catch (err) {
            console.error('OCR API Error Details:', {
                message: err.message,
                code: err.code,
                response: err.response?.data,
                config: {
                    url: err.config?.url,
                    method: err.config?.method,
                    headers: err.config?.headers
                }
            });
            let msg = 'ไม่สามารถเชื่อมต่อกับ Server OCR ได้';
            if (err.code === 'ECONNABORTED') msg = 'การประมวลผลใช้เวลานานเกินไป (Timeout)';
            Alert.alert('ข้อผิดพลาด', `${msg}. กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และตรวจสอบว่า Server ได้ติดตั้ง Tesseract OCR แล้ว`);
        } finally {
            setProcessing(false);
        }
    };

    const validateData = async () => {
        try {
            setLoading(true);
            const rows = parsedData.map(({ id, ...rest }) => rest);
            // Increase timeout to 120 seconds for large validation batches
            const response = await api.post('/import/validate', { rows }, { timeout: 120000 });

            if (response.data.success) {
                setValidationResults(response.data.data);
                setStep(3);
            } else {
                Alert.alert('ข้อผิดพลาด', response.data.message || 'การตรวจสอบข้อมูลล้มเหลว');
            }
        } catch (error) {
            console.error('Validation error:', error);
            const msg = error.code === 'ECONNABORTED'
                ? 'Server ใช้เวลาตรวจสอบข้อมูลนานเกินไป กรุณาลองใหม่ด้วยจำนวนรายการที่น้อยลง'
                : 'ไม่สามารถเชื่อมต่อกับ Server เพื่อตรวจสอบข้อมูลได้';
            Alert.alert('ข้อผิดพลาด', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            const validRows = validationResults?.valid || [];
            const rows = validRows.map(item => item.data);

            if (rows.length === 0) {
                Alert.alert('ข้อผิดพลาด', 'ไม่มีข้อมูลที่ถูกต้องสำหรับการนำเข้า');
                return;
            }
            const response = await api.post('/import/assets', { rows });

            if (response.data.success) {
                setStep(4);
            } else {
                Alert.alert('ข้อผิดพลาด', response.data.message || 'ไม่สามารถนำเข้าข้อมูลได้');
            }
        } catch (error) {
            console.error('Import error:', error);
            Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการส่งข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'file' && styles.activeTab]}
                    onPress={() => setActiveTab('file')}
                >
                    <Ionicons name="document-text" size={20} color={activeTab === 'file' ? '#2563EB' : '#6B7280'} />
                    <Text style={[styles.tabText, activeTab === 'file' && styles.activeTabText]}>ไฟล์ CSV/Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'ocr' && styles.activeTab]}
                    onPress={() => setActiveTab('ocr')}
                >
                    <Ionicons name="camera" size={20} color={activeTab === 'ocr' ? '#2563EB' : '#6B7280'} />
                    <Text style={[styles.tabText, activeTab === 'ocr' && styles.activeTabText]}>สแกน OCR</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'file' ? (
                    <View style={styles.uploadBox}>
                        <Ionicons name="cloud-upload-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.uploadTitle}>คลิกเลือกไฟล์เพื่อนำเข้า</Text>
                        <Text style={styles.uploadSubtitle}>รองรับไฟล์ .csv, .xls, .xlsx</Text>
                        <TouchableOpacity style={styles.selectButton} onPress={handleFileSelect}>
                            <Text style={styles.selectButtonText}>เลือกไฟล์</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.uploadBox}>
                        <Ionicons name="camera-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.uploadTitle}>สแกนใบรับครุภัณฑ์</Text>
                        <Text style={styles.uploadSubtitle}>ระบบจะอ่านข้อมูลจากเอกสารให้อัตโนมัติ</Text>
                        <View style={styles.ocrButtons}>
                            <TouchableOpacity style={styles.selectButton} onPress={() => handleOcrSelect(true)}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                                <Text style={styles.selectButtonText}>ถ่ายรูป</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.selectButton, styles.galleryButton]} onPress={() => handleOcrSelect(false)}>
                                <Ionicons name="images" size={20} color="#2563EB" />
                                <Text style={styles.galleryButtonText}>เลือกจากคลังภาพ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {processing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.processingText}>{ocrStatus}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressInner, { width: `${ocrProgress}%` }]} />
                    </View>
                    <Text style={styles.progressValue}>{ocrProgress}%</Text>
                </View>
            )}
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.previewHeader}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.previewTitle}>ตรวจสอบข้อมูล ({parsedData.length} รายการ)</Text>
            </View>

            <ScrollView style={styles.previewList}>
                {parsedData.map((item, index) => (
                    <View key={index} style={styles.previewItem}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemIndex}>#{index + 1}</Text>
                            <Text style={styles.itemName} numberOfLines={1}>{item.asset_name || 'ไม่มีชื่อ'}</Text>
                        </View>
                        <View style={styles.itemDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>รหัส:</Text>
                                <Text style={styles.detailValue}>{item.serial_number || '-'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>ราคา:</Text>
                                <Text style={styles.detailValue}>{item.price ? Number(item.price).toLocaleString() : '-'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>หมายเลข:</Text>
                                <Text style={styles.detailValue}>{item.barcode || '-'}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.importButton, loading && styles.disabledButton]}
                    onPress={validateData}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : (
                        <>
                            <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.importButtonText}>ตรวจสอบข้อมูลก่อนนำเข้า</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => {
        const summary = validationResults?.summary || {};
        const invalidItems = validationResults?.invalid || [];
        const validItems = validationResults?.valid || [];

        return (
            <View style={styles.stepContainer}>
                <View style={styles.previewHeader}>
                    <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.previewTitle}>ผลการตรวจสอบ</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.statValue, { color: '#059669' }]}>{summary.valid_count || 0}</Text>
                        <Text style={styles.statLabel}>ถูกต้อง</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={[styles.statValue, { color: '#DC2626' }]}>{summary.invalid_count || 0}</Text>
                        <Text style={styles.statLabel}>มีข้อผิดพลาด</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={styles.statValue}>{summary.total || 0}</Text>
                        <Text style={styles.statLabel}>ทั้งหมด</Text>
                    </View>
                </View>

                <ScrollView style={styles.previewList}>
                    {invalidItems.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.sectionTitle}>รายการที่มีข้อผิดพลาด</Text>
                            {invalidItems.map((item, index) => (
                                <View key={index} style={styles.errorCard}>
                                    <View style={styles.errorHeader}>
                                        <Text style={styles.assetNameText}>แถวที่ {item.row}: {item.data?.asset_name || 'ไม่มีชื่อ'}</Text>
                                        <Ionicons name="alert-circle" size={20} color="#DC2626" />
                                    </View>
                                    {item.errors.map((err, i) => (
                                        <Text key={i} style={styles.errorMsgText}>• {err}</Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}

                    {validItems.length > 0 && (
                        <View>
                            <Text style={styles.sectionTitle}>รายการที่พร้อมนำเข้า</Text>
                            {validItems.slice(0, 10).map((item, index) => (
                                <View key={index} style={styles.validCard}>
                                    <View style={styles.errorHeader}>
                                        <Text style={styles.assetNameText}>{item.data?.asset_name}</Text>
                                        <Text style={styles.itemIndex}>#{item.row}</Text>
                                    </View>
                                    <Text style={styles.assetDetailText}>{item.data?.barcode || 'ไม่มีเลขครุภัณฑ์'}</Text>
                                </View>
                            ))}
                            {validItems.length > 10 && (
                                <Text style={styles.moreText}>... และอีก {validItems.length - 10} รายการ</Text>
                            )}
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.footer, { flexDirection: 'row', gap: 12 }]}>
                    <TouchableOpacity
                        style={[styles.importButton, { flex: 1, backgroundColor: '#6B7280' }]}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.importButtonText}>กลับไปแก้ไข</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.importButton, { flex: 2 }, (loading || validItems.length === 0) && styles.disabledButton]}
                        onPress={handleImport}
                        disabled={loading || validItems.length === 0}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="cloud-upload" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.importButtonText}>นำเข้ารายการที่ถูก</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStep4 = () => (
        <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={100} color="#10B981" />
            <Text style={styles.successTitle}>นำเข้าข้อมูลสำเร็จ!</Text>
            <Text style={styles.successSubtitle}>ข้อมูลครุภัณฑ์ของคุณถูกบันทึกเข้าระบบเรียบร้อยแล้ว</Text>
            <TouchableOpacity
                style={styles.homeButton}
                onPress={() => navigation.navigate('Dashboard')}
            >
                <Text style={styles.homeButtonText}>กลับหน้าหลัก</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    stepContainer: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 8,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#2563EB',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    uploadBox: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 8,
    },
    uploadSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 30,
    },
    selectButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    selectButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    ocrButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    galleryButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    galleryButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    processingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 12,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressInner: {
        height: '100%',
        backgroundColor: '#2563EB',
    },
    progressValue: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    previewList: {
        flex: 1,
        padding: 16,
    },
    previewItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    itemIndex: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2563EB',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    itemDetails: {
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    importButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    importButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
    },
    homeButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    homeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Validation View Styles
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
        marginTop: 8,
    },
    errorCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
    },
    errorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    assetNameText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    errorMsgText: {
        fontSize: 13,
        color: '#DC2626',
        marginTop: 2,
    },
    validCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderLeftWidth: 4,
        borderLeftColor: '#059669',
    },
    assetDetailText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    moreText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#6B7280',
        padding: 12,
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default ImportScreen;
