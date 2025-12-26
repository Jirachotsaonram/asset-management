import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import { API_BASE_URL } from '../../utils/constants';

export default function QRScanner({ onClose }) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'upload'
  const [scannedAsset, setScannedAsset] = useState(null);
  const [error, setError] = useState(null);
  const [checkStatus, setCheckStatus] = useState('ปกติ');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);

  // ฟังก์ชันสำหรับประมวลผล QR Code ที่สแกนได้
  const processQRCode = async (decodedText) => {
    setScanning(false);
    setError(null);

    try {
      // Parse QR Code data
      const qrData = JSON.parse(decodedText);
      
      // ดึงข้อมูลครุภัณฑ์จาก API
      const response = await api.get(`/assets/${qrData.id}`);
      setScannedAsset(response.data.data);
    } catch (err) {
      console.error('Error fetching asset:', err);
      setError('ไม่สามารถดึงข้อมูลครุภัณฑ์ได้: ' + (err.response?.data?.message || err.message));
    }
  };

  // เริ่มต้น Camera Scanner
  useEffect(() => {
    if (scanMode !== 'camera' || !scanning) return;

    let scanner = null;
    
    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        async (decodedText, decodedResult) => {
          if (scanner) {
            scanner.clear().catch(console.error);
          }
          await processQRCode(decodedText);
        },
        (error) => {
          // ไม่ต้องแสดง error ทุกครั้ง (เพราะจะ spam)
          console.warn(error);
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('ไม่สามารถเริ่มต้นกล้องได้');
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanMode, scanning]);

  // ฟังก์ชันสำหรับอัปโหลดและสแกนรูปภาพ
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setProcessingImage(true);
    setError(null);
    setScanning(false);

    try {
      const html5QrCode = new Html5Qrcode();
      
      // สแกน QR Code จากรูปภาพ
      const decodedText = await html5QrCode.scanFile(file, false);
      
      // ประมวลผล QR Code ที่สแกนได้
      await processQRCode(decodedText);
    } catch (err) {
      console.error('Error scanning image:', err);
      if (err.message.includes('No QR code found')) {
        setError('ไม่พบ QR Code ในรูปภาพ กรุณาเลือกรูปภาพที่มี QR Code ชัดเจน');
      } else {
        setError('ไม่สามารถสแกน QR Code จากรูปภาพได้: ' + err.message);
      }
      setScanning(true);
    } finally {
      setProcessingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveCheck = async () => {
    if (!scannedAsset) return;

    setSaving(true);
    try {
      await api.post('/checks', {
        asset_id: scannedAsset.asset_id,
        check_date: new Date().toISOString().split('T')[0],
        check_status: checkStatus,
        remark: remark
      });

      alert('✅ บันทึกการตรวจสอบสำเร็จ');
      onClose();
    } catch (error) {
      alert('❌ ไม่สามารถบันทึกได้: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleRescan = () => {
    setScannedAsset(null);
    setError(null);
    setCheckStatus('ปกติ');
    setRemark('');
    setScanning(true);
    
    // ถ้าเป็นโหมดกล้อง ให้ reload เพื่อเริ่ม scanner ใหม่
    if (scanMode === 'camera') {
      window.location.reload();
    }
  };

  const switchMode = (mode) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    setScanMode(mode);
    setScanning(true);
    setScannedAsset(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Camera className="w-6 h-6 text-blue-600" />
            <span>สแกน QR Code</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {scanning && !scannedAsset && (
            <div>
              {/* แท็บเลือกโหมด */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => switchMode('camera')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                    scanMode === 'camera'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="w-5 h-5 inline-block mr-2" />
                  สแกนด้วยกล้อง
                </button>
                <button
                  onClick={() => switchMode('upload')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                    scanMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-5 h-5 inline-block mr-2" />
                  อัปโหลดรูปภาพ
                </button>
              </div>

              {/* โหมดกล้อง */}
              {scanMode === 'camera' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      📸 กรุณาจ่อกล้องไปที่ QR Code ของครุภัณฑ์
                    </p>
                  </div>
                  <div id="qr-reader" className="w-full"></div>
                </div>
              )}

              {/* โหมดอัปโหลดรูปภาพ */}
              {scanMode === 'upload' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      📷 เลือกรูปภาพที่มี QR Code ของครุภัณฑ์
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="qr-image-upload"
                      disabled={processingImage}
                    />
                    <label
                      htmlFor="qr-image-upload"
                      className={`cursor-pointer flex flex-col items-center ${
                        processingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {processingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-gray-700 font-medium">กำลังประมวลผล...</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                          <p className="text-gray-700 font-medium mb-2">
                            คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
                          </p>
                          <p className="text-sm text-gray-500">
                            รองรับไฟล์: JPG, PNG, GIF
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleRescan}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                สแกนใหม่
              </button>
            </div>
          )}

          {scannedAsset && !error && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">สแกนสำเร็จ!</p>
                  <p className="text-sm text-green-700">พบข้อมูลครุภัณฑ์</p>
                </div>
              </div>

              {/* แสดงรูปภาพ */}
              {scannedAsset.image && (
                <div className="mb-6">
                  <img
                    src={`${API_BASE_URL}/${scannedAsset.image}`}
                    alt={scannedAsset.asset_name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* ข้อมูลครุภัณฑ์ */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-3">ข้อมูลครุภัณฑ์</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">รหัสครุภัณฑ์</label>
                    <p className="font-semibold">{scannedAsset.asset_id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Serial Number</label>
                    <p className="font-semibold">{scannedAsset.serial_number || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">ชื่อครุภัณฑ์</label>
                    <p className="font-semibold">{scannedAsset.asset_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">สถานที่</label>
                    <p className="font-semibold">
                      {scannedAsset.building_name} {scannedAsset.room_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">หน่วยงาน</label>
                    <p className="font-semibold">{scannedAsset.department_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">สถานะ</label>
                    <p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        scannedAsset.status === 'ใช้งานได้' ? 'bg-green-100 text-green-800' :
                        scannedAsset.status === 'รอซ่อม' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scannedAsset.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">ราคา</label>
                    <p className="font-semibold">{scannedAsset.price?.toLocaleString()} บาท</p>
                  </div>
                </div>
              </div>

              {/* ฟอร์มบันทึกการตรวจสอบ */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-3">บันทึกการตรวจสอบ</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ผลการตรวจสอบ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={checkStatus}
                    onChange={(e) => setCheckStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ชำรุด">ชำรุด</option>
                    <option value="สูญหาย">สูญหาย</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  />
                </div>
              </div>

              {/* ปุ่มดำเนินการ */}
              <div className="flex space-x-3">
                <button
                  onClick={handleRescan}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  สแกนอันต่อไป
                </button>
                <button
                  onClick={handleSaveCheck}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการตรวจสอบ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
