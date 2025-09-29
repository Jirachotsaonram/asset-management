import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, deleteUser, addUser } from '../api/api';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null); // ID ของแถวที่กำลังแก้ไข
    const [editForm, setEditForm] = useState({}); // ข้อมูลในฟอร์มแก้ไข
    const [showAddForm, setShowAddForm] = useState(false); // สถานะแสดงฟอร์มเพิ่มผู้ใช้
    const [addForm, setAddForm] = useState({ username: '', password: '', fullname: '', role: 'Inspector', email: '', phone: '', status: 'Active' });

    useEffect(() => {
        fetchUsers();
    }, []);

    // 1. ดึงข้อมูลผู้ใช้ทั้งหมด
    const fetchUsers = async () => {
        try {
            const data = await getUsers(); // ใช้ getUsers จาก api.js
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. จัดการการเพิ่มผู้ใช้ใหม่ (Add User)
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // ตรวจสอบว่ามี username และ password
            if (!addForm.username || !addForm.password) {
                 throw new Error('Username และ Password ต้องไม่ว่าง');
            }
            await addUser(addForm);
            alert('เพิ่มผู้ใช้ใหม่สำเร็จ!');
            setAddForm({ username: '', password: '', fullname: '', role: 'Inspector', email: '', phone: '', status: 'Active' });
            setShowAddForm(false);
            await fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. จัดการการแก้ไขข้อมูลผู้ใช้ (Update User)
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข (และ user_id)
            const dataToSend = {
                user_id: editForm.user_id,
                fullname: editForm.fullname,
                role: editForm.role,
                status: editForm.status,
                email: editForm.email,
                phone: editForm.phone,
                // ถ้ามีการกรอกรหัสผ่านใหม่ ให้ส่งไปด้วย
                ...(editForm.password && { password: editForm.password }) 
            };
            
            await updateUser(dataToSend);
            alert(`แก้ไขผู้ใช้ ID ${editingId} สำเร็จ!`);
            setEditingId(null);
            await fetchUsers(); // โหลดข้อมูลใหม่
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 4. จัดการการลบผู้ใช้ (Delete User)
    const handleDelete = async (userId, fullname) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้: ${fullname} (ID: ${userId})?`)) {
            return;
        }
        setIsLoading(true);
        try {
            await deleteUser(userId);
            alert('ลบผู้ใช้สำเร็จ!');
            await fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // โหมดแก้ไข: เปิดฟอร์ม
    const handleEditClick = (user) => {
        setEditingId(user.user_id);
        setEditForm({ 
            ...user,
            password: '' // เคลียร์รหัสผ่านเก่าออก เพื่อไม่ให้แสดงใน input
        });
    };

    // จัดการการเปลี่ยนแปลงในฟอร์มแก้ไข
    const handleChangeEdit = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };
    // จัดการการเปลี่ยนแปลงในฟอร์มเพิ่ม
    const handleChangeAdd = (e) => {
        const { name, value } = e.target;
        setAddForm(prev => ({ ...prev, [name]: value }));
    };


    if (isLoading) return <div style={{ padding: '20px' }}>กำลังโหลดข้อมูลผู้ใช้งาน...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>👥 จัดการผู้ใช้งานระบบ (Users Management)</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
                {showAddForm ? 'ซ่อนฟอร์มเพิ่มผู้ใช้' : '+ เพิ่มผู้ใช้งานใหม่'}
            </button> 
            
            {/* ฟอร์มเพิ่มผู้ใช้ */}
            {showAddForm && (
                <AddUserForm 
                    addForm={addForm} 
                    handleChangeAdd={handleChangeAdd} 
                    handleAddSubmit={handleAddSubmit} 
                    isLoading={isLoading} 
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={tableHeaderStyle}>ID</th>
                        <th style={tableHeaderStyle}>Username</th>
                        <th style={tableHeaderStyle}>ชื่อ-นามสกุล</th>
                        <th style={tableHeaderStyle}>บทบาท (Role)</th>
                        <th style={tableHeaderStyle}>สถานะ</th>
                        <th style={tableHeaderStyle}>อีเมล</th>
                        <th style={tableHeaderStyle}>ดำเนินการ</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.user_id}>
                            {editingId === user.user_id ? (
                                // โหมดแก้ไข (แสดงฟอร์ม Input)
                                <tr style={{ backgroundColor: '#fffbe6' }}>
                                    <td style={tableCellStyle}>{user.user_id}</td>
                                    <td style={tableCellStyle}>{user.username}</td>
                                    <td style={tableCellStyle}>
                                        <input type="text" name="fullname" value={editForm.fullname} onChange={handleChangeEdit} style={{ width: '90%' }} />
                                    </td>
                                    <td style={tableCellStyle}>
                                        <select name="role" value={editForm.role} onChange={handleChangeEdit} style={{ width: '90%' }}>
                                            <option value="Admin">Admin</option>
                                            <option value="Inspector">Inspector</option>
                                        </select>
                                    </td>
                                    <td style={tableCellStyle}>
                                        <select name="status" value={editForm.status} onChange={handleChangeEdit} style={{ width: '90%' }}>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </td>
                                     <td style={tableCellStyle}>
                                        <input type="text" name="email" value={editForm.email} onChange={handleChangeEdit} placeholder="E-mail" style={{ width: '90%' }} />
                                    </td>
                                    <td style={tableCellStyle}>
                                        <button onClick={handleSaveEdit} disabled={isLoading} style={{ marginRight: '5px' }}>บันทึก</button>
                                        <button onClick={() => setEditingId(null)}>ยกเลิก</button>
                                    </td>
                                </tr>
                            ) : (
                                // โหมดแสดงผลปกติ
                                <>
                                    <td style={tableCellStyle}>{user.user_id}</td>
                                    <td style={tableCellStyle}>{user.username}</td>
                                    <td style={tableCellStyle}>{user.fullname}</td>
                                    <td style={tableCellStyle}>{user.role}</td>
                                    <td style={tableCellStyle}>{user.status}</td>
                                    <td style={tableCellStyle}>{user.email}</td>
                                    <td style={tableCellStyle}>
                                        <button onClick={() => handleEditClick(user)} style={{ marginRight: '5px' }}>แก้ไข</button>
                                        <button onClick={() => handleDelete(user.user_id, user.fullname)} style={{ backgroundColor: '#f44336', color: 'white' }}>ลบ</button>
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

// Component ย่อยสำหรับฟอร์มเพิ่มผู้ใช้
const AddUserForm = ({ addForm, handleChangeAdd, handleAddSubmit, isLoading, onCancel }) => (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
        <h4>ข้อมูลผู้ใช้งานใหม่</h4>
        <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <Input label="ชื่อบัญชี (Username)*" name="username" value={addForm.username} onChange={handleChangeAdd} required />
            <Input label="รหัสผ่าน (Password)*" name="password" type="password" value={addForm.password} onChange={handleChangeAdd} required />
            <Input label="ชื่อ-นามสกุล" name="fullname" value={addForm.fullname} onChange={handleChangeAdd} required />
            
            <Select label="บทบาท (Role)" name="role" value={addForm.role} onChange={handleChangeAdd}>
                <option value="Admin">Admin</option>
                <option value="Inspector">Inspector</option>
            </Select>
            <Input label="อีเมล" name="email" type="email" value={addForm.email} onChange={handleChangeAdd} />
            <Input label="เบอร์โทรศัพท์" name="phone" type="text" value={addForm.phone} onChange={handleChangeAdd} />

            <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={isLoading} style={{ padding: '10px', flex: 1, backgroundColor: '#4CAF50', color: 'white' }}>
                    {isLoading ? 'กำลังเพิ่ม...' : 'ยืนยันการเพิ่มผู้ใช้'}
                </button>
                <button type="button" onClick={onCancel} style={{ padding: '10px', flex: 1, backgroundColor: '#ccc' }}>
                    ยกเลิก
                </button>
            </div>
        </form>
    </div>
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


export default UserManagementPage;