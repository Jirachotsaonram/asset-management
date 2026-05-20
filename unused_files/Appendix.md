
## สารบัญภาคผนวก

**ภาคผนวก ก** รายละเอียดโครงสร้างฐานข้อมูล (Database Schema)  
**ภาคผนวก ข** ขั้นตอนการติดตั้งและกำหนดค่าการใช้งานระบบ (System Installation and Configuration)  
**ภาคผนวก ค** ตัวอย่างรหัสต้นฉบับของโปรแกรม (Source Code Excerpts)  
**ภาคผนวก ง** คู่มือการใช้งานระบบเบื้องต้น (User Manual)  
**ภาคผนวก จ** รายละเอียดส่วนเชื่อมต่อโปรแกรมประยุกต์ (API Documentation)  
**ภาคผนวก ฉ** เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนาระบบ (Development Tools and Technologies)  
**ภาคผนวก ช** ผลการทดสอบระบบ (System Testing Results)  

---
<div style="page-break-after: always;"></div>

## ภาคผนวก ก รายละเอียดโครงสร้างฐานข้อมูล (Database Design)

ในส่วนนี้แสดงรายละเอียดของพจนานุกรมข้อมูล (Data Dictionary) และชุดคำสั่ง SQL (DDL) ที่ใช้ในระบบบริหารจัดการครุภัณฑ์ ซึ่งได้รับการปรับปรุงเป็นระบบตรวจสอบครุภัณฑ์แบบประจำปีโดยสมบูรณ์ (ไม่มีส่วนของรอบการตรวจสอบแบบราย 3/6 เดือน)

### 1. พจนานุกรมข้อมูล (Data Dictionary)

#### 1.1 แฟ้มข้อมูลผู้ใช้งาน (users)
ใช้สำหรับจัดเก็บรายละเอียดบัญชีผู้ใช้งานและระดับสิทธิ์การทำงานในระบบ
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | user_id | int(11) | รหัสผู้ใช้งาน | Primary Key, Auto Increment |
| 2 | username | varchar(50) | ชื่อบัญชีเข้าใช้งานระบบ | Unique Key |
| 3 | password | varchar(255) | รหัสผ่านที่ผ่านการเข้ารหัส (Hash) | |
| 4 | fullname | varchar(100) | ชื่อ-นามสกุลจริง | |
| 5 | role | enum | บทบาทสิทธิ์การใช้งาน (Admin, Inspector, Viewer) | |
| 6 | status | enum | สถานะบัญชีผู้ใช้ (Active, Inactive) | |
| 7 | email | varchar(100) | อีเมลติดต่อ | |
| 8 | phone | varchar(20) | เบอร์โทรศัพท์ | |
| 9 | created_at | timestamp | วันเวลาที่สร้างบัญชี | |
| 10 | updated_at | timestamp | วันเวลาที่แก้ไขล่าสุด | |

#### 1.2 แฟ้มข้อมูลหน่วยงาน (departments)
ใช้จัดเก็บรายชื่อคณะและหน่วยงานที่ครุภัณฑ์สังกัด
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | department_id | int(11) | รหัสหน่วยงาน | Primary Key, Auto Increment |
| 2 | department_name | varchar(100) | ชื่อหน่วยงาน/แผนก | |
| 3 | faculty | varchar(100) | ชื่อคณะ | |
| 4 | created_at | timestamp | วันเวลาที่สร้างข้อมูล | |

#### 1.3 แฟ้มข้อมูลสถานที่ (locations)
ใช้สำหรับจัดเก็บข้อมูลอาคาร ชั้น และห้องที่ใช้จัดวางครุภัณฑ์
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | location_id | int(11) | รหัสสถานที่ | Primary Key, Auto Increment |
| 2 | building_name | varchar(100) | ชื่ออาคาร | |
| 3 | floor | varchar(10) | ชั้นของอาคาร | |
| 4 | room_number | varchar(50) | เลขห้อง | |
| 5 | description | text | รายละเอียดสถานที่เพิ่มเติม | |
| 6 | created_at | timestamp | วันเวลาที่สร้างข้อมูล | |

#### 1.4 แฟ้มข้อมูลครุภัณฑ์ (assets)
ใช้สำหรับจัดเก็บรายละเอียดพื้นฐานของครุภัณฑ์แต่ละรายการ
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | asset_id | int(11) | รหัสครุภัณฑ์ | Primary Key, Auto Increment |
| 2 | asset_name | varchar(255) | ชื่อครุภัณฑ์ | |
| 3 | serial_number | text | หมายเลขซีเรียล (S/N) | |
| 4 | quantity | int(11) | จำนวนครุภัณฑ์ | |
| 5 | unit | varchar(50) | หน่วยนับ (เช่น เครื่อง, ชุด, อัน) | |
| 6 | price | decimal(15,2) | มูลค่าครุภัณฑ์ (บาท) | |
| 7 | received_date | date | วันที่รับเข้าคลัง | |
| 8 | department_id | int(11) | รหัสหน่วยงานที่สังกัด | Foreign Key |
| 9 | department | varchar(100) | ชื่อหน่วยงาน (เก็บแบบข้อความ) | |
| 10 | faculty_name | varchar(200) | ชื่อคณะ (เก็บแบบข้อความ) | |
| 11 | delivery_number | varchar(100) | เลขที่ใบส่งของ | |
| 12 | fund_code | varchar(50) | รหัสกองทุน | |
| 13 | plan_code | varchar(50) | รหัสแผนงาน | |
| 14 | project_code | varchar(50) | รหัสงาน/โครงการ | |
| 15 | location_id | int(11) | รหัสสถานที่จัดเก็บ | Foreign Key |
| 16 | room_text | varchar(200) | ห้องที่ใช้ประจำ (แบบข้อความ) | |
| 17 | status | varchar(50) | สถานะของครุภัณฑ์ | |
| 18 | barcode | varchar(100) | รหัสบาร์โค้ด/หมายเลขครุภัณฑ์ | |
| 19 | description | text | คุณลักษณะ/คำอธิบายครุภัณฑ์ | |
| 20 | reference_number | varchar(255) | หมวดสินทรัพย์/เลขอ้างอิง | |
| 21 | image | varchar(255) | ชื่อไฟล์รูปภาพของครุภัณฑ์ | |
| 22 | created_at | timestamp | วันเวลาที่สร้างข้อมูล | |
| 23 | updated_at | timestamp | วันเวลาที่แก้ไขล่าสุด | |

#### 1.5 แฟ้มข้อมูลการตรวจสภาพ (asset_check)
ใช้สำหรับจัดเก็บประวัติผลการสแกนตรวจสภาพครุภัณฑ์ประจำปี
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | check_id | int(11) | รหัสบันทึกการตรวจสภาพ | Primary Key, Auto Increment |
| 2 | asset_id | int(11) | รหัสครุภัณฑ์ที่ถูกตรวจ | Foreign Key |
| 3 | user_id | int(11) | รหัสผู้ใช้งานที่เป็นผู้ตรวจ | Foreign Key |
| 4 | check_date | date | วันที่ทำการตรวจสภาพ | |
| 5 | check_status | enum | สถานะที่ตรวจพบ (ใช้งานได้, รอซ่อม, รอจำหน่าย, จำหน่ายแล้ว, ไม่พบ) | |
| 6 | remark | text | หมายเหตุ/ความคิดเห็นเพิ่มเติม | |
| 7 | created_at | timestamp | วันเวลาที่บันทึกข้อมูล | |

#### 1.6 แฟ้มข้อมูลประวัติการเคลื่อนย้าย (asset_history)
ใช้บันทึกประวัติการย้ายสถานที่ติดตั้งของครุภัณฑ์
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | history_id | int(11) | รหัสประวัติการย้ายสถานที่ | Primary Key, Auto Increment |
| 2 | asset_id | int(11) | รหัสครุภัณฑ์ที่ถูกเคลื่อนย้าย | Foreign Key |
| 3 | old_location_id | int(11) | รหัสสถานที่ติดตั้งเดิม | Foreign Key |
| 4 | new_location_id | int(11) | รหัสสถานที่ติดตั้งใหม่ | Foreign Key |
| 5 | moved_by | int(11) | รหัสผู้ดำเนินการเคลื่อนย้าย | Foreign Key |
| 6 | move_date | date | วันที่ทำการเคลื่อนย้าย | |
| 7 | remark | text | หมายเหตุเพิ่มเติม | |
| 8 | created_at | timestamp | วันเวลาที่บันทึกข้อมูล | |

#### 1.7 แฟ้มข้อมูลบันทึกการใช้งานระบบ (audittrail)
ใช้เก็บประวัติการกระทำหรือกิจกรรมที่สำคัญต่างๆ เพื่อความปลอดภัย
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | audit_id | int(11) | รหัส Log กิจกรรม | Primary Key, Auto Increment |
| 2 | user_id | int(11) | รหัสผู้กระทำกิจกรรม | Foreign Key |
| 3 | asset_id | int(11) | รหัสครุภัณฑ์ที่เกี่ยวข้อง | Foreign Key |
| 4 | action | enum | กิจกรรม (Add, Edit, Move, Check, Delete, Borrow, Return) | |
| 5 | old_value | text | ค่าข้อมูลเก่าก่อนแก้ไข | |
| 6 | new_value | text | ค่าข้อมูลใหม่หลังแก้ไข | |
| 7 | action_date | datetime | วันเวลาที่บันทึก Log | |

#### 1.8 แฟ้มข้อมูลการยืม-คืนครุภัณฑ์ (borrow)
ใช้สำหรับจัดเก็บรายการยืมครุภัณฑ์และการส่งคืน
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | borrow_id | int(11) | รหัสการยืม-คืน | Primary Key, Auto Increment |
| 2 | asset_id | int(11) | รหัสครุภัณฑ์ที่ถูกยืม | Foreign Key |
| 3 | borrower_name | varchar(100) | ชื่อ-นามสกุลผู้ยืม | |
| 4 | department_id | int(11) | รหัสหน่วยงานที่มาขอยืม | Foreign Key |
| 5 | borrow_date | date | วันที่ยืม | |
| 6 | due_date | date | กำหนดวันส่งคืน | |
| 7 | return_date | date | วันที่ส่งคืนจริง | |
| 8 | status | enum | สถานะการยืม (ยืม, คืนแล้ว) | |
| 9 | remark | text | หมายเหตุการยืม-คืน | |
| 10 | created_at | timestamp | วันเวลาที่บันทึกข้อมูล | |
| 11 | updated_at | timestamp | วันเวลาที่แก้ไขล่าสุด | |

#### 1.9 แฟ้มข้อมูลประวัติการนำเข้าไฟล์ครุภัณฑ์ (import_history)
ใช้บันทึกรายละเอียดของไฟล์ Excel/CSV ที่ถูกนำเข้ามายังระบบ
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | import_id | int(11) | รหัสบันทึกการนำเข้าไฟล์ | Primary Key, Auto Increment |
| 2 | import_date | datetime | วันเวลาที่ทำการนำเข้าไฟล์ | |
| 3 | filename | varchar(255) | ชื่อไฟล์ที่อัปโหลดนำเข้า | |
| 4 | total_rows | int(11) | จำนวนรายการทั้งหมดในไฟล์ | |
| 5 | success_count | int(11) | จำนวนที่นำเข้าสำเร็จ | |
| 6 | failed_count | int(11) | จำนวนที่ผิดพลาดล้มเหลว | |
| 7 | user_id | int(11) | รหัสผู้ใช้อัปโหลดไฟล์ | Foreign Key |

#### 1.10 แฟ้มข้อมูลประวัติการพยายามเข้าระบบ (login_attempts)
ใช้บันทึกประวัติการป้อนชื่อผู้ใช้เข้าระบบเพื่อตรวจสอบความปลอดภัย
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | id | int(11) | รหัสบันทึกการเข้าใช้ | Primary Key, Auto Increment |
| 2 | username | varchar(100) | ชื่อผู้ใช้งาน | |
| 3 | attempt_time | datetime | วันเวลาที่พยายามเข้าสู่ระบบ | |
| 4 | success | tinyint(1) | สถานะความสำเร็จ (0=ล้มเหลว, 1=สำเร็จ) | |
| 5 | ip_address | varchar(45) | หมายเลข IP เครื่องผู้ใช้ | |

#### 1.11 แฟ้มข้อมูลการตั้งค่าระบบ (system_settings)
ใช้จัดเก็บระยะเวลา "รอบตรวจนับครุภัณฑ์ประจำปี" (Global Annual Check Period)
| ลำดับ | ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย | หมายเหตุ |
|:---:|:---|:---|:---|:---|
| 1 | setting_id | int(11) | รหัสฟิลด์ตั้งค่า | Primary Key, Auto Increment |
| 2 | setting_key | varchar(100) | คีย์ค่ากำหนด (Unique) (เช่น annual_check_start, annual_check_end) | Unique Key |
| 3 | setting_value | text | ค่าที่บันทึกของคีย์นั้นๆ | |
| 4 | description | varchar(255) | คำอธิบายรายละเอียดฟิลด์ | |
| 5 | updated_at | timestamp | วันเวลาที่อัปเดตข้อมูลล่าสุด | |

---

### 2. ชุดคำสั่ง SQL สำหรับการสร้างตารางและ View (DDL)

```sql
-- =============================================================
-- SQL Script DDL: โครงสร้างฐานข้อมูลสำหรับรอบตรวจสอบประจำปี
-- =============================================================

CREATE DATABASE IF NOT EXISTS `asset_management_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `asset_management_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
  `department` varchar(100) DEFAULT NULL COMMENT 'ชื่อหน่วยงาน',
  `faculty_name` varchar(200) DEFAULT NULL COMMENT 'ชื่อคณะ',
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

-- =============================================
-- SQL VIEW
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
    a.department,
    a.faculty_name,
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
```

---

---

## ภาคผนวก ข ขั้นตอนการติดตั้งและกำหนดค่าการใช้งานระบบ (System Installation and Configuration)

### 1. การเตรียมสภาพแวดล้อมและโปรแกรมประยุกต์พื้นฐาน
การทำงานของระบบจำเป็นต้องมีการติดตั้งโปรแกรมพื้นฐาน ดังนี้:
- **XAMPP (v8.2+):** สำหรับ Apache และ MySQL (PHP 8.2)
- **Node.js (v18+):** สำหรับ React และ React Native
- **Expo Go:** สำหรับรันแอปพลิเคชันบนมือถือจริง
- **Git:** สำหรับจัดการซอร์สโค้ด

### 2. ขั้นตอนการจัดเตรียมฐานข้อมูล
1. เปิด **XAMPP Control Panel** และกด **Start** ที่ Apache และ MySQL
2. เข้าไปที่ `http://localhost/phpmyadmin`
3. สร้างฐานข้อมูลใหม่ชื่อ `asset_management_db`
4. นำเข้าไฟล์ SQL จาก `deployment_package/asset_management_db.sql`

### 3. การติดตั้งส่วน Backend (API)
1. นำโฟลเดอร์ `asset_management_api` ไปไว้ใน `C:\xampp\htdocs\asset-management\`
2. ตรวจสอบการเชื่อมต่อใน `config/database.php`

### 4. การติดตั้งส่วน Web Frontend
1. เปิด Terminal และไปที่ `asset-frontend`
2. รันคำสั่ง `npm install`
3. รันคำสั่ง `npm run dev`
4. เข้าใช้งานผ่าน `http://localhost:5173`

### 5. การติดตั้งส่วน Mobile App
1. เปิด Terminal และไปที่ `asset-mobile`
2. รันคำสั่ง `npm install`
3. **กำหนดค่า IP Address:**
   - ตรวจสอบ IP ของคอมพิวเตอร์ด้วย `ipconfig`
   - แก้ไขค่า `YOUR_IP_ADDRESS` ใน `src/utils/constants.js` ให้ตรงกับ IP ของเครื่อง
4. รันคำสั่ง `npx expo start`
5. สแกน QR Code ด้วยแอป **Expo Go** บนมือถือ (ต้องต่อ WiFi วงเดียวกัน)

---

## ภาคผนวก ค ตัวอย่างรหัสต้นฉบับของโปรแกรม (Source Code Excerpts)

### การกำหนดค่าสถานะและสิทธิ์การใช้งาน (constants.js)
รหัสส่วนนี้ใช้กำหนดสถานะมาตรฐานของครุภัณฑ์และบทบาทของผู้ใช้งาน เพื่อให้เกิดความสอดคล้องกันทั้งระบบ

```javascript
// src/utils/constants.js
export const ASSET_STATUS = {
  AVAILABLE: 'ใช้งานได้',
  MAINTENANCE: 'รอซ่อม',
  PENDING_DISPOSAL: 'รอจำหน่าย',
  DISPOSED: 'จำหน่ายแล้ว',
  MISSING: 'ไม่พบ'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  INSPECTOR: 'Inspector',
  VIEWER: 'Viewer'
};
```

### การเชื่อมต่อฐานข้อมูล (PHP PDO)
```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "asset_management_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection(){
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception){
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
```

---

## ภาคผนวก ง คู่มือการใช้งานระบบเบื้องต้น (User Manual)

### 1. ระบบจัดการผ่านเว็บ (Web)
- **Dashboard:** ดูภาพรวมครุภัณฑ์ สถิติการตรวจนับ และสถานะต่างๆ
- **Inventory:** จัดการข้อมูลครุภัณฑ์ (เพิ่ม/แก้ไข/ลบ) และออกรายงาน Excel
- **Audit:** ดูประวัติกิจกรรมที่เกิดขึ้นในระบบ
- **Settings:** ตั้งค่าหน่วยงาน สถานที่ และรอบการตรวจนับ

### 2. แอปพลิเคชันบนมือถือ (Mobile)
- **Scan:** สแกนบาร์โค้ดเพื่อตรวจนับครุภัณฑ์
- **Search:** ค้นหาครุภัณฑ์ตามชื่อหรือหมายเลข
- **Check-in:** ยืนยันสถานะการตรวจนับ พร้อมระบุหมายเหตุ

---

## ภาคผนวก จ รายละเอียดส่วนเชื่อมต่อโปรแกรมประยุกต์ (API Documentation)

| Endpoint | Method | Description |
|:---|:---:|:---|
| `/auth/login` | POST | ตรวจสอบสิทธิ์การเข้าใช้งาน |
| `/assets` | GET | ดึงรายการครุภัณฑ์ทั้งหมด |
| `/assets/{id}` | GET/PUT | ดูรายละเอียดหรือแก้ไขข้อมูลครุภัณฑ์ |
| `/checks` | POST | บันทึกผลการตรวจนับ |
| `/reports/summary` | GET | ดึงข้อมูลสรุปสำหรับ Dashboard |

---

## ภาคผนวก ฉ เครื่องมือและเทคโนโลยีที่ใช้ในการพัฒนาระบบ

- **Backend:** PHP 8.2, MySQL (MariaDB)
- **Web Frontend:** React 19, Vite, Tailwind CSS
- **Mobile App:** React Native, Expo Framework
- **Tools:** Visual Studio Code, Postman, XAMPP

---

## ภาคผนวก ช ผลการทดสอบระบบ (System Testing Results)

| หัวข้อการทดสอบ | วิธีการทดสอบ | ผลลัพธ์ | สถานะ |
|:---|:---|:---|:---:|
| การเข้าสู่ระบบ | ใส่ Username/Password | เข้าสู่ระบบได้ถูกต้องตามสิทธิ์ | ผ่าน |
| การเพิ่มครุภัณฑ์ | กรอกฟอร์มและบันทึก | ข้อมูลปรากฏในตารางและฐานข้อมูล | ผ่าน |
| การสแกนบาร์โค้ด | ใช้กล้องมือถือสแกน | แสดงข้อมูลครุภัณฑ์ที่ตรงกัน | ผ่าน |
| การออกรายงาน | กดปุ่ม Export Excel | ได้ไฟล์ Excel ที่มีข้อมูลถูกต้อง | ผ่าน |

---

---

