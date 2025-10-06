import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">รายงาน</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">รายงานครุภัณฑ์ทั้งหมด</h3>
              <p className="text-sm text-gray-600">Export ข้อมูลครุภัณฑ์ทั้งหมด</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-5 h-5" />
            <span>ดาวน์โหลด Excel</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-4">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold">รายงานการตรวจสอบ</h3>
              <p className="text-sm text-gray-600">ประวัติการตรวจสอบครุภัณฑ์</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <Download className="w-5 h-5" />
            <span>ดาวน์โหลด Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}