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
  Plus
} from 'lucide-react';

export default function CheckPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [groupedAssets, setGroupedAssets] = useState({});
  const [checkedAssets, setCheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, checked, unchecked
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  
  // การแจ้งเตือน
  const [notifications, setNotifications] = useState([]);
  const [overdueAssets, setOverdueAssets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAssetForSchedule, setSelectedAssetForSchedule] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, checksRes, notificationsRes, overdueRes, schedulesRes] = await Promise.all([
        api.get('/assets'),
        api.get('/checks'),
        api.get('/check-schedules/notifications'),
        api.get('/check-schedules/overdue'),
        api.get('/check-schedules')
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
      setNotifications(notificationsRes.data.data || []);
      setOverdueAssets(overdueRes.data.data || []);
      setSchedules(schedulesRes.data.data || []);
      
      groupAssetsByLocation(allAssets, checkedIds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดกลุ่มครุภัณฑ์ตามสถานที่
  const groupAssetsByLocation = (assetsList, checkedIds) => {
    const grouped = {};

    assetsList.forEach(asset => {
      const building = asset.building_name || 'ไม่ระบุอาคาร';
      const floor = asset.floor || 'ไม่ระบุชั้น';
      const room = asset.room_number || 'ไม่ระบุห้อง';

      if (!grouped[building]) {
        grouped[building] = {};
      }
      if (!grouped[building][floor]) {
        grouped[building][floor] = {};
      }
      if (!grouped[building][floor][room]) {
        grouped[building][floor][room] = [];
      }

      grouped[building][floor][room].push({
        ...asset,
        isChecked: checkedIds.includes(asset.asset_id)
      });
    });

    setGroupedAssets(grouped);
    
    // Auto-expand อาคารแรกและชั้นแรก
    if (Object.keys(grouped).length > 0) {
      const firstBuilding = Object.keys(grouped)[0];
      setExpandedBuildings({ [firstBuilding]: true });
      
      if (grouped[firstBuilding]) {
        const firstFloor = Object.keys(grouped[firstBuilding])[0];
        setExpandedFloors({ [`${firstBuilding}-${firstFloor}`]: true });
      }
    }
  };

  // คำนวณสถิติ (แก้ไขให้ถูกต้อง)
  const calculateStats = () => {
    const total = assets.length;
    const uniqueChecked = new Set(checkedAssets);
    const checked = uniqueChecked.size;
    const unchecked = total - checked;
    const percentage = total > 0 ? ((checked / total) * 100).toFixed(1) : 0;

    return { total, checked, unchecked, percentage };
  };

  // Filter ครุภัณฑ์
  const filterAssets = (assetsList) => {
    return assetsList.filter(asset => {
      const matchSearch = 
        asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id?.toString().includes(searchTerm) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'checked' && asset.isChecked) ||
        (filterStatus === 'unchecked' && !asset.isChecked);

      return matchSearch && matchStatus;
    });
  };

  // Toggle expand/collapse
  const toggleBuilding = (building) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [building]: !prev[building]
    }));
  };

  const toggleFloor = (building, floor) => {
    const key = `${building}-${floor}`;
    setExpandedFloors(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // เปิด Modal กำหนดรอบการตรวจ
  const handleOpenScheduleModal = (asset) => {
    setSelectedAssetForSchedule(asset);
    setShowScheduleModal(true);
  };

  // กำหนดรอบการตรวจให้ครุภัณฑ์
  const handleAssignSchedule = async (scheduleId) => {
    if (!selectedAssetForSchedule) return;

    try {
      await api.post('/check-schedules/assign-asset', {
        asset_id: selectedAssetForSchedule.asset_id,
        schedule_id: scheduleId
      });

      toast.success('กำหนดรอบการตรวจสำเร็จ');
      setShowScheduleModal(false);
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถกำหนดรอบได้');
    }
  };

  // กำหนดรอบการตรวจแบบกลุ่ม (ทั้งห้อง)
  const handleAssignScheduleToRoom = async (locationId, scheduleId) => {
    try {
      await api.post('/check-schedules/assign-location', {
        location_id: locationId,
        schedule_id: scheduleId
      });

      toast.success('กำหนดรอบการตรวจแบบกลุ่มสำเร็จ');
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถกำหนดรอบได้');
    }
  };

  const stats = calculateStats();

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
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <QrCode className="w-5 h-5" />
          <span>สแกน QR Code</span>
        </button>
      </div>

      {/* สถิติ */}
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

      {/* การแจ้งเตือน */}
      {(notifications.length > 0 || overdueAssets.length > 0) && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="text-orange-500" size={24} />
            การแจ้งเตือน
          </h2>
          
          {overdueAssets.length > 0 && (
            <div className="mb-4">
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
                      {overdueAssets.length > 3 && (
                        <li className="text-sm text-red-600">... และอีก {overdueAssets.length - 3} รายการ</li>
                      )}
                    </ul>
                  </div>
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
                        • {asset.asset_name} - อีก {asset.days_until_check} วัน ({asset.next_check_date})
                      </li>
                    ))}
                    {notifications.length > 3 && (
                      <li className="text-sm text-yellow-600">... และอีก {notifications.length - 3} รายการ</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาครุภัณฑ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">ทั้งหมด</option>
            <option value="checked">ตรวจแล้ว</option>
            <option value="unchecked">ยังไม่ตรวจ</option>
          </select>
        </div>
      </div>

      {/* รายการครุภัณฑ์แบบจัดกลุ่ม */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">รายการครุภัณฑ์ (จัดกลุ่มตามสถานที่)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const allBuildings = Object.keys(groupedAssets);
                  const expanded = {};
                  allBuildings.forEach(b => { expanded[b] = true; });
                  setExpandedBuildings(expanded);
                  
                  const allFloors = {};
                  allBuildings.forEach(building => {
                    Object.keys(groupedAssets[building]).forEach(floor => {
                      allFloors[`${building}-${floor}`] = true;
                    });
                  });
                  setExpandedFloors(allFloors);
                }}
                className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
              >
                ขยายทั้งหมด
              </button>
              <button
                onClick={() => {
                  setExpandedBuildings({});
                  setExpandedFloors({});
                }}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                ยุบทั้งหมด
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {Object.keys(groupedAssets).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">ไม่พบข้อมูลครุภัณฑ์</p>
            </div>
          ) : (
            Object.entries(groupedAssets).map(([building, floors]) => {
              const buildingAssets = Object.values(floors)
                .flatMap(rooms => Object.values(rooms).flat());
              
              const buildingChecked = buildingAssets.filter(a => a.isChecked).length;
              const buildingTotal = buildingAssets.length;
              const buildingPercent = buildingTotal > 0 
                ? ((buildingChecked / buildingTotal) * 100).toFixed(0) 
                : 0;

              return (
                <div key={building} className="border-b border-gray-200 last:border-0">
                  {/* อาคาร */}
                  <div 
                    className="px-6 py-4 bg-gray-50 hover:bg-gray-100 transition border-b border-gray-200 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => toggleBuilding(building)}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        {expandedBuildings[building] ? (
                          <ChevronDown className="text-gray-600" size={20} />
                        ) : (
                          <ChevronRight className="text-gray-600" size={20} />
                        )}
                        <Building className="text-blue-600" size={24} />
                        <span className="font-bold text-lg">{building}</span>
                        <span className="text-sm text-gray-600">
                          ({buildingChecked}/{buildingTotal})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: เปิด Modal เลือก Schedule สำหรับอาคารนี้
                            toast.success('ฟีเจอร์กำหนดรอบทั้งอาคาร (เร็วๆ นี้)');
                          }}
                          className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition flex items-center gap-1"
                        >
                          <Settings size={12} />
                          กำหนดรอบทั้งอาคาร
                        </button>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${buildingPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                          {buildingPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ชั้น */}
                  {expandedBuildings[building] && (
                    <div>
                      {Object.entries(floors).map(([floor, rooms]) => {
                        const floorAssets = Object.values(rooms).flat();
                        const floorChecked = floorAssets.filter(a => a.isChecked).length;
                        const floorTotal = floorAssets.length;
                        const floorKey = `${building}-${floor}`;

                        return (
                          <div key={floorKey}>
                            <div 
                              onClick={() => toggleFloor(building, floor)}
                              className="px-12 py-3 bg-blue-50 hover:bg-blue-100 cursor-pointer transition flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                {expandedFloors[floorKey] ? (
                                  <ChevronDown className="text-gray-600" size={18} />
                                ) : (
                                  <ChevronRight className="text-gray-600" size={18} />
                                )}
                                <span className="font-semibold">ชั้น {floor}</span>
                                <span className="text-sm text-gray-600">
                                  ({floorChecked}/{floorTotal})
                                </span>
                              </div>
                            </div>

                            {/* ห้อง */}
                            {expandedFloors[floorKey] && (
                              <div>
                                {Object.entries(rooms).map(([room, assetsList]) => {
                                  const filteredAssets = filterAssets(assetsList);
                                  if (filteredAssets.length === 0) return null;

                                  const roomChecked = filteredAssets.filter(a => a.isChecked).length;
                                  const roomTotal = filteredAssets.length;

                                  return (
                                    <div key={`${floorKey}-${room}`} className="px-16 py-4 border-t border-gray-100">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-gray-700">ห้อง {room}</span>
                                          <span className="text-sm text-gray-500">
                                            ({roomChecked}/{roomTotal})
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            // TODO: เปิด Modal เลือก Schedule สำหรับห้องนี้
                                          }}
                                          className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition flex items-center gap-1"
                                        >
                                          <Settings size={12} />
                                          กำหนดรอบตรวจ
                                        </button>
                                      </div>

                                      {/* รายการครุภัณฑ์ */}
                                      <div className="space-y-2">
                                        {filteredAssets.map(asset => (
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
                                                  <CheckCircle className="text-green-600" size={20} />
                                                ) : (
                                                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
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
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={() => handleOpenScheduleModal(asset)}
                                                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition flex items-center gap-1"
                                                >
                                                  <Calendar size={14} />
                                                  กำหนดรอบ
                                                </button>
                                                <button
                                                  onClick={() => navigate('/scan')}
                                                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition"
                                                >
                                                  ตรวจสอบ
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
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
            })
          )}
        </div>
      </div>

      {/* Modal กำหนดรอบการตรวจ */}
      {showScheduleModal && selectedAssetForSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">กำหนดรอบการตรวจสอบ</h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">ครุภัณฑ์</p>
                <p className="font-semibold">{selectedAssetForSchedule.asset_name}</p>
                <p className="text-sm text-gray-500">ID: {selectedAssetForSchedule.asset_id}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">เลือกรอบการตรวจ:</p>
                {schedules.map(schedule => (
                  <button
                    key={schedule.schedule_id}
                    onClick={() => handleAssignSchedule(schedule.schedule_id)}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <p className="font-semibold text-gray-800">{schedule.name}</p>
                    <p className="text-sm text-gray-600">
                      ตรวจทุก {schedule.check_interval_months} เดือน
                      {schedule.notify_before_days && ` | แจ้งเตือนล่วงหน้า ${schedule.notify_before_days} วัน`}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}