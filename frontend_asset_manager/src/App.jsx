import React, { useState, useEffect } from 'react';

// Import Components หลักทั้งหมด
import LoginPage from './components/LoginPage';
import AssetManagementPage from './components/AssetManagementPage'; // จัดการครุภัณฑ์ (CRUD)
import MasterDataPage from './components/MasterDataPage'; // จัดการ Locations / Departments
import UserManagementPage from './components/UserManagementPage'; // จัดการ Users
import BorrowManagementPage from './components/BorrowManagementPage'; // จัดการการยืม-คืน
import InspectorScanView from './components/InspectorScanView'; // สำหรับ Inspector Mobile View

// Component NavBar พร้อมเมนูนำทาง
const NavBar = ({ user, onLogout, currentView, setView }) => {
    const isAdmin = user.role === 'Admin';
    
    // เมนูทั้งหมดสำหรับ Admin
    const adminMenu = [
        { key: 'assets', label: 'จัดการครุภัณฑ์' },
        { key: 'masterdata', label: 'จัดการข้อมูลหลัก (Locations/Depts)' },
        { key: 'users', label: 'จัดการผู้ใช้งาน' },
        { key: 'borrow', label: 'จัดการยืม-คืน' },
    ];
    
    // สไตล์ปุ่มเมนู
    const getButtonStyle = (key) => ({
        padding: '8px 15px', 
        margin: '0 5px 0 0',
        cursor: 'pointer',
        backgroundColor: currentView === key ? '#4a82c4' : '#444', // เน้นปุ่มที่เลือก
        color: 'white',
        border: 'none',
        borderRadius: '4px'
    });

    return (
        <div style={{ padding: '15px', backgroundColor: '#333', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>ระบบการจัดการครุภัณฑ์ | {user.role}</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '15px' }}>สวัสดี, {user.fullname} | </span>
                    <button onClick={onLogout} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px' }}>
                        ออกจากระบบ
                    </button>
                </div>
            </div>

            {/* ส่วนเมนูหลักสำหรับ Admin */}
            {isAdmin && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                    {adminMenu.map((menu) => (
                        <button 
                            key={menu.key}
                            onClick={() => setView(menu.key)}
                            style={getButtonStyle(menu.key)}
                        >
                            {menu.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('assets'); // ตั้งค่าหน้าเริ่มต้นของ Admin คือ 'assets'

    // 1. ตรวจสอบสถานะการล็อกอินเมื่อโหลด App ครั้งแรก
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                // ตั้งค่าหน้าเริ่มต้นตามบทบาท
                setView(userData.role === 'Admin' ? 'assets' : 'scan');
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    }, []);

    // 2. ฟังก์ชันจัดการการล็อกอิน
    const handleLoginSuccess = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setView(userData.role === 'Admin' ? 'assets' : 'scan');
    };

    // 3. ฟังก์ชันจัดการการออกจากระบบ
    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setView('assets'); 
    };

    // 4. แสดงหน้า LoginPage หากยังไม่ได้ล็อกอิน
    if (!user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />; 
    }
    
    // 5. Render หน้าจอตามบทบาท (Role)
    const renderContent = () => {
        if (user.role === 'Admin') {
            switch (view) {
                case 'assets':
                    return <AssetManagementPage />;
                case 'masterdata':
                    return <MasterDataPage />;
                case 'users':
                    return <UserManagementPage />;
                case 'borrow':
                    return <BorrowManagementPage />;
                default:
                    return <AssetManagementPage />;
            }
        } else if (user.role === 'Inspector') {
            // Inspector จะถูกล็อกไว้ที่หน้า Scan View เท่านั้น
            return <InspectorScanView />;
        }
        return <p>ไม่พบสิทธิ์การเข้าถึงสำหรับบทบาทนี้ กรุณาติดต่อผู้ดูแลระบบ</p>;
    };

    // หน้าหลักเมื่อล็อกอินสำเร็จ
    return (
        <div>
            <NavBar 
                user={user} 
                onLogout={handleLogout} 
                currentView={view}
                setView={setView}
            />
            <div style={{ padding: '20px' }}>
                {renderContent()}
            </div>
        </div>
    );
}

export default App;