<?php
require_once 'config/database.php';
require_once 'models/Asset.php';
require_once 'utils/Response.php';

class AssetController {
    private $db;
    private $asset;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->asset = new Asset($this->db);
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
                Response::success('เพิ่มครุภัณฑ์สำเร็จ', ['asset_id' => $asset_id]);
            } else {
                Response::error('ไม่สามารถเพิ่มครุภัณฑ์ได้', 500);
            }
        } else {
            Response::error('กรุณากรอกชื่อครุภัณฑ์', 400);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

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
            Response::success('อัปเดตครุภัณฑ์สำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตครุภัณฑ์ได้', 500);
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