import { useState, useEffect } from 'react';
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
  Users,
  BarChart3,
  PieChart
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    missing: 0
  });
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/by-status');
      const data = response.data.data;

      let total = 0;
      let available = 0;
      let maintenance = 0;
      let missing = 0;

      data.forEach(item => {
        total += parseInt(item.count || 0);
        if (item.status === 'ใช้งานได้') available = parseInt(item.count || 0);
        if (item.status === 'รอซ่อม') maintenance = parseInt(item.count || 0);
        if (item.status === 'ไม่พบ') missing = parseInt(item.count || 0);
      });

      setStats({ total, available, maintenance, missing });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('ไม่สามารถโหลดสถิติได้');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setLoading(true);
    setSelectedReport(reportType);

    try {
      let endpoint = '';
      
      switch(reportType) {
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
      const queryParams = new URLSearchParams();
      queryParams.append('type', selectedReport);
      queryParams.append('format', 'excel');
      
      if (dateRange.startDate) queryParams.append('start_date', dateRange.startDate);
      if (dateRange.endDate) queryParams.append('end_date', dateRange.endDate);

      const url = `${api.defaults.baseURL}/reports/export?${queryParams.toString()}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '');
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

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('รายงานครุภัณฑ์', 14, 20);
    doc.setFontSize(10);
    doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, 14, 27);

    // Table
    if (selectedReport === 'asset-summary') {
      doc.autoTable({
        startY: 35,
        head: [['รหัส', 'ชื่อครุภัณฑ์', 'Serial', 'จำนวน', 'ราคา', 'สถานะ']],
        body: reportData.map(item => [
          item.asset_id || '-',
          item.asset_name || '-',
          item.serial_number || '-',
          `${item.quantity || 0} ${item.unit || ''}`,
          `${parseFloat(item.price || 0).toLocaleString()}`,
          item.status || '-'
        ])
      });
    } else if (selectedReport === 'by-status') {
      doc.autoTable({
        startY: 35,
        head: [['สถานะ', 'จำนวน', 'มูลค่ารวม (บาท)']],
        body: reportData.map(item => [
          item.status,
          item.count,
          parseFloat(item.total_value || 0).toLocaleString()
        ])
      });
    }

    doc.save(`report_${selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Export PDF สำเร็จ');
  };

  if (loading && !selectedReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">รายงาน</h1>
        <p className="text-gray-600 mt-1">สรุปและวิเคราะห์ข้อมูลครุภัณฑ์</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">ครุภัณฑ์ทั้งหมด</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <Package size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">ใช้งานได้</p>
              <p className="text-4xl font-bold mt-2">{stats.available}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <CheckCircle size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">รอซ่อม</p>
              <p className="text-4xl font-bold mt-2">{stats.maintenance}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <Clock size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">ไม่พบ</p>
              <p className="text-4xl font-bold mt-2">{stats.missing}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <AlertTriangle size={32} />
            </div>
          </div>
        </div>
      </div>

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
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
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
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
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
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Download size={18} />
                  Export PDF
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
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
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
        <td className="px-6 py-4 text-sm">{item.serial_number || '-'}</td>
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
    'ใช้งานได้': 'bg-green-100 text-green-800',
    'รอซ่อม': 'bg-yellow-100 text-yellow-800',
    'รอจำหน่าย': 'bg-orange-100 text-orange-800',
    'จำหน่ายแล้ว': 'bg-gray-100 text-gray-800',
    'ไม่พบ': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}