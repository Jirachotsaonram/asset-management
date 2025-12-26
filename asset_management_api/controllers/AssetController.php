<?php
// FILE: asset_management_api/controllers/AssetController.php
require_once 'config/database.php';
require_once 'models/Asset.php';
require_once 'models/AuditTrail.php';
require_once 'utils/Response.php';

class AssetController {
    private $db;
    private $asset;
    private $auditTrail;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->asset = new Asset($this->db);
        $this->auditTrail = new AuditTrail($this->db);
    }

    public function getAll() {
        $stmt = $this->asset->readAll();
        $assets = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $assets[] = $row;
        }

        Response::success('ดึงข้อมูลครุภัณฑ์สำเร็จ', $assets);
    }

    public function getOne($id) {
        $this->asset->asset_id = $id;
        $this->asset->barcode = $id;
        
        $stmt = $this->asset->readOne();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $asset = $stmt->fetch(PDO::FETCH_ASSOC);
            Response::success('ดึงข้อมูลครุภัณฑ์สำเร็จ', $asset);
        } else {
            Response::error('ไม่พบข้อมูลครุภัณฑ์', 404);
        }
    }

    public function create() {
        // ต้องมี user_data จาก authentication
        require_once 'middleware/auth.php';
        $user_data = authenticate();
        
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->asset_name)) {
            $this->asset->asset_name = $data->asset_name;
            $this->asset->serial_number = $data->serial_number ?? '';
            $this->asset->quantity = $data->quantity ?? 1;
            $this->asset->unit = $data->unit ?? '';
            $this->asset->price = $data->price ?? 0;
            $this->asset->received_date = $data->received_date ?? date('Y-m-d');
            $this->asset->department_id = $data->department_id ?? null;
            $this->asset->location_id = $data->location_id ?? null;
            $this->asset->status = $data->status ?? 'ใช้งานได้';
            $this->asset->barcode = $data->barcode ?? uniqid('QR');
            $this->asset->image = $data->image ?? '';

            $asset_id = $this->asset->create();
            
            if ($asset_id) {
                // ✅ บันทึก Audit Trail สำหรับ Add
                $this->auditTrail->user_id = $user_data['user_id'];
                $this->auditTrail->asset_id = $asset_id;
                $this->auditTrail->action = 'Add';
                $this->auditTrail->old_value = null;
                $this->auditTrail->new_value = json_encode([
                    'asset_name' => $data->asset_name,
                    'serial_number' => $data->serial_number ?? '',
                    'barcode' => $this->asset->barcode,
                    'quantity' => $data->quantity ?? 1,
                    'unit' => $data->unit ?? '',
                    'price' => $data->price ?? 0,
                    'received_date' => $data->received_date ?? date('Y-m-d'),
                    'department_id' => $data->department_id ?? null,
                    'location_id' => $data->location_id ?? null,
                    'status' => $data->status ?? 'ใช้งานได้'
                ]);
                $this->auditTrail->create();

                Response::success('เพิ่มครุภัณฑ์สำเร็จ', ['asset_id' => $asset_id]);
            } else {
                Response::error('ไม่สามารถเพิ่มครุภัณฑ์ได้', 500);
            }
        } else {
            Response::error('กรุณากรอกชื่อครุภัณฑ์', 400);
        }
    }

    public function update($id) {
        // ต้องมี user_data จาก authentication
        require_once 'middleware/auth.php';
        $user_data = authenticate();
        
        $data = json_decode(file_get_contents("php://input"));

        // ✅ ดึงข้อมูลเดิมก่อนอัปเดต
        $this->asset->asset_id = $id;
        $stmt = $this->asset->readOne();
        
        if ($stmt->rowCount() === 0) {
            Response::error('ไม่พบข้อมูลครุภัณฑ์', 404);
            return;
        }
        
        $old_data = $stmt->fetch(PDO::FETCH_ASSOC);

        // อัปเดตข้อมูล
        $this->asset->asset_id = $id;
        $this->asset->asset_name = $data->asset_name;
        $this->asset->serial_number = $data->serial_number ?? '';
        $this->asset->quantity = $data->quantity ?? 1;
        $this->asset->unit = $data->unit ?? '';
        $this->asset->price = $data->price ?? 0;
        $this->asset->department_id = $data->department_id ?? null;
        $this->asset->location_id = $data->location_id ?? null;
        $this->asset->status = $data->status ?? 'ใช้งานได้';
        $this->asset->image = $data->image ?? '';

        if ($this->asset->update()) {
            // ✅ สร้าง array ของข้อมูลที่เปลี่ยนแปลง
            $changes = [];
            $fields_to_track = [
                'asset_name', 'serial_number', 'quantity', 'unit', 
                'price', 'department_id', 'location_id', 'status'
            ];

            foreach ($fields_to_track as $field) {
                if (isset($data->$field) && $old_data[$field] != $data->$field) {
                    $changes[$field] = [
                        'old' => $old_data[$field],
                        'new' => $data->$field
                    ];
                }
            }

            // ✅ บันทึก Audit Trail สำหรับ Edit
            if (!empty($changes)) {
                $this->auditTrail->user_id = $user_data['user_id'];
                $this->auditTrail->asset_id = $id;
                $this->auditTrail->action = 'Edit';
                $old_values = [];
                $new_values = [];
                foreach ($changes as $field => $change) {
                    $old_values[$field] = $change['old'];
                    $new_values[$field] = $change['new'];
                }
                $this->auditTrail->old_value = json_encode($old_values);
                $this->auditTrail->new_value = json_encode($new_values);
                $this->auditTrail->create();
            }

            Response::success('อัปเดตครุภัณฑ์สำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตครุภัณฑ์ได้', 500);
        }
    }

    // ✅ เพิ่มฟังก์ชัน delete พร้อมบันทึก Audit Trail
    public function delete($id) {
        // ต้องมี user_data จาก authentication
        require_once 'middleware/auth.php';
        $user_data = authenticate();

        // ดึงข้อมูลเดิมก่อนลบ
        $this->asset->asset_id = $id;
        $stmt = $this->asset->readOne();
        
        if ($stmt->rowCount() === 0) {
            Response::error('ไม่พบข้อมูลครุภัณฑ์', 404);
            return;
        }
        
        $old_data = $stmt->fetch(PDO::FETCH_ASSOC);

        // ✅ บันทึก Audit Trail สำหรับ Delete ก่อนลบ
        $this->auditTrail->user_id = $user_data['user_id'];
        $this->auditTrail->asset_id = $id;
        $this->auditTrail->action = 'Delete';
        $this->auditTrail->old_value = json_encode([
            'asset_name' => $old_data['asset_name'],
            'serial_number' => $old_data['serial_number'],
            'barcode' => $old_data['barcode'],
            'status' => $old_data['status'],
            'location_id' => $old_data['location_id']
        ]);
        $this->auditTrail->new_value = null;
        $this->auditTrail->create();

        // ลบครุภัณฑ์
        $query = "DELETE FROM Assets WHERE asset_id = :asset_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':asset_id', $id);

        if ($stmt->execute()) {

            Response::success('ลบครุภัณฑ์สำเร็จ');
        } else {
            Response::error('ไม่สามารถลบครุภัณฑ์ได้', 500);
        }
    }

    public function search() {
        $keyword = $_GET['q'] ?? '';
        
        if (!empty($keyword)) {
            $stmt = $this->asset->search($keyword);
            $assets = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $assets[] = $row;
            }

            Response::success('ค้นหาครุภัณฑ์สำเร็จ', $assets);
        } else {
            Response::error('กรุณาระบุคำค้นหา', 400);
        }
    }
}
?>