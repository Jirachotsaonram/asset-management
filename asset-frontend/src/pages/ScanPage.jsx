import { useState } from 'react';
import { Camera, QrCode, History } from 'lucide-react';
import QRScanner from '../components/Scanner/QRScanner';

export default function ScanPage() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">สแกน QR Code</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: สแกน QR */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <Camera className="w-12 h-12 mb-4 opacity-80" />
          <h3 className="text-xl font-semibold mb-2">สแกน QR Code</h3>
          <p className="text-blue-100 mb-4">เปิดกล้องเพื่อสแกน QR Code ครุภัณฑ์</p>
          <button
            onClick={() => setShowScanner(true)}
            className="w-full bg-white text-blue-600 px-4 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            เริ่มสแกน
          </button>
        </div>

        {/* Card 2: คำแนะนำ */}
        <div className="bg-white rounded-lg p-6 shadow">
          <QrCode className="w-12 h-12 mb-4 text-green-600" />
          <h3 className="text-xl font-semibold mb-2">วิธีใช้งาน</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. คลิกปุ่ม "เริ่มสแกน"</li>
            <li>2. อนุญาตให้เข้าถึงกล้อง</li>
            <li>3. จ่อกล้องไปที่ QR Code</li>
            <li>4. ตรวจสอบข้อมูล</li>
            <li>5. บันทึกการตรวจสอบ</li>
          </ul>
        </div>

        {/* Card 3: ประวัติ */}
        <div className="bg-white rounded-lg p-6 shadow">
          <History className="w-12 h-12 mb-4 text-purple-600" />
          <h3 className="text-xl font-semibold mb-2">ข้อมูลการสแกน</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>วันนี้:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span>สัปดาห์นี้:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span>เดือนนี้:</span>
              <span className="font-semibold">-</span>
            </div>
          </div>
        </div>
      </div>

      {/* คำแนะนำเพิ่มเติม */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-3">💡 เคล็ดลับ</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li>• ใช้งานได้ทั้งบนคอมพิวเตอร์ (Webcam) และมือถือ</li>
          <li>• ควรมีแสงสว่างเพียงพอเพื่อให้สแกนได้ชัดเจน</li>
          <li>• จ่อกล้องให้ QR Code อยู่ในกรอบสี่เหลี่ยม</li>
          <li>• ถ้าสแกนไม่ได้ ให้ลองปรับระยะห่างระหว่างกล้องกับ QR Code</li>
        </ul>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}