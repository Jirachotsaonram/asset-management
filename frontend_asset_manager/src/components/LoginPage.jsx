import React, { useState } from 'react';
import { login } from '../api/api';

const LoginPage = () => {
    // State สำหรับเก็บค่าจาก Input Field
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(username, password);
            
            // 1. บันทึกข้อมูลผู้ใช้ (Token, Role) ลงใน Local Storage
            localStorage.setItem('user', JSON.stringify(result.user));
            
            alert(`Login สำเร็จ! ยินดีต้อนรับ ${result.user.fullname} (${result.user.role})`);
            
            // 2. Redirect ผู้ใช้ไปยังหน้า Dashboard ที่เหมาะสม
            if (result.user.role === 'Admin') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/inspector/dashboard';
            }
            
        } catch (err) {
            // แสดง Error จาก API
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h2>ระบบจัดการครุภัณฑ์</h2>
            <h3>เข้าสู่ระบบ</h3>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <button type="submit" disabled={isLoading} style={{ padding: '10px', width: '100%', cursor: 'pointer' }}>
                    {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;