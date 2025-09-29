import React, { useState, useEffect } from 'react';
import { getLocations, updateLocation } from '../api/api'; // สมมติว่าเพิ่ม updateLocation ใน api.js แล้ว

const MasterDataPage = () => {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null); // ID ของแถวที่กำลังแก้ไข
    const [editForm, setEditForm] = useState({}); // ข้อมูลในฟอร์มแก้ไข

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const data = await getLocations(); // ดึงข้อมูลจาก manage_locations.php (GET)
            setLocations(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // เปิดโหมดแก้ไข
    const handleEditClick = (location) => {
        setEditingId(location.location_id);
        // คัดลอกข้อมูลปัจจุบันมาใส่ในฟอร์มแก้ไข
        setEditForm({ 
            location_id: location.location_id,
            building_name: location.building_name, 
            room_number: location.room_number,
            description: location.description 
        });
    };

    // จัดการการเปลี่ยนแปลงในฟอร์มแก้ไข
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    // บันทึกการแก้ไข
    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // ใช้ API ที่สร้างไว้ manage_locations.php (PUT/POST)
            // หมายเหตุ: ต้องเพิ่มฟังก์ชัน updateLocation ใน api.js
            await updateLocation(editForm); 
            
            alert('แก้ไขสถานที่ตั้งสำเร็จ!');
            setEditingId(null); // ปิดโหมดแก้ไข
            await fetchLocations(); // โหลดข้อมูลใหม่
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // (*** คุณต้องสร้างฟังก์ชัน handleDelete เพื่อใช้กับ manage_locations.php (DELETE) เอง ***)

    if (isLoading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>🛠️ จัดการสถานที่ตั้ง (Locations)</h2>
            <button style={{ marginBottom: '15px', padding: '10px' }}>+ เพิ่มสถานที่ตั้งใหม่</button> 
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={tableHeaderStyle}>ID</th>
                        <th style={tableHeaderStyle}>อาคาร</th>
                        <th style={tableHeaderStyle}>ห้องหมายเลข</th>
                        <th style={tableHeaderStyle}>คำอธิบาย</th>
                        <th style={tableHeaderStyle}>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    {locations.map((loc) => (
                        <tr key={loc.location_id}>
                            {editingId === loc.location_id ? (
                                // โหมดแก้ไข (แสดงฟอร์ม)
                                <tr style={{ backgroundColor: '#fffbe6' }}>
                                    <td style={tableCellStyle}>{loc.location_id}</td>
                                    <td style={tableCellStyle}>
                                        <input type="text" name="building_name" value={editForm.building_name} onChange={handleChange} />
                                    </td>
                                    <td style={tableCellStyle}>
                                        <input type="text" name="room_number" value={editForm.room_number} onChange={handleChange} />
                                    </td>
                                    <td style={tableCellStyle}>
                                        <input type="text" name="description" value={editForm.description} onChange={handleChange} />
                                    </td>
                                    <td style={tableCellStyle}>
                                        <button onClick={handleSave} style={{ marginRight: '5px' }}>บันทึก</button>
                                        <button onClick={() => setEditingId(null)}>ยกเลิก</button>
                                    </td>
                                </tr>
                            ) : (
                                // โหมดแสดงผลปกติ
                                <>
                                    <td style={tableCellStyle}>{loc.location_id}</td>
                                    <td style={tableCellStyle}>{loc.building_name}</td>
                                    <td style={tableCellStyle}>{loc.room_number}</td>
                                    <td style={tableCellStyle}>{loc.description}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleEditClick(loc)} style={{ marginRight: '5px' }}>แก้ไข</button>
                                        <button onClick={() => alert('ฟังก์ชันลบยังไม่พร้อม')}>ลบ</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const tableHeaderStyle = { border: '1px solid #ddd', padding: '12px', textAlign: 'left' };
const tableCellStyle = { border: '1px solid #ddd', padding: '10px' };

export default MasterDataPage;