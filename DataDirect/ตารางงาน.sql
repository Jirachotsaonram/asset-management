-- 1. สร้างฐานข้อมูล (ถ้ายังไม่มี)
CREATE DATABASE asset_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- เลือกใช้ฐานข้อมูลที่สร้าง
USE asset_management_db;
-- ตั้งค่าให้ปิดการตรวจสอบ Foreign Key ชั่วคราว เพื่อให้สร้างตารางที่มีความสัมพันธ์กันได้ง่ายขึ้น
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================
-- 2. การสร้างตารางหลัก (Master Tables)
-- ================================================

-- ตาราง Departments (หน่วยงาน/ภาควิชา) [cite: 433, 434]
CREATE TABLE Departments (
    department_id INT NOT NULL AUTO_INCREMENT, -- รหัสหน่วยงาน (PK) [cite: 434]
    department_name VARCHAR(255) NOT NULL,     -- ชื่อหน่วยงาน [cite: 434]
    faculty VARCHAR(255),                      -- คณะ [cite: 434]
    PRIMARY KEY (department_id)
);

-- ตาราง Locations (สถานที่ตั้งครุภัณฑ์) [cite: 435, 436]
CREATE TABLE Locations (
    location_id INT NOT NULL AUTO_INCREMENT,   -- รหัสสถานที่ (PK) [cite: 436]
    building_name VARCHAR(255) NOT NULL,       -- ชื่ออาคาร [cite: 436]
    room_number VARCHAR(50) NOT NULL,          -- เลขห้อง [cite: 436]
    description VARCHAR(255),                  -- รายละเอียดเพิ่มเติม [cite: 436]
    PRIMARY KEY (location_id)
);

-- ตาราง Users (ผู้ใช้งานระบบ) [cite: 431, 432]
CREATE TABLE Users (
    user_id INT NOT NULL AUTO_INCREMENT,       -- รหัสผู้ใช้งาน (PK) [cite: 432]
    username VARCHAR(100) NOT NULL UNIQUE,     -- ชื่อบัญชีที่ใช้ล็อกอิน (Unique) [cite: 432]
    password VARCHAR(255) NOT NULL,            -- รหัสผ่าน [cite: 432]
    fullname VARCHAR(255),                     -- ชื่อ-นามสกุลจริง [cite: 432]
    role VARCHAR(50),                          -- บทบาท เช่น Admin, Inspector [cite: 432]
    status VARCHAR(20),                        -- สถานะบัญชี (Active/Inactive) [cite: 432]
    email VARCHAR(100),                        -- อีเมลผู้ใช้งาน [cite: 432]
    phone VARCHAR(20),                         -- เบอร์โทรศัพท์ [cite: 432]
    PRIMARY KEY (user_id)
);

-- ================================================
-- 3. การสร้างตารางหลักของครุภัณฑ์ (Assets)
-- ================================================

-- ตาราง Assets (ครุภัณฑ์) [cite: 437, 438]
CREATE TABLE Assets (
    asset_id INT NOT NULL AUTO_INCREMENT,      -- รหัสครุภัณฑ์ (PK) 
    asset_name VARCHAR(255) NOT NULL,          -- ชื่อครุภัณฑ์ 
    serial_number VARCHAR(100) UNIQUE,         -- หมายเลขซีเรียล (Unique) 
    quantity INT,                              -- จำนวน 
    unit VARCHAR(50),                          -- หน่วยนับ 
    price DECIMAL(10, 2),                      -- ราคาต่อหน่วย 
    received_date DATE,                        -- วันที่ตรวจรับ 
    department_id INT,                         -- หน่วยงานเจ้าของ (FK) 
    location_id INT,                           -- ตำแหน่งปัจจุบัน (FK) 
    status VARCHAR(50),                        -- สถานะ (ใช้งานได้/รอซ่อม/ฯลฯ) 
    barcode VARCHAR(100),                      -- รหัสบาร์โค้ด/QR 
    image VARCHAR(255),                        -- รูปภาพ 
    PRIMARY KEY (asset_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id),
    FOREIGN KEY (location_id) REFERENCES Locations(location_id)
);

-- ================================================
-- 4. การสร้างตารางสำหรับ Transaction/Log
-- ================================================

-- ตาราง Asset_Check (การตรวจสอบครุภัณฑ์) [cite: 439, 440]
CREATE TABLE Asset_Check (
    check_id INT NOT NULL AUTO_INCREMENT,      -- รหัสการตรวจสอบ (PK) [cite: 440]
    asset_id INT,                              -- รหัสครุภัณฑ์ (FK) [cite: 440]
    user_id INT,                               -- ผู้ตรวจสอบ (FK) [cite: 440]
    check_date DATE,                           -- วันที่ตรวจ [cite: 440]
    check_status VARCHAR(50),                  -- ผลตรวจสอบ [cite: 440]
    remark VARCHAR(255),                       -- หมายเหตุ [cite: 440]
    PRIMARY KEY (check_id),
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ตาราง Asset_History (ประวัติการเคลื่อนย้าย) [cite: 441, 442]
CREATE TABLE Asset_History (
    history_id INT NOT NULL AUTO_INCREMENT,    -- รหัสประวัติการเคลื่อนย้าย (PK) [cite: 442]
    asset_id INT,                              -- รหัสครุภัณฑ์ (FK) [cite: 442]
    old_location_id INT,                       -- ตำแหน่งเดิม (FK) [cite: 442]
    new_location_id INT,                       -- ตำแหน่งใหม่ (FK) [cite: 442]
    moved_by INT,                              -- ผู้ดำเนินการ (FK) [cite: 442]
    move_date DATE,                            -- วันที่ย้าย [cite: 442]
    remark VARCHAR(255),                       -- หมายเหตุ [cite: 442]
    PRIMARY KEY (history_id),
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    FOREIGN KEY (old_location_id) REFERENCES Locations(location_id),
    FOREIGN KEY (new_location_id) REFERENCES Locations(location_id),
    FOREIGN KEY (moved_by) REFERENCES Users(user_id)
);

-- ตาราง Borrow (การยืมครุภัณฑ์) [cite: 445, 446]
CREATE TABLE Borrow (
    borrow_id INT NOT NULL AUTO_INCREMENT,     -- รหัสการยืม (PK) [cite: 446]
    asset_id INT,                              -- รหัสครุภัณฑ์ (FK) [cite: 446]
    borrower_name VARCHAR(255) NOT NULL,       -- ชื่อผู้ยืม [cite: 446]
    department_id INT,                         -- หน่วยงานที่ยืม (FK) [cite: 446]
    borrow_date DATE,                          -- วันที่ยืม [cite: 446]
    return_date DATE,                          -- วันที่คืน [cite: 446]
    status VARCHAR(50),                        -- สถานะ (ยืม / คืนแล้ว) [cite: 446]
    PRIMARY KEY (borrow_id),
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

-- ตาราง Audit_Trail (บันทึกการดำเนินการ) [cite: 443, 444]
CREATE TABLE Audit_Trail (
    audit_id INT NOT NULL AUTO_INCREMENT,      -- รหัสประวัติ (PK) 
    user_id INT,                               -- ผู้กระทำการ (FK) 
    asset_id INT,                              -- ครุภัณฑ์ที่เกี่ยวข้อง (FK) 
    action VARCHAR(50),                        -- ประเภทการกระทำ (Add/Edit/Move/Check) 
    old_value TEXT,                            -- ค่าก่อนเปลี่ยน 
    new_value TEXT,                            -- ค่าหลังเปลี่ยน 
    action_date DATETIME,                      -- วันที่ดำเนินการ 
    PRIMARY KEY (audit_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id)
);

-- เปิดการตรวจสอบ Foreign Key กลับมาใช้งาน
SET FOREIGN_KEY_CHECKS = 1;