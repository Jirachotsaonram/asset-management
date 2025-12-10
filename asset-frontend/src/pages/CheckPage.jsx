import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  CheckSquare,
  Search,
  Calendar,
  Clock,
  Bell,
  AlertCircle,
  CheckCircle,
  Building,
  Layers,
  MapPin,
  Grid,
  List,
  Filter,
  X as XIcon,
  ChevronDown,
  ChevronRight,
  Eye,
  Settings,
  Save,
  RotateCcw
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function CheckPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" หรือ "list"
  const [activeTab, setActiveTab] = useState("check"); // "check", "schedule", "notifications"
  
  // State สำหรับ Filter
  const [filters, setFilters] = useState({
    status: "all", // all, checked, pending
    building: "all",
    floor: "all",
    urgency: "all" // all, overdue, urgent, normal
  });

  // State สำหรับการจัดกลุ่ม
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});

  // State สำหรับ Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleType, setScheduleType] = useState("single"); // "single" หรือ "room"
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    schedule_id: "1",
    custom_interval_months: "",
    custom_next_date: "",
    notify_before_days: 14
  });

  // State สำหรับ Bulk Check Modal
  const [showBulkCheckModal, setShowBulkCheckModal] = useState(false);
  const [bulkCheckData, setBulkCheckData] = useState({
    location_id: "",
    check_status: "ใช้งานได้",
    remark: ""
  });

  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, schedulesRes, notificationsRes, locationsRes, departmentsRes] = await Promise.all([
        api.get("/assets"),
        api.get("/check-schedules"),
        api.get("/check-schedules/notifications"),
        api.get("/locations"),
        api.get("/departments")
      ]);

      setAssets(assetsRes.data.data || []);
      setSchedules(schedulesRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);
      setLocations(locationsRes.data.data || []);
      setDepartments(departmentsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันตรวจสอบสถานะการตรวจ
  const getCheckStatus = (asset) => {
    if (!asset.next_check_date) return "no-schedule";
    
    const today = new Date();
    const nextCheck = new Date(asset.next_check_date);
    const daysDiff = Math.ceil((nextCheck - today) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return "overdue";
    if (daysDiff === 0) return "today";
    if (daysDiff <= 7) return "urgent";
    return "normal";
  };

  // ฟังก์ชัน Filter
  const getFilteredAssets = () => {
    return assets.filter((asset) => {
      // Search
      const matchSearch = 
        asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id?.toString().includes(searchTerm) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Filter by Check Status
      if (filters.status !== "all") {
        const checkStatus = getCheckStatus(asset);
        if (filters.status === "checked" && checkStatus !== "normal") return false;
        if (filters.status === "pending" && (checkStatus === "overdue" || checkStatus === "urgent" || checkStatus === "today")) return false;
      }

      // Filter by Building
      if (filters.building !== "all" && asset.building_name !== filters.building) return false;

      // Filter by Floor
      if (filters.floor !== "all" && asset.floor !== filters.floor) return false;

      // Filter by Urgency
      if (filters.urgency !== "all") {
        const checkStatus = getCheckStatus(asset);
        if (filters.urgency === "overdue" && checkStatus !== "overdue") return false;
        if (filters.urgency === "urgent" && checkStatus !== "urgent" && checkStatus !== "today") return false;
        if (filters.urgency === "normal" && checkStatus !== "normal") return false;
      }

      return true;
    });
  };

  const filteredAssets = getFilteredAssets();

  // Get unique buildings and floors
  const uniqueBuildings = [...new Set(assets.map(a => a.building_name).filter(Boolean))];
  const uniqueFloors = [...new Set(assets.map(a => a.floor).filter(Boolean))];

  // จัดกลุ่มครุภัณฑ์ตาม Location
  const groupAssetsByLocation = (assetList) => {
    const grouped = {};

    assetList.forEach((asset) => {
      const building = asset.building_name || "ไม่ระบุอาคาร";
      const floor = asset.floor || "ไม่ระบุชั้น";
      const room = asset.room_number || "ไม่ระบุห้อง";

      if (!grouped[building]) grouped[building] = {};
      if (!grouped[building][floor]) grouped[building][floor] = {};
      if (!grouped[building][floor][room]) grouped[building][floor][room] = [];

      grouped[building][floor][room].push(asset);
    });

    return grouped;
  };

  // Toggle Functions
  const toggleBuilding = (building) => {
    setExpandedBuildings((prev) => ({
      ...prev,
      [building]: !prev[building],
    }));
  };

  const toggleFloor = (building, floor) => {
    const key = `${building}-${floor}`;
    setExpandedFloors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // กำหนดรอบการตรวจรายชิ้น
  const handleScheduleSingleAsset = (asset) => {
    setSelectedAssets([asset]);
    setScheduleType("single");
    setScheduleForm({
      schedule_id: "1",
      custom_interval_months: "",
      custom_next_date: "",
      notify_before_days: 14
    });
    setShowScheduleModal(true);
  };

  // กำหนดรอบการตรวจทั้งห้อง
  const handleScheduleRoom = (roomAssets, building, floor, room) => {
    setSelectedAssets(roomAssets);
    setScheduleType("room");
    setScheduleForm({
      schedule_id: "1",
      custom_interval_months: "",
      custom_next_date: "",
      notify_before_days: 14
    });
    setShowScheduleModal(true);
  };

  // บันทึกกำหนดการตรวจ
  const handleSaveSchedule = async () => {
    try {
      setLoading(true);

      if (scheduleType === "single") {
        // กำหนดรายชิ้น
        await api.post("/check-schedules/assign-asset", {
          asset_id: selectedAssets[0].asset_id,
          ...scheduleForm
        });
        toast.success("กำหนดรอบการตรวจสำเร็จ");
      } else {
        // กำหนดทั้งห้อง - ใช้ location_id
        const locationId = selectedAssets[0].location_id;
        await api.post("/check-schedules/assign-location", {
          location_id: locationId,
          ...scheduleForm
        });
        toast.success(`กำหนดรอบการตรวจสำเร็จ (${selectedAssets.length} รายการ)`);
      }

      setShowScheduleModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("ไม่สามารถกำหนดรอบการตรวจได้");
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบทั้งห้อง
  const handleBulkCheck = async () => {
    if (!bulkCheckData.location_id) {
      toast.error("กรุณาเลือกห้อง");
      return;
    }

    try {
      setLoading(true);

      // ดึงครุภัณฑ์ทั้งหมดในห้องนั้น
      const roomAssets = assets.filter(a => a.location_id === parseInt(bulkCheckData.location_id));

      // บันทึกการตรวจทีละชิ้น
      let successCount = 0;
      for (const asset of roomAssets) {
        try {
          await api.post("/checks", {
            asset_id: asset.asset_id,
            user_id: user.user_id,
            check_date: new Date().toISOString().split("T")[0],
            check_status: bulkCheckData.check_status,
            remark: `${bulkCheckData.remark || "ตรวจสอบแบบกลุ่ม"} - ${asset.building_name} ชั้น ${asset.floor} ห้อง ${asset.room_number}`
          });
          successCount++;
        } catch (err) {
          console.error(`Error checking asset ${asset.asset_id}:`, err);
        }
      }

      toast.success(`✅ ตรวจสอบสำเร็จ ${successCount}/${roomAssets.length} รายการ`);
      setShowBulkCheckModal(false);
      setBulkCheckData({
        location_id: "",
        check_status: "ใช้งานได้",
        remark: ""
      });
      fetchData();
    } catch (error) {
      console.error("Error bulk checking:", error);
      toast.error("ไม่สามารถตรวจสอบได้");
    } finally {
      setLoading(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      status: "all",
      building: "all",
      floor: "all",
      urgency: "all"
    });
  };

  // Get Status Badge
  const getStatusBadge = (asset) => {
    const status = getCheckStatus(asset);
    
    const badges = {
      "overdue": { color: "bg-red-100 text-red-800", text: "เลยกำหนด", icon: AlertCircle },
      "today": { color: "bg-orange-100 text-orange-800", text: "ตรวจวันนี้", icon: Clock },
      "urgent": { color: "bg-yellow-100 text-yellow-800", text: "เร่งด่วน", icon: Bell },
      "normal": { color: "bg-green-100 text-green-800", text: "ปกติ", icon: CheckCircle },
      "no-schedule": { color: "bg-gray-100 text-gray-800", text: "ยังไม่กำหนด", icon: Calendar }
    };

    const badge = badges[status] || badges["no-schedule"];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  // Calculate Stats
  const calculateStats = (assetList) => {
    const overdue = assetList.filter(a => getCheckStatus(a) === "overdue").length;
    const urgent = assetList.filter(a => ["urgent", "today"].includes(getCheckStatus(a))).length;
    const normal = assetList.filter(a => getCheckStatus(a) === "normal").length;
    const noSchedule = assetList.filter(a => getCheckStatus(a) === "no-schedule").length;

    return { overdue, urgent, normal, noSchedule, total: assetList.length };
  };

  // Render Asset Row
  const renderAssetRow = (asset) => {
    const checkStatus = getCheckStatus(asset);
    const scheduleName = schedules.find(s => s.schedule_id === asset.schedule_id)?.name || "ไม่ระบุ";

    return (
      <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-blue-600" size={20} />
            <div>
              <div className="text-sm font-medium text-gray-900">{asset.asset_name}</div>
              <div className="text-xs text-gray-500">ID: {asset.asset_id}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {asset.building_name} ชั้น {asset.floor} ห้อง {asset.room_number}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {asset.last_check_date ? (
            <div>
              <div className="font-medium">{asset.last_check_date}</div>
              <div className="text-xs text-gray-500">{asset.last_checker || "-"}</div>
            </div>
          ) : (
            <span className="text-gray-400">ยังไม่เคยตรวจ</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm">
          {asset.next_check_date ? (
            <div>
              <div className="font-medium text-blue-600">{asset.next_check_date}</div>
              <div className="text-xs text-gray-500">{scheduleName}</div>
            </div>
          ) : (
            <span className="text-gray-400">ยังไม่กำหนด</span>
          )}
        </td>
        <td className="px-6 py-4">
          {getStatusBadge(asset)}
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => handleScheduleSingleAsset(asset)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="กำหนดรอบการตรวจ"
          >
            <Settings size={18} />
          </button>
        </td>
      </tr>
    );
  };

  // Render Grouped View
  const renderGroupedView = () => {
    const groupedAssets = groupAssetsByLocation(filteredAssets);

    return (
      <div className="space-y-4">
        {Object.entries(groupedAssets).map(([building, floors]) => {
          const buildingAssets = Object.values(floors).flatMap(rooms => Object.values(rooms)).flat();
          const stats = calculateStats(buildingAssets);
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
                      ทั้งหมด: {stats.total} | 
                      <span className="text-red-600 ml-2">เลยกำหนด: {stats.overdue}</span> | 
                      <span className="text-yellow-600 ml-2">เร่งด่วน: {stats.urgent}</span> | 
                      <span className="text-green-600 ml-2">ปกติ: {stats.normal}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                  {isExpanded ? <ChevronDown className="text-gray-600" size={24} /> : <ChevronRight className="text-gray-600" size={24} />}
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
                                {floorStats.total} รายการ | 
                                <span className="text-red-600 ml-1">{floorStats.overdue} เลย</span> |
                                <span className="text-yellow-600 ml-1">{floorStats.urgent} เร่งด่วน</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-indigo-600">{floorStats.total}</span>
                            {isFloorExpanded ? <ChevronDown className="text-gray-500" size={20} /> : <ChevronRight className="text-gray-500" size={20} />}
                          </div>
                        </div>

                        {/* Rooms */}
                        {isFloorExpanded && (
                          <div className="p-4 space-y-2 bg-white">
                            {Object.entries(rooms).map(([room, roomAssets]) => {
                              const roomStats = calculateStats(roomAssets);

                              return (
                                <div key={room} className="border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Room Header */}
                                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="text-purple-600" size={18} />
                                        <span className="font-semibold text-gray-800">ห้อง {room}</span>
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                          {roomStats.total} รายการ
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleScheduleRoom(roomAssets, building, floor, room)}
                                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                      >
                                        <Settings size={14} />
                                        กำหนดทั้งห้อง
                                      </button>
                                    </div>
                                  </div>

                                  {/* Assets Table */}
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ครุภัณฑ์</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานที่</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ตรวจล่าสุด</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ตรวจครั้งถัดไป</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {roomAssets.map((asset) => renderAssetRow(asset))}
                                      </tbody>
                                    </table>
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
        })}
      </div>
    );
  };

  // Render List View
  const renderListView = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ครุภัณฑ์</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ตรวจล่าสุด</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ตรวจครั้งถัดไป</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map((asset) => renderAssetRow(asset))}
          </tbody>
        </table>
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">ไม่พบข้อมูล</p>
        </div>
      )}
    </div>
  );

  // Render Notifications Tab
  const renderNotifications = () => (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        notifications.map((notif) => {
          const urgencyColors = {
            "เลยกำหนด": "border-red-500 bg-red-50",
            "วันนี้": "border-orange-500 bg-orange-50",
            "เร่งด่วน": "border-yellow-500 bg-yellow-50",
            "ปกติ": "border-blue-500 bg-blue-50"
          };

          return (
            <div
              key={notif.asset_schedule_id}
              className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${urgencyColors[notif.urgency_level] || urgencyColors["ปกติ"]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="text-red-600" size={24} />
                    <h3 className="text-lg font-bold text-gray-800">{notif.asset_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      notif.urgency_level === "เลยกำหนด" ? "bg-red-100 text-red-800" :
                      notif.urgency_level === "วันนี้" ? "bg-orange-100 text-orange-800" :
                      notif.urgency_level === "เร่งด่วน" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {notif.urgency_level}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                    <div>
                      <span className="font-medium">รหัส:</span> {notif.asset_id}
                    </div>
                    <div>
                      <span className="font-medium">สถานที่:</span> {notif.building_name} ชั้น {notif.floor} ห้อง {notif.room_number}
                    </div>
                    <div>
                      <span className="font-medium">ตรวจล่าสุด:</span> {notif.last_check_date || "ยังไม่เคยตรวจ"}
                    </div>
                    <div>
                      <span className="font-medium">ครั้งถัดไป:</span> <span className="text-blue-600 font-semibold">{notif.next_check_date}</span>
                    </div>
                    <div>
                      <span className="font-medium">คงเหลือ:</span> 
                      <span className={`ml-1 font-bold ${
                        notif.days_until_check < 0 ? "text-red-600" :
                        notif.days_until_check <= 7 ? "text-orange-600" :
                        "text-green-600"
                      }`}>
                        {notif.days_until_check < 0 ? `เลย ${Math.abs(notif.days_until_check)} วัน` : `${notif.days_until_check} วัน`}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">รอบการตรวจ:</span> {notif.schedule_name}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleScheduleSingleAsset(notif)}
                  className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Eye size={18} />
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const stats = calculateStats(filteredAssets);

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
          <p className="text-gray-600 mt-1">จัดการและติดตามการตรวจสอบครุภัณฑ์</p>
        </div>
        <button
          onClick={() => setShowBulkCheckModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition shadow-md"
        >
          <CheckSquare size={20} />
          ตรวจสอบแบบกลุ่ม
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">เลยกำหนด</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
            </div>
            <div className="bg-red-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">เร่งด่วน</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.urgent}</p>
            </div>
            <div className="bg-yellow-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Bell className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ปกติ</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.normal}</p>
            </div>
            <div className="bg-green-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ยังไม่กำหนด</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{stats.noSchedule}</p>
            </div>
            <div className="bg-gray-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("check")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "check"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckSquare size={20} />
              ตรวจสอบครุภัณฑ์
            </div>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "notifications"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell size={20} />
              การแจ้งเตือน
              {notifications.length > 0 && (
                <span className="absolute top-2 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {notifications.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Search & Filters - Only show in check tab */}
      {activeTab === "check" && (
        <>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex space-x-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาครุภัณฑ์..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Search className="w-5 h-5" />
                  <span>ค้นหา</span>
                </button>
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

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะการตรวจ
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="checked">ตรวจแล้ว</option>
                  <option value="pending">รอตรวจ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความเร่งด่วน
                </label>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="overdue">เลยกำหนด</option>
                  <option value="urgent">เร่งด่วน</option>
                  <option value="normal">ปกติ</option>
                </select>
              </div>

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
          </div>
        </>
      )}

      {/* Content */}
      {activeTab === "check" ? (
        viewMode === "grouped" ? renderGroupedView() : renderListView()
      ) : (
        renderNotifications()
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {scheduleType === "single" ? "กำหนดรอบการตรวจรายชิ้น" : "กำหนดรอบการตรวจทั้งห้อง"}
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <XIcon size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Selected Assets Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {scheduleType === "single" ? "ครุภัณฑ์ที่เลือก" : `ครุภัณฑ์ทั้งห้อง (${selectedAssets.length} รายการ)`}
                </h3>
                {scheduleType === "single" ? (
                  <div className="text-sm text-blue-800">
                    <div><strong>รหัส:</strong> {selectedAssets[0]?.asset_id}</div>
                    <div><strong>ชื่อ:</strong> {selectedAssets[0]?.asset_name}</div>
                    <div><strong>สถานที่:</strong> {selectedAssets[0]?.building_name} ชั้น {selectedAssets[0]?.floor} ห้อง {selectedAssets[0]?.room_number}</div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-800">
                    <div><strong>สถานที่:</strong> {selectedAssets[0]?.building_name} ชั้น {selectedAssets[0]?.floor} ห้อง {selectedAssets[0]?.room_number}</div>
                    <div><strong>จำนวน:</strong> {selectedAssets.length} รายการ</div>
                  </div>
                )}
              </div>

              {/* Schedule Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รูปแบบการกำหนด
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="radio"
                      name="scheduleMode"
                      value="preset"
                      checked={!scheduleForm.custom_interval_months && !scheduleForm.custom_next_date}
                      onChange={() => setScheduleForm({...scheduleForm, custom_interval_months: "", custom_next_date: ""})}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold">ใช้รอบมาตรฐาน</div>
                      <div className="text-xs text-gray-500">3, 6, 12 เดือน</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="radio"
                      name="scheduleMode"
                      value="custom"
                      checked={scheduleForm.custom_interval_months || scheduleForm.custom_next_date}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold">กำหนดเอง</div>
                      <div className="text-xs text-gray-500">ระบุช่วงเวลาเอง</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preset Schedule */}
              {!scheduleForm.custom_interval_months && !scheduleForm.custom_next_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รอบการตรวจมาตรฐาน
                  </label>
                  <select
                    value={scheduleForm.schedule_id}
                    onChange={(e) => setScheduleForm({...scheduleForm, schedule_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {schedules.map((schedule) => (
                      <option key={schedule.schedule_id} value={schedule.schedule_id}>
                        {schedule.name} (ทุก {schedule.check_interval_months} เดือน)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Schedule Options */}
              {(scheduleForm.custom_interval_months || scheduleForm.custom_next_date) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ช่วงเวลา (เดือน)
                    </label>
                    <input
                      type="number"
                      value={scheduleForm.custom_interval_months}
                      onChange={(e) => setScheduleForm({...scheduleForm, custom_interval_months: e.target.value, custom_next_date: ""})}
                      placeholder="เช่น 1, 3, 6, 12"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="text-center text-gray-500 font-medium">หรือ</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      กำหนดวันที่ตรวจครั้งถัดไป
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.custom_next_date}
                      onChange={(e) => setScheduleForm({...scheduleForm, custom_next_date: e.target.value, custom_interval_months: ""})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แจ้งเตือนล่วงหน้า (วัน)
                </label>
                <input
                  type="number"
                  value={scheduleForm.notify_before_days}
                  onChange={(e) => setScheduleForm({...scheduleForm, notify_before_days: e.target.value})}
                  min="1"
                  max="90"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ระบบจะแจ้งเตือนก่อนถึงกำหนดตรวจ {scheduleForm.notify_before_days} วัน
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSchedule}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? "กำลังบันทึก..." : "บันทึกรอบการตรวจ"}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">ตรวจสอบแบบกลุ่ม</h2>
                <button
                  onClick={() => setShowBulkCheckModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <XIcon size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกห้อง *
                </label>
                <select
                  value={bulkCheckData.location_id}
                  onChange={(e) => setBulkCheckData({...bulkCheckData, location_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- เลือกห้อง --</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.building_name} ชั้น {loc.floor} ห้อง {loc.room_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะหลังตรวจสอบ *
                </label>
                <select
                  value={bulkCheckData.check_status}
                  onChange={(e) => setBulkCheckData({...bulkCheckData, check_status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  value={bulkCheckData.remark}
                  onChange={(e) => setBulkCheckData({...bulkCheckData, remark: e.target.value})}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBulkCheck}
                  disabled={loading || !bulkCheckData.location_id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={20} />
                  {loading ? "กำลังบันทึก..." : "ตรวจสอบทั้งห้อง"}
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
        </div>
      )}
    </div>
  );
}