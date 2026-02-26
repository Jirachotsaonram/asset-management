// FILE: src/pages/BorrowsPage.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import {
  Plus, Search, Package, Clock, CheckCircle, AlertTriangle, X,
  Calendar, User, FileText, RotateCcw, RefreshCw, Filter,
  ArrowUpRight, ArrowDownLeft, Eye, ChevronDown, Bell, ChevronLeft, ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 50;

export default function BorrowsPage() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [allAssetsMap, setAllAssetsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    asset_id: '',
    borrower_name: '',
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: '',
    purpose: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [returnRemark, setReturnRemark] = useState('');
  const [returnCondition, setReturnCondition] = useState('ใช้งานได้');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      if (statusFromUrl === 'borrowed' || statusFromUrl === 'ยืม') setFilterStatus('borrowed');
      else if (statusFromUrl === 'overdue') setFilterStatus('overdue');
    }
  }, [searchParams]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // โหลดแค่ borrows ก่อน ไม่โหลด assets พร้อมกัน เพื่อให้หน้าเร็วขึ้น
      const borrowsRes = await api.get('/borrows');
      setBorrows(borrowsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // โหลด assets เฉพาะตอนเปิด modal ยืม (lazy load)
  const fetchAssetsIfNeeded = async () => {
    if (allAssets.length > 0) return; // โหลดแล้ว ไม่ต้องโหลดซ้ำ
    try {
      const assetsRes = await api.get('/assets');
      const assetsList = assetsRes.data.data || [];
      setAllAssets(assetsList);
      setAllAssetsMap(assetsList.reduce((acc, curr) => ({ ...acc, [curr.asset_id]: curr }), {}));
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const enhancedBorrows = useMemo(() => {
    const now = new Date();
    return borrows.map(borrow => {
      const start = new Date(borrow.borrow_date);
      const daysBorrowed = Math.floor((now - start) / (1000 * 60 * 60 * 24));

      let isOverdue = false;
      if (borrow.status !== 'คืนแล้ว') {
        if (borrow.due_date) {
          isOverdue = now > new Date(borrow.due_date);
        } else {
          isOverdue = daysBorrowed > 30;
        }
      }

      return {
        ...borrow,
        daysBorrowed,
        isOverdue,
        serial_number: allAssetsMap[borrow.asset_id]?.serial_number || '-'
      };
    });
  }, [borrows, allAssetsMap]);

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

    switch (sortBy) {
      case 'date_desc': result.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date)); break;
      case 'date_asc': result.sort((a, b) => new Date(a.borrow_date) - new Date(b.borrow_date)); break;
      case 'name': result.sort((a, b) => (a.asset_name || '').localeCompare(b.asset_name || '')); break;
      case 'borrower': result.sort((a, b) => (a.borrower_name || '').localeCompare(b.borrower_name || '')); break;
    }
    return result;
  }, [enhancedBorrows, searchTerm, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = borrows.length;
    const borrowed = enhancedBorrows.filter(b => b.status === 'ยืม').length;
    const returned = enhancedBorrows.filter(b => b.status === 'คืนแล้ว').length;
    const overdue = enhancedBorrows.filter(b => b.status === 'ยืม' && b.isOverdue).length;
    return { total, borrowed, returned, overdue };
  }, [borrows, enhancedBorrows]);

  const paginatedBorrows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBorrows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBorrows, currentPage]);

  const totalPages = Math.ceil(filteredBorrows.length / ITEMS_PER_PAGE);

  const validateForm = () => {
    const errors = {};
    if (!formData.asset_id) errors.asset_id = 'กรุณาเลือกครุภัณฑ์';
    if (!formData.borrower_name.trim()) errors.borrower_name = 'กรุณาระบุชื่อผู้ยืม';
    if (!formData.borrow_date) errors.borrow_date = 'กรุณาระบุวันที่ยืม';

    const alreadyBorrowed = borrows.find(b =>
      b.asset_id.toString() === formData.asset_id.toString() && b.status === 'ยืม'
    );
    if (alreadyBorrowed) errors.asset_id = 'ครุภัณฑ์นี้ถูกยืมอยู่แล้ว';

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
    fetchAssetsIfNeeded(); // ← lazy-load assets เฉพาะตอนเปิด modal
    setShowModal(true);
  };

  const handleSubmitBorrow = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await api.post('/borrows', { ...formData, user_id: user.user_id, status: 'ยืม' });
      toast.success('บันทึกการยืมสำเร็จ');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!selectedBorrow) return;
    setSubmitting(true);
    try {
      const returnData = {
        borrow_id: selectedBorrow.borrow_id,
        asset_id: selectedBorrow.asset_id,
        return_date: new Date().toISOString().split('T')[0],
        return_remark: returnRemark || `คืน${returnCondition}`,
        return_condition: returnCondition,
        status: 'คืนแล้ว'
      };
      await api.put(`/borrows/${selectedBorrow.borrow_id}/return`, returnData);
      toast.success('บันทึกการคืนสำเร็จ');
      setShowReturnModal(false);
      setSelectedBorrow(null);
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกการคืนได้');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && borrows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการยืม-คืน</h1>
          <p className="text-gray-500 mt-1">บันทึกและติดตามการยืมครุภัณฑ์</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2"><RefreshCw size={18} /><span>รีเฟรช</span></button>
          <button onClick={handleOpenBorrowModal} className="btn-primary flex items-center gap-2"><ArrowUpRight size={20} />บันทึกการยืม</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="รายการทั้งหมด" value={stats.total} icon={FileText} color="primary" />
        <StatCard label="กำลังยืม" value={stats.borrowed} icon={Clock} color="warning" />
        <StatCard label="คืนแล้ว" value={stats.returned} icon={CheckCircle} color="success" />
        <StatCard label="เกินกำหนด" value={stats.overdue} icon={AlertTriangle} color="danger" />
      </div>

      {stats.overdue > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
          <Bell className="text-danger-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-danger-700 font-semibold">มีครุภัณฑ์ค้างคืน {stats.overdue} รายการ</h3>
            <button onClick={() => setFilterStatus('overdue')} className="text-danger-700 text-sm font-medium mt-1 hover:underline">ดูรายการที่เกินกำหนด →</button>
          </div>
        </div>
      )}

      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="text" placeholder="ค้นหาครุภัณฑ์, ผู้ยืม..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-10" />
          </div>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-select min-w-[140px]">
              <option value="all">ทุกสถานะ</option>
              <option value="borrowed">กำลังยืม</option>
              <option value="returned">คืนแล้ว</option>
              <option value="overdue">เกินกำหนด</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select min-w-[140px]">
              <option value="date_desc">ล่าสุด</option>
              <option value="date_asc">เก่าสุด</option>
              <option value="name">ชื่อครุภัณฑ์</option>
              <option value="borrower">ชื่อผู้ยืม</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ครุภัณฑ์</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ผู้ยืม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">วันที่ยืม</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ระยะเวลา</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBorrows.map((borrow) => {
                const isReturned = borrow.status === 'คืนแล้ว';
                const statusColor = isReturned ? 'success' : (borrow.isOverdue ? 'danger' : 'warning');
                const StatusIcon = isReturned ? CheckCircle : (borrow.isOverdue ? AlertTriangle : Clock);

                return (
                  <tr key={borrow.borrow_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{borrow.asset_name}</p>
                      <p className="text-xs text-gray-500">SN: {borrow.serial_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{borrow.borrower_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{borrow.borrow_date}</td>
                    <td className="px-6 py-4 text-sm">
                      {isReturned ? (
                        <div className="flex flex-col">
                          <span className="text-success-600 font-medium">คืนแล้ว</span>
                          <span className="text-xs text-gray-500">เมื่อ: {borrow.return_date}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className={borrow.isOverdue ? 'text-danger-600 font-bold' : 'text-gray-700'}>
                            {borrow.daysBorrowed === 0 ? 'วันนี้' : `${borrow.daysBorrowed} วัน`}
                          </span>
                          {borrow.due_date && (
                            <span className={`text-[10px] ${borrow.isOverdue ? 'text-danger-500' : 'text-gray-500'}`}>
                              กำหนดคืน: {borrow.due_date}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border 
                        ${statusColor === 'success' ? 'bg-success-50 border-success-200 text-success-700' :
                          statusColor === 'danger' ? 'bg-danger-50 border-danger-200 text-danger-700' :
                            'bg-warning-50 border-warning-200 text-warning-700'}`}>
                        <StatusIcon size={14} /> {isReturned ? 'คืนแล้ว' : (borrow.isOverdue ? 'เกินกำหนด' : 'กำลังยืม')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedBorrow(borrow); setShowDetailModal(true); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Eye size={18} /></button>
                        {!isReturned && <button onClick={() => { setSelectedBorrow(borrow); setShowReturnModal(true); }} className="p-2 text-success-600 hover:bg-success-100 rounded-lg"><ArrowDownLeft size={18} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-500">แสดงรายการที่ {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredBorrows.length)} จาก {filteredBorrows.length}</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={18} /></button>
              <span className="flex items-center px-4 font-medium text-sm text-gray-700">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <BorrowModal
          formData={formData} setFormData={setFormData} formErrors={formErrors}
          allAssets={allAssets} onSubmit={handleSubmitBorrow} onClose={() => setShowModal(false)} submitting={submitting}
        />
      )}

      {showReturnModal && selectedBorrow && (
        <ReturnModal
          borrow={selectedBorrow} returnRemark={returnRemark} setReturnRemark={setReturnRemark}
          returnCondition={returnCondition} setReturnCondition={setReturnCondition}
          onSubmit={handleSubmitReturn} onClose={() => setShowReturnModal(false)} submitting={submitting}
        />
      )}

      {showDetailModal && selectedBorrow && (
        <DetailModal
          borrow={selectedBorrow} onClose={() => setShowDetailModal(false)}
          onReturn={() => { setShowDetailModal(false); setShowReturnModal(true); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning-50 text-warning-600',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600'
  };
  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
      </div>
      <div className={`${colors[color]} p-3 rounded-2xl`}><Icon size={24} /></div>
    </div>
  );
}

function BorrowModal({ formData, setFormData, formErrors, allAssets, onSubmit, onClose, submitting }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableAssets = useMemo(() =>
    allAssets.filter(a => a.status === 'ใช้งานได้' &&
      (a.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
        a.asset_id?.toString().includes(search))
    ).slice(0, 20),
    [allAssets, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedAsset = allAssets.find(a => a.asset_id.toString() === formData.asset_id.toString());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">บันทึกการยืม</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">เลือกครุภัณฑ์ <span className="text-danger-500">*</span></label>
            <div
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-3 p-3 border-2 rounded-2xl cursor-pointer transition ${isOpen ? 'border-primary-500 ring-4 ring-primary-100' : 'border-gray-200 hover:border-gray-300'} ${formErrors.asset_id ? 'border-danger-500 bg-danger-50' : ''}`}
            >
              <Package size={20} className="text-gray-400" />
              <div className="flex-1">
                {selectedAsset ? (
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{selectedAsset.asset_name}</p>
                    <p className="text-xs text-gray-500">ID: {selectedAsset.asset_id} • SN: {selectedAsset.serial_number || '-'}</p>
                  </div>
                ) : <span className="text-gray-400 text-sm">ค้นหาครุภัณฑ์ที่ต้องการยืม...</span>}
              </div>
              <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input autoFocus placeholder="พิมพ์เพื่อค้นหา..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-primary-500 outline-none" />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableAssets.length > 0 ? availableAssets.map(asset => (
                    <div
                      key={asset.asset_id}
                      onClick={() => { setFormData({ ...formData, asset_id: asset.asset_id }); setIsOpen(false); }}
                      className="p-3 hover:bg-primary-50 cursor-pointer border-b last:border-0"
                    >
                      <p className="font-bold text-sm text-gray-800">{asset.asset_name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">ID: {asset.asset_id} • SN: {asset.serial_number || '-'}</p>
                    </div>
                  )) : <div className="p-8 text-center text-gray-400 text-sm italic">ไม่พบครุภัณฑ์ที่สามารถยืมได้</div>}
                </div>
              </div>
            )}
            {formErrors.asset_id && <p className="text-danger-500 text-xs mt-1.5 ml-1">{formErrors.asset_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">ชื่อผู้ยืม <span className="text-danger-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" value={formData.borrower_name} onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })} placeholder="ระบุชื่อ-นามสกุล ผู้ยืม" className={`form-input pl-10 h-12 rounded-2xl ${formErrors.borrower_name ? 'border-danger-500 bg-danger-50' : ''}`} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">วันที่ยืม <span className="text-danger-500">*</span></label>
              <input type="date" value={formData.borrow_date} onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })} className="form-input h-12 rounded-2xl" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">กำหนดคืน</label>
              <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="form-input h-12 rounded-2xl" min={formData.borrow_date} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">วัตถุประสงค์</label>
            <textarea value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="ระบุเหตุผลในการยืม..." className="form-input rounded-2xl resize-none" rows={2} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 h-12 rounded-2xl justify-center font-bold disabled:opacity-50">
              {submitting ? <RefreshCw className="animate-spin" /> : 'ยืนยันการยืม'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12 rounded-2xl justify-center font-bold">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReturnModal({ borrow, returnRemark, setReturnRemark, returnCondition, setReturnCondition, onSubmit, onClose, submitting }) {
  const days = Math.floor((new Date() - new Date(borrow.borrow_date)) / 86400000);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b bg-success-50/50 flex justify-between items-center text-success-800">
          <h2 className="text-xl font-bold">บันทึกการคืน</h2>
          <button onClick={onClose} className="p-2 hover:bg-success-100 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
            <p className="font-bold text-gray-900">{borrow.asset_name}</p>
            <p className="text-xs text-gray-600 mt-1">ผู้ยืม: {borrow.borrower_name} • รวม {days} วัน</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">สถานะครุภัณฑ์หลังคืน</label>
            <div className="grid grid-cols-2 gap-2">
              {['ใช้งานได้', 'รอซ่อม', 'รอจำหน่าย', 'ไม่พบ'].map((s) => (
                <button key={s} type="button" onClick={() => setReturnCondition(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition ${returnCondition === s ? 'bg-success-600 border-success-600 text-white' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ</label>
            <textarea value={returnRemark} onChange={(e) => setReturnRemark(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." className="form-input rounded-2xl resize-none" rows={2} />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onSubmit} disabled={submitting} className="btn-primary flex-1 h-12 rounded-2xl justify-center bg-success-600 hover:bg-success-700 font-bold border-0">
              {submitting ? <RefreshCw className="animate-spin" /> : 'ยืนยันการคืน'}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 h-12 rounded-2xl justify-center font-bold">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ borrow, onClose, onReturn }) {
  const isReturned = borrow.status === 'คืนแล้ว';
  const stats = [
    { label: 'รหัสครุภัณฑ์', value: borrow.asset_id },
    { label: 'Serial Number', value: borrow.serial_number, mono: true },
    { label: 'ผู้ยืม', value: borrow.borrower_name },
    { label: 'วันที่ยืม', value: borrow.borrow_date },
    { label: 'กำหนดคืน', value: borrow.due_date || '-', highlight: borrow.isOverdue },
    { label: 'สถานะปัจจุบัน', value: isReturned ? 'คืนแล้ว' : (borrow.isOverdue ? 'เกินกำหนด' : 'กำลังยืม') }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">รายละเอียด</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner"><Package size={32} /></div>
            <h3 className="font-bold text-xl text-gray-900">{borrow.asset_name}</h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Borrow Details</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            {stats.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{s.label}</span>
                <span className={`font-bold ${s.mono ? 'font-mono' : ''} ${s.highlight ? 'text-danger-600' : 'text-gray-900'}`}>{s.value}</span>
              </div>
            ))}
          </div>
          {borrow.purpose && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-400 uppercase ml-1">วัตถุประสงค์</p>
              <div className="bg-blue-50/50 p-3 rounded-xl border-l-4 border-primary-500 text-sm italic text-gray-700">{borrow.purpose}</div>
            </div>
          )}
          <div className="flex gap-3">
            {!isReturned && <button onClick={onReturn} className="btn-primary flex-1 h-12 rounded-2xl justify-center bg-success-600 hover:bg-success-700 font-bold border-0"><ArrowDownLeft size={18} /> บันทึกการคืน</button>}
            <button onClick={onClose} className={`btn-secondary ${isReturned ? 'flex-1' : ''} h-12 rounded-2xl justify-center font-bold`}>ปิด</button>
          </div>
        </div>
      </div>
    </div>
  );
}