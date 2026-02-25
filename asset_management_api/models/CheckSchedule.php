<?php
class CheckSchedule {
    private $conn;
    private $schedules_table = "check_schedules";
    private $asset_schedules_table = "asset_schedules";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAllSchedules() {
        $query = "SELECT * FROM " . $this->schedules_table . " 
                  WHERE is_active = 1 
                  ORDER BY check_interval_months";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function assignToAsset($asset_id, $schedule_id, $custom_interval = null, $next_check_date = null) {
        // ถ้ามีการส่ง next_check_date มาแล้ว ให้ใช้ค่านั้น
        if ($next_check_date) {
            // ใช้วันที่ที่ส่งมา
        } else if ($schedule_id && $schedule_id != 5) {  // 5 = กำหนดเอง
            // ใช้รอบมาตรฐาน
            $query = "SELECT check_interval_months FROM " . $this->schedules_table . " 
                      WHERE schedule_id = :schedule_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":schedule_id", $schedule_id);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $interval = $row['check_interval_months'] ?? 3;
            $next_check_date = date('Y-m-d', strtotime("+{$interval} months"));
        } else if ($custom_interval && $custom_interval > 0) {
            // ใช้จำนวนเดือนที่กำหนดเอง
            $next_check_date = date('Y-m-d', strtotime("+{$custom_interval} months"));
        }

        $query = "INSERT INTO " . $this->asset_schedules_table . " 
                   (asset_id, schedule_id, next_check_date, custom_interval_months, is_notified, is_dismissed)
                   VALUES (:asset_id, :schedule_id, :next_check_date, :custom_interval, 0, 0)
                   ON DUPLICATE KEY UPDATE 
                   schedule_id = VALUES(schedule_id),
                   next_check_date = VALUES(next_check_date),
                   custom_interval_months = VALUES(custom_interval_months),
                   is_notified = 0,
                   is_dismissed = 0,
                   updated_at = CURRENT_TIMESTAMP";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $asset_id);
        $stmt->bindParam(":schedule_id", $schedule_id);
        $stmt->bindParam(":next_check_date", $next_check_date);
        $stmt->bindParam(":custom_interval", $custom_interval);
        
        return $stmt->execute();
    }

    public function assignToLocation($location_id, $schedule_id, $custom_interval = null) {
        $query = "SELECT asset_id FROM assets WHERE location_id = :location_id";
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

    public function getNotifications($days_threshold = 30) {
        $query = "SELECT 
                    ast.asset_schedule_id,
                    ast.asset_id,
                    a.asset_name,
                    a.serial_number,
                    a.status as asset_status,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name,
                    ast.next_check_date,
                    (SELECT ac.check_date 
                     FROM asset_check ac 
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_check_date,
                    DATEDIFF(ast.next_check_date, CURDATE()) AS days_until_check,
                    cs.name AS schedule_name,
                    cs.check_interval_months,
                    CASE
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) < 0 THEN 'เลยกำหนด'
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) = 0 THEN 'วันนี้'
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) <= 7 THEN 'เร่งด่วน'
                        ELSE 'ปกติ'
                    END AS urgency_level
                  FROM " . $this->asset_schedules_table . " ast
                  INNER JOIN assets a ON ast.asset_id = a.asset_id
                  LEFT JOIN check_schedules cs ON ast.schedule_id = cs.schedule_id
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  WHERE DATEDIFF(ast.next_check_date, CURDATE()) <= :days
                    AND ast.is_dismissed = 0
                  ORDER BY ast.next_check_date ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":days", $days_threshold, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    public function getOverdue() {
        $query = "SELECT 
                    ast.asset_schedule_id,
                    ast.asset_id,
                    a.asset_name,
                    a.serial_number,
                    a.status as asset_status,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name,
                    ast.next_check_date,
                    (SELECT ac.check_date 
                     FROM asset_check ac 
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_check_date,
                    DATEDIFF(CURDATE(), ast.next_check_date) AS days_overdue,
                    cs.name AS schedule_name
                  FROM " . $this->asset_schedules_table . " ast
                  INNER JOIN assets a ON ast.asset_id = a.asset_id
                  LEFT JOIN check_schedules cs ON ast.schedule_id = cs.schedule_id
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  WHERE ast.next_check_date < CURDATE()
                    AND ast.is_dismissed = 0
                  ORDER BY days_overdue DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // ดึงรายการยืมที่ยังไม่คืน
    public function getActiveBorrows() {
        $query = "SELECT 
                    b.borrow_id,
                    b.asset_id,
                    a.asset_name,
                    a.serial_number,
                    b.borrower_name,
                    b.borrow_date,
                    DATEDIFF(CURDATE(), b.borrow_date) AS days_borrowed,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name
                  FROM borrow b
                  INNER JOIN assets a ON b.asset_id = a.asset_id
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  WHERE b.status = 'ยืม'
                  ORDER BY b.borrow_date ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // ดึงครุภัณฑ์ที่ไม่เคยตรวจสอบเลย
    public function getNeverCheckedAssets() {
        $query = "SELECT 
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    a.status as asset_status,
                    a.created_at,
                    DATEDIFF(CURDATE(), a.created_at) AS days_since_added,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name
                  FROM assets a
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  WHERE a.asset_id NOT IN (
                      SELECT DISTINCT ac.asset_id FROM asset_check ac
                  )
                  AND a.status NOT IN ('จำหน่ายแล้ว')
                  ORDER BY a.created_at ASC
                  LIMIT 20";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // ดึงการแจ้งเตือนทั้งหมดรวมกัน
    public function getAllNotifications() {
        $notifications = [];

        // 1. ครุภัณฑ์เลยกำหนดตรวจสอบ
        try {
            $stmt = $this->getOverdue();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = [
                    'type' => 'overdue_check',
                    'priority' => 1,
                    'icon' => 'alert-circle',
                    'color' => '#EF4444',
                    'bgColor' => '#FEE2E2',
                    'asset_id' => $row['asset_id'],
                    'title' => $row['asset_name'],
                    'message' => 'เกินกำหนดตรวจสอบ ' . $row['days_overdue'] . ' วัน',
                    'detail' => $row['building_name'] ? $row['building_name'] . ' ชั้น ' . $row['floor'] . ' ห้อง ' . $row['room_number'] : '',
                    'date' => $row['next_check_date'],
                    'data' => $row
                ];
            }
        } catch (Exception $e) {
            // table อาจไม่มี ข้ามไป
        }

        // 2. ครุภัณฑ์ใกล้ถึงกำหนดตรวจสอบ (30 วัน)
        try {
            $stmt = $this->getNotifications(30);
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $days = $row['days_until_check'];
                if ($days >= 0) { // ไม่ซ้ำกับ overdue
                    $msg = $days == 0 ? 'ครบกำหนดตรวจสอบวันนี้' : 'อีก ' . $days . ' วันถึงกำหนดตรวจสอบ';
                    $notifications[] = [
                        'type' => 'upcoming_check',
                        'priority' => 2,
                        'icon' => 'time',
                        'color' => '#F59E0B',
                        'bgColor' => '#FEF3C7',
                        'asset_id' => $row['asset_id'],
                        'title' => $row['asset_name'],
                        'message' => $msg,
                        'detail' => $row['building_name'] ? $row['building_name'] . ' ชั้น ' . $row['floor'] . ' ห้อง ' . $row['room_number'] : '',
                        'date' => $row['next_check_date'],
                        'data' => $row
                    ];
                }
            }
        } catch (Exception $e) {
            // table อาจไม่มี ข้ามไป
        }

        // 3. ยืมค้าง
        try {
            $stmt = $this->getActiveBorrows();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = [
                    'type' => 'active_borrow',
                    'priority' => 3,
                    'icon' => 'swap-horizontal',
                    'color' => '#8B5CF6',
                    'bgColor' => '#EDE9FE',
                    'asset_id' => $row['asset_id'],
                    'title' => $row['asset_name'],
                    'message' => 'ยืมโดย ' . $row['borrower_name'] . ' (' . $row['days_borrowed'] . ' วัน)',
                    'detail' => 'ยืมตั้งแต่ ' . $row['borrow_date'],
                    'date' => $row['borrow_date'],
                    'data' => $row
                ];
            }
        } catch (Exception $e) {
            // ข้ามไป
        }

        // 4. ไม่เคยตรวจสอบ
        try {
            $stmt = $this->getNeverCheckedAssets();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = [
                    'type' => 'never_checked',
                    'priority' => 4,
                    'icon' => 'warning',
                    'color' => '#F97316',
                    'bgColor' => '#FFF7ED',
                    'asset_id' => $row['asset_id'],
                    'title' => $row['asset_name'],
                    'message' => 'ยังไม่เคยตรวจสอบ (เพิ่มมาแล้ว ' . $row['days_since_added'] . ' วัน)',
                    'detail' => $row['building_name'] ? $row['building_name'] . ' ชั้น ' . $row['floor'] . ' ห้อง ' . $row['room_number'] : '',
                    'date' => $row['created_at'],
                    'data' => $row
                ];
            }
        } catch (Exception $e) {
            // ข้ามไป
        }

        // Sort: priority (1=สูงสุด), then date
        usort($notifications, function($a, $b) {
            if ($a['priority'] !== $b['priority']) {
                return $a['priority'] - $b['priority'];
            }
            return strcmp($a['date'], $b['date']);
        });

        return $notifications;
    }
}
?>