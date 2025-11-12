import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Eye, Upload, X, Package, QrCode } from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';
import AssetForm from '../components/Assets/AssetForm';
import QRCodeModal from '../components/Assets/QRCodeModal';
import BulkQRGenerator from '../components/Assets/BulkQRGenerator';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);
  const [showBulkQR, setShowBulkQR] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data.data);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
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
      toast.error('ค้นหาไม่สำเร็จ');
    }
  };

  const handleUploadImage = async (assetId, file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      await api.post(`/upload/asset/${assetId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('อัปโหลดรูปภาพสำเร็จ');
      fetchAssets();
    } catch (error) {
      toast.error('อัปโหลดไม่สำเร็จ');
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('ต้องการลบครุภัณฑ์นี้หรือไม่?')) {
      return;
    }

    try {
      await api.delete(`/assets/${assetId}`);
      toast.success('ลบครุภัณฑ์สำเร็จ');
      fetchAssets();
    } catch (error) {
      toast.error('ไม่สามารถลบได้');
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
      'ใช้งานได้': 'bg-green-100 text-green-800',
      'รอซ่อม': 'bg-yellow-100 text-yellow-800',
      'รอจำหน่าย': 'bg-orange-100 text-orange-800',
      'จำหน่ายแล้ว': 'bg-gray-100 text-gray-800',
      'ไม่พบ': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">จัดการครุภัณฑ์</h1>
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
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
      </div>

      {/* Assets Table */}
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
              {assets.map((asset) => (
                <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative group">
                      {asset.image ? (
                        <img
                          src={`${API_BASE_URL}/${asset.image}`}
                          alt={asset.asset_name}
                          className="h-12 w-12 rounded object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48?text=No+Image';
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
                    <div className="text-sm text-gray-500">
                      ID: {asset.asset_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.serial_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.building_name} {asset.room_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(asset.status)}`}>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {assets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ไม่พบข้อมูลครุภัณฑ์</p>
          </div>
        )}
      </div>

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
                  <p className="font-semibold">{selectedAsset.serial_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ราคา</label>
                  <p className="font-semibold">{selectedAsset.price?.toLocaleString()} บาท</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">สถานที่</label>
                  <p className="font-semibold">
                    {selectedAsset.building_name} {selectedAsset.room_number}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">หน่วยงาน</label>
                  <p className="font-semibold">{selectedAsset.department_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">สถานะ</label>
                  <p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAsset.status)}`}>
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
        <BulkQRGenerator
          assets={assets}
          onClose={() => setShowBulkQR(false)}
        />
      )}
    </div>
  );
}