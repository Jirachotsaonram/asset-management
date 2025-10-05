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
        
        return $user_data;
    } catch (Exception $e) {
        Response::error('Token ไม่ถูกต้อง', 401);
    }
}
?>