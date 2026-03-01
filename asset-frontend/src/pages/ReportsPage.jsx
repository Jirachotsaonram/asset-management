import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText, Download, Calendar, Filter, TrendingUp, Package,
  CheckCircle, AlertTriangle, Clock, Building, MapPin, BarChart3,
  PieChart as PieChartIcon, RefreshCw, FileSpreadsheet, ChevronDown, ChevronUp,
  X, Search, ArrowLeft, Printer, Eye, RotateCcw, DollarSign, Hash,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ==================== Notifications Integration ====================
export const getReportNotifications = (stats) => {
  const notifications = [];
  if (stats.missing > 0) {
    notifications.push({
      id: 'missing-assets', type: 'error',
      title: `มี ${stats.missing} รายการไม่พบ`,
      message: 'ครุภัณฑ์ที่ต้องตรวจสอบ', link: '/reports', read: false
    });
  }
  if (stats.maintenance > 0) {
    notifications.push({
      id: 'maintenance-assets', type: 'warning',
      title: `มี ${stats.maintenance} รายการรอซ่อม`,
      message: 'ครุภัณฑ์ที่ต้องดำเนินการ', link: '/reports', read: false
    });
  }
  return notifications;
};

// ==================== Constants ====================
const STATUS_MAP = {
  all: { label: 'ทั้งหมด', thai: null },
  available: { label: 'ใช้งานได้', thai: 'ใช้งานได้' },
  maintenance: { label: 'รอซ่อม', thai: 'รอซ่อม' },
  pendingDisposal: { label: 'รอจำหน่าย', thai: 'รอจำหน่าย' },
  disposed: { label: 'จำหน่ายแล้ว', thai: 'จำหน่ายแล้ว' },
  missing: { label: 'ไม่พบ', thai: 'ไม่พบ' },
};

const CHART_COLORS = ['#22c55e', '#eab308', '#f97316', '#6b7280', '#ef4444'];

const REPORT_TYPES = [
  { key: 'asset-summary', title: 'รายงานสรุปครุภัณฑ์', desc: 'ข้อมูลครุภัณฑ์ทุกรายการพร้อมรายละเอียด', icon: FileText, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
  { key: 'check-report', title: 'รายงานการตรวจสอบ', desc: 'ประวัติการตรวจสอบครุภัณฑ์', icon: CheckCircle, color: 'green', gradient: 'from-green-500 to-green-600', hasDateFilter: true },
  { key: 'by-status', title: 'สรุปตามสถานะ', desc: 'จำนวนและมูลค่าแยกตามสถานะ', icon: PieChartIcon, color: 'purple', gradient: 'from-purple-500 to-purple-600' },
  { key: 'by-department', title: 'สรุปตามหน่วยงาน', desc: 'จำนวนครุภัณฑ์แยกตามหน่วยงาน', icon: Building, color: 'indigo', gradient: 'from-indigo-500 to-indigo-600' },
  { key: 'unchecked', title: 'ครุภัณฑ์ยังไม่ได้ตรวจ', desc: 'รายการที่ยังไม่ได้รับการตรวจสอบ', icon: AlertTriangle, color: 'red', gradient: 'from-red-500 to-red-600' },
  { key: 'movement-history', title: 'ประวัติการเคลื่อนย้าย', desc: 'บันทึกการย้ายครุภัณฑ์', icon: MapPin, color: 'orange', gradient: 'from-orange-500 to-orange-600', hasDateFilter: true },
  { key: 'borrow-report', title: 'รายงานการยืม', desc: 'สรุปข้อมูลการยืม-คืนครุภัณฑ์', icon: TrendingUp, color: 'teal', gradient: 'from-teal-500 to-teal-600' },
];

const REPORT_TABLE_CONFIG = {
  'asset-summary': {
    headers: ['รหัส', 'ชื่อครุภัณฑ์', 'Serial', 'จำนวน', 'ราคา (฿)', 'สถานะ', 'หน่วยงาน', 'สถานที่'],
    fields: ['asset_id', 'asset_name', 'serial_number', '_quantity', '_price', '_status', 'department_name', 'location'],
  },
  'check-report': {
    headers: ['วันที่ตรวจ', 'รหัส', 'ชื่อครุภัณฑ์', 'ผลการตรวจ', 'ผู้ตรวจ', 'หมายเหตุ'],
    fields: ['check_date', 'asset_id', 'asset_name', '_check_status', 'checker_name', 'remark'],
  },
  'by-status': {
    headers: ['สถานะ', 'จำนวน (รายการ)', 'มูลค่ารวม (฿)'],
    fields: ['_status', 'count', '_total_value'],
  },
  'by-department': {
    headers: ['หน่วยงาน', 'คณะ', 'จำนวน', 'มูลค่า (฿)', 'ใช้งานได้', 'รอซ่อม', 'ไม่พบ'],
    fields: ['department_name', 'faculty', 'asset_count', '_total_value', '_active', '_repair', '_missing'],
  },
  'unchecked': {
    headers: ['รหัส', 'ชื่อครุภัณฑ์', 'สถานะ', 'หน่วยงาน', 'สถานที่', 'วันที่ตรวจล่าสุด', 'ไม่ได้ตรวจมา'],
    fields: ['asset_id', 'asset_name', '_status', 'department_name', 'location', 'last_check_date', '_days'],
  },
  'movement-history': {
    headers: ['วันที่ย้าย', 'รหัส', 'ชื่อครุภัณฑ์', 'จาก', 'ไปยัง', 'ผู้ดำเนินการ', 'หมายเหตุ'],
    fields: ['move_date', 'asset_id', 'asset_name', 'old_location', 'new_location', 'moved_by_name', 'remark'],
  },
  'borrow-report': {
    headers: ['รหัส', 'ชื่อครุภัณฑ์', 'ผู้ยืม', 'วันที่ยืม', 'กำหนดคืน', 'วันที่คืน', 'สถานะ'],
    fields: ['asset_id', 'asset_name', 'borrower_name', 'borrow_date', 'expected_return_date', 'actual_return_date', '_borrow_status'],
  },
};

// ==================== Utility ====================
const getStatusColor = (status) => {
  const colors = {
    'ใช้งานได้': 'bg-green-100 text-green-700 border border-green-200',
    'รอซ่อม': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'รอจำหน่าย': 'bg-orange-100 text-orange-700 border border-orange-200',
    'จำหน่ายแล้ว': 'bg-gray-100 text-gray-600 border border-gray-200',
    'ไม่พบ': 'bg-red-100 text-red-700 border border-red-200',
    'พบ': 'bg-green-100 text-green-700 border border-green-200',
    'ไม่พบครุภัณฑ์': 'bg-red-100 text-red-700 border border-red-200',
    'ชำรุด': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  };
  return colors[status?.trim()] || 'bg-gray-100 text-gray-600 border border-gray-200';
};

const formatNumber = (val) => {
  const n = parseFloat(val || 0);
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// ==================== Cell renderer for table ====================
function renderCellValue(fieldKey, item) {
  switch (fieldKey) {
    case '_quantity': return `${item.quantity || 0} ${item.unit || ''}`;
    case '_price': return formatNumber(item.price);
    case '_total_value': return formatNumber(item.total_value);
    case '_status': return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(item.status)}`}>{item.status}</span>;
    case '_check_status': return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(item.check_status)}`}>{item.check_status || '-'}</span>;
    case '_borrow_status': {
      const s = item.actual_return_date ? 'คืนแล้ว' : 'ยังไม่คืน';
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.actual_return_date ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s}</span>;
    }
    case '_days': return item.days_since_check ? <span className="text-red-600 font-semibold">{item.days_since_check} วัน</span> : 'N/A';
    case '_active': return <span className="text-green-600 font-semibold">{item.active_count || 0}</span>;
    case '_repair': return <span className="text-yellow-600 font-semibold">{item.repair_count || 0}</span>;
    case '_missing': return <span className="text-red-600 font-semibold">{item.missing_count || 0}</span>;
    default: return item[fieldKey] || '-';
  }
}

// raw value for export
function rawCellValue(fieldKey, item) {
  switch (fieldKey) {
    case '_quantity': return `${item.quantity || 0} ${item.unit || ''}`;
    case '_price': return formatNumber(item.price);
    case '_total_value': return formatNumber(item.total_value);
    case '_status': return item.status || '-';
    case '_check_status': return item.check_status || '-';
    case '_borrow_status': return item.actual_return_date ? 'คืนแล้ว' : 'ยังไม่คืน';
    case '_days': return item.days_since_check ? `${item.days_since_check} วัน` : 'N/A';
    case '_active': return String(item.active_count || 0);
    case '_repair': return String(item.repair_count || 0);
    case '_missing': return String(item.missing_count || 0);
    default: return String(item[fieldKey] || '-');
  }
}

// ==================== MAIN COMPONENT ====================
export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, maintenance: 0, pendingDisposal: 0, disposed: 0, missing: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [statusAssets, setStatusAssets] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // ==================== fetch ====================
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (activeTab && !selectedReport) fetchAssetsByStatus(activeTab); }, [activeTab, selectedReport]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/by-status');
      const data = response.data.data;
      let total = 0, available = 0, maintenance = 0, pendingDisposal = 0, disposed = 0, missing = 0;
      data.forEach(item => {
        const c = parseInt(item.count || 0);
        total += c;
        if (item.status === 'ใช้งานได้') available = c;
        if (item.status === 'รอซ่อม') maintenance = c;
        if (item.status === 'รอจำหน่าย') pendingDisposal = c;
        if (item.status === 'จำหน่ายแล้ว') disposed = c;
        if (item.status === 'ไม่พบ') missing = c;
      });
      setStats({ total, available, maintenance, pendingDisposal, disposed, missing });
    } catch (error) {
      toast.error('ไม่สามารถโหลดสถิติได้');
    } finally { setLoading(false); }
  };

  const fetchAssetsByStatus = async (status) => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      let assets = response.data.data;
      // Handle paginated response
      if (assets && assets.items) assets = assets.items;
      if (!Array.isArray(assets)) assets = [];
      if (status !== 'all') {
        const targetStatus = STATUS_MAP[status]?.thai;
        if (targetStatus) assets = assets.filter(a => a.status === targetStatus);
      }
      setStatusAssets(assets);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้');
      setStatusAssets([]);
    } finally { setLoading(false); }
  };

  const generateReport = async (reportType) => {
    setLoading(true);
    setSelectedReport(reportType);
    setActiveTab('');
    setSearchTerm('');
    setCurrentPage(1);
    setSortKey(null);
    try {
      let endpoint = '';
      switch (reportType) {
        case 'asset-summary': endpoint = '/reports/asset-summary'; break;
        case 'check-report':
          endpoint = `/reports/check-report${dateRange.startDate ? `?start_date=${dateRange.startDate}` : ''}${dateRange.endDate ? `&end_date=${dateRange.endDate}` : ''}`;
          break;
        case 'by-status': endpoint = '/reports/by-status'; break;
        case 'by-department': endpoint = '/reports/by-department'; break;
        case 'unchecked': endpoint = '/reports/unchecked?days=365'; break;
        case 'movement-history':
          endpoint = `/reports/movement-history${dateRange.startDate ? `?start_date=${dateRange.startDate}` : ''}${dateRange.endDate ? `&end_date=${dateRange.endDate}` : ''}`;
          break;
        case 'borrow-report': endpoint = '/reports/borrow-report'; break;
        default: endpoint = '/reports/asset-summary';
      }
      const response = await api.get(endpoint);
      if (response.data.success && response.data.data) {
        setReportData(response.data.data);
        toast.success(`สร้างรายงานสำเร็จ (${response.data.data.length} รายการ)`);
      } else { setReportData([]); toast('ไม่มีข้อมูลในรายงานนี้', { icon: '📭' }); }
    } catch (error) {
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างรายงานได้');
      setReportData([]);
    } finally { setLoading(false); }
  };

  // ==================== Export functions ====================
  const doExportExcel = (data, headers, fields, filename) => {
    if (data.length === 0) { toast.error('ไม่มีข้อมูลให้ Export'); return; }
    try {
      let csv = '\uFEFF' + headers.join('\t') + '\n';
      data.forEach(item => { csv += fields.map(f => rawCellValue(f, item)).join('\t') + '\n'; });
      const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();
      toast.success('กำลังดาวน์โหลด Excel');
    } catch (e) { toast.error('ไม่สามารถ Export Excel ได้'); }
  };

  const handleExportStatusExcel = () => {
    const cfg = REPORT_TABLE_CONFIG['asset-summary'];
    doExportExcel(filteredStatusAssets, cfg.headers, cfg.fields, `report_${activeTab}`);
  };
  const handleExportReportExcel = () => {
    if (!selectedReport) return;
    const cfg = REPORT_TABLE_CONFIG[selectedReport];
    doExportExcel(filteredReportData, cfg.headers, cfg.fields, `report_${selectedReport}`);
  };

  // ==================== Search/Sort/Paginate ====================
  const filterData = useCallback((data) => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      Object.values(item).some(v => v && String(v).toLowerCase().includes(term))
    );
  }, [searchTerm]);

  const sortData = useCallback((data) => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va == null) va = '';
      if (vb == null) vb = '';
      const na = parseFloat(va), nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) return sortOrder === 'asc' ? na - nb : nb - na;
      return sortOrder === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [sortKey, sortOrder]);

  const filteredStatusAssets = useMemo(() => sortData(filterData(statusAssets)), [statusAssets, filterData, sortData]);
  const filteredReportData = useMemo(() => sortData(filterData(reportData)), [reportData, filterData, sortData]);

  const paginatedStatusAssets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStatusAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStatusAssets, currentPage]);

  const paginatedReportData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReportData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReportData, currentPage]);

  const statusTotalPages = Math.ceil(filteredStatusAssets.length / ITEMS_PER_PAGE);
  const reportTotalPages = Math.ceil(filteredReportData.length / ITEMS_PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
    setCurrentPage(1);
  };

  // ==================== Chart data ====================
  const chartData = useMemo(() => [
    { name: 'ใช้งานได้', value: stats.available, color: '#22c55e' },
    { name: 'รอซ่อม', value: stats.maintenance, color: '#eab308' },
    { name: 'รอจำหน่าย', value: stats.pendingDisposal, color: '#f97316' },
    { name: 'จำหน่ายแล้ว', value: stats.disposed, color: '#6b7280' },
    { name: 'ไม่พบ', value: stats.missing, color: '#ef4444' },
  ].filter(d => d.value > 0), [stats]);

  // ==================== Stat cards config ====================
  const statCards = [
    { key: 'all', label: 'ทั้งหมด', value: stats.total, icon: Package, gradient: 'from-blue-500 to-blue-600', ring: 'ring-blue-300', light: 'text-blue-100' },
    { key: 'available', label: 'ใช้งานได้', value: stats.available, icon: CheckCircle, gradient: 'from-green-500 to-green-600', ring: 'ring-green-300', light: 'text-green-100' },
    { key: 'maintenance', label: 'รอซ่อม', value: stats.maintenance, icon: Clock, gradient: 'from-yellow-500 to-yellow-600', ring: 'ring-yellow-300', light: 'text-yellow-100' },
    { key: 'pendingDisposal', label: 'รอจำหน่าย', value: stats.pendingDisposal, icon: AlertTriangle, gradient: 'from-orange-500 to-orange-600', ring: 'ring-orange-300', light: 'text-orange-100' },
    { key: 'disposed', label: 'จำนวนแล้ว', value: stats.disposed, icon: Package, gradient: 'from-gray-500 to-gray-600', ring: 'ring-gray-300', light: 'text-gray-100' },
    { key: 'missing', label: 'ไม่พบ', value: stats.missing, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', ring: 'ring-red-300', light: 'text-red-100' },
  ];

  // Total price for status view
  const totalValue = useMemo(() => filteredStatusAssets.reduce((s, a) => s + parseFloat(a.price || 0), 0), [filteredStatusAssets]);

  // ==================== Loading state ====================
  if (loading && !selectedReport && statusAssets.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูลรายงาน...</p>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-sm text-gray-500 mt-0.5">สรุปและวิเคราะห์ข้อมูลครุภัณฑ์</p>
        </div>
        <div className="flex gap-2">
          {selectedReport && (
            <button onClick={() => { setSelectedReport(null); setReportData([]); setActiveTab('all'); setSearchTerm(''); setCurrentPage(1); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm">
              <ArrowLeft size={16} /> กลับ
            </button>
          )}
          <button onClick={() => { fetchStats(); if (activeTab && !selectedReport) fetchAssetsByStatus(activeTab); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm">
            <RefreshCw size={16} /> รีเฟรช
          </button>
        </div>
      </div>

      {/* ==================== Overview Section ==================== */}
      {!selectedReport && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map(card => {
              const Icon = card.icon;
              const isActive = activeTab === card.key;
              return (
                <div key={card.key}
                  onClick={() => { setActiveTab(card.key); setSelectedReport(null); setSearchTerm(''); setCurrentPage(1); }}
                  className={`bg-gradient-to-br ${card.gradient} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all duration-200 hover:scale-105 ${isActive ? `ring-4 ${card.ring} scale-105` : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${card.light} text-xs mb-0.5`}>{card.label}</p>
                      <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg"><Icon size={18} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <PieChartIcon size={16} className="text-purple-600" /> สัดส่วนตามสถานะ
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={11}>
                      {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val) => `${val.toLocaleString()} รายการ`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-600" /> จำนวนครุภัณฑ์ตามสถานะ
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => `${val.toLocaleString()} รายการ`} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Status Assets Table */}
          {activeTab && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{STATUS_MAP[activeTab]?.label || 'ทั้งหมด'}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {filteredStatusAssets.length.toLocaleString()} รายการ
                      {totalValue > 0 && <> | มูลค่ารวม <span className="font-semibold text-blue-600">{formatNumber(totalValue)} ฿</span></>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="ค้นหา..." className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <button onClick={handleExportStatusExcel} disabled={filteredStatusAssets.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50">
                      <FileSpreadsheet size={14} /> Excel
                    </button>
                  </div>
                </div>
              </div>
              {renderDataTable(
                REPORT_TABLE_CONFIG['asset-summary'],
                paginatedStatusAssets,
                loading,
                currentPage, statusTotalPages, setCurrentPage,
                sortKey, sortOrder, handleSort,
                filteredStatusAssets.length
              )}
            </div>
          )}

          {/* Report Cards */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">สร้างรายงาน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {REPORT_TYPES.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.key} onClick={() => generateReport(r.key)}
                    className={`bg-gradient-to-br ${r.gradient} rounded-2xl shadow-lg p-5 text-white cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl group`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition">
                        <Icon size={22} />
                      </div>
                      <Download size={18} className="opacity-60 group-hover:opacity-100 transition" />
                    </div>
                    <h3 className="font-bold mb-1">{r.title}</h3>
                    <p className="text-xs opacity-80">{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ==================== Report Detail View ==================== */}
      {selectedReport && (
        <>
          {/* Date Filter (for certain reports) */}
          {REPORT_TYPES.find(r => r.key === selectedReport)?.hasDateFilter && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" /> กรองตามวันที่
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">วันที่เริ่มต้น</label>
                  <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(d => ({ ...d, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">วันที่สิ้นสุด</label>
                  <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(d => ({ ...d, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={() => generateReport(selectedReport)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                  <Filter size={14} /> กรองข้อมูล
                </button>
              </div>
            </div>
          )}

          {/* Report Data Table */}
          {REPORT_TABLE_CONFIG[selectedReport] && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {REPORT_TYPES.find(r => r.key === selectedReport)?.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">{filteredReportData.length.toLocaleString()} รายการ</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="ค้นหา..." className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <button onClick={handleExportReportExcel} disabled={filteredReportData.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50">
                      <FileSpreadsheet size={14} /> Excel
                    </button>
                  </div>
                </div>
              </div>
              {renderDataTable(
                REPORT_TABLE_CONFIG[selectedReport],
                paginatedReportData,
                loading,
                currentPage, reportTotalPages, setCurrentPage,
                sortKey, sortOrder, handleSort,
                filteredReportData.length
              )}
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== Reusable Table Renderer ====================
function renderDataTable(config, data, loading, currentPage, totalPages, setPage, sortKey, sortOrder, onSort, totalFiltered) {
  const { headers, fields } = config;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package size={40} className="text-gray-300 mb-3" />
        <p className="text-gray-500">ไม่มีข้อมูลในรายงานนี้</p>
      </div>
    );
  }

  // Extract sortable field key from special fields
  const getSortableField = (fieldKey) => {
    if (fieldKey.startsWith('_')) return null; // don't sort computed fields
    return fieldKey;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-10">#</th>
              {headers.map((header, i) => {
                const sortable = getSortableField(fields[i]);
                return (
                  <th key={i}
                    onClick={sortable ? () => onSort(sortable) : undefined}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${sortable ? 'cursor-pointer hover:text-gray-900 select-none' : ''}`}>
                    <div className="flex items-center gap-1">
                      {header}
                      {sortable && sortKey === sortable && (
                        sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, idx) => (
              <tr key={item.asset_id || item.check_id || item.borrow_id || idx}
                className="hover:bg-blue-50/40 transition-colors">
                <td className="px-3 py-3 text-xs text-gray-400">{(currentPage - 1) * 50 + idx + 1}</td>
                {fields.map((fieldKey, fi) => (
                  <td key={fi} className="px-4 py-3 text-sm text-gray-700 max-w-[250px] truncate">
                    {renderCellValue(fieldKey, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            แสดง {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, totalFiltered)} จาก {totalFiltered} รายการ
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-200 text-gray-600'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}