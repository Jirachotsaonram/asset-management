// FILE: src/pages/CheckPage.jsx
import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  QrCode, CheckCircle, AlertTriangle, Search, Filter,
  ChevronDown, ChevronRight, Building, Calendar, Bell,
  X, Grid, List, RotateCcw, Layers, MapPin, Package,
  Clock, Settings, Check, AlertCircle, Save
} from 'lucide-react';

export default function CheckPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [checkedAssets, setCheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState("grouped");
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  const [filters, setFilters] = useState({
    status: "all",
    checkStatus: "all",
    department: "all",
    building: "all",
    floor: "all"
  });
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    interval: 'custom',
    customMonths: 12,
    nextCheckDate: '',
    notifyBefore: 30
  });
  const [showBulkCheckModal, setShowBulkCheckModal] = useState(false);
  const [bulkCheckTarget, setBulkCheckTarget] = useState(null);
  const [bulkCheckStatus, setBulkCheckStatus] = useState('ใช้งานได้');
  const [bulkCheckRemark, setBulkCheckRemark] = useState('');
=======
import { useNavigate } from 'react-router-dom'; // เพิ่มบรรทัดนี้
import api from '../services/api';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle } from 'lucide-react';

export default function CheckPage() {
  const navigate = useNavigate(); // เพิ่มบรรทัดนี้
  const [uncheckedAssets, setUncheckedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
>>>>>>> parent of 409ae4d (add check)

  useEffect(() => {
    fetchUncheckedAssets();
  }, []);

  const fetchUncheckedAssets = async () => {
    try {
<<<<<<< HEAD
      setLoading(true);

      // Fetch Assets
      const assetsRes = await api.get('/assets');
      const allAssets = assetsRes.data.data || [];

      // Fetch Checks
      const checksRes = await api.get('/checks');
      const allChecks = checksRes.data.data || [];

      // Fetch Departments
      const deptsRes = await api.get('/departments');
      const allDepartments = deptsRes.data.data || [];

      // กรองรายการที่ตรวจแล้วในปีปัจจุบัน
      const currentYear = new Date().getFullYear();
      const checkedIds = allChecks
        .filter(check => {
          const checkYear = new Date(check.check_date).getFullYear();
          return checkYear === currentYear;
        })
        .map(check => check.asset_id);

      setAssets(allAssets);
      setCheckedAssets(checkedIds);
      setDepartments(allDepartments);

      // Fetch Notifications (ถ้ามี API)
      try {
        const notifRes = await api.get('/check-schedules/notifications');
        setNotifications(notifRes.data.data || []);
      } catch (error) {
        console.log('Notifications API not available');
        setNotifications([]);
      }

=======
      const response = await api.get('/checks/unchecked');
      setUncheckedAssets(response.data.data);
>>>>>>> parent of 409ae4d (add check)
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const getFilteredAssets = () => {
    return assets.filter((asset) => {
      const matchSearch = 
        asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id?.toString().includes(searchTerm) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

      if (filters.status !== "all" && asset.status !== filters.status) return false;

      const isChecked = checkedAssets.includes(asset.asset_id);
      if (filters.checkStatus === "checked" && !isChecked) return false;
      if (filters.checkStatus === "unchecked" && isChecked) return false;

      if (filters.department !== "all" && asset.department_id != filters.department) return false;
      if (filters.building !== "all" && asset.building_name !== filters.building) return false;
      if (filters.floor !== "all" && asset.floor !== filters.floor) return false;

      return matchSearch;
    });
  };

  const filteredAssets = getFilteredAssets();
  const uniqueBuildings = [...new Set(assets.map(a => a.building_name).filter(Boolean))];
  const uniqueFloors = [...new Set(assets.map(a => a.floor).filter(Boolean))];

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

  // Open Schedule Modal
  const handleOpenScheduleModal = (target) => {
    setScheduleTarget(target);
    setScheduleForm({
      interval: 'custom',
      customMonths: 12,
      nextCheckDate: '',
      notifyBefore: 30
    });
    setShowScheduleModal(true);
  };

  // Save Schedule
  const handleSaveSchedule = async () => {
    try {
      let nextDate = new Date();
      
      switch(scheduleForm.interval) {
        case '3months':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case '6months':
          nextDate.setMonth(nextDate.getMonth() + 6);
          break;
        case '1year':
          nextDate.setMonth(nextDate.getMonth() + 12);
          break;
        case 'custom':
          if (scheduleForm.customMonths) {
            nextDate.setMonth(nextDate.getMonth() + parseInt(scheduleForm.customMonths));
          } else if (scheduleForm.nextCheckDate) {
            nextDate = new Date(scheduleForm.nextCheckDate);
          }
          break;
      }

      const formattedDate = nextDate.toISOString().split('T')[0];
      
      // เตรียมข้อมูลสำหรับบันทึก
      const scheduleData = {
        interval: scheduleForm.interval,
        nextCheckDate: formattedDate,
        notifyBefore: parseInt(scheduleForm.notifyBefore)
      };

      // บันทึกตารางตามประเภท
      if (scheduleTarget.type === 'asset') {
        // บันทึกสำหรับครุภัณฑ์เดียว
        await api.post('/check-schedules/assign-asset', {
          asset_id: scheduleTarget.asset.asset_id,
          schedule_id: 1, // ต้องมี schedule_id จากการสร้าง schedule ก่อน
          ...scheduleData
        });
      } else if (scheduleTarget.type === 'room' || scheduleTarget.type === 'floor' || scheduleTarget.type === 'building') {
        // บันทึกสำหรับกลุ่ม (ทำทีละตัว)
        const promises = scheduleTarget.assets.map(asset =>
          api.post('/check-schedules/assign-asset', {
            asset_id: asset.asset_id,
            schedule_id: 1,
            ...scheduleData
          })
        );
        await Promise.all(promises);
      }

      toast.success(`✅ บันทึกตารางตรวจสอบสำเร็จ\nวันที่ตรวจครั้งถัดไป: ${formattedDate}`);
      setShowScheduleModal(false);
      
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('ไม่สามารถบันทึกตารางได้');
    }
  };

  // Open Bulk Check Modal
  const handleOpenBulkCheckModal = (target) => {
    setBulkCheckTarget(target);
    setBulkCheckStatus('ใช้งานได้');
    setBulkCheckRemark('');
    setShowBulkCheckModal(true);
  };

  // Save Bulk Check
  const handleSaveBulkCheck = async () => {
    try {
      if (!bulkCheckTarget || !bulkCheckTarget.assets) {
        toast.error('ไม่พบข้อมูลครุภัณฑ์');
        return;
      }

      const checkDate = new Date().toISOString().split('T')[0];
      const promises = bulkCheckTarget.assets.map(asset =>
        api.post('/checks', {
          asset_id: asset.asset_id,
          user_id: user.user_id,
          check_date: checkDate,
          check_status: bulkCheckStatus,
          remark: bulkCheckRemark || `ตรวจสอบแบบกลุ่ม - ${bulkCheckTarget.building} ชั้น ${bulkCheckTarget.floor} ห้อง ${bulkCheckTarget.room}`
        })
      );

      await Promise.all(promises);

      // Update checked assets
      const newCheckedIds = bulkCheckTarget.assets.map(a => a.asset_id);
      setCheckedAssets(prev => [...new Set([...prev, ...newCheckedIds])]);

      toast.success(`✅ บันทึกการตรวจสอบสำเร็จ\nตรวจสอบ ${bulkCheckTarget.assets.length} รายการ`);
      setShowBulkCheckModal(false);
      
      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error saving bulk check:', error);
      toast.error('ไม่สามารถบันทึกการตรวจสอบได้');
    }
  };

  // Navigate to Scan Page
  const handleNavigateToScan = () => {
    navigate('/scan');
  };

  // Navigate to individual asset check
  const handleCheckAsset = (assetId) => {
    navigate(`/scan?asset_id=${assetId}`);
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
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <div 
                  onClick={() => toggleBuilding(building)}
                  className="flex items-center gap-4 cursor-pointer flex-1"
                >
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenScheduleModal({ 
                        type: 'building', 
                        building, 
                        assets: buildingAssets 
                      });
                    }}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                    title="กำหนดตารางตรวจสอบ"
                  >
                    <Clock size={16} />
                    <span>กำหนดตาราง</span>
                  </button>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${buildingStats.percentage}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{buildingStats.total}</span>
                  <button onClick={() => toggleBuilding(building)}>
                    {isExpanded ? (
                      <ChevronDown className="text-gray-600" size={24} />
                    ) : (
                      <ChevronRight className="text-gray-600" size={24} />
                    )}
                  </button>
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
                        <div className="flex items-center justify-between p-4">
                          <div 
                            onClick={() => toggleFloor(building, floor)}
                            className="flex items-center gap-3 cursor-pointer flex-1"
                          >
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenScheduleModal({ 
                                  type: 'floor', 
                                  building, 
                                  floor, 
                                  assets: floorAssets 
                                });
                              }}
                              className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition text-xs"
                              title="กำหนดตารางตรวจสอบ"
                            >
                              <Clock size={14} />
                              <span>ตาราง</span>
                            </button>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${floorStats.percentage}%` }}
                              />
                            </div>
                            <span className="text-lg font-bold text-indigo-600">{floorStats.total}</span>
                            <button onClick={() => toggleFloor(building, floor)}>
                              {isFloorExpanded ? (
                                <ChevronDown className="text-gray-500" size={20} />
                              ) : (
                                <ChevronRight className="text-gray-500" size={20} />
                              )}
                            </button>
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
                                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3">
                                    <div className="flex items-center justify-between">
                                      <div 
                                        onClick={() => toggleRoom(building, floor, room)}
                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                      >
                                        <MapPin className="text-purple-600" size={18} />
                                        <span className="font-semibold text-gray-800">ห้อง {room}</span>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                          {roomStats.checked}/{roomStats.total}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenBulkCheckModal({
                                              type: 'room',
                                              building,
                                              floor,
                                              room,
                                              assets: roomAssets
                                            });
                                          }}
                                          className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition"
                                          title="ตรวจทั้งห้อง"
                                        >
                                          <CheckCircle size={14} />
                                          <span>ตรวจทั้งห้อง</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenScheduleModal({ 
                                              type: 'room', 
                                              building, 
                                              floor, 
                                              room, 
                                              assets: roomAssets 
                                            });
                                          }}
                                          className="flex items-center gap-1 bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 transition"
                                          title="กำหนดตารางตรวจสอบ"
                                        >
                                          <Clock size={14} />
                                          <span>ตาราง</span>
                                        </button>
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full transition-all"
                                            style={{ width: `${roomStats.percentage}%` }}
                                          />
                                        </div>
                                        <button onClick={() => toggleRoom(building, floor, room)}>
                                          {isRoomExpanded ? (
                                            <ChevronDown className="text-gray-500" size={20} />
                                          ) : (
                                            <ChevronRight className="text-gray-500" size={20} />
                                          )}
                                        </button>
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
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleOpenScheduleModal({
                                                  type: 'asset',
                                                  asset
                                                })}
                                                className="text-sm bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition flex items-center gap-1"
                                                title="กำหนดตารางตรวจสอบ"
                                              >
                                                <Clock size={14} />
                                              </button>
                                              <button
                                                onClick={() => handleCheckAsset(asset.asset_id)}
                                                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                                              >
                                                <QrCode size={14} />
                                                <span>ตรวจสอบ</span>
                                              </button>
                                            </div>
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

=======
  const handleCheck = async (assetId) => {
    try {
      await api.post('/checks', {
        asset_id: assetId,
        check_status: 'ปกติ',
        remark: 'ตรวจสอบผ่านระบบ'
      });
      toast.success('บันทึกการตรวจสอบสำเร็จ');
      fetchUncheckedAssets();
    } catch (error) {
      toast.error('บันทึกไม่สำเร็จ');
    }
  };

  // ฟังก์ชันไปหน้า Scan
  const goToScanPage = () => {
    navigate('/scan');
  };

>>>>>>> parent of 409ae4d (add check)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ตรวจสอบครุภัณฑ์</h1>
          <p className="text-gray-600 mt-1">จัดกลุ่มตามสถานที่และติดตามสถานะการตรวจสอบ</p>
        </div>
        <button 
          onClick={handleNavigateToScan}
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
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="text-orange-500" size={24} />
            การแจ้งเตือนการตรวจสอบ ({notifications.length})
          </h2>
          
          <div className="space-y-2">
            {notifications.map((notif, idx) => (
              <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex items-start">
                  <Calendar className="text-yellow-500 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-800">ใกล้ถึงกำหนดตรวจ</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {notif.asset_name} ({notif.building_name} ชั้น {notif.floor} ห้อง {notif.room_number}) - อีก {notif.days_until_check} วัน
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาครุภัณฑ์..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะการตรวจ</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะครุภัณฑ์</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ใช้งานได้">ใช้งานได้</option>
              <option value="รอซ่อม">รอซ่อม</option>
              <option value="ไม่พบ">ไม่พบ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงาน</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อาคาร</label>
            <select
              value={filters.building}
              onChange={(e) => setFilters({ ...filters, building: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              {uniqueBuildings.map((building) => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชั้น</label>
            <select
              value={filters.floor}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              {uniqueFloors.sort((a, b) => a - b).map((floor) => (
                <option key={floor} value={floor}>ชั้น {floor}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grouped" && renderGroupedView()}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="text-purple-600" size={28} />
                  กำหนดตารางการตรวจสอบ
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">เป้าหมาย:</p>
                <p className="text-blue-900 font-semibold">
                  {scheduleTarget?.type === 'building' && `อาคาร ${scheduleTarget.building}`}
                  {scheduleTarget?.type === 'floor' && `${scheduleTarget.building} ชั้น ${scheduleTarget.floor}`}
                  {scheduleTarget?.type === 'room' && `${scheduleTarget.building} ชั้น ${scheduleTarget.floor} ห้อง ${scheduleTarget.room}`}
                  {scheduleTarget?.type === 'asset' && scheduleTarget.asset?.asset_name}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  จำนวน: {scheduleTarget?.assets?.length || 1} รายการ
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงเวลาการตรวจสอบ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '3months', label: '3 เดือน' },
                    { value: '6months', label: '6 เดือน' },
                    { value: '1year', label: '1 ปี' },
                    { value: 'custom', label: 'กำหนดเอง' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setScheduleForm({ ...scheduleForm, interval: option.value })}
                      className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                        scheduleForm.interval === option.value
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {scheduleForm.interval === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนเดือน
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={scheduleForm.customMonths}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, customMonths: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หรือเลือกวันที่เฉพาะ
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.nextCheckDate}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, nextCheckDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แจ้งเตือนล่วงหน้า (วัน)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={scheduleForm.notifyBefore}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notifyBefore: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="30"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSchedule}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  บันทึกตารางตรวจสอบ
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Check Modal */}
      {showBulkCheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={28} />
                  ตรวจสอบแบบกลุ่ม
                </h2>
                <button
                  onClick={() => setShowBulkCheckModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">กำลังตรวจสอบ:</p>
                <p className="text-green-900 font-semibold">
                  {bulkCheckTarget?.building} ชั้น {bulkCheckTarget?.floor} ห้อง {bulkCheckTarget?.room}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  จำนวน: {bulkCheckTarget?.assets?.length || 0} รายการ
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะหลังตรวจสอบ
                </label>
                <select
                  value={bulkCheckStatus}
                  onChange={(e) => setBulkCheckStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  <option value="ใช้งานได้">ใช้งานได้</option>
                  <option value="รอซ่อม">รอซ่อม</option>
                  <option value="รอจำหน่าย">รอจำหน่าย</option>
                  <option value="ไม่พบ">ไม่พบ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={bulkCheckRemark}
                  onChange={(e) => setBulkCheckRemark(e.target.value)}
                  placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">รายการครุภัณฑ์:</p>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2">
                  {bulkCheckTarget?.assets?.map(asset => (
                    <div key={asset.asset_id} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-green-600 flex-shrink-0" />
                      <span className="text-gray-800">{asset.asset_name}</span>
                      <span className="text-gray-500 text-xs">({asset.asset_id})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveBulkCheck}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  ยืนยันการตรวจสอบ
                </button>
                <button
                  onClick={() => setShowBulkCheckModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
=======
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ตรวจสอบครุภัณฑ์</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">ครุภัณฑ์ที่ยังไม่ได้ตรวจสอบ</h2>
            <p className="text-gray-600 mt-1">
              มี {uncheckedAssets.length} รายการที่ยังไม่ได้ตรวจสอบ
            </p>
          </div>
          <button 
            onClick={goToScanPage}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <QrCode className="w-5 h-5" />
            <span>สแกน QR Code</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uncheckedAssets.map((asset) => (
          <div key={asset.asset_id} className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-lg mb-2">{asset.asset_name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              ID: {asset.asset_id}<br />
              Serial: {asset.serial_number || '-'}
            </p>
            <button
              onClick={() => handleCheck(asset.asset_id)}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>ยืนยันการตรวจสอบ</span>
            </button>
          </div>
        ))}
      </div>

      {uncheckedAssets.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            ตรวจสอบครบแล้ว
          </h3>
          <p className="text-gray-600">
            ไม่มีครุภัณฑ์ที่ต้องตรวจสอบในขณะนี้
          </p>
>>>>>>> parent of 409ae4d (add check)
        </div>
      )}
    </div>
  );
}