-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2026 at 05:43 PM
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
(1, 516, 1, '2026-03-01', 'รอจำหน่าย', '', '2025-03-05 13:04:29'),
(2, 1037, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(3, 1039, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(4, 1042, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(5, 1040, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(6, 1038, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(7, 1041, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(8, 1043, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(9, 1044, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(10, 1048, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(11, 1046, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(12, 1047, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(13, 1045, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(14, 1049, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(15, 1050, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(16, 1052, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(17, 1051, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(18, 1053, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(19, 1056, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(20, 1054, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(21, 1058, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:23'),
(22, 1057, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:24'),
(23, 1061, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:24'),
(24, 1060, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:24'),
(25, 1062, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:24'),
(26, 1059, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:24'),
(27, 1055, 1, '2026-03-09', 'ใช้งานได้', '', '2026-03-09 06:47:24'),
(28, 1027, 1, '2026-03-09', 'รอซ่อม', 'ตรวจสอบรายห้อง: อาคาร B ห้อง B4-17', '2026-03-09 07:01:05'),
(29, 1028, 1, '2026-03-09', 'รอซ่อม', 'ตรวจสอบรายห้อง: อาคาร B ห้อง B4-17', '2026-03-09 07:01:05'),
(30, 1029, 1, '2026-03-09', 'รอซ่อม', 'ตรวจสอบรายห้อง: อาคาร B ห้อง B4-17', '2026-03-09 07:01:05'),
(31, 1030, 1, '2026-03-09', 'รอซ่อม', 'ตรวจสอบรายห้อง: อาคาร B ห้อง B4-17', '2026-03-09 07:01:06'),
(32, 1031, 1, '2026-03-09', 'รอซ่อม', 'ตรวจสอบรายห้อง: อาคาร B ห้อง B4-17', '2026-03-09 07:01:06'),
(33, 1078, 1, '2026-03-10', 'ใช้งานได้', '', '2026-03-10 15:07:16'),
(34, 1077, 1, '2026-03-10', 'ใช้งานได้', '', '2026-03-10 15:07:16'),
(35, 1076, 1, '2026-03-10', 'ใช้งานได้', '', '2026-03-10 15:07:16'),
(36, 1070, 1, '2026-03-10', 'ใช้งานได้', '', '2026-03-10 15:07:32'),
(37, 863, 1, '2026-03-10', 'รอจำหน่าย', 'ตรวจสอบรายห้อง: อาคาร A ห้อง A1-01 Shop เคมี', '2026-03-10 16:09:53'),
(38, 516, 1, '2026-03-01', 'รอจำหน่าย', '', '2026-03-04 13:04:29'),
(39, 516, 1, '2026-03-01', 'รอจำหน่าย', '', '2028-03-15 13:04:29');

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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asset_check`
--
ALTER TABLE `asset_check`
  ADD PRIMARY KEY (`check_id`),
  ADD KEY `idx_asset_check` (`asset_id`,`check_date`),
  ADD KEY `idx_check_date` (`check_date`),
  ADD KEY `fk_check_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asset_check`
--
ALTER TABLE `asset_check`
  MODIFY `check_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asset_check`
--
ALTER TABLE `asset_check`
  ADD CONSTRAINT `fk_check_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_check_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
