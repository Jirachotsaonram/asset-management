-- ใช้คำสั่ง INSERT INTO เพื่อเพิ่มข้อมูลเข้าตาราง Users

INSERT INTO Users (username, password, fullname, role, status, email, phone) 
VALUES 
('admin_user', 'admin123', 'ดร. ระบบ', 'Admin', 'Active', 'admin@it.ac.th', '081-123-4567'),
('inspector_01', 'inspector123', 'สมชาย ตรวจสอบ', 'Inspector', 'Active', 'somchai@it.ac.th', '089-987-6543');

-- ตรวจสอบข้อมูลที่เพิ่มเข้าไป
SELECT * FROM Users;