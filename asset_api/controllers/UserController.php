<?php
// FILE: asset_management_api/controllers/UserController.php
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

        if (!empty($data->fullname) && !empty($data->email)) {
            // ตรวจสอบว่าอีเมลซ้ำหรือไม่
            $checkQuery = "SELECT user_id FROM users WHERE email = :email";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(":email", $data->email);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                Response::error('อีเมลนี้มีอยู่ในระบบแล้ว', 400);
                return;
            }

            $this->user->fullname = $data->fullname;
            $this->user->role = $data->role ?? 'User';
            $this->user->status = $data->status ?? 'Active';
            $this->user->email = $data->email;
            $this->user->phone = $data->phone ?? '';

            if ($this->user->create()) {
                Response::success('เพิ่มผู้ใช้สำเร็จ');
            } else {
                Response::error('ไม่สามารถเพิ่มผู้ใช้ได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล)', 400);
        }
    }

    // ✅ ฟังก์ชันสำหรับแก้ไขโปรไฟล์ตัวเอง (แก้ไขแล้ว)
    public function updateProfile($user_data) {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->fullname)) {
            Response::error('กรุณากรอกชื่อ-นามสกุล', 400);
            return;
        }

        // 1. ดึงข้อมูลเดิมมาก่อน
        $this->user->user_id = $user_data['user_id'];
        $stmt = $this->user->readOne();
        
        if ($stmt->rowCount() === 0) {
            Response::error('ไม่พบข้อมูลผู้ใช้', 404);
            return;
        }
        
        $currentData = $stmt->fetch(PDO::FETCH_ASSOC);

        // 2. Merge ข้อมูล (เก็บค่าเดิมถ้าไม่ส่งมา)
        $this->user->fullname = $data->fullname;
        // ✅ ไม่อนุญาตให้แก้ไขอีเมลผ่าน Profile (ผูกกับ Google ถาวร)
        $this->user->email = $currentData['email'];
        $this->user->phone = isset($data->phone) ? $data->phone : $currentData['phone'];
        
        // ✅ ป้องกัน Role และ Status ถูกแก้ไขจากหน้า Profile
        $this->user->role = $currentData['role'];
        $this->user->status = $currentData['status'];
        
        // 3. อัปเดตข้อมูลโปรไฟล์
        if ($this->user->update()) {
            Response::success('อัปเดตโปรไฟล์สำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตได้', 500);
        }
    }

    public function update($id, $user_data = null) {
        $data = json_decode(file_get_contents("php://input"));

        // ✅ ป้องกันการแบนตัวเองหรือลดสิทธิ์ตัวเอง
        if ($user_data && $user_data['user_id'] == $id) {
            if ((isset($data->status) && $data->status === 'Inactive') || (isset($data->role) && $data->role !== 'Admin')) {
                Response::error('ไม่สามารถเปลี่ยนแปลงบทบาทหรือระงับบัญชีของตนเองได้', 400);
                return;
            }
        }

        $this->user->user_id = $id;
        $this->user->fullname = $data->fullname;
        $this->user->role = $data->role ?? 'Inspector';
        $this->user->status = $data->status ?? 'Active';
        $this->user->email = $data->email ?? '';
        $this->user->phone = $data->phone ?? '';
        
        if ($this->user->update()) {
            Response::success('อัปเดตผู้ใช้สำเร็จ');
        } else {
            Response::error('ไม่สามารถอัปเดตผู้ใช้ได้', 500);
        }
    }

    public function updateStatus($id, $user_data = null) {
        $data = json_decode(file_get_contents("php://input"));

        // ✅ ป้องกันการแบนตัวเอง
        if ($user_data && $user_data['user_id'] == $id && isset($data->status) && $data->status === 'Inactive') {
            Response::error('ไม่สามารถระงับการใช้งานบัญชีของตนเองได้', 400);
            return;
        }

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