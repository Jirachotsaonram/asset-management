-- ============================================
-- ไฟล์อัปเดตฐานข้อมูลสำหรับระบบจัดการครุภัณฑ์
-- Update Database Script for Asset Management System
-- ============================================

USE asset_management_db;

-- ============================================
-- 1. อัปเดตตาราง Users เพื่อเพิ่ม role 'Viewer'
-- ============================================
ALTER TABLE `users` 
MODIFY COLUMN `role` ENUM('Admin','Inspector','Viewer') NOT NULL DEFAULT 'Inspector';

-- ============================================
-- 2. เพิ่มข้อมูลผู้ใช้ตัวอย่าง role Viewer (ถ้ายังไม่มี)
-- ============================================
INSERT INTO `users` (`username`, `password`, `fullname`, `role`, `status`, `email`, `phone`) 
SELECT 'viewer1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ใช้งานทั่วไป 1', 'Viewer', 'Active', 'viewer1@example.com', '0834567890'
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username` = 'viewer1');

-- ============================================
-- 3. ตรวจสอบว่าตาราง check_schedules มี notify_before_days หรือไม่
-- ============================================
-- ถ้ายังไม่มี ให้เพิ่มฟิลด์ notify_before_days
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'asset_management_db' 
    AND TABLE_NAME = 'check_schedules' 
    AND COLUMN_NAME = 'notify_before_days');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `check_schedules` ADD COLUMN `notify_before_days` INT(11) DEFAULT 14 COMMENT ''แจ้งเตือนล่วงหน้ากี่วัน'' AFTER `check_interval_months`',
    'SELECT ''Column notify_before_days already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. ตรวจสอบว่าตาราง assets มี status 'ยืม' หรือไม่
-- ============================================
-- ถ้ายังไม่มี ให้เพิ่ม status 'ยืม' ใน enum
ALTER TABLE `assets` 
MODIFY COLUMN `status` ENUM('ใช้งานได้','รอซ่อม','รอจำหน่าย','จำหน่ายแล้ว','ไม่พบ','ยืม') DEFAULT 'ใช้งานได้';

-- ============================================
-- 5. ตรวจสอบว่าตาราง audittrail มี action 'Borrow' และ 'Return' หรือไม่
-- ============================================
ALTER TABLE `audittrail` 
MODIFY COLUMN `action` ENUM('Add','Edit','Move','Check','Delete','Borrow','Return') DEFAULT NULL;

-- ============================================
-- 6. ตรวจสอบว่าตาราง borrow มี remark หรือไม่
-- ============================================
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'asset_management_db' 
    AND TABLE_NAME = 'borrow' 
    AND COLUMN_NAME = 'remark');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `borrow` ADD COLUMN `remark` TEXT DEFAULT NULL AFTER `status`',
    'SELECT ''Column remark already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. ตรวจสอบว่าตาราง locations มี floor หรือไม่
-- ============================================
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'asset_management_db' 
    AND TABLE_NAME = 'locations' 
    AND COLUMN_NAME = 'floor');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `locations` ADD COLUMN `floor` VARCHAR(10) DEFAULT NULL AFTER `building_name`',
    'SELECT ''Column floor already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 8. สร้าง View v_assets_with_check_info (ถ้ายังไม่มี)
-- ============================================
DROP VIEW IF EXISTS `v_assets_with_check_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER 
VIEW `v_assets_with_check_info` AS 
SELECT 
    a.`asset_id`,
    a.`asset_name`,
    a.`serial_number`,
    a.`quantity`,
    a.`unit`,
    a.`price`,
    a.`received_date`,
    a.`department_id`,
    a.`location_id`,
    a.`status`,
    a.`barcode`,
    a.`image`,
    a.`created_at`,
    a.`updated_at`,
    d.`department_name`,
    l.`building_name`,
    l.`floor`,
    l.`room_number`,
    (SELECT ac.`check_date` 
     FROM `asset_check` ac 
     WHERE ac.`asset_id` = a.`asset_id` 
     ORDER BY ac.`check_date` DESC 
     LIMIT 1) AS `last_check_date`,
    (SELECT u.`fullname` 
     FROM `asset_check` ac 
     LEFT JOIN `users` u ON ac.`user_id` = u.`user_id` 
     WHERE ac.`asset_id` = a.`asset_id` 
     ORDER BY ac.`check_date` DESC 
     LIMIT 1) AS `last_checker`,
    (SELECT ac.`check_status` 
     FROM `asset_check` ac 
     WHERE ac.`asset_id` = a.`asset_id` 
     ORDER BY ac.`check_date` DESC 
     LIMIT 1) AS `last_check_status`,
    sch.`next_check_date`,
    sch.`schedule_id`,
    cs.`name` AS `schedule_name`,
    cs.`check_interval_months`,
    CASE 
        WHEN sch.`next_check_date` IS NULL THEN 'no_schedule'
        WHEN TO_DAYS(sch.`next_check_date`) - TO_DAYS(CURDATE()) < 0 THEN 'overdue'
        WHEN TO_DAYS(sch.`next_check_date`) - TO_DAYS(CURDATE()) = 0 THEN 'today'
        WHEN TO_DAYS(sch.`next_check_date`) - TO_DAYS(CURDATE()) <= 7 THEN 'urgent'
        ELSE 'normal'
    END AS `check_urgency`,
    TO_DAYS(sch.`next_check_date`) - TO_DAYS(CURDATE()) AS `days_until_check`
FROM `assets` a
LEFT JOIN `departments` d ON a.`department_id` = d.`department_id`
LEFT JOIN `locations` l ON a.`location_id` = l.`location_id`
LEFT JOIN `asset_schedules` sch ON a.`asset_id` = sch.`asset_id`
LEFT JOIN `check_schedules` cs ON sch.`schedule_id` = cs.`schedule_id`;

-- ============================================
-- เสร็จสิ้นการอัปเดต
-- ============================================
SELECT 'Database update completed successfully!' AS message;

