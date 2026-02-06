// FILE: src/pages/LocationsPage.jsx
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Plus, Edit2, Trash2, MapPin, Building, X, Search,
  Layers, ChevronDown, ChevronRight, AlertCircle,
  CheckCircle, Package, Filter, RefreshCw
} from "lucide-react";

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grouped"); // 'grouped' | 'list'
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [formData, setFormData] = useState({
    building_name: "",
    floor: "",
    room_number: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locRes, assetRes] = await Promise.all([
        api.get("/locations"),
        api.get("/assets").catch(() => ({ data: { data: [] } }))
      ]);
      setLocations(locRes.data.data || []);
      setAssets(assetRes.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  // Calculate asset counts per location
  const assetCountByLocation = useMemo(() => {
    const counts = {};
    assets.forEach(asset => {
      if (asset.location_id) {
        counts[asset.location_id] = (counts[asset.location_id] || 0) + 1;
      }
    });
    return counts;
  }, [assets]);

  // Filter and group locations
  const filteredLocations = useMemo(() => {
    let result = [...locations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(loc =>
        loc.building_name?.toLowerCase().includes(term) ||
        loc.room_number?.toLowerCase().includes(term) ||
        loc.description?.toLowerCase().includes(term)
      );
    }

    if (filterBuilding !== "all") {
      result = result.filter(loc => loc.building_name === filterBuilding);
    }

    return result;
  }, [locations, searchTerm, filterBuilding]);

  // Group locations by building
  const groupedLocations = useMemo(() => {
    const groups = {};
    filteredLocations.forEach(loc => {
      const building = loc.building_name || "ไม่ระบุอาคาร";
      if (!groups[building]) {
        groups[building] = { floors: {}, totalAssets: 0 };
      }
      const floor = loc.floor || "ไม่ระบุชั้น";
      if (!groups[building].floors[floor]) {
        groups[building].floors[floor] = [];
      }
      const assetCount = assetCountByLocation[loc.location_id] || 0;
      groups[building].floors[floor].push({ ...loc, assetCount });
      groups[building].totalAssets += assetCount;
    });
    return groups;
  }, [filteredLocations, assetCountByLocation]);

  // Get unique buildings for filter
  const uniqueBuildings = useMemo(() => {
    return [...new Set(locations.map(l => l.building_name))].filter(Boolean).sort();
  }, [locations]);

  // Stats
  const stats = useMemo(() => {
    const totalLocations = locations.length;
    const totalBuildings = new Set(locations.map(l => l.building_name)).size;
    const totalFloors = new Set(locations.map(l => `${l.building_name}-${l.floor}`)).size;
    const locationsWithAssets = Object.keys(assetCountByLocation).length;
    const emptyLocations = totalLocations - locationsWithAssets;

    return { totalLocations, totalBuildings, totalFloors, locationsWithAssets, emptyLocations };
  }, [locations, assetCountByLocation]);

  // Notifications for the Navbar integration
  const getLocationNotifications = () => {
    const notifications = [];

    // Alert for empty locations (rooms with no assets)
    const emptyLocs = locations.filter(loc => !assetCountByLocation[loc.location_id]);
    if (emptyLocs.length > 5) {
      notifications.push({
        id: 'empty-locations',
        type: 'info',
        title: `มี ${emptyLocs.length} ห้องที่ยังไม่มีครุภัณฑ์`,
        message: 'ห้องเหล่านี้ยังไม่มีครุภัณฑ์จัดเก็บ',
        link: '/locations'
      });
    }

    // Buildings with high asset density
    Object.entries(groupedLocations).forEach(([building, data]) => {
      if (data.totalAssets > 100) {
        notifications.push({
          id: `high-density-${building}`,
          type: 'warning',
          title: `อาคาร ${building} มีครุภัณฑ์จำนวนมาก`,
          message: `${data.totalAssets} รายการ - ควรจัดสรรพื้นที่เพิ่มเติม`,
          link: '/locations'
        });
      }
    });

    return notifications;
  };

  const toggleBuilding = (building) => {
    setExpandedBuildings(prev => ({
      ...prev,
      [building]: !prev[building]
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.building_name.trim()) errors.building_name = "กรุณาระบุชื่ออาคาร";
    if (!formData.floor.trim()) errors.floor = "กรุณาระบุชั้น";
    if (!formData.room_number.trim()) errors.room_number = "กรุณาระบุเลขห้อง";

    // Check for duplicate location
    const isDuplicate = locations.some(loc =>
      loc.building_name === formData.building_name.trim() &&
      loc.floor === formData.floor.trim() &&
      loc.room_number === formData.room_number.trim() &&
      (!editingLocation || loc.location_id !== editingLocation.location_id)
    );
    if (isDuplicate) {
      errors.room_number = "มีห้องนี้อยู่แล้วในระบบ";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (location = null) => {
    setFormErrors({});
    if (location) {
      setEditingLocation(location);
      setFormData({
        building_name: location.building_name,
        floor: location.floor || "",
        room_number: location.room_number,
        description: location.description || "",
      });
    } else {
      setEditingLocation(null);
      setFormData({
        building_name: "",
        floor: "",
        room_number: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setFormErrors({});
    setFormData({
      building_name: "",
      floor: "",
      room_number: "",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.location_id}`, formData);
        toast.success("แก้ไขสถานที่สำเร็จ");
      } else {
        await api.post("/locations", formData);
        toast.success("เพิ่มสถานที่สำเร็จ");
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error(editingLocation ? "แก้ไขไม่สำเร็จ" : "เพิ่มไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (location) => {
    const assetCount = assetCountByLocation[location.location_id] || 0;

    if (assetCount > 0) {
      toast.error(`ไม่สามารถลบได้ มีครุภัณฑ์ ${assetCount} รายการอยู่ในสถานที่นี้`);
      return;
    }

    if (!window.confirm(`ต้องการลบ "${location.building_name} ชั้น ${location.floor} ห้อง ${location.room_number}" หรือไม่?`)) {
      return;
    }

    try {
      await api.delete(`/locations/${location.location_id}`);
      toast.success("ลบสถานที่สำเร็จ");
      fetchData();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("ไม่สามารถลบได้ อาจมีครุภัณฑ์อยู่ในสถานที่นี้");
    }
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการสถานที่</h1>
          <p className="text-gray-500 mt-1">จัดการอาคาร ชั้น และห้องต่างๆ ในระบบ</p>
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
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            เพิ่มสถานที่
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">สถานที่ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLocations}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-xl">
              <MapPin className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">จำนวนอาคาร</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBuildings}</p>
            </div>
            <div className="bg-success-100 p-3 rounded-xl">
              <Building className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">มีครุภัณฑ์</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{stats.locationsWithAssets}</p>
            </div>
            <div className="bg-success-100 p-3 rounded-xl">
              <Package className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">ห้องว่าง</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{stats.emptyLocations}</p>
            </div>
            <div className="bg-warning-100 p-3 rounded-xl">
              <AlertCircle className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาอาคาร ห้อง หรือรายละเอียด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="form-select min-w-[150px]"
            >
              <option value="all">ทุกอาคาร</option>
              {uniqueBuildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === 'grouped'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Layers size={18} />
              <span className="font-medium">จัดกลุ่ม</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Filter size={18} />
              <span className="font-medium">รายการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        <GroupedView
          groupedLocations={groupedLocations}
          expandedBuildings={expandedBuildings}
          toggleBuilding={toggleBuilding}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      ) : (
        <ListView
          locations={filteredLocations}
          assetCountByLocation={assetCountByLocation}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}

      {/* Empty State */}
      {filteredLocations.length === 0 && (
        <div className="card text-center py-12">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">
            {searchTerm || filterBuilding !== "all"
              ? "ไม่พบสถานที่ตามเงื่อนไขที่ค้นหา"
              : "ยังไม่มีข้อมูลสถานที่"
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {searchTerm || filterBuilding !== "all"
              ? "ลองปรับเงื่อนไขการค้นหาใหม่"
              : "เพิ่มสถานที่เพื่อเริ่มต้นใช้งาน"
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LocationModal
          editingLocation={editingLocation}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
          submitting={submitting}
          existingBuildings={uniqueBuildings}
        />
      )}
    </div>
  );
}

// ============================================================
// GROUPED VIEW COMPONENT
// ============================================================
function GroupedView({ groupedLocations, expandedBuildings, toggleBuilding, onEdit, onDelete }) {
  const buildings = Object.entries(groupedLocations);

  if (buildings.length === 0) return null;

  return (
    <div className="space-y-4">
      {buildings.map(([building, data]) => {
        const isExpanded = expandedBuildings[building];
        const floorCount = Object.keys(data.floors).length;
        const roomCount = Object.values(data.floors).reduce((sum, rooms) => sum + rooms.length, 0);

        return (
          <div key={building} className="card overflow-hidden">
            {/* Building Header */}
            <div
              onClick={() => toggleBuilding(building)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl">
                  <Building className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{building}</h3>
                  <p className="text-sm text-gray-500">
                    {floorCount} ชั้น • {roomCount} ห้อง • {data.totalAssets} ครุภัณฑ์
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data.totalAssets > 0 && (
                  <span className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm font-medium">
                    {data.totalAssets} รายการ
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="text-gray-400" size={24} />
                ) : (
                  <ChevronRight className="text-gray-400" size={24} />
                )}
              </div>
            </div>

            {/* Floors */}
            {isExpanded && (
              <div className="p-4 space-y-3 bg-gray-50/50">
                {Object.entries(data.floors)
                  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                  .map(([floor, rooms]) => (
                    <div key={floor} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-100">
                        <div className="bg-primary-100 p-2 rounded-lg">
                          <Layers className="text-primary-600" size={18} />
                        </div>
                        <span className="font-semibold text-gray-700">ชั้น {floor}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          {rooms.length} ห้อง
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {rooms.map(room => (
                          <div
                            key={room.location_id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="text-gray-400" size={18} />
                              <div>
                                <span className="font-medium text-gray-800">ห้อง {room.room_number}</span>
                                {room.description && (
                                  <p className="text-sm text-gray-500">{room.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {room.assetCount > 0 ? (
                                <span className="text-sm text-success-600 flex items-center gap-1">
                                  <Package size={14} />
                                  {room.assetCount}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">ว่าง</span>
                              )}
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit(room); }}
                                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                                  title="แก้ไข"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDelete(room); }}
                                  className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition"
                                  title="ลบ"
                                  disabled={room.assetCount > 0}
                                >
                                  <Trash2 size={16} className={room.assetCount > 0 ? 'opacity-30' : ''} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
function ListView({ locations, assetCountByLocation, onEdit, onDelete }) {
  if (locations.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                อาคาร
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                ชั้น
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                ห้อง
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                รายละเอียด
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                ครุภัณฑ์
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.map((location) => {
              const assetCount = assetCountByLocation[location.location_id] || 0;
              return (
                <tr
                  key={location.location_id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building className="text-primary-500" size={16} />
                      <span className="font-medium text-gray-900">{location.building_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    ชั้น {location.floor}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{location.room_number}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                    {location.description || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {assetCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-success-600 bg-success-50 px-2 py-1 rounded-full text-sm">
                        <Package size={14} />
                        {assetCount}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">ว่าง</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(location)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        title="แก้ไข"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(location)}
                        className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition"
                        title="ลบ"
                        disabled={assetCount > 0}
                      >
                        <Trash2 size={18} className={assetCount > 0 ? 'opacity-30' : ''} />
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
// MODAL COMPONENT
// ============================================================
function LocationModal({
  editingLocation,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  onClose,
  submitting,
  existingBuildings
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = existingBuildings.filter(b =>
    b.toLowerCase().includes(formData.building_name.toLowerCase()) &&
    b !== formData.building_name
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-xl">
                <MapPin className="text-primary-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingLocation ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            {/* Building Name */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่ออาคาร <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.building_name}
                  onChange={(e) => {
                    setFormData({ ...formData, building_name: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="เช่น อาคาร 1, อาคารเรียนรวม"
                  className={`form-input pl-10 ${formErrors.building_name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  required
                />
              </div>
              {/* Suggestions dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((building, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, building_name: building });
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      {building}
                    </button>
                  ))}
                </div>
              )}
              {formErrors.building_name && (
                <p className="text-danger-500 text-xs mt-1">{formErrors.building_name}</p>
              )}
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชั้น <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="เช่น 1, 2, 3, ชั้นใต้ดิน"
                  className={`form-input pl-10 ${formErrors.floor ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  required
                />
              </div>
              {formErrors.floor && (
                <p className="text-danger-500 text-xs mt-1">{formErrors.floor}</p>
              )}
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขห้อง <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="เช่น 101, ห้องประชุม A"
                  className={`form-input pl-10 ${formErrors.room_number ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  required
                />
              </div>
              {formErrors.room_number && (
                <p className="text-danger-500 text-xs mt-1">{formErrors.room_number}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className="form-input resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  {editingLocation ? "บันทึกการแก้ไข" : "เพิ่มสถานที่"}
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
