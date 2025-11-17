// FILE: src/pages/CheckPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่มบรรทัดนี้
import api from '../services/api';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle } from 'lucide-react';

export default function CheckPage() {
  const navigate = useNavigate(); // เพิ่มบรรทัดนี้
  const [uncheckedAssets, setUncheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUncheckedAssets();
  }, []);

  const fetchUncheckedAssets = async () => {
    try {
      const response = await api.get('/checks/unchecked');
      setUncheckedAssets(response.data.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (assetId) => {
    try {
      await api.post('/checks', {
        asset_id: assetId,
        check_status: 'ปกติ',
        remark: 'ตรวจสอบผ่านระบบ'
      });
      toast.success('บันทึกการตรวจสอบสำเร็จ');
      fetchUncheckedAssets();
    } catch (error) {
      toast.error('บันทึกไม่สำเร็จ');
    }
  };

  // ฟังก์ชันไปหน้า Scan
  const goToScanPage = () => {
    navigate('/scan');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ตรวจสอบครุภัณฑ์</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">ครุภัณฑ์ที่ยังไม่ได้ตรวจสอบ</h2>
            <p className="text-gray-600 mt-1">
              มี {uncheckedAssets.length} รายการที่ยังไม่ได้ตรวจสอบ
            </p>
          </div>
          <button 
            onClick={goToScanPage}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <QrCode className="w-5 h-5" />
            <span>สแกน QR Code</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uncheckedAssets.map((asset) => (
          <div key={asset.asset_id} className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-2">{asset.asset_name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              ID: {asset.asset_id}<br />
              Serial: {asset.serial_number || '-'}
            </p>
            <button
              onClick={() => handleCheck(asset.asset_id)}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>ยืนยันการตรวจสอบ</span>
            </button>
          </div>
        ))}
      </div>

      {uncheckedAssets.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            ตรวจสอบครบแล้ว
          </h3>
          <p className="text-gray-600">
            ไม่มีครุภัณฑ์ที่ต้องตรวจสอบในขณะนี้
          </p>
        </div>
      )}
    </div>
  );
}