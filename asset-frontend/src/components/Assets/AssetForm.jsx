// FILE: src/components/Assets/AssetForm.jsx
// เพิ่ม field ใหม่: fund_code, plan_code, project_code, faculty_name, delivery_number, room_text
import { useState, useEffect } from "react";
import { X, Plus, ChevronDown, ChevronRight, ClipboardList, Tag, MapPin, FileText } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ASSET_STATUS } from "../../utils/constants";

export default function AssetForm({ asset, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    asset_name: "",
    serial_number: "",
    quantity: 1,
    unit: "เครื่อง",
    price: "",
    received_date: new Date().toISOString().split("T")[0],
    department_id: "",
    location_id: "",
    room_text: "",
    status: "ใช้งานได้",
    barcode: "",
    description: "",
    reference_number: "",
    fund_code: "",
    plan_code: "",
    project_code: "",
    faculty_name: "",
    delivery_number: "",
  });

  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({ department_name: "" });
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    codes: true,
    location: true,
    details: false,
  });

  useEffect(() => {
    fetchDepartments();
    fetchLocations();

    if (asset) {
      setFormData({
        asset_name: asset.asset_name || "",
        serial_number: asset.serial_number || "",
        quantity: asset.quantity || 1,
        unit: asset.unit || "เครื่อง",
        price: asset.price || "",
        received_date: asset.received_date || "",
        department_id: asset.department_id || "",
        location_id: asset.location_id || "",
        room_text: asset.room_text || "",
        status: asset.status || "ใช้งานได้",
        barcode: asset.barcode || "",
        description: asset.description || "",
        reference_number: asset.reference_number || "",
        fund_code: asset.fund_code || "",
        plan_code: asset.plan_code || "",
        project_code: asset.project_code || "",
        faculty_name: asset.faculty_name || "",
        delivery_number: asset.delivery_number || "",
      });
    }
  }, [asset]);

  const formatLocation = (loc) => {
    if (!loc) return "";
    return `${loc.building_name || ""} ชั้น ${loc.floor || "-"} ห้อง ${loc.room_number || "-"}`;
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get("/locations");
      setLocations(response.data.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setAddingDepartment(true);
    try {
      const response = await api.post("/departments", {
        department_name: departmentFormData.department_name,
        faculty: "",
      });
      const newDepartmentId = response.data.data.department_id;
      await fetchDepartments();
      setFormData((prev) => ({ ...prev, department_id: newDepartmentId }));
      setShowDepartmentForm(false);
      setDepartmentFormData({ department_name: "" });
      toast.success("เพิ่มหน่วยงานสำเร็จ");
    } catch (error) {
      toast.error(error.response?.data?.message || "ไม่สามารถเพิ่มหน่วยงานได้");
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (asset) {
        const oldLocationId = asset.location_id;
        const newLocationId = formData.location_id;
        await api.put(`/assets/${asset.asset_id}`, formData);
        if (oldLocationId && newLocationId && oldLocationId !== newLocationId) {
          try {
            await api.post("/history", {
              asset_id: asset.asset_id,
              old_location_id: oldLocationId,
              new_location_id: newLocationId,
              move_date: new Date().toISOString().split("T")[0],
              remark: "แก้ไขสถานที่ผ่านหน้าจัดการครุภัณฑ์",
            });
          } catch (historyError) {
            console.error("ไม่สามารถบันทึกประวัติได้:", historyError);
          }
        }
        toast.success("แก้ไขครุภัณฑ์สำเร็จ");
      } else {
        const dataToSend = { ...formData, barcode: formData.barcode || `QR${Date.now()}` };
        await api.post("/assets", dataToSend);
        toast.success("เพิ่มครุภัณฑ์สำเร็จ");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ id, title, icon }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {expandedSections[id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {asset ? "แก้ไขครุภัณฑ์" : "เพิ่มครุภัณฑ์ใหม่"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">กรอกข้อมูลให้ครบถ้วน (*จำเป็น)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-1">
          {/* ==================== ข้อมูลพื้นฐาน ==================== */}
          <SectionHeader id="basic" title="ข้อมูลพื้นฐาน" icon={<ClipboardList size={18} className="text-blue-600" />} />
          {expandedSections.basic && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อครุภัณฑ์ <span className="text-red-500">*</span>
                </label>
                <input type="text" name="asset_name" value={formData.asset_name} onChange={handleChange} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น เครื่องคอมพิวเตอร์ Dell Optiplex" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input type="text" name="serial_number" value={formData.serial_number} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SN123456789" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode/QR Code</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="QR001234567" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน <span className="text-red-500">*</span></label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยนับ</label>
                <select name="unit" value={formData.unit} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="เครื่อง">เครื่อง</option>
                  <option value="ชุด">ชุด</option>
                  <option value="อัน">อัน</option>
                  <option value="ตัว">ตัว</option>
                  <option value="ชิ้น">ชิ้น</option>
                  <option value="หลัง">หลัง</option>
                  <option value="คัน">คัน</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="25000.00" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ตรวจรับ</label>
                <input type="date" name="received_date" value={formData.received_date} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {Object.values(ASSET_STATUS).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ==================== รหัสงบประมาณ ==================== */}
          <SectionHeader id="codes" title="รหัสงบประมาณ" icon={<Tag size={18} className="text-purple-600" />} />
          {expandedSections.codes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสกองทุน (Fund Code)</label>
                <input type="text" name="fund_code" value={formData.fund_code} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น 1100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสแผน (Plan Code)</label>
                <input type="text" name="plan_code" value={formData.plan_code} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น P2568001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสโครงการ (Project Code)</label>
                <input type="text" name="project_code" value={formData.project_code} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น PRJ-2568-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คณะ/หน่วยงาน (Faculty)</label>
                <input type="text" name="faculty_name" value={formData.faculty_name} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น คณะเทคโนโลยีสารสนเทศ" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ใบส่งของ (Delivery Number)</label>
                <input type="text" name="delivery_number" value={formData.delivery_number} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น DLV-2568-001" />
              </div>
            </div>
          )}

          {/* ==================== สถานที่ ==================== */}
          <SectionHeader id="location" title="สถานที่และหน่วยงาน" icon={<MapPin size={18} className="text-red-600" />} />
          {expandedSections.location && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน</label>
                <div className="flex gap-2">
                  <select name="department_id" value={formData.department_id} onChange={handleChange}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">-- เลือกหน่วยงาน --</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowDepartmentForm(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-1"
                    title="เพิ่มหน่วยงานใหม่">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ (อาคาร/ชั้น/ห้อง)</label>
                <select name="location_id" value={formData.location_id} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">-- เลือกสถานที่ --</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>{formatLocation(loc)}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ห้อง (ข้อความ)</label>
                <input type="text" name="room_text" value={formData.room_text} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ระบุห้อง (กรณีไม่มีในรายการ)" />
              </div>
            </div>
          )}

          {/* ==================== รายละเอียดเพิ่มเติม ==================== */}
          <SectionHeader id="details" title="รายละเอียดเพิ่มเติม" icon={<FileText size={18} className="text-orange-600" />} />
          {expandedSections.details && (
            <div className="grid grid-cols-1 gap-4 pb-4 border-b border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คุณสมบัติและรายละเอียด</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น คุณสมบัติ : ทำด้วยเหล็ก ขนาด 700x350x700 มม." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อ้างอิงใบตรวจรับ</label>
                <input type="text" name="reference_number" value={formData.reference_number} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น 3050200125632" />
              </div>
            </div>
          )}

          {/* ปุ่ม */}
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium">
              ยกเลิก
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-blue-600/20">
              {loading ? "กำลังบันทึก..." : asset ? "บันทึกการแก้ไข" : "เพิ่มครุภัณฑ์"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal เพิ่มหน่วยงาน */}
      {showDepartmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">เพิ่มหน่วยงานใหม่</h3>
              <button onClick={() => { setShowDepartmentForm(false); setDepartmentFormData({ department_name: "" }); }}
                className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อหน่วยงานหรือคณะ <span className="text-red-500">*</span>
                </label>
                <input type="text" value={departmentFormData.department_name}
                  onChange={(e) => setDepartmentFormData({ department_name: e.target.value })}
                  required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น ภาควิชาวิทยาการคอมพิวเตอร์" />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => { setShowDepartmentForm(false); setDepartmentFormData({ department_name: "" }); }}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={addingDepartment}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {addingDepartment ? "กำลังบันทึก..." : "เพิ่มหน่วยงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
