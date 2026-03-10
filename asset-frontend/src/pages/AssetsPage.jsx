import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Plus, Edit, Trash2, Eye, Upload, X, Package, QrCode,
  ChevronDown, ChevronRight, Building, Layers, MapPin,
  Grid, List, Filter, RotateCcw, RefreshCw, BarChart3, Clock
} from "lucide-react";
import { API_BASE_URL } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import AssetForm from "../components/Assets/AssetForm";
import QRCodeModal from "../components/Assets/QRCodeModal";
import BulkQRGenerator from "../components/Assets/BulkQRGenerator";
import VirtualTable from "../components/Common/VirtualTable";

// ==================== Notifications Integration ====================
export const getAssetNotifications = (assets) => {
  const notifications = [];
  const list = Array.isArray(assets) ? assets : [];
  const missingAssets = list.filter(a => a.status === 'ไม่พบ');
  if (missingAssets.length > 0) {
    notifications.push({ id: 'missing-assets', type: 'error', title: `มี ${missingAssets.length} ครุภัณฑ์ไม่พบ`, message: 'ครุภัณฑ์ที่ต้องตรวจสอบ', link: '/assets', read: false });
  }
  const maintenanceAssets = list.filter(a => a.status === 'รอซ่อม');
  if (maintenanceAssets.length > 0) {
    notifications.push({ id: 'maintenance-assets', type: 'warning', title: `มี ${maintenanceAssets.length} ครุภัณฑ์รอซ่อม`, message: 'ครุภัณฑ์ที่ต้องดำเนินการ', link: '/assets', read: false });
  }
  return notifications;
};

export default function AssetsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin' || user?.role === 'Inspector';

  // Data state
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination state (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [currentBorrow, setCurrentBorrow] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  // Grouped view
  const [expandedBuildings, setExpandedBuildings] = useState({});
  const [expandedFloors, setExpandedFloors] = useState({});

  // Filters (for server-side pagination via query params)
  const [filters, setFilters] = useState({ status: "all", department: "all", building: "all", floor: "all" });
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchLocations();
  }, []);

  // เมื่อ filters, page, sort เปลี่ยน → fetch ใหม่
  useEffect(() => {
    fetchAssets();
  }, [currentPage, itemsPerPage, sortKey, sortOrder, filters]);

  const fetchDepartments = async () => {
    try { const r = await api.get("/departments"); setDepartments(r.data.data || []); } catch (e) { console.error(e); }
  };

  const fetchLocations = async () => {
    try { const r = await api.get("/locations"); setLocations(r.data.data || []); } catch (e) { console.error(e); }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', itemsPerPage);
      params.set('sort', sortKey);
      params.set('order', sortOrder);

      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.department !== 'all') params.set('department_id', filters.department);
      if (filters.building !== 'all') params.set('building', filters.building);
      if (filters.floor !== 'all') params.set('floor', filters.floor);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const response = await api.get(`/assets?${params.toString()}`);
      const data = response.data.data;

      if (data && data.items) {
        // Paginated response
        setAssets(data.items);
        setTotalItems(data.total);
      } else {
        // Legacy response (array)
        setAssets(Array.isArray(data) ? data : []);
        setTotalItems(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    if (searchDebounce) clearTimeout(searchDebounce);
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchAssets();
    }, 500);
    setSearchDebounce(timeout);
  }, [searchDebounce]);

  const handleSearch = () => { setCurrentPage(1); fetchAssets(); };

  const handleSort = (key, order) => { setSortKey(key); setSortOrder(order); setCurrentPage(1); };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleItemsPerPageChange = (value) => { setItemsPerPage(value); setCurrentPage(1); };

  const handleResetFilters = () => {
    setFilters({ status: "all", department: "all", building: "all", floor: "all" });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleUploadImage = async (assetId, file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      await api.post(`/upload/asset/${assetId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("อัปโหลดรูปภาพสำเร็จ");
      fetchAssets();
    } catch (error) { toast.error("อัปโหลดไม่สำเร็จ"); }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm("ต้องการลบครุภัณฑ์นี้หรือไม่?")) return;
    try {
      await api.delete(`/assets/${assetId}`);
      toast.success("ลบครุภัณฑ์สำเร็จ");
      fetchAssets();
    } catch (error) { toast.error("ไม่สามารถลบได้"); }
  };

  const fetchCurrentBorrow = async (assetId) => {
    try {
      const response = await api.get(`/borrows/asset/${assetId}`);
      if (response.data.success && response.data.data.length > 0) {
        const active = response.data.data.find(b => b.status === 'ยืม');
        setCurrentBorrow(active);
      } else {
        setCurrentBorrow(null);
      }
    } catch (error) {
      console.error('Error fetching current borrow:', error);
      setCurrentBorrow(null);
    }
  };

  const handleViewDetails = (asset) => {
    setSelectedAsset(asset);
    if (asset.status === 'ยืม') {
      fetchCurrentBorrow(asset.asset_id);
    } else {
      setCurrentBorrow(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ใช้งานได้': 'bg-green-100 text-green-700 border border-green-200',
      'ยืม': 'bg-blue-100 text-blue-700 border border-blue-200',
      'รอซ่อม': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'รอจำหน่าย': 'bg-orange-100 text-orange-700 border border-orange-200',
      'จำหน่ายแล้ว': 'bg-gray-100 text-gray-600 border border-gray-200',
      'ไม่พบ': 'bg-red-100 text-red-700 border border-red-200',
    };
    return colors[status?.trim()] || 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  // Get unique values for filters (from all locations, not just current page)
  const uniqueBuildings = useMemo(() => [...new Set(locations.map(l => l.building_name).filter(Boolean))], [locations]);
  const uniqueFloors = useMemo(() => [...new Set(locations.map(l => l.floor).filter(Boolean))].sort((a, b) => a - b), [locations]);

  // Active filter count
  const activeFilterCount = [filters.status, filters.department, filters.building, filters.floor].filter(f => f !== 'all').length;

  // ==================== ตาราง Columns สำหรับ VirtualTable ====================
  const tableColumns = useMemo(() => [
    {
      key: 'image', label: 'รูป', sortable: false, width: '60px',
      render: (val, row) => (
        <div className="relative group">
          {row.image ? (
            <img src={`${API_BASE_URL}/${row.image}`} alt="" className="h-10 w-10 rounded-lg object-cover"
              onError={(e) => { e.target.src = ''; e.target.className = 'h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center'; }} />
          ) : (
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package size={16} className="text-gray-400" />
            </div>
          )}
          {canEdit && (
            <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black/50 flex items-center justify-center rounded-lg transition-opacity">
              <Upload className="w-4 h-4 text-white" />
              <input type="file" className="hidden" accept="image/*"
                onChange={(e) => { if (e.target.files[0]) handleUploadImage(row.asset_id, e.target.files[0]); }} />
            </label>
          )}
        </div>
      )
    },
    {
      key: 'asset_name', label: 'ชื่อครุภัณฑ์', minWidth: '200px',
      render: (val, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 line-clamp-2" title={val}>{val}</div>
          <div className="text-xs text-gray-400">ID: {row.asset_id}</div>
        </div>
      )
    },
    { key: 'serial_number', label: 'Serial Number', minWidth: '130px', render: (val) => <span className="text-xs font-mono">{val || '-'}</span> },
    { key: 'barcode', label: 'Barcode', minWidth: '120px', render: (val) => <span className="text-xs font-mono">{val || '-'}</span> },
    {
      key: 'status', label: 'สถานะ', width: '110px',
      render: (val) => <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(val)}`}>{val}</span>
    },
    { key: 'department_name', label: 'หน่วยงาน', minWidth: '120px', render: (val) => val || '-' },
    {
      key: 'building_name', label: 'สถานที่', minWidth: '180px',
      render: (val, row) => {
        const parts = [val, row.floor ? `ชั้น ${row.floor}` : null, row.room_number ? `ห้อง ${row.room_number}` : null].filter(Boolean);
        return <span className="text-xs">{parts.join(' ') || row.room_text || '-'}</span>;
      }
    },
    { key: 'price', label: 'ราคา (฿)', minWidth: '100px', render: (val) => val ? Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-' },
    { key: 'quantity', label: 'จำนวน', width: '70px' },
    { key: 'unit', label: 'หน่วย', width: '70px' },
    { key: 'received_date', label: 'วันที่ตรวจรับ', minWidth: '110px', render: (val) => val || '-' },
    { key: 'fund_code', label: 'รหัสกองทุน', minWidth: '100px', render: (val) => val || '-' },
    { key: 'plan_code', label: 'รหัสแผน', minWidth: '100px', render: (val) => val || '-' },
    { key: 'project_code', label: 'รหัสโครงการ', minWidth: '100px', render: (val) => val || '-' },
    { key: 'faculty_name', label: 'คณะ', minWidth: '120px', render: (val) => val || '-' },
    { key: 'delivery_number', label: 'เลขที่ใบส่งของ', minWidth: '120px', render: (val) => val || '-' },
    { key: 'description', label: 'รายละเอียด', minWidth: '180px', render: (val) => <span className="line-clamp-2 text-xs">{val || '-'}</span> },
  ], [canEdit]);

  // ==================== Row Actions ====================
  const renderRowActions = (row) => (
    <>
      <button onClick={() => { setQrAsset(row); setShowQRModal(true); }}
        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="บาร์โค้ด">
        <QrCode size={16} />
      </button>
      <button onClick={() => handleViewDetails(row)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="ดูรายละเอียด">
        <Eye size={16} />
      </button>
      {canEdit && (
        <>
          <button onClick={() => { setEditingAsset(row); setShowForm(true); }}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="แก้ไข">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete(row.asset_id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="ลบ">
            <Trash2 size={16} />
          </button>
        </>
      )}
    </>
  );

  // ==================== Grouped View ====================
  const groupAssetsByLocation = (assetList) => {
    const grouped = {};
    assetList.forEach((asset) => {
      const building = asset.building_name || "ไม่ระบุอาคาร";
      const floor = asset.floor || "ไม่ระบุชั้น";
      const room = asset.room_number || asset.room_text || "ไม่ระบุห้อง";
      if (!grouped[building]) grouped[building] = {};
      if (!grouped[building][floor]) grouped[building][floor] = {};
      if (!grouped[building][floor][room]) grouped[building][floor][room] = [];
      grouped[building][floor][room].push(asset);
    });
    return grouped;
  };

  const toggleBuilding = (building) => setExpandedBuildings(prev => ({ ...prev, [building]: !prev[building] }));
  const toggleFloor = (building, floor) => {
    const key = `${building}-${floor}`;
    setExpandedFloors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateStats = (assetList) => ({
    total: assetList.length,
    available: assetList.filter(a => a.status === 'ใช้งานได้').length,
    maintenance: assetList.filter(a => a.status === 'รอซ่อม').length,
    missing: assetList.filter(a => a.status === 'ไม่พบ').length,
  });

  const renderGroupedView = () => {
    const groupedAssets = groupAssetsByLocation(assets);
    return (
      <div className="space-y-4">
        {assets.length < totalItems && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-xs flex items-center gap-2 mb-4">
            <Filter size={14} />
            <span>หมายเหตุ: การจัดกลุ่มแสดงผลเฉพาะข้อมูลในหน้านี้ ({assets.length.toLocaleString()} รายการจากทั้งหมด {totalItems.toLocaleString()} รายการ)</span>
          </div>
        )}
        {Object.entries(groupedAssets).map(([building, floors]) => {
          const buildingAssets = Object.values(floors).flatMap(rooms => Object.values(rooms)).flat();
          const stats = calculateStats(buildingAssets);
          const isExpanded = expandedBuildings[building];
          return (
            <div key={building} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div onClick={() => toggleBuilding(building)}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors border-b-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2.5 rounded-lg"><Building className="text-white" size={22} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{building}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {stats.total} รายการ | <span className="text-green-600">✓{stats.available}</span>
                      {stats.maintenance > 0 && <span className="text-yellow-600 ml-1">รอซ่อม: {stats.maintenance}</span>}
                      {stats.missing > 0 && <span className="text-red-600 ml-1">ไม่พบ: {stats.missing}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-blue-600">{stats.total}</span>
                  {isExpanded ? <ChevronDown className="text-gray-500" size={20} /> : <ChevronRight className="text-gray-500" size={20} />}
                </div>
              </div>
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {Object.entries(floors).map(([floor, rooms]) => {
                    const floorKey = `${building}-${floor}`;
                    const isFloorExpanded = expandedFloors[floorKey];
                    const floorAssets = Object.values(rooms).flat();
                    const floorStats = calculateStats(floorAssets);
                    return (
                      <div key={floorKey} className="border-l-4 border-indigo-400 bg-gray-50 rounded-lg overflow-hidden">
                        <div onClick={() => toggleFloor(building, floor)}
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Layers className="text-indigo-500" size={18} />
                            <span className="font-semibold text-gray-800">ชั้น {floor}</span>
                            <span className="text-xs text-gray-500">{floorStats.total} รายการ</span>
                          </div>
                          {isFloorExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        </div>
                        {isFloorExpanded && (
                          <div className="px-3 pb-3 space-y-2">
                            {Object.entries(rooms).map(([room, roomAssets]) => (
                              <div key={room} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <div className="bg-gray-50 px-3 py-2 border-b flex items-center gap-2">
                                  <MapPin size={14} className="text-purple-600" />
                                  <span className="text-sm font-semibold text-gray-800">ห้อง {room}</span>
                                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{roomAssets.length}</span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-10">รูป</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-16">รหัส</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase">ชื่อครุภัณฑ์</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-32">Serial/Barcode</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-24">สถานะ</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase w-20">จัดการ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {roomAssets.map(a => (
                                        <tr key={a.asset_id} className="hover:bg-blue-50/50 border-b border-gray-100 last:border-0 transition-colors">
                                          <td className="px-3 py-2">
                                            {a.image ? (
                                              <img src={`${API_BASE_URL.replace('/api', '')}/${a.image}`} alt="" className="h-8 w-8 rounded object-cover shadow-sm border border-gray-100" onError={e => { e.target.style.display = 'none' }} />
                                            ) : <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center border border-gray-200"><Package size={12} className="text-gray-300" /></div>}
                                          </td>
                                          <td className="px-3 py-2 text-[11px] font-medium text-gray-700">{a.asset_id}</td>
                                          <td className="px-3 py-2">
                                            <div className="text-[11px] font-semibold text-gray-800 line-clamp-1" title={a.asset_name}>{a.asset_name}</div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="text-[10px] text-gray-600 font-mono leading-tight">{a.serial_number || '-'}</div>
                                            <div className="text-[9px] text-gray-400 font-mono leading-tight">{a.barcode || '-'}</div>
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap ${getStatusColor(a.status)}`}>{a.status}</span>
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex gap-1.5 opacity-70 hover:opacity-100 transition">{renderRowActions(a)}</div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
        {assets.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-500">ไม่พบข้อมูลครุภัณฑ์</p>
          </div>
        )}
      </div>
    );
  };

  // Session-based added assets for printing (Persisted in localStorage)
  const [sessionAddedAssets, setSessionAddedAssets] = useState(() => {
    try {
      const saved = localStorage.getItem("sessionAddedAssets");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem("sessionAddedAssets", JSON.stringify(sessionAddedAssets));
  }, [sessionAddedAssets]);

  const [showBulkPrint, setShowBulkPrint] = useState(false);

  // เมื่อกะบวนการเพิ่มสำเร็จ
  const handleNewAssetSuccess = (newAsset) => {
    fetchAssets(); // รีเฟรชตาราง
    if (newAsset) {
      setSessionAddedAssets(prev => [...prev, newAsset]);
    }
  };

  const clearSessionAssets = () => {
    if (window.confirm("ต้องการล้างรายการพิมพ์บาร์โค้ดใหม่ทั้งหมดหรื่อไม่?")) {
      setSessionAddedAssets([]);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการครุภัณฑ์</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            ค้นหา ตรวจสอบ และจัดการครุภัณฑ์ทั้งหมด
            {totalItems > 0 && <span className="ml-1 text-blue-600 font-medium">({totalItems.toLocaleString()} รายการ)</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchAssets} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm">
            <RefreshCw size={16} /> รีเฟรช
          </button>

          {sessionAddedAssets.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowBulkPrint(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm shadow-lg shadow-emerald-600/20 font-bold"
              >
                <QrCode size={16} /> พิมพ์บาร์โค้ดใหม่ ({sessionAddedAssets.length})
              </button>
              <button
                onClick={clearSessionAssets}
                className="p-2 text-gray-400 hover:text-red-500 transition"
                title="ล้างรายการใหม่"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {canEdit && (
            <>
              <button onClick={() => { setEditingAsset(null); setShowForm(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-600/20">
                <Plus size={16} /> เพิ่มครุภัณฑ์
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          {/* Search */}
          <div className="flex-1 flex gap-2 w-full md:w-auto">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ค้นหาชื่อ, Serial, Barcode, รหัสกองทุน..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
            <button onClick={handleSearch}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium shadow-sm">
              ค้นหา
            </button>
          </div>

          {/* View Toggle + Filter Toggle */}
          <div className="flex gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
                <List size={16} /> รายการ
              </button>
              <button onClick={() => setViewMode("grouped")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === "grouped" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
                <Grid size={16} /> จัดกลุ่ม
              </button>
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition ${showFilters || activeFilterCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <Filter size={16} />
              ตัวกรอง
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">ตัวกรอง</h3>
              <button onClick={handleResetFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <RotateCcw size={12} /> รีเซ็ต
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={filters.status} onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">สถานะ: ทั้งหมด</option>
                <option value="ใช้งานได้">ใช้งานได้</option>
                <option value="รอซ่อม">รอซ่อม</option>
                <option value="รอจำหน่าย">รอจำหน่าย</option>
                <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
                <option value="ไม่พบ">ไม่พบ</option>
              </select>
              <select value={filters.department} onChange={(e) => { setFilters(f => ({ ...f, department: e.target.value })); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">หน่วยงาน: ทั้งหมด</option>
                {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
              </select>
              <select value={filters.building} onChange={(e) => { setFilters(f => ({ ...f, building: e.target.value })); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">อาคาร: ทั้งหมด</option>
                {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={filters.floor} onChange={(e) => { setFilters(f => ({ ...f, floor: e.target.value })); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="all">ชั้น: ทั้งหมด</option>
                {uniqueFloors.map(f => <option key={f} value={f}>ชั้น {f}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <VirtualTable
          columns={tableColumns}
          data={assets}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={(row) => handleViewDetails(row)}
          rowActions={renderRowActions}
          searchable={false}
          showColumnConfig={true}
          stickyFirstColumn={false}
          emptyIcon={<Package size={48} className="text-gray-300" />}
          emptyMessage="ไม่พบข้อมูลครุภัณฑ์"
          maxHeight="calc(100vh - 340px)"
        />
      ) : (
        renderGroupedView()
      )}

      {/* ==================== Asset Detail Modal ==================== */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-800">รายละเอียดครุภัณฑ์</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>

            <div className="p-6">
              {selectedAsset.status === 'ยืม' && currentBorrow && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">กำลังถูกยืมโดย</p>
                      <p className="text-sm font-bold text-gray-900">{currentBorrow.borrower_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">กำหนดคืน</p>
                    <p className={`text-sm font-bold ${new Date(currentBorrow.due_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                      {currentBorrow.due_date || '-'}
                    </p>
                  </div>
                </div>
              )}

              {selectedAsset.image && (
                <img src={`${API_BASE_URL}/${selectedAsset.image}`} alt={selectedAsset.asset_name}
                  className="w-full h-56 object-cover rounded-xl mb-5" />
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'รหัสครุภัณฑ์', value: selectedAsset.asset_id },
                  { label: 'ชื่อครุภัณฑ์', value: selectedAsset.asset_name, span: 2 },
                  { label: 'Serial Number', value: selectedAsset.serial_number },
                  { label: 'Barcode', value: selectedAsset.barcode },
                  { label: 'สถานะ', value: selectedAsset.status, badge: true },
                  { label: 'ราคา', value: selectedAsset.price ? `${Number(selectedAsset.price).toLocaleString('th-TH')} บาท` : '-' },
                  { label: 'จำนวน', value: `${selectedAsset.quantity || 1} ${selectedAsset.unit || ''}` },
                  { label: 'วันที่ตรวจรับ', value: selectedAsset.received_date },
                  { label: 'หน่วยงาน', value: selectedAsset.department_name },
                  { label: 'สถานที่', value: [selectedAsset.building_name, selectedAsset.floor ? `ชั้น ${selectedAsset.floor}` : null, selectedAsset.room_number ? `ห้อง ${selectedAsset.room_number}` : null].filter(Boolean).join(' ') || selectedAsset.room_text },
                  { label: 'รหัสกองทุน', value: selectedAsset.fund_code },
                  { label: 'รหัสแผน', value: selectedAsset.plan_code },
                  { label: 'รหัสโครงการ', value: selectedAsset.project_code },
                  { label: 'คณะ', value: selectedAsset.faculty_name },
                  { label: 'เลขที่ใบส่งของ', value: selectedAsset.delivery_number },
                  { label: 'รายละเอียด', value: selectedAsset.description, span: 3 },
                  { label: 'อ้างอิงใบตรวจรับ', value: selectedAsset.reference_number },
                ].map((item, idx) => (
                  <div key={idx} className={item.span ? `col-span-${item.span}` : ''}>
                    <label className="text-xs text-gray-500 block mb-0.5">{item.label}</label>
                    {item.badge ? (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(item.value)}`}>{item.value}</span>
                    ) : (
                      <p className="text-sm font-medium text-gray-800">{item.value || '-'}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setQrAsset(selectedAsset); setShowQRModal(true); }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm flex items-center gap-1.5">
                  <QrCode size={16} /> บาร์โค้ด
                </button>
                <button onClick={() => setSelectedAsset(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition text-sm">ปิด</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms & Modals */}
      {showForm && (
        <AssetForm asset={editingAsset} onClose={() => { setShowForm(false); setEditingAsset(null); }} onSuccess={handleNewAssetSuccess} />
      )}
      {showQRModal && qrAsset && (
        <QRCodeModal asset={qrAsset} onClose={() => { setShowQRModal(false); setQrAsset(null); }} />
      )}
      {showBulkPrint && sessionAddedAssets.length > 0 && (
        <BulkQRGenerator assets={sessionAddedAssets} onClose={() => setShowBulkPrint(false)} />
      )}
    </div>
  );
}
