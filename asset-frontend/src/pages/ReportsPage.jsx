import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  MapPin,
  BarChart3,
  PieChart,
  RefreshCw,
  FileSpreadsheet,
  ChevronDown,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ==================== Notifications Integration ====================
export const getReportNotifications = (stats) => {
  const notifications = [];

  if (stats.missing > 0) {
    notifications.push({
      id: 'missing-assets',
      type: 'error',
      title: `มี ${stats.missing} รายการไม่พบ`,
      message: 'ครุภัณฑ์ที่ต้องตรวจสอบ',
      link: '/reports',
      read: false
    });
  }

  if (stats.maintenance > 0) {
    notifications.push({
      id: 'maintenance-assets',
      type: 'warning',
      title: `มี ${stats.maintenance} รายการรอซ่อม`,
      message: 'ครุภัณฑ์ที่ต้องดำเนินการ',
      link: '/reports',
      read: false
    });
  }

  return notifications;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    pendingDisposal: 0,
    disposed: 0,
    missing: 0
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'available', 'maintenance', 'pendingDisposal', 'disposed', 'missing'
  const [statusAssets, setStatusAssets] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab && !selectedReport) {
      fetchAssetsByStatus(activeTab);
    }
  }, [activeTab, selectedReport]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/by-status');
      const data = response.data.data;

      let total = 0;
      let available = 0;
      let maintenance = 0;
      let pendingDisposal = 0;
      let disposed = 0;
      let missing = 0;

      data.forEach(item => {
        total += parseInt(item.count || 0);
        if (item.status === 'ใช้งานได้') available = parseInt(item.count || 0);
        if (item.status === 'รอซ่อม') maintenance = parseInt(item.count || 0);
        if (item.status === 'รอจำหน่าย') pendingDisposal = parseInt(item.count || 0);
        if (item.status === 'จำหน่ายแล้ว') disposed = parseInt(item.count || 0);
        if (item.status === 'ไม่พบ') missing = parseInt(item.count || 0);
      });

      setStats({ total, available, maintenance, pendingDisposal, disposed, missing });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('ไม่สามารถโหลดสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetsByStatus = async (status) => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      let assets = response.data.data || [];

      // Filter by status
      if (status !== 'all') {
        const statusMap = {
          'available': 'ใช้งานได้',
          'maintenance': 'รอซ่อม',
          'pendingDisposal': 'รอจำหน่าย',
          'disposed': 'จำหน่ายแล้ว',
          'missing': 'ไม่พบ'
        };
        const targetStatus = statusMap[status];
        assets = assets.filter(asset => asset.status === targetStatus);
      }

      setStatusAssets(assets);
    } catch (error) {
      console.error('Error fetching assets by status:', error);
      toast.error('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้');
      setStatusAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setLoading(true);
    setSelectedReport(reportType);
    setActiveTab('');

    try {
      let endpoint = '';

      switch (reportType) {
        case 'asset-summary':
          endpoint = '/reports/asset-summary';
          break;
        case 'check-report':
          endpoint = `/reports/check-report${dateRange.startDate ? `?start_date=${dateRange.startDate}` : ''}${dateRange.endDate ? `&end_date=${dateRange.endDate}` : ''}`;
          break;
        case 'by-status':
          endpoint = '/reports/by-status';
          break;
        case 'by-department':
          endpoint = '/reports/by-department';
          break;
        case 'unchecked':
          endpoint = '/reports/unchecked?days=365';
          break;
        case 'movement-history':
          endpoint = `/reports/movement-history${dateRange.startDate ? `?start_date=${dateRange.startDate}` : ''}${dateRange.endDate ? `&end_date=${dateRange.endDate}` : ''}`;
          break;
        case 'borrow-report':
          endpoint = '/reports/borrow-report';
          break;
        default:
          endpoint = '/reports/asset-summary';
      }

      console.log('📊 Fetching report:', endpoint);
      const response = await api.get(endpoint);
      console.log('✅ Report data:', response.data);

      if (response.data.success && response.data.data) {
        setReportData(response.data.data);
        toast.success(`สร้างรายงานสำเร็จ (${response.data.data.length} รายการ)`);
      } else {
        setReportData([]);
        toast.warning('ไม่มีข้อมูลในรายงานนี้');
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างรายงานได้');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (reportData.length === 0) {
      toast.error('ไม่มีข้อมูลให้ Export');
      return;
    }

    try {
      // Export จากข้อมูลที่มีอยู่ (client-side)
      const headers = getTableHeaders(selectedReport);
      const rows = reportData.map(item => {
        if (selectedReport === 'asset-summary') {
          return [
            item.asset_id || '-',
            item.asset_name || '-',
            item.serial_number || '-',
            `${item.quantity || 0} ${item.unit || ''}`,
            parseFloat(item.price || 0).toLocaleString(),
            item.status || '-',
            item.department_name || '-',
            item.location || '-'
          ];
        } else if (selectedReport === 'check-report') {
          return [
            item.check_date || '-',
            item.asset_id || '-',
            item.asset_name || '-',
            item.check_status || '-',
            item.checker_name || '-',
            item.remark || '-'
          ];
        } else if (selectedReport === 'by-status') {
          return [
            item.status || '-',
            item.count || 0,
            parseFloat(item.total_value || 0).toLocaleString()
          ];
        } else if (selectedReport === 'by-department') {
          return [
            item.department_name || '-',
            item.faculty || '-',
            item.asset_count || 0,
            parseFloat(item.total_value || 0).toLocaleString(),
            item.active_count || 0,
            item.repair_count || 0,
            item.missing_count || 0
          ];
        } else if (selectedReport === 'unchecked') {
          return [
            item.asset_id || '-',
            item.asset_name || '-',
            item.status || '-',
            item.department_name || '-',
            item.location || '-',
            item.last_check_date || 'ไม่เคยตรวจ',
            item.days_since_check ? `${item.days_since_check} วัน` : 'N/A'
          ];
        } else if (selectedReport === 'movement-history') {
          return [
            item.move_date || '-',
            item.asset_id || '-',
            item.asset_name || '-',
            item.old_location || '-',
            item.new_location || '-',
            item.moved_by_name || '-',
            item.remark || '-'
          ];
        }
        return [];
      });

      // สร้าง CSV content
      let csvContent = '\uFEFF'; // BOM for UTF-8
      csvContent += headers.join('\t') + '\n';
      rows.forEach(row => {
        csvContent += row.join('\t') + '\n';
      });

      // สร้าง Blob และดาวน์โหลด
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `report_${selectedReport}_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('กำลังดาวน์โหลด Excel');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('ไม่สามารถ Export Excel ได้');
    }
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast.error('ไม่มีข้อมูลให้ Export');
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape for wider tables

      // Title
      doc.setFontSize(16);
      doc.text(getReportTitle(selectedReport), 14, 15);
      doc.setFontSize(10);
      doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 22);

      let tableData = { head: [], body: [] };

      // Table data based on report type
      if (selectedReport === 'asset-summary') {
        tableData = {
          head: [['รหัส', 'ชื่อครุภัณฑ์', 'Serial', 'จำนวน', 'ราคา', 'สถานะ', 'หน่วยงาน', 'สถานที่']],
          body: reportData.map(item => [
            String(item.asset_id || '-'),
            String(item.asset_name || '-'),
            String(item.serial_number || '-'),
            `${item.quantity || 0} ${item.unit || ''}`,
            parseFloat(item.price || 0).toLocaleString('th-TH'),
            String(item.status || '-'),
            String(item.department_name || '-'),
            String(item.location || '-')
          ])
        };
      } else if (selectedReport === 'check-report') {
        tableData = {
          head: [['วันที่ตรวจ', 'รหัส', 'ชื่อครุภัณฑ์', 'สถานะการตรวจ', 'ผู้ตรวจ', 'หมายเหตุ']],
          body: reportData.map(item => [
            String(item.check_date || '-'),
            String(item.asset_id || '-'),
            String(item.asset_name || '-'),
            String(item.check_status || '-'),
            String(item.checker_name || '-'),
            String(item.remark || '-')
          ])
        };
      } else if (selectedReport === 'by-status') {
        tableData = {
          head: [['สถานะ', 'จำนวน', 'มูลค่ารวม (บาท)']],
          body: reportData.map(item => [
            String(item.status || '-'),
            String(item.count || 0),
            parseFloat(item.total_value || 0).toLocaleString('th-TH')
          ])
        };
      } else if (selectedReport === 'by-department') {
        tableData = {
          head: [['หน่วยงาน', 'คณะ', 'จำนวน', 'มูลค่า', 'ใช้งานได้', 'รอซ่อม', 'ไม่พบ']],
          body: reportData.map(item => [
            String(item.department_name || '-'),
            String(item.faculty || '-'),
            String(item.asset_count || 0),
            parseFloat(item.total_value || 0).toLocaleString('th-TH'),
            String(item.active_count || 0),
            String(item.repair_count || 0),
            String(item.missing_count || 0)
          ])
        };
      } else if (selectedReport === 'unchecked') {
        tableData = {
          head: [['รหัส', 'ชื่อครุภัณฑ์', 'สถานะ', 'หน่วยงาน', 'สถานที่', 'วันที่ตรวจล่าสุด', 'ไม่ได้ตรวจมา']],
          body: reportData.map(item => [
            String(item.asset_id || '-'),
            String(item.asset_name || '-'),
            String(item.status || '-'),
            String(item.department_name || '-'),
            String(item.location || '-'),
            String(item.last_check_date || 'ไม่เคยตรวจ'),
            String(item.days_since_check ? `${item.days_since_check} วัน` : 'N/A')
          ])
        };
      } else if (selectedReport === 'movement-history') {
        tableData = {
          head: [['วันที่ย้าย', 'รหัส', 'ชื่อครุภัณฑ์', 'จาก', 'ไปยัง', 'ผู้ดำเนินการ', 'หมายเหตุ']],
          body: reportData.map(item => [
            String(item.move_date || '-'),
            String(item.asset_id || '-'),
            String(item.asset_name || '-'),
            String(item.old_location || '-'),
            String(item.new_location || '-'),
            String(item.moved_by_name || '-'),
            String(item.remark || '-')
          ])
        };
      }

      // Generate table
      doc.autoTable({
        startY: 28,
        head: tableData.head,
        body: tableData.body,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 28, left: 10, right: 10 }
      });

      doc.save(`report_${selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF สำเร็จ');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('ไม่สามารถ Export PDF ได้');
    }
  };

  const exportStatusAssetsToExcel = async () => {
    if (statusAssets.length === 0) {
      toast.error('ไม่มีข้อมูลให้ Export');
      return;
    }

    try {
      // Export จากข้อมูลที่มีอยู่ (client-side)
      const headers = ['รหัส', 'ชื่อครุภัณฑ์', 'Serial', 'จำนวน', 'ราคา', 'สถานะ', 'หน่วยงาน', 'สถานที่'];
      const rows = statusAssets.map(item => [
        item.asset_id || '-',
        item.asset_name || '-',
        item.serial_number || '-',
        `${item.quantity || 0} ${item.unit || ''}`,
        parseFloat(item.price || 0).toLocaleString(),
        item.status || '-',
        item.department_name || item.department || '-',
        item.building_name
          ? `${item.building_name}${item.floor ? ` ชั้น ${item.floor}` : ''}${item.room_number ? ` ห้อง ${item.room_number}` : ''}`
          : '-'
      ]);

      // สร้าง CSV content
      let csvContent = '\uFEFF'; // BOM for UTF-8
      csvContent += headers.join('\t') + '\n';
      rows.forEach(row => {
        csvContent += row.join('\t') + '\n';
      });

      // สร้าง Blob และดาวน์โหลด
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `report_${activeTab}_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('กำลังดาวน์โหลด Excel');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('ไม่สามารถ Export Excel ได้');
    }
  };

  const exportStatusAssetsToPDF = () => {
    if (statusAssets.length === 0) {
      toast.error('ไม่มีข้อมูลให้ Export');
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation for wider table

      // Title
      doc.setFontSize(16);
      doc.text(getStatusTabTitle(activeTab), 14, 15);
      doc.setFontSize(10);
      doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 22);

      // Table
      doc.autoTable({
        startY: 28,
        head: [['รหัส', 'ชื่อครุภัณฑ์', 'Serial', 'จำนวน', 'ราคา', 'สถานะ', 'หน่วยงาน', 'สถานที่']],
        body: statusAssets.map(item => [
          String(item.asset_id || '-'),
          String(item.asset_name || '-'),
          String(item.serial_number || '-'),
          `${item.quantity || 0} ${item.unit || ''}`,
          parseFloat(item.price || 0).toLocaleString('th-TH'),
          String(item.status || '-'),
          String(item.department_name || item.department || '-'),
          item.building_name
            ? `${item.building_name}${item.floor ? ` ชั้น ${item.floor}` : ''}${item.room_number ? ` ห้อง ${item.room_number}` : ''}`
            : '-'
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 28, left: 10, right: 10 }
      });

      doc.save(`report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Export PDF สำเร็จ');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('ไม่สามารถ Export PDF ได้');
    }
  };

  const getStatusTabTitle = (tab) => {
    const titles = {
      'all': 'รายงานครุภัณฑ์ทั้งหมด',
      'available': 'รายงานครุภัณฑ์ที่ใช้งานได้',
      'maintenance': 'รายงานครุภัณฑ์รอซ่อม',
      'pendingDisposal': 'รายงานครุภัณฑ์รอจำหน่าย',
      'disposed': 'รายงานครุภัณฑ์จำหน่ายแล้ว',
      'missing': 'รายงานครุภัณฑ์ไม่พบ'
    };
    return titles[tab] || 'รายงานครุภัณฑ์';
  };

  if (loading && !selectedReport) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600" size={24} />
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูลรายงาน...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-600 mt-1">สรุปและวิเคราะห์ข้อมูลครุภัณฑ์</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw size={18} />
          รีเฟรช
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => { setActiveTab('all'); setSelectedReport(null); }}
          className={`bg-gradient-to-br ${activeTab === 'all' ? 'from-blue-600 to-blue-700 ring-4 ring-blue-300' : 'from-blue-500 to-blue-600'} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs mb-1">ครุภัณฑ์ทั้งหมด</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Package size={20} />
            </div>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('available'); setSelectedReport(null); }}
          className={`bg-gradient-to-br ${activeTab === 'available' ? 'from-green-600 to-green-700 ring-4 ring-green-300' : 'from-green-500 to-green-600'} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs mb-1">ใช้งานได้</p>
              <p className="text-2xl font-bold">{stats.available}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('maintenance'); setSelectedReport(null); }}
          className={`bg-gradient-to-br ${activeTab === 'maintenance' ? 'from-yellow-600 to-yellow-700 ring-4 ring-yellow-300' : 'from-yellow-500 to-yellow-600'} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-xs mb-1">รอซ่อม</p>
              <p className="text-2xl font-bold">{stats.maintenance}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('pendingDisposal'); setSelectedReport(null); }}
          className={`bg-gradient-to-br ${activeTab === 'pendingDisposal' ? 'from-orange-600 to-orange-700 ring-4 ring-orange-300' : 'from-orange-500 to-orange-600'} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs mb-1">รอจำหน่าย</p>
              <p className="text-2xl font-bold">{stats.pendingDisposal}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('disposed'); setSelectedReport(null); }}
          className={`bg-gradient-to-br ${activeTab === 'disposed' ? 'from-gray-600 to-gray-700 ring-4 ring-gray-300' : 'from-gray-500 to-gray-600'} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-xs mb-1">จำหน่ายแล้ว</p>
              <p className="text-2xl font-bold">{stats.disposed}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Package size={20} />
            </div>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('missing'); setSelectedReport(null); }}
          className={`bg-gradient-to-br ${activeTab === 'missing' ? 'from-red-600 to-red-700 ring-4 ring-red-300' : 'from-red-500 to-red-600'} rounded-xl shadow-lg p-4 text-white cursor-pointer transition-all hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs mb-1">ไม่พบ</p>
              <p className="text-2xl font-bold">{stats.missing}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Assets Table */}
      {!selectedReport && activeTab && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {getStatusTabTitle(activeTab)}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => exportStatusAssetsToExcel()}
                  disabled={statusAssets.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={18} />
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : statusAssets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">รหัส</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">ชื่อครุภัณฑ์</th>
                    <th className="w-20 px-2 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">Serial</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">จำนวน</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">ราคา</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">สถานะ</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">หน่วยงาน</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase">สถานที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statusAssets.map((asset, index) => (
                    <tr key={asset.asset_id || index} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-sm">{asset.asset_id || '-'}</td>
                      <td className="px-3 py-2.5 text-sm font-medium">{asset.asset_name || '-'}</td>
                      <td className="px-2 py-2.5 text-xs break-all">{asset.serial_number || '-'}</td>
                      <td className="px-3 py-2.5 text-sm">{asset.quantity || 0} {asset.unit || ''}</td>
                      <td className="px-3 py-2.5 text-sm">{parseFloat(asset.price || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm">{asset.department_name || asset.department || '-'}</td>
                      <td className="px-3 py-2.5 text-sm">
                        {asset.building_name
                          ? `${asset.building_name}${asset.floor ? ` ชั้น ${asset.floor}` : ''}${asset.room_number ? ` ห้อง ${asset.room_number}` : ''}`
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-500">ไม่มีข้อมูลครุภัณฑ์ในหมวดนี้</p>
            </div>
          )}
        </div>
      )}

      {/* Date Filter */}
      {(selectedReport === 'check-report' || selectedReport === 'movement-history') && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter size={20} />
            กรองตามวันที่
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="รายงานสรุปครุภัณฑ์"
          description="รายงานครุภัณฑ์ทั้งหมดพร้อมรายละเอียด"
          icon={<FileText size={24} />}
          color="blue"
          onClick={() => generateReport('asset-summary')}
        />

        <ReportCard
          title="รายงานการตรวจสอบ"
          description="ประวัติการตรวจสอบครุภัณฑ์"
          icon={<CheckCircle size={24} />}
          color="green"
          onClick={() => generateReport('check-report')}
        />

        <ReportCard
          title="สรุปตามสถานะ"
          description="จำนวนและมูลค่าแยกตามสถานะ"
          icon={<PieChart size={24} />}
          color="purple"
          onClick={() => generateReport('by-status')}
        />

        <ReportCard
          title="สรุปตามหน่วยงาน"
          description="ครุภัณฑ์แยกตามหน่วยงาน"
          icon={<Building size={24} />}
          color="indigo"
          onClick={() => generateReport('by-department')}
        />

        <ReportCard
          title="ครุภัณฑ์ยังไม่ได้ตรวจ"
          description="รายการที่ยังไม่ได้รับการตรวจสอบ"
          icon={<AlertTriangle size={24} />}
          color="red"
          onClick={() => generateReport('unchecked')}
        />

        <ReportCard
          title="ประวัติการเคลื่อนย้าย"
          description="บันทึกการย้ายครุภัณฑ์"
          icon={<MapPin size={24} />}
          color="orange"
          onClick={() => generateReport('movement-history')}
        />
      </div>

      {/* Report Table */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {getReportTitle(selectedReport)}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Download size={18} />
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {getTableHeaders(selectedReport).map((header, index) => (
                    <th key={index} className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {renderTableRows(selectedReport, reportData)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && selectedReport && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}

function ReportCard({ title, description, icon, color, onClick }) {
  const colorClasses = {
    blue: 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-primary-500/20',
    green: 'from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 shadow-success-500/20',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/20',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/20',
    red: 'from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 shadow-danger-500/20',
    orange: 'from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 shadow-warning-500/20'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-lg p-6 text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
        <Download size={20} className="opacity-70" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
}

function getReportTitle(reportType) {
  const titles = {
    'asset-summary': 'รายงานสรุปครุภัณฑ์ทั้งหมด',
    'check-report': 'รายงานการตรวจสอบครุภัณฑ์',
    'by-status': 'สรุปครุภัณฑ์ตามสถานะ',
    'by-department': 'สรุปครุภัณฑ์ตามหน่วยงาน',
    'unchecked': 'ครุภัณฑ์ที่ยังไม่ได้ตรวจสอบ',
    'movement-history': 'ประวัติการเคลื่อนย้ายครุภัณฑ์'
  };
  return titles[reportType] || 'รายงาน';
}

function getTableHeaders(reportType) {
  const headers = {
    'asset-summary': ['รหัส', 'ชื่อครุภัณฑ์', 'Serial', 'จำนวน', 'ราคา', 'สถานะ', 'หน่วยงาน', 'สถานที่'],
    'check-report': ['วันที่ตรวจ', 'รหัส', 'ชื่อครุภัณฑ์', 'สถานะการตรวจ', 'ผู้ตรวจ', 'หมายเหตุ'],
    'by-status': ['สถานะ', 'จำนวน', 'มูลค่ารวม (บาท)'],
    'by-department': ['หน่วยงาน', 'คณะ', 'จำนวน', 'มูลค่า', 'ใช้งานได้', 'รอซ่อม', 'ไม่พบ'],
    'unchecked': ['รหัส', 'ชื่อครุภัณฑ์', 'สถานะ', 'หน่วยงาน', 'สถานที่', 'วันที่ตรวจล่าสุด', 'ไม่ได้ตรวจมา'],
    'movement-history': ['วันที่ย้าย', 'รหัส', 'ชื่อครุภัณฑ์', 'จาก', 'ไปยัง', 'ผู้ดำเนินการ', 'หมายเหตุ']
  };
  return headers[reportType] || [];
}

function renderTableRows(reportType, data) {
  if (!data || data.length === 0) return null;

  if (reportType === 'asset-summary') {
    return data.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm">{item.asset_id || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.asset_name || '-'}</td>
        <td className="px-2 py-2 text-xs break-all">{item.serial_number || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.quantity || 0} {item.unit || ''}</td>
        <td className="px-6 py-4 text-sm">{parseFloat(item.price || 0).toLocaleString()}</td>
        <td className="px-6 py-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">{item.department_name || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.location || '-'}</td>
      </tr>
    ));
  } else if (reportType === 'check-report') {
    return data.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm">{item.check_date || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.asset_id || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.asset_name || '-'}</td>
        <td className="px-6 py-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.check_status)}`}>
            {item.check_status || '-'}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">{item.checker_name || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.remark || '-'}</td>
      </tr>
    ));
  } else if (reportType === 'by-status') {
    return data.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm font-semibold">{item.count}</td>
        <td className="px-6 py-4 text-sm font-semibold">{parseFloat(item.total_value || 0).toLocaleString()}</td>
      </tr>
    ));
  } else if (reportType === 'by-department') {
    return data.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm font-medium">{item.department_name}</td>
        <td className="px-6 py-4 text-sm">{item.faculty || '-'}</td>
        <td className="px-6 py-4 text-sm font-semibold">{item.asset_count}</td>
        <td className="px-6 py-4 text-sm">{parseFloat(item.total_value || 0).toLocaleString()}</td>
        <td className="px-6 py-4 text-sm text-green-600">{item.active_count}</td>
        <td className="px-6 py-4 text-sm text-yellow-600">{item.repair_count}</td>
        <td className="px-6 py-4 text-sm text-red-600">{item.missing_count}</td>
      </tr>
    ));
  } else if (reportType === 'unchecked') {
    return data.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm">{item.asset_id || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.asset_name || '-'}</td>
        <td className="px-6 py-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
            {item.status || '-'}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">{item.department_name || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.location || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.last_check_date || 'ไม่เคยตรวจ'}</td>
        <td className="px-6 py-4 text-sm text-red-600 font-semibold">
          {item.days_since_check ? `${item.days_since_check} วัน` : 'N/A'}
        </td>
      </tr>
    ));
  } else if (reportType === 'movement-history') {
    return data.map((item, index) => (
      <tr key={index} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm">{item.move_date || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.asset_id || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.asset_name || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.old_location || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.new_location || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.moved_by_name || '-'}</td>
        <td className="px-6 py-4 text-sm">{item.remark || '-'}</td>
      </tr>
    ));
  }

  return null;
}

function getStatusColor(status) {
  const colors = {
    'ใช้งานได้': 'bg-success-100 text-success-700 border border-success-200',
    'รอซ่อม': 'bg-warning-100 text-warning-700 border border-warning-200',
    'รอจำหน่าย': 'bg-orange-100 text-orange-700 border border-orange-200',
    'จำหน่ายแล้ว': 'bg-gray-100 text-gray-600 border border-gray-200',
    'ไม่พบ': 'bg-danger-100 text-danger-700 border border-danger-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
}