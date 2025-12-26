-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 24, 2025 at 02:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `asset_management_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `asset_id` int(11) NOT NULL,
  `asset_name` varchar(200) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit` varchar(50) DEFAULT NULL COMMENT 'เครื่อง, ชุด',
  `price` decimal(15,2) DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `status` enum('ใช้งานได้','รอซ่อม','รอจำหน่าย','จำหน่ายแล้ว','ไม่พบ','ยืม') DEFAULT 'ใช้งานได้',
  `barcode` varchar(100) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`asset_id`, `asset_name`, `serial_number`, `quantity`, `unit`, `price`, `received_date`, `department_id`, `location_id`, `status`, `barcode`, `image`, `created_at`, `updated_at`) VALUES
(1, 'เครื่องพิมพ์ Acer', 'CN123456644', 1, 'เครื่อง', 0.00, '2024-01-15', 2, 5, 'ใช้งานได้', 'QR001234567', '', '2025-12-11 01:32:09', '2025-12-12 09:40:10'),
(2, 'เครื่องพิมพ์ HP LaserJet Pro', 'SN987654321', 1, 'เครื่อง', 15000.00, '2024-02-20', 1, 3, 'ใช้งานได้', 'QR987654321', NULL, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(3, 'โปรเจคเตอร์ Epson EB-X41', 'SN555666777', 1, 'เครื่อง', 18000.00, '2023-12-10', 1, 1, 'ใช้งานได้', 'QR555666777', NULL, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(4, 'เครื่องพิมพ์ Canon', 'CN123456', 2, 'เครื่อง', 8500.00, '2024-03-01', 2, 2, 'ใช้งานได้', 'QR1759655969601', NULL, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(5, 'Laptop Dell XPS 15', 'LT001122', 1, 'เครื่อง', 45000.00, '2024-04-15', 1, 4, 'ใช้งานได้', 'QR175965596960198', NULL, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(6, 'เครื่องพิมพ์ Acer', 'CN12345662', 1, 'เครื่อง', 22.00, '2025-12-12', 2, 4, 'ใช้งานได้', 'QR1763370269178', '', '2025-12-12 09:53:15', '2025-12-12 09:53:15'),
(7, 'คอมพิวเตอร์ Dell Optiplex 70800', 'SN12345678900', 1, 'เครื่อง', 25000.00, '0000-00-00', 1, 1, 'ใช้งานได้', 'QR001', '', '2025-12-24 12:19:26', '2025-12-24 12:19:26'),
(8, 'เครื่องพิมพ์ HP LaserJet0', 'SN98765432100', 1, 'เครื่อง', 15000.00, '0000-00-00', 1, 2, 'ใช้งานได้', 'QR002', '', '2025-12-24 12:19:26', '2025-12-24 12:19:26');

-- --------------------------------------------------------

--
-- Table structure for table `asset_check`
--

CREATE TABLE `asset_check` (
  `check_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `check_date` date NOT NULL,
  `check_status` enum('ใช้งานได้','รอซ่อม','รอจำหน่าย','จำหน่ายแล้ว','ไม่พบ') DEFAULT 'ใช้งานได้',
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_check`
--

INSERT INTO `asset_check` (`check_id`, `asset_id`, `user_id`, `check_date`, `check_status`, `remark`, `created_at`) VALUES
(1, 3, 1, '2025-12-11', 'ใช้งานได้', 'ตรวจสอบผ่าน QR Scanner', '2025-12-11 14:10:47'),
(2, 1, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:37:18'),
(3, 2, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:48:37'),
(4, 5, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:48:41'),
(5, 6, 1, '2025-12-12', 'รอจำหน่าย', '', '2025-12-12 09:54:19'),
(6, 4, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:54:38'),
(7, 4, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 10:40:12'),
(8, 1, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 10:41:12'),
(9, 6, 1, '2025-12-24', '', '', '2025-12-24 08:58:47'),
(10, 5, 1, '2025-12-24', '', '', '2025-12-24 08:58:47'),
(11, 7, 1, '2025-12-24', 'ใช้งานได้', '', '2025-12-24 12:20:21'),
(12, 8, 1, '2025-12-24', '', '', '2025-12-24 12:22:16'),
(13, 4, 1, '2025-12-24', '', '', '2025-12-24 12:22:16');

--
-- Triggers `asset_check`
--
DELIMITER $$
CREATE TRIGGER `trg_update_next_check_date` AFTER INSERT ON `asset_check` FOR EACH ROW BEGIN
    DECLARE v_schedule_id INT;
    DECLARE v_interval_months INT;
    DECLARE v_custom_interval INT;
    
    -- ดึงข้อมูลรอบการตรวจ
    SELECT 
        sch.schedule_id,
        cs.check_interval_months,
        sch.custom_interval_months
    INTO 
        v_schedule_id,
        v_interval_months,
        v_custom_interval
    FROM asset_schedules sch
    LEFT JOIN check_schedules cs ON sch.schedule_id = cs.schedule_id
    WHERE sch.asset_id = NEW.asset_id
    LIMIT 1;
    
    -- ถ้ามีรอบการตรวจ ให้อัปเดต next_check_date
    IF v_schedule_id IS NOT NULL THEN
        IF v_custom_interval IS NOT NULL AND v_custom_interval > 0 THEN
            -- ใช้ช่วงเวลาที่กำหนดเอง
            UPDATE asset_schedules
            SET next_check_date = DATE_ADD(NEW.check_date, INTERVAL v_custom_interval MONTH),
                is_notified = 0,
                is_dismissed = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE asset_id = NEW.asset_id;
        ELSEIF v_interval_months IS NOT NULL AND v_interval_months > 0 THEN
            -- ใช้ช่วงเวลามาตรฐาน
            UPDATE asset_schedules
            SET next_check_date = DATE_ADD(NEW.check_date, INTERVAL v_interval_months MONTH),
                is_notified = 0,
                is_dismissed = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE asset_id = NEW.asset_id;
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `asset_history`
--

CREATE TABLE `asset_history` (
  `history_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `old_location_id` int(11) DEFAULT NULL,
  `new_location_id` int(11) DEFAULT NULL,
  `moved_by` int(11) NOT NULL,
  `move_date` date NOT NULL,
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_history`
--

INSERT INTO `asset_history` (`history_id`, `asset_id`, `old_location_id`, `new_location_id`, `moved_by`, `move_date`, `remark`, `created_at`) VALUES
(1, 1, 1, 5, 1, '2025-12-11', '', '2025-12-11 14:30:02');

-- --------------------------------------------------------

--
-- Table structure for table `asset_schedules`
--

CREATE TABLE `asset_schedules` (
  `asset_schedule_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL COMMENT 'รหัสครุภัณฑ์',
  `schedule_id` int(11) DEFAULT NULL COMMENT 'รอบการตรวจ (ถ้าเป็น NULL = กำหนดเอง)',
  `next_check_date` date DEFAULT NULL COMMENT 'วันที่ตรวจครั้งถัดไป',
  `custom_interval_months` int(11) DEFAULT NULL COMMENT 'ช่วงเวลาการตรวจแบบกำหนดเอง (เดือน)',
  `is_notified` tinyint(1) DEFAULT 0 COMMENT '0=ยังไม่แจ้งเตือน, 1=แจ้งเตือนแล้ว',
  `is_dismissed` tinyint(1) DEFAULT 0 COMMENT '0=ยังไม่ซ่อน, 1=ซ่อนแล้ว',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `asset_schedules`
--

INSERT INTO `asset_schedules` (`asset_schedule_id`, `asset_id`, `schedule_id`, `next_check_date`, `custom_interval_months`, `is_notified`, `is_dismissed`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '2026-03-12', 0, 0, 0, '2025-12-11 14:31:06', '2025-12-12 09:48:37'),
(2, 1, 1, '2026-03-12', NULL, 0, 0, '2025-12-11 14:33:48', '2025-12-12 10:41:12'),
(4, 3, 3, '2026-12-12', NULL, 0, 0, '2025-12-12 09:46:55', '2025-12-12 09:46:55'),
(7, 6, 3, '2026-12-24', NULL, 0, 0, '2025-12-12 09:56:53', '2025-12-24 08:58:47'),
(8, 5, 3, '2026-12-24', NULL, 0, 0, '2025-12-12 09:57:13', '2025-12-24 08:58:47'),
(9, 4, 3, '2026-12-24', NULL, 0, 0, '2025-12-12 09:57:17', '2025-12-24 12:22:16');

-- --------------------------------------------------------

--
-- Table structure for table `audittrail`
--

CREATE TABLE `audittrail` (
  `audit_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `action` enum('Add','Edit','Move','Check','Delete','Borrow','Return') DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `action_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audittrail`
--

INSERT INTO `audittrail` (`audit_id`, `user_id`, `asset_id`, `action`, `old_value`, `new_value`, `action_date`) VALUES
(1, 1, 3, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 QR Scanner\"}', '2025-12-11 21:10:47'),
(2, 1, 1, 'Move', '{\"location_id\":1}', '{\"location_id\":\"5\"}', '2025-12-11 21:30:02'),
(3, 1, 1, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:37:18'),
(4, 1, 2, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:48:37'),
(5, 1, 5, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:48:41'),
(6, 1, 6, 'Check', NULL, '{\"check_status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\",\"remark\":\"\"}', '2025-12-12 16:54:19'),
(7, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:54:38'),
(8, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 17:40:12'),
(9, 1, 1, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 17:41:12'),
(10, 1, 6, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 15:58:47'),
(11, 1, 5, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 15:58:47'),
(12, 1, 7, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-24 19:20:21'),
(13, 1, 8, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 19:22:16'),
(14, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 19:22:16');

-- --------------------------------------------------------

--
-- Table structure for table `borrow`
--

CREATE TABLE `borrow` (
  `borrow_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `borrower_name` varchar(100) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `borrow_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` enum('ยืม','คืนแล้ว') DEFAULT 'ยืม',
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `check_schedules`
--

CREATE TABLE `check_schedules` (
  `schedule_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'ชื่อรอบการตรวจ เช่น ตรวจรอบ 3 เดือน',
  `check_interval_months` int(11) NOT NULL COMMENT 'ช่วงเวลาการตรวจ (เดือน)',
  `notify_before_days` int(11) DEFAULT 14 COMMENT 'แจ้งเตือนล่วงหน้ากี่วัน',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '0=ปิดใช้งาน, 1=เปิดใช้งาน',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `check_schedules`
--

INSERT INTO `check_schedules` (`schedule_id`, `name`, `check_interval_months`, `notify_before_days`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ตรวจสอบทุก 3 เดือน', 3, 14, 1, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(2, 'ตรวจสอบทุก 6 เดือน', 6, 30, 1, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(3, 'ตรวจสอบทุก 12 เดือน (ประจำปี)', 12, 60, 1, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(4, 'ตรวจสอบทุกเดือน', 1, 7, 1, '2025-12-11 01:32:09', '2025-12-11 01:32:09'),
(5, 'กำหนดเอง', 0, 14, 1, '2025-12-11 01:32:09', '2025-12-11 01:32:09');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`, `faculty`, `created_at`) VALUES
(1, 'ภาควิชาเทคโนโลยีสารสนเทศ', 'คณะเทคโนโลยีและการจัดการอุตสาหกรรม', '2025-12-11 01:32:09'),
(2, 'ภาควิชาวิศวกรรมคอมพิวเตอร์', 'คณะวิศวกรรมศาสตร์', '2025-12-11 01:32:09');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL,
  `building_name` varchar(100) NOT NULL,
  `floor` varchar(10) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`location_id`, `building_name`, `floor`, `room_number`, `description`, `created_at`) VALUES
(1, 'อาคาร IT', '3', '301', 'ห้องปฏิบัติการคอมพิวเตอร์ 1', '2025-12-11 01:32:09'),
(2, 'อาคาร IT', '3', '302', 'ห้องปฏิบัติการคอมพิวเตอร์ 2', '2025-12-11 01:32:09'),
(3, 'อาคาร IT', '4', '401', 'ห้องสำนักงานอาจารย์', '2025-12-11 01:32:09'),
(4, 'อาคาร A', '2', '101', 'ห้องเรียน', '2025-12-11 01:32:09'),
(5, 'อาคาร B', '1', '01', 'ห้องประชุม', '2025-12-11 01:32:09');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `role` enum('Admin','Inspector') NOT NULL DEFAULT 'Inspector',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `fullname`, `role`, `status`, `email`, `phone`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$N0JrzkusWVbdnoYYdto./eogUCMbN5KKO.fkYVSabMGkCgEeJk9NW', 'ผู้ดูแลระบบ', 'Admin', 'Active', 'admin@example.com', '0812345678', '2025-12-11 01:32:09', '2025-12-24 13:13:30'),
(2, 'officer1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'เจ้าหน้าที่ 01', 'Inspector', 'Active', 'officer1@example.com', '0823456789', '2025-12-11 01:32:09', '2025-12-24 13:13:40'),
(3, 'officer2', '$2y$10$XSFqwwTx0HX4425UZ6ZH3O63wi5DFP5a3Q6g/OtZTmtKepuW8quPm', 'เจ้าหน้าที่ 2', 'Inspector', 'Active', 'officer2@example.com', '0834567890', '2025-12-11 01:32:09', '2025-12-24 13:14:00');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_assets_with_check_info`
-- (See below for the actual view)
--
CREATE TABLE `v_assets_with_check_info` (
`asset_id` int(11)
,`asset_name` varchar(200)
,`serial_number` varchar(100)
,`quantity` int(11)
,`unit` varchar(50)
,`price` decimal(15,2)
,`received_date` date
,`department_id` int(11)
,`location_id` int(11)
,`status` enum('ใช้งานได้','รอซ่อม','รอจำหน่าย','จำหน่ายแล้ว','ไม่พบ','ยืม')
,`barcode` varchar(100)
,`image` varchar(255)
,`created_at` timestamp
,`updated_at` timestamp
,`department_name` varchar(100)
,`building_name` varchar(100)
,`floor` varchar(10)
,`room_number` varchar(50)
,`last_check_date` date
,`last_checker` varchar(100)
,`last_check_status` varchar(11)
,`next_check_date` date
,`schedule_id` int(11)
,`schedule_name` varchar(100)
,`check_interval_months` int(11)
,`check_urgency` varchar(11)
,`days_until_check` int(7)
);

-- --------------------------------------------------------

--
-- Structure for view `v_assets_with_check_info`
--
DROP TABLE IF EXISTS `v_assets_with_check_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_assets_with_check_info`  AS SELECT `a`.`asset_id` AS `asset_id`, `a`.`asset_name` AS `asset_name`, `a`.`serial_number` AS `serial_number`, `a`.`quantity` AS `quantity`, `a`.`unit` AS `unit`, `a`.`price` AS `price`, `a`.`received_date` AS `received_date`, `a`.`department_id` AS `department_id`, `a`.`location_id` AS `location_id`, `a`.`status` AS `status`, `a`.`barcode` AS `barcode`, `a`.`image` AS `image`, `a`.`created_at` AS `created_at`, `a`.`updated_at` AS `updated_at`, `d`.`department_name` AS `department_name`, `l`.`building_name` AS `building_name`, `l`.`floor` AS `floor`, `l`.`room_number` AS `room_number`, (select `ac`.`check_date` from `asset_check` `ac` where `ac`.`asset_id` = `a`.`asset_id` order by `ac`.`check_date` desc limit 1) AS `last_check_date`, (select `u`.`fullname` from (`asset_check` `ac` left join `users` `u` on(`ac`.`user_id` = `u`.`user_id`)) where `ac`.`asset_id` = `a`.`asset_id` order by `ac`.`check_date` desc limit 1) AS `last_checker`, (select `ac`.`check_status` from `asset_check` `ac` where `ac`.`asset_id` = `a`.`asset_id` order by `ac`.`check_date` desc limit 1) AS `last_check_status`, `sch`.`next_check_date` AS `next_check_date`, `sch`.`schedule_id` AS `schedule_id`, `cs`.`name` AS `schedule_name`, `cs`.`check_interval_months` AS `check_interval_months`, CASE WHEN `sch`.`next_check_date` is null THEN 'no_schedule' WHEN to_days(`sch`.`next_check_date`) - to_days(curdate()) < 0 THEN 'overdue' WHEN to_days(`sch`.`next_check_date`) - to_days(curdate()) = 0 THEN 'today' WHEN to_days(`sch`.`next_check_date`) - to_days(curdate()) <= 7 THEN 'urgent' ELSE 'normal' END AS `check_urgency`, to_days(`sch`.`next_check_date`) - to_days(curdate()) AS `days_until_check` FROM ((((`assets` `a` left join `departments` `d` on(`a`.`department_id` = `d`.`department_id`)) left join `locations` `l` on(`a`.`location_id` = `l`.`location_id`)) left join `asset_schedules` `sch` on(`a`.`asset_id` = `sch`.`asset_id`)) left join `check_schedules` `cs` on(`sch`.`schedule_id` = `cs`.`schedule_id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`asset_id`),
  ADD UNIQUE KEY `serial_number` (`serial_number`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `idx_serial` (`serial_number`),
  ADD KEY `idx_barcode` (`barcode`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_department` (`department_id`),
  ADD KEY `idx_location` (`location_id`);

--
-- Indexes for table `asset_check`
--
ALTER TABLE `asset_check`
  ADD PRIMARY KEY (`check_id`),
  ADD KEY `idx_asset_check` (`asset_id`,`check_date`),
  ADD KEY `idx_check_date` (`check_date`),
  ADD KEY `fk_check_user` (`user_id`);

--
-- Indexes for table `asset_history`
--
ALTER TABLE `asset_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `idx_asset_history` (`asset_id`,`move_date`),
  ADD KEY `fk_history_old_location` (`old_location_id`),
  ADD KEY `fk_history_new_location` (`new_location_id`),
  ADD KEY `fk_history_user` (`moved_by`);

--
-- Indexes for table `asset_schedules`
--
ALTER TABLE `asset_schedules`
  ADD PRIMARY KEY (`asset_schedule_id`),
  ADD UNIQUE KEY `uk_asset_schedule` (`asset_id`),
  ADD KEY `idx_next_check` (`next_check_date`),
  ADD KEY `idx_notified` (`is_notified`,`next_check_date`),
  ADD KEY `fk_asset_schedule_schedule` (`schedule_id`);

--
-- Indexes for table `audittrail`
--
ALTER TABLE `audittrail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_audit_date` (`action_date`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_asset` (`asset_id`);

--
-- Indexes for table `borrow`
--
ALTER TABLE `borrow`
  ADD PRIMARY KEY (`borrow_id`),
  ADD KEY `idx_borrow_status` (`status`),
  ADD KEY `idx_borrow_date` (`borrow_date`),
  ADD KEY `fk_borrow_asset` (`asset_id`),
  ADD KEY `fk_borrow_department` (`department_id`);

--
-- Indexes for table `check_schedules`
--
ALTER TABLE `check_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD KEY `idx_department_name` (`department_name`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`location_id`),
  ADD KEY `idx_building` (`building_name`),
  ADD KEY `idx_room` (`room_number`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `asset_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `asset_check`
--
ALTER TABLE `asset_check`
  MODIFY `check_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `asset_history`
--
ALTER TABLE `asset_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `asset_schedules`
--
ALTER TABLE `asset_schedules`
  MODIFY `asset_schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `audittrail`
--
ALTER TABLE `audittrail`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `borrow`
--
ALTER TABLE `borrow`
  MODIFY `borrow_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `check_schedules`
--
ALTER TABLE `check_schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `fk_asset_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_asset_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL;

--
-- Constraints for table `asset_check`
--
ALTER TABLE `asset_check`
  ADD CONSTRAINT `fk_check_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_check_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `asset_history`
--
ALTER TABLE `asset_history`
  ADD CONSTRAINT `fk_history_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_history_new_location` FOREIGN KEY (`new_location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_history_old_location` FOREIGN KEY (`old_location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_history_user` FOREIGN KEY (`moved_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `asset_schedules`
--
ALTER TABLE `asset_schedules`
  ADD CONSTRAINT `fk_asset_schedule_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_asset_schedule_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `check_schedules` (`schedule_id`) ON DELETE SET NULL;

--
-- Constraints for table `audittrail`
--
ALTER TABLE `audittrail`
  ADD CONSTRAINT `fk_audit_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `borrow`
--
ALTER TABLE `borrow`
  ADD CONSTRAINT `fk_borrow_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_borrow_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
