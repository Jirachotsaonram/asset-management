// FILE: asset-frontend/src/pages/CheckPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Building,
  Calendar,
  Bell,
  Settings,
  X,
  Grid,
  List,
  RotateCcw,
  Layers,
  MapPin,
  Package
} from 'lucide-react';

export default function CheckPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [checkedAssets, setCheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View Mode
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" หรือ "list"
  
  // Expand/Collapse State
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  
  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    checkStatus: "all", // all, checked, unchecked
    department: "all",
    building: "all",
    floor: "all"
  });
  
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [overdueAssets, setOverdueAssets] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, checksRes, deptsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/checks'),
        api.get('/departments')
      ]);

      const allAssets = assetsRes.data.data || [];
      const allChecks = checksRes.data.data || [];

      // หาครุภัณฑ์ที่ตรวจแล้วในปีนี้
      const currentYear = new Date().getFullYear();
      const checkedIds = allChecks
        .filter(check => {
          const checkYear = new Date(check.check_date).getFullYear();
          return checkYear === currentYear;
        })
        .map(check => check.asset_id);

      setAssets(allAssets);
      setCheckedAssets(checkedIds);
      setDepartments(deptsRes.data.data || []);

      // ลอง fetch การแจ้งเตือน (ถ้ามี API)
      try {
        const [notifRes, overdueRes] = await Promise.all([
          api.get('/check-schedules/notifications'),
          api.get('/check-schedules/overdue')
        ]);
        setNotifications(notifRes.data.data || []);
        setOverdueAssets(overdueRes.data.data || []);
      } catch (err) {
        console.log('Notifications API not available');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Filter Assets
  const getFilteredAssets = () => {
    return assets.filter((asset) => {
      // Search Term
      const matchSearch = 
        asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id?.toString().includes(searchTerm) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by Asset Status
      if (filters.status !== "all" && asset.status !== filters.status) {
        return false;
      }

      // Filter by Check Status
      const isChecked = checkedAssets.includes(asset.asset_id);
      if (filters.checkStatus === "checked" && !isChecked) return false;
      if (filters.checkStatus === "unchecked" && isChecked) return false;

      // Filter by Department
      if (filters.department !== "all" && asset.department_id != filters.department) {
        return false;
      }

      // Filter by Building
      if (filters.building !== "all" && asset.building_name !== filters.building) {
        return false;
      }

      // Filter by Floor
      if (filters.floor !== "all" && asset.floor !== filters.floor) {
        return false;
      }

      return matchSearch;
    });
  };

  const filteredAssets = getFilteredAssets();

  // Get unique buildings and floors
  const uniqueBuildings = [...new Set(assets.map(a => a.building_name).filter(Boolean))];
  const uniqueFloors = [...new Set(assets.map(a => a.floor).filter(Boolean))];

  // คำนวณสถิติ
  const calculateStats = (assetList = filteredAssets) => {
    const total = assetList.length;
    const uniqueChecked = new Set(
      assetList.filter(a => checkedAssets.includes(a.asset_id)).map(a => a.asset_id)
    );
    const checked = uniqueChecked.size;
    const unchecked = total - checked;
    const percentage = total > 0 ? ((checked / total) * 100).toFixed(1) : 0;

    return { total, checked, unchecked, percentage };
  };

  const stats = calculateStats(filteredAssets);

  // จัดกลุ่มครุภัณฑ์ตามสถานที่
  const groupAssetsByLocation = (assetList) => {
    const grouped = {};

    assetList.forEach((asset) => {
      const building = asset.building_name || 'ไม่ระบุอาคาร';
      const floor = asset.floor || 'ไม่ระบุชั้น';
      const room = asset.room_number || 'ไม่ระบุห้อง';

      if (!grouped[building]) grouped[building] = {};
      if (!grouped[building][floor]) grouped[building][floor] = {};
      if (!grouped[building][floor][room]) grouped[building][floor][room] = [];

      grouped[building][floor][room].push({
        ...asset,
        isChecked: checkedAssets.includes(asset.asset_id)
      });
    });

    return grouped;
  };

  // Toggle Functions
  const toggleBuilding = (building) => {
    setExpandedBuildings(prev => ({ ...prev, [building]: !prev[building] }));
  };

  const toggleFloor = (building, floor) => {
    const key = `${building}-${floor}`;
    setExpandedFloors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRoom = (building, floor, room) => {
    const key = `${building}-${floor}-${room}`;
    setExpandedRooms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      status: "all",
      checkStatus: "all",
      department: "all",
      building: "all",
      floor: "all"
    });
    setSearchTerm('');
  };

  // Handle Search
  const handleSearch = () => {
    // Force re-render with current searchTerm
    setFilters({ ...filters });
  };

  // Render Grouped View
  const renderGroupedView = () => {
    const groupedAssets = groupAssetsByLocation(filteredAssets);

    if (Object.keys(groupedAssets).length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">ไม่พบข้อมูลครุภัณฑ์</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(groupedAssets).map(([building, floors]) => {
          const buildingAssets = Object.values(floors)
            .flatMap(rooms => Object.values(rooms))
            .flat();
          const buildingStats = calculateStats(buildingAssets);
          const isExpanded = expandedBuildings[building];

          return (
            <div key={building} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Building Header */}
              <div
                onClick={() => toggleBuilding(building)}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors border-b-2 border-blue-200"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Building className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{building}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      ตรวจแล้ว: <span className="text-green-600 font-semibold">{buildingStats.checked}</span> / {buildingStats.total} ({buildingStats.percentage}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${buildingStats.percentage}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{buildingStats.total}</span>
                  {isExpanded ? (
                    <ChevronDown className="text-gray-600" size={24} />
                  ) : (
                    <ChevronRight className="text-gray-600" size={24} />
                  )}
                </div>
              </div>

              {/* Floors */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {Object.entries(floors).map(([floor, rooms]) => {
                    const floorKey = `${building}-${floor}`;
                    const isFloorExpanded = expandedFloors[floorKey];
                    const floorAssets = Object.values(rooms).flat();
                    const floorStats = calculateStats(floorAssets);

                    return (
                      <div key={floorKey} className="border-l-4 border-indigo-400 bg-gray-50 rounded-lg overflow-hidden">
                        {/* Floor Header */}
                        <div
                          onClick={() => toggleFloor(building, floor)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-500 p-2 rounded">
                              <Layers className="text-white" size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">ชั้น {floor}</h4>
                              <p className="text-xs text-gray-600">
                                ตรวจแล้ว {floorStats.checked} / {floorStats.total}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${floorStats.percentage}%` }}
                              />
                            </div>
                            <span className="text-lg font-bold text-indigo-600">{floorStats.total}</span>
                            {isFloorExpanded ? (
                              <ChevronDown className="text-gray-500" size={20} />
                            ) : (
                              <ChevronRight className="text-gray-500" size={20} />
                            )}
                          </div>
                        </div>

                        {/* Rooms */}
                        {isFloorExpanded && (
                          <div className="p-4 space-y-2 bg-white">
                            {Object.entries(rooms).map(([room, roomAssets]) => {
                              const roomKey = `${building}-${floor}-${room}`;
                              const isRoomExpanded = expandedRooms[roomKey];
                              const roomStats = calculateStats(roomAssets);

                              return (
                                <div key={roomKey} className="border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Room Header */}
                                  <div 
                                    onClick={() => toggleRoom(building, floor, room)}
                                    className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="text-purple-600" size={18} />
                                        <span className="font-semibold text-gray-800">ห้อง {room}</span>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                          {roomStats.checked}/{roomStats.total}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${roomStats.percentage}%` }}
                                          />
                                        </div>
                                        {isRoomExpanded ? (
                                          <ChevronDown className="text-gray-500" size={20} />
                                        ) : (
                                          <ChevronRight className="text-gray-500" size={20} />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assets List */}
                                  {isRoomExpanded && (
                                    <div className="p-3 space-y-2">
                                      {roomAssets.map(asset => (
                                        <div 
                                          key={asset.asset_id}
                                          className={`p-3 rounded-lg border-2 transition ${
                                            asset.isChecked 
                                              ? 'bg-green-50 border-green-300' 
                                              : 'bg-white border-gray-200 hover:border-blue-300'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              {asset.isChecked ? (
                                                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                                              ) : (
                                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                                              )}
                                              <div>
                                                <p className="font-medium text-gray-800">
                                                  {asset.asset_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                  ID: {asset.asset_id} {asset.serial_number && `| SN: ${asset.serial_number}`}
                                                </p>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => navigate('/scan')}
                                              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                                            >
                                              <QrCode size={16} />
                                              ตรวจสอบ
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render List View
  const renderListView = () => {
    if (filteredAssets.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">ไม่พบข้อมูลครุภัณฑ์</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">สถานะการตรวจ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">รหัส/ชื่อ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Serial</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">สถานที่</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">สถานะครุภัณฑ์</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => {
                const isChecked = checkedAssets.includes(asset.asset_id);
                return (
                  <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {isChecked ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{asset.asset_name}</div>
                      <div className="text-sm text-gray-500">ID: {asset.asset_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {asset.serial_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        asset.status === 'ใช้งานได้' ? 'bg-green-100 text-green-800' :
                        asset.status === 'รอซ่อม' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate('/scan')}
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <QrCode size={16} />
                        ตรวจสอบ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-800">ตรวจสอบครุภัณฑ์</h1>
          <p className="text-gray-600 mt-1">จัดกลุ่มตามสถานที่และติดตามสถานะการตรวจสอบ</p>
        </div>
        <button 
          onClick={() => navigate('/scan')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition shadow-md"
        >
          <QrCode size={20} />
          สแกน QR Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">ทั้งหมด</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <Building size={32} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">ตรวจแล้ว</p>
              <p className="text-4xl font-bold mt-2">{stats.checked}</p>
            </div>
            <CheckCircle size={32} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">ยังไม่ตรวจ</p>
              <p className="text-4xl font-bold mt-2">{stats.unchecked}</p>
            </div>
            <AlertTriangle size={32} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">เปอร์เซ็นต์</p>
              <p className="text-4xl font-bold mt-2">{stats.percentage}%</p>
            </div>
            <div className="text-3xl font-bold opacity-50">📊</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {(notifications.length > 0 || overdueAssets.length > 0) && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="text-orange-500" size={24} />
            การแจ้งเตือน
          </h2>
          
          {overdueAssets.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-2">
              <div className="flex items-start">
                <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-red-800">เลยกำหนดตรวจ ({overdueAssets.length} รายการ)</p>
                  <ul className="mt-2 space-y-1">
                    {overdueAssets.slice(0, 3).map(asset => (
                      <li key={asset.asset_id} className="text-sm text-red-700">
                        • {asset.asset_name} - เลยมา {asset.days_overdue} วัน
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <div className="flex items-start">
                <Calendar className="text-yellow-500 mr-3 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-yellow-800">ใกล้ถึงกำหนดตรวจ ({notifications.length} รายการ)</p>
                  <ul className="mt-2 space-y-1">
                    {notifications.slice(0, 3).map(asset => (
                      <li key={asset.asset_id} className="text-sm text-yellow-700">
                        • {asset.asset_name} - อีก {asset.days_until_check} วัน
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & View Mode */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ค้นหาครุภัณฑ์..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Search size={20} />
              <span>ค้นหา</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === "grouped"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Grid size={18} />
              <span className="font-medium">จัดกลุ่ม</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <List size={18} />
              <span className="font-medium">รายการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">ตัวกรอง</h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw size={16} />
            <span>รีเซ็ตตัวกรอง</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filter by Check Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะการตรวจ
            </label>
            <select
              value={filters.checkStatus}
              onChange={(e) => setFilters({ ...filters, checkStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="checked">✓ ตรวจแล้ว</option>
              <option value="unchecked">○ ยังไม่ตรวจ</option>
            </select>
          </div>

          {/* Filter by Asset Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะครุภัณฑ์
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ใช้งานได้">ใช้งานได้</option>
              <option value="รอซ่อม">รอซ่อม</option>
              <option value="รอจำหน่าย">รอจำหน่าย</option>
              <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
              <option value="ไม่พบ">ไม่พบ</option>
            </select>
          </div>

          {/* Filter by Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หน่วยงาน
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Building */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อาคาร
            </label>
            <select
              value={filters.building}
              onChange={(e) => setFilters({ ...filters, building: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              {uniqueBuildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Floor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชั้น
            </label>
            <select
              value={filters.floor}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              {uniqueFloors.sort((a, b) => a - b).map((floor) => (
                <option key={floor} value={floor}>
                  ชั้น {floor}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.checkStatus !== "all" || filters.status !== "all" || 
          filters.department !== "all" || filters.building !== "all" || 
          filters.floor !== "all" || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 font-medium">ตัวกรองที่ใช้งาน:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  ค้นหา: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}

              {filters.checkStatus !== "all" && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {filters.checkStatus === 'checked' ? '✓ ตรวจแล้ว' : '○ ยังไม่ตรวจ'}
                  <button
                    onClick={() => setFilters({ ...filters, checkStatus: "all" })}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}

              {filters.status !== "all" && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  สถานะ: {filters.status}
                  <button
                    onClick={() => setFilters({ ...filters, status: "all" })}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}

              {filters.department !== "all" && (
                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                  {departments.find(d => d.department_id == filters.department)?.department_name}
                  <button
                    onClick={() => setFilters({ ...filters, department: "all" })}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}

              {filters.building !== "all" && (
                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  อาคาร: {filters.building}
                  <button
                    onClick={() => setFilters({ ...filters, building: "all" })}
                    className="hover:bg-yellow-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}

              {filters.floor !== "all" && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                  ชั้น: {filters.floor}
                  <button
                    onClick={() => setFilters({ ...filters, floor: "all" })}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}

              <span className="text-sm text-gray-500">
                ({filteredAssets.length} จาก {assets.length} รายการ)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "grouped" ? renderGroupedView() : renderListView()}
    </div>
  );
}