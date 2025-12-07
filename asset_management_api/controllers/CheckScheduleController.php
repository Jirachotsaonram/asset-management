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

        if (empty($data->name) || empty($data->check_interval_months)) {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
            return;
        }

        $query = "INSERT INTO Check_Schedules 
                  (name, check_interval_months, notify_before_days) 
                  VALUES (:name, :interval, :notify_days)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':interval', $data->check_interval_months);
        $notify_days = $data->notify_before_days ?? 30;
        $stmt->bindParam(':notify_days', $notify_days);

        if ($stmt->execute()) {
            Response::success('เพิ่มรอบการตรวจสำเร็จ', ['schedule_id' => $this->conn->lastInsertId()]);
        } else {
            Response::error('ไม่สามารถเพิ่มได้', 500);
        }
    }

    // กำหนดรอบการตรวจให้กับครุภัณฑ์รายชิ้น
    public function assignToAsset() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->asset_id) || empty($data->schedule_id)) {
            Response::error('กรุณาระบุ asset_id และ schedule_id', 400);
            return;
        }

        // ดึงข้อมูลรอบการตรวจ
        $scheduleQuery = "SELECT check_interval_months FROM Check_Schedules WHERE schedule_id = :schedule_id";
        $scheduleStmt = $this->conn->prepare($scheduleQuery);
        $scheduleStmt->bindParam(':schedule_id', $data->schedule_id);
        $scheduleStmt->execute();
        $schedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);

        if (!$schedule) {
            Response::error('ไม่พบรอบการตรวจที่ระบุ', 404);
            return;
        }

        // หาวันที่ตรวจล่าสุด
        $lastCheckQuery = "SELECT MAX(check_date) as last_check FROM Asset_Check WHERE asset_id = :asset_id";
        $lastCheckStmt = $this->conn->prepare($lastCheckQuery);
        $lastCheckStmt->bindParam(':asset_id', $data->asset_id);
        $lastCheckStmt->execute();
        $lastCheck = $lastCheckStmt->fetch(PDO::FETCH_ASSOC);

        $lastCheckDate = $lastCheck['last_check'] ?? date('Y-m-d');
        $nextCheckDate = date('Y-m-d', strtotime("+{$schedule['check_interval_months']} months", strtotime($lastCheckDate)));

        // ลบรอบเดิม (ถ้ามี)
        $deleteQuery = "DELETE FROM Asset_Schedule WHERE asset_id = :asset_id";
        $deleteStmt = $this->conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':asset_id', $data->asset_id);
        $deleteStmt->execute();

        // เพิ่มรอบใหม่
        $insertQuery = "INSERT INTO Asset_Schedule 
                        (asset_id, schedule_id, last_check_date, next_check_date) 
                        VALUES (:asset_id, :schedule_id, :last_check, :next_check)";
        
        $insertStmt = $this->conn->prepare($insertQuery);
        $insertStmt->bindParam(':asset_id', $data->asset_id);
        $insertStmt->bindParam(':schedule_id', $data->schedule_id);
        $insertStmt->bindParam(':last_check', $lastCheckDate);
        $insertStmt->bindParam(':next_check', $nextCheckDate);

        if ($insertStmt->execute()) {
            Response::success('กำหนดรอบการตรวจสำเร็จ', [
                'next_check_date' => $nextCheckDate
            ]);
        } else {
            Response::error('ไม่สามารถกำหนดรอบได้', 500);
        }
    }

    // กำหนดรอบการตรวจให้กับสถานที่ทั้งหมด (แบบกลุ่ม)
    public function assignToLocation() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->location_id) || empty($data->schedule_id)) {
            Response::error('กรุณาระบุ location_id และ schedule_id', 400);
            return;
        }

        // ลบรอบเดิม
        $deleteQuery = "DELETE FROM Location_Schedule WHERE location_id = :location_id";
        $deleteStmt = $this->conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':location_id', $data->location_id);
        $deleteStmt->execute();

        // เพิ่มรอบใหม่
        $insertQuery = "INSERT INTO Location_Schedule (location_id, schedule_id) 
                        VALUES (:location_id, :schedule_id)";
        
        $insertStmt = $this->conn->prepare($insertQuery);
        $insertStmt->bindParam(':location_id', $data->location_id);
        $insertStmt->bindParam(':schedule_id', $data->schedule_id);

        if ($insertStmt->execute()) {
            // อัปเดต next_check_date ให้กับครุภัณฑ์ทั้งหมดในสถานที่นี้
            $this->updateAssetsInLocation($data->location_id, $data->schedule_id);
            Response::success('กำหนดรอบการตรวจแบบกลุ่มสำเร็จ');
        } else {
            Response::error('ไม่สามารถกำหนดรอบได้', 500);
        }
    }

    // อัปเดตครุภัณฑ์ทั้งหมดในสถานที่
    private function updateAssetsInLocation($locationId, $scheduleId) {
        // ดึงข้อมูลรอบการตรวจ
        $scheduleQuery = "SELECT check_interval_months FROM Check_Schedules WHERE schedule_id = :schedule_id";
        $scheduleStmt = $this->conn->prepare($scheduleQuery);
        $scheduleStmt->bindParam(':schedule_id', $scheduleId);
        $scheduleStmt->execute();
        $schedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);

        // ดึงครุภัณฑ์ทั้งหมดในสถานที่นี้
        $assetsQuery = "SELECT asset_id FROM Assets WHERE location_id = :location_id";
        $assetsStmt = $this->conn->prepare($assetsQuery);
        $assetsStmt->bindParam(':location_id', $locationId);
        $assetsStmt->execute();

        while ($asset = $assetsStmt->fetch(PDO::FETCH_ASSOC)) {
            // หาวันที่ตรวจล่าสุด
            $lastCheckQuery = "SELECT MAX(check_date) as last_check FROM Asset_Check WHERE asset_id = :asset_id";
            $lastCheckStmt = $this->conn->prepare($lastCheckQuery);
            $lastCheckStmt->bindParam(':asset_id', $asset['asset_id']);
            $lastCheckStmt->execute();
            $lastCheck = $lastCheckStmt->fetch(PDO::FETCH_ASSOC);

            $lastCheckDate = $lastCheck['last_check'] ?? date('Y-m-d');
            $nextCheckDate = date('Y-m-d', strtotime("+{$schedule['check_interval_months']} months", strtotime($lastCheckDate)));

            // ลบรอบเดิม
            $deleteQuery = "DELETE FROM Asset_Schedule WHERE asset_id = :asset_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':asset_id', $asset['asset_id']);
            $deleteStmt->execute();

            // เพิ่มรอบใหม่
            $insertQuery = "INSERT INTO Asset_Schedule 
                            (asset_id, schedule_id, last_check_date, next_check_date) 
                            VALUES (:asset_id, :schedule_id, :last_check, :next_check)";
            
            $insertStmt = $this->conn->prepare($insertQuery);
            $insertStmt->bindParam(':asset_id', $asset['asset_id']);
            $insertStmt->bindParam(':schedule_id', $scheduleId);
            $insertStmt->bindParam(':last_check', $lastCheckDate);
            $insertStmt->bindParam(':next_check', $nextCheckDate);
            $insertStmt->execute();
        }
    }

    // ดึงครุภัณฑ์ที่ต้องการแจ้งเตือน
    public function getNotifications() {
        $query = "SELECT 
                    a.asset_id,
                    a.asset_name,
                    sch.next_check_date,
                    cs.name as schedule_name,
                    cs.notify_before_days,
                    DATEDIFF(sch.next_check_date, CURDATE()) as days_until_check,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name
                FROM Asset_Schedule sch
                JOIN Assets a ON sch.asset_id = a.asset_id
                JOIN Check_Schedules cs ON sch.schedule_id = cs.schedule_id
                LEFT JOIN Locations l ON a.location_id = l.location_id
                LEFT JOIN Departments d ON a.department_id = d.department_id
                WHERE cs.is_active = 1
                  AND DATEDIFF(sch.next_check_date, CURDATE()) <= cs.notify_before_days
                  AND DATEDIFF(sch.next_check_date, CURDATE()) >= 0
                ORDER BY sch.next_check_date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงการแจ้งเตือนสำเร็จ', $notifications);
    }

    // ดึงครุภัณฑ์ที่เลยกำหนดตรวจ
    public function getOverdue() {
        $query = "SELECT 
                    a.asset_id,
                    a.asset_name,
                    sch.next_check_date,
                    cs.name as schedule_name,
                    DATEDIFF(CURDATE(), sch.next_check_date) as days_overdue,
                    l.building_name,
                    l.floor,
                    l.room_number,
                    d.department_name
                FROM Asset_Schedule sch
                JOIN Assets a ON sch.asset_id = a.asset_id
                JOIN Check_Schedules cs ON sch.schedule_id = cs.schedule_id
                LEFT JOIN Locations l ON a.location_id = l.location_id
                LEFT JOIN Departments d ON a.department_id = d.department_id
                WHERE cs.is_active = 1
                  AND sch.next_check_date < CURDATE()
                ORDER BY sch.next_check_date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $overdue = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success('ดึงรายการเลยกำหนดสำเร็จ', $overdue);
    }
}
?>