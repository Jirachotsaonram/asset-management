import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, CheckSquare, FileText } from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/assets', icon: Package, label: 'จัดการครุภัณฑ์' },
  { path: '/check', icon: CheckSquare, label: 'ตรวจสอบครุภัณฑ์' },
  { path: '/reports', icon: FileText, label: 'รายงาน' }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-800 min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}