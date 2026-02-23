// FILE: src/pages/UsersPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, Users, UserCheck, UserX, Shield, X,
  Eye, EyeOff, ChevronDown, ChevronUp, Mail, Phone, RefreshCw, Filter,
  ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck
} from 'lucide-react';

const ITEMS_PER_PAGE = 50;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', fullname: '', email: '', phone: '', role: 'Inspector', status: 'Active'
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Admin') {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => {
      const matchesSearch = !searchTerm || [u.username, u.fullname, u.email, u.phone].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });

    result.sort((a, b) => {
      const aVal = (a[sortBy] || '').toString().toLowerCase();
      const bVal = (b[sortBy] || '').toString().toLowerCase();
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    admins: users.filter(u => u.role === 'Admin').length,
    inactive: users.filter(u => u.status === 'Inactive').length
  }), [users]);

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({ ...u, password: '' });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (userId === user.user_id) return toast.error('ไม่สามารถลบบัญชีตัวเองได้');
    if (!window.confirm('ยืนยันระบบการลบผู้ใช้?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error) {
      toast.error('ไม่สามารถลบได้');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.fullname) return toast.error('กรุณากรอกข้อมูลสำคัญ');
    setFormLoading(true);
    try {
      const data = { ...formData };
      if (editingUser && !data.password) delete data.password;
      if (editingUser) await api.put(`/users/${editingUser.user_id}`, data);
      else await api.post('/users', data);
      toast.success(editingUser ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ');
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && users.length === 0) {
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
          <h1 className="text-2xl font-black text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs tracking-widest font-bold">User Management System</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="btn-secondary rounded-2xl"><RefreshCw size={18} /></button>
          <button onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', fullname: '', email: '', phone: '', role: 'Inspector', status: 'Active' }); setShowModal(true); }} className="btn-primary rounded-2xl shadow-lg shadow-primary-200">
            <Plus size={20} /> เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <UserStat label="ผู้ใช้ทั้งหมด" value={stats.total} icon={Users} color="primary" />
        <UserStat label="ใช้งานอยู่" value={stats.active} icon={UserCheck} color="success" />
        <UserStat label="ผู้ดูแลระบบ" value={stats.admins} icon={ShieldCheck} color="indigo" />
        <UserStat label="ระงับการใช้งาน" value={stats.inactive} icon={UserX} color="danger" />
      </div>

      {stats.active > 0 && stats.admins === 1 && (
        <div className="bg-warning-50 border border-warning-200 p-4 rounded-2xl flex items-center gap-3 text-warning-700">
          <AlertTriangle size={20} />
          <p className="text-sm font-bold">แจ้งเตือน: มีผู้ดูแลระบบเพียงท่านเดียว ควรเพิ่มบทบาท Admin สำรองไว้</p>
        </div>
      )}

      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-gray-300" size={18} />
            <input type="text" placeholder="ค้นหาตามชื่อ, อีเมล, เบอร์โทร..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input pl-12 h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
          </div>
          <div className="flex gap-2">
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="form-select rounded-2xl border-gray-100 bg-gray-50/50 px-4">
              <option value="all">ทุกบทบาท</option>
              {['Admin', 'Inspector', 'Viewer'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select rounded-2xl border-gray-100 bg-gray-50/50 px-4">
              <option value="all">ทุกสถานะ</option>
              <option value="Active">ใช้งาน</option>
              <option value="Inactive">ระงับ</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-black text-gray-500 shadow-sm border border-white">
                        {u.fullname.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{u.fullname}</p>
                        <p className="text-xs text-gray-400 font-bold">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {u.email && <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold"><Mail size={12} className="text-gray-300" /> {u.email}</div>}
                      {u.phone && <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold"><Phone size={12} className="text-gray-300" /> {u.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest flex items-center gap-1 ${u.role === 'Admin' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        {u.role === 'Admin' ? <Shield size={10} /> : <Users size={10} />} {u.role}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${u.status === 'Active' ? 'bg-success-50 border-success-200 text-success-700' : 'bg-danger-50 border-danger-200 text-danger-700'}`}>
                        {u.status === 'Active' ? 'Active' : 'Banned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleOpenEdit(u)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(u.user_id)} className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-bold text-gray-400">Total {filteredUsers.length} users</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl border border-gray-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="flex items-center px-4 font-black text-gray-900 text-sm">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl border border-gray-100 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          formData={formData} setFormData={setFormData} editingUser={editingUser}
          showPassword={showPassword} setShowPassword={setShowPassword}
          onClose={() => setShowModal(false)} onSubmit={handleSubmit} loading={formLoading}
        />
      )}
    </div>
  );
}

function UserStat({ label, value, icon: Icon, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    danger: 'bg-danger-50 text-danger-600'
  };
  return (
    <div className="card p-5 flex items-center justify-between overflow-hidden relative">
      <div className="z-10">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value.toLocaleString()}</p>
      </div>
      <div className={`${colors[color]} p-4 rounded-3xl shadow-inner z-10`}><Icon size={24} /></div>
      <div className={`absolute -right-4 -bottom-4 opacity-5 ${colors[color].split(' ')[1]}`}><Icon size={80} /></div>
    </div>
  );
}

function UserModal({ formData, setFormData, editingUser, showPassword, setShowPassword, onClose, onSubmit, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{editingUser ? 'แก้ไขโปรไฟล์' : 'สร้างผู้ใช้ใหม่'}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">User Configuration</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition text-gray-400"><X size={24} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Username</label>
              <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser} className="form-input h-12 rounded-2xl border-2 font-bold disabled:bg-gray-50 disabled:text-gray-400" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'At least 6 chars'} className="form-input h-12 rounded-2xl border-2 font-bold pr-12" required={!editingUser} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-gray-300 hover:text-primary-500 transition">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
            <input type="text" value={formData.fullname} onChange={e => setFormData({ ...formData, fullname: e.target.value })} className="form-input h-12 rounded-2xl border-2 font-bold" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="form-input h-12 rounded-2xl border-2 font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="form-input h-12 rounded-2xl border-2 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Access Role</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="form-select h-12 rounded-2xl border-2 font-bold cursor-pointer">
                <option value="Inspector">Inspector</option>
                <option value="Viewer">Viewer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider ml-1">System Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="form-select h-12 rounded-2xl border-2 font-bold cursor-pointer">
                <option value="Active">Active</option>
                <option value="Inactive">Banned</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1 h-14 rounded-2xl justify-center font-black text-lg shadow-xl shadow-primary-200 border-0 disabled:opacity-50">
              {loading ? <RefreshCw className="animate-spin" /> : (editingUser ? 'Save Updates' : 'Create Account')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-14 rounded-2xl justify-center font-black text-lg border-2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}