// FILE: src/pages/LocationsPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, MapPin, Building, X } from 'lucide-react';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    building_name: '',
    room_number: '',
    description: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        building_name: location.building_name,
        room_number: location.room_number,
        description: location.description || ''
      });
    } else {
      setEditingLocation(null);
      setFormData({
        building_name: '',
        room_number: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setFormData({
      building_name: '',
      room_number: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.building_name.trim() || !formData.room_number.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      if (editingLocation) {
        // Update
        await api.put(`/locations/${editingLocation.location_id}`, formData);
        toast.success('แก้ไขสถานที่สำเร็จ');
      } else {
        // Create
        await api.post('/locations', formData);
        toast.success('เพิ่มสถานที่สำเร็จ');
      }
      
      handleCloseModal();
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error(editingLocation ? 'แก้ไขไม่สำเร็จ' : 'เพิ่มไม่สำเร็จ');
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm('ต้องการลบสถานที่นี้หรือไม่?')) {
      return;
    }

    try {
      await api.delete(`/locations/${locationId}`);
      toast.success('ลบสถานที่สำเร็จ');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('ไม่สามารถลบได้ อาจมีครุภัณฑ์อยู่ในสถานที่นี้');
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการสถานที่</h1>
          <p className="text-gray-600 mt-1">จัดการอาคารและห้องต่างๆ</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition shadow-md"
        >
          <Plus size={20} />
          เพิ่มสถานที่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">สถานที่ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{locations.length}</p>
            </div>
            <div className="bg-blue-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <MapPin className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">อาคาร</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {new Set(locations.map(l => l.building_name)).size}
              </p>
            </div>
            <div className="bg-green-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Building className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ห้อง</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{locations.length}</p>
            </div>
            <div className="bg-purple-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <MapPin className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">อาคาร</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ห้อง</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">รายละเอียด</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.location_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">{location.location_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {location.building_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{location.room_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {location.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(location)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="แก้ไข"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(location.location_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="ลบ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ยังไม่มีข้อมูลสถานที่</p>
            <p className="text-sm mt-2">เพิ่มสถานที่เพื่อเริ่มต้นใช้งาน</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingLocation ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อ อาคาร *
                  </label>
                  <input
                    type="text"
                    value={formData.building_name}
                    onChange={(e) => setFormData({...formData, building_name: e.target.value})}
                    placeholder="เช่น อาคาร 1, อาคารเรียนรวม"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขห้อง *
                  </label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                    placeholder="เช่น 101, ห้องประชุม"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-semibold"
                >
                  {editingLocation ? 'บันทึกการแก้ไข' : 'เพิ่มสถานที่'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-semibold"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}