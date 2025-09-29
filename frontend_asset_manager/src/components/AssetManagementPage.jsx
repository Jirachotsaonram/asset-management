import React, { useState, useEffect } from 'react';
import { getAssets, addAsset, updateAsset, deleteAsset, getLocations, getDepartments } from '../api/api';

const initialNewAssetForm = {
    asset_id: '',
    asset_name: '',
    serial_number: '',
    received_date: new Date().toISOString().split('T')[0], // วันที่วันนี้
    location_id: '',
    department_id: '',
    status: 'ใช้งานได้',
    price: 0
};

const AssetManagementPage = () => {
    const [assets, setAssets] = useState([]);
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // สถานะสำหรับฟอร์มเพิ่มครุภัณฑ์ใหม่
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAssetForm, setNewAssetForm] = useState(initialNewAssetForm);
    
    // สถานะสำหรับโหมดแก้ไข
    const [editingId, setEditingId] = useState(null); 
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchAllMasterDataAndAssets();
    }, []);

    // ดึงข้อมูลครุภัณฑ์และ Master Data พร้อมกัน
    const fetchAllMasterDataAndAssets = async () => {
        try {
            const [assetData, locData, deptData] = await Promise.all([
                getAssets(),
                getLocations(), // สมมติว่ามีฟังก์ชันนี้แล้ว
                getDepartments() // สมมติว่ามีฟังก์ชันนี้แล้ว
            ]);
            
            setAssets(assetData);
            setLocations(locData);
            setDepartments(deptData);

            // ตั้งค่าเริ่มต้นของฟอร์มเพิ่มครุภัณฑ์
            if (locData.length > 0) initialNewAssetForm.location_id = locData[0].location_id;
            if (deptData.length > 0) initialNewAssetForm.department_id = deptData[0].department_id;
            setNewAssetForm({...initialNewAssetForm});

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 1. เพิ่มครุภัณฑ์ใหม่ (Create)
    const handleAddAsset = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (!newAssetForm.asset_id || !newAssetForm.asset_name || !newAssetForm.location_id) {
                throw new Error('กรุณากรอกรหัสครุภัณฑ์ ชื่อครุภัณฑ์ และสถานที่ตั้ง');
            }
            await addAsset(newAssetForm); // ใช้ addAsset จาก api.js
            alert('เพิ่มครุภัณฑ์ใหม่สำเร็จ!');
            setShowAddForm(false);
            setNewAssetForm(initialNewAssetForm); // รีเซ็ตฟอร์ม
            await fetchAllMasterDataAndAssets();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. บันทึกการแก้ไข (Update)
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await updateAsset(editForm); // ใช้ updateAsset จาก api.js
            alert(`แก้ไขครุภัณฑ์ ID ${editingId} สำเร็จ!`);
            setEditingId(null);
            await fetchAllMasterDataAndAssets();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. ลบครุภัณฑ์ (Delete)
    const handleDelete = async (assetId, assetName) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบครุภัณฑ์: ${assetName} (ID: ${assetId})?`)) {
            return;
        }
        setIsLoading(true);
        try {
            await deleteAsset(assetId); // ใช้ deleteAsset จาก api.js
            alert('ลบครุภัณฑ์สำเร็จ!');
            await fetchAllMasterDataAndAssets();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // โหมดแก้ไข: เปิดฟอร์ม
    const handleEditClick = (asset) => {
        setEditingId(asset.asset_id);
        setEditForm({ 
            ...asset,
            // แปลง ID จาก String เป็น Number ก่อนส่งกลับไป
            location_id: parseInt(asset.location_id),
            department_id: parseInt(asset.department_id)
        });
    };

    // จัดการการเปลี่ยนแปลงในฟอร์มแก้ไข
    const handleChangeEdit = (e) => {
        const { name, value, type } = e.target;
        // จัดการค่าที่เป็นตัวเลข
        const val = (type === 'number' || name.includes('_id')) ? parseInt(value) : value;
        setEditForm(prev => ({ ...prev, [name]: val }));
    };

    // จัดการการเปลี่ยนแปลงในฟอร์มเพิ่ม
    const handleChangeAdd = (e) => {
        const { name, value, type } = e.target;
        const val = (type === 'number' || name.includes('_id')) ? (value === '' ? '' : parseInt(value)) : value;
        setNewAssetForm(prev => ({ ...prev, [name]: val }));
    };

    if (isLoading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูลครุภัณฑ์...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>🛒 จัดการครุภัณฑ์ทั้งหมด (Asset Management)</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
                {showAddForm ? 'ซ่อนฟอร์มเพิ่มครุภัณฑ์' : '+ เพิ่มครุภัณฑ์ใหม่'}
            </button> 
            
            {/* ฟอร์มเพิ่มครุภัณฑ์ */}
            {showAddForm && (
                <AddAssetForm 
                    newAssetForm={newAssetForm} 
                    handleChangeAdd={handleChangeAdd} 
                    handleAddAsset={handleAddAsset} 
                    locations={locations}
                    departments={departments}
                />
            )}

            {/* ตารางแสดงรายการครุภัณฑ์ทั้งหมด */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                {/* ... (Header ของตาราง) ... */}
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={tableHeaderStyle}>ID</th>
                        <th style={tableHeaderStyle}>ชื่อครุภัณฑ์</th>
                        <th style={tableHeaderStyle}>S/N</th>
                        <th style={tableHeaderStyle}>สถานที่ตั้ง</th>
                        <th style={tableHeaderStyle}>หน่วยงาน</th>
                        <th style={tableHeaderStyle}>สถานะ</th>
                        <th style={tableHeaderStyle}>ราคา</th>
                        <th style={tableHeaderStyle}>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset) => (
                        <tr key={asset.asset_id}>
                            {editingId === asset.asset_id ? (
                                // โหมดแก้ไข (แสดงฟอร์ม Input)
                                <EditAssetRow 
                                    asset={asset} 
                                    editForm={editForm} 
                                    handleChangeEdit={handleChangeEdit} 
                                    handleSaveEdit={handleSaveEdit} 
                                    setEditingId={setEditingId}
                                    locations={locations}
                                    departments={departments}
                                />
                            ) : (
                                // โหมดแสดงผลปกติ
                                <>
                                    <td style={tableCellStyle}>{asset.asset_id}</td>
                                    <td style={tableCellStyle}>{asset.asset_name}</td>
                                    <td style={tableCellStyle}>{asset.serial_number}</td>
                                    <td style={tableCellStyle}>{locations.find(l => l.location_id == asset.location_id)?.room_number || 'N/A'}</td>
                                    <td style={tableCellStyle}>{departments.find(d => d.department_id == asset.department_id)?.department_name || 'N/A'}</td>
                                    <td style={{...tableCellStyle, color: asset.status === 'ชำรุด' || asset.status === 'ถูกยืม' ? 'red' : 'green'}}>{asset.status}</td>
                                    <td style={tableCellStyle}>{parseFloat(asset.price).toLocaleString()}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleEditClick(asset)} style={{ marginRight: '5px' }}>แก้ไข</button>
                                        <button onClick={() => handleDelete(asset.asset_id, asset.asset_name)} style={{ backgroundColor: '#f44336', color: 'white' }}>ลบ</button>
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


// Component ย่อย: ฟอร์มเพิ่มครุภัณฑ์ใหม่
const AddAssetForm = ({ newAssetForm, handleChangeAdd, handleAddAsset, locations, departments }) => (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#e6f7ff' }}>
        <h4>ข้อมูลครุภัณฑ์ใหม่</h4>
        <form onSubmit={handleAddAsset} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <Input label="รหัสครุภัณฑ์ (Asset ID)*" name="asset_id" value={newAssetForm.asset_id} onChange={handleChangeAdd} required />
            <Input label="ชื่อครุภัณฑ์*" name="asset_name" value={newAssetForm.asset_name} onChange={handleChangeAdd} required />
            <Input label="เลขซีเรียล (S/N)" name="serial_number" value={newAssetForm.serial_number} onChange={handleChangeAdd} />
            
            <Select label="สถานที่ตั้ง (Location)*" name="location_id" value={newAssetForm.location_id} onChange={handleChangeAdd}>
                {locations.map(l => (
                    <option key={l.location_id} value={l.location_id}>
                        {l.building_name} - {l.room_number}
                    </option>
                ))}
            </Select>
            <Select label="หน่วยงาน (Department)*" name="department_id" value={newAssetForm.department_id} onChange={handleChangeAdd}>
                 {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                    </option>
                ))}
            </Select>
            <Input label="วันที่รับเข้า" name="received_date" type="date" value={newAssetForm.received_date} onChange={handleChangeAdd} />
            
            <Input label="ราคา (บาท)" name="price" type="number" value={newAssetForm.price} onChange={handleChangeAdd} />
            <div style={{ gridColumn: 'span 3' }}>
                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
                    ยืนยันการเพิ่มครุภัณฑ์
                </button>
            </div>
        </form>
    </div>
);

// Component ย่อย: แถวสำหรับแก้ไขข้อมูล (Update)
const EditAssetRow = ({ asset, editForm, handleChangeEdit, handleSaveEdit, setEditingId, locations, departments }) => (
    <>
        <td style={tableCellStyle}>{asset.asset_id}</td>
        <td style={tableCellStyle}>
            <input type="text" name="asset_name" value={editForm.asset_name || ''} onChange={handleChangeEdit} style={{ width: '90%' }} />
        </td>
        <td style={tableCellStyle}>
            <input type="text" name="serial_number" value={editForm.serial_number || ''} onChange={handleChangeEdit} style={{ width: '90%' }} />
        </td>
        <td style={tableCellStyle}>
            <select name="location_id" value={editForm.location_id} onChange={handleChangeEdit} style={{ width: '90%' }}>
                {locations.map(l => (
                    <option key={l.location_id} value={l.location_id}>
                        {l.room_number}
                    </option>
                ))}
            </select>
        </td>
        <td style={tableCellStyle}>
            <select name="department_id" value={editForm.department_id} onChange={handleChangeEdit} style={{ width: '90%' }}>
                {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                    </option>
                ))}
            </select>
        </td>
        <td style={tableCellStyle}>
            <select name="status" value={editForm.status} onChange={handleChangeEdit} style={{ width: '90%' }}>
                {['ใช้งานได้', 'ชำรุด', 'รอซ่อม', 'สูญหาย', 'ถูกยืม'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </td>
        <td style={tableCellStyle}>
             <input type="number" name="price" value={editForm.price || 0} onChange={handleChangeEdit} style={{ width: '90%' }} />
        </td>
        <td style={tableCellStyle}>
            <button onClick={handleSaveEdit} style={{ marginRight: '5px' }}>บันทึก</button>
            <button onClick={() => setEditingId(null)}>ยกเลิก</button>
        </td>
    </>
);


// Component ย่อยสำหรับ Input/Select
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

const tableHeaderStyle = { border: '1px solid #ddd', padding: '12px', textAlign: 'left' };
const tableCellStyle = { border: '1px solid #ddd', padding: '10px' };


export default AssetManagementPage;