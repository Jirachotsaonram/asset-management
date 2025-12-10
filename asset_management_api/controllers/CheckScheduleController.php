<?php
// FILE: asset_management_api/controllers/CheckScheduleController.php

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

    // ========================================
    // ดึงรอบการตรวจทั้งหมด
    // GET /check-schedules
    // ========================================
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

    // ========================================
    // สร้างรอบการตรวจใหม่
    // POST /check-schedules
    // ========================================
    public function createSchedule() {
        try {
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->name) || empty($data->check_interval_months)) {
                Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
                return;
            }

            $this->checkSchedule->name = $data->name;
            $this->checkSchedule->check_interval_months = $data->check_interval_months;
            $this->checkSchedule->notify_before_days = $data->notify_before_days ?? 14;

            $id = $this->checkSchedule->createSchedule();

            if ($id) {
                Response::success('สร้างรอบการตรวจสำเร็จ', ['schedule_id' => $id]);
            } else {
                Response::error('ไม่สามารถสร้างรอบการตรวจได้', 500);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // ========================================
    // อัปเดตรอบการตรวจหลังจากบันทึกการตรวจสอบ
    // เรียกใช้จาก AssetCheckController
    // ========================================
    public function updateAfterCheck($asset_id) {
        return $this->checkSchedule->updateAfterCheck($asset_id);
    }

    // ========================================
    // กำหนดรอบการตรวจให้ครุภัณฑ์
    // POST /check-schedules/assign-asset
    // Body: { asset_id, schedule_id, custom_interval_months?, custom_next_date?, notify_before_days? }
    // ========================================
    public function assignToAsset() {
        try {
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->asset_id)) {
                Response::error('กรุณาระบุรหัสครุภัณฑ์', 400);
                return;
            }

            // ต้องมีอย่างน้อย schedule_id หรือ custom_interval_months หรือ custom_next_date
            if (empty($data->schedule_id) && empty($data->custom_interval_months) && empty($data->custom_next_date)) {
                Response::error('กรุณาระบุรอบการตรวจหรือกำหนดเอง', 400);
                return;
            }

            $schedule_id = $data->schedule_id ?? null;
            $custom_interval = $data->custom_interval_months ?? null;
            $custom_next_date = $data->custom_next_date ?? null;

            $result = $this->checkSchedule->assignToAsset(
                $data->asset_id,
                $schedule_id,
                $custom_interval,
                $custom_next_date
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

    // ========================================
    // กำหนดรอบการตรวจให้ทั้งห้อง
    // POST /check-schedules/assign-location
    // Body: { location_id, schedule_id, custom_interval_months? }
    // ========================================
    public function assignToLocation() {
        try {
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->location_id)) {
                Response::error('กรุณาระบุสถานที่', 400);
                return;
            }

            if (empty($data->schedule_id) && empty($data->custom_interval_months)) {
                Response::error('กรุณาระบุรอบการตรวจหรือกำหนดเอง', 400);
                return;
            }

            $schedule_id = $data->schedule_id ?? null;
            $custom_interval = $data->custom_interval_months ?? null;

            $success_count = $this->checkSchedule->assignToLocation(
                $data->location_id,
                $schedule_id,
                $custom_interval
            );

            if ($success_count > 0) {
                Response::success("กำหนดรอบการตรวจสำเร็จ ({$success_count} รายการ)", [
                    'affected_count' => $success_count
                ]);
            } else {
                Response::error('ไม่พบครุภัณฑ์ในห้องนี้', 404);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // ========================================
    // ดึงการแจ้งเตือน
    // GET /check-schedules/notifications?days=30
    // ========================================
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

    // ========================================
    // ดึงรายการเลยกำหนด
    // GET /check-schedules/overdue
    // ========================================
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

    // ========================================
    // ซ่อนการแจ้งเตือน
    // POST /check-schedules/dismiss
    // Body: { asset_schedule_id }
    // ========================================
    public function dismissNotification() {
        try {
            $data = json_decode(file_get_contents("php://input"));

            if (empty($data->asset_schedule_id)) {
                Response::error('กรุณาระบุรหัสการแจ้งเตือน', 400);
                return;
            }

            $result = $this->checkSchedule->dismissNotification($data->asset_schedule_id);

            if ($result) {
                Response::success('ซ่อนการแจ้งเตือนสำเร็จ');
            } else {
                Response::error('ไม่สามารถซ่อนการแจ้งเตือนได้', 500);
            }
        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }
}
?>