<?php
// FILE: asset_management_api/controllers/CheckScheduleController.php
require_once 'config/database.php';
require_once 'utils/Response.php';

class CheckScheduleController {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // ดึงรายการรอบการตรวจทั้งหมด
    public function getAllSchedules() {
        $query = "SELECT * FROM Check_Schedules WHERE is_active = 1 ORDER BY check_interval_months";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงข้อมูลสำเร็จ', $schedules);
    }

    // เพิ่มรอบการตรวจใหม่
    public function createSchedule() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->name)) {
            Response::error('กรุณากรอกชื่อรอบการตรวจ', 400);
            return;
        }

        // ถ้าเป็น custom schedule
        $is_custom = isset($data->is_custom) ? $data->is_custom : 0;
        $custom_next_date = isset($data->custom_next_date) ? $data->custom_next_date : null;
        $check_interval = isset($data->check_interval_months) ? $data->check_interval_months : 1;

        $query = "INSERT INTO Check_Schedules 
                  (name, check_interval_months, notify_before_days, is_custom, custom_next_date) 
                  VALUES (:name, :interval, :notify_days, :is_custom, :custom_next_date)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':interval', $check_interval);
        $notify_days = $data->notify_before_days ?? 14;
        $stmt->bindParam(':notify_days', $notify_days);
        $stmt->bindParam(':is_custom', $is_custom);
        $stmt->bindParam(':custom_next_date', $custom_next_date);

        if ($stmt->execute()) {
            Response::success('เพิ่มรอบการตรวจสำเร็จ', ['schedule_id' => $this->conn->lastInsertId()]);
        } else {
            Response::error('ไม่สามารถเพิ่มได้', 500);
        }
    }

    // กำหนดรอบการตรวจให้กับครุภัณฑ์รายชิ้น (รองรับ custom interval)
    public function assignToAsset() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->asset_id)) {
            Response::error('กรุณาระบุ asset_id', 400);
            return;
        }

        // รองรับทั้ง schedule_id และ custom interval
        $schedule_id = $data->schedule_id ?? 1; // default schedule
        $custom_interval_months = $data->custom_interval_months ?? null;
        $notify_before_days = $data->notify_before_days ?? 14;
        $custom_next_date = $data->custom_next_date ?? null;

        // หาวันที่ตรวจล่าสุด
        $lastCheckQuery = "SELECT MAX(check_date) as last_check FROM Asset_Check WHERE asset_id = :asset_id";
        $lastCheckStmt = $this->conn->prepare($lastCheckQuery);
        $lastCheckStmt->bindParam(':asset_id', $data->asset_id);
        $lastCheckStmt->execute();
        $lastCheck = $lastCheckStmt->fetch(PDO::FETCH_ASSOC);

        $lastCheckDate = $lastCheck['last_check'] ?? date('Y-m-d');

        // คำนวณ next_check_date
        if ($custom_next_date) {
            // ใช้วันที่กำหนดเอง
            $nextCheckDate = $custom_next_date;
        } elseif ($custom_interval_months) {
            // ใช้ช่วงเวลากำหนดเอง
            $nextCheckDate = date('Y-m-d', strtotime("+{$custom_interval_months} months", strtotime($lastCheckDate)));
        } else {
            // ใช้ schedule ปกติ
            $scheduleQuery = "SELECT check_interval_months FROM Check_Schedules WHERE schedule_id = :schedule_id";
            $scheduleStmt = $this->conn->prepare($scheduleQuery);
            $scheduleStmt->bindParam(':schedule_id', $schedule_id);
            $scheduleStmt->execute();
            $schedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);

            if (!$schedule) {
                Response::error('ไม่พบรอบการตรวจที่ระบุ', 404);
                return;
            }

            $nextCheckDate = date('Y-m-d', strtotime("+{$schedule['check_interval_months']} months", strtotime($lastCheckDate)));
        }

        // ลบรอบเดิม (ถ้ามี)
        $deleteQuery = "DELETE FROM Asset_Schedule WHERE asset_id = :asset_id";
        $deleteStmt = $this->conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':asset_id', $data->asset_id);
        $deleteStmt->execute();

        // เพิ่มรอบใหม่
        $insertQuery = "INSERT INTO Asset_Schedule 
                        (asset_id, schedule_id, last_check_date, next_check_date, custom_interval_months, notify_before_days) 
                        VALUES (:asset_id, :schedule_id, :last_check, :next_check, :custom_interval, :notify_days)";
        
        $insertStmt = $this->conn->prepare($insertQuery);
        $insertStmt->bindParam(':asset_id', $data->asset_id);
        $insertStmt->bindParam(':schedule_id', $schedule_id);
        $insertStmt->bindParam(':last_check', $lastCheckDate);
        $insertStmt->bindParam(':next_check', $nextCheckDate);
        $insertStmt->bindParam(':custom_interval', $custom_interval_months);
        $insertStmt->bindParam(':notify_days', $notify_before_days);

        if ($insertStmt->execute()) {
            Response::success('กำหนดรอบการตรวจสำเร็จ', [
                'next_check_date' => $nextCheckDate,
                'custom_interval_months' => $custom_interval_months,
                'notify_before_days' => $notify_before_days
            ]);
        } else {
            Response::error('ไม่สามารถกำหนดรอบได้', 500);
        }
    }

    // กำหนดรอบการตรวจให้กับสถานที่ทั้งหมด (แบบกลุ่ม) - ไม่ใช้ location_schedule แล้ว
    public function assignToLocation() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->location_id)) {
            Response::error('กรุณาระบุ location_id', 400);
            return;
        }

        $schedule_id = $data->schedule_id ?? 1;
        $custom_interval_months = $data->custom_interval_months ?? null;
        $notify_before_days = $data->notify_before_days ?? 14;
        $custom_next_date = $data->custom_next_date ?? null;

        // อัปเดตครุภัณฑ์ทั้งหมดในสถานที่นี้
        $result = $this->updateAssetsInLocation(
            $data->location_id, 
            $schedule_id, 
            $custom_interval_months, 
            $notify_before_days,
            $custom_next_date
        );

        if ($result) {
            Response::success('กำหนดรอบการตรวจแบบกลุ่มสำเร็จ', $result);
        } else {
            Response::error('ไม่สามารถกำหนดรอบได้', 500);
        }
    }

    // อัปเดตครุภัณฑ์ทั้งหมดในสถานที่
    private function updateAssetsInLocation($locationId, $scheduleId, $customInterval = null, $notifyDays = 14, $customNextDate = null) {
        // ดึงครุภัณฑ์ทั้งหมดในสถานที่นี้
        $assetsQuery = "SELECT asset_id FROM Assets WHERE location_id = :location_id";
        $assetsStmt = $this->conn->prepare($assetsQuery);
        $assetsStmt->bindParam(':location_id', $locationId);
        $assetsStmt->execute();

        $updated = 0;
        $errors = 0;

        while ($asset = $assetsStmt->fetch(PDO::FETCH_ASSOC)) {
            // หาวันที่ตรวจล่าสุด
            $lastCheckQuery = "SELECT MAX(check_date) as last_check FROM Asset_Check WHERE asset_id = :asset_id";
            $lastCheckStmt = $this->conn->prepare($lastCheckQuery);
            $lastCheckStmt->bindParam(':asset_id', $asset['asset_id']);
            $lastCheckStmt->execute();
            $lastCheck = $lastCheckStmt->fetch(PDO::FETCH_ASSOC);

            $lastCheckDate = $lastCheck['last_check'] ?? date('Y-m-d');

            // คำนวณ next_check_date
            if ($customNextDate) {
                $nextCheckDate = $customNextDate;
            } elseif ($customInterval) {
                $nextCheckDate = date('Y-m-d', strtotime("+{$customInterval} months", strtotime($lastCheckDate)));
            } else {
                $scheduleQuery = "SELECT check_interval_months FROM Check_Schedules WHERE schedule_id = :schedule_id";
                $scheduleStmt = $this->conn->prepare($scheduleQuery);
                $scheduleStmt->bindParam(':schedule_id', $scheduleId);
                $scheduleStmt->execute();
                $schedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);

                if (!$schedule) continue;

                $nextCheckDate = date('Y-m-d', strtotime("+{$schedule['check_interval_months']} months", strtotime($lastCheckDate)));
            }

            // ลบรอบเดิม
            $deleteQuery = "DELETE FROM Asset_Schedule WHERE asset_id = :asset_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':asset_id', $asset['asset_id']);
            $deleteStmt->execute();

            // เพิ่มรอบใหม่
            $insertQuery = "INSERT INTO Asset_Schedule 
                            (asset_id, schedule_id, last_check_date, next_check_date, custom_interval_months, notify_before_days) 
                            VALUES (:asset_id, :schedule_id, :last_check, :next_check, :custom_interval, :notify_days)";
            
            $insertStmt = $this->conn->prepare($insertQuery);
            $insertStmt->bindParam(':asset_id', $asset['asset_id']);
            $insertStmt->bindParam(':schedule_id', $scheduleId);
            $insertStmt->bindParam(':last_check', $lastCheckDate);
            $insertStmt->bindParam(':next_check', $nextCheckDate);
            $insertStmt->bindParam(':custom_interval', $customInterval);
            $insertStmt->bindParam(':notify_days', $notifyDays);

            if ($insertStmt->execute()) {
                $updated++;
            } else {
                $errors++;
            }
        }

        return [
            'updated' => $updated,
            'errors' => $errors
        ];
    }

    // ดึงครุภัณฑ์ที่ต้องการแจ้งเตือน (ปรับให้ไม่หายหลังตรวจ)
    public function getNotifications() {
        $query = "SELECT 
                    asch.asset_schedule_id,
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    asch.next_check_date,
                    asch.last_check_date,
                    cs.name as schedule_name,
                    COALESCE(asch.notify_before_days, cs.notify_before_days, 14) as notify_before_days,
                    DATEDIFF(asch.next_check_date, CURDATE()) as days_until_check,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name,
                    CASE 
                        WHEN DATEDIFF(asch.next_check_date, CURDATE()) < 0 THEN 'เลยกำหนด'
                        WHEN DATEDIFF(asch.next_check_date, CURDATE()) = 0 THEN 'วันนี้'
                        WHEN DATEDIFF(asch.next_check_date, CURDATE()) <= 7 THEN 'เร่งด่วน'
                        ELSE 'ปกติ'
                    END as urgency_level,
                    asch.is_notified,
                    asch.notification_date
                FROM Asset_Schedule asch
                JOIN Assets a ON asch.asset_id = a.asset_id
                LEFT JOIN Check_Schedules cs ON asch.schedule_id = cs.schedule_id
                LEFT JOIN Locations l ON a.location_id = l.location_id
                LEFT JOIN Departments d ON a.department_id = d.department_id
                WHERE COALESCE(cs.is_active, 1) = 1
                  AND DATEDIFF(asch.next_check_date, CURDATE()) <= COALESCE(asch.notify_before_days, cs.notify_before_days, 14)
                  AND DATEDIFF(asch.next_check_date, CURDATE()) >= -30
                ORDER BY 
                  CASE 
                    WHEN DATEDIFF(asch.next_check_date, CURDATE()) < 0 THEN 0
                    ELSE 1
                  END,
                  asch.next_check_date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงการแจ้งเตือนสำเร็จ', $notifications);
    }

    // ดึงครุภัณฑ์ที่เลยกำหนดตรวจ
    public function getOverdue() {
        $query = "SELECT 
                    asch.asset_schedule_id,
                    a.asset_id,
                    a.asset_name,
                    a.serial_number,
                    asch.next_check_date,
                    asch.last_check_date,
                    cs.name as schedule_name,
                    DATEDIFF(CURDATE(), asch.next_check_date) as days_overdue,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name
                FROM Asset_Schedule asch
                JOIN Assets a ON asch.asset_id = a.asset_id
                LEFT JOIN Check_Schedules cs ON asch.schedule_id = cs.schedule_id
                LEFT JOIN Locations l ON a.location_id = l.location_id
                LEFT JOIN Departments d ON a.department_id = d.department_id
                WHERE COALESCE(cs.is_active, 1) = 1
                  AND asch.next_check_date < CURDATE()
                ORDER BY asch.next_check_date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $overdue = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงรายการเลยกำหนดสำเร็จ', $overdue);
    }

    // Dismiss การแจ้งเตือน (ไม่ลบ แค่ซ่อน)
    public function dismissNotification() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->asset_schedule_id)) {
            Response::error('กรุณาระบุ asset_schedule_id', 400);
            return;
        }

        $query = "UPDATE Asset_Schedule 
                  SET is_notified = 1, notification_date = CURDATE()
                  WHERE asset_schedule_id = :asset_schedule_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':asset_schedule_id', $data->asset_schedule_id);

        if ($stmt->execute()) {
            Response::success('ซ่อนการแจ้งเตือนสำเร็จ');
        } else {
            Response::error('ไม่สามารถซ่อนได้', 500);
        }
    }

    // อัปเดต schedule หลังจากตรวจสอบแล้ว (เรียกจาก AssetCheckController)
    public function updateAfterCheck($asset_id, $check_date) {
        // ดึงข้อมูล schedule
        $query = "SELECT 
                    asch.asset_schedule_id,
                    asch.schedule_id,
                    asch.custom_interval_months,
                    cs.check_interval_months
                  FROM Asset_Schedule asch
                  LEFT JOIN Check_Schedules cs ON asch.schedule_id = cs.schedule_id
                  WHERE asch.asset_id = :asset_id
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':asset_id', $asset_id);
        $stmt->execute();
        $schedule = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$schedule) {
            return false; // ไม่มี schedule
        }

        // คำนวณ next_check_date
        $interval = $schedule['custom_interval_months'] ?? $schedule['check_interval_months'] ?? 12;
        $nextDate = date('Y-m-d', strtotime("+{$interval} months", strtotime($check_date)));

        // อัปเดต
        $updateQuery = "UPDATE Asset_Schedule
                        SET last_check_date = :check_date,
                            next_check_date = :next_date,
                            is_notified = 0,
                            notification_date = NULL
                        WHERE asset_id = :asset_id";
        
        $updateStmt = $this->conn->prepare($updateQuery);
        $updateStmt->bindParam(':check_date', $check_date);
        $updateStmt->bindParam(':next_date', $nextDate);
        $updateStmt->bindParam(':asset_id', $asset_id);

        return $updateStmt->execute();
    }
}
?>