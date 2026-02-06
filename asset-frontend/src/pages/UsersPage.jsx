// FILE: src/pages/UsersPage.jsx
import { useState, useEffect, useMemo } from 'react';
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
  EyeOff,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';

// ==================== Notifications Integration ====================
export const getUserNotifications = (users, currentUser) => {
  const notifications = [];

  // Inactive users alert
  const inactiveUsers = users.filter(u => u.status === 'Inactive');
  if (inactiveUsers.length > 0) {
    notifications.push({
      id: 'inactive-users',
      type: 'warning',
      title: `มี ${inactiveUsers.length} บัญชีถูกระงับ`,
      message: 'ผู้ใช้ที่ถูกระงับการใช้งาน',
      link: '/users',
      read: false
    });
  }

  // Single admin warning
  const adminCount = users.filter(u => u.role === 'Admin' && u.status === 'Active').length;
  if (adminCount <= 1) {
    notifications.push({
      id: 'single-admin',
      type: 'info',
      title: 'มีผู้ดูแลระบบเพียงคนเดียว',
      message: 'ควรเพิ่มผู้ดูแลระบบสำรอง',
      link: '/users',
      read: false
    });
  }

  return notifications;
};

export default function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('fullname');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    role: 'Inspector',
    status: 'Active'
  });
  const [formLoading, setFormLoading] = useState(false);

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
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // กรองและเรียงลำดับข้อมูล
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.username?.toLowerCase().includes(term) ||
        u.fullname?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.includes(term)
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      result = result.filter(u => u.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(u => u.status === filterStatus);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return result;
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

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
    setFormLoading(false);
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

    // ตรวจสอบความยาว password
    if (formData.password && formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // ตรวจสอบ email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setFormLoading(true);
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
    } finally {
      setFormLoading(false);
    }
  };

  // ลบผู้ใช้
  const handleDelete = async (userId) => {
    // ป้องกันลบตัวเอง
    if (userId === user.user_id) {
      toast.error('ไม่สามารถลบบัญชีตัวเองได้');
      return;
    }

    if (!window.confirm('ต้องการลบผู้ใช้นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
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
      case 'Active': return 'bg-success-100 text-success-700 border-success-200';
      case 'Inactive': return 'bg-danger-100 text-danger-700 border-danger-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // สี Role
  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'Inspector': return 'bg-info-100 text-info-700 border-info-200';
      case 'Viewer': return 'bg-success-100 text-success-700 border-success-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // สี Role Icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Shield size={14} className="text-primary-600" />;
      case 'Inspector': return <UserCheck size={14} className="text-info-600" />;
      case 'Viewer': return <Eye size={14} className="text-success-600" />;
      default: return <Users size={14} className="text-gray-500" />;
    }
  };

  // นับสถิติ
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    admins: users.filter(u => u.role === 'Admin').length,
    inspectors: users.filter(u => u.role === 'Inspector').length,
    viewers: users.filter(u => u.role === 'Viewer').length
  }), [users]);

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setSortBy('fullname');
    setSortOrder('asc');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600" size={24} />
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-gray-600 mt-1">จัดการบัญชีผู้ใช้งานระบบ</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={18} />
            รีเฟรช
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-600/20"
          >
            <Plus size={20} />
            เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/20 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">ผู้ใช้ทั้งหมด</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-2xl shadow-lg shadow-success-500/20 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">ใช้งานอยู่</p>
              <p className="text-3xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-danger-500 to-danger-600 rounded-2xl shadow-lg shadow-danger-500/20 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm font-medium">ระงับการใช้งาน</p>
              <p className="text-3xl font-bold mt-1">{stats.inactive}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <UserX size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg shadow-primary-600/20 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm font-medium">ผู้ดูแลระบบ</p>
              <p className="text-3xl font-bold mt-1">{stats.admins}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Shield size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${showFilters
                ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Filter size={18} />
            ตัวกรอง
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white"
              >
                <option value="all">ทุกบทบาท</option>
                <option value="Admin">Admin</option>
                <option value="Inspector">Inspector</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="Active">ใช้งานอยู่</option>
                <option value="Inactive">ระงับ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เรียงตาม</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white"
              >
                <option value="fullname">ชื่อ-นามสกุล</option>
                <option value="username">ชื่อผู้ใช้</option>
                <option value="role">บทบาท</option>
                <option value="status">สถานะ</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
              >
                <RefreshCw size={16} />
                รีเซ็ตตัวกรอง
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          แสดง <span className="font-semibold text-gray-900">{filteredUsers.length}</span> จาก <span className="font-semibold text-gray-900">{users.length}</span> รายการ
        </p>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {sortOrder === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th
                  onClick={() => handleSort('user_id')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    ID
                    {sortBy === 'user_id' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('username')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    ชื่อผู้ใช้
                    {sortBy === 'username' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('fullname')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    ชื่อ-นามสกุล
                    {sortBy === 'fullname' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ติดต่อ
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    บทบาท
                    {sortBy === 'role' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    สถานะ
                    {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((userData) => (
                <tr key={userData.user_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 font-mono">#{userData.user_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm">
                        {userData.fullname?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{userData.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{userData.fullname}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {userData.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {userData.email}
                        </div>
                      )}
                      {userData.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          {userData.phone}
                        </div>
                      )}
                      {!userData.email && !userData.phone && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRoleColor(userData.role)}`}>
                      {getRoleIcon(userData.role)}
                      {userData.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(userData.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${userData.status === 'Active' ? 'bg-success-500' : 'bg-danger-500'}`}></span>
                      {userData.status === 'Active' ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(userData)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="แก้ไข"
                      >
                        <Edit2 size={18} />
                      </button>
                      {userData.user_id !== user.user_id && (
                        <button
                          onClick={() => handleDelete(userData.user_id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
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
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-400" size={40} />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลผู้ใช้</p>
            <p className="text-sm text-gray-500">ลองปรับตัวกรองหรือค้นหาใหม่อีกครั้ง</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingUser ? `แก้ไขข้อมูล @${editingUser.username}` : 'กรอกข้อมูลสำหรับผู้ใช้ใหม่'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้ (Username) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1.5">ไม่สามารถแก้ไขชื่อผู้ใช้ได้</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน {editingUser ? '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : <span className="text-danger-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : 'กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)'}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  placeholder="ชื่อจริง นามสกุล"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812345678"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    บทบาท <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  >
                    <option value="Inspector">Inspector (ผู้ตรวจสอบ)</option>
                    <option value="Viewer">Viewer (ผู้ดู)</option>
                    <option value="Admin">Admin (ผู้ดูแล)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  >
                    <option value="Active">ใช้งาน</option>
                    <option value="Inactive">ระงับ</option>
                  </select>
                </div>
              </div>

              {/* Warning for self-deactivation */}
              {editingUser && editingUser.user_id === user.user_id && formData.status === 'Inactive' && (
                <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-danger-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-danger-800">คำเตือน</p>
                    <p className="text-sm text-danger-700 mt-1">คุณกำลังจะระงับบัญชีของตัวเอง ซึ่งจะทำให้ไม่สามารถเข้าสู่ระบบได้</p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                >
                  {formLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all font-semibold disabled:opacity-50"
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