// FILE: src/components/Layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  QrCode,          // ← เพิ่มไอคอน QR Code
  CheckSquare, 
  FileText, 
  Users, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/assets', label: 'ครุภัณฑ์', icon: Package },
    { path: '/scan', label: 'สแกน QR Code', icon: QrCode },  
    { path: '/check', label: 'ตรวจสอบ', icon: CheckSquare },
    { path: '/reports', label: 'รายงาน', icon: FileText },
    { path: '/locations', label: 'สถานที่', icon: Package },
    { path: '/borrows', label: 'ยืม-คืน', icon: Package },
    { path: '/audit-trail', label: 'ประวัติการใช้งาน', icon: FileText },
    { path: '/asset-history', label: 'ประวัติการเคลื่อนย้าย', icon: FileText },
    { path: '/import', label: 'นำเข้าข้อมูล', icon: FileText },
  ];

  // เพิ่มเมนู Users สำหรับ Admin
  if (user?.role === 'Admin') {
    menuItems.push({ path: '/users', label: 'ผู้ใช้งาน', icon: Users });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package size={28} />
          </div>
          <div>
            <h2 className="font-bold text-lg">ระบบครุภัณฑ์</h2>
            <p className="text-xs text-gray-400">Asset Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-sm font-semibold">{user?.fullname}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${active 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-medium"
        >
          <LogOut size={20} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}