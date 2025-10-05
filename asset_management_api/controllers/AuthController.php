<?php
require_once 'config/database.php';
require_once 'models/User.php';
require_once 'utils/Response.php';

class AuthController {
    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->username) && !empty($data->password)) {
            $this->user->username = $data->username;
            
            $stmt = $this->user->login();
            $num = $stmt->rowCount();

            if ($num > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($data->password, $row['password'])) {
                    $token = base64_encode(json_encode([
                        'user_id' => $row['user_id'],
                        'username' => $row['username'],
                        'role' => $row['role']
                    ]));

                    Response::success('เข้าสู่ระบบสำเร็จ', [
                        'token' => $token,
                        'user' => [
                            'user_id' => $row['user_id'],
                            'username' => $row['username'],
                            'fullname' => $row['fullname'],
                            'role' => $row['role'],
                            'email' => $row['email']
                        ]
                    ]);
                } else {
                    Response::error('รหัสผ่านไม่ถูกต้อง', 401);
                }
            } else {
                Response::error('ไม่พบผู้ใช้งานหรือบัญชีถูกระงับ', 401);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }

    public function register() {
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->username) && !empty($data->password) && 
            !empty($data->fullname) && !empty($data->role)) {
            
            $this->user->username = $data->username;
            $this->user->password = $data->password;
            $this->user->fullname = $data->fullname;
            $this->user->role = $data->role;
            $this->user->email = $data->email ?? '';
            $this->user->phone = $data->phone ?? '';

            if ($this->user->create()) {
                Response::success('สร้างบัญชีผู้ใช้สำเร็จ');
            } else {
                Response::error('ไม่สามารถสร้างบัญชีได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }
}
?>
