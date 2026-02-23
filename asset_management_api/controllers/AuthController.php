<?php
require_once 'config/database.php';
require_once 'models/User.php';
require_once 'utils/Response.php';
require_once 'middleware/auth.php';

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
            // Input sanitization
            $username = trim(htmlspecialchars($data->username, ENT_QUOTES, 'UTF-8'));
            $password = $data->password;

            // ตรวจสอบ rate limiting (จำกัด login attempts)
            $this->checkLoginAttempts($username);

            $this->user->username = $username;
            
            $stmt = $this->user->login();
            $num = $stmt->rowCount();

            if ($num > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($password, $row['password'])) {
                    // ตรวจสอบสถานะบัญชี
                    if ($row['status'] === 'Pending') {
                        Response::error('บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ', 403);
                        return;
                    }
                    if ($row['status'] === 'Inactive') {
                        Response::error('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 403);
                        return;
                    }

                    // ล้าง login attempts เมื่อ login สำเร็จ
                    $this->clearLoginAttempts($username);

                    // สร้าง HMAC-SHA256 JWT Token
                    $token = generateToken([
                        'user_id' => $row['user_id'],
                        'username' => $row['username'],
                        'role' => $row['role']
                    ]);

                    Response::success('เข้าสู่ระบบสำเร็จ', [
                        'token' => $token,
                        'expires_in' => JWT_EXPIRY,
                        'user' => [
                            'user_id' => $row['user_id'],
                            'username' => $row['username'],
                            'fullname' => $row['fullname'],
                            'role' => $row['role'],
                            'email' => $row['email'],
                            'phone' => $row['phone']
                        ]
                    ]);
                } else {
                    // บันทึก login attempt ที่ล้มเหลว
                    $this->recordLoginAttempt($username);
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
            
            // Input sanitization
            $this->user->username = trim(htmlspecialchars($data->username, ENT_QUOTES, 'UTF-8'));
            $this->user->password = $data->password;
            $this->user->fullname = trim(htmlspecialchars($data->fullname, ENT_QUOTES, 'UTF-8'));
            $this->user->role = $data->role;
            $this->user->status = 'Pending'; // Default status for new registration
            $this->user->email = isset($data->email) ? trim($data->email) : '';
            $this->user->phone = isset($data->phone) ? trim($data->phone) : '';

            // Password policy: ต้องมีอย่างน้อย 6 ตัวอักษร
            if (strlen($data->password) < 6) {
                Response::error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 400);
                return;
            }

            if ($this->user->create()) {
                Response::success('สร้างบัญชีผู้ใช้สำเร็จ');
            } else {
                Response::error('ไม่สามารถสร้างบัญชีได้', 500);
            }
        } else {
            Response::error('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
        }
    }

    // ==================== Rate Limiting Helpers ====================

    /**
     * ตรวจสอบว่า login ถูก block หรือไม่ (จำกัด 5 ครั้ง ภายใน 15 นาที)
     */
    private function checkLoginAttempts($username) {
        try {
            // สร้างตาราง login_attempts ถ้ายังไม่มี
            $this->ensureLoginAttemptsTable();

            $query = "SELECT COUNT(*) as attempt_count FROM login_attempts 
                      WHERE username = :username 
                      AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
                      AND success = 0";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row['attempt_count'] >= 5) {
                Response::error('บัญชีถูกล็อคชั่วคราว กรุณารอ 15 นาทีแล้วลองใหม่', 429);
            }
        } catch (Exception $e) {
            // ถ้าตรวจสอบไม่ได้ ให้ผ่านไปก่อน (graceful degradation)
            error_log('Login rate check failed: ' . $e->getMessage());
        }
    }

    /**
     * บันทึก login attempt ที่ล้มเหลว
     */
    private function recordLoginAttempt($username) {
        try {
            $query = "INSERT INTO login_attempts (username, attempt_time, success, ip_address) 
                      VALUES (:username, NOW(), 0, :ip)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':username', $username);
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            $stmt->bindParam(':ip', $ip);
            $stmt->execute();
        } catch (Exception $e) {
            error_log('Record login attempt failed: ' . $e->getMessage());
        }
    }

    /**
     * ล้าง login attempts เมื่อ login สำเร็จ
     */
    private function clearLoginAttempts($username) {
        try {
            $query = "DELETE FROM login_attempts WHERE username = :username";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
        } catch (Exception $e) {
            error_log('Clear login attempts failed: ' . $e->getMessage());
        }
    }

    /**
     * สร้างตาราง login_attempts ถ้ายังไม่มี
     */
    private function ensureLoginAttemptsTable() {
        try {
            $query = "CREATE TABLE IF NOT EXISTS login_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                attempt_time DATETIME NOT NULL,
                success TINYINT(1) DEFAULT 0,
                ip_address VARCHAR(45) DEFAULT NULL,
                INDEX idx_username_time (username, attempt_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
            $this->db->exec($query);
        } catch (Exception $e) {
            error_log('Create login_attempts table failed: ' . $e->getMessage());
        }
    }
}
?>
