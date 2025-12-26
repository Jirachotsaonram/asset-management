// FILE: src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Download,
  FileText,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  Eye,
  User,
  Calendar,
  ClipboardCheck,
  Bell,
  AlertCircle,
  Wrench,
  XCircle,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function StatsCard({ title, value, icon: Icon, color, bgColor, subtitle }) {
  const IconComponent = Icon;
  return (
    <div className={`${bgColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-4xl font-bold ${color} mt-2`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${color} opacity-20`}>
          <IconComponent className="w-20 h-20" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    checked: 0,
    unchecked: 0,
    available: 0,
    maintenance: 0,
    pendingDisposal: 0,
    disposed: 0,
    missing: 0
  });
  const [statusData, setStatusData] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [overdueAssets, setOverdueAssets] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [assetsRes, statusRes, uncheckedRes, auditsRes, notificationsRes, overdueRes] = await Promise.all([
        api.get('/assets'),
        api.get('/reports/by-status'),
        api.get('/reports/unchecked?days=365'),
        api.get('/audits'),
        api.get('/check-schedules/notifications?days=30').catch(() => ({ data: { data: [] } })),
        api.get('/check-schedules/overdue').catch(() => ({ data: { data: [] } }))
      ]);

      const assets = assetsRes.data.data || [];
      const statusReport = statusRes.data.data || [];
      const uncheckedAssets = uncheckedRes.data.data || [];
      const audits = auditsRes.data.data || [];
      const notificationsData = notificationsRes.data.data || [];
      const overdueData = overdueRes.data.data || [];

      // Calculate stats
      const total = assets.length;
      const checked = total - uncheckedAssets.length;
      const unchecked = uncheckedAssets.length;

      // Calculate status breakdown
      const statusCounts = {
        'ใช้งานได้': 0,
        'รอซ่อม': 0,
        'รอจำหน่าย': 0,
        'จำหน่ายแล้ว': 0,
        'ไม่พบ': 0
      };

      statusReport.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(statusCounts, item.status)) {
          statusCounts[item.status] = parseInt(item.count || 0);
        }
      });

      // Prepare chart data
      const chartData = [
        { name: 'ใช้งานได้', value: statusCounts['ใช้งานได้'], color: '#10b981' },
        { name: 'รอซ่อม', value: statusCounts['รอซ่อม'], color: '#f59e0b' },
        { name: 'รอจำหน่าย', value: statusCounts['รอจำหน่าย'], color: '#f97316' },
        { name: 'จำหน่ายแล้ว', value: statusCounts['จำหน่ายแล้ว'], color: '#6b7280' },
        { name: 'ไม่พบ', value: statusCounts['ไม่พบ'], color: '#ef4444' }
      ].filter(item => item.value > 0);

      setStats({
        total,
        checked,
        unchecked,
        available: statusCounts['ใช้งานได้'],
        maintenance: statusCounts['รอซ่อม'],
        pendingDisposal: statusCounts['รอจำหน่าย'],
        disposed: statusCounts['จำหน่ายแล้ว'],
        missing: statusCounts['ไม่พบ']
      });

      setStatusData(chartData);
      setAuditTrail(audits.slice(0, 10)); // Show latest 10
      setNotifications(notificationsData);
      setOverdueAssets(overdueData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('ไม่สามารถโหลดข้อมูล Dashboard ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = () => {
    navigate('/assets');
    // The AssetsPage will need to handle opening the form
    // For now, just navigate to assets page
  };

  const handleCheck = () => {
    navigate('/check');
  };

  const handleExportExcel = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('type', 'asset-summary');
      queryParams.append('format', 'excel');

      const token = localStorage.getItem('token');
      const url = `${api.defaults.baseURL}/reports/export?${queryParams.toString()}`;
      
      // ใช้ fetch เพื่อส่ง Authorization header
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาดในการดาวน์โหลด' }));
        throw new Error(errorData.message || 'ไม่สามารถ Export Excel ได้');
      }

      // สร้าง blob จาก response
      const blob = await response.blob();
      
      // สร้าง URL จาก blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // สร้าง link element เพื่อ download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `report_asset-summary_${new Date().toISOString().split('T')[0]}.xls`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('กำลังดาวน์โหลด Excel');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error(error.message || 'ไม่สามารถ Export Excel ได้');
    }
  };

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

  const checkedPercentage = stats.total > 0 ? ((stats.checked / stats.total) * 100).toFixed(1) : 0;
  const uncheckedPercentage = stats.total > 0 ? ((stats.unchecked / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมระบบจัดการครุภัณฑ์</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAddAsset}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span>เพิ่มครุภัณฑ์</span>
          </button>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="relative flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Bell size={18} />
            <span>การแจ้งเตือน</span>
            {(overdueAssets.length > 0 || 
              notifications.filter(n => n.urgency_level === 'เร่งด่วน' || n.urgency_level === 'วันนี้').length > 0 || 
              stats.unchecked > 0 || 
              stats.missing > 0 || 
              stats.maintenance > 0) && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {overdueAssets.length + 
                 notifications.filter(n => n.urgency_level === 'เร่งด่วน' || n.urgency_level === 'วันนี้').length + 
                 (stats.unchecked > 0 ? 1 : 0) + 
                 (stats.missing > 0 ? 1 : 0) + 
                 (stats.maintenance > 0 ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={handleCheck}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <ClipboardCheck size={18} />
            <span>ตรวจสอบ</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-md hover:shadow-lg"
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - ตอบโจทย์ 2.2.2: ลดเวลาตรวจสอบ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="ครุภัณฑ์ทั้งหมด"
          value={stats.total}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="ตรวจสอบแล้ว"
          value={stats.checked}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
          subtitle={`${checkedPercentage}% ของทั้งหมด`}
        />
        <StatsCard
          title="ยังไม่ได้ตรวจ"
          value={stats.unchecked}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-50"
          subtitle={`${uncheckedPercentage}% ของทั้งหมด`}
        />
        <StatsCard
          title="ใช้งานได้"
          value={stats.available}
          icon={CheckCircle}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModal
          overdueAssets={overdueAssets}
          notifications={notifications}
          stats={stats}
          onClose={() => setShowNotificationModal(false)}
          onCheck={handleCheck}
        />
      )}

      {/* Charts and Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart - แสดงสัดส่วนสถานะครุภัณฑ์ */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <PieChartIcon className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">สัดส่วนสถานะครุภัณฑ์</h2>
                <p className="text-sm text-gray-600">การกระจายสถานะของครุภัณฑ์ทั้งหมด</p>
              </div>
            </div>
          </div>

          {statusData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
            </div>
          )}

          {/* Status Legend */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.value} รายการ</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail - ตอบโจทย์ 2.2.1: ความโปร่งใส */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Activity className="text-purple-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">ประวัติการดำเนินการ</h2>
                <p className="text-sm text-gray-600">กิจกรรมล่าสุด</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/audit-trail')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {auditTrail.length > 0 ? (
              auditTrail.map((audit) => (
                <div
                  key={audit.audit_id}
                  className="border-l-4 border-blue-400 bg-gray-50 rounded-r-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getActionIcon(audit.action)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getActionColor(audit.action)}`}>
                        {audit.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(audit.action_date).toLocaleDateString('th-TH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {audit.asset_name && (
                    <div className="flex items-center gap-2 mt-2">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-800">{audit.asset_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600">{audit.fullname || 'ไม่ระบุผู้ใช้'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">ยังไม่มีประวัติการดำเนินการ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">รอซ่อม</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.maintenance}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">รอจำหน่าย</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingDisposal}</p>
            </div>
            <FileText className="w-12 h-12 text-orange-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">จำหน่ายแล้ว</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{stats.disposed}</p>
            </div>
            <Package className="w-12 h-12 text-gray-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">ไม่พบ</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.missing}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-gray-800">สรุปข้อมูลการตรวจสอบ</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">อัตราการตรวจสอบ</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{checkedPercentage}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.checked} จาก {stats.total} รายการ
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">รอการตรวจสอบ</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.unchecked}</p>
            <p className="text-xs text-gray-500 mt-1">
              {uncheckedPercentage}% ของทั้งหมด
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">สถานะใช้งานได้</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.total > 0 ? ((stats.available / stats.total) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.available} รายการ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification Modal Component
function NotificationModal({ overdueAssets, notifications, stats, onClose, onCheck }) {
  const urgentNotifications = notifications.filter(n => n.urgency_level === 'เร่งด่วน' || n.urgency_level === 'วันนี้');
  const totalNotifications = overdueAssets.length + urgentNotifications.length + 
    (stats.unchecked > 0 ? 1 : 0) + (stats.missing > 0 ? 1 : 0) + (stats.maintenance > 0 ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <Bell className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">การแจ้งเตือน</h2>
                <p className="text-sm text-gray-600">รายการที่ต้องดูแล ({totalNotifications} รายการ)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCheck}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                <ClipboardCheck size={16} />
                <span>ไปตรวจสอบ</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition p-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* เลยกำหนดการตรวจสอบ */}
          {overdueAssets.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-red-600" size={20} />
                <h3 className="font-bold text-red-800">เลยกำหนดการตรวจสอบ ({overdueAssets.length} รายการ)</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {overdueAssets.map((asset) => (
                  <div key={asset.asset_id} className="bg-white rounded p-3 border border-red-200 hover:border-red-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{asset.asset_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>ID: {asset.asset_id}</span>
                          {asset.building_name && (
                            <span>{asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-bold text-sm">
                          เลย {asset.days_overdue} วัน
                        </p>
                        <p className="text-xs text-gray-500">
                          กำหนด: {new Date(asset.next_check_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ใกล้กำหนดการตรวจสอบ */}
          {urgentNotifications.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-yellow-600" size={20} />
                <h3 className="font-bold text-yellow-800">
                  ใกล้กำหนดการตรวจสอบ ({urgentNotifications.length} รายการ)
                </h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {urgentNotifications.map((asset) => (
                  <div key={asset.asset_id} className="bg-white rounded p-3 border border-yellow-200 hover:border-yellow-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{asset.asset_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>ID: {asset.asset_id}</span>
                          {asset.building_name && (
                            <span>{asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-600 font-bold text-sm">
                          {asset.urgency_level === 'วันนี้' ? 'วันนี้' : `อีก ${asset.days_until_check} วัน`}
                        </p>
                        <p className="text-xs text-gray-500">
                          กำหนด: {new Date(asset.next_check_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ยังไม่ได้ตรวจสอบ */}
          {stats.unchecked > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="text-orange-600" size={20} />
                <h3 className="font-bold text-orange-800">ยังไม่ได้ตรวจสอบ ({stats.unchecked} รายการ)</h3>
              </div>
              <p className="text-sm text-orange-700">
                มีครุภัณฑ์ {stats.unchecked} รายการที่ยังไม่ได้รับการตรวจสอบในรอบปีที่ผ่านมา
              </p>
            </div>
          )}

          {/* ครุภัณฑ์สูญหาย */}
          {stats.missing > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="text-red-600" size={20} />
                <h3 className="font-bold text-red-800">ครุภัณฑ์สูญหาย ({stats.missing} รายการ)</h3>
              </div>
              <p className="text-sm text-red-700">
                มีครุภัณฑ์ {stats.missing} รายการที่มีสถานะ "ไม่พบ" ต้องตรวจสอบและดำเนินการ
              </p>
            </div>
          )}

          {/* ครุภัณฑ์รอซ่อม */}
          {stats.maintenance > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="text-amber-600" size={20} />
                <h3 className="font-bold text-amber-800">ครุภัณฑ์รอซ่อม ({stats.maintenance} รายการ)</h3>
              </div>
              <p className="text-sm text-amber-700">
                มีครุภัณฑ์ {stats.maintenance} รายการที่รอการซ่อมบำรุง ควรตรวจสอบและดำเนินการ
              </p>
            </div>
          )}

          {/* ไม่มีการแจ้งเตือน */}
          {totalNotifications === 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="text-green-600 mx-auto mb-3" size={48} />
              <p className="font-semibold text-green-800 text-lg">ไม่มีการแจ้งเตือน</p>
              <p className="text-sm text-green-700 mt-2">ทุกอย่างอยู่ในสถานะปกติ</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition font-semibold"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
