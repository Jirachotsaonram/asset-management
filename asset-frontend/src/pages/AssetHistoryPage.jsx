// FILE: src/pages/AssetHistoryPage.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  Truck, Search, Package, MapPin, Calendar, User, ArrowRight, X,
  Building, FileText, Download, CheckCircle, RefreshCw, Filter,
  Clock, TrendingUp, ChevronDown, ChevronRight, AlertCircle, ChevronLeft
} from "lucide-react";

const ITEMS_PER_PAGE = 50;

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
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    asset_id: "",
    old_location_id: null,
    old_room_text: "",
    new_location_id: "",
    room_text: "", // new room text
    move_date: new Date().toISOString().split("T")[0],
    remark: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

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
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const uniqueBuildings = useMemo(() => {
    const buildings = new Set();
    history.forEach(item => {
      if (item.old_building) buildings.add(item.old_building);
      if (item.new_building) buildings.add(item.new_building);
    });
    return Array.from(buildings).sort();
  }, [history]);

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

    switch (sortBy) {
      case "date_desc": result.sort((a, b) => new Date(b.move_date) - new Date(a.move_date)); break;
      case "date_asc": result.sort((a, b) => new Date(a.move_date) - new Date(b.move_date)); break;
      case "asset": result.sort((a, b) => (a.asset_name || "").localeCompare(b.asset_name || "")); break;
    }
    return result;
  }, [history, searchTerm, filterDate, filterBuilding, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = history.length;
    const thisMonth = history.filter(h => new Date(h.move_date) >= monthStart).length;
    const today = history.filter(h => h.move_date === now.toISOString().split('T')[0]).length;

    const assetMoves = {};
    history.forEach(h => { assetMoves[h.asset_id] = (assetMoves[h.asset_id] || 0) + 1; });
    const frequentMoves = Object.entries(assetMoves).filter(([, count]) => count > 3).length;

    return { total, thisMonth, today, frequentMoves };
  }, [history]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const handleAssetChange = (assetId) => {
    if (!assetId) {
      setFormData({ ...formData, asset_id: "", old_location_id: null, old_room_text: "", room_text: "" });
      return;
    }
    const selectedAsset = assets.find(a => String(a.asset_id) === String(assetId));
    setFormData({
      ...formData,
      asset_id: assetId,
      old_location_id: selectedAsset?.location_id || null,
      old_room_text: selectedAsset?.room_text || "",
      room_text: selectedAsset?.room_text || "" // Default new room to old room
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.asset_id || !formData.new_location_id) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/history", { ...formData, moved_by: user.user_id });
      toast.success("บันทึกการย้ายสำเร็จ");
      setShowModal(false);
      setFormData({
        asset_id: "",
        old_location_id: null,
        old_room_text: "",
        new_location_id: "",
        room_text: "",
        move_date: new Date().toISOString().split("T")[0],
        remark: "",
      });
      fetchData();
    } catch (error) {
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    let csv = "\ufeffวันที่ย้าย,รหัสครุภัณฑ์,ชื่อครุภัณฑ์,จาก,ไป,ผู้ดำเนินการ,หมายเหตุ\n";
    filteredHistory.forEach((item) => {
      const from = `${item.old_building || ''} ห้อง ${item.old_room || ''}`.trim();
      const to = `${item.new_building || ''} ห้อง ${item.new_room || ''}`.trim();
      csv += `"${item.move_date}","${item.asset_id}","${item.asset_name}","${from}","${to}","${item.moved_by_name}","${item.remark || ''}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `move_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export สำเร็จ");
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการเคลื่อนย้าย</h1>
          <p className="text-gray-500 mt-1">ติดตามการย้ายครุภัณฑ์ระหว่างสถานที่</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2"><RefreshCw size={18} /><span>รีเฟรช</span></button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Truck size={20} />บันทึกการย้าย</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="การย้ายทั้งหมด" value={stats.total} icon={Truck} color="primary" />
        <StatCard label="ย้ายเดือนนี้" value={stats.thisMonth} icon={Calendar} color="success" />
        <StatCard label="ย้ายวันนี้" value={stats.today} icon={Clock} color="info" />
        <StatCard label="ย้ายบ่อย (>3)" value={stats.frequentMoves} icon={TrendingUp} color="warning" />
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="text" placeholder="ค้นหาครุภัณฑ์, ผู้ดำเนินการ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={filterDate.start} onChange={(e) => setFilterDate({ ...filterDate, start: e.target.value })} className="form-input text-sm w-36" title="จากวันที่" />
            <input type="date" value={filterDate.end} onChange={(e) => setFilterDate({ ...filterDate, end: e.target.value })} className="form-input text-sm w-36" title="ถึงวันที่" />
            <select value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)} className="form-select text-sm min-w-[120px]">
              <option value="all">ทุกอาคาร</option>
              {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <button onClick={exportToCSV} className="btn-secondary bg-success-50 text-success-700 border-success-200 hover:bg-success-100"><Download size={18} /><span className="hidden sm:inline">Export</span></button>
          </div>
        </div>

        <div className="space-y-3">
          {paginatedHistory.map((item) => (
            <HistoryCard
              key={item.history_id}
              item={item}
              isExpanded={expandedItems[item.history_id]}
              onToggle={() => setExpandedItems(prev => ({ ...prev, [item.history_id]: !prev[item.history_id] }))}
            />
          ))}
          {filteredHistory.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Truck size={48} className="mx-auto mb-2 opacity-20" />
              <p>ไม่พบประวัติการเคลื่อนย้าย</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-500">แสดง {paginatedHistory.length} จาก {filteredHistory.length} รายการ</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg border disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="flex items-center px-4 font-bold text-gray-700">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg border disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <MoveModal
          formData={formData} setFormData={setFormData} assets={assets} locations={locations}
          onAssetChange={handleAssetChange} onSubmit={handleSubmit}
          onClose={() => setShowModal(false)} submitting={submitting}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    info: 'bg-blue-50 text-blue-600',
    warning: 'bg-warning-50 text-warning-600'
  };
  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value.toLocaleString()}</p>
      </div>
      <div className={`${colors[color]} p-3 rounded-2xl shadow-inner`}><Icon size={24} /></div>
    </div>
  );
}

function HistoryCard({ item, isExpanded, onToggle }) {
  return (
    <div className={`border rounded-2xl transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-primary-500 border-primary-500 shadow-lg' : 'hover:border-primary-200'}`}>
      <div className="p-4 cursor-pointer flex items-center gap-4" onClick={onToggle}>
        <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500"><Truck size={20} /></div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{item.asset_name}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded">ID: {item.asset_id}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {item.move_date}</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-sm px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 font-medium">
          <div className="text-danger-600">{item.old_building || '-'}</div>
          <ArrowRight size={14} className="text-gray-400" />
          <div className="text-success-600">{item.new_building || '-'}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase">Moved By</p>
          <p className="text-sm font-bold text-gray-700">{item.moved_by_name}</p>
        </div>
        <ChevronRight size={20} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90 text-primary-500' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
          <div className="ml-12 border-l-2 border-dashed border-gray-200 pl-6 space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-danger-500 uppercase tracking-widest">Original Location</p>
                <div className="bg-white p-3 rounded-xl border border-danger-100 shadow-sm">
                  <p className="text-sm font-bold text-gray-800">{item.old_building || 'ไม่ระบุ'}</p>
                  <p className="text-xs text-gray-500">ชั้น {item.old_floor || '-'} ห้อง {item.old_room || '-'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-success-500 uppercase tracking-widest">New Location</p>
                <div className="bg-white p-3 rounded-xl border border-success-100 shadow-sm ring-2 ring-success-50">
                  <p className="text-sm font-bold text-gray-800">{item.new_building || 'ไม่ระบุ'}</p>
                  <p className="text-xs text-gray-500">ชั้น {item.new_floor || '-'} ห้อง {item.new_room || '-'}</p>
                </div>
              </div>
            </div>
            {item.remark && (
              <div className="bg-blue-50/50 p-3 rounded-xl border-l-4 border-primary-500">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Movement Remark</p>
                <p className="text-sm italic text-gray-700">{item.remark}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MoveModal({ formData, setFormData, assets, locations, onAssetChange, onSubmit, onClose, submitting }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableAssets = useMemo(() =>
    assets.filter(a =>
      a.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_id?.toString().includes(search) ||
      a.serial_number?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20),
    [assets, search]);

  useEffect(() => {
    const handleClick = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedAsset = assets.find(a => String(a.asset_id) === String(formData.asset_id));
  const currentLocation = locations.find(l => String(l.location_id) === String(formData.old_location_id));

  const groupedLocations = useMemo(() => {
    const groups = {};
    locations.forEach(l => {
      const b = l.building_name || 'ไม่ระบุอาคาร';
      if (!groups[b]) groups[b] = [];
      groups[b].push(l);
    });
    return groups;
  }, [locations]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">บันทึกการย้ายครุภัณฑ์</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">เลือกครุภัณฑ์ <span className="text-danger-500">*</span></label>
            <div onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-3 border-2 rounded-2xl cursor-pointer hover:border-primary-300 transition">
              <Package size={20} className="text-gray-400" />
              <div className="flex-1">
                {selectedAsset ? (
                  <div>
                    <p className="font-bold text-sm text-gray-900">{selectedAsset.asset_name}</p>
                    <p className="text-[10px] text-gray-500">ID: {selectedAsset.asset_id} • SN: {selectedAsset.serial_number || '-'}</p>
                  </div>
                ) : <span className="text-gray-400 text-sm">ค้นหาครุภัณฑ์ที่ต้องการย้าย...</span>}
              </div>
              <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="p-2 border-b"><input autoFocus placeholder="พิมพ์ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 ring-primary-100" /></div>
                <div className="max-h-52 overflow-y-auto">
                  {availableAssets.map(a => (
                    <div key={a.asset_id} onClick={() => { onAssetChange(a.asset_id); setIsOpen(false); }} className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b last:border-0 text-sm">
                      <p className="font-bold">{a.asset_name}</p>
                      <p className="text-[10px] text-gray-500">ID: {a.asset_id} • SN: {a.serial_number || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">สถานที่ปัจจุบัน</label>
              <div className="bg-gray-50 p-3 rounded-2xl border-2 border-gray-100 text-xs text-gray-600 italic">
                {currentLocation ? (
                  <>
                    {currentLocation.building_name} ชั้น {currentLocation.floor} ห้อง {currentLocation.room_number}
                    {formData.old_room_text && <span className="block text-primary-600 mt-1 font-bold">({formData.old_room_text})</span>}
                  </>
                ) : (formData.old_room_text || '-')}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">สถานที่ใหม่ <span className="text-danger-500">*</span></label>
              <select
                value={formData.new_location_id}
                onChange={e => setFormData({ ...formData, new_location_id: e.target.value })}
                className="form-select h-11 rounded-2xl border-2" required
              >
                <option value="">-- เลือกสถานที่ใหม่ --</option>
                {Object.entries(groupedLocations).map(([b, locs]) => (
                  <optgroup key={b} label={b}>
                    {locs.map(l => (
                      <option key={l.location_id} value={l.location_id} disabled={String(l.location_id) === String(formData.old_location_id)}>
                        ชั้น {l.floor} ห้อง {l.room_number}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">วันที่ย้าย <span className="text-danger-500">*</span></label>
              <input type="date" value={formData.move_date} onChange={e => setFormData({ ...formData, move_date: e.target.value })} className="form-input h-11 rounded-2xl border-2" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">ห้อง/สถานที่ใหม่ (ระบุเอง)</label>
              <input type="text" value={formData.room_text} onChange={e => setFormData({ ...formData, room_text: e.target.value })} placeholder="เช่น ห้อง 405 (เดิม), ตึกวิศวกรรม..." className="form-input h-11 rounded-2xl border-2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">หมายเหตุ</label>
            <textarea rows="2" value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className="form-input rounded-2xl border-2 p-3 resize-none" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 h-12 rounded-2xl justify-center font-black disabled:opacity-50">
              {submitting ? <RefreshCw className="animate-spin" /> : 'บันทึกการย้าย'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12 rounded-2xl justify-center font-black">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
