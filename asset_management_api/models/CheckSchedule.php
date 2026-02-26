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

    // ดึงการแจ้งเตือนทั้งหมดแบบแบ่งหน้า (Paginated) พร้อมจำนวนแต่ละประเภท
    public function getAllNotificationsPaginated($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        // Count query per type
        $count_query = "
            SELECT 'overdue_check' as type, COUNT(*) as cnt FROM " . $this->asset_schedules_table . " ast
            INNER JOIN assets a ON ast.asset_id = a.asset_id
            WHERE ast.next_check_date < CURDATE() AND ast.is_dismissed = 0
            UNION ALL
            SELECT 'upcoming_check' as type, COUNT(*) as cnt FROM " . $this->asset_schedules_table . " ast
            INNER JOIN assets a ON ast.asset_id = a.asset_id
            WHERE DATEDIFF(ast.next_check_date, CURDATE()) <= 30 AND DATEDIFF(ast.next_check_date, CURDATE()) >= 0 AND ast.is_dismissed = 0
            UNION ALL
            SELECT 'active_borrow' as type, COUNT(*) as cnt FROM borrow b
            INNER JOIN assets a ON b.asset_id = a.asset_id
            WHERE b.status = 'ยืม'
            UNION ALL
            SELECT 'never_checked' as type, COUNT(*) as cnt FROM assets a
            WHERE a.asset_id NOT IN (SELECT DISTINCT ac.asset_id FROM asset_check ac)
            AND a.status NOT IN ('จำหน่ายแล้ว')
        ";
        
        $count_stmt = $this->conn->prepare($count_query);
        $count_stmt->execute();
        
        $counts_by_type = [
            'overdue_check' => 0,
            'upcoming_check' => 0,
            'active_borrow' => 0,
            'never_checked' => 0
        ];
        $total_count = 0;
        
        while ($row = $count_stmt->fetch(PDO::FETCH_ASSOC)) {
            $counts_by_type[$row['type']] = (int)$row['cnt'];
            $total_count += (int)$row['cnt'];
        }

        $total_pages = ceil($total_count / $limit);

        // Data query using UNION ALL for true global pagination and sorting
        $query = "
            SELECT * FROM (
                SELECT 
                    'overdue_check' AS type,
                    1 AS priority,
                    'alert-circle' AS icon,
                    '#EF4444' AS color,
                    '#FEE2E2' AS bgColor,
                    a.asset_id,
                    a.asset_name,
                    CONCAT('เกินกำหนดตรวจสอบ ', DATEDIFF(CURDATE(), ast.next_check_date), ' วัน') AS message,
                    IF(l.building_name IS NOT NULL AND l.building_name != '', CONCAT(l.building_name, ' ชั้น ', IFNULL(l.floor, '-'), ' ห้อง ', IFNULL(l.room_number, '-')), '') AS detail,
                    ast.next_check_date AS notification_date
                FROM " . $this->asset_schedules_table . " ast
                INNER JOIN assets a ON ast.asset_id = a.asset_id
                LEFT JOIN locations l ON a.location_id = l.location_id
                WHERE ast.next_check_date < CURDATE() AND ast.is_dismissed = 0

                UNION ALL

                SELECT 
                    'upcoming_check' AS type,
                    2 AS priority,
                    'time' AS icon,
                    '#F59E0B' AS color,
                    '#FEF3C7' AS bgColor,
                    a.asset_id,
                    a.asset_name,
                    CASE 
                        WHEN DATEDIFF(ast.next_check_date, CURDATE()) = 0 THEN 'ครบกำหนดตรวจสอบวันนี้'
                        ELSE CONCAT('อีก ', DATEDIFF(ast.next_check_date, CURDATE()), ' วันถึงกำหนดตรวจสอบ')
                    END AS message,
                    IF(l.building_name IS NOT NULL AND l.building_name != '', CONCAT(l.building_name, ' ชั้น ', IFNULL(l.floor, '-'), ' ห้อง ', IFNULL(l.room_number, '-')), '') AS detail,
                    ast.next_check_date AS notification_date
                FROM " . $this->asset_schedules_table . " ast
                INNER JOIN assets a ON ast.asset_id = a.asset_id
                LEFT JOIN locations l ON a.location_id = l.location_id
                WHERE DATEDIFF(ast.next_check_date, CURDATE()) <= 30 AND DATEDIFF(ast.next_check_date, CURDATE()) >= 0 AND ast.is_dismissed = 0

                UNION ALL

                SELECT 
                    'active_borrow' AS type,
                    3 AS priority,
                    'swap-horizontal' AS icon,
                    '#8B5CF6' AS color,
                    '#EDE9FE' AS bgColor,
                    a.asset_id,
                    a.asset_name,
                    CONCAT('ยืมโดย ', IFNULL(b.borrower_name, '-'), ' (', DATEDIFF(CURDATE(), b.borrow_date), ' วัน)') AS message,
                    CONCAT('ยืมตั้งแต่ ', DATE_FORMAT(b.borrow_date, '%Y-%m-%d')) AS detail,
                    b.borrow_date AS notification_date
                FROM borrow b
                INNER JOIN assets a ON b.asset_id = a.asset_id
                WHERE b.status = 'ยืม'

                UNION ALL

                SELECT 
                    'never_checked' AS type,
                    4 AS priority,
                    'warning' AS icon,
                    '#F97316' AS color,
                    '#FFF7ED' AS bgColor,
                    a.asset_id,
                    a.asset_name,
                    CONCAT('ยังไม่เคยตรวจสอบ (เพิ่มมาแล้ว ', DATEDIFF(CURDATE(), a.created_at), ' วัน)') AS message,
                    IF(l.building_name IS NOT NULL AND l.building_name != '', CONCAT(l.building_name, ' ชั้น ', IFNULL(l.floor, '-'), ' ห้อง ', IFNULL(l.room_number, '-')), '') AS detail,
                    a.created_at AS notification_date
                FROM assets a
                LEFT JOIN locations l ON a.location_id = l.location_id
                WHERE a.asset_id NOT IN (SELECT DISTINCT ac.asset_id FROM asset_check ac)
                AND a.status NOT IN ('จำหน่ายแล้ว')
            ) AS combined_notifications
            ORDER BY priority ASC, notification_date ASC
            LIMIT :offset, :limit
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $items = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = $row;
        }
        
        return [
            'items' => $items,
            'counts_by_type' => $counts_by_type,
            'pagination' => [
                'total' => $total_count,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => $total_pages
            ]
        ];
    }
}
?>