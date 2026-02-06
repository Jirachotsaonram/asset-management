import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Settings, Menu, ChevronDown, Bell, AlertTriangle, CheckCircle, Clock, Package, X, RefreshCw, Wrench, Trash2, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

export default function Navbar({ onMenuClick, isCollapsed, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Simple notification state - no context dependencies
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('readNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch notifications directly from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const allNotifications = [];

      // 1. Fetch Status Report
      const statusRes = await api.get('/reports/by-status').catch(() => ({ data: { data: [] } }));
      const statusReport = statusRes.data.data || [];
      const statusCounts = {};
      statusReport.forEach(item => {
        statusCounts[item.status] = parseInt(item.count || 0);
      });

      if (statusCounts['ไม่พบ'] > 0) {
        allNotifications.push({
          id: 'missing',
          type: 'danger',
          title: `ครุภัณฑ์ไม่พบ ${statusCounts['ไม่พบ']} รายการ`,
          message: 'ต้องตรวจสอบและดำเนินการ',
          time: 'สำคัญ',
          action: () => navigate('/assets?status=missing')
        });
      }

      if (statusCounts['รอซ่อม'] > 0) {
        allNotifications.push({
          id: 'maintenance',
          type: 'warning',
          title: `รอซ่อม ${statusCounts['รอซ่อม']} รายการ`,
          message: 'ครุภัณฑ์ที่รอการซ่อมบำรุง',
          time: 'รอดำเนินการ',
          action: () => navigate('/assets?status=repair')
        });
      }

      if (statusCounts['รอจำหน่าย'] > 0) {
        allNotifications.push({
          id: 'disposal',
          type: 'info',
          title: `รอจำหน่าย ${statusCounts['รอจำหน่าย']} รายการ`,
          message: 'ครุภัณฑ์ที่รอการจำหน่าย',
          time: 'รอดำเนินการ',
          action: () => navigate('/assets?status=disposal')
        });
      }

      // 2. Fetch Overdue Checks
      try {
        const overdueRes = await api.get('/check-schedules/overdue').catch(() => ({ data: { data: [] } }));
        const overdueItems = overdueRes.data.data || [];
        if (overdueItems.length > 0) {
          allNotifications.push({
            id: 'overdue-checks',
            type: 'danger',
            title: `เลยกำหนดตรวจสอบ ${overdueItems.length} รายการ`,
            message: 'ครุภัณฑ์ที่เลยกำหนดการตรวจสอบ',
            time: 'ต้องดำเนินการทันที',
            action: () => navigate('/check?filter=overdue')
          });
        }
      } catch (e) { console.error(e); }

      // 3. Fetch Upcoming Checks
      try {
        const upcomingRes = await api.get('/check-schedules/notifications?days=7').catch(() => ({ data: { data: [] } }));
        const upcomingItems = upcomingRes.data.data || [];

        const todayChecks = upcomingItems.filter(a => a.urgency_level === 'วันนี้');
        if (todayChecks.length > 0) {
          allNotifications.push({
            id: 'today-checks',
            type: 'warning',
            title: `ต้องตรวจวันนี้ ${todayChecks.length} รายการ`,
            message: 'ครุภัณฑ์ที่ถึงกำหนดตรวจวันนี้',
            time: 'วันนี้',
            action: () => navigate('/check?filter=today')
          });
        }

        const urgentChecks = upcomingItems.filter(a => a.urgency_level === 'เร่งด่วน');
        if (urgentChecks.length > 0) {
          allNotifications.push({
            id: 'urgent-checks',
            type: 'warning',
            title: `ใกล้ถึงกำหนดตรวจ ${urgentChecks.length} รายการ`,
            message: 'ครุภัณฑ์ที่ใกล้ถึงกำหนดตรวจใน 7 วัน',
            time: 'ภายใน 7 วัน',
            action: () => navigate('/check?filter=urgent')
          });
        }
      } catch (e) { console.error(e); }

      // 4. Fetch Unchecked
      try {
        const uncheckedRes = await api.get('/reports/unchecked?days=365').catch(() => ({ data: { data: [] } }));
        const uncheckedItems = uncheckedRes.data.data || [];
        if (uncheckedItems.length > 0) {
          allNotifications.push({
            id: 'unchecked',
            type: 'warning',
            title: `ยังไม่ได้ตรวจ ${uncheckedItems.length} รายการ`,
            message: 'ครุภัณฑ์ที่ยังไม่เคยตรวจสอบในรอบปี',
            time: 'รอดำเนินการ',
            action: () => navigate('/check?filter=unchecked')
          });
        }
      } catch (e) { console.error(e); }

      // 5. Check Borrows
      try {
        const borrowsRes = await api.get('/borrows').catch(() => ({ data: { data: [] } }));
        const borrows = borrowsRes.data.data || [];
        const activeBorrows = borrows.filter(b => b.status === 'ยืม');

        const overdueBorrows = activeBorrows.filter(b => {
          if (b.expected_return_date) {
            return new Date() > new Date(b.expected_return_date);
          }
          const daysBorrowed = Math.floor((new Date() - new Date(b.borrow_date)) / (1000 * 60 * 60 * 24));
          return daysBorrowed > 30;
        });

        if (overdueBorrows.length > 0) {
          allNotifications.push({
            id: 'overdue-borrows',
            type: 'danger',
            title: `ค้างคืน ${overdueBorrows.length} รายการ`,
            message: 'ครุภัณฑ์ที่เลยกำหนดคืน',
            time: 'ต้องติดตาม',
            action: () => navigate('/borrows?status=overdue')
          });
        }

        if (activeBorrows.length > 0) {
          // Only show generic active borrow info if no overdue ones, to reduce noise? 
          // Or just show it as INFO.
          // Let's keep it as INFO
          allNotifications.push({
            id: 'active-borrows',
            type: 'info',
            title: `กำลังยืม ${activeBorrows.length} รายการ`,
            message: 'ครุภัณฑ์ที่ถูกยืมอยู่',
            time: 'ปัจจุบัน',
            action: () => navigate('/borrows?status=borrowed')
          });
        }



      } catch (e) {
        console.log('Borrows check error', e);
      }

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark as read
  const markAsRead = (id) => {
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem('readNotifications', JSON.stringify(newReadIds));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  };

  const isRead = (id) => readIds.includes(id);
  const unreadCount = notifications.filter(n => !isRead(n.id)).length;

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-danger-100 text-danger-700 border-danger-200';
      case 'Inspector':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <Wrench className="w-5 h-5 text-warning-600" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      default:
        return <Package className="w-5 h-5 text-primary-600" />;
    }
  };

  const getNotificationBg = (type, read) => {
    if (read) return 'bg-white';

    switch (type) {
      case 'warning':
        return 'bg-warning-50';
      case 'danger':
        return 'bg-danger-50';
      case 'success':
        return 'bg-success-50';
      default:
        return 'bg-primary-50';
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    if (notification.action) {
      notification.action();
    }
  };

  return (
    <nav
      className={`
        bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/80 
        sticky top-0 z-40
        main-content-transition
        ${!isMobile ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-72') : 'ml-0'}
      `}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Page context - can be customized per page */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-800">
                ระบบจัดการครุภัณฑ์
              </h1>
            </div>
          </div>

          {/* Right side - Actions & User menu */}
          <div className="flex items-center gap-2">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl transition-colors relative ${showNotifications ? 'bg-gray-100' : 'hover:bg-gray-100'
                  }`}
              >
                <Bell className={`w-5 h-5 ${showNotifications ? 'text-primary-600' : 'text-gray-500'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
                    <div>
                      <h3 className="font-semibold text-gray-800">การแจ้งเตือน</h3>
                      <p className="text-xs text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} รายการใหม่` : 'ไม่มีการแจ้งเตือนใหม่'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchNotifications}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title="รีเฟรช"
                      >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="py-8 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 text-primary-400 animate-spin" />
                        <p className="text-sm">กำลังโหลด...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${getNotificationBg(notification.type, isRead(notification.id))
                            }`}
                        >
                          {/* Icon */}
                          <div className={`p-2 rounded-lg flex-shrink-0 ${isRead(notification.id) ? 'bg-gray-100' : 'bg-white shadow-sm'
                            }`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isRead(notification.id) ? 'text-gray-600' : 'font-semibold text-gray-800'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>

                          {/* Unread indicator */}
                          {!isRead(notification.id) && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success-300" />
                        <p className="text-sm font-medium text-gray-600">ไม่มีการแจ้งเตือน</p>
                        <p className="text-xs text-gray-400 mt-1">ระบบทำงานปกติ</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/reports');
                        }}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        ดูรายงานทั้งหมด →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User info - Desktop only */}
            <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="bg-primary-100 p-1.5 rounded-lg">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{user?.fullname}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            {/* User dropdown menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.fullname}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email || user?.username}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">แก้ไขโปรไฟล์</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 my-1" />

                  {/* Logout */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-danger-50 transition-colors text-danger-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}