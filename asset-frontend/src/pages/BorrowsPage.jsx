// FILE: src/pages/BorrowsPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  X,
  Calendar,
  User,
  FileText,
  RotateCcw
} from 'lucide-react';

export default function BorrowsPage() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [formData, setFormData] = useState({
    asset_id: '',
    borrower_name: '',
    borrow_date: new Date().toISOString().split('T')[0],
    purpose: ''
  });
  const [returnRemark, setReturnRemark] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [borrowsRes, assetsRes] = await Promise.all([
        api.get('/borrows'),
        api.get('/assets')
      ]);
      
      setBorrows(borrowsRes.data.data || []);
      // กรองเฉพาะครุภัณฑ์ที่ใช้งานได้
      setAssets(assetsRes.data.data?.filter(a => a.status === 'ใช้งานได้') || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // กรองข้อมูล
  const filteredBorrows = borrows.filter(borrow => {
    const matchSearch = 
      borrow.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrow.asset_id?.toString().includes(searchTerm);
    
    const matchStatus = filterStatus === 'all' || borrow.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  // เปิด Modal ยืม
  const handleOpenBorrowModal = () => {
    setFormData({
      asset_id: '',
      borrower_name: '',
      borrow_date: new Date().toISOString().split('T')[0],
      purpose: ''
    });
    setShowModal(true);
  };

  // เปิด Modal คืน
  const handleOpenReturnModal = (borrow) => {
    setSelectedBorrow(borrow);
    setReturnRemark('');
    setShowReturnModal(true);
  };

  // บันทึกการยืม
  const handleSubmitBorrow = async (e) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.borrower_name) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await api.post('/borrows', {
        ...formData,
        user_id: user.user_id,
        status: 'ยืม'
      });
      
      toast.success('บันทึกการยืมสำเร็จ');
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating borrow:', error);
      toast.error('ไม่สามารถบันทึกได้');
    }
  };

  // บันทึกการคืน
  const handleSubmitReturn = async () => {
    if (!selectedBorrow) return;

    const returnDate = new Date().toISOString().split('T')[0];

    try {
      // ลอง endpoint ต่างๆ
      let response;
      const returnData = {
        borrow_id: selectedBorrow.borrow_id,
        return_date: returnDate,
        return_remark: returnRemark || 'คืนปกติ',
        status: 'คืนแล้ว'
      };

      try {
        // วิธีที่ 1: PUT /borrows/:id/return
        response = await api.put(`/borrows/${selectedBorrow.borrow_id}/return`, returnData);
      } catch (err) {
        try {
          // วิธีที่ 2: PUT /borrows/:id
          response = await api.put(`/borrows/${selectedBorrow.borrow_id}`, returnData);
        } catch (err2) {
          // วิธีที่ 3: POST /return_borrow
          response = await api.post('/return_borrow', returnData);
        }
      }
      
      if (response.data.success) {
        toast.success('บันทึกการคืนสำเร็จ');
        setShowReturnModal(false);
        setSelectedBorrow(null);
        setReturnRemark('');
        fetchData();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error returning:', error);
      toast.error('ไม่สามารถบันทึกการคืนได้');
    }
  };

  // สถานะสี
  const getStatusColor = (status) => {
    switch (status) {
      case 'ยืม': return 'bg-yellow-100 text-yellow-800';
      case 'คืนแล้ว': return 'bg-green-100 text-green-800';
      case 'เกินกำหนด': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // นับสถิติ
  const stats = {
    total: borrows.length,
    borrowed: borrows.filter(b => b.status === 'ยืม').length,
    returned: borrows.filter(b => b.status === 'คืนแล้ว').length,
    overdue: borrows.filter(b => b.status === 'เกินกำหนด').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการยืม-คืน</h1>
          <p className="text-gray-600 mt-1">บันทึกการยืมและคืนครุภัณฑ์</p>
        </div>
        <button
          onClick={handleOpenBorrowModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition shadow-md"
        >
          <Plus size={20} />
          บันทึกการยืม
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">กำลังยืม</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.borrowed}</p>
            </div>
            <div className="bg-yellow-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">คืนแล้ว</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.returned}</p>
            </div>
            <div className="bg-green-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">เกินกำหนด</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
            </div>
            <div className="bg-red-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาครุภัณฑ์หรือผู้ยืม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="ยืม">กำลังยืม</option>
            <option value="คืนแล้ว">คืนแล้ว</option>
            <option value="เกินกำหนด">เกินกำหนด</option>
          </select>
        </div>
      </div>

      {/* Borrows Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">รหัสครุภัณฑ์</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ชื่อครุภัณฑ์</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ผู้ยืม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">วันที่ยืม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">วันที่คืน</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBorrows.map((borrow) => (
                <tr key={borrow.borrow_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {borrow.asset_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {borrow.asset_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {borrow.borrower_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {borrow.borrow_date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {borrow.return_date || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(borrow.status)}`}>
                      {borrow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {borrow.status === 'ยืม' && (
                      <button
                        onClick={() => handleOpenReturnModal(borrow)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                      >
                        <RotateCcw size={16} />
                        คืน
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBorrows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ไม่พบข้อมูลการยืม-คืน</p>
          </div>
        )}
      </div>

      {/* Modal ยืม */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">บันทึกการยืม</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitBorrow} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package size={16} className="inline mr-1" />
                  เลือกครุภัณฑ์ *
                </label>
                <select
                  value={formData.asset_id}
                  onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- เลือกครุภัณฑ์ --</option>
                  {assets.map(asset => (
                    <option key={asset.asset_id} value={asset.asset_id}>
                      {asset.asset_id} - {asset.asset_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  ชื่อผู้ยืม *
                </label>
                <input
                  type="text"
                  value={formData.borrower_name}
                  onChange={(e) => setFormData({...formData, borrower_name: e.target.value})}
                  placeholder="ชื่อ-นามสกุล ผู้ยืม"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    วันที่ยืม *
                  </label>
                  <input
                    type="date"
                    value={formData.borrow_date}
                    onChange={(e) => setFormData({...formData, borrow_date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วัตถุประสงค์
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="ระบุวัตถุประสงค์การยืม..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-semibold"
                >
                  บันทึกการยืม
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal คืน */}
      {showReturnModal && selectedBorrow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">บันทึกการคืน</h2>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* รายละเอียดการยืม */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">ครุภัณฑ์</p>
                <p className="text-lg font-bold text-blue-900">{selectedBorrow.asset_name}</p>
                <p className="text-sm text-blue-700 mt-2">
                  ผู้ยืม: {selectedBorrow.borrower_name}
                </p>
                <p className="text-sm text-blue-700">
                  ยืมเมื่อ: {selectedBorrow.borrow_date}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุการคืน
                </label>
                <textarea
                  value={returnRemark}
                  onChange={(e) => setReturnRemark(e.target.value)}
                  placeholder="ระบุสภาพครุภัณฑ์หรือหมายเหตุอื่นๆ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitReturn}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  ยืนยันการคืน
                </button>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}