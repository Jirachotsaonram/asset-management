import { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Info, HelpCircle } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [references, setReferences] = useState(null);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const fileInputRef = useRef(null);

  // Load reference data
  useEffect(() => {
    loadReferences();
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

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error('กรุณาเลือกไฟล์ .csv เท่านั้น');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

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
      const response = await api.post('/import/assets', { rows: validRows });
      setImportResult(response.data.data);
      setStep(5);
      toast.success('นำเข้าข้อมูลเสร็จสิ้น');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csv = `asset_name,serial_number,quantity,unit,price,received_date,department_id,location_id,status,barcode
คอมพิวเตอร์ Dell Optiplex 7080,SN123456789,1,เครื่อง,25000,2024-01-15,1,1,ใช้งานได้,QR001
เครื่องพิมพ์ HP LaserJet,SN987654321,1,เครื่อง,15000,2024-02-20,1,2,ใช้งานได้,QR002`;
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'asset_import_template.csv';
    link.click();
    toast.success('ดาวน์โหลด Template สำเร็จ');
  };

  const downloadTemplateFromServer = async () => {
    try {
      window.open(`${api.defaults.baseURL}/import/template`, '_blank');
      toast.success('กำลังดาวน์โหลด Template...');
    } catch (error) {
      console.error('Error downloading template:', error);
      // Fallback to client-side generation
      downloadTemplate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">นำเข้าข้อมูลครุภัณฑ์</h1>
        <p className="text-gray-600 mt-1">นำเข้าข้อมูลครุภัณฑ์จากไฟล์ CSV</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'อัปโหลดไฟล์', icon: Upload },
            { num: 2, label: 'ตรวจสอบข้อมูล', icon: FileText },
            { num: 3, label: 'ยืนยันนำเข้า', icon: CheckCircle },
            { num: 4, label: 'เสร็จสิ้น', icon: CheckCircle }
          ].map((s, i) => {
            const Icon = s.icon;
            const isActive = step >= s.num;
            const isComplete = step > s.num;
            
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isComplete ? 'bg-green-600 text-white' :
                    isActive ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {isComplete ? <CheckCircle size={24} /> : <Icon size={24} />}
                  </div>
                  <p className={`text-sm mt-2 font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                    {s.label}
                  </p>
                </div>
                {i < 3 && (
                  <div className={`h-1 flex-1 mx-2 transition-colors ${
                    step > s.num ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="max-w-2xl mx-auto">
            {/* Download Template */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <Info className="text-blue-600 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">ดาวน์โหลด Template CSV</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    ดาวน์โหลดไฟล์ตัวอย่างเพื่อดูรูปแบบข้อมูลที่ถูกต้อง
                  </p>
                  <button
                    onClick={downloadTemplateFromServer}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                    ดาวน์โหลด Template
                  </button>
                  {references && (
                    <button
                      onClick={() => setShowReferenceModal(true)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors mt-2"
                    >
                      <HelpCircle size={18} />
                      ดูรหัสอ้างอิง
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  คลิกเพื่อเลือกไฟล์ CSV
                </p>
                <p className="text-sm text-gray-500">หรือลากไฟล์มาวางที่นี่</p>
              </label>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">คำแนะนำ:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>ไฟล์ต้องเป็นรูปแบบ CSV (.csv)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>แถวแรกต้องเป็นหัวตาราง (Headers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>ฟิลด์ที่จำเป็น: asset_name</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>ฟิลด์เสริม: serial_number, quantity, unit, price, received_date, department_id, location_id, status, barcode</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">ตรวจสอบข้อมูลก่อนนำเข้า</h2>
              <p className="text-sm text-gray-600">พบข้อมูล {csvData.length} รายการ</p>
            </div>
            <button
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ชื่อครุภัณฑ์</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.asset_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.serial_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.quantity || 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.price || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.status || 'ใช้งานได้'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvData.length > 10 && (
            <p className="text-sm text-gray-500 text-center mb-6">
              ... และอีก {csvData.length - 10} รายการ
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleValidate}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบข้อมูล'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validation Results */}
      {step === 3 && validationResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800">{validationResult.summary.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl shadow-md p-6">
              <p className="text-sm text-green-600 mb-2">ถูกต้อง</p>
              <p className="text-3xl font-bold text-green-600">{validationResult.summary.valid_count}</p>
            </div>
            <div className="bg-red-50 rounded-xl shadow-md p-6">
              <p className="text-sm text-red-600 mb-2">ผิดพลาด</p>
              <p className="text-3xl font-bold text-red-600">{validationResult.summary.invalid_count}</p>
            </div>
          </div>

          {/* Invalid Rows */}
          {validationResult.invalid.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertCircle size={24} />
                ข้อมูลที่ผิดพลาด ({validationResult.invalid.length} รายการ)
              </h3>
              <div className="space-y-4">
                {validationResult.invalid.map((item, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-red-900">แถวที่ {item.row}: {item.data.asset_name}</p>
                    </div>
                    <ul className="space-y-1">
                      {item.errors.map((error, i) => (
                        <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
              >
                ยกเลิก
              </button>
              {validationResult.valid.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  {loading ? 'กำลังนำเข้า...' : `นำเข้าข้อมูลที่ถูกต้อง (${validationResult.valid.length} รายการ)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Import Results */}
      {step === 5 && importResult && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">นำเข้าข้อมูลสำเร็จ!</h2>
            <p className="text-green-700">
              นำเข้าครุภัณฑ์สำเร็จ {importResult.summary.success_count} รายการ
            </p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800">{importResult.summary.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl shadow-md p-6">
              <p className="text-sm text-green-600 mb-2">สำเร็จ</p>
              <p className="text-3xl font-bold text-green-600">{importResult.summary.success_count}</p>
            </div>
            <div className="bg-red-50 rounded-xl shadow-md p-6">
              <p className="text-sm text-red-600 mb-2">ล้มเหลว</p>
              <p className="text-3xl font-bold text-red-600">{importResult.summary.failed_count}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <button
              onClick={handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold"
            >
              นำเข้าไฟล์ใหม่
            </button>
          </div>
        </div>
      )}

      {/* Reference Modal */}
      {showReferenceModal && references && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">รหัสอ้างอิงสำหรับการนำเข้า</h2>
                <button
                  onClick={() => setShowReferenceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Departments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">รหัสหน่วยงาน (department_id)</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">ชื่อหน่วยงาน</th>
                        <th className="px-3 py-2 text-left">คณะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.departments.map(dept => (
                        <tr key={dept.department_id} className="border-b border-gray-200">
                          <td className="px-3 py-2 font-mono font-semibold text-blue-600">{dept.department_id}</td>
                          <td className="px-3 py-2">{dept.department_name}</td>
                          <td className="px-3 py-2 text-gray-600">{dept.faculty || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Locations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">รหัสสถานที่ (location_id)</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">อาคาร</th>
                        <th className="px-3 py-2 text-left">ชั้น</th>
                        <th className="px-3 py-2 text-left">ห้อง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.locations.map(loc => (
                        <tr key={loc.location_id} className="border-b border-gray-200">
                          <td className="px-3 py-2 font-mono font-semibold text-blue-600">{loc.location_id}</td>
                          <td className="px-3 py-2">{loc.building_name}</td>
                          <td className="px-3 py-2">{loc.floor}</td>
                          <td className="px-3 py-2">{loc.room_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Valid Statuses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">สถานะที่ใช้ได้ (status)</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {references.valid_statuses.map(status => (
                      <span key={status} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}