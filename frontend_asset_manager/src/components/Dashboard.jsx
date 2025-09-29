import React, { useState, useEffect } from 'react';
import { getAssets } from '../api/api';

const Dashboard = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllAssets = async () => {
            try {
                const data = await getAssets();
                setAssets(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllAssets();
    }, []); // Dependency Array ว่างเปล่า หมายถึงรันครั้งเดียวตอน Component โหลด

    if (loading) {
        return <div style={{padding: '20px'}}>กำลังโหลดข้อมูลครุภัณฑ์...</div>;
    }

    if (error) {
        return <div style={{padding: '20px', color: 'red'}}>เกิดข้อผิดพลาดในการดึงข้อมูล: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Dashboard ภาพรวมครุภัณฑ์ ({assets.length} รายการ)</h2>
            <button style={{ marginBottom: '15px', padding: '10px' }}>+ เพิ่มครุภัณฑ์ใหม่</button>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={tableHeaderStyle}>ID</th>
                        <th style={tableHeaderStyle}>ชื่อครุภัณฑ์</th>
                        <th style={tableHeaderStyle}>S/N</th>
                        <th style={tableHeaderStyle}>สถานะ</th>
                        <th style={tableHeaderStyle}>หน่วยงาน</th>
                        <th style={tableHeaderStyle}>สถานที่ตั้ง</th>
                        <th style={tableHeaderStyle}>การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset) => (
                        <tr key={asset.asset_id}>
                            <td style={tableCellStyle}>{asset.asset_id}</td>
                            <td style={tableCellStyle}>{asset.asset_name}</td>
                            <td style={tableCellStyle}>{asset.serial_number}</td>
                            <td style={tableCellStyle}>{asset.status}</td>
                            <td style={tableCellStyle}>{asset.department_name}</td>
                            <td style={tableCellStyle}>{asset.building_name} / {asset.room_number}</td>
                            <td style={tableCellStyle}>
                                <button onClick={() => alert(`แก้ไข ID: ${asset.asset_id}`)} style={{ padding: '5px', cursor: 'pointer' }}>แก้ไข</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// สไตล์พื้นฐาน
const tableHeaderStyle = { border: '1px solid #ddd', padding: '12px', textAlign: 'left' };
const tableCellStyle = { border: '1px solid #ddd', padding: '10px' };

export default Dashboard;