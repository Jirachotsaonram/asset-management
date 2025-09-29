import React, { useState, useEffect } from 'react';
import { addAsset, getLocations, getDepartments } from '../api/api';

const AddAssetForm = ({ onSuccess }) => {
    // State สำหรับเก็บข้อมูลฟอร์ม
    const [formData, setFormData] = useState({
        asset_name: '',
        serial_number: '',
        quantity: 1,
        unit: 'เครื่อง',
        price: 0,
        department_id: '',
        location_id: '',
        status: 'ใช้งานได้',
        // barcode และ image สามารถเพิ่มได้
    });

    // State สำหรับ Master Data ใน Dropdown
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // ดึง Master Data เมื่อ Component ถูกโหลด
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [locs, depts] = await Promise.all([getLocations(), getDepartments()]);
                setLocations(locs);
                setDepartments(depts);
                
                // ตั้งค่า Default ID สำหรับ Dropdown
                if (locs.length > 0) setFormData(prev => ({...prev, location_id: locs[0].location_id}));
                if (depts.length > 0) setFormData(prev => ({...prev, department_id: depts[0].department_id}));
                
            } catch (err) {
                setError("ไม่สามารถดึงข้อมูลสถานที่หรือหน่วยงานได้: " + err.message);
            }
        };
        fetchMasterData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        // แปลง price ให้เป็นตัวเลข
        const dataToSend = { ...formData, price: parseFloat(formData.price) };

        try {
            await addAsset(dataToSend);
            alert('บันทึกครุภัณฑ์ใหม่สำเร็จ!');
            // ล้างฟอร์ม
            // setFormData({ ...initial state... }); 
            onSuccess(); // เรียกฟังก์ชันภายนอกเพื่ออัปเดต Dashboard
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>เพิ่มครุภัณฑ์ใหม่</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* 1. ชื่อครุภัณฑ์ */}
                <Input label="ชื่อครุภัณฑ์" name="asset_name" value={formData.asset_name} onChange={handleChange} required />
                
                {/* 2. Serial Number */}
                <Input label="Serial Number" name="serial_number" value={formData.serial_number} onChange={handleChange} required />
                
                {/* 3. จำนวนและหน่วยนับ */}
                <Input label="จำนวน" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                <Input label="หน่วยนับ" name="unit" value={formData.unit} onChange={handleChange} required />
                
                {/* 4. ราคาและสถานะ */}
                <Input label="ราคารับเข้า" name="price" type="number" value={formData.price} onChange={handleChange} required />
                <Select label="สถานะปัจจุบัน" name="status" value={formData.status} onChange={handleChange}>
                    <option value="ใช้งานได้">ใช้งานได้</option>
                    <option value="รอซ่อม">รอซ่อม</option>
                    <option value="ชำรุด">ชำรุด</option>
                    <option value="จำหน่าย">จำหน่าย</option>
                </Select>
                
                {/* 5. Dropdown หน่วยงาน */}
                <Select label="หน่วยงานเจ้าของ" name="department_id" value={formData.department_id} onChange={handleChange}>
                    {departments.map(d => (
                        <option key={d.department_id} value={d.department_id}>
                            {d.department_name} ({d.faculty})
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

                {/* 7. ปุ่ม Submit */}
                <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" disabled={isLoading} style={{ padding: '10px', width: '100%', cursor: 'pointer' }}>
                        {isLoading ? 'กำลังบันทึก...' : 'บันทึกครุภัณฑ์'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Component ย่อยเพื่อให้โค้ดดูสะอาดขึ้น
const Input = ({ label, ...props }) => (
    <div>
        <label>{label}:</label>
        <input {...props} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
    </div>
);
const Select = ({ label, children, ...props }) => (
    <div>
        <label>{label}:</label>
        <select {...props} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}>
            {children}
        </select>
    </div>
);


export default AddAssetForm;