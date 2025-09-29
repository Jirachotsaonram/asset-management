import React, { useState, useEffect } from 'react';
import { getBorrows, addBorrow, returnAsset, getAssets, getDepartments } from '../api/api';

const BorrowManagementPage = () => {
    const [borrows, setBorrows] = useState([]);
    const [assets, setAssets] = useState([]); // Master: รายการครุภัณฑ์ที่ยืมได้
    const [departments, setDepartments] = useState([]); // Master: หน่วยงาน
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [borrowForm, setBorrowForm] = useState({ 
        asset_id: '', 
        borrower_name: '', 
        department_id: '', 
        borrow_date: new Date().toISOString().split('T')[0] 
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [borrowData, assetData, deptData] = await Promise.all([
                getBorrows(), 
                getAssets(), 
                getDepartments()
            ]);
            
            setBorrows(borrowData);
            // กรองเฉพาะครุภัณฑ์ที่ "ใช้งานได้" หรือ "ถูกยืม" สำหรับ Dropdown
            setAssets(assetData.filter(a => a.status === 'ใช้งานได้' || a.status === 'ถูกยืม'));
            setDepartments(deptData);
            
            // ตั้งค่า Default ID
            if (assetData.length > 0) setBorrowForm(prev => ({...prev, asset_id: assetData[0].asset_id}));
            if (deptData.length > 0) setBorrowForm(prev => ({...prev, department_id: deptData[0].department_id}));

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 1. จัดการการยืมใหม่
    const handleAddBorrow = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addBorrow(borrowForm);
            alert('บันทึกการยืมสำเร็จ! สถานะครุภัณฑ์ถูกอัปเดตแล้ว');
            setShowAddForm(false);
            setBorrowForm(prev => ({ ...prev, asset_id: '', borrower_name: '', department_id: '' }));
            await fetchAllData(); // รีเฟรชข้อมูลทั้งหมด
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. จัดการการคืนครุภัณฑ์
    const handleReturn = async (borrowId) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าครุภัณฑ์นี้ถูกคืนแล้วและมีสภาพเรียบร้อย?')) return;
        
        setIsLoading(true);
        try {
            const returnData = {
                borrow_id: borrowId,
                return_date: new Date().toISOString().split('T')[0] // วันที่คืนเป็นวันนี้
            };
            await returnAsset(returnData);
            alert('บันทึกการคืนสำเร็จ! สถานะครุภัณฑ์ถูกอัปเดตกลับเป็น "ใช้งานได้" แล้ว');
            await fetchAllData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูลการยืม-คืน...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>📚 จัดการการยืม-คืนครุภัณฑ์</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#3f51b5', color: 'white', border: 'none' }}>
                {showAddForm ? 'ซ่อนฟอร์มบันทึกการยืม' : '+ บันทึกการยืมใหม่'}
            </button> 
            
            {/* ฟอร์มบันทึกการยืม */}
            {showAddForm && (
                <BorrowForm 
                    borrowForm={borrowForm} 
                    setBorrowForm={setBorrowForm} 
                    handleAddBorrow={handleAddBorrow} 
                    assets={assets.filter(a => a.status === 'ใช้งานได้')} // กรองเฉพาะที่พร้อมให้ยืม
                    departments={departments}
                    isLoading={isLoading} 
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {/* ตารางแสดงรายการยืม */}
            <h4 style={{ marginTop: '20px' }}>รายการยืมทั้งหมด ({borrows.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={tableHeaderStyle}>รหัสยืม</th>
                        <th style={tableHeaderStyle}>ครุภัณฑ์</th>
                        <th style={tableHeaderStyle}>ผู้ยืม / หน่วยงาน</th>
                        <th style={tableHeaderStyle}>วันที่ยืม</th>
                        <th style={tableHeaderStyle}>วันที่คืน (กำหนด)</th>
                        <th style={tableHeaderStyle}>สถานะ</th>
                        <th style={tableHeaderStyle}>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    {borrows.map((b) => (
                        <tr key={b.borrow_id}>
                            <td style={tableCellStyle}>{b.borrow_id}</td>
                            <td style={tableCellStyle}>{b.asset_name} (ID: {b.asset_id})</td>
                            <td style={tableCellStyle}>{b.borrower_name} / {b.department_name}</td>
                            <td style={tableCellStyle}>{b.borrow_date}</td>
                            <td style={tableCellStyle}>{b.return_date || '-'}</td>
                            <td style={{...tableCellStyle, color: b.status === 'ยืม' ? 'red' : 'green'}}>
                                <strong>{b.status}</strong>
                            </td>
                            <td style={tableCellStyle}>
                                {b.status === 'ยืม' && (
                                    <button onClick={() => handleReturn(b.borrow_id)} disabled={isLoading} style={{ backgroundColor: '#ff9800', color: 'white' }}>
                                        บันทึกคืน
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// Component ย่อยสำหรับฟอร์มบันทึกการยืม
const BorrowForm = ({ borrowForm, setBorrowForm, handleAddBorrow, assets, departments, isLoading, onCancel }) => (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#e8eaf6' }}>
        <h4>บันทึกข้อมูลการยืม</h4>
        <form onSubmit={handleAddBorrow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            
            <Select label="ครุภัณฑ์ที่ยืม" name="asset_id" value={borrowForm.asset_id} onChange={(e) => setBorrowForm(prev => ({ ...prev, asset_id: e.target.value }))}>
                {assets.map(a => (
                    <option key={a.asset_id} value={a.asset_id}>
                        {a.asset_name} (ID: {a.asset_id})
                    </option>
                ))}
            </Select>
            <Input label="ชื่อผู้ยืม" name="borrower_name" value={borrowForm.borrower_name} onChange={(e) => setBorrowForm(prev => ({ ...prev, borrower_name: e.target.value }))} required />
            <Input label="วันที่ยืม" name="borrow_date" type="date" value={borrowForm.borrow_date} onChange={(e) => setBorrowForm(prev => ({ ...prev, borrow_date: e.target.value }))} required />

            <Select label="หน่วยงานที่ยืม" name="department_id" value={borrowForm.department_id} onChange={(e) => setBorrowForm(prev => ({ ...prev, department_id: e.target.value }))}>
                {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                    </option>
                ))}
            </Select>
            
            {/* ปุ่ม Submit และ Cancel */}
            <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={isLoading} style={{ padding: '10px', flex: 1, backgroundColor: '#3f51b5', color: 'white' }}>
                    {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการยืม'}
                </button>
                <button type="button" onClick={onCancel} style={{ padding: '10px', flex: 1, backgroundColor: '#ccc' }}>
                    ยกเลิก
                </button>
            </div>
        </form>
    </div>
);


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

export default BorrowManagementPage;