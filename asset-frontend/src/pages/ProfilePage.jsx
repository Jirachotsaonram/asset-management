// FILE: asset-frontend/src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';

// ==================== Notifications Integration ====================
export const getProfileNotifications = (profileData) => {
  const notifications = [];
  if (!profileData?.email && !profileData?.phone) {
    notifications.push({
      id: 'missing-contact',
      type: 'warning',
      title: 'ข้อมูลติดต่อไม่ครบ',
      message: 'กรุณาเพิ่มอีเมลหรือเบอร์โทร',
      link: '/profile',
      read: false
    });
  }
  return notifications;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    fullname: '',
    email: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const userData = response.data.data;
        setProfileData({
          fullname: userData.fullname || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        // อัปเดต user ใน context และ localStorage
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/users/profile', profileData);

      // อัปเดต localStorage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('อัปเดตโปรไฟล์สำเร็จ');

      // Reload หน้าเพื่อให้ข้อมูลอัปเดต
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'อัปเดตไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validate
    if (!passwordData.current_password) {
      toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }

    if (!passwordData.password) {
      toast.error('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (passwordData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (passwordData.password !== passwordData.confirm_password) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      await api.put('/users/profile', {
        ...profileData,
        current_password: passwordData.current_password,
        password: passwordData.password
      });

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');

      // Reset form
      setPasswordData({
        current_password: '',
        password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600" size={24} />
        </div>
        <p className="mt-4 text-gray-600 font-medium">กำลังโหลดโปรไฟล์...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูลส่วนตัว</h1>
        <p className="text-gray-600 mt-1">แก้ไขข้อมูลโปรไฟล์และเปลี่ยนรหัสผ่าน</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-28 h-28 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary-500/30">
                <span className="text-4xl font-bold text-white">{user.fullname?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                <CheckCircle size={16} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-5">{user.fullname}</h2>
            <p className="text-sm text-gray-500 mt-1">@{user.username}</p>

            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-primary-500/30">
              <Shield size={16} />
              <span className="font-semibold text-sm">{user.role}</span>
            </div>

            <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <span className="text-sm text-gray-600">{user.email || 'ไม่ระบุอีเมล'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400" />
                <span className="text-sm text-gray-600">{user.phone || 'ไม่ระบุเบอร์โทร'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <User size={24} className="text-blue-600" />
              ข้อมูลโปรไฟล์
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้ (ไม่สามารถแก้ไขได้)
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.fullname}
                  onChange={(e) => setProfileData({ ...profileData, fullname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="0812345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Lock size={24} className="text-purple-600" />
              เปลี่ยนรหัสผ่าน
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านปัจจุบัน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock size={20} />
                {loading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}