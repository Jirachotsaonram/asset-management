import React, { useState, useEffect } from 'react';
import { updateAsset, getAssetById, getLocations, getDepartments } from '../api/api';

// รับ assetId ที่ต้องการแก้ไข และฟังก์ชัน onSuccess จาก Component แม่
const EditAssetForm = ({ assetId, onSuccess, onCancel }) => { 
    const initialFormState = {
        asset_id: assetId,
        asset_name: '',
        serial_number: '',
        quantity: 0,
        unit: '',
        price: 0,
        received_date: '',
        department_id: '',
        location_id: '',
        status: '',
        barcode: '',
        image: null
    };
    
    const [formData, setFormData] = useState(initialFormState);
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. ดึง Master Data และ Asset Data เมื่อ Component โหลด
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ดึง Master Data (พร้อมกัน)
                const [locs, depts] = await Promise.all([getLocations(), getDepartments()]);
                setLocations(locs);
                setDepartments(depts);
                
                // ดึงข้อมูลครุภัณฑ์เดิมที่ต้องการแก้ไข
                const assetData = await getAssetById(assetId);
                
                // ตั้งค่า State ของฟอร์มด้วยข้อมูลเดิม
                setFormData({
                    ...initialFormState,
                    ...assetData,
                    // แปลง received_date ให้อยู่ในรูปแบบที่ input type="date" รับได้ (YYYY-MM-DD)
                    received_date: assetData.received_date ? assetData.received_date.split(' ')[0] : ''
                });

            } catch (err) {
                setError("ไม่สามารถดึงข้อมูลสำหรับแก้ไขได้: " + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [assetId]); // รันใหม่ถ้า assetId เปลี่ยน

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        // แปลงค่าให้เป็นประเภทที่ API คาดหวัง
        const dataToSend = {
            ...formData,
            quantity: parseInt(formData.quantity),
            price: parseFloat(formData.price),
            department_id: parseInt(formData.department_id),
            location_id: parseInt(formData.location_id)
        };

        try {
            await updateAsset(dataToSend);
            alert(`แก้ไขครุภัณฑ์ ID ${assetId} สำเร็จ!`);
            onSuccess(); // ปิดฟอร์มและรีเฟรช Dashboard
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div style={{padding: '20px'}}>กำลังดึงข้อมูลครุภัณฑ์สำหรับแก้ไข...</div>;
    }

    if (error) {
        return <div style={{padding: '20px', color: 'red'}}>เกิดข้อผิดพลาด: {error}</div>;
    }
    
    // โค้ด HTML/JSX สำหรับฟอร์ม (เหมือน AddAssetForm.jsx แต่มีค่า default)
    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h3>กำลังแก้ไขครุภัณฑ์ ID: {assetId}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                
                {/* 1. ชื่อครุภัณฑ์ */}
                <Input label="ชื่อครุภัณฑ์" name="asset_name" value={formData.asset_name} onChange={handleChange} required />
                
                {/* 2. Serial Number */}
                <Input label="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleChange} required />
                
                {/* 3. วันที่รับเข้า (สำคัญ) */}
                <Input label="วันที่รับเข้า" name="received_date" type="date" value={formData.received_date} onChange={handleChange} required />
                
                {/* 4. สถานะ */}
                <Select label="สถานะปัจจุบัน" name="status" value={formData.status} onChange={handleChange}>
                    {['ใช้งานได้', 'รอซ่อม', 'ชำรุด', 'จำหน่าย'].map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                
                {/* 5. Dropdown หน่วยงาน */}
                <Select label="หน่วยงานเจ้าของ" name="department_id" value={formData.department_id} onChange={handleChange}>
                    {departments.map(d => (
                        <option key={d.department_id} value={d.department_id}>
                            {d.department_name}
                        </option>
                    ))}
                </Select>

                {/* 6. Dropdown สถานที่ตั้ง */}
                <Select label="สถานที่ตั้ง" name="location_id" value={formData.location_id} onChange={handleChange}>
                    {locations.map(l => (
                        <option key={l.location_id} value={l.location_id}>
                            {l.building_name} / {l.room_number}
                        </option>
                    ))}
                </Select>
                
                {/* 7. ปุ่ม Submit และ Cancel */}
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={isLoading} style={{ padding: '10px', flex: 1, backgroundColor: '#4CAF50', color: 'white' }}>
                        {isLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                    </button>
                    <button type="button" onClick={onCancel} style={{ padding: '10px', flex: 1, backgroundColor: '#f44336', color: 'white' }}>
                        ยกเลิก
                    </button>
                </div>
            </form>
        </div>
    );
};

// Component ย่อย (นำมาจาก AddAssetForm.jsx)
const Input = ({ label, ...props }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>{label}:</label>
        <input {...props} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
    </div>
);
const Select = ({ label, children, ...props }) => (
    <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>{label}:</label>
        <select {...props} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}>
            {children}
        </select>
    </div>
);

export default EditAssetForm;