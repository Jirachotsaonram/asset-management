import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  Truck,
  Search,
  Plus,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  X,
  Package,
  Building,
  FileText,
  Download,
  CheckCircle,
} from "lucide-react";

export default function AssetHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState({
    start: "",
    end: "",
  });

  const [formData, setFormData] = useState({
    asset_id: "",
    old_location_id: "",
    new_location_id: "",
    move_date: new Date().toISOString().split("T")[0],
    remark: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // ฟังก์ชันจัดรูปแบบการแสดง Location
  const formatLocation = (location) => {
    if (!location) return "-";

    const { building_name, floor, room_number } = location;

    // แสดงแบบเต็ม: "อาคาร A ชั้น 4 ห้อง 01"
    return `${building_name || ""} ชั้น ${floor || "-"} ห้อง ${
      room_number || "-"
    }`.trim();
  };

  const fetchData = async () => {
    try {
      console.log("🔄 Fetching data...");

      const [historyRes, assetsRes, locationsRes] = await Promise.all([
        api.get("/history"),
        api.get("/assets"),
        api.get("/locations"),
      ]);

      console.log("✅ History:", historyRes.data.data);
      console.log("✅ Assets:", assetsRes.data.data);
      console.log("✅ Locations:", locationsRes.data.data);

      setHistory(historyRes.data.data || []);
      setAssets(assetsRes.data.data || []);
      setLocations(locationsRes.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchSearch =
      item.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset_id?.toString().includes(searchTerm) ||
      item.moved_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDate =
      (!filterDate.start || item.move_date >= filterDate.start) &&
      (!filterDate.end || item.move_date <= filterDate.end);

    return matchSearch && matchDate;
  });

  const handleOpenModal = () => {
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
    console.log("Selected Asset ID:", assetId);
    console.log("All Assets:", assets);

    if (!assetId) {
      setFormData({
        ...formData,
        asset_id: "",
        old_location_id: "",
      });
      return;
    }

    const selectedAsset = assets.find(
      (a) => String(a.asset_id) === String(assetId)
    );
    console.log("Found Asset:", selectedAsset);

    if (selectedAsset) {
      setFormData({
        ...formData,
        asset_id: assetId,
        old_location_id: selectedAsset.location_id || "",
      });
    } else {
      // ถ้าหาไม่เจอ ลองใช้ค่าที่เลือก
      setFormData({
        ...formData,
        asset_id: assetId,
        old_location_id: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.asset_id || !formData.new_location_id) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.old_location_id === formData.new_location_id) {
      toast.error("สถานที่เดิมและสถานที่ใหม่ต้องไม่เหมือนกัน");
      return;
    }

    try {
      const submitData = {
        ...formData,
        moved_by: user.user_id,
      };

      await api.post("/history", submitData);

      await api.put(`/assets/${formData.asset_id}`, {
        location_id: formData.new_location_id,
      });

      toast.success("บันทึกการย้ายสำเร็จ");
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("ไม่สามารถบันทึกได้");
    }
  };

  const exportToCSV = () => {
    let csv =
      "วันที่ย้าย,รหัสครุภัณฑ์,ชื่อครุภัณฑ์,จาก,ไปยัง,ผู้ดำเนินการ,หมายเหตุ\n";

    filteredHistory.forEach((item) => {
      csv += `"${item.move_date}","${item.asset_id}","${item.asset_name}","${
        item.old_building
      }","${item.old_floor}","${item.old_room}","${item.new_building}","${
        item.new_floor
      }","${item.new_room}","${item.moved_by_name}","${item.remark || ""}"\n`;
    });

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `asset_movement_history_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();

    toast.success("Export สำเร็จ");
  };

  const stats = {
    total: history.length,
    thisMonth: history.filter((h) => {
      const moveDate = new Date(h.move_date);
      const now = new Date();
      return (
        moveDate.getMonth() === now.getMonth() &&
        moveDate.getFullYear() === now.getFullYear()
      );
    }).length,
    thisWeek: history.filter((h) => {
      const moveDate = new Date(h.move_date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return moveDate >= weekAgo;
    }).length,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Truck className="text-blue-600" size={36} />
            ประวัติการเคลื่อนย้าย
          </h1>
          <p className="text-gray-600 mt-1">
            บันทึกการย้ายครุภัณฑ์ระหว่างสถานที่
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition shadow-md"
        >
          <Plus size={20} />
          บันทึกการย้าย
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">การย้ายทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats.total}
              </p>
            </div>
            <div className="bg-blue-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Truck className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">เดือนนี้</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.thisMonth}
              </p>
            </div>
            <div className="bg-green-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">สัปดาห์นี้</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.thisWeek}
              </p>
            </div>
            <div className="bg-purple-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <MapPin className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาครุภัณฑ์หรือผู้ดำเนินการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <input
              type="date"
              value={filterDate.start}
              onChange={(e) =>
                setFilterDate({ ...filterDate, start: e.target.value })
              }
              placeholder="วันที่เริ่มต้น"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={filterDate.end}
              onChange={(e) =>
                setFilterDate({ ...filterDate, end: e.target.value })
              }
              placeholder="วันที่สิ้นสุด"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition"
              title="Export CSV"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={24} />
            บันทึกการเคลื่อนย้าย ({filteredHistory.length} รายการ)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">ยังไม่มีประวัติการเคลื่อนย้าย</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.history_id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                    <Truck className="text-blue-600" size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.asset_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          รหัส: {item.asset_id}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={16} />
                        {item.move_date}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 mb-3">
                      <div className="flex-1 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-600 font-medium mb-1">
                          จาก
                        </p>
                        <div className="flex items-center gap-2 text-green-800">
                          <Building size={16} />
                          <span className="font-semibold">
                            {formatLocation({
                              building_name: item.old_building,
                              floor: item.old_floor,
                              room_number: item.old_room,
                            })}
                          </span>
                        </div>
                      </div>

                      <ArrowRight
                        className="text-gray-400 flex-shrink-0"
                        size={24}
                      />

                      <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium mb-1">
                          ไปยัง
                        </p>
                        <div className="flex items-center gap-2 text-green-800">
                          <Building size={16} />
                          <span className="font-semibold">
                            {formatLocation({
                              building_name: item.new_building,
                              floor: item.new_floor,
                              room_number: item.new_room,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        <span>
                          ผู้ดำเนินการ: <strong>{item.moved_by_name}</strong>
                        </span>
                      </div>
                      {item.remark && (
                        <div className="flex items-center gap-1">
                          <FileText size={16} />
                          <span>หมายเหตุ: {item.remark}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Truck className="text-blue-600" size={28} />
                  บันทึกการย้ายครุภัณฑ์
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package size={16} className="inline mr-1" />
                  เลือกครุภัณฑ์ *
                </label>
                <select
                  value={formData.asset_id || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    console.log("Dropdown onChange:", selectedId);
                    handleAssetChange(selectedId);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- เลือกครุภัณฑ์ --</option>
                  {assets && assets.length > 0 ? (
                    assets.map((asset) => (
                      <option key={asset.asset_id} value={asset.asset_id}>
                        {asset.asset_id} - {asset.asset_name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      ไม่มีข้อมูลครุภัณฑ์
                    </option>
                  )}
                </select>
                {formData.asset_id && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} />
                    เลือก:{" "}
                    {assets.find(
                      (a) => String(a.asset_id) === String(formData.asset_id)
                    )?.asset_name || "กำลังโหลด..."}
                  </p>
                )}
                {assets.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ ไม่มีข้อมูลครุภัณฑ์ กรุณารีเฟรชหน้าเว็บ
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  สถานที่เดิม
                </label>
                <select
                  value={formData.old_location_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      old_location_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled
                >
                  <option value="">-- สถานที่เดิม --</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {formatLocation(loc)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  จะถูกเติมอัตโนมัติจากสถานที่ปัจจุบันของครุภัณฑ์
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  สถานที่ใหม่ *
                </label>
                <select
                  value={formData.new_location_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      new_location_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- เลือกสถานที่ --</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {formatLocation(loc)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  วันที่ย้าย *
                </label>
                <input
                  type="date"
                  value={formData.move_date}
                  onChange={(e) =>
                    setFormData({ ...formData, move_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-1" />
                  หมายเหตุ
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) =>
                    setFormData({ ...formData, remark: e.target.value })
                  }
                  placeholder="ระบุเหตุผลหรือรายละเอียดการย้าย..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-semibold"
                >
                  บันทึกการย้าย
                </button>
                <button
                  onClick={() => setShowModal(false)}
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
