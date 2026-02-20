// FILE: asset-frontend/src/pages/AuditTrailPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Search, Download, Filter, X, Eye, Calendar, User,
  Package, Activity, RefreshCw, RotateCcw, FileSpreadsheet,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sliders
} from 'lucide-react';

// ==================== Notifications Integration ====================
export const getAuditNotifications = (audits) => {
  const notifications = [];
  const today = new Date().toDateString();
  const todayDeletes = audits.filter(a => new Date(a.action_date).toDateString() === today && a.action === 'Delete');
  if (todayDeletes.length > 0) {
    notifications.push({
      id: 'today-deletes', type: 'warning',
      title: `วันนี้มีการลบ ${todayDeletes.length} รายการ`,
      message: 'ตรวจสอบการดำเนินการ', link: '/audit-trail', read: false
    });
  }
  return notifications;
};

// ==================== Constants ====================
const ACTIONS = [
  { key: 'all', label: 'ทั้งหมด', emoji: '📋' },
  { key: 'Add', label: 'เพิ่ม', emoji: '➕', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'Edit', label: 'แก้ไข', emoji: '✏️', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'Delete', label: 'ลบ', emoji: '🗑️', color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'Move', label: 'ย้าย', emoji: '🚚', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'Check', label: 'ตรวจสอบ', emoji: '✅', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'Borrow', label: 'ยืม', emoji: '📤', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'Return', label: 'คืน', emoji: '📥', color: 'bg-teal-100 text-teal-700 border-teal-200' },
];

const ITEMS_PER_PAGE = 50;

const FIELD_LABELS = {
  asset_id: 'รหัสครุภัณฑ์', asset_name: 'ชื่อครุภัณฑ์', serial_number: 'หมายเลข Serial',
  category_id: 'หมวดหมู่', category_name: 'ชื่อหมวดหมู่', department_id: 'รหัสหน่วยงาน',
  department_name: 'หน่วยงาน', location_id: 'รหัสสถานที่', building_name: 'อาคาร',
  floor: 'ชั้น', room_number: 'ห้อง', status: 'สถานะ', purchase_date: 'วันที่ซื้อ',
  purchase_price: 'ราคา', warranty_end: 'วันหมดประกัน', remark: 'หมายเหตุ',
  description: 'รายละเอียด', image_url: 'รูปภาพ', created_at: 'วันที่สร้าง',
  updated_at: 'วันที่อัปเดต', user_id: 'รหัสผู้ใช้', fullname: 'ชื่อผู้ใช้',
  check_status: 'สถานะการตรวจ', check_date: 'วันที่ตรวจ', next_check_date: 'วันตรวจครั้งถัดไป',
  borrow_date: 'วันที่ยืม', return_date: 'วันที่คืน', borrower_name: 'ผู้ยืม',
  purpose: 'วัตถุประสงค์', price: 'ราคา', quantity: 'จำนวน', unit: 'หน่วย',
  received_date: 'วันที่รับ', barcode: 'บาร์โค้ด', reference_number: 'เลขอ้างอิง',
  fund_code: 'รหัสกองทุน', plan_code: 'รหัสแผน', project_code: 'รหัสโครงการ',
  faculty_name: 'คณะ', delivery_number: 'เลขที่ใบส่ง', room_text: 'ห้อง (text)',
};

// ==================== Main Component ====================
export default function AuditTrailPage() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);

  // Filters — auto-apply on change
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('action_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    Promise.all([fetchData(), fetchUsers()]);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audits');
      setAudits(res.data.data || []);
    } catch { toast.error('ไม่สามารถโหลดข้อมูลได้'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch { /* ignore */ }
  };

  // ==================== Derived data ====================
  const filteredAudits = useMemo(() => {
    let data = [...audits];

    if (actionFilter !== 'all') data = data.filter(a => a.action === actionFilter);
    if (userFilter !== 'all') data = data.filter(a => String(a.user_id) === userFilter);
    if (startDate) data = data.filter(a => new Date(a.action_date) >= new Date(startDate));
    if (endDate) data = data.filter(a => new Date(a.action_date) <= new Date(endDate + 'T23:59:59'));

    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(a =>
        a.fullname?.toLowerCase().includes(term) ||
        a.asset_name?.toLowerCase().includes(term) ||
        a.action?.toLowerCase().includes(term) ||
        String(a.asset_id || '').includes(term)
      );
    }

    // Sort
    data.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'action_date') {
        va = new Date(va || 0).getTime();
        vb = new Date(vb || 0).getTime();
      }
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (typeof va === 'number' && typeof vb === 'number') return sortOrder === 'asc' ? va - vb : vb - va;
      return sortOrder === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    return data;
  }, [audits, actionFilter, userFilter, startDate, endDate, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredAudits.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAudits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAudits, currentPage]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [search, actionFilter, userFilter, startDate, endDate]);

  // Action counts
  const actionCounts = useMemo(() => {
    const counts = {};
    audits.forEach(a => { counts[a.action] = (counts[a.action] || 0) + 1; });
    return counts;
  }, [audits]);

  const handleSort = (key) => {
    if (sortKey === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const clearFilters = () => {
    setSearch(''); setActionFilter('all'); setUserFilter('all');
    setStartDate(''); setEndDate('');
  };

  const hasActiveFilters = search || actionFilter !== 'all' || userFilter !== 'all' || startDate || endDate;

  // ==================== Export ====================
  const doExport = (format) => {
    if (filteredAudits.length === 0) { toast.error('ไม่มีข้อมูลให้ Export'); return; }
    try {
      const headers = ['วันที่-เวลา', 'ผู้ใช้งาน', 'Action', 'ครุภัณฑ์', 'รหัสครุภัณฑ์'];
      let csv = '\uFEFF' + headers.join('\t') + '\n';
      filteredAudits.forEach(a => {
        csv += [
          new Date(a.action_date).toLocaleString('th-TH'),
          a.fullname || '-', a.action || '-', a.asset_name || '-', a.asset_id || '-'
        ].join('\t') + '\n';
      });
      const blob = new Blob([csv], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
      link.click();
      toast.success(`กำลังดาวน์โหลด ${format.toUpperCase()}`);
    } catch { toast.error('ไม่สามารถ Export ได้'); }
  };

  const getActionConfig = (action) => ACTIONS.find(a => a.key === action) || ACTIONS[0];

  // ==================== Loading ====================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลด Audit Trail...</p>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-0.5">ประวัติการทำงานทั้งหมดในระบบ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm">
            <RefreshCw size={15} /> รีเฟรช
          </button>
          <button onClick={() => doExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-sm">
            <Download size={15} /> CSV
          </button>
          <button onClick={() => doExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm">
            <FileSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>

      {/* Action Summary Chips */}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(a => {
          const count = a.key === 'all' ? audits.length : (actionCounts[a.key] || 0);
          if (a.key !== 'all' && count === 0) return null;
          const isActive = actionFilter === a.key;
          return (
            <button key={a.key} onClick={() => setActionFilter(a.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isActive
                  ? (a.color || 'bg-blue-100 text-blue-700 border-blue-200') + ' ring-2 ring-offset-1 ring-blue-300 scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}>
              <span>{a.emoji}</span>
              <span>{a.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/60' : 'bg-gray-100'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาผู้ใช้, ครุภัณฑ์, Action..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Toggle advanced filters */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border transition ${showFilters || hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
            <Sliders size={15} />
            ตัวกรอง
            {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition">
              <RotateCcw size={14} /> ล้าง
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ผู้ใช้งาน</label>
              <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">ทั้งหมด</option>
                {users.map(u => <option key={u.user_id} value={u.user_id}>{u.fullname}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ตั้งแต่วันที่</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ถึงวันที่</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 px-1">
        แสดง {paginatedData.length} จาก {filteredAudits.length} รายการ
        {filteredAudits.length !== audits.length && <span className="text-blue-600"> (กรองจาก {audits.length} ทั้งหมด)</span>}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-10">#</th>
                {[
                  { key: 'action_date', label: 'วันที่-เวลา' },
                  { key: 'fullname', label: 'ผู้ใช้งาน' },
                  { key: 'action', label: 'Action' },
                  { key: 'asset_name', label: 'ครุภัณฑ์' },
                  { key: null, label: '' },
                ].map((col, i) => (
                  <th key={i}
                    onClick={col.key ? () => handleSort(col.key) : undefined}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-gray-900 select-none' : ''}`}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && sortKey === col.key && (
                        sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((audit, idx) => {
                const cfg = getActionConfig(audit.action);
                return (
                  <tr key={audit.audit_id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(audit.action_date).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'short', year: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-gray-500" />
                        </div>
                        <span className="truncate max-w-[120px]">{audit.fullname || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        <span>{cfg.emoji}</span> {audit.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {audit.asset_name ? (
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">{audit.asset_name}</p>
                          <p className="text-[10px] text-gray-400">ID: {audit.asset_id}</p>
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedAudit(audit)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs rounded-lg transition opacity-70 group-hover:opacity-100">
                        <Eye size={13} /> ดู
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Activity size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500">ไม่พบข้อมูล Audit Trail</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:text-blue-800">ล้างตัวกรอง</button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAudits.length)} จาก {filteredAudits.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAudit && (
        <DetailModal audit={selectedAudit} onClose={() => setSelectedAudit(null)} />
      )}
    </div>
  );
}

// ==================== Detail Modal ====================
function DetailModal({ audit, onClose }) {
  const parseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

  const getLabel = (key) => FIELD_LABELS[key] || key;

  const formatValue = (key, value) => {
    if (value == null || value === '') return <span className="text-gray-400 italic">-</span>;
    if (key.includes('date') || key.includes('_at')) {
      try { return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
      catch { return value; }
    }
    if (key.includes('price') || key.includes('cost')) {
      return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
    }
    if (key.includes('image') && typeof value === 'string' && value.startsWith('http')) {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">ดูรูปภาพ</a>;
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const oldValue = parseJSON(audit.old_value);
  const newValue = parseJSON(audit.new_value);

  const actionCfg = ACTIONS.find(a => a.key === audit.action) || ACTIONS[0];

  // Diff for Edit
  const changedKeys = useMemo(() => {
    if (audit.action !== 'Edit' || !oldValue || !newValue) return [];
    const allKeys = new Set([...Object.keys(oldValue || {}), ...Object.keys(newValue || {})]);
    return [...allKeys].filter(k => JSON.stringify(oldValue?.[k]) !== JSON.stringify(newValue?.[k]));
  }, [audit, oldValue, newValue]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{actionCfg.emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-800">รายละเอียด Audit</h2>
              <p className="text-xs text-gray-500">#{audit.audit_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'วันที่-เวลา', value: new Date(audit.action_date).toLocaleString('th-TH'), icon: Calendar },
              { label: 'ผู้ใช้งาน', value: audit.fullname || '-', icon: User },
              { label: 'Action', value: audit.action, icon: Activity, badge: true },
              { label: 'ครุภัณฑ์', value: audit.asset_name || '-', icon: Package },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon size={12} className="text-gray-400" />
                  <p className="text-[10px] text-gray-500 uppercase font-medium">{item.label}</p>
                </div>
                {item.badge ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${actionCfg.color}`}>
                    {actionCfg.emoji} {item.value}
                  </span>
                ) : (
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Diff View for Edit */}
          {audit.action === 'Edit' && changedKeys.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-sm text-blue-800 mb-3">🔄 รายการที่เปลี่ยนแปลง ({changedKeys.length})</h3>
              <div className="bg-white rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">ฟิลด์</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-red-500 uppercase">ค่าเดิม</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-green-500 uppercase">ค่าใหม่</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {changedKeys.map(key => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-medium text-gray-600">{getLabel(key)}</td>
                        <td className="px-3 py-2 text-xs text-red-600 bg-red-50/50">{formatValue(key, oldValue?.[key])}</td>
                        <td className="px-3 py-2 text-xs text-green-600 bg-green-50/50">{formatValue(key, newValue?.[key])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data tables for non-Edit */}
          {audit.action !== 'Edit' && (
            <>
              {oldValue && <DataSection title="📋 ค่าเดิม" data={oldValue} color="red" getLabel={getLabel} formatValue={formatValue} />}
              {newValue && <DataSection title="📝 ค่าใหม่" data={newValue} color="green" getLabel={getLabel} formatValue={formatValue} />}
            </>
          )}

          {audit.action === 'Edit' && changedKeys.length === 0 && oldValue && newValue && (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">ไม่มีการเปลี่ยนแปลง</div>
          )}

          {!oldValue && !newValue && (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">ไม่มีรายละเอียดเพิ่มเติม</div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition font-medium text-sm">ปิด</button>
        </div>
      </div>
    </div>
  );
}

function DataSection({ title, data, color, getLabel, formatValue }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4`}>
      <h3 className={`font-semibold text-sm text-${color}-800 mb-3`}>{title}</h3>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            {Object.entries(data).map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-medium text-gray-600 w-1/3 bg-gray-50">{getLabel(key)}</td>
                <td className="px-3 py-2 text-xs text-gray-800">{formatValue(key, value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}