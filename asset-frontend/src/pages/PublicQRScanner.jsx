import { useState, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  Package, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Building,
  Layers,
  DollarSign,
  Hash,
  Tag,
  X,
  Image
} from 'lucide-react';

export default function PublicQRScanner() {
  const [scanning, setScanning] = useState(false);
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const streamRef = useRef(null);

  const startScanner = () => {
    setError(null);
    setScanning(true);
    
    setTimeout(() => {
      simulateScan('513000070003');
    }, 2000);
  };

  const stopScanner = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const simulateScan = (code) => {
    const mockAsset = {
      asset_id: code,
      asset_name: 'เครื่องคอมพิวเตอร์ Dell Optiplex 7090',
      serial_number: 'SN123456789',
      barcode: code,
      quantity: 1,
      unit: 'เครื่อง',
      price: 25000.00,
      received_date: '2024-01-15',
      status: 'ใช้งานได้',
      building_name: 'อาคาร IT',
      floor: '3',
      room_number: '301',
      department_name: 'ภาควิชาเทคโนโลยีสารสนเทศ',
      last_check_date: '2024-12-10',
      image: null
    };

    setAsset(mockAsset);
    setScanning(false);
    stopScanner();
  };

  const handleManualSearch = () => {
    if (!manualInput.trim()) return;
    setError(null);
    simulateScan(manualInput);
  };

  const getStatusColor = (status) => {
    const colors = {
      'ใช้งานได้': 'bg-green-100 text-green-800 border-green-300',
      'รอซ่อม': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'รอจำหน่าย': 'bg-orange-100 text-orange-800 border-orange-300',
      'จำหน่ายแล้ว': 'bg-gray-100 text-gray-800 border-gray-300',
      'ไม่พบ': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'ใช้งานได้') return CheckCircle;
    if (status === 'รอซ่อม' || status === 'รอจำหน่าย') return AlertCircle;
    return Info;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Package className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ระบบตรวจสอบครุภัณฑ์</h1>
              <p className="text-gray-600 text-sm">ภาควิชาเทคโนโลยีสารสนเทศ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!asset ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="inline-block bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-2xl mb-6">
                <QrCode size={80} className="text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">ยินดีต้อนรับ</h2>
              <p className="text-gray-600 text-lg mb-8">
                สแกน QR Code หรือกรอกรหัสครุภัณฑ์เพื่อดูข้อมูล
              </p>

              <div className="max-w-md mx-auto">
                {!scanning ? (
                  <button
                    onClick={startScanner}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl transition shadow-lg text-lg font-semibold"
                  >
                    <Camera size={24} />
                    เปิดกล้องเพื่อสแกน
                  </button>
                ) : (
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                      <Camera size={64} className="text-white animate-pulse" />
                    </div>
                    <p className="text-white text-center mb-4">กำลังสแกน QR Code...</p>
                    <button
                      onClick={stopScanner}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition"
                    >
                      หยุดสแกน
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-block bg-purple-100 p-3 rounded-xl mb-4">
                    <Hash className="text-purple-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    หรือกรอกรหัสครุภัณฑ์
                  </h3>
                  <p className="text-gray-600 text-sm">
                    สามารถค้นหาด้วยรหัสครุภัณฑ์ หรือ Serial Number
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                    placeholder="เช่น 513000070003"
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:outline-none text-lg text-center"
                  />
                  <button
                    onClick={handleManualSearch}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl transition shadow-lg text-lg font-semibold"
                  >
                    ค้นหา
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-4">
                <AlertCircle className="text-red-600 flex-shrink-0" size={32} />
                <div>
                  <h4 className="font-bold text-red-800 text-lg mb-1">เกิดข้อผิดพลาด</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="text-blue-600" size={32} />
                </div>
                <h4 className="font-bold text-gray-800 mb-2">สแกน QR Code</h4>
                <p className="text-gray-600 text-sm">
                  ใช้กล้องสแกน QR Code ที่ติดอยู่บนครุภัณฑ์
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Info className="text-green-600" size={32} />
                </div>
                <h4 className="font-bold text-gray-800 mb-2">ดูข้อมูล</h4>
                <p className="text-gray-600 text-sm">
                  ดูรายละเอียดครุภัณฑ์ สถานะ และตำแหน่ง
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-purple-600" size={32} />
                </div>
                <h4 className="font-bold text-gray-800 mb-2">ตรวจสอบได้ทันที</h4>
                <p className="text-gray-600 text-sm">
                  ไม่ต้องเข้าสู่ระบบ ตรวจสอบได้ทันที
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                    <CheckCircle size={48} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">พบข้อมูลครุภัณฑ์</h2>
                    <p className="text-green-50 text-lg">รหัส: {asset.asset_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAsset(null);
                    setManualInput('');
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-xl transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {asset.image ? (
                <img 
                  src={asset.image} 
                  alt={asset.asset_name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Image size={80} className="text-gray-400" />
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{asset.asset_name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InfoItem 
                      icon={Tag}
                      label="รหัสครุภัณฑ์"
                      value={asset.asset_id}
                      highlight
                    />
                    <InfoItem 
                      icon={Hash}
                      label="Serial Number"
                      value={asset.serial_number || '-'}
                    />
                    <InfoItem 
                      icon={Package}
                      label="จำนวน"
                      value={`${asset.quantity} ${asset.unit}`}
                    />
                    <InfoItem 
                      icon={DollarSign}
                      label="มูลค่า"
                      value={`${parseFloat(asset.price).toLocaleString()} บาท`}
                    />
                  </div>

                  <div className="space-y-4">
                    <InfoItem 
                      icon={Building}
                      label="อาคาร"
                      value={asset.building_name}
                    />
                    <InfoItem 
                      icon={Layers}
                      label="ตำแหน่ง"
                      value={`ชั้น ${asset.floor} ห้อง ${asset.room_number}`}
                    />
                    <InfoItem 
                      icon={MapPin}
                      label="หน่วยงาน"
                      value={asset.department_name}
                    />
                    <InfoItem 
                      icon={Calendar}
                      label="วันที่รับเข้า"
                      value={asset.received_date}
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">สถานะครุภัณฑ์</p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border-2 ${getStatusColor(asset.status)}`}>
                        {(() => {
                          const StatusIcon = getStatusIcon(asset.status);
                          return <StatusIcon size={20} />;
                        })()}
                        {asset.status}
                      </div>
                    </div>

                    {asset.last_check_date && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">ตรวจสอบล่าสุด</p>
                        <p className="text-lg font-semibold text-gray-800">{asset.last_check_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAsset(null);
                  setManualInput('');
                  startScanner();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl transition shadow-lg text-lg font-semibold flex items-center justify-center gap-2"
              >
                <Camera size={24} />
                สแกนอันต่อไป
              </button>
              
              <button
                onClick={() => {
                  setAsset(null);
                  setManualInput('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-xl transition text-lg font-semibold"
              >
                ค้นหาใหม่
              </button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">ข้อมูลสำหรับผู้ใช้ทั่วไป</h4>
                  <p className="text-blue-800 text-sm">
                    หากพบครุภัณฑ์ชำรุดหรือต้องการรายงานปัญหา กรุณาติดต่อเจ้าหน้าที่ภาควิชาเทคโนโลยีสารสนเทศ
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>ระบบจัดการครุภัณฑ์ - ภาควิชาเทคโนโลยีสารสนเทศ</p>
          <p className="text-sm mt-1">มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${highlight ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}>
      <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <Icon className={highlight ? 'text-blue-600' : 'text-gray-600'} size={20} />
      </div>
      <div className="flex-1">
        <p className={`text-sm ${highlight ? 'text-blue-600' : 'text-gray-600'} mb-1`}>{label}</p>
        <p className={`font-semibold ${highlight ? 'text-blue-900' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  );
}