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

    // ==================== GET ALL - รองรับ pagination ====================
    public function getAll() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 0;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
        
        if ($limit > 0) {
            if ($page <= 0) $page = 1;
            // ใช้ pagination mode
            $filters = [];
            if (!empty($_GET['status'])) $filters['status'] = $_GET['status'];
            if (!empty($_GET['department_id'])) $filters['department_id'] = $_GET['department_id'];
            if (!empty($_GET['building'])) $filters['building'] = $_GET['building'];
            if (!empty($_GET['floor'])) $filters['floor'] = $_GET['floor'];
            if (!empty($_GET['search'])) $filters['search'] = $_GET['search'];

            $sort = $_GET['sort'] ?? 'created_at';
            $order = $_GET['order'] ?? 'DESC';

            $stmt = $this->asset->readPaginated($page, $limit, $filters, $sort, $order);
            $total = $this->asset->getCount($filters);
            
            $assets = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $assets[] = $row;
            }

            Response::success('ดึงข้อมูลครุภัณฑ์สำเร็จ', [
                'items' => $assets,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($total / $limit)
            ]);
        } else {
            // Legacy mode - ดึงทั้งหมด (backward compatible)
            $stmt = $this->asset->readAll();
            $assets = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $assets[] = $row;
            }
            Response::success('ดึงข้อมูลครุภัณฑ์สำเร็จ', $assets);
        }
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
            $this->asset->room_text = $data->room_text ?? '';
            $this->asset->status = $data->status ?? 'ใช้งานได้';
            $this->asset->barcode = $data->barcode ?? uniqid('QR');
            $this->asset->description = $data->description ?? '';
            $this->asset->reference_number = $data->reference_number ?? '';
            $this->asset->faculty_name = $data->faculty_name ?? '';
            $this->asset->delivery_number = $data->delivery_number ?? '';
            $this->asset->fund_code = $data->fund_code ?? '';
            $this->asset->plan_code = $data->plan_code ?? '';
            $this->asset->project_code = $data->project_code ?? '';
            $this->asset->image = $data->image ?? '';

            $asset_id = $this->asset->create();
            
            if ($asset_id) {
                // บันทึก Audit Trail
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
        require_once 'middleware/auth.php';
        $user_data = authenticate();
        
        $data = json_decode(file_get_contents("php://input"));

        $this->asset->asset_id = $id;
        $this->asset->barcode = $id;
        $stmt = $this->asset->readOne();
        
        if ($stmt->rowCount() === 0) {
            Response::error('ไม่พบข้อมูลครุภัณฑ์', 404);
            return;
        }
        
        $old_data = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->asset->asset_id = $id;
        $this->asset->asset_name = $data->asset_name;
        $this->asset->serial_number = $data->serial_number ?? '';
        $this->asset->quantity = $data->quantity ?? 1;
        $this->asset->unit = $data->unit ?? '';
        $this->asset->price = $data->price ?? 0;
        $this->asset->department_id = $data->department_id ?? null;
        $this->asset->location_id = $data->location_id ?? null;
        $this->asset->room_text = $data->room_text ?? '';
        $this->asset->status = $data->status ?? 'ใช้งานได้';
        $this->asset->description = $data->description ?? '';
        $this->asset->reference_number = $data->reference_number ?? '';
        $this->asset->faculty_name = $data->faculty_name ?? '';
        $this->asset->delivery_number = $data->delivery_number ?? '';
        $this->asset->fund_code = $data->fund_code ?? '';
        $this->asset->plan_code = $data->plan_code ?? '';
        $this->asset->project_code = $data->project_code ?? '';
        $this->asset->image = $data->image ?? ($old_data['image'] ?? '');

        if ($this->asset->update()) {
            // Track changes for audit trail
            $changes = [];
            $fields_to_track = [
                'asset_name', 'serial_number', 'quantity', 'unit', 
                'price', 'department_id', 'location_id', 'room_text', 'status',
                'description', 'reference_number', 'faculty_name', 'delivery_number',
                'fund_code', 'plan_code', 'project_code'
            ];

            foreach ($fields_to_track as $field) {
                if (isset($data->$field) && $old_data[$field] != $data->$field) {
                    $changes[$field] = [
                        'old' => $old_data[$field],
                        'new' => $data->$field
                    ];
                }
            }

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

    public function delete($id) {
        require_once 'middleware/auth.php';
        $user_data = authenticate();

        $this->asset->asset_id = $id;
        $this->asset->barcode = $id;
        $stmt = $this->asset->readOne();
        
        if ($stmt->rowCount() === 0) {
            Response::error('ไม่พบข้อมูลครุภัณฑ์', 404);
            return;
        }
        
        $old_data = $stmt->fetch(PDO::FETCH_ASSOC);

        // Audit Trail
        $this->auditTrail->user_id = $user_data['user_id'];
        $this->auditTrail->asset_id = $id;
        $this->auditTrail->action = 'Delete';
        $this->auditTrail->old_value = json_encode([
            'asset_name' => $old_data['asset_name'],
            'serial_number' => $old_data['serial_number'],
            'barcode' => $old_data['barcode'],
            'status' => $old_data['status']
        ]);
        $this->auditTrail->new_value = null;
        $this->auditTrail->create();

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