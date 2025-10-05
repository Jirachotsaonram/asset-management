<?php
require_once 'config/database.php';
require_once 'models/AssetCheck.php';
require_once 'models/AuditTrail.php';
require_once 'utils/Response.php';

class AssetCheckController {
    private $db;
    private $assetCheck;
    private $auditTrail;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->assetCheck = new AssetCheck($this->db);
        $this->auditTrail = new AuditTrail($this->db);
    }

    public function getAll() {
        $stmt = $this->assetCheck->readAll();
        $checks = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $checks[] = $row;
        }

        Response::success('ดึงข้อมูลการตรวจสอบสำเร็จ', $checks);
    }

    public function getByAsset($asset_id) {
        $this->assetCheck->asset_id = $asset_id;
        $stmt = $this->assetCheck->readByAsset();
        $checks = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $checks[] = $row;
        }

        Response::success('ดึงประวัติการตรวจสอบสำเร็จ', $checks);
    }

    public function getUnchecked() {
        $stmt = $this->assetCheck->getUncheckedAssets();
        $assets = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $assets[] = $row;
        }

        Response::success('ดึงรายการครุภัณฑ์ที่ยังไม่ได้ตรวจสำเร็จ', $assets);
    }

    public function create($user_data) {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->asset_id) && !empty($data->check_status)) {
            $this->assetCheck->asset_id = $data->asset_id;
            $this->assetCheck->user_id = $user_data['user_id'];
            $this->assetCheck->check_date = $data->check_date ?? date('Y-m-d');
            $this->assetCheck->check_status = $data->check_status;
            $this->assetCheck->remark = $data->remark ?? '';

            $id = $this->assetCheck->create();
            
            if ($id) {
                // บันทึก Audit Trail
                $this->auditTrail->user_id = $user_data['user_id'];
                $this->auditTrail->asset_id = $data->asset_id;
                $this->auditTrail->action = 'Check';
                $this->auditTrail->old_value = null;
                $this->auditTrail->new_value = json_encode([
                    'check_status' => $data->check_status,
                    'remark' => $data->remark ?? ''
                ]);
                $this->auditTrail->create();

                Response::success('บันทึกการตรวจสอบสำเร็จ', ['check_id' => $id]);
            } else {
                Response::error('ไม่สามารถบันทึกการตรวจสอบได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }
}
?>