<?php
function authenticate() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        Response::error('ไม่พบ Token การยืนยันตัวตน', 401);
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    
    try {
        // ตรวจสอบ JWT token (ในตัวอย่างนี้ใช้วิธีง่ายๆ)
        $decoded = base64_decode($token);
        $user_data = json_decode($decoded, true);
        
        if (!$user_data || !isset($user_data['user_id'])) {
            Response::error('Token ไม่ถูกต้อง', 401);
        }
        
        // ตรวจสอบสถานะผู้ใช้
        require_once 'config/database.php';
        $database = new Database();
        $conn = $database->getConnection();
        
        $query = "SELECT user_id, username, fullname, role, status FROM Users WHERE user_id = :user_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $user_data['user_id']);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            Response::error('ไม่พบผู้ใช้งาน', 401);
        }
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['status'] !== 'Active') {
            Response::error('บัญชีผู้ใช้งานถูกปิดการใช้งาน', 403);
        }
        
        // เพิ่ม role และข้อมูลผู้ใช้ใน user_data
        $user_data['role'] = $user['role'];
        $user_data['fullname'] = $user['fullname'];
        $user_data['username'] = $user['username'];
        
        return $user_data;
    } catch (Exception $e) {
        Response::error('Token ไม่ถูกต้อง', 401);
    }
}

// ฟังก์ชันตรวจสอบสิทธิ์ตามบทบาท
function requireRole($allowedRoles) {
    $user_data = authenticate();
    
    if (!in_array($user_data['role'], $allowedRoles)) {
        Response::error('คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้', 403);
    }
    
    return $user_data;
}

// ฟังก์ชันตรวจสอบว่าเป็น Admin หรือไม่
function requireAdmin() {
    return requireRole(['Admin']);
}

// ฟังก์ชันตรวจสอบว่าเป็น Admin หรือ Inspector หรือไม่
function requireAdminOrInspector() {
    return requireRole(['Admin', 'Inspector']);
}
?>