<?php
require_once 'config/database.php';
require_once 'models/AssetHistory.php';
require_once 'models/AuditTrail.php';
require_once 'utils/Response.php';

class AssetHistoryController {
    private $db;
    private $assetHistory;
    private $auditTrail;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->assetHistory = new AssetHistory($this->db);
        $this->auditTrail = new AuditTrail($this->db);
    }

    public function getAll() {
        $stmt = $this->assetHistory->readAll();
        $history = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $history[] = $row;
        }

        Response::success('ดึงประวัติการเคลื่อนย้ายสำเร็จ', $history);
    }

    public function getByAsset($asset_id) {
        $this->assetHistory->asset_id = $asset_id;
        $stmt = $this->assetHistory->readByAsset();
        $history = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $history[] = $row;
        }

        Response::success('ดึงประวัติการเคลื่อนย้ายสำเร็จ', $history);
    }

    public function create($user_data) {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->asset_id) && !empty($data->new_location_id)) {
            $this->assetHistory->asset_id = $data->asset_id;
            $this->assetHistory->old_location_id = $data->old_location_id ?? null;
            $this->assetHistory->new_location_id = $data->new_location_id;
            $this->assetHistory->moved_by = $user_data['user_id'];
            $this->assetHistory->move_date = $data->move_date ?? date('Y-m-d');
            $this->assetHistory->remark = $data->remark ?? '';

            $id = $this->assetHistory->create();
            
            if ($id) {
                // บันทึก Audit Trail
                $this->auditTrail->user_id = $user_data['user_id'];
                $this->auditTrail->asset_id = $data->asset_id;
                $this->auditTrail->action = 'Move';
                $this->auditTrail->old_value = json_encode(['location_id' => $data->old_location_id]);
                $this->auditTrail->new_value = json_encode(['location_id' => $data->new_location_id]);
                $this->auditTrail->create();

                Response::success('บันทึกการเคลื่อนย้ายสำเร็จ', ['history_id' => $id]);
            } else {
                Response::error('ไม่สามารถบันทึกการเคลื่อนย้ายได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }
}
?>