import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  QrCode,
  CheckSquare, 
  FileText, 
  Users,
  MapPin,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Command Center', 
      icon: LayoutDashboard,
      description: 'Overview'
    },
    { 
      path: '/assets', 
      label: 'Assets', 
      icon: Package,
      description: 'Manage inventory'
    },
    { 
      path: '/scan', 
      label: 'QR Scanner', 
      icon: QrCode,
      description: 'Scan assets',
      highlight: true
    },
    { 
      path: '/check', 
      label: 'Inspections', 
      icon: CheckSquare,
      description: 'Check status'
    },
    { 
      path: '/asset-history', 
      label: 'Movement', 
      icon: Truck,
      description: 'Track changes'
    },
    { 
      path: '/reports', 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Reports & insights'
    },
    { 
      path: '/locations', 
      label: 'Locations', 
      icon: MapPin,
      description: 'Manage sites'
    },
    { 
      path: '/borrows', 
      label: 'Borrowing', 
      icon: FileText,
      description: 'Loan tracking'
    },
  ];

  if (user?.role === 'Admin') {
    menuItems.push({ 
      path: '/users', 
      label: 'Users', 
      icon: Users,
      description: 'User management'
    });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className={`
        ${isCollapsed ? 'w-20' : 'w-72'} 
        bg-white dark:bg-[#141932] border-r border-gray-200 dark:border-[#2A3153] min-h-screen flex flex-col relative
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Gradient Background Effect */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
      
      {/* Toggle Button - Fixed Position */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-24 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-110 z-[60]"
        style={{
          left: isCollapsed ? '68px' : '276px',
          transition: 'left 0.3s ease-in-out'
        }}
        title={isCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Logo Header */}
      <div className="relative p-6 border-b border-gray-200 dark:border-[#2A3153]">
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-purple-600 rounded-lg blur-lg opacity-50"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 p-3 rounded-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="text-gradient text-xl font-bold">AssetGuard</h2>
              <p className="text-xs text-gray-500">Command & Control</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info Card */}
      {!isCollapsed ? (
        <div className="relative p-4 mx-4 mt-4 glass-card animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#141932]"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.fullname}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-4 mx-2 mt-4 flex justify-center">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.fullname?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#141932]"></div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="relative flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center rounded-lg
                  transition-all duration-200
                  ${isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'}
                  ${active 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1E2543]'
                  }
                  ${item.highlight && !active ? 'border border-purple-600/30' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                {/* Active Indicator */}
                {active && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}

                {/* Icon */}
                <div className={`
                  transition-transform duration-200 flex-shrink-0
                  ${active ? '' : 'group-hover:scale-110'}
                  ${isCollapsed ? '' : 'mr-3'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label & Description */}
                {!isCollapsed && (
                  <div className="flex-1 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.highlight && !active && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <p className={`text-xs transition-colors ${
                      active ? 'text-purple-200' : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Collapsed - Notification Badge */}
                {isCollapsed && item.highlight && !active && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                )}

                {/* Hover Effect */}
                {!active && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/5 group-hover:to-purple-600/5 rounded-lg transition-all duration-200"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2A3153]">
          <Link
            to="/settings"
            className={`
              w-full flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1E2543] rounded-lg transition-colors
              ${isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'}
              ${isActive('/settings') ? 'bg-gray-100 dark:bg-[#1E2543] text-gray-900 dark:text-white' : ''}
            `}
            title={isCollapsed ? 'Settings' : ''}
          >
            <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
          </Link>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="relative p-4 border-t border-gray-200 dark:border-[#2A3153]">
        <button
          onClick={logout}
          className={`
            w-full flex items-center bg-red-600/10 border border-red-600/30 text-red-400 hover:bg-red-600/20 hover:border-red-600 rounded-lg transition-all duration-200 group
            ${isCollapsed ? 'justify-center px-3 py-3' : 'justify-center px-4 py-3'}
          `}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-500 ${isCollapsed ? '' : 'mr-2'}`} />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-600/5 to-transparent pointer-events-none"></div>
    </div>
  );
}