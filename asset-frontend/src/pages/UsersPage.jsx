// FILE: src/pages/UsersPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  Shield,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    role: 'Inspector',
    status: 'Active'
  });

  // ตรวจสอบสิทธิ์ Admin
  useEffect(() => {
    if (user?.role !== 'Admin') {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // กรองข้อมูล
  const filteredUsers = users.filter(u => {
    const matchSearch = 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = filterRole === 'all' || u.role === filterRole;
    
    return matchSearch && matchRole;
  });

  // เปิด Modal เพิ่ม
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
      role: 'Inspector',
      status: 'Active'
    });
    setShowPassword(false);
    setShowModal(true);
  };

  // เปิด Modal แก้ไข
  const handleOpenEditModal = (userData) => {
    setEditingUser(userData);
    setFormData({
      username: userData.username,
      password: '', // ไม่แสดง password เดิม
      fullname: userData.fullname,
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role,
      status: userData.status
    });
    setShowPassword(false);
    setShowModal(true);
  };

  // ปิด Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
      role: 'Inspector',
      status: 'Active'
    });
  };

  // บันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.fullname.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // ตรวจสอบ password สำหรับการเพิ่มใหม่
    if (!editingUser && !formData.password.trim()) {
      toast.error('กรุณากรอกรหัสผ่าน');
      return;
    }

    try {
      const submitData = { ...formData };
      
      // ถ้าแก้ไขและไม่ได้กรอก password ใหม่ ไม่ต้องส่ง password
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.user_id}`, submitData);
        toast.success('แก้ไขผู้ใช้สำเร็จ');
      } else {
        await api.post('/users', submitData);
        toast.success('เพิ่มผู้ใช้สำเร็จ');
      }

      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMsg = error.response?.data?.message || 'ไม่สามารถบันทึกได้';
      toast.error(errorMsg);
    }
  };

  // ลบผู้ใช้
  const handleDelete = async (userId) => {
    // ป้องกันลบตัวเอง
    if (userId === user.user_id) {
      toast.error('ไม่สามารถลบบัญชีตัวเองได้');
      return;
    }

    if (!window.confirm('ต้องการลบผู้ใช้นี้หรือไม่?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบได้');
    }
  };

  // สีสถานะ
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // สี Role
  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800';
      case 'Inspector': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // นับสถิติ
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    admins: users.filter(u => u.role === 'Admin').length
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้</h1>
          <p className="text-gray-600 mt-1">จัดการบัญชีผู้ใช้งานระบบ</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition shadow-md"
        >
          <Plus size={20} />
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ผู้ใช้ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Users className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ใช้งานอยู่</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <div className="bg-green-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <UserCheck className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ระงับการใช้งาน</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.inactive}</p>
            </div>
            <div className="bg-red-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <UserX className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ผู้ดูแลระบบ</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.admins}</p>
            </div>
            <div className="bg-purple-500 w-14 h-14 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">ทุกบทบาท</option>
            <option value="Admin">Admin</option>
            <option value="Inspector">Inspector</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ชื่อผู้ใช้</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">อีเมล</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">บทบาท</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((userData) => (
                <tr key={userData.user_id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">{userData.user_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {userData.username}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{userData.fullname}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{userData.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(userData.role)}`}>
                      {userData.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(userData.status)}`}>
                      {userData.status === 'Active' ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(userData)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="แก้ไข"
                      >
                        <Edit2 size={18} />
                      </button>
                      {userData.user_id !== user.user_id && (
                        <button
                          onClick={() => handleDelete(userData.user_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ไม่พบข้อมูลผู้ใช้</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้ (Username) *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน {editingUser ? '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? 'กรอกเฉพาะเมื่อต้องการเปลี่ยน' : 'รหัสผ่าน'}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="0812345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    บทบาท *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Inspector">Inspector</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Active">ใช้งาน</option>
                    <option value="Inactive">ระงับ</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-semibold"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
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