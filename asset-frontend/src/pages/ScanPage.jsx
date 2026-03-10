// FILE: src/pages/ScanPage.jsx
import { useState, useRef, useCallback } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw, Search, Upload, QrCode, Package, MapPin, Building2, Clock, FileCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

// ==================== Notifications Integration ====================
export const getScanNotifications = (scanHistory) => {
  const notifications = [];

  // Today's scans count
  const todayScans = scanHistory.length;
  if (todayScans >= 10) {
    notifications.push({
      id: 'high-scan-count',
      type: 'info',
      title: `สแกนแล้ว ${todayScans} รายการวันนี้`,
      message: 'กิจกรรมการตรวจสอบประจำวัน',
      link: '/scan',
      read: false
    });
  }

  // Issues found during scanning
  const issuesFound = scanHistory.filter(s =>
    s.check_status === 'รอซ่อม' ||
    s.check_status === 'ไม่พบ' ||
    s.check_status === 'รอจำหน่าย'
  );

  if (issuesFound.length > 0) {
    notifications.push({
      id: 'scan-issues',
      type: 'warning',
      title: `พบปัญหา ${issuesFound.length} รายการ`,
      message: 'จากการสแกนตรวจสอบวันนี้',
      link: '/scan',
      read: false
    });
  }

  return notifications;
};

// ฟังก์ชันช่วยประมวลผลรูปภาพเพื่อเพิ่มความสำเร็จในการสแกน (สำหรับ QR หนาแน่นสูง)
// ฟังก์ชันช่วยประมวลผลรูปภาพเพื่อเพิ่มความสำเร็จในการสแกน (สำหรับ QR หนาแน่นสูง)
const preprocessImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // ขยายขนาด 2 เท่า และเพิ่มพื้นที่ขอบ (Quiet Zone) เพื่อช่วยให้ Decoder หา Pattern เจอ
        const padding = 40;
        canvas.width = (img.width * 2) + padding * 2;
        canvas.height = (img.height * 2) + padding * 2;

        // พื้นหลังขาว
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ปิด smoothing เพื่อไม่ให้ภาพเบลอเวลาขยาย
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, padding, padding, img.width * 2, img.height * 2);

        if (options.grayscale || options.contrast) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            let val = avg;
            if (options.contrast) {
              val = avg > 128 ? 255 : 0;
            }
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
          ctx.putImageData(imageData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Canvas conversion failed'));
          }
        }, 'image/jpeg', 1.0);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

      // วิธีที่ 1: ค้นหาโดยตรง (รองรับทั้ง Asset ID และ Barcode)
      try {
        response = await api.get(`/assets/${encodeURIComponent(barcode)}`);
        if (response.data.success) {
          foundAsset = response.data.data;
        }
      } catch (err) {
        console.log('Standard lookup failed, trying query param...');
        try {
          // วิธีที่ 2: ลอง query parameter (เพิ่มความแน่นอน)
          response = await api.get(`/assets?barcode=${encodeURIComponent(barcode)}`);
          if (response.data.success) {
            foundAsset = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
          }
        } catch (err2) {
          console.log('All scan methods failed');
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

        toast.success('บันทึกการตรวจสอบสำเร็จ');
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
    setShowDetails(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleScan();
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
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
      handleImageUpload({ target: { files: [files[0]] } });
    }
  }, []);

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

        let decodedText = '';
        try {
          // Pass 1: สแกนแบบปกติ
          decodedText = await html5QrCode.scanFile(file, false);
        } catch (err1) {
          console.log('Pass 1 failed, trying Pass 2 (Upscale + Padding)...');
          try {
            // Pass 2: ขยายภาพและเพิ่มขอบขาว
            toast.loading('พยายามสแกนใหม่ (ขั้นที่ 2: ปรับขนาดแล้วเเบ่งขอบ)...', { id: 'qr-retry' });
            const processedFile2 = await preprocessImage(file);
            decodedText = await html5QrCode.scanFile(processedFile2, false);
            toast.dismiss('qr-retry');
          } catch (err2) {
            console.log('Pass 2 failed, trying Pass 3 (Grayscale + Contrast)...');
            try {
              // Pass 3: เพิ่ม Grayscale และ Contrast (Binarization)
              toast.loading('พยายามสแกนใหม่ (ขั้นที่ 3: ปรับความคมชัด)...', { id: 'qr-retry' });
              const processedFile3 = await preprocessImage(file, { grayscale: true, contrast: true });
              decodedText = await html5QrCode.scanFile(processedFile3, false);
              toast.dismiss('qr-retry');
            } catch (err3) {
              toast.dismiss('qr-retry');
              // ลบ temporary element
              if (document.getElementById(tempElementId)) {
                document.body.removeChild(tempDiv);
              }
              throw err1; // โยน error แรกออกไปถ้าทุกวิธีล้มเหลว
            }
          }
        }

        // ลบ temporary element เมื่อเสร็จสิ้น
        if (document.getElementById(tempElementId)) {
          document.body.removeChild(tempDiv);
        }

        console.log('Decoded text:', decodedText);

        // ล้างข้อมูลที่อาจผิดพลาด (เช่น ช่องว่าง)
        decodedText = decodedText.trim();

        // Parse QR Code data (อาจเป็น JSON หรือ string)
        let searchId = decodedText;
        try {
          const qrData = JSON.parse(decodedText);
          // ถ้าเป็น JSON ให้เอาเฉพาะ ID หรือ Barcode ออกมา
          searchId = qrData.id || qrData.barcode || decodedText;
        } catch {
          // ถ้าไม่ใช่ JSON ก็ใช้ decodedText ตรงๆ
        }

        // ค้นหาครุภัณฑ์
        let foundAsset = null;
        try {
          // ลองค้นหาด้วย ID/Barcode
          const response = await api.get(`/assets/${encodeURIComponent(searchId)}`);
          if (response.data.success) {
            foundAsset = response.data.data;
          }
        } catch (err) {
          console.log('QR direct lookup failed, trying fallback...');
          try {
            const response = await api.get(`/assets?barcode=${encodeURIComponent(searchId)}`);
            if (response.data.success) {
              foundAsset = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
            }
          } catch (err2) {
            console.log('Asset not found from QR');
          }
        }

        if (foundAsset) {
          setScannedAsset(foundAsset);
          setCheckStatus(foundAsset.status || 'ใช้งานได้');
          setRemark('');
          setBarcode(searchId); // ใช้ ID ที่สกัดออกมาได้แทนที่จะเป็น JSON ทั้งก้อน
          toast.success('สแกน QR Code สำเร็จ - พบครุภัณฑ์');
        } else {
          toast.error('ไม่พบครุภัณฑ์ที่ตรงกับ QR Code: ' + decodedText);
          setScannedAsset(null);
        }
      } catch (scanError) {
        // ลบ temporary element ถ้ายังมีอยู่
        const existingDiv = document.getElementById(tempElementId);
        if (existingDiv) {
          document.body.removeChild(existingDiv);
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ใช้งานได้': return 'bg-success-100 text-success-700 border-success-200';
      case 'รอซ่อม': return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'ไม่พบ': return 'bg-danger-100 text-danger-700 border-danger-200';
      case 'รอจำหน่าย': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'จำหน่ายแล้ว': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Get status icon color
  const getStatusIconColor = (status) => {
    switch (status) {
      case 'ใช้งานได้': return 'bg-success-500';
      case 'รอซ่อม': return 'bg-warning-500';
      case 'ไม่พบ': return 'bg-danger-500';
      case 'รอจำหน่าย': return 'bg-orange-500';
      case 'จำหน่ายแล้ว': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <QrCode className="text-primary-600" size={28} />
          </div>
          สแกน QR Code
        </h1>
        <p className="text-gray-600 mt-1">ตรวจสอบครุภัณฑ์ด้วยการสแกน QR Code หรือกรอก Barcode</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Camera size={22} className="text-primary-600" />
            สแกนครุภัณฑ์
          </h2>

          <div className="space-y-5">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode / QR Code / Serial Number
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="กรอกหรือสแกน Barcode / Serial / Asset ID"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={handleScan}
                  disabled={loading || !barcode}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-primary-600/20"
                >
                  <Search size={20} />
                  {loading ? 'ค้นหา...' : 'ค้นหา'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <span className="text-lg"></span>
                สามารถค้นหาด้วย Barcode, Serial Number หรือ Asset ID
              </p>
            </div>

            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${isDragging
                ? 'border-primary-500 bg-primary-50'
                : processingImage || loading
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !processingImage && !loading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="qr-image-upload"
                disabled={processingImage || loading}
              />

              {processingImage ? (
                <div className="py-4">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <QrCode className="absolute inset-3 text-primary-600" size={28} />
                  </div>
                  <p className="text-gray-700 font-medium">กำลังสแกน QR Code...</p>
                  <p className="text-sm text-gray-500 mt-1">กรุณารอสักครู่</p>
                </div>
              ) : isDragging ? (
                <div className="py-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-primary-600" size={28} />
                  </div>
                  <p className="text-primary-700 font-medium">วางไฟล์ที่นี่</p>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-gray-400" size={28} />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">
                    อัปโหลดรูปภาพที่มี QR Code
                  </p>
                  <p className="text-sm text-gray-500">
                    ลากวางไฟล์หรือคลิกเพื่อเลือก (JPG, PNG, GIF)
                  </p>
                </div>
              )}
            </div>

            {scannedAsset && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl transition-all font-medium"
              >
                <RefreshCw size={20} />
                สแกนใหม่
              </button>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {scannedAsset ? (
            <div className="h-full flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-success-100 rounded-lg">
                  <CheckCircle size={18} className="text-success-600" />
                </div>
                ข้อมูลครุภัณฑ์
              </h2>

              <div className="flex-1 space-y-4">
                {/* Asset ID Card */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-5 rounded-xl text-white shadow-lg shadow-primary-500/20">
                  <p className="text-primary-100 text-sm font-medium">รหัสครุภัณฑ์</p>
                  <p className="text-2xl font-bold mt-1">{scannedAsset.asset_id}</p>
                </div>

                {/* Asset Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">ชื่อครุภัณฑ์</p>
                    <p className="font-semibold text-gray-900">{scannedAsset.asset_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Package size={14} />
                        Serial Number
                      </p>
                      <p className="font-medium text-gray-800">{scannedAsset.serial_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Building2 size={14} />
                        หน่วยงาน
                      </p>
                      <p className="font-medium text-gray-800">{scannedAsset.department_name || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={14} />
                      สถานที่
                    </p>
                    <p className="font-medium text-gray-800">
                      {scannedAsset.building_name} {scannedAsset.room_number}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">สถานะปัจจุบัน</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(scannedAsset.status)}`}>
                      <span className={`w-2 h-2 rounded-full ${getStatusIconColor(scannedAsset.status)}`}></span>
                      {scannedAsset.status}
                    </span>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all"
                  >
                    {showDetails ? (
                      <>แสดงข้อมูลน้อยลง <ChevronUp size={16} /></>
                    ) : (
                      <>แสดงรายละเอียดเพิ่มเติม <ChevronDown size={16} /></>
                    )}
                  </button>

                  {/* Collapsible Details */}
                  {showDetails && (
                    <div className="pt-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <p className="text-xs text-gray-500">ราคาต่อหน่วย</p>
                        <p className="font-medium text-gray-800">
                          {scannedAsset.price ? Number(scannedAsset.price).toLocaleString('th-TH') + ' บาท' : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ปีงบประมาณ</p>
                        <p className="font-medium text-gray-800">
                          {(() => {
                            if (!scannedAsset.received_date) return '-';
                            const date = new Date(scannedAsset.received_date);
                            const year = date.getFullYear() + 543;
                            return date.getMonth() + 1 >= 10 ? year + 1 : year;
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">รหัสกองทุน</p>
                        <p className="font-medium text-gray-800">{scannedAsset.fund_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">รหัสแผน</p>
                        <p className="font-medium text-gray-800">{scannedAsset.plan_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">รหัสโครงการ</p>
                        <p className="font-medium text-gray-800">{scannedAsset.project_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">คณะ</p>
                        <p className="font-medium text-gray-800">{scannedAsset.faculty_name || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">รายละเอียด</p>
                        <p className="text-sm font-medium text-gray-800 line-clamp-3">{scannedAsset.description || '-'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Check Form */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileCheck size={18} className="text-primary-600" />
                    บันทึกการตรวจสอบ
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะหลังตรวจสอบ
                    </label>
                    <select
                      value={checkStatus}
                      onChange={(e) => setCheckStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
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
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleCheckAsset}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white py-3.5 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-success-500/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        บันทึกการตรวจสอบ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[450px] flex items-center justify-center text-center">
              <div>
                <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <AlertCircle size={48} className="text-gray-300" />
                </div>
                <p className="text-gray-700 font-medium text-lg mb-2">ยังไม่ได้สแกนครุภัณฑ์</p>
                <p className="text-sm text-gray-500">กรุณากรอก Barcode หรือสแกน QR Code</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-primary-600" size={22} />
              ประวัติการสแกนวันนี้
              <span className="ml-2 px-2.5 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-lg">
                {scanHistory.length} รายการ
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">เวลา</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">รหัส</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อครุภัณฑ์</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">สถานะ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scanHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{item.check_time}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-500">#{item.asset_id}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.asset_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(item.check_status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusIconColor(item.check_status)}`}></span>
                        {item.check_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{item.remark || '-'}</td>
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