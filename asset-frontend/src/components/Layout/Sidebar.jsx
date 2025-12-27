// FILE: src/components/Layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  QrCode,
  CheckSquare, 
  FileText, 
  Users, 
  X,
  MapPin,
  History,
  Upload,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();

  // เมนูพื้นฐานที่ทุกคนเข้าถึงได้
  const baseMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { path: '/assets', label: 'ครุภัณฑ์', icon: Package, section: 'main' },
    { path: '/scan', label: 'สแกน QR Code', icon: QrCode, section: 'main' },
    { path: '/reports', label: 'รายงาน', icon: FileText, section: 'main' },
    { path: '/audit-trail', label: 'ประวัติการใช้งาน', icon: History, section: 'main' },
  ];

  // เมนูสำหรับ Inspector และ Admin
  const inspectorMenuItems = [
    { path: '/check', label: 'ตรวจสอบ', icon: CheckSquare, section: 'management' },
    { path: '/locations', label: 'สถานที่', icon: MapPin, section: 'management' },
    { path: '/borrows', label: 'ยืม-คืน', icon: ClipboardList, section: 'management' },
    { path: '/asset-history', label: 'ประวัติการเคลื่อนย้าย', icon: History, section: 'management' },
    { path: '/import', label: 'นำเข้าข้อมูล', icon: Upload, section: 'management' },
  ];

  // เมนูสำหรับ Admin เท่านั้น
  const adminMenuItems = [
    { path: '/users', label: 'ผู้ใช้งาน', icon: Users, section: 'admin' },
  ];

  // รวมเมนูตาม role
  let menuItems = [...baseMenuItems];
  
  if (user?.role === 'Admin' || user?.role === 'Inspector') {
    menuItems = [...menuItems, ...inspectorMenuItems];
  }
  
  if (user?.role === 'Admin') {
    menuItems = [...menuItems, ...adminMenuItems];
  }

  const isActive = (path) => location.pathname === path;



  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white
          flex flex-col shadow-2xl
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">ระบบครุภัณฑ์</h2>
                <p className="text-xs text-gray-400">Asset Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {/* Main Section */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                เมนูหลัก
              </p>
              <div className="space-y-1">
                {menuItems
                  .filter(item => item.section === 'main')
                  .map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-all duration-200
                          ${active 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' 
                            : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                          }
                        `}
                      >
                        <Icon size={20} className={active ? 'text-white' : ''} />
                        <span className="font-medium">{item.label}</span>
                        {active && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Management Section */}
            {(user?.role === 'Admin' || user?.role === 'Inspector') && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                  จัดการ
                </p>
                <div className="space-y-1">
                  {menuItems
                    .filter(item => item.section === 'management')
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl
                            transition-all duration-200
                            ${active 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' 
                              : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                            }
                          `}
                        >
                          <Icon size={20} className={active ? 'text-white' : ''} />
                          <span className="font-medium">{item.label}</span>
                          {active && (
                            <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Admin Section */}
            {user?.role === 'Admin' && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                  ผู้ดูแลระบบ
                </p>
                <div className="space-y-1">
                  {menuItems
                    .filter(item => item.section === 'admin')
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl
                            transition-all duration-200
                            ${active 
                              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30' 
                              : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                            }
                          `}
                        >
                          <Icon size={20} className={active ? 'text-white' : ''} />
                          <span className="font-medium">{item.label}</span>
                          {active && (
                            <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">
              เวอร์ชัน 1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}