<?php
class CheckSchedule {
    private $conn;
    private $schedules_table = "Check_Schedules";
    private $asset_schedules_table = "Asset_Schedules";

    public function __construct($db) {
        $this->conn = $db;
    }

    // ดึงรอบการตรวจทั้งหมด
    public function getAllSchedules() {
        $query = "SELECT * FROM " . $this->schedules_table . " 
                  WHERE is_active = 1 
                  ORDER BY check_interval_months";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // กำหนดรอบการตรวจให้ครุภัณฑ์
    public function assignToAsset($asset_id, $schedule_id, $custom_interval = null) {
        // คำนวณ next_check_date
        $next_check_date = null;
        
        if ($schedule_id) {
            $query = "SELECT check_interval_months FROM " . $this->schedules_table . " 
                      WHERE schedule_id = :schedule_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":schedule_id", $schedule_id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $interval = $row['check_interval_months'] ?? 3;
            $next_check_date = date('Y-m-d', strtotime("+{$interval} months"));
        } else if ($custom_interval) {
            $next_check_date = date('Y-m-d', strtotime("+{$custom_interval} months"));
        }

        // อัปเดต Assets
        $query = "UPDATE Assets 
                  SET schedule_id = :schedule_id,
                      next_check_date = :next_check_date
                  WHERE asset_id = :asset_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":schedule_id", $schedule_id);
        $stmt->bindParam(":next_check_date", $next_check_date);
        $stmt->bindParam(":asset_id", $asset_id);
        
        if ($stmt->execute()) {
            // บันทึกลง Asset_Schedules
            $query2 = "INSERT INTO " . $this->asset_schedules_table . " 
                       (asset_id, schedule_id, next_check_date, custom_interval_months)
                       VALUES (:asset_id, :schedule_id, :next_check_date, :custom_interval)
                       ON DUPLICATE KEY UPDATE 
                       schedule_id = :schedule_id,
                       next_check_date = :next_check_date,
                       custom_interval_months = :custom_interval,
                       is_notified = 0,
                       is_dismissed = 0";
            
            $stmt2 = $this->conn->prepare($query2);
            $stmt2->bindParam(":asset_id", $asset_id);
            $stmt2->bindParam(":schedule_id", $schedule_id);
            $stmt2->bindParam(":next_check_date", $next_check_date);
            $stmt2->bindParam(":custom_interval", $custom_interval);
            return $stmt2->execute();
        }
        
        return false;
    }

    // กำหนดรอบการตรวจทั้งห้อง
    public function assignToLocation($location_id, $schedule_id, $custom_interval = null) {
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
                    ast.next_check_date,
                    DATEDIFF(ast.next_check_date, CURDATE()) AS days_until_check,
                    cs.name AS schedule_name,
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
                  WHERE DATEDIFF(ast.next_check_date, CURDATE()) <= :days
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
                  ORDER BY days_overdue DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>