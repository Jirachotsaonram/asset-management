<?php
require_once 'config/database.php';
require_once 'models/Borrow.php';
require_once 'models/AuditTrail.php';
require_once 'utils/Response.php';

class BorrowController {
    private $db;
    private $borrow;
    private $auditTrail;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->borrow = new Borrow($this->db);
        $this->auditTrail = new AuditTrail($this->db);
    }

    public function getAll() {
        // สนับสนุนทั้งแบบเดิม (ดึงทั้งหมด) และแบบใหม่ (แบ่งหน้า)
        if (isset($_GET['page'])) {
            $this->getReadPaginated();
        } else {
            $stmt = $this->borrow->readAll();
            $borrows = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $borrows[] = $row;
            }

            Response::success('ดึงข้อมูลการยืมสำเร็จ', $borrows);
        }
    }

    public function getReadPaginated() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;
        $search = $_GET['search'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $total = $this->borrow->getCount($search, $status);
        $stmt = $this->borrow->readPaginated($page, $limit, $search, $status);
        $borrows = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $borrows[] = $row;
        }

        Response::success('ดึงข้อมูลการยืมสำเร็จ', [
            'items' => $borrows,
            'total' => (int)$total,
            'page' => (int)$page,
            'limit' => (int)$limit
        ]);
    }

    public function getActive() {
        $stmt = $this->borrow->readActive();
        $borrows = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $borrows[] = $row;
        }

        Response::success('ดึงรายการที่กำลังยืมสำเร็จ', $borrows);
    }

    public function getByAsset($asset_id) {
        $this->borrow->asset_id = $asset_id;
        $stmt = $this->borrow->readByAsset();
        $borrows = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $borrows[] = $row;
        }

        Response::success('ดึงประวัติการยืมสำเร็จ', $borrows);
    }

    public function create($user_data) {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->asset_id) && !empty($data->borrower_name)) {
            $this->borrow->asset_id = $data->asset_id;
            $this->borrow->borrower_name = $data->borrower_name;
            $this->borrow->department_id = $data->department_id ?? null;
            $this->borrow->borrow_date = $data->borrow_date ?? date('Y-m-d');
            $this->borrow->return_date = $data->return_date ?? null;
            $this->borrow->due_date = $data->due_date ?? null;
            $this->borrow->status = 'ยืม';

            $id = $this->borrow->create();
            
            if ($id) {
                // อัปเดตสถานะครุภัณฑ์
                $stmt_asset = $this->db->prepare("UPDATE assets SET status = 'ยืม' WHERE asset_id = :asset_id");
                $stmt_asset->bindValue(":asset_id", $data->asset_id);
                $exec_success = $stmt_asset->execute();
                
                if (!$exec_success) {
                    error_log("BorrowController: Failed to update asset status to 'ยืม' for ID: " . $data->asset_id);
                } else if ($stmt_asset->rowCount() === 0) {
                    error_log("BorrowController: Asset status update to 'ยืม' affected 0 rows for ID: " . $data->asset_id);
                }

                // บันทึก Audit Trail
                $this->auditTrail->user_id = $user_data['user_id'];
                $this->auditTrail->asset_id = $data->asset_id;
                $this->auditTrail->action = 'Borrow';
                $this->auditTrail->old_value = null;
                $this->auditTrail->new_value = json_encode([
                    'borrower_name' => $data->borrower_name,
                    'borrow_date' => $data->borrow_date ?? date('Y-m-d')
                ]);
                $this->auditTrail->create();

                Response::success('บันทึกการยืมสำเร็จ', ['borrow_id' => $id]);
            } else {
                Response::error('ไม่สามารถบันทึกการยืมได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }

    public function returnAsset($id, $user_data) {
        $data = json_decode(file_get_contents("php://input"));

        $this->borrow->borrow_id = $id;
        
        // โหลดข้อมูลเดิมเพื่อเอา asset_id ถ้าใน request ไม่ได้ส่งมา
        $asset_id = $data->asset_id ?? null;
        if (!$asset_id && $this->borrow->readOne()) {
            $asset_id = $this->borrow->asset_id;
        }

        $this->borrow->status = 'คืนแล้ว';
        $this->borrow->return_date = $data->return_date ?? date('Y-m-d');

        if ($this->borrow->updateStatus()) {
            // อัปเดตสถานะครุภัณฑ์คืนเป็น 'ใช้งานได้'
            if (!empty($asset_id)) {
                $stmt_asset = $this->db->prepare("UPDATE assets SET status = 'ใช้งานได้' WHERE asset_id = :asset_id");
                $stmt_asset->bindValue(":asset_id", $asset_id);
                $exec_success = $stmt_asset->execute();
                
                if (!$exec_success) {
                    error_log("BorrowController: Failed to update asset status to 'ใช้งานได้' for ID: " . $asset_id);
                } else if ($stmt_asset->rowCount() === 0) {
                    error_log("BorrowController: Asset status update to 'ใช้งานได้' affected 0 rows for ID: " . $asset_id);
                }
            }

            // บันทึก Audit Trail
            $this->auditTrail->user_id = $user_data['user_id'];
            $this->auditTrail->asset_id = $asset_id;
            $this->auditTrail->action = 'Return';
            $this->auditTrail->old_value = json_encode(['status' => 'ยืม']);
            $this->auditTrail->new_value = json_encode(['status' => 'คืนแล้ว']);
            $this->auditTrail->create();

            Response::success('บันทึกการคืนสำเร็จ');
        } else {
            Response::error('ไม่สามารถบันทึกการคืนได้', 500);
        }
    }
}
?>