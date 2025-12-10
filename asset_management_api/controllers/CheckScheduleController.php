<?php
require_once 'config/database.php';
require_once 'models/CheckSchedule.php';
require_once 'utils/Response.php';

class CheckScheduleController {
    private $db;
    private $checkSchedule;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->checkSchedule = new CheckSchedule($this->db);
    }

    // ดึงรอบการตรวจทั้งหมด
    public function getAllSchedules() {
        try {
            $stmt = $this->checkSchedule->getAllSchedules();
            $schedules = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $schedules[] = $row;
            }
            Response::success('ดึงข้อมูลรอบการตรวจสำเร็จ', $schedules);
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // กำหนดรอบการตรวจให้ครุภัณฑ์
    public function assignToAsset() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->asset_id) || (empty($data->schedule_id) && empty($data->custom_interval_months))) {
                Response::error('กรุณาระบุข้อมูลให้ครบถ้วน', 400);
                return;
            }

            $result = $this->checkSchedule->assignToAsset(
                $data->asset_id,
                $data->schedule_id ?? null,
                $data->custom_interval_months ?? null
            );

            if ($result) {
                Response::success('กำหนดรอบการตรวจสำเร็จ');
            } else {
                Response::error('ไม่สามารถกำหนดรอบการตรวจได้', 500);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // กำหนดรอบการตรวจทั้งห้อง
    public function assignToLocation() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->location_id)) {
                Response::error('กรุณาระบุสถานที่', 400);
                return;
            }

            $success_count = $this->checkSchedule->assignToLocation(
                $data->location_id,
                $data->schedule_id ?? null,
                $data->custom_interval_months ?? null
            );

            if ($success_count > 0) {
                Response::success("กำหนดรอบการตรวจสำเร็จ ({$success_count} รายการ)");
            } else {
                Response::error('ไม่พบครุภัณฑ์ในห้องนี้', 404);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // ดึงการแจ้งเตือน
    public function getNotifications() {
        try {
            $days = $_GET['days'] ?? 30;
            $stmt = $this->checkSchedule->getNotifications($days);
            $notifications = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $notifications[] = $row;
            }
            Response::success('ดึงการแจ้งเตือนสำเร็จ', $notifications);
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // ดึงรายการเลยกำหนด
    public function getOverdue() {
        try {
            $stmt = $this->checkSchedule->getOverdue();
            $overdue = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $overdue[] = $row;
            }
            Response::success('ดึงรายการเลยกำหนดสำเร็จ', $overdue);
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }
}
?>