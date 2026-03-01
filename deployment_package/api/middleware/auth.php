<?php
// ==================== JWT Configuration ====================
define('JWT_SECRET', 'asset_mgmt_secret_key_2026_FITM_@#$!'); // คีย์ลับสำหรับ HMAC-SHA256
define('JWT_EXPIRY', 86400); // Token หมดอายุใน 24 ชั่วโมง (วินาที)

// ==================== JWT Helper Functions ====================

/**
 * สร้าง JWT Token ด้วย HMAC-SHA256
 */
function generateToken($payload) {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    
    // เพิ่ม iat (issued at) และ exp (expiry)
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    
    $payloadEncoded = base64url_encode(json_encode($payload));
    $signature = base64url_encode(hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true));
    
    return "$header.$payloadEncoded.$signature";
}

/**
 * ตรวจสอบ JWT Token
 */
function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    // ตรวจสอบ signature
    $expectedSignature = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($expectedSignature, $signature)) {
        return false;
    }
    
    // Decode payload
    $data = json_decode(base64url_decode($payload), true);
    if (!$data) {
        return false;
    }
    
    // ตรวจสอบ token หมดอายุ
    if (isset($data['exp']) && $data['exp'] < time()) {
        return false;
    }
    
    return $data;
}

/**
 * Base64 URL-safe encode
 */
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL-safe decode
 */
function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
}

// ==================== Authentication Function ====================

function authenticate() {
    // ใช้วิธีที่รองรับทุก environment (CGI, Apache, etc.)
    $authHeader = null;
    
    // ลองใช้ getallheaders() ก่อน (ทำงานบน Apache)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
    }
    
    // ถ้ายังไม่เจอ ลองดู $_SERVER (สำหรับ CGI/FastCGI)
    if (!$authHeader) {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } else {
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $headerKey = str_replace('_', '-', substr($key, 5));
                    if (strtolower($headerKey) === 'authorization') {
                        $authHeader = $value;
                        break;
                    }
                }
            }
        }
    }
    
    if (!$authHeader) {
        Response::error('ไม่พบ Token การยืนยันตัวตน', 401);
    }

    $token = str_replace('Bearer ', '', $authHeader);
    $token = trim($token);
    
    if (empty($token)) {
        Response::error('Token ไม่ถูกต้อง', 401);
    }
    
    try {
        // ลองตรวจสอบแบบ JWT (HMAC-SHA256) ก่อน
        $user_data = verifyToken($token);
        
        // ถ้า JWT ไม่ผ่าน ลอง fallback เป็น base64 แบบเดิม (backward compatible)
        if (!$user_data) {
            $decoded = base64_decode($token, true);
            if ($decoded !== false) {
                $user_data = json_decode($decoded, true);
            }
        }
        
        if (!$user_data || !isset($user_data['user_id'])) {
            Response::error('Token ไม่ถูกต้องหรือหมดอายุ', 401);
        }
        
        // ตรวจสอบสถานะผู้ใช้ในฐานข้อมูล
        require_once __DIR__ . '/../config/database.php';
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
        
        // เพิ่มข้อมูลผู้ใช้ล่าสุดจาก DB
        $user_data['role'] = $user['role'];
        $user_data['fullname'] = $user['fullname'];
        $user_data['username'] = $user['username'];
        
        return $user_data;
    } catch (Exception $e) {
        Response::error('Token ไม่ถูกต้อง: ' . $e->getMessage(), 401);
    }
}

// ==================== Role-based Access Control ====================

function requireRole($allowedRoles) {
    $user_data = authenticate();
    
    if (!in_array($user_data['role'], $allowedRoles)) {
        Response::error('คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้', 403);
    }
    
    return $user_data;
}

function requireAdmin() {
    return requireRole(['Admin']);
}

function requireAdminOrInspector() {
    return requireRole(['Admin', 'Inspector']);
}
?>