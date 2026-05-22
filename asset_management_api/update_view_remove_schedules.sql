-- =============================================================
-- Asset Management DB - Fresh Install (Clean)
-- วันที่: 2026-05-22
-- สร้างตารางทั้งหมด + admin 1 account + system_settings
-- ไม่มี asset_schedules / check_schedules (ลบแล้ว)
-- ลบคอลัมน์ department (text) ออกจาก assets (ซ้ำกับ department_id FK)
-- =============================================================

CREATE DATABASE IF NOT EXISTS `asset_management_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `asset_management_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- ตารางหลัก (สร้างตามลำดับ dependency)
-- =============================================

-- 1. users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `role` enum('Admin','Inspector','Viewer') NOT NULL DEFAULT 'Inspector',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` VALUES 
('1', 'admin', '$2y$10$cmGbk5vTlst9LBt0sXPumeiqjJiLGd9s8Sfw7Nlclt6vPxdjiTJki', 'ผู้ดูแลระบบ', 'Admin', 'Active', 'admin@example.com', '0987654321', '2025-12-11 08:32:09', '2026-03-01 12:44:52');

-- 2. departments
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`department_id`),
  KEY `idx_department_name` (`department_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. locations
DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL AUTO_INCREMENT,
  `building_name` varchar(100) NOT NULL,
  `floor` varchar(10) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`location_id`),
  KEY `idx_building` (`building_name`),
  KEY `idx_room` (`room_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. assets
DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
  `asset_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'รหัสครุภัณฑ์ (PK)',
  `asset_name` varchar(255) NOT NULL COMMENT 'ชื่อครุภัณฑ์',
  `serial_number` text DEFAULT NULL COMMENT 'หมายเลขซีเรียล',
  `quantity` int(11) DEFAULT 1 COMMENT 'จำนวน',
  `unit` varchar(50) DEFAULT 'เครื่อง' COMMENT 'หน่วยนับ',
  `price` decimal(15,2) DEFAULT 0.00 COMMENT 'มูลค่าครุภัณฑ์ (บาท)',
  `received_date` date DEFAULT NULL COMMENT 'วันที่รับเข้าคลัง',
  `department_id` int(11) DEFAULT NULL COMMENT 'รหัสหน่วยงาน (FK)',
  `delivery_number` varchar(100) DEFAULT NULL COMMENT 'เลขที่ใบส่งของ',
  `fund_code` varchar(50) DEFAULT NULL COMMENT 'รหัสกองทุน',
  `plan_code` varchar(50) DEFAULT NULL COMMENT 'รหัสแผนงาน',
  `project_code` varchar(50) DEFAULT NULL COMMENT 'รหัสงาน/โครงการ',
  `location_id` int(11) DEFAULT NULL COMMENT 'รหัสสถานที่ (FK)',
  `room_text` varchar(200) DEFAULT NULL COMMENT 'ใช้ประจำห้อง (ข้อความ)',
  `status` varchar(50) DEFAULT 'ใช้งานได้' COMMENT 'สถานะครุภัณฑ์',
  `barcode` varchar(100) DEFAULT NULL COMMENT 'หมายเลขครุภัณฑ์/บาร์โค้ด',
  `description` text DEFAULT NULL COMMENT 'รายละเอียด/คุณสมบัติ',
  `reference_number` varchar(255) DEFAULT NULL COMMENT 'หมวดสินทรัพย์/เลขอ้างอิง',
  `image` varchar(255) DEFAULT NULL COMMENT 'รูปภาพครุภัณฑ์',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'วันที่สร้างข้อมูล',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'วันที่แก้ไขล่าสุด',
  PRIMARY KEY (`asset_id`),
  KEY `idx_serial` (`serial_number`(768)),
  KEY `idx_barcode` (`barcode`),
  KEY `idx_status` (`status`),
  KEY `idx_department` (`department_id`),
  KEY `idx_location` (`location_id`),
  CONSTRAINT `fk_asset_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asset_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. asset_check
DROP TABLE IF EXISTS `asset_check`;
CREATE TABLE `asset_check` (
  `check_id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `check_date` date NOT NULL,
  `check_status` enum('ใช้งานได้','รอซ่อม','รอจำหน่าย','จำหน่ายแล้ว','ไม่พบ') DEFAULT 'ใช้งานได้',
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`check_id`),
  KEY `idx_asset_check` (`asset_id`,`check_date`),
  KEY `idx_check_date` (`check_date`),
  KEY `fk_check_user` (`user_id`),
  CONSTRAINT `fk_check_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_check_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. asset_history
DROP TABLE IF EXISTS `asset_history`;
CREATE TABLE `asset_history` (
  `history_id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `old_location_id` int(11) DEFAULT NULL,
  `new_location_id` int(11) DEFAULT NULL,
  `moved_by` int(11) NOT NULL,
  `move_date` date NOT NULL,
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `idx_asset_history` (`asset_id`,`move_date`),
  KEY `fk_history_old_location` (`old_location_id`),
  KEY `fk_history_new_location` (`new_location_id`),
  KEY `fk_history_user` (`moved_by`),
  CONSTRAINT `fk_history_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_new_location` FOREIGN KEY (`new_location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_history_old_location` FOREIGN KEY (`old_location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`moved_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. audittrail
DROP TABLE IF EXISTS `audittrail`;
CREATE TABLE `audittrail` (
  `audit_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `action` enum('Add','Edit','Move','Check','Delete','Borrow','Return') DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `action_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_date` (`action_date`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_asset` (`asset_id`),
  CONSTRAINT `fk_audit_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. borrow
DROP TABLE IF EXISTS `borrow`;
CREATE TABLE `borrow` (
  `borrow_id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `borrower_name` varchar(100) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('ยืม','คืนแล้ว') DEFAULT 'ยืม',
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`borrow_id`),
  KEY `idx_borrow_status` (`status`),
  KEY `idx_borrow_date` (`borrow_date`),
  KEY `fk_borrow_asset` (`asset_id`),
  KEY `fk_borrow_department` (`department_id`),
  CONSTRAINT `fk_borrow_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_borrow_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. import_history
DROP TABLE IF EXISTS `import_history`;
CREATE TABLE `import_history` (
  `import_id` int(11) NOT NULL AUTO_INCREMENT,
  `import_date` datetime DEFAULT current_timestamp(),
  `filename` varchar(255) DEFAULT NULL,
  `total_rows` int(11) DEFAULT NULL,
  `success_count` int(11) DEFAULT NULL,
  `failed_count` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`import_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `import_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. login_attempts
DROP TABLE IF EXISTS `login_attempts`;
CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `attempt_time` datetime NOT NULL,
  `success` tinyint(1) DEFAULT 0,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_username_time` (`username`,`attempt_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. system_settings
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('annual_check_start', '2026-05-15'),
('annual_check_end', '2026-05-17');

-- =============================================
-- View (ไม่มี schedule tables แล้ว)
-- =============================================

DROP VIEW IF EXISTS `v_assets_with_check_info`;

CREATE VIEW `v_assets_with_check_info` AS
SELECT
    a.asset_id,
    a.asset_name,
    a.serial_number,
    a.quantity,
    a.unit,
    a.price,
    a.received_date,
    a.department_id,
    a.delivery_number,
    a.fund_code,
    a.plan_code,
    a.project_code,
    a.location_id,
    a.room_text,
    a.status,
    a.barcode,
    a.description,
    a.reference_number,
    a.image,
    a.created_at,
    a.updated_at,
    d.department_name,
    d.faculty AS faculty_name,
    l.building_name,
    l.floor,
    l.room_number,
    ac_latest.check_date AS last_check_date,
    u_latest.fullname AS last_checker,
    ac_latest.check_status AS last_check_status
FROM assets a
LEFT JOIN departments d ON a.department_id = d.department_id
LEFT JOIN locations l ON a.location_id = l.location_id
LEFT JOIN (
    SELECT asset_id, MAX(check_id) AS latest_check_id
    FROM asset_check
    GROUP BY asset_id
) latest_ids ON a.asset_id = latest_ids.asset_id
LEFT JOIN asset_check ac_latest ON latest_ids.latest_check_id = ac_latest.check_id
LEFT JOIN users u_latest ON ac_latest.user_id = u_latest.user_id;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- สรุป:
-- ✅ สร้างตาราง 11 ตาราง (ไม่มี schedule tables)
-- ✅ สร้าง View v_assets_with_check_info
--    - ไม่มี a.department (text) → ลบแล้ว (2026-05-22)
--    - ไม่มี a.faculty_name → ใช้ d.faculty AS faculty_name แทน (2026-05-22)
-- ✅ users = admin 1 account (username: admin, password: admin123)
-- ✅ system_settings = ค่ารอบตรวจประจำปี
-- ✅ ตารางอื่นๆ = ว่างพร้อมใช้งาน
-- ✅ ลบคอลัมน์ department (text) ออกจาก assets แล้ว (2026-05-22)
-- ✅ ลบคอลัมน์ faculty_name ออกจาก assets แล้ว (2026-05-22)
-- =============================================
