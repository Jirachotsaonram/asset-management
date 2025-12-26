// FILE: asset-frontend/src/pages/AuditTrailPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Search, 
  Download, 
  Filter,
  X,
  Eye,
  Calendar,
  User,
  Package,
  Activity
} from 'lucide-react';

export default function AuditTrailPage() {
  const [audits, setAudits] = useState([]);
  const [filteredAudits, setFilteredAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States สำหรับ Filter
  const [filters, setFilters] = useState({
    action: 'all',
    user_id: 'all',
    asset_id: '',
    start_date: '',
    end_date: '',
    keyword: ''
  });

  // States สำหรับ Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);

  // States สำหรับ Dropdown
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchAssets();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audits');
      setAudits(response.data.data || []);
      setFilteredAudits(response.data.data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  // ฟังก์ชันกรองข้อมูล
  const handleFilter = () => {
    let filtered = [...audits];

    // กรองตาม Action
    if (filters.action !== 'all') {
      filtered = filtered.filter(a => a.action === filters.action);
    }

    // กรองตามผู้ใช้
    if (filters.user_id !== 'all') {
      filtered = filtered.filter(a => a.user_id == filters.user_id);
    }

    // กรองตามครุภัณฑ์
    if (filters.asset_id) {
      filtered = filtered.filter(a => a.asset_id == filters.asset_id);
    }

    // กรองตามวันที่
    if (filters.start_date) {
      filtered = filtered.filter(a => {
        const auditDate = new Date(a.action_date);
        return auditDate >= new Date(filters.start_date);
      });
    }

    if (filters.end_date) {
      filtered = filtered.filter(a => {
        const auditDate = new Date(a.action_date);
        return auditDate <= new Date(filters.end_date);
      });
    }

    // ค้นหาแบบ Keyword
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(a => 
        a.fullname?.toLowerCase().includes(keyword) ||
        a.asset_name?.toLowerCase().includes(keyword) ||
        a.action?.toLowerCase().includes(keyword)
      );
    }

    setFilteredAudits(filtered);
  };

  // Reset Filter
  const handleResetFilter = () => {
    setFilters({
      action: 'all',
      user_id: 'all',
      asset_id: '',
      start_date: '',
      end_date: '',
      keyword: ''
    });
    setFilteredAudits(audits);
  };

  // Export CSV
  const handleExportCSV = () => {
    const queryParams = new URLSearchParams();
    if (filters.action !== 'all') queryParams.append('action', filters.action);
    if (filters.user_id !== 'all') queryParams.append('user_id', filters.user_id);
    if (filters.asset_id) queryParams.append('asset_id', filters.asset_id);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.keyword) queryParams.append('keyword', filters.keyword);
    queryParams.append('format', 'csv');

    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL}/audits/export?${queryParams.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('กำลังดาวน์โหลด CSV');
  };

  // Export Excel
  const handleExportExcel = () => {
    const queryParams = new URLSearchParams();
    if (filters.action !== 'all') queryParams.append('action', filters.action);
    if (filters.user_id !== 'all') queryParams.append('user_id', filters.user_id);
    if (filters.asset_id) queryParams.append('asset_id', filters.asset_id);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.keyword) queryParams.append('keyword', filters.keyword);
    queryParams.append('format', 'excel');

    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL}/audits/export?${queryParams.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('กำลังดาวน์โหลด Excel');
  };

  // เปิด Modal รายละเอียด
  const handleViewDetail = (audit) => {
    setSelectedAudit(audit);
    setShowDetailModal(true);
  };

  // สีตาม Action
  const getActionColor = (action) => {
    const colors = {
      'Add': 'bg-green-100 text-green-800 border-green-300',
      'Edit': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Delete': 'bg-red-100 text-red-800 border-red-300',
      'Move': 'bg-blue-100 text-blue-800 border-blue-300',
      'Check': 'bg-purple-100 text-purple-800 border-purple-300',
      'Borrow': 'bg-orange-100 text-orange-800 border-orange-300',
      'Return': 'bg-teal-100 text-teal-800 border-teal-300'
    };
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // ไอคอนตาม Action
  const getActionIcon = (action) => {
    const icons = {
      'Add': '➕',
      'Edit': '✏️',
      'Delete': '🗑️',
      'Move': '🚚',
      'Check': '✅',
      'Borrow': '📤',
      'Return': '📥'
    };
    return icons[action] || '📝';
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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={36} />
            Audit Trail
          </h1>
          <p className="text-gray-600 mt-1">ประวัติการทำงานทั้งหมดในระบบ</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Filter size={24} />
          ตัวกรอง
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Keyword Search */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline mr-1" size={16} />
              ค้นหา (ผู้ใช้, ครุภัณฑ์, Action)
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
              placeholder="พิมพ์เพื่อค้นหา..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Activity className="inline mr-1" size={16} />
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({...filters, action: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="Add">Add (เพิ่ม)</option>
              <option value="Edit">Edit (แก้ไข)</option>
              <option value="Delete">Delete (ลบ)</option>
              <option value="Move">Move (ย้าย)</option>
              <option value="Check">Check (ตรวจสอบ)</option>
              <option value="Borrow">Borrow (ยืม)</option>
              <option value="Return">Return (คืน)</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline mr-1" size={16} />
              ผู้ใช้งาน
            </label>
            <select
              value={filters.user_id}
              onChange={(e) => setFilters({...filters, user_id: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              {users.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.fullname}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="inline mr-1" size={16} />
              ครุภัณฑ์
            </label>
            <select
              value={filters.asset_id}
              onChange={(e) => setFilters({...filters, asset_id: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">ทั้งหมด</option>
              {assets.slice(0, 100).map(asset => (
                <option key={asset.asset_id} value={asset.asset_id}>
                  {asset.asset_id} - {asset.asset_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFilter}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-semibold"
          >
            ใช้ตัวกรอง
          </button>
          <button
            onClick={handleResetFilter}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition font-semibold"
          >
            รีเซ็ต
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📊 แสดง <strong>{filteredAudits.length}</strong> รายการจากทั้งหมด <strong>{audits.length}</strong> รายการ
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">วันที่-เวลา</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ผู้ใช้งาน</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ครุภัณฑ์</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAudits.map((audit) => (
                <tr key={audit.audit_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(audit.action_date).toLocaleString('th-TH')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {audit.fullname || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(audit.action)}`}>
                      <span>{getActionIcon(audit.action)}</span>
                      {audit.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {audit.asset_name ? (
                      <>
                        <div className="font-semibold">{audit.asset_name}</div>
                        <div className="text-xs text-gray-500">ID: {audit.asset_id}</div>
                      </>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetail(audit)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                    >
                      <Eye size={16} />
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAudits.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ไม่พบข้อมูล Audit Trail</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAudit && (
        <DetailModal
          audit={selectedAudit}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}

// ==================== Detail Modal Component ====================
function DetailModal({ audit, onClose }) {
  const parseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const oldValue = parseJSON(audit.old_value);
  const newValue = parseJSON(audit.new_value);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">รายละเอียด Audit Trail</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ข้อมูลพื้นฐาน */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">ข้อมูลการทำงาน</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">วันที่-เวลา</p>
                <p className="font-semibold">{new Date(audit.action_date).toLocaleString('th-TH')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ผู้ใช้งาน</p>
                <p className="font-semibold">{audit.fullname || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Action</p>
                <p className="font-semibold">{audit.action}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ครุภัณฑ์</p>
                <p className="font-semibold">{audit.asset_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* ค่าเดิม (Old Value) */}
          {oldValue && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-red-800">📋 ค่าเดิม (Old Value)</h3>
              <div className="bg-white rounded p-3">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(oldValue, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* ค่าใหม่ (New Value) */}
          {newValue && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-green-800">📝 ค่าใหม่ (New Value)</h3>
              <div className="bg-white rounded p-3">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(newValue, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* ถ้าไม่มีข้อมูล */}
          {!oldValue && !newValue && (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              <p>ไม่มีรายละเอียดเพิ่มเติม</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-semibold"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}