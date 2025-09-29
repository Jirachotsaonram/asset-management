import React, { useState } from 'react';
import { getAssetByBarcode, recordAssetCheck, recordAssetMove } from '../api/api';

// สมมติ: user_id ของผู้ตรวจสอบที่ล็อกอินอยู่ (ดึงมาจาก localStorage/Context)
const INSPECTOR_USER_ID = 2; 
const DEFAULT_LOCATION_ID = 1; // สมมติ: ID สถานที่ตั้งเริ่มต้น

const InspectorScanView = () => {
    const [barcode, setBarcode] = useState('');
    const [asset, setAsset] = useState(null);
    const [status, setStatus] = useState('ใช้งานได้'); // สำหรับ check_status
    const [remark, setRemark] = useState('');
    const [newLocationId, setNewLocationId] = useState(DEFAULT_LOCATION_ID); // สำหรับย้ายครุภัณฑ์
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. ฟังก์ชันจำลองการสแกน (ใน React Native จะใช้ไลบรารีกล้องจริง)
    const handleScan = async () => {
        if (!barcode) return;
        setLoading(true);
        setMessage('');
        try {
            // เรียก API get_asset_by_barcode.php
            const assetData = await getAssetByBarcode(barcode);
            setAsset(assetData);
            setMessage(`พบครุภัณฑ์: ${assetData.asset_name}`);
        } catch (err) {
            setMessage(err.message);
            setAsset(null);
        } finally {
            setLoading(false);
        }
    };

    // 2. ฟังก์ชันสำหรับบันทึกผลการตรวจสอบ (check_asset.php)
    const handleRecordCheck = async () => {
        if (!asset) {
            setMessage('กรุณาสแกนครุภัณฑ์ก่อนบันทึกผล');
            return;
        }
        setLoading(true);
        try {
            const checkData = {
                asset_id: asset.asset_id,
                user_id: INSPECTOR_USER_ID,
                check_status: status,
                remark: remark
            };
            // เรียก API check_asset.php
            await recordAssetCheck(checkData);
            setMessage(`✅ บันทึกผลการตรวจสอบสำเร็จ! สถานะ: ${status}`);
            setRemark('');
        } catch (err) {
            setMessage(`❌ บันทึกผลไม่สำเร็จ: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // 3. ฟังก์ชันสำหรับบันทึกการเคลื่อนย้าย (move_asset.php)
    const handleRecordMove = async () => {
        if (!asset || asset.location_id == newLocationId) {
            setMessage('ข้อมูลการย้ายไม่ถูกต้องหรือไม่พบครุภัณฑ์');
            return;
        }
        setLoading(true);
        try {
            const moveData = {
                asset_id: asset.asset_id,
                new_location_id: newLocationId,
                moved_by: INSPECTOR_USER_ID,
                remark: `ย้ายจากห้อง ${asset.room_number}` // ใช้ remark เดิมของ check
            };
            // เรียก API move_asset.php
            await recordAssetMove(moveData);
            setMessage(`🚚 บันทึกการย้ายสำเร็จ! ไปยัง Location ID: ${newLocationId}`);
            setRemark('');
        } catch (err) {
            setMessage(`❌ บันทึกการย้ายไม่สำเร็จ: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ddd' }}>
            <h2>📱 Inspector View: สแกนและตรวจสอบ</h2>
            
            {/* ส่วน 1: การสแกน */}
            <div style={{ marginBottom: '20px' }}>
                <label>รหัส QR/Barcode:</label>
                <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="ป้อนรหัสครุภัณฑ์ (เช่น QR1001)"
                    style={{ width: '70%', padding: '10px' }}
                />
                <button onClick={handleScan} disabled={loading} style={{ padding: '10px', width: '25%', marginLeft: '5%' }}>
                    {loading ? 'ค้นหา...' : 'สแกน/ค้นหา'}
                </button>
            </div>

            {/* ส่วน 2: ผลลัพธ์/ข้อความ */}
            {message && <p style={{ color: asset ? 'green' : 'red', fontWeight: 'bold' }}>{message}</p>}
            
            {/* ส่วน 3: ข้อมูลครุภัณฑ์และฟอร์มบันทึกผล */}
            {asset && (
                <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                    <h3>ข้อมูลครุภัณฑ์: {asset.asset_name}</h3>
                    <p><strong>ID/S/N:</strong> {asset.asset_id} / {asset.serial_number}</p>
                    <p><strong>สถานที่ตั้งปัจจุบัน:</strong> {asset.building_name} / {asset.room_number}</p>
                    <p><strong>หน่วยงาน:</strong> {asset.department_name}</p>
                    <p><strong>สถานะปัจจุบัน:</strong> <span style={{ color: asset.status === 'ชำรุด' ? 'red' : 'green' }}>{asset.status}</span></p>

                    <h4 style={{ marginTop: '20px' }}>บันทึกผลการตรวจสอบ</h4>
                    
                    {/* ฟอร์ม Check Status */}
                    <Select label="สถานะที่พบ:" name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        {['ใช้งานได้', 'ชำรุด', 'รอซ่อม', 'สูญหาย'].map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <TextArea label="หมายเหตุ (ถ้ามี):" value={remark} onChange={(e) => setRemark(e.target.value)} />
                    
                    <button onClick={handleRecordCheck} disabled={loading} style={{ padding: '12px', width: '100%', marginTop: '10px', backgroundColor: '#007bff', color: 'white' }}>
                        บันทึกผลการตรวจสอบ ({status})
                    </button>
                    
                    <h4 style={{ marginTop: '30px' }}>บันทึกการเคลื่อนย้าย</h4>
                    
                    {/* ฟอร์ม Move Asset */}
                    <Input label="ย้ายไปยัง Location ID:" name="newLocationId" type="number" value={newLocationId} onChange={(e) => setNewLocationId(parseInt(e.target.value))} />
                    
                    <button onClick={handleRecordMove} disabled={loading || asset.location_id == newLocationId} style={{ padding: '12px', width: '100%', marginTop: '10px', backgroundColor: '#ffc107', color: 'black' }}>
                        บันทึกการย้ายครุภัณฑ์
                    </button>
                </div>
            )}
        </div>
    );
};

// Component ย่อยสำหรับ Input/Select
const Select = ({ label, children, ...props }) => (
    <div style={{marginBottom: '10px'}}>
        <label style={{ display: 'block', marginBottom: '5px' }}>{label}</label>
        <select {...props} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}>
            {children}
        </select>
    </div>
);
const Input = ({ label, ...props }) => (
    <div style={{marginBottom: '10px'}}>
        <label style={{ display: 'block', marginBottom: '5px' }}>{label}</label>
        <input {...props} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
    </div>
);
const TextArea = ({ label, ...props }) => (
    <div style={{marginBottom: '10px'}}>
        <label style={{ display: 'block', marginBottom: '5px' }}>{label}</label>
        <textarea {...props} style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
    </div>
);


export default InspectorScanView;