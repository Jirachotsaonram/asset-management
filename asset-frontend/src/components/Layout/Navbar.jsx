import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">
              ระบบจัดการครุภัณฑ์
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{user?.fullname}</span>
              <span className="text-sm text-gray-500">({user?.role})</span>
            </div>
            
            {/* ปุ่มโปรไฟล์ */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              title="แก้ไขโปรไฟล์"
            >
              <Settings className="w-4 h-4" />
              <span>โปรไฟล์</span>
            </button>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}