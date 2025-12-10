<?php
// FILE: asset_management_api/models/CheckSchedule.php

class CheckSchedule {
    private $conn;
    private $schedules_table = "Check_Schedules";
    private $asset_schedules_table = "Asset_Schedules";

    public $schedule_id;
    public $name;
    public $check_interval_months;
    public $notify_before_days;
    public $is_active;

    public function __construct($db) {
        $this->conn = $db;
    }

    // ========================================
    // Check_Schedules Methods
    // ========================================

    // ดึงรอบการตรวจทั้งหมด
    public function getAllSchedules() {
        $query = "SELECT * FROM " . $this->schedules_table . " 
                  WHERE is_active = 1 
                  ORDER BY check_interval_months";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // สร้างรอบการตรวจใหม่
    public function createSchedule() {
        $query = "INSERT INTO " . $this->schedules_table . " 
                  SET name = :name, 
                      check_interval_months = :interval,
                      notify_before_days = :notify_days,
                      is_active = 1";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":interval", $this->check_interval_months);
        $stmt->bindParam(":notify_days", $this->notify_before_days);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // ========================================
    // Asset_Schedules Methods
    // ========================================

    // กำหนดรอบการตรวจให้ครุภัณฑ์
    public function assignToAsset($asset_id, $schedule_id, $custom_interval = null, $custom_next_date = null) {
        // คำนวณ next_check_date
        $next_check_date = $custom_next_date;
        
        if (!$next_check_date && $schedule_id) {
            // ดึง interval จากรอบการตรวจ
            $query = "SELECT check_interval_months FROM " . $this->schedules_table . " 
                      WHERE schedule_id = :schedule_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":schedule_id", $schedule_id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $interval = $row['check_interval_months'] ?? 3;
            $next_check_date = date('Y-m-d', strtotime("+{$interval} months"));
        } else if (!$next_check_date && $custom_interval) {
            $next_check_date = date('Y-m-d', strtotime("+{$custom_interval} months"));
        }

        // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
        $check_query = "SELECT asset_schedule_id FROM " . $this->asset_schedules_table . " 
                        WHERE asset_id = :asset_id";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":asset_id", $asset_id);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            // Update
            $query = "UPDATE " . $this->asset_schedules_table . " 
                      SET schedule_id = :schedule_id,
                          next_check_date = :next_check_date,
                          custom_interval_months = :custom_interval,
                          is_notified = 0,
                          is_dismissed = 0
                      WHERE asset_id = :asset_id";
        } else {
            // Insert
            $query = "INSERT INTO " . $this->asset_schedules_table . " 
                      SET asset_id = :asset_id,
                          schedule_id = :schedule_id,
                          next_check_date = :next_check_date,
                          custom_interval_months = :custom_interval";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $asset_id);
        $stmt->bindParam(":schedule_id", $schedule_id);
        $stmt->bindParam(":next_check_date", $next_check_date);
        $stmt->bindParam(":custom_interval", $custom_interval);

        return $stmt->execute();
    }

    // กำหนดรอบการตรวจให้ทั้งห้อง
    public function assignToLocation($location_id, $schedule_id, $custom_interval = null) {
        // ดึงครุภัณฑ์ทั้งหมดในห้อง
        $query = "SELECT asset_id FROM Assets WHERE location_id = :location_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":location_id", $location_id);
        $stmt->execute();

        $success_count = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($this->assignToAsset($row['asset_id'], $schedule_id, $custom_interval)) {
                $success_count++;
            }
        }

        return $success_count;
    }

    // ดึงการแจ้งเตือน
    public function getNotifications($days_threshold = 30) {
        $query = "SELECT 
                    ast.asset_schedule_id,
                    ast.asset_id,
                    a.asset_name,
                    a.serial_number,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name,
                    ast.schedule_id,
                    cs.name AS schedule_name,
                    ast.last_check_date,
                    ast.next_check_date,
                    DATEDIFF(ast.next_check_date, CURDATE()) AS days_until_check,
                    CASE
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) < 0 THEN 'เลยกำหนด'
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) = 0 THEN 'วันนี้'
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) <= 7 THEN 'เร่งด่วน'
                        ELSE 'ปกติ'
                    END AS urgency_level
                  FROM " . $this->asset_schedules_table . " ast
                  INNER JOIN Assets a ON ast.asset_id = a.asset_id
                  LEFT JOIN Check_Schedules cs ON ast.schedule_id = cs.schedule_id
                  LEFT JOIN Locations l ON a.location_id = l.location_id
                  LEFT JOIN Departments d ON a.department_id = d.department_id
                  WHERE ast.next_check_date IS NOT NULL
                    AND DATEDIFF(ast.next_check_date, CURDATE()) <= :days
                    AND ast.is_dismissed = 0
                  ORDER BY ast.next_check_date ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":days", $days_threshold, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    // ดึงรายการเลยกำหนด
    public function getOverdue() {
        $query = "SELECT 
                    ast.asset_schedule_id,
                    ast.asset_id,
                    a.asset_name,
                    a.serial_number,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    ast.next_check_date,
                    DATEDIFF(CURDATE(), ast.next_check_date) AS days_overdue
                  FROM " . $this->asset_schedules_table . " ast
                  INNER JOIN Assets a ON ast.asset_id = a.asset_id
                  LEFT JOIN Locations l ON a.location_id = l.location_id
                  WHERE ast.next_check_date < CURDATE()
                    AND ast.is_dismissed = 0
                  ORDER BY days_overdue DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // ซ่อนการแจ้งเตือน
    public function dismissNotification($asset_schedule_id) {
        $query = "UPDATE " . $this->asset_schedules_table . " 
                  SET is_dismissed = 1 
                  WHERE asset_schedule_id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $asset_schedule_id);
        return $stmt->execute();
    }

    // อัปเดตหลังจากตรวจสอบ
    public function updateAfterCheck($asset_id) {
        $today = date('Y-m-d');

        // ดึงข้อมูลรอบการตรวจปัจจุบัน
        $query = "SELECT schedule_id, custom_interval_months 
                  FROM " . $this->asset_schedules_table . " 
                  WHERE asset_id = :asset_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $asset_id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            return false; // ไม่มีรอบการตรวจ
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $schedule_id = $row['schedule_id'];
        $custom_interval = $row['custom_interval_months'];

        // คำนวณวันที่ตรวจครั้งถัดไป
        if ($custom_interval) {
            $next_check = date('Y-m-d', strtotime("+{$custom_interval} months"));
        } else if ($schedule_id) {
            $query2 = "SELECT check_interval_months FROM " . $this->schedules_table . " 
                       WHERE schedule_id = :schedule_id";
            $stmt2 = $this->conn->prepare($query2);
            $stmt2->bindParam(":schedule_id", $schedule_id);
            $stmt2->execute();
            $row2 = $stmt2->fetch(PDO::FETCH_ASSOC);
            $interval = $row2['check_interval_months'] ?? 3;
            $next_check = date('Y-m-d', strtotime("+{$interval} months"));
        } else {
            $next_check = date('Y-m-d', strtotime("+3 months")); // default 3 เดือน
        }

        // Update
        $update_query = "UPDATE " . $this->asset_schedules_table . " 
                         SET last_check_date = :today,
                             next_check_date = :next_check,
                             is_notified = 0,
                             is_dismissed = 0
                         WHERE asset_id = :asset_id";

        $update_stmt = $this->conn->prepare($update_query);
        $update_stmt->bindParam(":today", $today);
        $update_stmt->bindParam(":next_check", $next_check);
        $update_stmt->bindParam(":asset_id", $asset_id);

        return $update_stmt->execute();
    }
}
?>