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

            // ตรวจสอบว่า asset_id มีอยู่จริงหรือไม่
            $checkAssetQuery = "SELECT asset_id, status FROM assets WHERE asset_id = :asset_id";
            $checkAssetStmt = $this->db->prepare($checkAssetQuery);
            $checkAssetStmt->bindParam(':asset_id', $data->asset_id);
            $checkAssetStmt->execute();
            $oldAsset = $checkAssetStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$oldAsset) {
                Response::error('ไม่พบครุภัณฑ์ที่ต้องการตรวจสอบ', 404);
                return;
            }
            
            $oldStatus = $oldAsset['status'];

            // เริ่ม transaction เพื่อให้แน่ใจว่าทั้งการบันทึก check และการอัพเดตสถานะสำเร็จพร้อมกัน
            $this->db->beginTransaction();
            
            try {
                $id = $this->assetCheck->create();
                
                if (!$id) {
                    throw new Exception('ไม่สามารถบันทึกการตรวจสอบได้');
                }
                
                // อัพเดตสถานะของครุภัณฑ์ตาม check_status
                // แปลง check_status เป็น status ของครุภัณฑ์
                $statusMap = [
                    'ใช้งานได้' => 'ใช้งานได้',
                    'รอซ่อม' => 'รอซ่อม',
                    'รอจำหน่าย' => 'รอจำหน่าย',
                    'จำหน่ายแล้ว' => 'จำหน่ายแล้ว',
                    'ไม่พบ' => 'ไม่พบ'
                ];
                
                $newStatus = isset($statusMap[$data->check_status]) 
                    ? $statusMap[$data->check_status] 
                    : $data->check_status;

                // อัพเดตสถานะครุภัณฑ์ (อัพเดตแม้ว่าสถานะเดิมและใหม่จะเหมือนกันก็ตาม)
                $updateStatusQuery = "UPDATE assets SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE asset_id = :asset_id";
                $updateStatusStmt = $this->db->prepare($updateStatusQuery);
                $updateStatusStmt->bindParam(':status', $newStatus);
                $updateStatusStmt->bindParam(':asset_id', $data->asset_id);
                
                if (!$updateStatusStmt->execute()) {
                    throw new Exception('ไม่สามารถอัพเดตสถานะครุภัณฑ์ได้');
                }
                
                // ไม่ต้องตรวจสอบ rowCount() เพราะถ้าสถานะเดิมและใหม่เหมือนกัน MySQL จะ return 0 rows affected
                // แต่เรายังคงต้องอัพเดต updated_at เพื่อให้ระบบรู้ว่ามีการตรวจสอบ

                // บันทึก Audit Trail
                $this->auditTrail->user_id = $user_data['user_id'];
                $this->auditTrail->asset_id = $data->asset_id;
                $this->auditTrail->action = 'Check';
                $this->auditTrail->old_value = json_encode([
                    'status' => $oldStatus
                ]);
                $this->auditTrail->new_value = json_encode([
                    'status' => $newStatus,
                    'check_status' => $data->check_status,
                    'remark' => $data->remark ?? ''
                ]);
                $this->auditTrail->create();

                // commit transaction
                $this->db->commit();
                
                Response::success('บันทึกการตรวจสอบสำเร็จ', ['check_id' => $id]);
            } catch (Exception $e) {
                // rollback transaction ถ้ามี error
                $this->db->rollBack();
                error_log('Error in AssetCheckController::create: ' . $e->getMessage());
                Response::error('ไม่สามารถบันทึกการตรวจสอบได้: ' . $e->getMessage(), 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }
}
?>