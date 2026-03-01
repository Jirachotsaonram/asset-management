// FILE: src/pages/ImportPage.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Download, FileText, CheckCircle, AlertCircle, X, Info, HelpCircle,
  File, RefreshCw, Loader, ArrowRight, FileSpreadsheet, Package, Database,
  AlertTriangle, Eye, ChevronDown, ChevronRight, RotateCcw, XCircle, List
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../services/api';
import OcrImportTab from '../components/Import/OcrImportTab';

// ============================================================
// EXCEL COLUMN MAPPING UTILITIES
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
  'หมวดสินทรัพย์': 'reference_number',
  'ชื่อหมวดสินทรัพย์': 'reference_number',
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
  'รหัสหมวดสินทรัพย์': 'asset_category_code',
  'รหัสกองทุน': 'fund_code',
  'รหัสแผนงาน': 'plan_code',
  'รหัสงาน/โครงการ': 'project_code',
  'จำนวน': 'quantity',
  'ราคา': 'price',
  'อาคาร/ห้อง': 'location_name',
  'สถานะ': 'status',
  'หมายเลขครุภัณฑ์ (Barcode)': 'barcode',
};

// Convert Excel serial date or Thai date string to YYYY-MM-DD
function parseExcelDate(value) {
  if (!value || value === '-' || value === '') return '';
  // Excel serial number
  if (typeof value === 'number' && value > 1000) {
    try {
      const date = XLSX.SSF.parse_date_code(value);
      if (date && date.y > 1900) {
        let year = date.y;
        // if year > 2400, it's Buddhist Era
        if (year > 2400) year -= 543;
        return `${year}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    } catch (e) { /* fallthrough */ }
  }
  // String date: DD/MM/YYYY (Thai Buddhist Era or CE)
  if (typeof value === 'string') {
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      let year = parseInt(m[3]);
      if (year > 2400) year -= 543;
      return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    // Try YYYY-MM-DD directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  return String(value);
}

// Find the header row index (row with most known column names)
function findHeaderRow(sheetData) {
  let bestRow = 0, bestScore = 0;
  const knownCols = Object.keys(COLUMN_MAP);
  for (let i = 0; i < Math.min(sheetData.length, 10); i++) {
    const row = sheetData[i];
    let score = 0;
    for (const cell of row) {
      const s = String(cell).trim();
      if (!s || s.length < 2) continue; // skip empty/single-char cells
      // Exact match in COLUMN_MAP
      if (COLUMN_MAP[s]) { score += 2; continue; }
      // Fuzzy: check if cell text contains or is contained by any known column name
      if (knownCols.some(k => k.length >= 3 && (s.includes(k) || k.includes(s)))) score++;
    }
    if (score > bestScore) { bestScore = score; bestRow = i; }
  }
  console.log('[Excel Import] Header detected at row', bestRow, 'score', bestScore);
  return bestRow;
}

// Try to match a header string to a COLUMN_MAP field
function matchColumnField(header) {
  if (!header || header.length < 2) return null;
  // Exact match first
  if (COLUMN_MAP[header]) return COLUMN_MAP[header];
  // Fuzzy: find a COLUMN_MAP key that is a substring of the header or vice-versa
  for (const [key, field] of Object.entries(COLUMN_MAP)) {
    if (key.length >= 3 && (header.includes(key) || key.includes(header))) return field;
  }
  return null;
}

// Convert Excel sheet data to mapped asset row objects
function excelSheetToAssetRows(sheetData) {
  const headerIdx = findHeaderRow(sheetData);
  const headers = sheetData[headerIdx].map(h => String(h).trim());

  // Build column index → asset field mapping
  const colMapping = [];
  headers.forEach((h, idx) => {
    const field = matchColumnField(h);
    if (field) colMapping.push({ idx, header: h, field });
  });
  console.log('[Excel Import] Column mapping:', colMapping.map(c => `${c.header} → ${c.field}`));

  const rows = [];
  for (let i = headerIdx + 1; i < sheetData.length; i++) {
    const raw = sheetData[i];
    if (!raw || raw.every(c => c === '' || c === null || c === undefined)) continue;

    const obj = {};
    const extras = [];
    for (const { idx, field } of colMapping) {
      let val = raw[idx];
      if (val === undefined || val === null) val = '';
      val = String(val).trim();

      if (field === 'received_date') {
        const existing = obj.received_date;
        const parsed = parseExcelDate(raw[idx]);
        if (!existing && parsed) obj.received_date = parsed;
      } else if (field === 'description_extra') {
        if (val) extras.push(val);
      } else if (field === 'description') {
        const prev = obj.description || '';
        if (val && val !== '-') obj.description = prev ? prev + ' | ' + val : val;
      } else if (field === 'price') {
        obj.price = parseFloat(val) || 0;
      } else {
        if (!obj[field] && val && val !== '-') obj[field] = val;
      }
    }
    if (extras.length) {
      obj.description = (obj.description ? obj.description + ' | ' : '') + extras.join(' | ');
    }

    // Skip rows without asset_name
    if (!obj.asset_name) continue;

    // Defaults
    obj.quantity = obj.quantity || 1;
    obj.unit = obj.unit || 'เครื่อง';
    obj.status = obj.status || 'ใช้งานได้';
    obj.serial_number = obj.serial_number || '';
    obj.barcode = obj.barcode || '';
    obj.price = obj.price || 0;
    obj.received_date = obj.received_date || '';
    obj.reference_number = obj.reference_number || '';
    obj.description = obj.description || '';

    rows.push(obj);
  }
  return { rows, headerIdx, colMapping };
}

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [references, setReferences] = useState(null);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState({});
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('csv');
  // Excel-specific state
  const [excelSheets, setExcelSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [excelWorkbook, setExcelWorkbook] = useState(null);
  const [colMapping, setColMapping] = useState([]);

  // Import history for notifications
  const [importHistory, setImportHistory] = useState([]);

  useEffect(() => {
    loadReferences();
    loadImportHistory();
  }, []);

  const loadReferences = async () => {
    try {
      const response = await api.get('/import/references');
      if (response.data.success) {
        setReferences(response.data.data);
      }
    } catch (error) {
      console.error('Error loading references:', error);
    }
  };

  const loadImportHistory = async () => {
    try {
      const response = await api.get('/import/history');
      if (response.data.success) {
        setImportHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading import history:', error);
    }
  };

  // Notifications for Navbar integration
  const getImportNotifications = () => {
    const notifications = [];

    // Recent failed imports
    const recentFailed = importHistory.filter(h =>
      h.failed_count > 0 &&
      new Date(h.import_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentFailed.length > 0) {
      notifications.push({
        id: 'recent-failed-imports',
        type: 'warning',
        title: `มี ${recentFailed.length} การนำเข้าที่มีข้อผิดพลาด`,
        message: 'ในช่วง 7 วันที่ผ่านมา',
        link: '/import',
        read: false
      });
    }

    return notifications;
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const processFile = (uploadedFile) => {
    if (!uploadedFile) return;
    const name = uploadedFile.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isCsv = name.endsWith('.csv');

    if (!isExcel && !isCsv) {
      toast.error('กรุณาเลือกไฟล์ .csv, .xlsx หรือ .xls');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    if (isExcel) {
      // Read Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          setExcelWorkbook(wb);

          if (wb.SheetNames.length > 1) {
            // Multiple sheets - let user pick
            setExcelSheets(wb.SheetNames);
            setStep('sheet-select');
            setLoading(false);
            toast.success(`พบ ${wb.SheetNames.length} ชีทในไฟล์ Excel`);
          } else {
            // Single sheet - process directly
            processExcelSheet(wb, wb.SheetNames[0]);
          }
        } catch (err) {
          toast.error('ไม่สามารถอ่านไฟล์ Excel ได้: ' + err.message);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      // CSV file (existing logic)
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            toast.error('ไฟล์ CSV ไม่มีข้อมูล');
            setLoading(false);
            return;
          }
          setCsvData(results.data);
          setStep(2);
          setLoading(false);
          toast.success(`อ่านไฟล์สำเร็จ (${results.data.length} รายการ)`);
        },
        error: (error) => {
          toast.error('ไม่สามารถอ่านไฟล์ได้: ' + error.message);
          setLoading(false);
        }
      });
    }
  };

  const processExcelSheet = (wb, sheetName) => {
    try {
      const ws = wb.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const { rows, headerIdx, colMapping: mapping } = excelSheetToAssetRows(sheetData);

      if (rows.length === 0) {
        toast.error('ไม่พบข้อมูลครุภัณฑ์ในชีทนี้');
        setLoading(false);
        return;
      }

      setSelectedSheet(sheetName);
      setColMapping(mapping);
      setCsvData(rows);
      setStep(2);
      setLoading(false);
      toast.success(`อ่านชีท "${sheetName}" สำเร็จ (${rows.length} รายการ, header แถวที่ ${headerIdx + 1})`);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการประมวลผลชีท: ' + err.message);
      setLoading(false);
    }
  };

  const handleSheetSelect = (sheetName) => {
    setLoading(true);
    processExcelSheet(excelWorkbook, sheetName);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    processFile(uploadedFile);
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/import/validate', { rows: csvData });
      setValidationResult(response.data.data);
      setStep(3);
      toast.success('ตรวจสอบข้อมูลเสร็จสิ้น');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) {
      toast.error('ไม่มีข้อมูลที่ถูกต้องให้นำเข้า');
      return;
    }

    setLoading(true);
    try {
      const validRows = validationResult.valid.map(item => item.data);
      const response = await api.post('/import/assets', {
        rows: validRows,
        filename: file?.name || 'เครื่อง'
      });
      setImportResult(response.data.data);
      setStep(4);
      toast.success('นำเข้าข้อมูลเสร็จสิ้น');
      loadImportHistory(); // Refresh history
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvData([]);
    setValidationResult(null);
    setImportResult(null);
    setStep(1);
    setExpandedErrors({});
    setExcelSheets([]);
    setSelectedSheet(null);
    setExcelWorkbook(null);
    setColMapping([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = ['ชื่อครุภัณฑ์', 'หมายเลขซีเรียล', 'จำนวน', 'หน่วยนับ', 'ราคา', 'วันที่ตรวจรับ', 'หน่วยงาน', 'อาคาร/ห้อง', 'สถานะ', 'หมายเลขครุภัณฑ์ (Barcode)', 'รายละเอียด', 'รหัสหมวดสินทรัพย์', 'รหัสกองทุน', 'รหัสแผนงาน', 'รหัสงาน/โครงการ', 'ชื่อคณะ', 'เลขที่ใบส่งของ'];
    const row1 = ['คอมพิวเตอร์ Dell Optiplex 7080', 'SN123456789', '1', 'เครื่อง', '25000', '2024-01-15', 'สาขาวิชาเทคโนโลยีสารสนเทศ', 'อเนกประสงค์ ชั้น 3', 'ใช้งานได้', 'QR20240001', 'CPU Intel Core i7, RAM 16GB, SSD 512GB', 'REF-IT-2024', 'กองทุนทั่วไป', 'แผนงานหลัก', 'โครงการพัฒนานักศึกษา', 'คณะเทคโนโลยีอุตสาหกรรม', 'DEL-001/67'];

    const csvContent = [
      headers.join(','),
      row1.join(',')
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'asset_import_template_latest.csv';
    link.click();
    toast.success('ดาวน์โหลด Template ล่าสุดสำเร็จ');
  };

  const downloadTemplateFromServer = async () => {
    try {
      window.open(`${api.defaults.baseURL}/import/template`, '_blank');
      toast.success('กำลังดาวน์โหลด Template ล่าสุด...');
    } catch (error) {
      downloadTemplate();
    }
  };

  const toggleErrorExpanded = (index) => {
    setExpandedErrors(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Get columns from CSV data
  const getColumns = () => {
    if (csvData.length === 0) return [];
    return Object.keys(csvData[0]);
  };

  const stepConfig = [
    { num: 1, label: 'อัปโหลดไฟล์', icon: Upload, description: 'เลือกไฟล์ CSV' },
    { num: 2, label: 'ตรวจสอบ', icon: Eye, description: 'ดูตัวอย่างข้อมูล' },
    { num: 3, label: 'ยืนยัน', icon: CheckCircle, description: 'ตรวจสอบข้อผิดพลาด' },
    { num: 4, label: 'เสร็จสิ้น', icon: Database, description: 'นำเข้าสำเร็จ' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นำเข้าข้อมูลครุภัณฑ์ (เวอร์ชันล่าสุด)</h1>
          <p className="text-gray-500 mt-1">นำเข้าข้อมูลง่ายขึ้นด้วยระบบ Auto-Mapping คอลัมน์ภาษาไทย</p>
        </div>
        {step > 1 && (
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw size={18} />
            เริ่มใหม่
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'csv'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
          <FileSpreadsheet size={18} />
          นำเข้าจาก CSV
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ocr'
            ? 'bg-purple-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
          <Eye size={18} />
          สแกนเอกสาร (OCR)
        </button>
      </div>

      {/* OCR Tab */}
      {activeTab === 'ocr' && <OcrImportTab />}

      {/* CSV Tab */}
      {activeTab === 'csv' && (<>

        {/* Progress Steps */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            {stepConfig.map((s, i) => {
              const Icon = s.icon;
              const isActive = step >= s.num;
              const isComplete = step > s.num;
              const isCurrent = step === s.num;

              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isComplete ? 'bg-success-500 text-white shadow-success-glow' :
                      isCurrent ? 'bg-primary-600 text-white shadow-lg' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                      {isComplete ? <CheckCircle size={24} /> : <Icon size={24} />}
                    </div>
                    <p className={`text-sm mt-2 font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {s.label}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>
                      {s.description}
                    </p>
                  </div>
                  {i < 3 && (
                    <div className={`h-1 flex-1 mx-2 rounded transition-colors ${step > s.num ? 'bg-success-500' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="card p-8">
            <div className="max-w-3xl mx-auto">
              {/* Template Download & Reference */}
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 p-3 rounded-xl">
                    <FileSpreadsheet className="text-primary-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">เริ่มต้นด้วย Template ล่าสุด</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      ดาวน์โหลดไฟล์ตัวอย่างเวอร์ชันล่าสุดเพื่อรองรับข้อมูลครบถ้วน (รหัสกองทุน, รหัสแผนงาน, ฯลฯ)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={downloadTemplateFromServer}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={18} />
                        ดาวน์โหลด Template ล่าสุด
                      </button>
                      {references && (
                        <button
                          onClick={() => setShowReferenceModal(true)}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <HelpCircle size={18} />
                          ดูรหัสอ้างอิง
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Area with Drag & Drop */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${isDragging
                  ? 'border-primary-500 bg-primary-50 scale-[1.02]'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <Loader className="w-16 h-16 text-primary-600 animate-spin mb-4" />
                      <p className="text-lg font-semibold text-gray-700">กำลังอ่านไฟล์...</p>
                    </div>
                  ) : (
                    <>
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-primary-100' : 'bg-gray-100'
                        }`}>
                        <Upload className={`w-10 h-10 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
                      </div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        {isDragging ? 'วางไฟล์ที่นี่' : 'คลิกเพื่อเลือกไฟล์ CSV หรือ Excel'}
                      </p>
                      <p className="text-sm text-gray-500">หรือลากไฟล์มาวางที่นี่</p>
                      <p className="text-xs text-gray-400 mt-2">รองรับไฟล์ .csv, .xlsx, .xls</p>
                    </>
                  )}
                </label>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Info size={18} className="text-primary-600" />
                  คำแนะนำการเตรียมไฟล์
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">ไฟล์รองรับ <code className="bg-gray-200 px-1 rounded">.csv</code> <code className="bg-gray-200 px-1 rounded">.xlsx</code> <code className="bg-gray-200 px-1 rounded">.xls</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">แถวแรกต้องเป็นหัวตาราง (Headers)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">ฟิลด์จำเป็น: <code className="bg-gray-200 px-1 rounded">asset_name</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">วันที่ต้องเป็นรูปแบบ YYYY-MM-DD</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>ฟิลด์ที่รองรับ:</strong> ชื่อครุภัณฑ์, หมายเลขซีเรียล, จำนวน, หน่วยนับ, ราคา, วันที่ตรวจรับ, หน่วยงาน, อาคาร/ห้อง, สถานะ, Barcode, รายละเอียด, รหัสกองทุน, รหัสแผนงาน, รหัสโครงการ, คณะ, เลขที่ใบส่งของ
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    <strong>Excel Auto-Mapping:</strong> ระบบรองรับหัวตารางภาษาไทยจากไฟล์ต้นฉบับได้ทันที ไม่ต้องเปลี่ยนชื่อคอลัมน์
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Sheet Selection (Excel only) */}
        {step === 'sheet-select' && (
          <div className="card p-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-xl">
                  <List className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">เลือกชีทที่ต้องการนำเข้า</h2>
                  <p className="text-sm text-gray-500">ไฟล์ {file?.name} มี {excelSheets.length} ชีท</p>
                </div>
              </div>
              <div className="space-y-3">
                {excelSheets.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => handleSheetSelect(name)}
                    disabled={loading}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 group-hover:bg-primary-100 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-gray-500 group-hover:text-primary-600">
                        {i + 1}
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-primary-700">{name}</span>
                    </div>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-primary-600" />
                  </button>
                ))}
              </div>
              <button onClick={handleReset} className="btn-secondary mt-6 w-full justify-center">
                <RotateCcw size={18} /> ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-2 rounded-xl">
                  <FileText className="text-primary-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">ตรวจสอบข้อมูลก่อนนำเข้า</h2>
                  <p className="text-sm text-gray-500">
                    พบข้อมูล {csvData.length} รายการ จากไฟล์ {file?.name}
                    {selectedSheet && <span className="ml-1">(ชีท: {selectedSheet})</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewExpanded(!previewExpanded)}
                className="btn-secondary p-2"
              >
                {previewExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>

            {previewExpanded && (
              <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
                <table className="min-w-max">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 sticky left-0 z-20">#</th>
                      {getColumns().map(col => (
                        <th key={col} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap bg-gray-50">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {csvData.slice(0, 20).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-sm font-medium text-gray-500 bg-white sticky left-0 z-10 border-r border-gray-100">{index + 1}</td>
                        {getColumns().map(col => (
                          <td key={col} className="px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap max-w-[250px] truncate" title={row[col] || ''}>
                            {row[col] || <span className="text-gray-300">-</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {csvData.length > 20 && (
              <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
                แสดง 20 จาก {csvData.length} รายการ
              </div>
            )}

            <div className="p-6 border-t border-gray-100 flex gap-4">
              <button
                onClick={handleReset}
                className="btn-secondary flex-1"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    ตรวจสอบข้อมูล
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Results */}
        {step === 3 && validationResult && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{validationResult.summary.total}</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <Package className="text-gray-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="card p-6 bg-success-50 border-success-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-success-600">ถูกต้อง</p>
                    <p className="text-3xl font-bold text-success-700 mt-1">{validationResult.summary.valid_count}</p>
                  </div>
                  <div className="bg-success-100 p-3 rounded-xl">
                    <CheckCircle className="text-success-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="card p-6 bg-danger-50 border-danger-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-danger-600">ผิดพลาด</p>
                    <p className="text-3xl font-bold text-danger-700 mt-1">{validationResult.summary.invalid_count}</p>
                  </div>
                  <div className="bg-danger-100 p-3 rounded-xl">
                    <XCircle className="text-danger-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Invalid Rows */}
            {validationResult.invalid.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-danger-50">
                  <h3 className="text-lg font-semibold text-danger-800 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    ข้อมูลที่มีปัญหา ({validationResult.invalid.length} รายการ)
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {validationResult.invalid.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleErrorExpanded(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-danger-100 text-danger-700 px-2 py-1 rounded text-xs font-medium">
                            แถว {item.row}
                          </span>
                          <span className="font-medium text-gray-900">{item.data.asset_name || '(ไม่มีชื่อ)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-danger-600">{item.errors.length} ข้อผิดพลาด</span>
                          {expandedErrors[index] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </div>
                      {expandedErrors[index] && (
                        <ul className="mt-3 space-y-1 ml-16">
                          {item.errors.map((error, i) => (
                            <li key={i} className="text-sm text-danger-600 flex items-start gap-2">
                              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card p-6">
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="btn-secondary flex-1"
                >
                  ยกเลิก
                </button>
                {validationResult.valid.length > 0 && (
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center bg-success-600 hover:bg-success-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        กำลังนำเข้า...
                      </>
                    ) : (
                      <>
                        <Database size={18} />
                        นำเข้า {validationResult.valid.length} รายการ
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Import Results */}
        {step === 4 && importResult && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="card p-8 text-center bg-gradient-to-br from-success-50 to-success-100 border-success-200">
              <div className="w-20 h-20 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-success-glow">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-success-800 mb-2">นำเข้าข้อมูลสำเร็จ!</h2>
              <p className="text-success-700">
                นำเข้าครุภัณฑ์สำเร็จ {importResult.summary.success_count} รายการ
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">ทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{importResult.summary.total}</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <Package className="text-gray-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="card p-6 bg-success-50 border-success-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-success-600">สำเร็จ</p>
                    <p className="text-3xl font-bold text-success-700 mt-1">{importResult.summary.success_count}</p>
                  </div>
                  <div className="bg-success-100 p-3 rounded-xl">
                    <CheckCircle className="text-success-600" size={24} />
                  </div>
                </div>
              </div>
              <div className="card p-6 bg-danger-50 border-danger-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-danger-600">ล้มเหลว</p>
                    <p className="text-3xl font-bold text-danger-700 mt-1">{importResult.summary.failed_count}</p>
                  </div>
                  <div className="bg-danger-100 p-3 rounded-xl">
                    <XCircle className="text-danger-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="btn-primary flex-1 justify-center"
                >
                  <Upload size={18} />
                  นำเข้าไฟล์ใหม่
                </button>
                <a
                  href="/assets"
                  className="btn-secondary flex-1 justify-center flex items-center gap-2"
                >
                  <Package size={18} />
                  ดูรายการครุภัณฑ์
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Reference Modal */}
        {showReferenceModal && references && (
          <ReferenceModal
            references={references}
            onClose={() => setShowReferenceModal(false)}
          />
        )}
      </>)}
    </div>
  );
}

// ============================================================
// REFERENCE MODAL COMPONENT
// ============================================================
function ReferenceModal({ references, onClose }) {
  const [activeTab, setActiveTab] = useState('departments');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-xl">
              <HelpCircle className="text-primary-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">รหัสอ้างอิงสำหรับการนำเข้า</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100">
          <div className="flex gap-4">
            {[
              { id: 'departments', label: 'หน่วยงาน', count: references.departments?.length },
              { id: 'locations', label: 'สถานที่', count: references.locations?.length },
              { id: 'statuses', label: 'สถานะ', count: references.valid_statuses?.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label} <span className="text-xs">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ชื่อหน่วยงาน</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">คณะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {references.departments.map(dept => (
                    <tr key={dept.department_id} className="hover:bg-gray-100">
                      <td className="px-4 py-3 font-mono font-semibold text-primary-600">{dept.department_id}</td>
                      <td className="px-4 py-3 text-gray-900">{dept.department_name}</td>
                      <td className="px-4 py-3 text-gray-600">{dept.faculty || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">อาคาร</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ชั้น</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ห้อง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {references.locations.map(loc => (
                    <tr key={loc.location_id} className="hover:bg-gray-100">
                      <td className="px-4 py-3 font-mono font-semibold text-primary-600">{loc.location_id}</td>
                      <td className="px-4 py-3 text-gray-900">{loc.building_name}</td>
                      <td className="px-4 py-3 text-gray-600">{loc.floor}</td>
                      <td className="px-4 py-3 text-gray-600">{loc.room_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Statuses Tab */}
          {activeTab === 'statuses' && (
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-4">สถานะที่สามารถใช้ได้ในฟิลด์ <code className="bg-gray-200 px-1 rounded">status</code>:</p>
              <div className="flex flex-wrap gap-2">
                {references.valid_statuses.map(status => (
                  <span
                    key={status}
                    className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium border border-primary-200"
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-primary w-full justify-center"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}