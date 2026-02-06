// FILE: src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        unchecked: 0,
        missing: 0,
        maintenance: 0,
        pendingDisposal: 0
    });

    // Fetch real notifications from various sources
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const allNotifications = [];
            const now = new Date();

            // Fetch data from multiple endpoints in parallel
            const [
                overdueRes,
                upcomingRes,
                statusRes,
                uncheckedRes,
                borrowsRes
            ] = await Promise.all([
                api.get('/check-schedules/overdue').catch(() => ({ data: { data: [] } })),
                api.get('/check-schedules/notifications?days=7').catch(() => ({ data: { data: [] } })),
                api.get('/reports/by-status').catch(() => ({ data: { data: [] } })),
                api.get('/reports/unchecked?days=365').catch(() => ({ data: { data: [] } })),
                api.get('/borrows?status=pending').catch(() => ({ data: { data: [] } }))
            ]);

            const overdueAssets = overdueRes.data.data || [];
            const upcomingChecks = upcomingRes.data.data || [];
            const statusReport = statusRes.data.data || [];
            const uncheckedAssets = uncheckedRes.data.data || [];
            const pendingBorrows = borrowsRes.data.data || [];

            // Calculate stats from status report
            const statusCounts = {
                'ใช้งานได้': 0,
                'รอซ่อม': 0,
                'รอจำหน่าย': 0,
                'จำหน่ายแล้ว': 0,
                'ไม่พบ': 0
            };

            statusReport.forEach(item => {
                if (Object.prototype.hasOwnProperty.call(statusCounts, item.status)) {
                    statusCounts[item.status] = parseInt(item.count || 0);
                }
            });

            setStats({
                unchecked: uncheckedAssets.length,
                missing: statusCounts['ไม่พบ'],
                maintenance: statusCounts['รอซ่อม'],
                pendingDisposal: statusCounts['รอจำหน่าย']
            });

            // 1. Overdue Assets - DANGER
            if (overdueAssets.length > 0) {
                allNotifications.push({
                    id: 'overdue-assets',
                    type: 'danger',
                    title: `เลยกำหนดตรวจสอบ ${overdueAssets.length} รายการ`,
                    message: `ครุภัณฑ์ที่เลยกำหนดการตรวจสอบ`,
                    time: 'ต้องดำเนินการทันที',
                    read: false,
                    link: '/check',
                    priority: 1
                });
            }

            // 2. Missing Assets - DANGER
            if (statusCounts['ไม่พบ'] > 0) {
                allNotifications.push({
                    id: 'missing-assets',
                    type: 'danger',
                    title: `ครุภัณฑ์ไม่พบ ${statusCounts['ไม่พบ']} รายการ`,
                    message: 'ต้องตรวจสอบและดำเนินการ',
                    time: 'สำคัญ',
                    read: false,
                    link: '/assets?status=ไม่พบ',
                    priority: 2
                });
            }

            // 3. Upcoming Checks Today - WARNING
            const todayChecks = upcomingChecks.filter(a => a.urgency_level === 'วันนี้');
            if (todayChecks.length > 0) {
                allNotifications.push({
                    id: 'today-checks',
                    type: 'warning',
                    title: `ต้องตรวจวันนี้ ${todayChecks.length} รายการ`,
                    message: 'ครุภัณฑ์ที่ถึงกำหนดตรวจวันนี้',
                    time: 'วันนี้',
                    read: false,
                    link: '/check',
                    priority: 3
                });
            }

            // 4. Upcoming Urgent Checks - WARNING
            const urgentChecks = upcomingChecks.filter(a => a.urgency_level === 'เร่งด่วน');
            if (urgentChecks.length > 0) {
                allNotifications.push({
                    id: 'urgent-checks',
                    type: 'warning',
                    title: `ใกล้ถึงกำหนดตรวจ ${urgentChecks.length} รายการ`,
                    message: 'ครุภัณฑ์ที่ใกล้ถึงกำหนดตรวจใน 7 วัน',
                    time: 'ภายใน 7 วัน',
                    read: false,
                    link: '/check',
                    priority: 4
                });
            }

            // 5. Unchecked Assets - WARNING
            if (uncheckedAssets.length > 0) {
                allNotifications.push({
                    id: 'unchecked-assets',
                    type: 'warning',
                    title: `ยังไม่ได้ตรวจ ${uncheckedAssets.length} รายการ`,
                    message: 'ครุภัณฑ์ที่ยังไม่เคยตรวจสอบในรอบปี',
                    time: 'รอดำเนินการ',
                    read: false,
                    link: '/check',
                    priority: 5
                });
            }

            // 6. Maintenance Assets - INFO
            if (statusCounts['รอซ่อม'] > 0) {
                allNotifications.push({
                    id: 'maintenance-assets',
                    type: 'info',
                    title: `รอซ่อม ${statusCounts['รอซ่อม']} รายการ`,
                    message: 'ครุภัณฑ์ที่รอการซ่อมบำรุง',
                    time: 'รอดำเนินการ',
                    read: true,
                    link: '/assets?status=รอซ่อม',
                    priority: 6
                });
            }

            // 7. Pending Borrows - INFO
            if (pendingBorrows.length > 0) {
                allNotifications.push({
                    id: 'pending-borrows',
                    type: 'info',
                    title: `รออนุมัติยืม ${pendingBorrows.length} รายการ`,
                    message: 'คำขอยืมครุภัณฑ์ที่รอการอนุมัติ',
                    time: 'รอดำเนินการ',
                    read: true,
                    link: '/borrows',
                    priority: 7
                });
            }

            // 8. Pending Disposal - INFO
            if (statusCounts['รอจำหน่าย'] > 0) {
                allNotifications.push({
                    id: 'pending-disposal',
                    type: 'info',
                    title: `รอจำหน่าย ${statusCounts['รอจำหน่าย']} รายการ`,
                    message: 'ครุภัณฑ์ที่รอการจำหน่าย',
                    time: 'รอดำเนินการ',
                    read: true,
                    link: '/assets?status=รอจำหน่าย',
                    priority: 8
                });
            }

            // Sort by priority
            allNotifications.sort((a, b) => a.priority - b.priority);

            setNotifications(allNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchNotifications();

        // Refresh every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Mark as read
    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    const value = {
        notifications,
        loading,
        stats,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
