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
        
        if (!$this->db) {
            error_log("AuthController: Database connection failed.");
        }
        
        $this->user = new User($this->db);
    }

    // ==================== Google Login ====================
    public function googleLogin() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->credential)) {
            $id_token = $data->credential;
            // Verify Google Token
            $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $id_token;
            
            // ใช้ curl เพื่อเรียก Google API
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            curl_close($ch);
            
            $payload = json_decode($response);
            
            if (isset($payload->error) || !isset($payload->email)) {
                Response::error('Token ของ Google ไม่ถูกต้อง: ' . ($payload->error_description ?? 'Unknown error'), 401);
                return;
            }

            // ตรวจสอบว่า Token นี้ถูกสร้างมาจาก Client ID ของเราจริงๆ (ป้องกันคนเอา Token จากแอปอื่นมายิงใส่ API เรา)
            $valid_client_ids = [
                '120709720620-5a7p2caf9pihnqimn9oj963odmag9o3k.apps.googleusercontent.com', // Web Client ID
                '120709720620-t52mvrrdf1ufpk4ta7r5butofo1frt9n.apps.googleusercontent.com'  // Android Client ID
            ];

            if (!isset($payload->aud) || !in_array($payload->aud, $valid_client_ids)) {
                Response::error('Token นี้ไม่ได้มาจากแอปพลิเคชันของเรา (Invalid Audience)', 401);
                return;
            }

            
            $email = $payload->email;
            $name = $payload->name ?? 'Google User';
            $sub = $payload->sub;
            $picture = $payload->picture ?? null;
            
            // 1. ลองค้นหาด้วย sub ก่อน
            $stmt = $this->user->findByGoogleSubId($sub);
            
            if ($stmt->rowCount() == 0) {
                // 2. ถ้าไม่เจอ ลองหาด้วย email
                $stmt = $this->user->findByEmail($email);
                
                if ($stmt->rowCount() > 0) {
                    // ถ้าเจอด้วย email ให้ทำการผูก sub และอัปเดตรูปภาพ
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    $this->user->user_id = $row['user_id'];
                    $this->user->google_sub_id = $sub;
                    $this->user->avatar_url = $picture;
                    $this->user->updateGoogleInfo();
                    
                    // ดึงข้อมูลใหม่
                    $stmt = $this->user->findByGoogleSubId($sub);
                }
            }
            
            if ($stmt->rowCount() > 0) {
                // บัญชีมีอยู่แล้ว
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($row['status'] === 'Inactive') {
                    Response::error('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 403);
                    return;
                }
                
                // อัปเดต avatar_url ล่าสุดเสมอ
                if ($row['avatar_url'] !== $picture) {
                    $this->user->user_id = $row['user_id'];
                    $this->user->google_sub_id = $sub;
                    $this->user->avatar_url = $picture;
                    $this->user->updateGoogleInfo();
                }
                
                // สร้าง Token
                $token = generateToken([
                    'user_id' => $row['user_id'],
                    'role' => $row['role']
                ]);

                Response::success('เข้าสู่ระบบสำเร็จ', [
                    'token' => $token,
                    'expires_in' => JWT_EXPIRY,
                    'user' => [
                        'user_id' => $row['user_id'],
                        'fullname' => $row['fullname'],
                        'role' => $row['role'],
                        'email' => $row['email'],
                        'phone' => $row['phone'],
                        'picture' => $picture
                    ]
                ]);
            } else {
                // สร้างบัญชีใหม่ให้สิทธิ์เป็น User และสถานะเป็น Active
                $this->user->fullname = $name;
                $this->user->role = 'User';
                $this->user->status = 'Active';
                $this->user->email = $email;
                $this->user->phone = '';
                $this->user->google_sub_id = $sub;
                $this->user->avatar_url = $picture;
                $this->user->auth_provider = 'google';
                
                if ($this->user->create()) {
                    // ดึงข้อมูลบัญชีที่เพิ่งสร้าง
                    $stmt = $this->user->findByGoogleSubId($sub);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    $token = generateToken([
                        'user_id' => $row['user_id'],
                        'role' => $row['role']
                    ]);

                    Response::success('เข้าสู่ระบบสำเร็จ (บัญชีใหม่)', [
                        'token' => $token,
                        'expires_in' => JWT_EXPIRY,
                        'user' => [
                            'user_id' => $row['user_id'],
                            'fullname' => $row['fullname'],
                            'role' => $row['role'],
                            'email' => $row['email'],
                            'phone' => $row['phone'],
                            'picture' => $picture
                        ]
                    ]);
                } else {
                    Response::error('ไม่สามารถสร้างบัญชีผู้ใช้ใหม่ได้', 500);
                }
            }
        } else {
            Response::error('ไม่มีข้อมูล Credential', 400);
        }
    }

}
?>
