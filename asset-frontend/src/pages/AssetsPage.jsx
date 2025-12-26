import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  X,
  Package,
  QrCode,
  ChevronDown,
  ChevronRight,
  Building,
  Layers,
  MapPin,
  Grid,
  List,
  Filter,
  X as XIcon,
  RotateCcw
} from "lucide-react";
import { API_BASE_URL } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import AssetForm from "../components/Assets/AssetForm";
import QRCodeModal from "../components/Assets/QRCodeModal";
import BulkQRGenerator from "../components/Assets/BulkQRGenerator";

export default function AssetsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin' || user?.role === 'Inspector';
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [showBulkQR, setShowBulkQR] = useState(false);
  
  // สำหรับการจัดกลุ่ม
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" หรือ "list"
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});
  
  // สำหรับ Filter
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    building: "all",
    floor: "all"
  });
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchAssets();
    fetchDepartments();
    fetchLocations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get("/locations");
      setLocations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const formatLocation = (item) => {
    if (!item) return "-";
    const building = item.building_name || "";
    const floor = item.floor || "-";
    const room = item.room_number || "-";
    return `${building} ชั้น ${floor} ห้อง ${room}`;
  };

  const fetchAssets = async () => {
    try {
      const response = await api.get("/assets");
      setAssets(response.data.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchAssets();
      return;
    }

    try {
      const response = await api.get(`/assets?q=${searchTerm}`);
      setAssets(response.data.data);
    } catch (error) {
      toast.error("ค้นหาไม่สำเร็จ");
    }
  };

  // ฟังก์ชัน Filter
  const getFilteredAssets = () => {
    return assets.filter((asset) => {
      // Filter by Status
      if (filters.status !== "all" && asset.status !== filters.status) {
        return false;
      }

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

      return true;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      department: "all",
      building: "all",
      floor: "all"
    });
  };

  // Get unique buildings and floors
  const uniqueBuildings = [...new Set(assets.map(a => a.building_name).filter(Boolean))];
  const uniqueFloors = [...new Set(assets.map(a => a.floor).filter(Boolean))];

  const filteredAssets = getFilteredAssets();

  // จัดกลุ่มครุภัณฑ์ตาม Location
  const groupAssetsByLocation = (assetList) => {
    const grouped = {};

    assetList.forEach((asset) => {
      const building = asset.building_name || "ไม่ระบุอาคาร";
      const floor = asset.floor || "ไม่ระบุชั้น";
      const room = asset.room_number || "ไม่ระบุห้อง";

      if (!grouped[building]) {
        grouped[building] = {};
      }
      if (!grouped[building][floor]) {
        grouped[building][floor] = {};
      }
      if (!grouped[building][floor][room]) {
        grouped[building][floor][room] = [];
      }

      grouped[building][floor][room].push(asset);
    });

    return grouped;
  };

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

  const handleUploadImage = async (assetId, file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      await api.post(`/upload/asset/${assetId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("อัปโหลดรูปภาพสำเร็จ");
      fetchAssets();
    } catch (error) {
      toast.error("อัปโหลดไม่สำเร็จ");
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm("ต้องการลบครุภัณฑ์นี้หรือไม่?")) {
      return;
    }

    try {
      await api.delete(`/assets/${assetId}`);
      toast.success("ลบครุภัณฑ์สำเร็จ");
      fetchAssets();
    } catch (error) {
      toast.error("ไม่สามารถลบได้");
    }
  };

  const handleAdd = () => {
    setEditingAsset(null);
    setShowForm(true);
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      ใช้งานได้: "bg-green-100 text-green-800",
      รอซ่อม: "bg-yellow-100 text-yellow-800",
      รอจำหน่าย: "bg-orange-100 text-orange-800",
      จำหน่ายแล้ว: "bg-gray-100 text-gray-800",
      ไม่พบ: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // คำนวณสถิติ
  const calculateStats = (assetList) => {
    return {
      total: assetList.length,
      available: assetList.filter(a => a.status === 'ใช้งานได้').length,
      maintenance: assetList.filter(a => a.status === 'รอซ่อม').length,
      missing: assetList.filter(a => a.status === 'ไม่พบ').length
    };
  };

  // Render Asset Row
  const renderAssetRow = (asset) => (
    <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative group">
          {asset.image ? (
            <img
              src={`${API_BASE_URL}/${asset.image}`}
              alt={asset.asset_name}
              className="h-12 w-12 rounded object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/48?text=No+Image";
              }}
            />
          ) : (
            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
          {canEdit && (
            <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center rounded transition-opacity">
              <Upload className="w-6 h-6 text-white" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleUploadImage(asset.asset_id, e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {asset.asset_name}
        </div>
        <div className="text-sm text-gray-500">ID: {asset.asset_id}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {asset.serial_number || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
            asset.status
          )}`}
        >
          {asset.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setQrAsset(asset);
              setShowQRModal(true);
            }}
            className="text-green-600 hover:text-green-900 transition-colors"
            title="QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedAsset(asset)}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="ดูรายละเอียด"
          >
            <Eye className="w-5 h-5" />
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => handleEdit(asset)}
                className="text-yellow-600 hover:text-yellow-900 transition-colors"
                title="แก้ไข"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(asset.asset_id)}
                className="text-red-600 hover:text-red-900 transition-colors"
                title="ลบ"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  // Render Grouped View
  const renderGroupedView = () => {
    const groupedAssets = groupAssetsByLocation(filteredAssets);

    return (
      <div className="space-y-4">
        {Object.entries(groupedAssets).map(([building, floors]) => {
          const buildingAssets = Object.values(floors)
            .flatMap(rooms => Object.values(rooms))
            .flat();
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
                      <span className="text-green-600 ml-2">ใช้งานได้: {stats.available}</span> | 
                      <span className="text-yellow-600 ml-2">รอซ่อม: {stats.maintenance}</span> | 
                      <span className="text-red-600 ml-2">ไม่พบ: {stats.missing}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
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
                                {floorStats.total} รายการ | 
                                <span className="text-green-600 ml-1">{floorStats.available} พร้อมใช้</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
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
                                      <div className="flex gap-2 text-xs">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                          ✓ {roomStats.available}
                                        </span>
                                        {roomStats.maintenance > 0 && (
                                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                            🔧 {roomStats.maintenance}
                                          </span>
                                        )}
                                        {roomStats.missing > 0 && (
                                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                                            ⚠ {roomStats.missing}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assets Table */}
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">รูปภาพ</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">รหัส/ชื่อ</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รูปภาพ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รหัส/ชื่อครุภัณฑ์
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานที่
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map((asset) => (
              <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative group">
                    {asset.image ? (
                      <img
                        src={`${API_BASE_URL}/${asset.image}`}
                        alt={asset.asset_name}
                        className="h-12 w-12 rounded object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/48?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                    <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 flex items-center justify-center rounded transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handleUploadImage(asset.asset_id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {asset.asset_name}
                  </div>
                  <div className="text-sm text-gray-500">ID: {asset.asset_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.serial_number || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLocation(asset)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      asset.status
                    )}`}
                  >
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setQrAsset(asset);
                        setShowQRModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.asset_id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">ไม่พบข้อมูลครุภัณฑ์</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จัดการครุภัณฑ์</h1>
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBulkQR(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span>สร้าง QR ทั้งหมด</span>
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มครุภัณฑ์</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & View Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex space-x-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ค้นหาครุภัณฑ์..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-5 h-5" />
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
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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
          {/* Filter by Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
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
        {(filters.status !== "all" || filters.department !== "all" || 
          filters.building !== "all" || filters.floor !== "all") && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 font-medium">ตัวกรองที่ใช้งาน:</span>
              
              {filters.status !== "all" && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  สถานะ: {filters.status}
                  <button
                    onClick={() => setFilters({ ...filters, status: "all" })}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <XIcon size={14} />
                  </button>
                </span>
              )}

              {filters.department !== "all" && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  หน่วยงาน: {departments.find(d => d.department_id == filters.department)?.department_name}
                  <button
                    onClick={() => setFilters({ ...filters, department: "all" })}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <XIcon size={14} />
                  </button>
                </span>
              )}

              {filters.building !== "all" && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  อาคาร: {filters.building}
                  <button
                    onClick={() => setFilters({ ...filters, building: "all" })}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <XIcon size={14} />
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
                    <XIcon size={14} />
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

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">รายละเอียดครุภัณฑ์</h2>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedAsset.image && (
                <img
                  src={`${API_BASE_URL}/${selectedAsset.image}`}
                  alt={selectedAsset.asset_name}
                  className="w-full h-64 object-cover rounded mb-4"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">รหัสครุภัณฑ์</label>
                  <p className="font-semibold">{selectedAsset.asset_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ชื่อครุภัณฑ์</label>
                  <p className="font-semibold">{selectedAsset.asset_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Serial Number</label>
                  <p className="font-semibold">
                    {selectedAsset.serial_number || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ราคา</label>
                  <p className="font-semibold">
                    {selectedAsset.price?.toLocaleString()} บาท
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">สถานะ</label>
                  <p>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedAsset.status
                      )}`}
                    >
                      {selectedAsset.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">วันที่ตรวจรับ</label>
                  <p className="font-semibold">{selectedAsset.received_date}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Form Modal */}
      {showForm && (
        <AssetForm
          asset={editingAsset}
          onClose={() => {
            setShowForm(false);
            setEditingAsset(null);
          }}
          onSuccess={fetchAssets}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && qrAsset && (
        <QRCodeModal
          asset={qrAsset}
          onClose={() => {
            setShowQRModal(false);
            setQrAsset(null);
          }}
        />
      )}

      {/* Bulk QR Generator */}
      {showBulkQR && (
        <BulkQRGenerator assets={assets} onClose={() => setShowBulkQR(false)} />
      )}
    </div>
  );
}
