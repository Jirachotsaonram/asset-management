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
        $stmt = $this->borrow->readAll();
        $borrows = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $borrows[] = $row;
        }

        Response::success('ดึงข้อมูลการยืมสำเร็จ', $borrows);
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
            $this->borrow->status = 'ยืม';

            $id = $this->borrow->create();
            
            if ($id) {
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
        $this->borrow->status = 'คืนแล้ว';
        $this->borrow->return_date = $data->return_date ?? date('Y-m-d');

        if ($this->borrow->updateStatus()) {
            // บันทึก Audit Trail
            $this->auditTrail->user_id = $user_data['user_id'];
            $this->auditTrail->asset_id = $data->asset_id ?? null;
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