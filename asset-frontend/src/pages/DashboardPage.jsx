import { useEffect, useState } from 'react';
import api from '../services/api';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function StatsCard({ title, value, icon: Icon, color, bgColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
        </div>
        <div className={`${color} opacity-20`}>
          <Icon className="w-16 h-16" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    missing: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/assets');
      const assets = response.data.data;

      const statsData = {
        total: assets.length,
        available: assets.filter(a => a.status === 'ใช้งานได้').length,
        maintenance: assets.filter(a => a.status === 'รอซ่อม').length,
        missing: assets.filter(a => a.status === 'ไม่พบ').length
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="ครุภัณฑ์ทั้งหมด"
          value={stats.total}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="ใช้งานได้"
          value={stats.available}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="รอซ่อม"
          value={stats.maintenance}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatsCard
          title="ไม่พบ"
          value={stats.missing}
          icon={AlertTriangle}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">ข้อมูลสรุป</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>อัตราการใช้งาน</span>
              <span className="font-bold text-green-600">
                {stats.total > 0 ? ((stats.available / stats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>ต้องการซ่อมบำรุง</span>
              <span className="font-bold text-yellow-600">{stats.maintenance} รายการ</span>
            </div>
            <div className="flex justify-between items-center">
              <span>สูญหาย</span>
              <span className="font-bold text-red-600">{stats.missing} รายการ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">การแจ้งเตือน</h2>
          <div className="space-y-3">
            {stats.missing > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">มีครุภัณฑ์สูญหาย {stats.missing} รายการ</span>
              </div>
            )}
            {stats.maintenance > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800">มีครุภัณฑ์รอซ่อม {stats.maintenance} รายการ</span>
              </div>
            )}
            {stats.missing === 0 && stats.maintenance === 0 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">ไม่มีการแจ้งเตือน</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}