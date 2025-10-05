-- ฐานข้อมูลระบบจัดการครุภัณฑ์
-- Asset Management System Database

CREATE DATABASE IF NOT EXISTS asset_management_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE asset_management_db;

-- ตาราง Users (ผู้ใช้งานระบบ)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'Admin, Inspector',
    status VARCHAR(20) DEFAULT 'Active' COMMENT 'Active, Inactive',
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Departments (หน่วยงาน/ภาควิชา)
CREATE TABLE Departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Locations (สถานที่ตั้งครุภัณฑ์)
CREATE TABLE Locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Assets (ครุภัณฑ์)
CREATE TABLE Assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_name VARCHAR(200) NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    quantity INT DEFAULT 1,
    unit VARCHAR(50) COMMENT 'เครื่อง, ชุด',
    price DECIMAL(15,2),
    received_date DATE,
    department_id INT,
    location_id INT,
    status VARCHAR(50) DEFAULT 'ใช้งานได้' COMMENT 'ใช้งานได้, รอซ่อม, รอจำหน่าย, จำหน่ายแล้ว, ไม่พบ',
    barcode VARCHAR(100) UNIQUE,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id),
    FOREIGN KEY (location_id) REFERENCES Locations(location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Asset_Check (การตรวจสอบครุภัณฑ์)
CREATE TABLE Asset_Check (
    check_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    user_id INT NOT NULL,
    check_date DATE NOT NULL,
    check_status VARCHAR(50) COMMENT 'ปกติ, ชำรุด, สูญหาย',
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Asset_History (ประวัติการเคลื่อนย้าย)
CREATE TABLE Asset_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    old_location_id INT,
    new_location_id INT,
    moved_by INT NOT NULL,
    move_date DATE NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    FOREIGN KEY (old_location_id) REFERENCES Locations(location_id),
    FOREIGN KEY (new_location_id) REFERENCES Locations(location_id),
    FOREIGN KEY (moved_by) REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง AuditTrail (บันทึกการดำเนินการ)
CREATE TABLE AuditTrail (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    asset_id INT,
    action VARCHAR(50) COMMENT 'Add, Edit, Move, Check, Delete',
    old_value TEXT,
    new_value TEXT,
    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง Borrow (การยืมครุภัณฑ์)
CREATE TABLE Borrow (
    borrow_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    borrower_name VARCHAR(100) NOT NULL,
    department_id INT,
    borrow_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'ยืม' COMMENT 'ยืม, คืนแล้ว',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้าง Index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX idx_asset_status ON Assets(status);
CREATE INDEX idx_asset_department ON Assets(department_id);
CREATE INDEX idx_asset_location ON Assets(location_id);
CREATE INDEX idx_check_date ON Asset_Check(check_date);
CREATE INDEX idx_audit_date ON AuditTrail(action_date);
CREATE INDEX idx_borrow_status ON Borrow(status);

-- Insert ข้อมูลตัวอย่าง (Sample Data)

-- เพิ่มผู้ใช้งานตัวอย่าง (รหัสผ่าน: admin123, officer123)
INSERT INTO Users (username, password, fullname, role, status, email, phone) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบ', 'Admin', 'Active', 'admin@example.com', '0812345678'),
('officer1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'เจ้าหน้าที่ 1', 'Inspector', 'Active', 'officer1@example.com', '0823456789');

-- เพิ่มหน่วยงาน
INSERT INTO Departments (department_name, faculty) VALUES
('ภาควิชาเทคโนโลยีสารสนเทศ', 'คณะเทคโนโลยีและการจัดการอุตสาหกรรม'),
('ภาควิชาวิศวกรรมคอมพิวเตอร์', 'คณะวิศวกรรมศาสตร์');

-- เพิ่มสถานที่
INSERT INTO Locations (building_name, room_number, description) VALUES
('อาคาร IT', '301', 'ห้องปฏิบัติการคอมพิวเตอร์ 1'),
('อาคาร IT', '302', 'ห้องปฏิบัติการคอมพิวเตอร์ 2'),
('อาคาร IT', '401', 'ห้องสำนักงานอาจารย์');

-- เพิ่มครุภัณฑ์ตัวอย่าง
INSERT INTO Assets (asset_name, serial_number, quantity, unit, price, received_date, department_id, location_id, status, barcode) VALUES
('เครื่องคอมพิวเตอร์ Dell Optiplex 7090', 'SN001234567', 1, 'เครื่อง', 35000.00, '2024-01-15', 1, 1, 'ใช้งานได้', 'QR001234567'),
('เครื่องพิมพ์ HP LaserJet Pro', 'SN987654321', 1, 'เครื่อง', 15000.00, '2024-02-20', 1, 3, 'ใช้งานได้', 'QR987654321'),
('โปรเจคเตอร์ Epson EB-X41', 'SN555666777', 1, 'เครื่อง', 18000.00, '2023-12-10', 1, 1, 'ใช้งานได้', 'QR555666777');