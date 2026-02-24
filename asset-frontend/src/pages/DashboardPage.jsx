// FILE: src/pages/DashboardPage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Package, AlertTriangle, CheckCircle, Clock, Plus, Download,
  FileText, Activity, PieChart as PieChartIcon, BarChart3, Eye,
  User, Calendar, ClipboardCheck, Bell, AlertCircle, Wrench,
  XCircle, X, RefreshCw, TrendingUp, MapPin, ArrowRight,
  ArrowUpRight, Layers, Search, ExternalLink
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

// ==================== Notifications Integration ====================
export const getDashboardNotifications = (stats) => {
  const notifications = [];
  if (stats.missing > 0) {
    notifications.push({
      id: 'missing-assets', type: 'error',
      title: `มี ${stats.missing} ครุภัณฑ์ไม่พบ`,
      message: 'ครุภัณฑ์ที่ต้องตรวจสอบ', link: '/assets', read: false
    });
  }
  if (stats.unchecked > 0) {
    notifications.push({
      id: 'unchecked-assets', type: 'warning',
      title: `มี ${stats.unchecked} รายการยังไม่ได้ตรวจ`,
      message: 'ครุภัณฑ์ที่ต้องตรวจสอบ', link: '/check', read: false
    });
  }
  return notifications;
};

// ==================== Constants ====================
const STATUS_CONFIG = [
  { key: 'available', label: 'ใช้งานได้', color: '#22c55e', bgClass: 'bg-green-500', textClass: 'text-green-600', lightClass: 'bg-green-50', icon: CheckCircle },
  { key: 'maintenance', label: 'รอซ่อม', color: '#eab308', bgClass: 'bg-yellow-500', textClass: 'text-yellow-600', lightClass: 'bg-yellow-50', icon: Wrench },
  { key: 'pendingDisposal', label: 'รอจำหน่าย', color: '#f97316', bgClass: 'bg-orange-500', textClass: 'text-orange-600', lightClass: 'bg-orange-50', icon: Clock },
  { key: 'disposed', label: 'จำหน่ายแล้ว', color: '#6b7280', bgClass: 'bg-gray-500', textClass: 'text-gray-500', lightClass: 'bg-gray-50', icon: Package },
  { key: 'missing', label: 'ไม่พบ', color: '#ef4444', bgClass: 'bg-red-500', textClass: 'text-red-600', lightClass: 'bg-red-50', icon: AlertTriangle },
];

const QUICK_ACTIONS = [
  { label: 'เพิ่มครุภัณฑ์', icon: Plus, path: '/assets', gradient: 'from-blue-500 to-blue-600' },
  { label: 'ตรวจสอบ', icon: ClipboardCheck, path: '/check', gradient: 'from-purple-500 to-purple-600' },
  { label: 'รายงาน', icon: FileText, path: '/reports', gradient: 'from-green-500 to-green-600' },
  { label: 'ย้ายครุภัณฑ์', icon: MapPin, path: '/history', gradient: 'from-orange-500 to-orange-600' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0, checked: 0, unchecked: 0, available: 0,
    maintenance: 0, pendingDisposal: 0, disposed: 0, missing: 0, totalValue: 0
  });
  const [statusData, setStatusData] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [overdueAssets, setOverdueAssets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [assetsRes, statusRes, uncheckedRes, auditsRes, notifsRes, overdueRes] = await Promise.all([
        api.get('/assets'),
        api.get('/reports/by-status'),
        api.get('/reports/unchecked?days=365'),
        api.get('/audits'),
        api.get('/check-schedules/notifications?days=30').catch(() => ({ data: { data: [] } })),
        api.get('/check-schedules/overdue').catch(() => ({ data: { data: [] } })),
      ]);

      let assets = assetsRes.data.data || [];
      if (assets && assets.items) assets = assets.items;
      if (!Array.isArray(assets)) assets = [];

      const statusReport = statusRes.data.data || [];
      const uncheckedData = uncheckedRes.data.data || { items: [], total: 0 };
      const uncheckedCount = typeof uncheckedData.total === 'number' ? uncheckedData.total : (Array.isArray(uncheckedData) ? uncheckedData.length : 0);

      const sc = { 'ใช้งานได้': 0, 'รอซ่อม': 0, 'รอจำหน่าย': 0, 'จำหน่ายแล้ว': 0, 'ไม่พบ': 0 };
      let tv = 0;
      statusReport.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(sc, item.status)) {
          sc[item.status] = parseInt(item.count || 0);
        }
        tv += parseFloat(item.total_value || 0);
      });

      const total = assets.length;
      const chartData = STATUS_CONFIG.map(c => ({
        name: c.label, value: sc[c.label] || 0, color: c.color,
      })).filter(d => d.value > 0);

      setStats({
        total,
        checked: total - uncheckedCount,
        unchecked: uncheckedCount,
        available: sc['ใช้งานได้'], maintenance: sc['รอซ่อม'],
        pendingDisposal: sc['รอจำหน่าย'], disposed: sc['จำหน่ายแล้ว'],
        missing: sc['ไม่พบ'], totalValue: tv,
      });
      setStatusData(chartData);
      setAuditTrail((auditsRes.data.data || []).slice(0, 8));
      setNotifications(notifsRes.data.data || []);
      setOverdueAssets(overdueRes.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูล Dashboard ได้');
    } finally { setLoading(false); }
  };

  const checkedPct = stats.total > 0 ? ((stats.checked / stats.total) * 100).toFixed(1) : 0;
  const availablePct = stats.total > 0 ? ((stats.available / stats.total) * 100).toFixed(1) : 0;

  const alertCount = useMemo(() => {
    const urgent = notifications.filter(n => n.urgency_level === 'เร่งด่วน' || n.urgency_level === 'วันนี้');
    return overdueAssets.length + urgent.length + (stats.unchecked > 0 ? 1 : 0) + (stats.missing > 0 ? 1 : 0) + (stats.maintenance > 0 ? 1 : 0);
  }, [notifications, overdueAssets, stats]);

  const getActionColor = (a) => ({
    'Add': 'bg-green-100 text-green-700', 'Edit': 'bg-yellow-100 text-yellow-700',
    'Delete': 'bg-red-100 text-red-700', 'Move': 'bg-blue-100 text-blue-700',
    'Check': 'bg-purple-100 text-purple-700', 'Borrow': 'bg-orange-100 text-orange-700',
    'Return': 'bg-teal-100 text-teal-700',
  })[a] || 'bg-gray-100 text-gray-600';

  const getActionIcon = (a) => ({
    'Add': '➕', 'Edit': '✏️', 'Delete': '🗑️', 'Move': '🚚',
    'Check': '✅', 'Borrow': '📤', 'Return': '📥',
  })[a] || '📝';

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'สวัสดีตอนเช้า';
    if (h < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  };

  // ==================== Loading ====================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* ==================== Welcome Header ==================== */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-blue-200 text-sm">{greetingTime()}</p>
            <h1 className="text-2xl font-bold mt-1">{user?.fullname || user?.username || 'Admin'}</h1>
            <p className="text-blue-200 text-sm mt-1">ภาพรวมระบบจัดการครุภัณฑ์</p>
          </div>
          <div className="flex gap-2">
            {/* Notification Bell */}
            <button onClick={() => setShowNotifModal(true)}
              className="relative bg-white/15 hover:bg-white/25 p-2.5 rounded-xl transition backdrop-blur-sm">
              <Bell size={20} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold animate-pulse">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
            <button onClick={fetchDashboardData}
              className="bg-white/15 hover:bg-white/25 p-2.5 rounded-xl transition backdrop-blur-sm">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Summary Stats in Header */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-200 text-xs">ครุภัณฑ์ทั้งหมด</p>
            <p className="text-2xl font-bold mt-0.5">{stats.total.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-200 text-xs">ใช้งานได้</p>
            <p className="text-2xl font-bold mt-0.5">{stats.available.toLocaleString()}</p>
            <p className="text-xs text-green-300">{availablePct}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-200 text-xs">ตรวจสอบแล้ว</p>
            <p className="text-2xl font-bold mt-0.5">{stats.checked.toLocaleString()}</p>
            <p className="text-xs text-green-300">{checkedPct}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <p className="text-blue-200 text-xs">มูลค่ารวม</p>
            <p className="text-xl font-bold mt-0.5">{stats.totalValue > 0 ? `${(stats.totalValue / 1e6).toFixed(1)}M` : '-'}</p>
            <p className="text-xs text-blue-200">บาท</p>
          </div>
        </div>
      </div>

      {/* ==================== Alert Banners ==================== */}
      {(stats.missing > 0 || stats.maintenance > 0 || overdueAssets.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stats.missing > 0 && (
            <div onClick={() => navigate('/assets')}
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition group">
              <div className="bg-red-100 p-2 rounded-lg"><AlertTriangle size={18} className="text-red-600" /></div>
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">ไม่พบ {stats.missing} รายการ</p>
                <p className="text-xs text-red-600">ต้องตรวจสอบด่วน</p>
              </div>
              <ArrowRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
          {stats.maintenance > 0 && (
            <div onClick={() => navigate('/assets')}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-yellow-100 transition group">
              <div className="bg-yellow-100 p-2 rounded-lg"><Wrench size={18} className="text-yellow-600" /></div>
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 text-sm">รอซ่อม {stats.maintenance} รายการ</p>
                <p className="text-xs text-yellow-600">ดำเนินการซ่อมบำรุง</p>
              </div>
              <ArrowRight size={16} className="text-yellow-400 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
          {overdueAssets.length > 0 && (
            <div onClick={() => navigate('/check')}
              className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-orange-100 transition group">
              <div className="bg-orange-100 p-2 rounded-lg"><Clock size={18} className="text-orange-600" /></div>
              <div className="flex-1">
                <p className="font-semibold text-orange-800 text-sm">เลยกำหนดตรวจ {overdueAssets.length} รายการ</p>
                <p className="text-xs text-orange-600">ไปจัดการ</p>
              </div>
              <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>
      )}

      {/* ==================== Quick Actions ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <button key={action.path} onClick={() => navigate(action.path)}
              className={`bg-gradient-to-br ${action.gradient} text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 flex items-center gap-3 group`}>
              <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition">
                <Icon size={20} />
              </div>
              <span className="font-semibold text-sm">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== Status Breakdown ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_CONFIG.map(s => {
          const Icon = s.icon;
          const value = stats[s.key] || 0;
          const pct = stats.total > 0 ? ((value / stats.total) * 100).toFixed(0) : 0;
          return (
            <div key={s.key} className={`${s.lightClass} rounded-xl p-4 border border-gray-100 hover:shadow-md transition cursor-pointer`}
              onClick={() => navigate('/reports')}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} className={s.textClass} />
                <span className="text-xs text-gray-400">{pct}%</span>
              </div>
              <p className={`text-2xl font-bold ${s.textClass}`}>{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              {/* Mini progress bar */}
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${s.bgClass} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min(100, Number(pct))}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== Charts + Audit Trail ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Area (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-600" /> สัดส่วนสถานะ
              </h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={10}>
                      {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val) => `${val.toLocaleString()} รายการ`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-gray-400">
                  <p className="text-sm">ไม่มีข้อมูล</p>
                </div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" /> จำนวนตามสถานะ
              </h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val) => `${val.toLocaleString()} รายการ`} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-gray-400">
                  <p className="text-sm">ไม่มีข้อมูล</p>
                </div>
              )}
            </div>
          </div>

          {/* Check Progress Card */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-blue-600" /> ความคืบหน้าการตรวจสอบ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">อัตราการตรวจสอบ</p>
                <div className="relative w-20 h-20 mx-auto my-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-blue-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="3"
                      strokeDasharray={`${checkedPct}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-blue-700">{checkedPct}%</span>
                </div>
                <p className="text-xs text-gray-500">{stats.checked} / {stats.total}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center justify-center">
                <CheckCircle size={28} className="text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-700">{stats.checked.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">ตรวจสอบแล้ว</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 flex flex-col items-center justify-center">
                <AlertTriangle size={28} className="text-red-500 mb-2" />
                <p className="text-2xl font-bold text-red-700">{(stats.unchecked || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">ยังไม่ได้ตรวจ</p>
                {stats.unchecked > 0 && (
                  <button onClick={() => navigate('/check')}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium">
                    ไปตรวจ <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Sidebar (1/3) */}
        <div className="bg-white rounded-xl shadow-md flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-lg"><Activity className="text-purple-600" size={16} /></div>
              <h3 className="text-sm font-bold text-gray-800">กิจกรรมล่าสุด</h3>
            </div>
            <button onClick={() => navigate('/audit-trail')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              ดูทั้งหมด <ExternalLink size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-gray-50">
            {auditTrail.length > 0 ? auditTrail.map((audit) => (
              <div key={audit.audit_id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0 mt-0.5">{getActionIcon(audit.action)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getActionColor(audit.action)}`}>
                        {audit.action}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(audit.action_date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {audit.asset_name && (
                      <p className="text-xs font-medium text-gray-800 truncate">{audit.asset_name}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <User size={10} /> {audit.fullname || 'ไม่ระบุ'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Activity size={32} className="mb-2" />
                <p className="text-sm">ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== Notification Modal ==================== */}
      {showNotifModal && (
        <NotificationModal
          overdueAssets={overdueAssets}
          notifications={notifications}
          stats={stats}
          onClose={() => setShowNotifModal(false)}
          onCheck={() => navigate('/check')}
        />
      )}
    </div>
  );
}

// ==================== Notification Modal ====================
function NotificationModal({ overdueAssets, notifications, stats, onClose, onCheck }) {
  const urgent = notifications.filter(n => n.urgency_level === 'เร่งด่วน' || n.urgency_level === 'วันนี้');
  const total = overdueAssets.length + urgent.length + (stats.unchecked > 0 ? 1 : 0) + (stats.missing > 0 ? 1 : 0) + (stats.maintenance > 0 ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-red-50 to-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2.5 rounded-xl"><Bell className="text-red-600" size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">การแจ้งเตือน</h2>
              <p className="text-xs text-gray-500">{total} รายการที่ต้องดูแล</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onCheck}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition text-xs font-medium">
              <ClipboardCheck size={14} /> ไปตรวจสอบ
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5"><X size={20} /></button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {overdueAssets.length > 0 && (
            <AlertSection title={`เลยกำหนดตรวจ (${overdueAssets.length})`} icon={AlertTriangle} color="red">
              {overdueAssets.map(a => (
                <div key={a.asset_id} className="bg-white rounded-lg p-3 border border-red-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.asset_name}</p>
                    <p className="text-xs text-gray-500">ID: {a.asset_id}{a.building_name && ` | ${a.building_name} ชั้น ${a.floor}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600">เลย {a.days_overdue} วัน</p>
                    <p className="text-[10px] text-gray-400">กำหนด: {new Date(a.next_check_date).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>
              ))}
            </AlertSection>
          )}
          {urgent.length > 0 && (
            <AlertSection title={`ใกล้กำหนดตรวจ (${urgent.length})`} icon={Clock} color="yellow">
              {urgent.map(a => (
                <div key={a.asset_id} className="bg-white rounded-lg p-3 border border-yellow-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.asset_name}</p>
                    <p className="text-xs text-gray-500">ID: {a.asset_id}</p>
                  </div>
                  <p className="text-xs font-bold text-yellow-600">
                    {a.urgency_level === 'วันนี้' ? 'วันนี้' : `อีก ${a.days_until_check} วัน`}
                  </p>
                </div>
              ))}
            </AlertSection>
          )}
          {stats.unchecked > 0 && (
            <SimpleAlert icon={AlertCircle} color="orange" title={`ยังไม่ได้ตรวจ ${stats.unchecked} รายการ`} desc="ในรอบปีที่ผ่านมา" />
          )}
          {stats.missing > 0 && (
            <SimpleAlert icon={XCircle} color="red" title={`ครุภัณฑ์สูญหาย ${stats.missing} รายการ`} desc="สถานะ 'ไม่พบ' ต้องดำเนินการ" />
          )}
          {stats.maintenance > 0 && (
            <SimpleAlert icon={Wrench} color="amber" title={`รอซ่อม ${stats.maintenance} รายการ`} desc="ควรดำเนินการซ่อมบำรุง" />
          )}
          {total === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="text-green-500 mx-auto mb-3" size={48} />
              <p className="font-semibold text-green-700">ไม่มีการแจ้งเตือน</p>
              <p className="text-sm text-gray-500 mt-1">ทุกอย่างอยู่ในสถานะปกติ</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition font-medium text-sm">ปิด</button>
        </div>
      </div>
    </div>
  );
}

function AlertSection({ title, icon: Icon, color, children }) {
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={`text-${color}-600`} />
        <h3 className={`font-bold text-sm text-${color}-800`}>{title}</h3>
      </div>
      <div className="space-y-2 max-h-52 overflow-y-auto">{children}</div>
    </div>
  );
}

function SimpleAlert({ icon: Icon, color, title, desc }) {
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4 flex items-center gap-3`}>
      <Icon size={18} className={`text-${color}-600`} />
      <div>
        <p className={`font-semibold text-sm text-${color}-800`}>{title}</p>
        <p className={`text-xs text-${color}-600`}>{desc}</p>
      </div>
    </div>
  );
}
