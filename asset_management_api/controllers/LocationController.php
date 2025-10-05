<?php
require_once 'config/database.php';
require_once 'models/Location.php';
require_once 'utils/Response.php';

class LocationController {
    private $db;
    private $location;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->location = new Location($this->db);
    }

    public function getAll() {
        $stmt = $this->location->readAll();
        $locations = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $locations[] = $row;
        }

        Response::success('ดึงข้อมูลสถานที่สำเร็จ', $locations);
    }

    public function getOne($id) {
        $this->location->location_id = $id;
        $stmt = $this->location->readOne();
        
        if ($stmt->rowCount() > 0) {
            $loc = $stmt->fetch(PDO::FETCH_ASSOC);
            Response::success('ดึงข้อมูลสถานที่สำเร็จ', $loc);
        } else {
            Response::error('ไม่พบข้อมูลสถานที่', 404);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->building_name)) {
            $this->location->building_name = $data->building_name;
            $this->location->room_number = $data->room_number ?? '';
            $this->location->description = $data->description ?? '';

            $id = $this->location->create();
            
            if ($id) {
                Response::success('เพิ่มสถานที่สำเร็จ', ['location_id' => $id]);
            } else {
                Response::error('ไม่สามารถเพิ่มสถานที่ได้', 500);
            }
        } else {
            Response::error('กรุณากรอกชื่ออาคาร', 400);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

        $this->location->location_id = $id;
        $this->location->building_name = $data->building_name;
        $this->location->room_number = $data->room_number ?? '';
        $this->location->description = $data->description ?? '';

        if ($this->location->update()) {
            Response::success('อัปเดตสถานที่สำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตสถานที่ได้', 500);
        }
    }

    public function delete($id) {
        $this->location->location_id = $id;

        if ($this->location->delete()) {
            Response::success('ลบสถานที่สำเร็จ');
        } else {
            Response::error('ไม่สามารถลบสถานที่ได้', 500);
        }
    }
}
?>