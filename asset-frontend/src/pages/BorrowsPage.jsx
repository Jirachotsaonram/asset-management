// FILE: src/pages/BorrowsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import {
  Plus, Search, Package, Clock, CheckCircle, AlertTriangle, X,
  Calendar, User, FileText, RotateCcw, RefreshCw, Filter,
  ArrowUpRight, ArrowDownLeft, Eye, ChevronDown, Bell
} from 'lucide-react';

export default function BorrowsPage() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState([]);
  const [assets, setAssets] = useState([]);
  const [allAssetsMap, setAllAssetsMap] = useState({}); // To store all assets for lookup
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');

  const [formData, setFormData] = useState({
    asset_id: '',
    borrower_name: '',
    borrow_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    purpose: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [returnRemark, setReturnRemark] = useState('');
  const [returnCondition, setReturnCondition] = useState('ใช้งานได้');

  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params on mount and set filters
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      if (statusFromUrl === 'borrowed' || statusFromUrl === 'ยืม') {
        setFilterStatus('borrowed');
      } else if (statusFromUrl === 'overdue') {
        setFilterStatus('overdue');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [borrowsRes, assetsRes] = await Promise.all([
        api.get('/borrows'),
        api.get('/assets')
      ]);

      setBorrows(borrowsRes.data.data || []);

      const allAssets = assetsRes.data.data || [];
      // Create lookup map
      const assetMap = allAssets.reduce((acc, curr) => ({ ...acc, [curr.asset_id]: curr }), {});
      setAllAssetsMap(assetMap);

      // Filter only available assets for dropdown
      setAssets(allAssets.filter(a => a.status === 'ใช้งานได้'));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Calculate days borrowed
  const getDaysBorrowed = (borrowDate) => {
    const start = new Date(borrowDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Check if overdue
  const isOverdue = (borrow) => {
    if (borrow.status === 'คืนแล้ว') return false;
    if (borrow.expected_return_date) {
      return new Date() > new Date(borrow.expected_return_date);
    }
    // Default: consider overdue after 30 days
    return getDaysBorrowed(borrow.borrow_date) > 30;
  };

  // Enhanced borrow data with computed fields
  const enhancedBorrows = useMemo(() => {
    return borrows.map(borrow => ({
      ...borrow,
      daysBorrowed: getDaysBorrowed(borrow.borrow_date),
      isOverdue: isOverdue(borrow),
      serial_number: allAssetsMap[borrow.asset_id]?.serial_number || '-'
    }));
  }, [borrows, allAssetsMap]);

  // Filter and sort
  const filteredBorrows = useMemo(() => {
    let result = enhancedBorrows.filter(borrow => {
      const matchSearch =
        borrow.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.asset_id?.toString().includes(searchTerm) ||
        borrow.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        borrow.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchStatus = true;
      if (filterStatus === 'borrowed') matchStatus = borrow.status === 'ยืม';
      else if (filterStatus === 'returned') matchStatus = borrow.status === 'คืนแล้ว';
      else if (filterStatus === 'overdue') matchStatus = borrow.status === 'ยืม' && borrow.isOverdue;

      return matchSearch && matchStatus;
    });

    // Sort
    switch (sortBy) {
      case 'date_desc':
        result.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date));
        break;
      case 'date_asc':
        result.sort((a, b) => new Date(a.borrow_date) - new Date(b.borrow_date));
        break;
      case 'name':
        result.sort((a, b) => (a.asset_name || '').localeCompare(b.asset_name || ''));
        break;
      case 'borrower':
        result.sort((a, b) => (a.borrower_name || '').localeCompare(b.borrower_name || ''));
        break;
    }

    return result;
  }, [enhancedBorrows, searchTerm, filterStatus, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = borrows.length;
    const borrowed = enhancedBorrows.filter(b => b.status === 'ยืม').length;
    const returned = enhancedBorrows.filter(b => b.status === 'คืนแล้ว').length;
    const overdue = enhancedBorrows.filter(b => b.status === 'ยืม' && b.isOverdue).length;
    const activeRate = total > 0 ? Math.round((borrowed / total) * 100) : 0;

    return { total, borrowed, returned, overdue, activeRate };
  }, [borrows, enhancedBorrows]);

  // Notifications data for Navbar integration
  const getBorrowNotifications = () => {
    const notifications = [];

    // Overdue items
    const overdueItems = enhancedBorrows.filter(b => b.status === 'ยืม' && b.isOverdue);
    overdueItems.forEach(item => {
      notifications.push({
        id: `overdue-${item.borrow_id}`,
        type: 'error',
        title: `ค้างคืน: ${item.asset_name}`,
        message: `${item.borrower_name} ยืมมา ${item.daysBorrowed} วัน`,
        link: '/borrows',
        read: false
      });
    });

    // Long borrows (> 14 days)
    const longBorrows = enhancedBorrows.filter(b =>
      b.status === 'ยืม' && !b.isOverdue && b.daysBorrowed > 14
    );
    if (longBorrows.length > 0) {
      notifications.push({
        id: 'long-borrows',
        type: 'warning',
        title: `มี ${longBorrows.length} รายการยืมนาน`,
        message: 'ครุภัณฑ์ที่ยืมเกิน 14 วัน',
        link: '/borrows',
        read: false
      });
    }

    return notifications;
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.asset_id) errors.asset_id = 'กรุณาเลือกครุภัณฑ์';
    if (!formData.borrower_name.trim()) errors.borrower_name = 'กรุณาระบุชื่อผู้ยืม';
    if (!formData.borrow_date) errors.borrow_date = 'กรุณาระบุวันที่ยืม';

    // Check if asset is already borrowed
    const alreadyBorrowed = borrows.find(b =>
      b.asset_id.toString() === formData.asset_id.toString() &&
      b.status === 'ยืม'
    );
    if (alreadyBorrowed) {
      errors.asset_id = 'ครุภัณฑ์นี้ถูกยืมอยู่แล้ว';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenBorrowModal = () => {
    setFormErrors({});
    setFormData({
      asset_id: '',
      borrower_name: '',
      borrow_date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      purpose: ''
    });
    setShowModal(true);
  };

  const handleOpenReturnModal = (borrow) => {
    setSelectedBorrow(borrow);
    setReturnRemark('');
    setReturnCondition('ใช้งานได้');
    setShowReturnModal(true);
  };

  const handleOpenDetailModal = (borrow) => {
    setSelectedBorrow(borrow);
    setShowDetailModal(true);
  };

  const handleSubmitBorrow = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!selectedBorrow) return;

    const returnDate = new Date().toISOString().split('T')[0];
    setSubmitting(true);

    try {
      const returnData = {
        borrow_id: selectedBorrow.borrow_id,
        return_date: returnDate,
        return_remark: returnRemark || `คืน${returnCondition}`,
        return_condition: returnCondition,
        status: 'คืนแล้ว'
      };

      let response;
      try {
        response = await api.put(`/borrows/${selectedBorrow.borrow_id}/return`, returnData);
      } catch (err) {
        try {
          response = await api.put(`/borrows/${selectedBorrow.borrow_id}`, returnData);
        } catch (err2) {
          response = await api.post('/return_borrow', returnData);
        }
      }

      if (response.data.success) {
        toast.success('บันทึกการคืนสำเร็จ');
        setShowReturnModal(false);
        setSelectedBorrow(null);
        fetchData();
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error returning:', error);
      toast.error('ไม่สามารถบันทึกการคืนได้');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (borrow) => {
    if (borrow.status === 'คืนแล้ว') {
      return {
        label: 'คืนแล้ว',
        color: 'bg-success-100 text-success-700 border-success-200',
        icon: CheckCircle,
        iconColor: 'text-success-500'
      };
    }
    if (borrow.isOverdue) {
      return {
        label: 'เกินกำหนด',
        color: 'bg-danger-100 text-danger-700 border-danger-200',
        icon: AlertTriangle,
        iconColor: 'text-danger-500'
      };
    }
    return {
      label: 'กำลังยืม',
      color: 'bg-warning-100 text-warning-700 border-warning-200',
      icon: Clock,
      iconColor: 'text-warning-500'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการยืม-คืน</h1>
          <p className="text-gray-500 mt-1">บันทึกและติดตามการยืมครุภัณฑ์</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
          <button
            onClick={handleOpenBorrowModal}
            className="btn-primary flex items-center gap-2"
          >
            <ArrowUpRight size={20} />
            บันทึกการยืม
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">รายการทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-xl">
              <FileText className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">กำลังยืม</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{stats.borrowed}</p>
            </div>
            <div className="bg-warning-100 p-3 rounded-xl">
              <Clock className="text-warning-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">คืนแล้ว</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{stats.returned}</p>
            </div>
            <div className="bg-success-100 p-3 rounded-xl">
              <CheckCircle className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">เกินกำหนด</p>
              <p className="text-2xl font-bold text-danger-600 mt-1">{stats.overdue}</p>
              {stats.overdue > 0 && (
                <p className="text-xs text-danger-500 mt-1">⚠️ ต้องติดตาม</p>
              )}
            </div>
            <div className="bg-danger-100 p-3 rounded-xl">
              <AlertTriangle className="text-danger-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Alert for overdue */}
      {stats.overdue > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
          <Bell className="text-danger-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-danger-700 font-semibold">มีครุภัณฑ์ค้างคืน {stats.overdue} รายการ</h3>
            <p className="text-danger-600 text-sm mt-1">
              กรุณาติดตามผู้ยืมเพื่อดำเนินการคืนครุภัณฑ์โดยเร็ว
            </p>
            <button
              onClick={() => setFilterStatus('overdue')}
              className="text-danger-700 text-sm font-medium mt-2 hover:underline"
            >
              ดูรายการที่เกินกำหนด →
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาครุภัณฑ์, ผู้ยืม, หรือวัตถุประสงค์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select min-w-[140px]"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="borrowed">กำลังยืม</option>
              <option value="returned">คืนแล้ว</option>
              <option value="overdue">เกินกำหนด</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select min-w-[140px]"
            >
              <option value="date_desc">ล่าสุด</option>
              <option value="date_asc">เก่าสุด</option>
              <option value="name">ชื่อครุภัณฑ์</option>
              <option value="borrower">ชื่อผู้ยืม</option>
            </select>
          </div>
        </div>
      </div>

      {/* Borrows List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">ครุภัณฑ์</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">ผู้ยืม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">วันที่ยืม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">ระยะเวลา</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBorrows.map((borrow) => {
                const statusConfig = getStatusConfig(borrow);
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={borrow.borrow_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Package className="text-gray-500" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{borrow.asset_name}</p>
                          <p className="text-sm text-gray-500">Serial: {borrow.serial_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="text-gray-400" size={16} />
                        <span className="text-gray-800">{borrow.borrower_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {borrow.borrow_date}
                    </td>
                    <td className="px-6 py-4">
                      {borrow.status === 'คืนแล้ว' ? (
                        <span className="text-gray-500">
                          คืน: {borrow.return_date}
                        </span>
                      ) : (
                        <span className={`font-medium ${borrow.isOverdue ? 'text-danger-600' : 'text-gray-700'}`}>
                          {borrow.daysBorrowed} วัน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                        <StatusIcon size={14} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetailModal(borrow)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={18} />
                        </button>
                        {borrow.status === 'ยืม' && (
                          <button
                            onClick={() => handleOpenReturnModal(borrow)}
                            className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition flex items-center gap-1"
                            title="บันทึกการคืน"
                          >
                            <ArrowDownLeft size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBorrows.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'ไม่พบรายการตามเงื่อนไข'
                : 'ยังไม่มีรายการยืม-คืน'
              }
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || filterStatus !== 'all'
                ? 'ลองปรับเงื่อนไขการค้นหา'
                : 'กดปุ่ม "บันทึกการยืม" เพื่อเริ่มต้น'
              }
            </p>
          </div>
        )}
      </div>

      {/* Borrow Modal */}
      {showModal && (
        <BorrowModal
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          assets={assets}
          onSubmit={handleSubmitBorrow}
          onClose={() => setShowModal(false)}
          submitting={submitting}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && selectedBorrow && (
        <ReturnModal
          borrow={selectedBorrow}
          returnRemark={returnRemark}
          setReturnRemark={setReturnRemark}
          returnCondition={returnCondition}
          setReturnCondition={setReturnCondition}
          onSubmit={handleSubmitReturn}
          onClose={() => setShowReturnModal(false)}
          submitting={submitting}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBorrow && (
        <DetailModal
          borrow={selectedBorrow}
          onClose={() => setShowDetailModal(false)}
          onReturn={() => {
            setShowDetailModal(false);
            handleOpenReturnModal(selectedBorrow);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// BORROW MODAL
// ============================================================
function BorrowModal({ formData, setFormData, formErrors, assets, onSubmit, onClose, submitting }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-xl">
                <ArrowUpRight className="text-primary-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">บันทึกการยืม</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกครุภัณฑ์ <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={formData.asset_id}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                className={`form-select pl-10 ${formErrors.asset_id ? 'border-danger-500' : ''}`}
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
            {formErrors.asset_id && (
              <p className="text-danger-500 text-xs mt-1">{formErrors.asset_id}</p>
            )}
          </div>

          {/* Borrower Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อผู้ยืม <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.borrower_name}
                onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                placeholder="ชื่อ-นามสกุล ผู้ยืม"
                className={`form-input pl-10 ${formErrors.borrower_name ? 'border-danger-500' : ''}`}
                required
              />
            </div>
            {formErrors.borrower_name && (
              <p className="text-danger-500 text-xs mt-1">{formErrors.borrower_name}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่ยืม <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="date"
                  value={formData.borrow_date}
                  onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กำหนดคืน
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                  className="form-input pl-10"
                  min={formData.borrow_date}
                />
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วัตถุประสงค์
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="ระบุวัตถุประสงค์การยืม..."
              className="form-input resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  บันทึกการยืม
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// RETURN MODAL
// ============================================================
function ReturnModal({ borrow, returnRemark, setReturnRemark, returnCondition, setReturnCondition, onSubmit, onClose, submitting }) {
  const daysBorrowed = Math.floor((new Date() - new Date(borrow.borrow_date)) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-success-100 p-2 rounded-xl">
                <ArrowDownLeft className="text-success-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">บันทึกการคืน</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Borrow Info */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Package className="text-primary-500 mt-1" size={20} />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{borrow.asset_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  ผู้ยืม: {borrow.borrower_name}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-500">
                    ยืมเมื่อ: {borrow.borrow_date}
                  </span>
                  <span className="font-medium text-primary-600">
                    รวม {daysBorrowed} วัน
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Return Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะครุภัณฑ์หลังคืน
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['ใช้งานได้', 'รอซ่อม', 'รอจำหน่าย', 'ไม่พบ'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setReturnCondition(status)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${returnCondition === status
                    ? status === 'ใช้งานได้'
                      ? 'bg-success-100 border-success-500 text-success-700'
                      : status === 'รอซ่อม'
                        ? 'bg-warning-100 border-warning-500 text-warning-700'
                        : status === 'รอจำหน่าย'
                          ? 'bg-orange-100 border-orange-500 text-orange-700'
                          : 'bg-danger-100 border-danger-500 text-danger-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Return Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={returnRemark}
              onChange={(e) => setReturnRemark(e.target.value)}
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)..."
              className="form-input resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="btn-primary flex-1 justify-center bg-success-600 hover:bg-success-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  ยืนยันการคืน
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL MODAL
// ============================================================
function DetailModal({ borrow, onClose, onReturn }) {
  const daysBorrowed = Math.floor((new Date() - new Date(borrow.borrow_date)) / (1000 * 60 * 60 * 24));
  const isReturned = borrow.status === 'คืนแล้ว';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">รายละเอียดการยืม</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">ครุภัณฑ์</span>
              <span className="font-medium text-gray-900">{borrow.asset_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">รหัส</span>
              <span className="text-gray-700">{borrow.asset_id}</span>
            </div>
            {borrow.serial_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">Serial Number</span>
                <span className="text-gray-700 font-mono text-sm">{borrow.serial_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">ผู้ยืม</span>
              <span className="font-medium text-gray-900">{borrow.borrower_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่ยืม</span>
              <span className="text-gray-700">{borrow.borrow_date}</span>
            </div>
            {borrow.expected_return_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">กำหนดคืน</span>
                <span className={`font-medium ${borrow.isOverdue ? 'text-danger-600' : 'text-warning-600'}`}>
                  {borrow.expected_return_date}
                </span>
              </div>
            )}
            {isReturned && (
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่คืน</span>
                <span className="text-success-600 font-medium">{borrow.return_date}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">ระยะเวลา</span>
              <span className={`font-medium ${borrow.isOverdue ? 'text-danger-600' : 'text-gray-700'}`}>
                {daysBorrowed} วัน
              </span>
            </div>
            {borrow.purpose && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 block mb-1">วัตถุประสงค์</span>
                <p className="text-gray-700">{borrow.purpose}</p>
              </div>
            )}
            {borrow.return_remark && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 block mb-1">หมายเหตุการคืน</span>
                <p className="text-gray-700">{borrow.return_remark}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isReturned && (
              <button
                onClick={onReturn}
                className="btn-primary flex-1 justify-center bg-success-600 hover:bg-success-700"
              >
                <ArrowDownLeft size={18} />
                บันทึกการคืน
              </button>
            )}
            <button
              onClick={onClose}
              className={`btn-secondary ${isReturned ? 'flex-1' : ''} justify-center`}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}