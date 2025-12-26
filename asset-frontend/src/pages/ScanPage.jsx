// FILE: src/pages/ScanPage.jsx
import { useState, useRef } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw, Search, Upload } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ScanPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [barcode, setBarcode] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [checkStatus, setCheckStatus] = useState('ใช้งานได้');
  const [remark, setRemark] = useState('');
  const [scanHistory, setScanHistory] = useState([]);

  // ค้นหาครุภัณฑ์จาก Barcode
  const handleScan = async () => {
    if (!barcode.trim()) {
      toast.error('กรุณากรอก Barcode');
      return;
    }

    setLoading(true);
    
    try {
      let response;
      let foundAsset = null;
      
      // วิธีที่ 1: ค้นหาจาก /assets ทั้งหมด
      try {
        response = await api.get('/assets');
        if (response.data.success) {
          foundAsset = response.data.data.find(
            a => a.barcode === barcode || 
                 a.serial_number === barcode || 
                 a.asset_id == barcode
          );
        }
      } catch (err) {
        console.log('Method 1 failed');
      }

      // วิธีที่ 2: ลอง endpoint แบบอื่น
      if (!foundAsset) {
        try {
          response = await api.get(`/assets/barcode/${barcode}`);
          if (response.data.success) {
            foundAsset = response.data.data;
          }
        } catch (err) {
          console.log('Method 2 failed');
        }
      }

      // วิธีที่ 3: ลอง query parameter
      if (!foundAsset) {
        try {
          response = await api.get(`/assets?barcode=${barcode}`);
          if (response.data.success && response.data.data.length > 0) {
            foundAsset = response.data.data[0];
          }
        } catch (err) {
          console.log('Method 3 failed');
        }
      }

      if (foundAsset) {
        setScannedAsset(foundAsset);
        setCheckStatus(foundAsset.status || 'ใช้งานได้');
        setRemark('');
        toast.success('พบครุภัณฑ์');
      } else {
        toast.error('ไม่พบครุภัณฑ์');
        setScannedAsset(null);
      }
      
    } catch (error) {
      console.error('Error scanning:', error);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
      setScannedAsset(null);
    } finally {
      setLoading(false);
    }
  };

  // บันทึกการตรวจสอบ
  const handleCheckAsset = async () => {
    if (!scannedAsset) {
      toast.error('กรุณาสแกนครุภัณฑ์ก่อน');
      return;
    }

    if (!user || !user.user_id) {
      toast.error('ไม่พบข้อมูลผู้ใช้ กรุณา Login ใหม่');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        asset_id: scannedAsset.asset_id,
        user_id: user.user_id,
        check_status: checkStatus,
        remark: remark || 'ตรวจสอบผ่าน QR Scanner',
        check_date: new Date().toISOString().split('T')[0]
      };

      // ลอง endpoint ต่างๆ
      let response;
      try {
        response = await api.post('/checks', requestData);
      } catch (err) {
        try {
          response = await api.post('/asset-check', requestData);
        } catch (err2) {
          response = await api.post('/check', requestData);
        }
      }

      if (response.data.success) {
        // เพิ่มลงประวัติการสแกน
        setScanHistory(prev => [{
          ...scannedAsset,
          check_time: new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          check_status: checkStatus,
          remark: remark
        }, ...prev]);

        toast.success('✅ บันทึกการตรวจสอบสำเร็จ');
        handleReset();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error checking asset:', error);
      toast.error('ไม่สามารถบันทึกได้');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBarcode('');
    setScannedAsset(null);
    setCheckStatus('ใช้งานได้');
    setRemark('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleScan();
    }
  };

  // ฟังก์ชันสำหรับอัปโหลดและสแกนรูปภาพ QR Code
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setProcessingImage(true);
    setLoading(true);

    let imageUrl = null;

    try {
      // สร้าง temporary element ID สำหรับ Html5Qrcode
      const tempElementId = `qr-temp-${Date.now()}`;
      const tempDiv = document.createElement('div');
      tempDiv.id = tempElementId;
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '1px';
      tempDiv.style.height = '1px';
      document.body.appendChild(tempDiv);
      
      try {
        // สร้าง Html5Qrcode instance ด้วย element ID
        const html5QrCode = new Html5Qrcode(tempElementId);
        
        // ใช้ scanFile โดยตรงกับ File object
        const decodedText = await html5QrCode.scanFile(file, false);
        
        // ลบ temporary element
        document.body.removeChild(tempDiv);
        
        // Parse QR Code data (อาจเป็น JSON หรือ string)
        let qrData;
        try {
          qrData = JSON.parse(decodedText);
        } catch {
          // ถ้าไม่ใช่ JSON อาจเป็น string ธรรมดา
          qrData = { id: decodedText };
        }

        // ค้นหาครุภัณฑ์จาก QR Code
        let foundAsset = null;
        
        // วิธีที่ 1: ใช้ ID จาก QR Code
        if (qrData.id) {
          try {
            const response = await api.get(`/assets/${qrData.id}`);
            if (response.data.success) {
              foundAsset = response.data.data;
            }
          } catch (err) {
            console.log('Method 1 failed:', err);
          }
        }

        // วิธีที่ 2: ค้นหาจาก decodedText โดยตรง (อาจเป็น asset_id, barcode, หรือ serial_number)
        if (!foundAsset) {
          try {
            const response = await api.get('/assets');
            if (response.data.success) {
              foundAsset = response.data.data.find(
                a => a.barcode === decodedText || 
                     a.serial_number === decodedText || 
                     a.asset_id == decodedText ||
                     a.asset_id == qrData.id
              );
            }
          } catch (err) {
            console.log('Method 2 failed:', err);
          }
        }

        // วิธีที่ 3: ลอง endpoint แบบอื่น
        if (!foundAsset) {
          try {
            const response = await api.get(`/assets/barcode/${decodedText}`);
            if (response.data.success) {
              foundAsset = response.data.data;
            }
          } catch (err) {
            console.log('Method 3 failed:', err);
          }
        }

        if (foundAsset) {
          setScannedAsset(foundAsset);
          setCheckStatus(foundAsset.status || 'ใช้งานได้');
          setRemark('');
          setBarcode(decodedText);
          toast.success('สแกน QR Code สำเร็จ - พบครุภัณฑ์');
        } else {
          toast.error('ไม่พบครุภัณฑ์ที่ตรงกับ QR Code: ' + decodedText);
          setScannedAsset(null);
        }
      } catch (scanError) {
        // ลบ temporary element ถ้ายังมีอยู่
        const tempDiv = document.getElementById(tempElementId);
        if (tempDiv) {
          document.body.removeChild(tempDiv);
        }
        throw scanError;
      }
      
    } catch (err) {
      console.error('Error scanning image:', err);
      
      // จัดการ error message ให้ชัดเจน
      let errorMessage = 'ไม่สามารถสแกน QR Code จากรูปภาพได้';
      
      if (err) {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err.message) {
          const msg = err.message.toLowerCase();
          if (msg.includes('no qr code found') || 
              msg.includes('qr code parse error') ||
              msg.includes('not found') ||
              msg.includes('not detected')) {
            errorMessage = 'ไม่พบ QR Code ในรูปภาพ กรุณาเลือกรูปภาพที่มี QR Code ชัดเจน';
          } else {
            errorMessage = 'ไม่สามารถสแกน QR Code จากรูปภาพได้: ' + err.message;
          }
        } else if (err.name) {
          errorMessage = 'เกิดข้อผิดพลาด: ' + err.name;
        } else if (err.toString && err.toString() !== '[object Object]') {
          errorMessage = 'เกิดข้อผิดพลาด: ' + err.toString();
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessingImage(false);
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">สแกน QR Code</h1>
        <p className="text-gray-600 mt-1">ตรวจสอบครุภัณฑ์ด้วยการสแกน QR Code หรือกรอก Barcode</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ส่วนสแกน */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Camera size={24} className="text-blue-600" />
            สแกนครุภัณฑ์
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode / QR Code / Serial Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="กรอกหรือสแกน Barcode / Serial / Asset ID"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  autoFocus
                  disabled={loading}
                />
                <button
                  onClick={handleScan}
                  disabled={loading || !barcode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <Search size={20} />
                  {loading ? 'ค้นหา...' : 'ค้นหา'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>💡</span>
                <span>สามารถค้นหาด้วย Barcode, Serial Number หรือ Asset ID</span>
              </p>
            </div>

            {/* ส่วนอัปโหลดรูปภาพ */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="qr-image-upload"
                disabled={processingImage || loading}
              />
              <label
                htmlFor="qr-image-upload"
                className={`cursor-pointer flex flex-col items-center ${
                  processingImage || loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-gray-700 font-medium text-sm">กำลังสแกน QR Code...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-700 font-medium text-sm mb-1">
                      หรืออัปโหลดรูปภาพที่มี QR Code
                    </p>
                    <p className="text-xs text-gray-500">
                      คลิกเพื่อเลือกรูปภาพ (JPG, PNG, GIF)
                    </p>
                  </>
                )}
              </label>
            </div>

            {scannedAsset && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-medium"
              >
                <RefreshCw size={20} />
                สแกนใหม่
              </button>
            )}
          </div>
        </div>

        {/* ส่วนแสดงผล */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {scannedAsset ? (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle size={24} className="text-green-600" />
                ข้อมูลครุภัณฑ์
              </h2>

              <div className="space-y-3 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">รหัสครุภัณฑ์</p>
                  <p className="text-2xl font-bold text-blue-900">{scannedAsset.asset_id}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">ชื่อครุภัณฑ์</p>
                    <p className="font-semibold text-lg">{scannedAsset.asset_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Serial Number</p>
                    <p className="font-semibold">{scannedAsset.serial_number || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">สถานที่</p>
                    <p className="font-semibold">
                      {scannedAsset.building_name} {scannedAsset.room_number}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">หน่วยงาน</p>
                    <p className="font-semibold">{scannedAsset.department_name || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">สถานะปัจจุบัน</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      scannedAsset.status === 'ใช้งานได้' ? 'bg-green-100 text-green-800' : 
                      scannedAsset.status === 'รอซ่อม' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {scannedAsset.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h3 className="font-bold text-gray-800">บันทึกการตรวจสอบ</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะหลังตรวจสอบ
                  </label>
                  <select
                    value={checkStatus}
                    onChange={(e) => setCheckStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ใช้งานได้">ใช้งานได้</option>
                    <option value="รอซ่อม">รอซ่อม</option>
                    <option value="รอจำหน่าย">รอจำหน่าย</option>
                    <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
                    <option value="ไม่พบ">ไม่พบ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเหตุ (ถ้ามี)
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleCheckAsset}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} />
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการตรวจสอบ'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center text-center">
              <div>
                <AlertCircle size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-lg">ยังไม่ได้สแกนครุภัณฑ์</p>
                <p className="text-sm text-gray-400 mt-2">กรุณากรอก Barcode หรือสแกน QR Code</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ประวัติการสแกน */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              ประวัติการสแกนวันนี้ ({scanHistory.length} รายการ)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">เวลา</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ชื่อครุภัณฑ์</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {scanHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{item.check_time}</td>
                    <td className="px-6 py-4 text-sm font-medium">{item.asset_id}</td>
                    <td className="px-6 py-4 text-sm">{item.asset_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.check_status === 'ใช้งานได้' ? 'bg-green-100 text-green-800' :
                        item.check_status === 'รอซ่อม' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.check_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}