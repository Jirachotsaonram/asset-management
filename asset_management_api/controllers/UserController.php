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

    public function getOne($id) {
        $this->user->user_id = $id;
        $stmt = $this->user->readOne();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            unset($row['password']);
            Response::success('ดึงข้อมูลผู้ใช้สำเร็จ', $row);
        } else {
            Response::error('ไม่พบข้อมูลผู้ใช้', 404);
        }
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->username) && !empty($data->password) && !empty($data->fullname)) {
            // ตรวจสอบว่า username ซ้ำหรือไม่
            $checkQuery = "SELECT user_id FROM Users WHERE username = :username";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(":username", $data->username);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                Response::error('ชื่อผู้ใช้นี้มีอยู่แล้ว', 400);
                return;
            }

            $this->user->username = $data->username;
            $this->user->password = $data->password;
            $this->user->fullname = $data->fullname;
            $this->user->role = $data->role ?? 'Inspector';
            $this->user->status = $data->status ?? 'Active';
            $this->user->email = $data->email ?? '';
            $this->user->phone = $data->phone ?? '';

            if ($this->user->create()) {
                Response::success('เพิ่มผู้ใช้สำเร็จ');
            } else {
                Response::error('ไม่สามารถเพิ่มผู้ใช้ได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน (username, password, fullname)', 400);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->fullname)) {
            $this->user->user_id = $id;
            $this->user->fullname = $data->fullname;
            $this->user->role = $data->role ?? 'Inspector';
            $this->user->status = $data->status ?? 'Active';
            $this->user->email = $data->email ?? '';
            $this->user->phone = $data->phone ?? '';
            
            // ถ้ามีการส่ง password มาด้วย
            if (!empty($data->password)) {
                $this->user->password = $data->password;
                if ($this->user->updateWithPassword()) {
                    Response::success('อัปเดตผู้ใช้สำเร็จ');
                } else {
                    Response::error('ไม่สามารถอัปเดตผู้ใช้ได้', 500);
                }
            } else {
                if ($this->user->update()) {
                    Response::success('อัปเดตผู้ใช้สำเร็จ');
                } else {
                    Response::error('ไม่สามารถอัปเดตผู้ใช้ได้', 500);
                }
            }
        } else {
            Response::error('กรุณากรอกชื่อ-นามสกุล', 400);
        }
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

    public function delete($id) {
        $this->user->user_id = $id;

        if ($this->user->delete()) {
            Response::success('ลบผู้ใช้สำเร็จ');
        } else {
            Response::error('ไม่สามารถลบผู้ใช้ได้', 500);
        }
    }
}
?>