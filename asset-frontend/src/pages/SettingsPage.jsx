import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { 
  Moon, 
  Sun, 
  Monitor,
  User,
  Bell,
  Lock,
  Globe,
  Palette,
  Save,
  Shield,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { theme, setDarkMode, setLightMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');

  const tabs = [
    { id: 'appearance', label: 'รูปแบบ', icon: Palette },
    { id: 'account', label: 'บัญชี', icon: User },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'security', label: 'ความปลอดภัย', icon: Lock },
  ];

  const handleThemeChange = (newTheme) => {
    if (newTheme === 'dark') {
      setDarkMode();
      toast.success('เปลี่ยนเป็นโหมดมืดแล้ว');
    } else {
      setLightMode();
      toast.success('เปลี่ยนเป็นโหมดสว่างแล้ว');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          การตั้งค่า
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          จัดการการตั้งค่าระบบและบัญชีของคุณ
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-[#2A3153]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 pb-4 px-1 border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Theme Section */}
            <div className="bg-white dark:bg-[#141932] border border-gray-200 dark:border-[#2A3153] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                    ธีมสี
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    เลือกธีมที่คุณชอบ
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {theme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Mode */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`
                    group relative p-6 border-2 rounded-xl transition-all duration-300
                    ${theme === 'light'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/10'
                      : 'border-gray-200 dark:border-[#2A3153] hover:border-purple-300 dark:hover:border-purple-700'
                    }
                  `}
                >
                  {/* Selected Badge */}
                  {theme === 'light' && (
                    <div className="absolute top-3 right-3 bg-purple-600 text-white p-1 rounded-full">
                      <CheckCircle size={16} />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`
                      p-4 rounded-full transition-colors
                      ${theme === 'light' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }
                    `}>
                      <Sun size={32} />
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    โหมดสว่าง
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    พื้นหลังสีสว่าง เหมาะสำหรับใช้งานในที่ที่มีแสงสว่าง
                  </p>

                  {/* Preview */}
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded"></div>
                      <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded mb-1"></div>
                    <div className="h-1.5 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </button>

                {/* Dark Mode */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`
                    group relative p-6 border-2 rounded-xl transition-all duration-300
                    ${theme === 'dark'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/10'
                      : 'border-gray-200 dark:border-[#2A3153] hover:border-purple-300 dark:hover:border-purple-700'
                    }
                  `}
                >
                  {/* Selected Badge */}
                  {theme === 'dark' && (
                    <div className="absolute top-3 right-3 bg-purple-600 text-white p-1 rounded-full">
                      <CheckCircle size={16} />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`
                      p-4 rounded-full transition-colors
                      ${theme === 'dark' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                      }
                    `}>
                      <Moon size={32} />
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    โหมดมืด
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    พื้นหลังสีเข้ม ลดความเมื่อยล้าของดวงตา เหมาะสำหรับใช้งานยาวๆ
                  </p>

                  {/* Preview */}
                  <div className="mt-4 p-3 bg-[#0A0E27] border border-[#2A3153] rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-purple-600 rounded"></div>
                      <div className="flex-1 h-2 bg-[#2A3153] rounded"></div>
                    </div>
                    <div className="h-1.5 bg-[#1E2543] rounded mb-1"></div>
                    <div className="h-1.5 bg-[#1E2543] rounded w-3/4"></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Language Section */}
            <div className="bg-white dark:bg-[#141932] border border-gray-200 dark:border-[#2A3153] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      ภาษา
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      เลือกภาษาที่ต้องการใช้งาน
                    </p>
                  </div>
                </div>
                <select className="input-dark w-48">
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="bg-white dark:bg-[#141932] border border-gray-200 dark:border-[#2A3153] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              ข้อมูลบัญชี
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="input-dark w-full opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={user?.fullname || ''}
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input-dark w-full"
                />
              </div>
              <button className="btn-glow w-full md:w-auto">
                <Save className="w-5 h-5 mr-2 inline" />
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-[#141932] border border-gray-200 dark:border-[#2A3153] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              การแจ้งเตือน
            </h3>
            <div className="space-y-4">
              {[
                { label: 'แจ้งเตือนเมื่อมีครุภัณฑ์ใหม่', enabled: true },
                { label: 'แจ้งเตือนเมื่อครุภัณฑ์ต้องตรวจสอบ', enabled: true },
                { label: 'แจ้งเตือนเมื่อมีการยืม-คืน', enabled: false },
                { label: 'แจ้งเตือนผ่านอีเมล', enabled: false },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-[#2A3153] last:border-0">
                  <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white dark:bg-[#141932] border border-gray-200 dark:border-[#2A3153] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              ความปลอดภัย
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  รหัสผ่านปัจจุบัน
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-dark w-full"
                />
              </div>
              <button className="btn-glow w-full md:w-auto">
                <Shield className="w-5 h-5 mr-2 inline" />
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}