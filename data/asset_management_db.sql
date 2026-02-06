-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 06, 2026 at 02:14 PM
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
  `department` varchar(200) DEFAULT NULL COMMENT 'หน่วยงาน (text field)',
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

INSERT INTO `assets` (`asset_id`, `asset_name`, `serial_number`, `quantity`, `unit`, `price`, `received_date`, `department_id`, `department`, `location_id`, `status`, `barcode`, `image`, `created_at`, `updated_at`) VALUES
(2, 'เครื่องพิมพ์ HP LaserJet Pro', 'SN987654321', 1, 'เครื่อง', 15000.00, '2024-02-20', 1, NULL, 1, 'ใช้งานได้', 'QR987654321', '', '2025-12-11 01:32:09', '2025-12-27 14:08:48'),
(3, 'โปรเจคเตอร์ Epson EB-X41', 'SN555666777', 1, 'เครื่อง', 18000.00, '2023-12-10', 1, NULL, 1, 'ใช้งานได้', 'QR555666777', '', '2025-12-11 01:32:09', '2025-12-27 14:08:49'),
(4, 'เครื่องพิมพ์ Canon', 'CN123456', 2, 'เครื่อง', 8500.00, '2024-03-01', 2, NULL, 2, 'ใช้งานได้', 'QR1759655969601', '', '2025-12-11 01:32:09', '2025-12-27 14:08:50'),
(5, 'Laptop Dell XPS 15', 'LT001122', 1, 'เครื่อง', 45000.00, '2024-04-15', 1, NULL, 4, 'รอซ่อม', 'QR175965596960198', '', '2025-12-11 01:32:09', '2025-12-27 14:34:48'),
(13, 'เครื่องพิมพ์ Canon', 'CN1234566', 1, 'เครื่อง', 45444.00, '2025-12-26', 2, NULL, 4, 'รอซ่อม', 'QR17633702691785444', '', '2025-12-26 11:50:54', '2025-12-27 14:34:48'),
(14, 'เครื่องพิมพ์ Acer', 'CN123456644', 1, 'เครื่อง', 444.00, '2025-12-26', NULL, 'ภาควิชาวิศวกรรมคอมพิวเตอร์', 4, 'จำหน่ายแล้ว', 'QR176337026917844', '', '2025-12-26 13:02:27', '2026-01-29 04:38:51'),
(15, 'เครื่องพิมพ์ Acer11', '111111', 1, 'เครื่อง', 11111.00, '2026-01-29', 3, NULL, 4, 'ใช้งานได้', '1111111', '', '2026-01-29 04:33:24', '2026-01-29 04:33:24');

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
(3, 2, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:48:37'),
(4, 5, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:48:41'),
(6, 4, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 09:54:38'),
(7, 4, 1, '2025-12-12', 'ใช้งานได้', '', '2025-12-12 10:40:12'),
(10, 5, 1, '2025-12-24', '', '', '2025-12-24 08:58:47'),
(13, 4, 1, '2025-12-24', '', '', '2025-12-24 12:22:16'),
(16, 2, 1, '2025-12-26', 'ใช้งานได้', '', '2025-12-26 10:54:06'),
(17, 3, 1, '2025-12-26', 'ใช้งานได้', '', '2025-12-26 10:54:07'),
(18, 4, 1, '2025-12-26', '', '', '2025-12-26 10:54:43'),
(19, 2, 1, '2025-12-26', '', '', '2025-12-26 10:55:13'),
(20, 3, 1, '2025-12-26', '', '', '2025-12-26 10:55:13'),
(21, 13, 1, '2025-12-26', 'รอซ่อม', '', '2025-12-26 11:56:28'),
(22, 5, 1, '2025-12-26', 'รอซ่อม', '', '2025-12-26 11:56:28'),
(23, 14, 1, '2025-12-26', 'ใช้งานได้', 'ตรวจสอบผ่าน QR Scanner', '2025-12-26 13:33:37'),
(24, 14, 1, '2025-12-26', 'รอซ่อม', 'ตรวจสอบผ่าน Mobile App', '2025-12-26 16:13:37'),
(25, 13, 1, '2025-12-26', 'ใช้งานได้', 'ตรวจสอบผ่าน Mobile App', '2025-12-26 16:14:14'),
(26, 13, 1, '2025-12-26', 'รอจำหน่าย', 'Out', '2025-12-26 16:16:09'),
(27, 13, 1, '2025-12-26', 'ไม่พบ', 'ตรวจสอบผ่าน Mobile App', '2025-12-26 16:16:36'),
(28, 13, 1, '2025-12-26', 'ใช้งานได้', 'ตรวจสอบผ่าน Mobile App', '2025-12-26 16:17:06'),
(29, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 13:55:52'),
(30, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 13:55:52'),
(31, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 13:55:52'),
(32, 14, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 13:56:19'),
(33, 13, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 13:56:19'),
(34, 5, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 13:56:19'),
(35, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 13:58:51'),
(36, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 13:58:51'),
(37, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 13:58:51'),
(41, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:02:16'),
(42, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:02:16'),
(43, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:02:16'),
(44, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:02:55'),
(45, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:02:55'),
(46, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:02:55'),
(47, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:03:01'),
(48, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:03:01'),
(49, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:03:01'),
(50, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:05:21'),
(51, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:05:21'),
(52, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:05:21'),
(53, 14, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 14:08:08'),
(54, 13, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 14:08:08'),
(55, 5, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 14:08:08'),
(56, 2, 1, '2025-12-27', 'ไม่พบ', '', '2025-12-27 14:08:21'),
(57, 3, 1, '2025-12-27', 'ไม่พบ', '', '2025-12-27 14:08:22'),
(58, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:08:44'),
(59, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:08:44'),
(60, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:08:44'),
(61, 2, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:08:48'),
(62, 3, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:08:49'),
(63, 4, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:08:50'),
(64, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:24:54'),
(65, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:24:54'),
(66, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:24:54'),
(67, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:25:01'),
(68, 14, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:30:07'),
(69, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:30:07'),
(70, 5, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:30:07'),
(71, 13, 1, '2025-12-27', 'ใช้งานได้', '', '2025-12-27 14:30:16'),
(72, 14, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 14:34:48'),
(73, 13, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 14:34:48'),
(74, 5, 1, '2025-12-27', 'รอซ่อม', '', '2025-12-27 14:34:48'),
(75, 14, 1, '2026-01-27', 'ใช้งานได้', 'ตรวจสอบผ่าน Mobile App', '2026-01-27 03:54:57'),
(76, 14, 1, '2026-01-29', 'จำหน่ายแล้ว', '', '2026-01-29 04:38:51');

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
(4, 2, 3, 1, 1, '2025-12-26', 'แก้ไขสถานที่ผ่านหน้าจัดการครุภัณฑ์', '2025-12-26 10:43:29');

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
(1, 2, 1, '2026-03-27', 0, 0, 0, '2025-12-11 14:31:06', '2025-12-27 14:08:48'),
(4, 3, 3, '2026-12-27', NULL, 0, 0, '2025-12-12 09:46:55', '2025-12-27 14:08:49'),
(8, 5, 3, '2026-12-27', NULL, 0, 0, '2025-12-12 09:57:13', '2025-12-27 14:37:09'),
(9, 4, 3, '2026-12-27', NULL, 0, 0, '2025-12-12 09:57:17', '2025-12-27 14:08:50'),
(26, 13, 3, '2026-12-27', NULL, 0, 0, '2025-12-26 11:57:11', '2025-12-27 14:37:09'),
(33, 14, 3, '2027-01-29', NULL, 0, 0, '2025-12-27 14:35:36', '2026-01-29 04:38:51'),
(37, 15, 3, '2027-01-29', NULL, 0, 0, '2026-01-29 04:35:03', '2026-01-29 04:35:03');

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
(2, 1, NULL, 'Move', '{\"location_id\":1}', '{\"location_id\":\"5\"}', '2025-12-11 21:30:02'),
(3, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:37:18'),
(4, 1, 2, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:48:37'),
(5, 1, 5, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:48:41'),
(6, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\",\"remark\":\"\"}', '2025-12-12 16:54:19'),
(7, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 16:54:38'),
(8, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 17:40:12'),
(9, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-12 17:41:12'),
(10, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 15:58:47'),
(11, 1, 5, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 15:58:47'),
(12, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-24 19:20:21'),
(13, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 19:22:16'),
(14, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e1a\\u0e32\\u0e07\\u0e23\\u0e32\\u0e22\\u0e01\\u0e32\\u0e23\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-24 19:22:16'),
(15, 1, NULL, 'Borrow', NULL, '{\"borrower_name\":\"User2\",\"borrow_date\":\"2025-12-25\"}', '2025-12-25 21:53:52'),
(16, 1, NULL, 'Move', '{\"location_id\":1}', '{\"location_id\":\"4\"}', '2025-12-26 09:21:36'),
(17, 1, NULL, 'Move', '{\"location_id\":4}', '{\"location_id\":\"5\"}', '2025-12-26 09:21:44'),
(18, 1, NULL, 'Add', NULL, '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c Acer22\",\"serial_number\":\"CN1234566222\",\"barcode\":\"QR1763370269178222\",\"quantity\":1,\"unit\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\",\"price\":\"222222\",\"received_date\":\"2025-12-26\",\"department_id\":\"2\",\"location_id\":\"4\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '2025-12-26 09:25:47'),
(19, 1, NULL, 'Edit', '{\"department_id\":2}', '{\"department_id\":\"1\"}', '2025-12-26 17:35:46'),
(20, 1, NULL, 'Edit', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '2025-12-26 17:35:53'),
(21, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-26 17:37:03'),
(22, 1, NULL, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-26 17:37:18'),
(24, 1, NULL, 'Delete', '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c Acer\",\"serial_number\":\"CN12345662\",\"barcode\":\"QR1763370269178\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"location_id\":4}', NULL, '2025-12-26 17:40:00'),
(25, 1, NULL, 'Delete', '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c Acer\",\"serial_number\":\"CN123456644\",\"barcode\":\"QR001234567\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"location_id\":5}', NULL, '2025-12-26 17:40:06'),
(26, 1, NULL, 'Delete', '{\"asset_name\":\"Dell Optiplex 7080\",\"serial_number\":\"SN123456789\",\"barcode\":\"QR0014\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"location_id\":5}', NULL, '2025-12-26 17:40:10'),
(27, 1, NULL, 'Delete', '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c HP LaserJet0\",\"serial_number\":\"SN98765432100\",\"barcode\":\"QR002\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"location_id\":2}', NULL, '2025-12-26 17:41:00'),
(28, 1, NULL, 'Delete', '{\"asset_name\":\"\\u0e04\\u0e2d\\u0e21\\u0e1e\\u0e34\\u0e27\\u0e40\\u0e15\\u0e2d\\u0e23\\u0e4c Dell Optiplex 70800\",\"serial_number\":\"SN12345678900\",\"barcode\":\"QR001\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"location_id\":1}', NULL, '2025-12-26 17:42:28'),
(29, 1, 3, 'Edit', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '2025-12-26 17:43:12'),
(30, 1, 2, 'Edit', '{\"location_id\":3}', '{\"location_id\":\"1\"}', '2025-12-26 17:43:29'),
(31, 1, 2, 'Move', '{\"location_id\":3}', '{\"location_id\":\"1\"}', '2025-12-26 17:43:29'),
(32, 1, 2, 'Borrow', NULL, '{\"borrower_name\":\"\\u0e4dYou\",\"borrow_date\":\"2025-12-26\"}', '2025-12-26 17:50:28'),
(33, 1, NULL, 'Return', '{\"status\":\"\\u0e22\\u0e37\\u0e21\"}', '{\"status\":\"\\u0e04\\u0e37\\u0e19\\u0e41\\u0e25\\u0e49\\u0e27\"}', '2025-12-26 17:50:32'),
(34, 1, 4, 'Edit', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '2025-12-26 17:52:45'),
(35, 1, 4, 'Edit', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '2025-12-26 17:52:49'),
(36, 1, 2, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-26 17:54:07'),
(37, 1, 3, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-26 17:54:07'),
(38, 1, 4, 'Check', NULL, '{\"check_status\":\"\\u0e21\\u0e35\\u0e04\\u0e23\\u0e38\\u0e20\\u0e31\\u0e13\\u0e11\\u0e4c\\u0e2a\\u0e39\\u0e0d\\u0e2b\\u0e32\\u0e22\",\"remark\":\"\"}', '2025-12-26 17:54:43'),
(39, 1, 2, 'Check', NULL, '{\"check_status\":\"\\u0e21\\u0e35\\u0e04\\u0e23\\u0e38\\u0e20\\u0e31\\u0e13\\u0e11\\u0e4c\\u0e2a\\u0e39\\u0e0d\\u0e2b\\u0e32\\u0e22\",\"remark\":\"\"}', '2025-12-26 17:55:13'),
(40, 1, 3, 'Check', NULL, '{\"check_status\":\"\\u0e21\\u0e35\\u0e04\\u0e23\\u0e38\\u0e20\\u0e31\\u0e13\\u0e11\\u0e4c\\u0e2a\\u0e39\\u0e0d\\u0e2b\\u0e32\\u0e22\",\"remark\":\"\"}', '2025-12-26 17:55:13'),
(41, 1, 13, 'Add', NULL, '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c Canon\",\"serial_number\":\"CN1234566\",\"barcode\":\"QR17633702691785444\",\"quantity\":1,\"unit\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\",\"price\":\"45444\",\"received_date\":\"2025-12-26\",\"department_id\":\"2\",\"location_id\":\"4\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '2025-12-26 18:50:54'),
(42, 1, 13, 'Check', NULL, '{\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-26 18:56:28'),
(43, 1, 5, 'Check', NULL, '{\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-26 18:56:28'),
(44, 1, 13, 'Edit', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\"}', '2025-12-26 19:39:16'),
(45, 1, 5, 'Edit', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\"}', '2025-12-26 19:52:40'),
(46, 1, 14, 'Add', NULL, '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c Acer\",\"serial_number\":\"CN123456644\",\"barcode\":\"QR176337026917844\",\"quantity\":1,\"unit\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\",\"price\":\"444\",\"received_date\":\"2025-12-26\",\"department_id\":null,\"location_id\":\"4\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '2025-12-26 20:02:27'),
(47, 1, 14, 'Edit', '{\"department\":null}', '{\"department\":\"\\u0e20\\u0e32\\u0e04\\u0e27\\u0e34\\u0e0a\\u0e32\\u0e27\\u0e34\\u0e28\\u0e27\\u0e01\\u0e23\\u0e23\\u0e21\\u0e04\\u0e2d\\u0e21\\u0e1e\\u0e34\\u0e27\\u0e40\\u0e15\\u0e2d\\u0e23\\u0e4c\"}', '2025-12-26 20:06:33'),
(48, 1, 14, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 QR Scanner\"}', '2025-12-26 20:33:37'),
(49, 1, 14, 'Check', NULL, '{\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 Mobile App\"}', '2025-12-26 23:13:37'),
(50, 1, 13, 'Check', NULL, '{\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 Mobile App\"}', '2025-12-26 23:14:14'),
(51, 1, 13, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\",\"check_status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\",\"remark\":\"Out\"}', '2025-12-26 23:16:09'),
(52, 1, 13, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\"}', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\",\"check_status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 Mobile App\"}', '2025-12-26 23:16:36'),
(53, 1, 13, 'Check', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 Mobile App\"}', '2025-12-26 23:17:06'),
(54, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 20:55:52'),
(55, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 20:55:52'),
(56, 1, 5, 'Check', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 20:55:52'),
(57, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 20:56:19'),
(58, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 20:56:19'),
(59, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 20:56:19'),
(60, 1, 14, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 20:58:51'),
(61, 1, 13, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 20:58:51'),
(62, 1, 5, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 20:58:51'),
(63, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:02:16'),
(64, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:02:16'),
(65, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:02:16'),
(66, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:02:55'),
(67, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:02:55'),
(68, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:02:55'),
(69, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:03:01'),
(70, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:03:01'),
(71, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:03:01'),
(72, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:05:21'),
(73, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:05:21'),
(74, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:05:21'),
(75, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 21:08:08'),
(76, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 21:08:08'),
(77, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 21:08:08'),
(78, 1, 2, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\",\"check_status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\",\"remark\":\"\"}', '2025-12-27 21:08:21'),
(79, 1, 3, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\",\"check_status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\",\"remark\":\"\"}', '2025-12-27 21:08:22'),
(80, 1, 14, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:08:44'),
(81, 1, 13, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:08:44'),
(82, 1, 5, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:08:44'),
(83, 1, 2, 'Check', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:08:49'),
(84, 1, 3, 'Check', '{\"status\":\"\\u0e44\\u0e21\\u0e48\\u0e1e\\u0e1a\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:08:49'),
(85, 1, 4, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:08:50'),
(86, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:24:54'),
(87, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:24:54'),
(88, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:24:54'),
(89, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:25:01'),
(90, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:30:07'),
(91, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:30:07'),
(92, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:30:07'),
(93, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\"}', '2025-12-27 21:30:16'),
(94, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 21:34:48'),
(95, 1, 13, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 21:34:48'),
(96, 1, 5, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"check_status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\",\"remark\":\"\"}', '2025-12-27 21:34:48'),
(97, 1, 14, 'Check', '{\"status\":\"\\u0e23\\u0e2d\\u0e0b\\u0e48\\u0e2d\\u0e21\"}', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"check_status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\",\"remark\":\"\\u0e15\\u0e23\\u0e27\\u0e08\\u0e2a\\u0e2d\\u0e1a\\u0e1c\\u0e48\\u0e32\\u0e19 Mobile App\"}', '2026-01-27 10:54:57'),
(98, 1, 14, 'Borrow', NULL, '{\"borrower_name\":\"juuu\",\"borrow_date\":\"2026-01-28\"}', '2026-01-28 12:02:44'),
(99, 1, 15, 'Add', NULL, '{\"asset_name\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\\u0e1e\\u0e34\\u0e21\\u0e1e\\u0e4c Acer11\",\"serial_number\":\"111111\",\"barcode\":\"1111111\",\"quantity\":1,\"unit\":\"\\u0e40\\u0e04\\u0e23\\u0e37\\u0e48\\u0e2d\\u0e07\",\"price\":\"11111\",\"received_date\":\"2026-01-29\",\"department_id\":\"3\",\"location_id\":\"4\",\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '2026-01-29 11:33:24'),
(100, 1, 14, 'Check', '{\"status\":\"\\u0e43\\u0e0a\\u0e49\\u0e07\\u0e32\\u0e19\\u0e44\\u0e14\\u0e49\"}', '{\"status\":\"\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\\u0e41\\u0e25\\u0e49\\u0e27\",\"check_status\":\"\\u0e08\\u0e33\\u0e2b\\u0e19\\u0e48\\u0e32\\u0e22\\u0e41\\u0e25\\u0e49\\u0e27\",\"remark\":\"\"}', '2026-01-29 11:38:51');

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

--
-- Dumping data for table `borrow`
--

INSERT INTO `borrow` (`borrow_id`, `asset_id`, `borrower_name`, `department_id`, `borrow_date`, `return_date`, `status`, `remark`, `created_at`, `updated_at`) VALUES
(2, 2, 'ํYou', NULL, '2025-12-26', '2025-12-26', 'คืนแล้ว', NULL, '2025-12-26 10:50:28', '2025-12-26 10:50:32'),
(3, 14, 'juuu', NULL, '2026-01-28', NULL, 'ยืม', NULL, '2026-01-28 05:02:44', '2026-01-28 05:02:44');

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
(2, 'ภาควิชาวิศวกรรมคอมพิวเตอร์', 'คณะวิศวกรรมศาสตร์', '2025-12-11 01:32:09'),
(3, 'ITI', '', '2025-12-26 13:13:19');

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
  `role` enum('Admin','Inspector','Viewer') NOT NULL DEFAULT 'Inspector',
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
(1, 'admin', '$2y$10$cmGbk5vTlst9LBt0sXPumeiqjJiLGd9s8Sfw7Nlclt6vPxdjiTJki', 'ผู้ดูแลระบบ', 'Admin', 'Active', 'admin@example.com', '0987654321', '2025-12-11 01:32:09', '2026-01-27 03:42:21'),
(2, 'officer1', '$2y$10$IHUYwVYEhsvKqlhhp9V6Le54irYo64uVoa0.VwdsbfJ7bxbT1EtAC', 'เจ้าหน้าที่ 1', 'Inspector', 'Active', 'officer1@example.com', '0823456789', '2025-12-11 01:32:09', '2025-12-27 15:05:36'),
(3, 'officer2', '$2y$10$XSFqwwTx0HX4425UZ6ZH3O63wi5DFP5a3Q6g/OtZTmtKepuW8quPm', 'เจ้าหน้าที่ 2', 'Inspector', 'Active', 'officer2@example.com', '0834567890', '2025-12-11 01:32:09', '2025-12-24 13:14:00'),
(4, 'viewer1', '$2y$10$ZYrxNp9JDS9.U70cxSerbeM5g8TBt47OdXntsEuQ4VZvmRRkd1/Bm', 'ผู้ใช้งานทั่วไป 1', 'Viewer', 'Active', 'viewer1@example.com', '0834567890', '2025-12-26 11:41:58', '2026-01-29 04:07:17');

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
,`department` varchar(200)
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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_assets_with_check_info`  AS SELECT `a`.`asset_id` AS `asset_id`, `a`.`asset_name` AS `asset_name`, `a`.`serial_number` AS `serial_number`, `a`.`quantity` AS `quantity`, `a`.`unit` AS `unit`, `a`.`price` AS `price`, `a`.`received_date` AS `received_date`, `a`.`department_id` AS `department_id`, `a`.`department` AS `department`, `a`.`location_id` AS `location_id`, `a`.`status` AS `status`, `a`.`barcode` AS `barcode`, `a`.`image` AS `image`, `a`.`created_at` AS `created_at`, `a`.`updated_at` AS `updated_at`, `d`.`department_name` AS `department_name`, `l`.`building_name` AS `building_name`, `l`.`floor` AS `floor`, `l`.`room_number` AS `room_number`, (select `ac`.`check_date` from `asset_check` `ac` where `ac`.`asset_id` = `a`.`asset_id` order by `ac`.`check_date` desc limit 1) AS `last_check_date`, (select `u`.`fullname` from (`asset_check` `ac` left join `users` `u` on(`ac`.`user_id` = `u`.`user_id`)) where `ac`.`asset_id` = `a`.`asset_id` order by `ac`.`check_date` desc limit 1) AS `last_checker`, (select `ac`.`check_status` from `asset_check` `ac` where `ac`.`asset_id` = `a`.`asset_id` order by `ac`.`check_date` desc limit 1) AS `last_check_status`, `sch`.`next_check_date` AS `next_check_date`, `sch`.`schedule_id` AS `schedule_id`, `cs`.`name` AS `schedule_name`, `cs`.`check_interval_months` AS `check_interval_months`, CASE WHEN `sch`.`next_check_date` is null THEN 'no_schedule' WHEN to_days(`sch`.`next_check_date`) - to_days(curdate()) < 0 THEN 'overdue' WHEN to_days(`sch`.`next_check_date`) - to_days(curdate()) = 0 THEN 'today' WHEN to_days(`sch`.`next_check_date`) - to_days(curdate()) <= 7 THEN 'urgent' ELSE 'normal' END AS `check_urgency`, to_days(`sch`.`next_check_date`) - to_days(curdate()) AS `days_until_check` FROM ((((`assets` `a` left join `departments` `d` on(`a`.`department_id` = `d`.`department_id`)) left join `locations` `l` on(`a`.`location_id` = `l`.`location_id`)) left join `asset_schedules` `sch` on(`a`.`asset_id` = `sch`.`asset_id`)) left join `check_schedules` `cs` on(`sch`.`schedule_id` = `cs`.`schedule_id`)) ;

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
  MODIFY `asset_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `asset_check`
--
ALTER TABLE `asset_check`
  MODIFY `check_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `asset_history`
--
ALTER TABLE `asset_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `asset_schedules`
--
ALTER TABLE `asset_schedules`
  MODIFY `asset_schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `audittrail`
--
ALTER TABLE `audittrail`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `borrow`
--
ALTER TABLE `borrow`
  MODIFY `borrow_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `check_schedules`
--
ALTER TABLE `check_schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
