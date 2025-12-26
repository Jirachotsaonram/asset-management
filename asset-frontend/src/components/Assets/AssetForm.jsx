// FILE: src/components/Assets/AssetForm.jsx
import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
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
    status: "ใช้งานได้",
    barcode: "",
  });

  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [departmentFormData, setDepartmentFormData] = useState({
    department_name: "",
  });
  const [addingDepartment, setAddingDepartment] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchLocations();

    // ถ้ามีข้อมูล asset (แก้ไข) ให้ใส่ข้อมูลเดิม
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
        status: asset.status || "ใช้งานได้",
        barcode: asset.barcode || "",
      });
    }
  }, [asset]);

  const formatLocation = (loc) => {
    if (!loc) return "";
    return `${loc.building_name || ""} ชั้น ${loc.floor || "-"} ห้อง ${
      loc.room_number || "-"
    }`;
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setAddingDepartment(true);

    try {
      // ส่งข้อมูลไปยัง API โดยให้ faculty เป็นค่าว่าง
      const dataToSend = {
        department_name: departmentFormData.department_name,
        faculty: "",
      };
      const response = await api.post("/departments", dataToSend);
      const newDepartmentId = response.data.data.department_id;

      // Refresh รายการหน่วยงาน
      await fetchDepartments();

      // เลือกหน่วยงานที่เพิ่มใหม่
      setFormData((prev) => ({
        ...prev,
        department_id: newDepartmentId,
      }));

      // ปิด modal และ reset form
      setShowDepartmentForm(false);
      setDepartmentFormData({
        department_name: "",
      });

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
        // *** เก็บ location_id เดิมไว้ก่อน ***
        const oldLocationId = asset.location_id;
        const newLocationId = formData.location_id;

        // แก้ไข Asset
        await api.put(`/assets/${asset.asset_id}`, formData);

        // *** ถ้ามีการเปลี่ยนสถานที่ ให้บันทึกประวัติ ***
        if (oldLocationId && newLocationId && oldLocationId !== newLocationId) {
          try {
            await api.post("/history", {
              asset_id: asset.asset_id,
              old_location_id: oldLocationId,
              new_location_id: newLocationId,
              move_date: new Date().toISOString().split("T")[0],
              remark: "แก้ไขสถานที่ผ่านหน้าจัดการครุภัณฑ์",
            });
            console.log("✅ บันทึกประวัติการย้ายสำเร็จ");
          } catch (historyError) {
            console.error("⚠️ ไม่สามารถบันทึกประวัติได้:", historyError);
            // ไม่ให้ error นี้ทำให้การอัปเดต Asset ล้มเหลว
          }
        }

        toast.success("แก้ไขครุภัณฑ์สำเร็จ");
      } else {
        // เพิ่มใหม่
        const dataToSend = {
          ...formData,
          barcode: formData.barcode || `QR${Date.now()}`,
        };
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {asset ? "แก้ไขครุภัณฑ์" : "เพิ่มครุภัณฑ์ใหม่"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ชื่อครุภัณฑ์ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อครุภัณฑ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="asset_name"
                value={formData.asset_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น เครื่องคอมพิวเตอร์ Dell Optiplex"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SN123456789"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode/QR Code
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="QR001234567"
              />
            </div>

            {/* จำนวน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวน <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* หน่วยนับ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน่วยนับ
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="เครื่อง">เครื่อง</option>
                <option value="ชุด">ชุด</option>
                <option value="อัน">อัน</option>
                <option value="ตัว">ตัว</option>
              </select>
            </div>

            {/* ราคา */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคา (บาท)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="25000.00"
              />
            </div>

            {/* วันที่ตรวจรับ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่ตรวจรับ
              </label>
              <input
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* หน่วยงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน่วยงาน
              </label>
              <div className="flex gap-2">
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- เลือกหน่วยงาน --</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowDepartmentForm(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                  title="เพิ่มหน่วยงานใหม่"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* สถานที่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานที่
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกสถานที่ --</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {formatLocation(loc)}
                  </option>
                ))}
              </select>
            </div>

            {/* สถานะ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(ASSET_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ปุ่ม */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "กำลังบันทึก..."
                : asset
                ? "บันทึกการแก้ไข"
                : "เพิ่มครุภัณฑ์"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal เพิ่มหน่วยงาน */}
      {showDepartmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">เพิ่มหน่วยงานใหม่</h3>
              <button
                onClick={() => {
                  setShowDepartmentForm(false);
                  setDepartmentFormData({
                    department_name: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อหน่วยงานหรือคณะ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={departmentFormData.department_name}
                  onChange={(e) =>
                    setDepartmentFormData({
                      department_name: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น ภาควิชาวิทยาการคอมพิวเตอร์ หรือ คณะเทคโนโลยีสารสนเทศ"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentForm(false);
                    setDepartmentFormData({
                      department_name: "",
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addingDepartment}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
