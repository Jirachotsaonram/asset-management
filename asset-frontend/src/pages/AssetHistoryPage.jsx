// FILE: src/pages/AssetHistoryPage.jsx
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  Truck, Search, Plus, MapPin, Calendar, User, ArrowRight, X, Package,
  Building, FileText, Download, CheckCircle, RefreshCw, Filter,
  Clock, TrendingUp, ChevronDown, ChevronRight, AlertCircle, Layers
} from "lucide-react";

export default function AssetHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState({ start: "", end: "" });
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [expandedItems, setExpandedItems] = useState({});
  const [sortBy, setSortBy] = useState("date_desc");

  const [formData, setFormData] = useState({
    asset_id: "",
    old_location_id: "",
    new_location_id: "",
    move_date: new Date().toISOString().split("T")[0],
    remark: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const formatLocation = (location) => {
    if (!location) return "-";
    const { building_name, floor, room_number } = location;
    return `${building_name || ""} ชั้น ${floor || "-"} ห้อง ${room_number || "-"}`.trim();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, assetsRes, locationsRes] = await Promise.all([
        api.get("/history"),
        api.get("/assets"),
        api.get("/locations"),
      ]);

      setHistory(historyRes.data.data || []);
      setAssets(assetsRes.data.data || []);
      setLocations(locationsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  // Get unique buildings from history
  const uniqueBuildings = useMemo(() => {
    const buildings = new Set();
    history.forEach(item => {
      if (item.old_building) buildings.add(item.old_building);
      if (item.new_building) buildings.add(item.new_building);
    });
    return Array.from(buildings).sort();
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let result = history.filter((item) => {
      const matchSearch =
        item.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.asset_id?.toString().includes(searchTerm) ||
        item.moved_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.remark?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate =
        (!filterDate.start || item.move_date >= filterDate.start) &&
        (!filterDate.end || item.move_date <= filterDate.end);

      const matchBuilding = filterBuilding === "all" ||
        item.old_building === filterBuilding ||
        item.new_building === filterBuilding;

      return matchSearch && matchDate && matchBuilding;
    });

    // Sort
    switch (sortBy) {
      case "date_desc":
        result.sort((a, b) => new Date(b.move_date) - new Date(a.move_date));
        break;
      case "date_asc":
        result.sort((a, b) => new Date(a.move_date) - new Date(b.move_date));
        break;
      case "asset":
        result.sort((a, b) => (a.asset_name || "").localeCompare(b.asset_name || ""));
        break;
    }

    return result;
  }, [history, searchTerm, filterDate, filterBuilding, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = history.length;
    const thisMonth = history.filter(h => new Date(h.move_date) >= monthStart).length;
    const thisWeek = history.filter(h => new Date(h.move_date) >= weekAgo).length;
    const today = history.filter(h => h.move_date === now.toISOString().split('T')[0]).length;

    // Most moved assets
    const assetMoves = {};
    history.forEach(h => {
      assetMoves[h.asset_id] = (assetMoves[h.asset_id] || 0) + 1;
    });
    const frequentMoves = Object.entries(assetMoves)
      .filter(([, count]) => count > 3)
      .length;

    return { total, thisMonth, thisWeek, today, frequentMoves };
  }, [history]);

  // Notifications for Navbar integration
  const getHistoryNotifications = () => {
    const notifications = [];

    // Frequent moves notification
    if (stats.frequentMoves > 0) {
      notifications.push({
        id: 'frequent-moves',
        type: 'warning',
        title: `มี ${stats.frequentMoves} รายการย้ายบ่อย`,
        message: 'ครุภัณฑ์ที่ถูกย้ายมากกว่า 3 ครั้ง',
        link: '/history',
        read: false
      });
    }

    // Today's moves
    if (stats.today > 0) {
      notifications.push({
        id: 'today-moves',
        type: 'info',
        title: `วันนี้มีการย้าย ${stats.today} ครั้ง`,
        message: 'การเคลื่อนย้ายครุภัณฑ์วันนี้',
        link: '/history',
        read: false
      });
    }

    return notifications;
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.asset_id) errors.asset_id = "กรุณาเลือกครุภัณฑ์";
    if (!formData.new_location_id) errors.new_location_id = "กรุณาเลือกสถานที่ใหม่";
    if (formData.old_location_id && formData.old_location_id === formData.new_location_id) {
      errors.new_location_id = "สถานที่ใหม่ต้องไม่เหมือนสถานที่เดิม";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = () => {
    setFormErrors({});
    setFormData({
      asset_id: "",
      old_location_id: "",
      new_location_id: "",
      move_date: new Date().toISOString().split("T")[0],
      remark: "",
    });
    setShowModal(true);
  };

  const handleAssetChange = (assetId) => {
    if (!assetId) {
      setFormData({ ...formData, asset_id: "", old_location_id: "" });
      return;
    }

    const selectedAsset = assets.find(a => String(a.asset_id) === String(assetId));
    setFormData({
      ...formData,
      asset_id: assetId,
      old_location_id: selectedAsset?.location_id || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = { ...formData, moved_by: user.user_id };
      await api.post("/history", submitData);
      await api.put(`/assets/${formData.asset_id}`, { location_id: formData.new_location_id });

      toast.success("บันทึกการย้ายสำเร็จ");
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    let csv = "วันที่ย้าย,รหัสครุภัณฑ์,ชื่อครุภัณฑ์,จากอาคาร,จากชั้น,จากห้อง,ไปอาคาร,ไปชั้น,ไปห้อง,ผู้ดำเนินการ,หมายเหตุ\n";

    filteredHistory.forEach((item) => {
      csv += `"${item.move_date}","${item.asset_id}","${item.asset_name}","${item.old_building || ''}","${item.old_floor || ''}","${item.old_room || ''}","${item.new_building || ''}","${item.new_floor || ''}","${item.new_room || ''}","${item.moved_by_name}","${item.remark || ''}"\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `asset_movement_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export สำเร็จ");
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterDate({ start: "", end: "" });
    setFilterBuilding("all");
    setSortBy("date_desc");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการเคลื่อนย้าย</h1>
          <p className="text-gray-500 mt-1">บันทึกและติดตามการย้ายครุภัณฑ์ระหว่างสถานที่</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={18} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center gap-2"
          >
            <Truck size={20} />
            บันทึกการย้าย
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">การย้ายทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-xl">
              <Truck className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">เดือนนี้</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{stats.thisMonth}</p>
            </div>
            <div className="bg-success-100 p-3 rounded-xl">
              <Calendar className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">สัปดาห์นี้</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{stats.thisWeek}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-xl">
              <Clock className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">ย้ายบ่อย</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{stats.frequentMoves}</p>
              {stats.frequentMoves > 0 && (
                <p className="text-xs text-warning-500 mt-1">มากกว่า 3 ครั้ง</p>
              )}
            </div>
            <div className="bg-warning-100 p-3 rounded-xl">
              <TrendingUp className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาครุภัณฑ์, ผู้ดำเนินการ, หรือหมายเหตุ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          {/* Date Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">จาก:</span>
              <input
                type="date"
                value={filterDate.start}
                onChange={(e) => setFilterDate({ ...filterDate, start: e.target.value })}
                className="form-input py-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">ถึง:</span>
              <input
                type="date"
                value={filterDate.end}
                onChange={(e) => setFilterDate({ ...filterDate, end: e.target.value })}
                className="form-input py-2"
              />
            </div>
          </div>

          {/* Building Filter & Sort */}
          <div className="flex gap-2">
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="form-select"
            >
              <option value="all">ทุกอาคาร</option>
              {uniqueBuildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
            >
              <option value="date_desc">ล่าสุด</option>
              <option value="date_asc">เก่าสุด</option>
              <option value="asset">ชื่อครุภัณฑ์</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2"
              title="ล้างตัวกรอง"
            >
              <X size={18} />
            </button>
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center gap-2 bg-success-50 text-success-700 hover:bg-success-100"
              title="Export CSV"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-primary-600" />
            บันทึกการเคลื่อนย้าย
          </h2>
          <span className="text-sm text-gray-500">{filteredHistory.length} รายการ</span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">
              {searchTerm || filterDate.start || filterDate.end || filterBuilding !== "all"
                ? "ไม่พบรายการตามเงื่อนไข"
                : "ยังไม่มีประวัติการเคลื่อนย้าย"
              }
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || filterDate.start || filterDate.end || filterBuilding !== "all"
                ? "ลองปรับเงื่อนไขการค้นหา"
                : 'กดปุ่ม "บันทึกการย้าย" เพื่อเริ่มต้น'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredHistory.map((item) => {
              const isExpanded = expandedItems[item.history_id];

              return (
                <div
                  key={item.history_id}
                  className="hover:bg-gray-50 transition"
                >
                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(item.history_id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="bg-primary-100 p-2.5 rounded-xl flex-shrink-0">
                        <Truck className="text-primary-600" size={20} />
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{item.asset_name}</h3>
                          <span className="text-xs text-gray-400">#{item.asset_id}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Building size={14} className="text-gray-400" />
                            {item.old_building || '-'}
                          </span>
                          <ArrowRight size={14} className="text-primary-400" />
                          <span className="font-medium text-primary-600">{item.new_building || '-'}</span>
                        </div>
                      </div>

                      {/* Date & User */}
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-sm font-medium text-gray-700">{item.move_date}</p>
                        <p className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-1">
                          <User size={12} />
                          {item.moved_by_name}
                        </p>
                      </div>

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                      ) : (
                        <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="ml-12 bg-gray-50 rounded-xl p-4 space-y-3">
                        {/* Location Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-danger-50 border border-danger-100 rounded-lg p-3">
                            <p className="text-xs font-medium text-danger-600 mb-2 flex items-center gap-1">
                              <MapPin size={12} /> จาก
                            </p>
                            <p className="font-semibold text-gray-800">
                              {formatLocation({
                                building_name: item.old_building,
                                floor: item.old_floor,
                                room_number: item.old_room,
                              })}
                            </p>
                          </div>
                          <div className="bg-success-50 border border-success-100 rounded-lg p-3">
                            <p className="text-xs font-medium text-success-600 mb-2 flex items-center gap-1">
                              <MapPin size={12} /> ไปยัง
                            </p>
                            <p className="font-semibold text-gray-800">
                              {formatLocation({
                                building_name: item.new_building,
                                floor: item.new_floor,
                                room_number: item.new_room,
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>วันที่: {item.move_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User size={14} className="text-gray-400" />
                            <span>ผู้ดำเนินการ: <strong>{item.moved_by_name}</strong></span>
                          </div>
                        </div>

                        {/* Remark */}
                        {item.remark && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText size={14} className="text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-gray-500">หมายเหตุ: </span>
                              <span className="text-gray-700">{item.remark}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Move Modal */}
      {showModal && (
        <MoveModal
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          assets={assets}
          locations={locations}
          formatLocation={formatLocation}
          onAssetChange={handleAssetChange}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ============================================================
// MOVE MODAL COMPONENT
// ============================================================
function MoveModal({
  formData, setFormData, formErrors, assets, locations, formatLocation,
  onAssetChange, onSubmit, onClose, submitting
}) {
  const selectedAsset = assets.find(a => String(a.asset_id) === String(formData.asset_id));
  const currentLocation = locations.find(l => String(l.location_id) === String(formData.old_location_id));

  // Group locations by building
  const groupedLocations = useMemo(() => {
    const groups = {};
    locations.forEach(loc => {
      const building = loc.building_name || 'ไม่ระบุอาคาร';
      if (!groups[building]) groups[building] = [];
      groups[building].push(loc);
    });
    return groups;
  }, [locations]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-xl">
                <Truck className="text-primary-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">บันทึกการย้ายครุภัณฑ์</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกครุภัณฑ์ <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={formData.asset_id}
                onChange={(e) => onAssetChange(e.target.value)}
                className={`form-select pl-10 ${formErrors.asset_id ? 'border-danger-500' : ''}`}
                required
              >
                <option value="">-- เลือกครุภัณฑ์ --</option>
                {assets.map((asset) => (
                  <option key={asset.asset_id} value={asset.asset_id}>
                    {asset.asset_id} - {asset.asset_name}
                  </option>
                ))}
              </select>
            </div>
            {formErrors.asset_id && (
              <p className="text-danger-500 text-xs mt-1">{formErrors.asset_id}</p>
            )}
            {selectedAsset && (
              <p className="text-xs text-success-600 mt-1 flex items-center gap-1">
                <CheckCircle size={12} />
                เลือก: {selectedAsset.asset_name}
              </p>
            )}
          </div>

          {/* Current Location (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานที่ปัจจุบัน
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2">
              <MapPin className="text-gray-400" size={18} />
              <span className="text-gray-700">
                {currentLocation ? formatLocation(currentLocation) : 'เลือกครุภัณฑ์เพื่อดูสถานที่ปัจจุบัน'}
              </span>
            </div>
          </div>

          {/* New Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานที่ใหม่ <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <select
                value={formData.new_location_id}
                onChange={(e) => setFormData({ ...formData, new_location_id: e.target.value })}
                className={`form-select pl-10 ${formErrors.new_location_id ? 'border-danger-500' : ''}`}
                required
              >
                <option value="">-- เลือกสถานที่ใหม่ --</option>
                {Object.entries(groupedLocations).map(([building, locs]) => (
                  <optgroup key={building} label={building}>
                    {locs.map((loc) => (
                      <option
                        key={loc.location_id}
                        value={loc.location_id}
                        disabled={String(loc.location_id) === String(formData.old_location_id)}
                      >
                        ชั้น {loc.floor} ห้อง {loc.room_number}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {formErrors.new_location_id && (
              <p className="text-danger-500 text-xs mt-1">{formErrors.new_location_id}</p>
            )}
          </div>

          {/* Move Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่ย้าย <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                value={formData.move_date}
                onChange={(e) => setFormData({ ...formData, move_date: e.target.value })}
                className="form-input pl-10"
                required
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="ระบุเหตุผลหรือรายละเอียดการย้าย..."
              className="form-input resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  บันทึกการย้าย
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
