import { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  BarChart3,
  PieChart
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';

function StatCard({ title, value, change, icon: Icon, color, trend = 'up' }) {
  const colorClasses = {
    purple: 'from-purple-600 to-purple-700',
    cyan: 'from-cyan-600 to-cyan-700',
    green: 'from-green-600 to-green-700',
    yellow: 'from-yellow-600 to-yellow-700',
    red: 'from-red-600 to-red-700',
  };

  const iconBgColors = {
    purple: 'bg-purple-500/20 text-purple-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBgColors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`flex items-center text-sm font-semibold ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {change}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      </div>

      {/* Gradient Bottom Border */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]} rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, color = 'purple' }) {
  const colors = {
    purple: 'hover:bg-purple-600/20 hover:border-purple-500',
    cyan: 'hover:bg-cyan-600/20 hover:border-cyan-500',
    green: 'hover:bg-green-600/20 hover:border-green-500',
  };

  return (
    <button
      onClick={onClick}
      className={`cyber-card p-4 flex items-center space-x-3 ${colors[color]} group`}
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      <span className="text-gray-300 group-hover:text-white transition-colors font-medium">
        {label}
      </span>
    </button>
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

  // Mock data for charts
  const chartData = [
    { name: 'ม.ค.', value: 120 },
    { name: 'ก.พ.', value: 132 },
    { name: 'มี.ค.', value: 145 },
    { name: 'เม.ย.', value: 138 },
    { name: 'พ.ค.', value: 152 },
    { name: 'มิ.ย.', value: 165 },
  ];

  const pieData = [
    { name: 'ใช้งานได้', value: 400, color: '#10B981' },
    { name: 'รอซ่อม', value: 100, color: '#F59E0B' },
    { name: 'ไม่พบ', value: 50, color: '#EF4444' },
  ];

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <Zap className="w-8 h-8 text-primary-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Asset Command Center
          </h1>
          <p className="text-gray-400">
            Real-time asset monitoring and management
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-dark-card border border-dark-border px-4 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Live</span>
          </div>
          
          <button className="btn-glow">
            <Activity className="w-5 h-5 mr-2 inline" />
            Scan Assets
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assets"
          value={stats.total}
          change={12.5}
          icon={Package}
          color="purple"
          trend="up"
        />
        <StatCard
          title="Available"
          value={stats.available}
          change={8.2}
          icon={CheckCircle}
          color="green"
          trend="up"
        />
        <StatCard
          title="Maintenance"
          value={stats.maintenance}
          change={3.1}
          icon={Clock}
          color="yellow"
          trend="down"
        />
        <StatCard
          title="Missing"
          value={stats.missing}
          change={1.5}
          icon={AlertTriangle}
          color="red"
          trend="down"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 cyber-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Asset Trends</h3>
              <p className="text-gray-400 text-sm">Monthly asset registration</p>
            </div>
            <BarChart3 className="w-6 h-6 text-primary-500" />
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3153" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#141932', 
                  border: '1px solid #2A3153',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8B5CF6" 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Status Distribution</h3>
              <p className="text-gray-400 text-sm">Asset status overview</p>
            </div>
            <PieChart className="w-6 h-6 text-cyan-500" />
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <RPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#141932', 
                  border: '1px solid #2A3153',
                  borderRadius: '8px'
                }}
              />
            </RPieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-4">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 text-primary-500 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction icon={Package} label="Add New Asset" color="purple" />
          <QuickAction icon={Activity} label="Scan QR Code" color="cyan" />
          <QuickAction icon={Shield} label="Check Assets" color="green" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="cyber-card p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center space-x-4 p-3 bg-dark-hover rounded-lg hover:bg-dark-border transition-colors">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-gray-200 text-sm">Asset <span className="text-primary-400 font-semibold">#CN{1234 + item}</span> was checked</p>
                <p className="text-gray-500 text-xs mt-1">2 minutes ago</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}