// FILE: asset-frontend/src/pages/CheckPage.jsx
import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Building, 
  Layers, 
  MapPin,
  Calendar,
  Bell,
  X,
  Save,
  Eye,
  BarChart3,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Clock,
  Settings,
  EyeOff,
  Grid,
  List,
  Filter as FilterIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CheckPage() {
  const { user } = useAuth();
  
  // States
  const [assets, setAssets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState('check'); // 'check' or 'notifications'
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', // all, never_checked, overdue, due_soon, checked
    building: 'all',
    floor: 'all',
    department: 'all'
  });
  
  // Modal States
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRoomCheckModal, setShowRoomCheckModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  
  // Form States
  const [scheduleForm, setScheduleForm] = useState({
    scheduleId: 3,
    customMonths: '',
    nextCheckDate: '',
    checkNow: false,
    useCustomDate: false
  });
  
  // State สำหรับกำหนดรอบทั้งห้อง
  const [showRoomScheduleModal, setShowRoomScheduleModal] = useState(false);
  const [currentRoomForSchedule, setCurrentRoomForSchedule] = useState(null);
  const [roomScheduleForm, setRoomScheduleForm] = useState({
    scheduleId: 3,
    customMonths: '',
    nextCheckDate: '',
    useCustomDate: false
  });
  
  const [checkForm, setCheckForm] = useState({
    status: 'ใช้งานได้',
    remark: ''
  });

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // เพิ่ม timestamp เพื่อ force refresh ข้อมูล
      const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
      const [assetsRes, schedulesRes, locationsRes, departmentsRes] = await Promise.all([
        api.get(`/assets${timestamp}`),
        api.get(`/check-schedules${timestamp}`),
        api.get(`/locations${timestamp}`),
        api.get(`/departments${timestamp}`)
      ]);

      const fetchedAssets = assetsRes.data.data || [];
      setAssets(fetchedAssets);
      setSchedules(schedulesRes.data.data || []);
      setLocations(locationsRes.data.data || []);
      setDepartments(departmentsRes.data.data || []);
      
      // Debug: ตรวจสอบข้อมูลที่ดึงมา
      if (forceRefresh) {
        console.log('Refreshed assets:', fetchedAssets.length);
        // ตรวจสอบ assets ที่มี last_check_date
        const checkedAssets = fetchedAssets.filter(a => a.last_check_date);
        console.log('Assets with last_check_date:', checkedAssets.length);
        if (checkedAssets.length > 0) {
          console.log('Sample asset:', {
            asset_id: checkedAssets[0].asset_id,
            asset_name: checkedAssets[0].asset_name,
            last_check_date: checkedAssets[0].last_check_date,
            next_check_date: checkedAssets[0].next_check_date
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get Check Status
  const getCheckStatus = (asset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // 1. ยังไม่เคยตรวจ
    if (!asset.last_check_date) {
      // Debug log
      if (asset.asset_id === 14) {
        console.log('Asset 14: No last_check_date', asset);
      }
      return {
        status: 'never_checked',
        label: 'ยังไม่เคยตรวจ',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertCircle,
        priority: 1
      };
    }
    
    // ตรวจสอบวันที่ตรวจล่าสุด
    // Parse date string (format: YYYY-MM-DD) โดยเพิ่ม timezone
    const lastCheckDateStr = asset.last_check_date;
    const lastCheckDate = new Date(lastCheckDateStr + 'T00:00:00');
    lastCheckDate.setHours(0, 0, 0, 0);
    const daysSinceLastCheck = Math.floor((today - lastCheckDate) / (1000 * 60 * 60 * 24));
    
    // Debug log for asset 14
    if (asset.asset_id === 14) {
      console.log('Asset 14 status calculation:', {
        last_check_date: asset.last_check_date,
        next_check_date: asset.next_check_date,
        daysSinceLastCheck,
        today: today.toISOString().split('T')[0],
        lastCheckDate: lastCheckDate.toISOString().split('T')[0],
        todayTime: today.getTime(),
        lastCheckDateTime: lastCheckDate.getTime()
      });
    }
    
    // 2. ไม่มีกำหนดการ (ไม่มี next_check_date)
    if (!asset.next_check_date) {
      // ถ้าตรวจล่าสุดภายใน 30 วัน ให้แสดงว่า "ตรวจแล้ว"
      if (daysSinceLastCheck <= 30) {
        if (asset.asset_id === 14) {
          console.log('Asset 14: Returning checked status (no schedule, checked within 30 days)');
        }
        return {
          status: 'checked',
          label: `ตรวจแล้ว ${asset.last_check_date}`,
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: CheckSquare,
          priority: 3
        };
      }
      if (asset.asset_id === 14) {
        console.log('Asset 14: Returning no_schedule status (checked more than 30 days ago)');
      }
      return {
        status: 'no_schedule',
        label: 'ยังไม่กำหนดรอบ',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Calendar,
        priority: 2
      };
    }
    
    const nextCheck = new Date(asset.next_check_date + 'T00:00:00');
    nextCheck.setHours(0, 0, 0, 0);
    const daysUntil = Math.floor((nextCheck - today) / (1000 * 60 * 60 * 24));
    
    // 3. ถ้าตรวจล่าสุดภายใน 7 วัน ให้แสดง "ตรวจแล้ว" (ไม่ว่าจะ next_check_date เป็นวันไหน)
    // เพราะถ้าตรวจแล้วก็ควรแสดงว่า "ตรวจแล้ว" ไม่ใช่ "อีก X วัน"
    if (daysSinceLastCheck <= 7) {
      return {
        status: 'checked',
        label: `ตรวจแล้ว ${asset.last_check_date}`,
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckSquare,
        priority: 3,
        days: daysUntil
      };
    }
    
    // 4. เลยกำหนด (next_check_date ผ่านไปแล้ว)
    if (daysUntil < 0) {
      return {
        status: 'overdue',
        label: `เลย ${Math.abs(daysUntil)} วัน`,
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertTriangle,
        priority: 1,
        days: daysUntil
      };
    }
    
    // 5. ใกล้กำหนด (7 วัน) - เฉพาะกรณีที่ยังไม่เคยตรวจหรือตรวจมานานแล้ว
    if (daysUntil <= 7) {
      return {
        status: 'due_soon',
        label: `อีก ${daysUntil} วัน`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        priority: 2,
        days: daysUntil
      };
    }
    
    // 6. ปกติ (ตรวจแล้วและยังไม่ถึงกำหนด)
    return {
      status: 'checked',
      label: `ตรวจแล้ว ${asset.last_check_date}`,
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckSquare,
      priority: 3,
      days: daysUntil
    };
  };

  // Calculate Statistics
  const calculateStats = () => {
    let neverChecked = 0;
    let overdue = 0;
    let dueSoon = 0;
    let checked = 0;

    assets.forEach(asset => {
      const status = getCheckStatus(asset);
      if (status.status === 'never_checked') neverChecked++;
      else if (status.status === 'overdue') overdue++;
      else if (status.status === 'due_soon') dueSoon++;
      else if (status.status === 'checked') checked++;
    });

    const total = assets.length;
    const needsAction = neverChecked + overdue + dueSoon;
    const percentage = total > 0 ? ((checked / total) * 100).toFixed(1) : 0;

    return { neverChecked, overdue, dueSoon, checked, total, needsAction, percentage };
  };

  const stats = calculateStats();

  // Get Notifications
  const getNotifications = () => {
    const notifications = {
      urgent: [],
      dueSoon: [],
      upcoming: []
    };

    assets.forEach(asset => {
      const status = getCheckStatus(asset);
      
      if (status.status === 'never_checked' || status.status === 'overdue') {
        notifications.urgent.push({ ...asset, statusInfo: status });
      } else if (status.status === 'due_soon') {
        notifications.dueSoon.push({ ...asset, statusInfo: status });
      } else if (status.days && status.days <= 30) {
        notifications.upcoming.push({ ...asset, statusInfo: status });
      }
    });

    return notifications;
  };

  const notifications = getNotifications();

  // Get unique values for filters
  const uniqueBuildings = [...new Set(assets.map(a => a.building_name).filter(Boolean))];
  const uniqueFloors = [...new Set(assets.map(a => a.floor).filter(Boolean))];

  // Filter Assets
  const getFilteredAssets = () => {
    return assets.filter(asset => {
      // Search
      const matchSearch = 
        asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id?.toString().includes(searchTerm);

      if (!matchSearch) return false;

      // Status Filter
      if (filters.status !== 'all') {
        const status = getCheckStatus(asset);
        if (status.status !== filters.status) return false;
      }

      // Building Filter
      if (filters.building !== 'all' && asset.building_name !== filters.building) return false;

      // Floor Filter
      if (filters.floor !== 'all' && asset.floor !== filters.floor) return false;

      // Department Filter
      if (filters.department !== 'all' && asset.department_id != filters.department) return false;

      return true;
    });
  };

  const filteredAssets = getFilteredAssets();

  // Group Assets by Location
  const groupAssetsByLocation = (assetsList) => {
    const grouped = {};
    
    assetsList.forEach(asset => {
      const building = asset.building_name || 'ไม่ระบุอาคาร';
      const floor = asset.floor || 'ไม่ระบุชั้น';
      const room = asset.room_number || 'ไม่ระบุห้อง';

      if (!grouped[building]) grouped[building] = {};
      if (!grouped[building][floor]) grouped[building][floor] = {};
      if (!grouped[building][floor][room]) grouped[building][floor][room] = [];

      grouped[building][floor][room].push(asset);
    });

    return grouped;
  };

  const groupedAssets = groupAssetsByLocation(filteredAssets);

  // Handlers
  const handleOpenScheduleModal = (asset) => {
    setCurrentAsset(asset);
    const hasCustomInterval = asset.custom_interval_months && asset.schedule_id == 5;
    setScheduleForm({
      scheduleId: asset.schedule_id || 3,
      customMonths: asset.custom_interval_months || '',
      nextCheckDate: asset.next_check_date || '',
      checkNow: false,
      useCustomDate: !!asset.next_check_date && asset.schedule_id == 5
    });
    setShowScheduleModal(true);
  };
  
  const handleOpenRoomScheduleModal = (building, floor, room, roomAssets) => {
    setCurrentRoomForSchedule({ building, floor, room, assets: roomAssets });
    setRoomScheduleForm({
      scheduleId: 3,
      customMonths: '',
      nextCheckDate: '',
      useCustomDate: false
    });
    setShowRoomScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    try {
      // Validation
      if (scheduleForm.scheduleId == 5) {
        // ถ้าเลือก "กำหนดเอง" ต้องมี customMonths หรือ nextCheckDate
        if (!scheduleForm.customMonths && !scheduleForm.nextCheckDate) {
          toast.error('กรุณาระบุจำนวนเดือนหรือวันที่ตรวจครั้งถัดไป');
          return;
        }
      }
      
      setLoading(true);
      
      // คำนวณ next_check_date
      let nextCheckDate = null;
      if (scheduleForm.useCustomDate && scheduleForm.nextCheckDate) {
        // ใช้วันที่ที่กำหนดเอง
        nextCheckDate = scheduleForm.nextCheckDate;
      } else if (scheduleForm.scheduleId == 5 && scheduleForm.customMonths) {
        // ใช้จำนวนเดือนที่กำหนดเอง
        const months = parseInt(scheduleForm.customMonths);
        if (months > 0) {
          const date = new Date();
          date.setMonth(date.getMonth() + months);
          nextCheckDate = date.toISOString().split('T')[0];
        }
      } else if (scheduleForm.scheduleId != 5) {
        // ใช้รอบมาตรฐาน
        const selectedSchedule = schedules.find(s => s.schedule_id == scheduleForm.scheduleId);
        if (selectedSchedule && selectedSchedule.check_interval_months > 0) {
          const date = new Date();
          date.setMonth(date.getMonth() + selectedSchedule.check_interval_months);
          nextCheckDate = date.toISOString().split('T')[0];
        }
      }
      
      const payload = {
        asset_id: currentAsset.asset_id,
        schedule_id: scheduleForm.scheduleId,
        custom_interval_months: scheduleForm.scheduleId == 5 && scheduleForm.customMonths ? parseInt(scheduleForm.customMonths) : null,
        next_check_date: nextCheckDate
      };

      await api.post('/check-schedules/assign-asset', payload);
      
      toast.success('กำหนดรอบการตรวจสำเร็จ');
      setShowScheduleModal(false);
      setCurrentAsset(null);
      fetchData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกได้');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveRoomSchedule = async () => {
    try {
      // Validation
      if (roomScheduleForm.scheduleId == 5) {
        if (!roomScheduleForm.customMonths) {
          toast.error('กรุณาระบุจำนวนเดือน');
          return;
        }
      }
      
      setLoading(true);
      
      // ดึง location_id จาก asset แรก
      const firstAsset = currentRoomForSchedule.assets[0];
      if (!firstAsset.location_id) {
        toast.error('ครุภัณฑ์ในห้องนี้ไม่มี location_id');
        return;
      }
      
      const payload = {
        location_id: firstAsset.location_id,
        schedule_id: roomScheduleForm.scheduleId,
        custom_interval_months: roomScheduleForm.scheduleId == 5 && roomScheduleForm.customMonths ? parseInt(roomScheduleForm.customMonths) : null
      };

      const response = await api.post('/check-schedules/assign-location', payload);
      
      toast.success(`กำหนดรอบการตรวจทั้งห้องสำเร็จ (${currentRoomForSchedule.assets.length} รายการ)`);
      setShowRoomScheduleModal(false);
      setCurrentRoomForSchedule(null);
      fetchData();
    } catch (error) {
      console.error('Error saving room schedule:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckModal = (asset) => {
    setCurrentAsset(asset);
    setCheckForm({
      status: 'ใช้งานได้',
      remark: ''
    });
    setShowCheckModal(true);
  };

  const handleSaveCheck = async () => {
    try {
      setLoading(true);
      
      await api.post('/checks', {
        asset_id: currentAsset.asset_id,
        user_id: user.user_id,
        check_date: new Date().toISOString().split('T')[0],
        check_status: checkForm.status,
        remark: checkForm.remark
      });

      toast.success('บันทึกการตรวจสอบสำเร็จ');
      setShowCheckModal(false);
      setCurrentAsset(null);
      fetchData();
    } catch (error) {
      console.error('Error saving check:', error);
      toast.error('ไม่สามารถบันทึกได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoomCheck = (building, floor, room, roomAssets) => {
    setCurrentRoom({ building, floor, room, assets: roomAssets });
    setCheckForm({
      status: 'ใช้งานได้',
      remark: ''
    });
    setShowRoomCheckModal(true);
  };

  const handleSaveRoomCheck = async () => {
    try {
      setLoading(true);
      
      // แปลงสถานะจากข้อความเป็นสถานะจริง
      const statusMap = {
        'ใช้งานได้': 'ใช้งานได้',
        'รอซ่อม': 'รอซ่อม',
        'รอจำหน่าย': 'รอจำหน่าย',
        'จำหน่ายแล้ว': 'จำหน่ายแล้ว',
        'ไม่พบ': 'ไม่พบ'
      };
      
      const actualStatus = statusMap[checkForm.status] || checkForm.status;
      
      // บันทึกการตรวจทีละรายการ
      const results = [];
      const errors = [];
      
      for (const asset of currentRoom.assets) {
        try {
          const response = await api.post('/checks', {
            asset_id: asset.asset_id,
            check_date: new Date().toISOString().split('T')[0],
            check_status: actualStatus,
            remark: checkForm.remark
          });
          
          if (response.data.success) {
            results.push(asset.asset_id);
          } else {
            errors.push({
              asset_id: asset.asset_id,
              asset_name: asset.asset_name,
              error: response.data.message || 'ไม่สามารถบันทึกได้'
            });
          }
        } catch (error) {
          errors.push({
            asset_id: asset.asset_id,
            asset_name: asset.asset_name,
            error: error.response?.data?.message || 'ไม่สามารถบันทึกได้'
          });
        }
      }

      // แสดงผลลัพธ์
      if (errors.length === 0) {
        toast.success(`บันทึกการตรวจทั้งห้องสำเร็จ (${results.length} รายการ)`);
      } else if (results.length > 0) {
        toast.success(`บันทึกสำเร็จ ${results.length} รายการ แต่มี ${errors.length} รายการที่บันทึกไม่สำเร็จ`);
        console.error('Errors:', errors);
      } else {
        toast.error(`ไม่สามารถบันทึกได้ (${errors.length} รายการ)`);
        console.error('All errors:', errors);
      }
      
      setShowRoomCheckModal(false);
      setCurrentRoom(null);
      
      // รอสักครู่เพื่อให้ database transaction commit และ trigger ทำงาน
      // ใช้ forceRefresh เพื่อให้แน่ใจว่าข้อมูลถูกดึงมาใหม่
      setTimeout(() => {
        fetchData(true);
      }, 1000);
    } catch (error) {
      console.error('Error saving room check:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissNotification = async (assetId) => {
    try {
      // API Call to dismiss notification
      console.log('Dismissing notification for:', assetId);
      // await api.put(`/check-schedules/dismiss/${assetId}`);
      toast.success('ซ่อนการแจ้งเตือนแล้ว');
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      building: 'all',
      floor: 'all',
      department: 'all'
    });
    setSearchTerm('');
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

  if (loading && assets.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-800">ตรวจสอบครุภัณฑ์</h1>
        <p className="text-gray-600 mt-1">จัดการและติดตามการตรวจสอบครุภัณฑ์ทั้งหมด</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'check'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckSquare size={20} />
              <span>ตรวจสอบครุภัณฑ์</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell size={20} />
              <span>การแจ้งเตือน</span>
              {stats.needsAction > 0 && (
                <span className="absolute top-2 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.needsAction}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'check' ? (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">ทั้งหมด</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <BarChart3 size={32} className="opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">ยังไม่เคยตรวจ</p>
                  <p className="text-3xl font-bold">{stats.neverChecked}</p>
                </div>
                <AlertCircle size={32} className="opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">เลยกำหนด</p>
                  <p className="text-3xl font-bold">{stats.overdue}</p>
                </div>
                <AlertTriangle size={32} className="opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">ใกล้กำหนด</p>
                  <p className="text-3xl font-bold">{stats.dueSoon}</p>
                </div>
                <Clock size={32} className="opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">ตรวจแล้ว</p>
                  <p className="text-3xl font-bold">{stats.checked}</p>
                  <div className="w-full bg-green-400 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-white h-1.5 rounded-full transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
                <TrendingUp size={32} className="opacity-80" />
              </div>
            </div>
          </div>

          {/* Search and View Mode */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="ค้นหาครุภัณฑ์..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors"
                >
                  <FilterIcon size={20} />
                  ตัวกรอง
                </button>
              </div>

              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'grouped'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid size={18} />
                  <span className="font-medium">จัดกลุ่ม</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List size={18} />
                  <span className="font-medium">รายการ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Assets Display */}
          {viewMode === 'grouped' ? (
            <GroupedView 
              groupedAssets={groupedAssets}
              expandedBuildings={expandedBuildings}
              expandedFloors={expandedFloors}
              expandedRooms={expandedRooms}
              toggleBuilding={toggleBuilding}
              toggleFloor={toggleFloor}
              toggleRoom={toggleRoom}
              getCheckStatus={getCheckStatus}
              onCheck={handleOpenCheckModal}
              onSchedule={handleOpenScheduleModal}
              onRoomCheck={handleOpenRoomCheck}
              onRoomSchedule={handleOpenRoomScheduleModal}
            />
          ) : (
            <ListView 
              assets={filteredAssets}
              getCheckStatus={getCheckStatus}
              onCheck={handleOpenCheckModal}
              onSchedule={handleOpenScheduleModal}
            />
          )}

        </>
      ) : (
        <NotificationsTab 
          notifications={notifications}
          onCheck={handleOpenCheckModal}
          onSchedule={handleOpenScheduleModal}
          onDismiss={handleDismissNotification}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          filters={filters}
          setFilters={setFilters}
          uniqueBuildings={uniqueBuildings}
          uniqueFloors={uniqueFloors}
          departments={departments}
          onClose={() => setShowFilterModal(false)}
          onReset={handleResetFilters}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && currentAsset && (
        <ScheduleModal
          asset={currentAsset}
          schedules={schedules}
          scheduleForm={scheduleForm}
          setScheduleForm={setScheduleForm}
          onSave={handleSaveSchedule}
          onClose={() => setShowScheduleModal(false)}
          loading={loading}
        />
      )}

      {/* Check Modal */}
      {showCheckModal && currentAsset && (
        <CheckModal
          asset={currentAsset}
          checkForm={checkForm}
          setCheckForm={setCheckForm}
          onSave={handleSaveCheck}
          onClose={() => setShowCheckModal(false)}
          loading={loading}
        />
      )}

      {/* Room Check Modal */}
      {showRoomCheckModal && currentRoom && (
        <RoomCheckModal
          room={currentRoom}
          checkForm={checkForm}
          setCheckForm={setCheckForm}
          onSave={handleSaveRoomCheck}
          onClose={() => setShowRoomCheckModal(false)}
          loading={loading}
        />
      )}

      {/* Room Schedule Modal */}
      {showRoomScheduleModal && currentRoomForSchedule && (
        <RoomScheduleModal
          room={currentRoomForSchedule}
          schedules={schedules}
          scheduleForm={roomScheduleForm}
          setScheduleForm={setRoomScheduleForm}
          onSave={handleSaveRoomSchedule}
          onClose={() => setShowRoomScheduleModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

// ============================================================
// GROUPED VIEW COMPONENT
// ============================================================
function GroupedView({ 
  groupedAssets, expandedBuildings, expandedFloors, expandedRooms,
  toggleBuilding, toggleFloor, toggleRoom, getCheckStatus,
  onCheck, onSchedule, onRoomCheck, onRoomSchedule
}) {
  if (Object.keys(groupedAssets).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg text-gray-500">ไม่พบข้อมูลครุภัณฑ์</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedAssets).map(([building, floors]) => {
        const buildingAssets = Object.values(floors).flatMap(f => Object.values(f)).flat();
        const buildingExpanded = expandedBuildings[building];

        return (
          <div key={building} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div
              onClick={() => toggleBuilding(building)}
              className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors border-b-2 border-blue-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Building className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{building}</h3>
                  <p className="text-sm text-gray-600 mt-1">{buildingAssets.length} รายการ</p>
                </div>
              </div>
              {buildingExpanded ? 
                <ChevronDown className="text-gray-600" size={24} /> : 
                <ChevronRight className="text-gray-600" size={24} />
              }
            </div>

            {buildingExpanded && (
              <div className="p-4 space-y-3">
                {Object.entries(floors).map(([floor, rooms]) => {
                  const floorKey = `${building}-${floor}`;
                  const floorExpanded = expandedFloors[floorKey];

                  return (
                    <div key={floorKey} className="border-l-4 border-indigo-400 bg-gray-50 rounded-lg overflow-hidden">
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
                          </div>
                        </div>
                        {floorExpanded ? 
                          <ChevronDown className="text-gray-500" size={20} /> : 
                          <ChevronRight className="text-gray-500" size={20} />
                        }
                      </div>

                      {floorExpanded && (
                        <div className="p-4 space-y-2 bg-white">
                          {Object.entries(rooms).map(([room, roomAssets]) => {
                            const roomKey = `${building}-${floor}-${room}`;
                            const roomExpanded = expandedRooms[roomKey];

                            return (
                              <div key={roomKey} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div 
                                      onClick={() => toggleRoom(building, floor, room)}
                                      className="flex items-center gap-2 flex-1 cursor-pointer"
                                    >
                                      <MapPin className="text-purple-600" size={18} />
                                      <span className="font-semibold text-gray-800">ห้อง {room}</span>
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                        {roomAssets.length} รายการ
                                      </span>
                                      {roomExpanded ? 
                                        <ChevronDown className="text-gray-500" size={18} /> : 
                                        <ChevronRight className="text-gray-500" size={18} />
                                      }
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => onRoomCheck(building, floor, room, roomAssets)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                      >
                                        <CheckSquare size={14} />
                                        ตรวจทั้งห้อง
                                      </button>
                                      <button
                                        onClick={() => onRoomSchedule(building, floor, room, roomAssets)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                      >
                                        <Settings size={14} />
                                        กำหนดรอบ
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {roomExpanded && (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ชื่อครุภัณฑ์</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {roomAssets.map(asset => {
                                          const status = getCheckStatus(asset);
                                          const StatusIcon = status.icon;
                                          
                                          // Debug log for asset 14
                                          if (asset.asset_id === 14) {
                                            console.log('Asset 14 in table:', {
                                              asset_id: asset.asset_id,
                                              asset_name: asset.asset_name,
                                              last_check_date: asset.last_check_date,
                                              next_check_date: asset.next_check_date,
                                              status: status.status,
                                              label: status.label
                                            });
                                          }

                                          return (
                                            <tr key={asset.asset_id} className="hover:bg-gray-50">
                                              <td className="px-4 py-3 text-sm text-gray-900">{asset.asset_name}</td>
                                              <td className="px-4 py-3 text-sm text-gray-600">{asset.serial_number || '-'}</td>
                                              <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                                  <StatusIcon size={12} />
                                                  {status.label}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={() => onCheck(asset)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="ตรวจสอบ"
                                                  >
                                                    <Eye size={18} />
                                                  </button>
                                                  <button
                                                    onClick={() => onSchedule(asset)}
                                                    className="text-purple-600 hover:text-purple-800 transition-colors"
                                                    title="กำหนดรอบ"
                                                  >
                                                    <Settings size={18} />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
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
}

// ============================================================
// LIST VIEW COMPONENT
// ============================================================
function ListView({ assets, getCheckStatus, onCheck, onSchedule }) {
  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัส</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อครุภัณฑ์</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map(asset => {
              const status = getCheckStatus(asset);
              const StatusIcon = status.icon;

              return (
                <tr key={asset.asset_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.asset_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{asset.asset_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.serial_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCheck(asset)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="ตรวจสอบ"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onSchedule(asset)}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                        title="กำหนดรอบ"
                      >
                        <Settings size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// NOTIFICATIONS TAB COMPONENT
// ============================================================
function NotificationsTab({ notifications, onCheck, onSchedule, onDismiss }) {
  return (
    <div className="space-y-6">
      {/* Urgent Notifications */}
      {notifications.urgent.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-red-50 border-b-2 border-red-200 p-4">
            <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertCircle size={24} />
              ต้องดำเนินการด่วน ({notifications.urgent.length} รายการ)
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {notifications.urgent.map(asset => {
              const StatusIcon = asset.statusInfo.icon;
              return (
                <div key={asset.asset_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className="text-red-600" size={20} />
                        <h3 className="font-semibold text-gray-800">{asset.asset_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${asset.statusInfo.color}`}>
                          {asset.statusInfo.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 ml-8">
                        <div>Serial: {asset.serial_number || '-'}</div>
                        <div>สถานที่: {asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}</div>
                        {asset.created_at && <div>เพิ่มเมื่อ: {asset.created_at}</div>}
                        {asset.next_check_date && <div>กำหนดตรวจ: {asset.next_check_date}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCheck(asset)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <CheckSquare size={16} />
                        ตรวจสอบเลย
                      </button>
                      <button
                        onClick={() => onSchedule(asset)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Settings size={16} />
                        กำหนดรอบ
                      </button>
                      <button
                        onClick={() => onDismiss(asset.asset_id)}
                        className="text-gray-400 hover:text-gray-600 p-2"
                      >
                        <EyeOff size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Due Soon */}
      {notifications.dueSoon.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-yellow-50 border-b-2 border-yellow-200 p-4">
            <h2 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
              <Clock size={24} />
              ใกล้ถึงกำหนด 7 วัน ({notifications.dueSoon.length} รายการ)
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {notifications.dueSoon.map(asset => (
              <div key={asset.asset_id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{asset.asset_name}</p>
                  <p className="text-sm text-gray-600">
                    {asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number} • {asset.statusInfo.label}
                  </p>
                </div>
                <button
                  onClick={() => onCheck(asset)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  ตรวจสอบ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-purple-600" />
          กำหนดการตรวจสอบ
        </h2>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            💡 ระบบจะแจ้งเตือนอัตโนมัติเมื่อถึงกำหนดตรวจสอบครุภัณฑ์
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODALS
// ============================================================

// Filter Modal
function FilterModal({ filters, setFilters, uniqueBuildings, uniqueFloors, departments, onClose, onReset }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FilterIcon size={24} />
              ตัวกรอง
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะการตรวจ</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                <option value="never_checked">ยังไม่เคยตรวจ</option>
                <option value="overdue">เลยกำหนด</option>
                <option value="due_soon">ใกล้กำหนด</option>
                <option value="checked">ตรวจแล้ว</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">อาคาร</label>
              <select
                value={filters.building}
                onChange={(e) => setFilters({...filters, building: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                {uniqueBuildings.map(building => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชั้น</label>
              <select
                value={filters.floor}
                onChange={(e) => setFilters({...filters, floor: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                {uniqueFloors.sort((a, b) => a - b).map(floor => (
                  <option key={floor} value={floor}>ชั้น {floor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หน่วยงาน</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">ทั้งหมด</option>
                {departments.map(dept => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onReset}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              รีเซ็ต
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold"
            >
              ใช้ตัวกรอง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Schedule Modal
function ScheduleModal({ asset, schedules, scheduleForm, setScheduleForm, onSave, onClose, loading }) {
  const isCustomSchedule = scheduleForm.scheduleId == 5;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">กำหนดรอบการตรวจ</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">ครุภัณฑ์</p>
            <p className="font-bold text-gray-800">{asset.asset_name}</p>
            <p className="text-sm text-gray-600">Serial: {asset.serial_number || '-'}</p>
            {asset.next_check_date && (
              <p className="text-xs text-gray-500 mt-1">
                กำหนดตรวจครั้งถัดไป: {new Date(asset.next_check_date).toLocaleDateString('th-TH')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รอบการตรวจ <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleForm.scheduleId}
              onChange={(e) => {
                const newScheduleId = parseInt(e.target.value);
                setScheduleForm({
                  ...scheduleForm, 
                  scheduleId: newScheduleId,
                  useCustomDate: newScheduleId == 5 ? scheduleForm.useCustomDate : false,
                  customMonths: newScheduleId != 5 ? '' : scheduleForm.customMonths,
                  nextCheckDate: newScheduleId != 5 ? '' : scheduleForm.nextCheckDate
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {schedules.map(schedule => (
                <option key={schedule.schedule_id} value={schedule.schedule_id}>
                  {schedule.name} {schedule.check_interval_months > 0 ? `(${schedule.check_interval_months} เดือน)` : ''}
                </option>
              ))}
            </select>
          </div>

          {isCustomSchedule && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  💡 เมื่อเลือก "กำหนดเอง" กรุณาระบุจำนวนเดือนหรือวันที่ตรวจครั้งถัดไป
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วิธีกำหนดรอบ
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!scheduleForm.useCustomDate}
                      onChange={() => setScheduleForm({...scheduleForm, useCustomDate: false, nextCheckDate: ''})}
                      className="text-blue-600"
                    />
                    <span className="text-sm">กำหนดจำนวนเดือน</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={scheduleForm.useCustomDate}
                      onChange={() => setScheduleForm({...scheduleForm, useCustomDate: true, customMonths: ''})}
                      className="text-blue-600"
                    />
                    <span className="text-sm">กำหนดวันที่ตรวจครั้งถัดไป</span>
                  </label>
                </div>
              </div>

              {!scheduleForm.useCustomDate ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนเดือน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={scheduleForm.customMonths}
                    onChange={(e) => setScheduleForm({...scheduleForm, customMonths: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="เช่น 3, 6, 12"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ระบบจะคำนวณวันที่ตรวจครั้งถัดไปจากวันนี้ + จำนวนเดือนที่กำหนด
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่ตรวจครั้งถัดไป <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.nextCheckDate}
                    onChange={(e) => setScheduleForm({...scheduleForm, nextCheckDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          {!isCustomSchedule && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                ✅ ระบบจะคำนวณวันที่ตรวจครั้งถัดไปอัตโนมัติตามรอบที่เลือก
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={loading || (isCustomSchedule && !scheduleForm.customMonths && !scheduleForm.nextCheckDate)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Room Schedule Modal
function RoomScheduleModal({ room, schedules, scheduleForm, setScheduleForm, onSave, onClose, loading }) {
  const isCustomSchedule = scheduleForm.scheduleId == 5;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">กำหนดรอบการตรวจทั้งห้อง</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">คุณกำลังกำหนดรอบการตรวจทั้งห้อง</p>
            <p className="font-bold text-gray-800">
              {room.building} ชั้น {room.floor} ห้อง {room.room}
            </p>
            <p className="text-sm text-gray-600 mt-1">จำนวน: {room.assets.length} รายการ</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-gray-600 mb-2">รายการครุภัณฑ์:</p>
            <ul className="space-y-1">
              {room.assets.map(asset => (
                <li key={asset.asset_id} className="text-sm text-gray-700 flex items-center gap-2">
                  <Settings size={14} className="text-purple-600" />
                  {asset.asset_name} ({asset.serial_number || '-'})
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รอบการตรวจ <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleForm.scheduleId}
              onChange={(e) => {
                const newScheduleId = parseInt(e.target.value);
                setScheduleForm({
                  ...scheduleForm, 
                  scheduleId: newScheduleId,
                  customMonths: newScheduleId != 5 ? '' : scheduleForm.customMonths
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {schedules.map(schedule => (
                <option key={schedule.schedule_id} value={schedule.schedule_id}>
                  {schedule.name} {schedule.check_interval_months > 0 ? `(${schedule.check_interval_months} เดือน)` : ''}
                </option>
              ))}
            </select>
          </div>

          {isCustomSchedule && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  💡 เมื่อเลือก "กำหนดเอง" กรุณาระบุจำนวนเดือน
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเดือน <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={scheduleForm.customMonths}
                  onChange={(e) => setScheduleForm({...scheduleForm, customMonths: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="เช่น 3, 6, 12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ระบบจะคำนวณวันที่ตรวจครั้งถัดไปจากวันนี้ + จำนวนเดือนที่กำหนด
                </p>
              </div>
            </>
          )}

          {!isCustomSchedule && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                ✅ ระบบจะคำนวณวันที่ตรวจครั้งถัดไปอัตโนมัติตามรอบที่เลือก
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={loading || (isCustomSchedule && !scheduleForm.customMonths)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {loading ? 'กำลังบันทึก...' : 'บันทึกทั้งห้อง'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Check Modal
function CheckModal({ asset, checkForm, setCheckForm, onSave, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">บันทึกการตรวจสอบ</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-bold text-gray-800 mb-1">{asset.asset_name}</p>
            <p className="text-sm text-gray-600">Serial: {asset.serial_number || '-'}</p>
            <p className="text-sm text-gray-600">
              {asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะหลังตรวจสอบ</label>
            <select
              value={checkForm.status}
              onChange={(e) => setCheckForm({...checkForm, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ใช้งานได้">ใช้งานได้</option>
              <option value="รอซ่อม">รอซ่อม</option>
              <option value="รอจำหน่าย">รอจำหน่าย</option>
              <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
              <option value="ไม่พบ">ไม่พบ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
            <textarea
              value={checkForm.remark}
              onChange={(e) => setCheckForm({...checkForm, remark: e.target.value})}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckSquare size={20} />
              {loading ? 'กำลังบันทึก...' : 'บันทึกการตรวจสอบ'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Room Check Modal
function RoomCheckModal({ room, checkForm, setCheckForm, onSave, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">ตรวจสอบทั้งห้อง</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">คุณกำลังตรวจสอบทั้งห้อง</p>
            <p className="font-bold text-gray-800">
              {room.building} ชั้น {room.floor} ห้อง {room.room}
            </p>
            <p className="text-sm text-gray-600 mt-1">จำนวน: {room.assets.length} รายการ</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-gray-600 mb-2">รายการครุภัณฑ์:</p>
            <ul className="space-y-1">
              {room.assets.map(asset => (
                <li key={asset.asset_id} className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckSquare size={14} className="text-blue-600" />
                  {asset.asset_name} ({asset.serial_number || '-'})
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะทั้งห้อง</label>
            <select
              value={checkForm.status}
              onChange={(e) => setCheckForm({...checkForm, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ใช้งานได้">ใช้งานได้ทั้งหมด</option>
              <option value="รอซ่อม">บางรายการรอซ่อม</option>
              <option value="รอจำหน่าย">บางรายการรอจำหน่าย</option>
              <option value="จำหน่ายแล้ว">บางรายการจำหน่ายแล้ว</option>
              <option value="ไม่พบ">มีครุภัณฑ์สูญหาย</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
            <textarea
              value={checkForm.remark}
              onChange={(e) => setCheckForm({...checkForm, remark: e.target.value})}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckSquare size={20} />
              {loading ? 'กำลังบันทึก...' : 'บันทึกทั้งห้อง'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition-colors font-semibold"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}