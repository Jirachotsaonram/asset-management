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
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, isMobile }) {
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

  // Render menu item
  const renderMenuItem = (item, sectionType = 'main') => {
    const Icon = item.icon;
    const active = isActive(item.path);

    // Color schemes per section
    const activeColors = {
      main: 'bg-primary-600/90 text-white shadow-lg shadow-primary-500/25',
      management: 'bg-primary-600/90 text-white shadow-lg shadow-primary-500/25',
      admin: 'bg-danger-600/90 text-white shadow-lg shadow-danger-500/25'
    };

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={isMobile ? onClose : undefined}
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200
          ${active
            ? activeColors[sectionType]
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
          }
          ${isCollapsed && !isMobile ? 'justify-center' : ''}
        `}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <Icon size={20} className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />

        {/* Label - hidden when collapsed on desktop */}
        {(!isCollapsed || isMobile) && (
          <span className="font-medium text-sm">{item.label}</span>
        )}

        {/* Active indicator */}
        {active && (!isCollapsed || isMobile) && (
          <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
        )}

        {/* Tooltip for collapsed mode */}
        {isCollapsed && !isMobile && (
          <div className="
            absolute left-full ml-3 px-3 py-2 
            bg-gray-900 text-white text-sm font-medium rounded-lg
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 whitespace-nowrap z-50
            shadow-lg
          ">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        )}
      </Link>
    );
  };

  // Render section
  const renderSection = (title, items, sectionType) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        {/* Section title - hidden when collapsed */}
        {(!isCollapsed || isMobile) && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
            {title}
          </p>
        )}
        {isCollapsed && !isMobile && (
          <div className="border-t border-gray-700/50 mx-3 mb-3" />
        )}
        <div className="space-y-1">
          {items.map(item => renderMenuItem(item, sectionType))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          sidebar-transition
          ${isMobile
            ? `transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-72`
            : `${isCollapsed ? 'w-20' : 'w-72'}`
          }
          bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800
          text-white flex flex-col shadow-sidebar
        `}
      >
        {/* Header */}
        <div className={`p-4 border-b border-gray-700/50 ${isCollapsed && !isMobile ? 'px-3' : ''}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? 'justify-center w-full' : ''}`}>
              {/* Logo */}
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2.5 rounded-xl shadow-lg flex-shrink-0">
                <Package size={isCollapsed && !isMobile ? 20 : 22} className="text-white" />
              </div>

              {/* Title - hidden when collapsed */}
              {(!isCollapsed || isMobile) && (
                <div className="min-w-0">
                  <h2 className="font-bold text-base text-white truncate">ระบบครุภัณฑ์</h2>
                  <p className="text-xs text-gray-400 truncate">Asset Management</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className={`flex-1 overflow-y-auto scrollbar-dark ${isCollapsed && !isMobile ? 'p-2' : 'p-4'}`}>
          {/* Main Section */}
          {renderSection(
            'เมนูหลัก',
            menuItems.filter(item => item.section === 'main'),
            'main'
          )}

          {/* Management Section */}
          {(user?.role === 'Admin' || user?.role === 'Inspector') && renderSection(
            'จัดการ',
            menuItems.filter(item => item.section === 'management'),
            'management'
          )}

          {/* Admin Section */}
          {user?.role === 'Admin' && renderSection(
            'ผู้ดูแลระบบ',
            menuItems.filter(item => item.section === 'admin'),
            'admin'
          )}
        </nav>

        {/* Footer with Collapse Toggle (Desktop only) */}
        <div className={`border-t border-gray-700/50 ${isCollapsed && !isMobile ? 'p-2' : 'p-4'}`}>
          {/* Collapse Toggle - Desktop only */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                bg-gray-800/50 hover:bg-gray-700/50 
                text-gray-400 hover:text-white
                transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <>
                  <ChevronLeft size={18} />
                  <span className="text-sm font-medium">ย่อเมนู</span>
                </>
              )}
            </button>
          )}

          {/* Version info */}
          {(!isCollapsed || isMobile) && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                เวอร์ชัน 2.0.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}