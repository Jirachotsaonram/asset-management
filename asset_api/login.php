<?php
header('Content-Type: application/json'); // กำหนดให้ Header เป็น JSON
header('Access-Control-Allow-Origin: *'); // อนุญาตให้ Client จากที่ใดก็ได้เรียกใช้ (ควรจำกัดใน Production)
header('Access-Control-Allow-Methods: POST'); // อนุญาตเฉพาะ Method POST
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include 'db_connect.php'; // ดึงไฟล์เชื่อมต่อฐานข้อมูล

// ถ้า Method ที่ส่งมาคือ OPTIONS ให้ตอบกลับด้วย 200 OK ทันทีแล้วจบการทำงาน
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); 
}

// 1. รับข้อมูลจาก Client (ส่งมาในรูปแบบ JSON)
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing username or password']);
    exit();
}

$username = $data->username;
$input_password = $data->password;

try {
    // 2. เตรียมคำสั่ง SQL (ใช้ Prepared Statement เพื่อป้องกัน SQL Injection)
    $sql = "SELECT user_id, password, fullname, role, status FROM Users WHERE username = :username";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch();

    if ($user) {
        // 3. ตรวจสอบรหัสผ่าน (ในระบบจริงควรใช้ password_verify() สำหรับรหัสผ่านที่ถูก Hash)
        // **สำหรับโครงงานเริ่มต้น** เราจะเปรียบเทียบรหัสผ่านแบบ Plain Text ก่อน
        if ($input_password === $user['password']) { 
            // 4. ตรวจสอบสถานะบัญชี
            if ($user['status'] === 'Active') { // ตรวจสอบสถานะบัญชี
                // ลบ Password ออกก่อนส่งกลับ
                unset($user['password']);
                
                // 5. ส่งข้อมูลผู้ใช้และ Role กลับไป
                http_response_code(200); // OK
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => $user // ข้อมูล user_id, fullname, role, status
                ]);
            } else {
                http_response_code(401); // Unauthorized
                echo json_encode(['success' => false, 'message' => 'Account is inactive or suspended']); // สถานะบัญชีถูกระงับ
            }
        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
        }
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>