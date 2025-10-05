<?php
require_once 'config/database.php';
require_once 'models/User.php';
require_once 'utils/Response.php';

class UserController {
    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    public function getAll() {
        $stmt = $this->user->readAll();
        $users = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            unset($row['password']); // ไม่ส่งรหัสผ่าน
            $users[] = $row;
        }

        Response::success('ดึงข้อมูลผู้ใช้งานสำเร็จ', $users);
    }

    public function updateStatus($id) {
        $data = json_decode(file_get_contents("php://input"));

        $this->user->user_id = $id;
        $this->user->status = $data->status;

        if ($this->user->updateStatus()) {
            Response::success('อัปเดตสถานะผู้ใช้งานสำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตสถานะได้', 500);
        }
    }
}
?>