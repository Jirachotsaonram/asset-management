<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include 'db_connect.php'; 

// 1. รับข้อมูลจาก Client (JSON)
$data = json_decode(file_get_contents("php://input"));

// 2. การตรวจสอบข้อมูลที่จำเป็น
if (!isset($data->asset_id) || 
    !isset($data->user_id) || 
    !isset($data->check_status)) 
{
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing required fields: asset_id, user_id, and check_status are mandatory.']);
    exit();
}

try {
    // 3. กำหนดค่าตัวแปร
    $asset_id = $data->asset_id; // รหัสครุภัณฑ์ที่สแกนมา
    $user_id = $data->user_id;   // รหัสผู้ใช้งานที่ล็อกอินอยู่
    $check_status = $data->check_status; // สถานะการตรวจสอบ (เช่น ปกติ, ชำรุด, หาย)
    $remark = $data->remark ?? null; // หมายเหตุเพิ่มเติม
    
    // **สำคัญ**: เราจะใช้ NOW() ใน SQL เพื่อให้ Server บันทึกวันที่และเวลาของการตรวจสอบที่แม่นยำ

    // 4. เตรียมคำสั่ง SQL INSERT ลงในตาราง Asset_Check
    $sql_check = "
        INSERT INTO Asset_Check 
        (asset_id, user_id, check_date, check_status, remark) 
        VALUES 
        (:asset_id, :user_id, NOW(), :check_status, :remark)
    ";

    $stmt_check = $pdo->prepare($sql_check);

    // 5. ผูกค่าตัวแปร
    $stmt_check->bindParam(':asset_id', $asset_id);
    $stmt_check->bindParam(':user_id', $user_id);
    $stmt_check->bindParam(':check_status', $check_status);
    $stmt_check->bindParam(':remark', $remark);
    
    // 6. ประมวลผลและตรวจสอบผลลัพธ์
    $stmt_check->execute();
    $lastId = $pdo->lastInsertId();
    
    // 7. (โบนัส) อัปเดตสถานะล่าสุดในตาราง Assets
    // หากผลการตรวจสอบบ่งชี้ว่าสถานะของครุภัณฑ์อาจมีการเปลี่ยนแปลง (เช่น จาก 'ใช้งานได้' เป็น 'ชำรุด')
    $sql_update_asset = "
        UPDATE Assets 
        SET status = :new_status 
        WHERE asset_id = :asset_id
    ";
    
    $stmt_update = $pdo->prepare($sql_update_asset);
    $stmt_update->bindParam(':new_status', $check_status);
    $stmt_update->bindParam(':asset_id', $asset_id);
    $stmt_update->execute();
    
    http_response_code(201); // Created
    echo json_encode([
        'success' => true,
        'message' => 'Asset check recorded successfully. Asset status updated.',
        'check_id' => $lastId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    
    $error_message = 'Database error: ' . $e->getMessage();
    
    // Error Code '23000' อาจเกิดจาก Foreign Key ผิดพลาด (asset_id หรือ user_id ไม่มีอยู่จริง)
    if ($e->getCode() == '23000') {
         $error_message = 'Data integrity violation. Check if asset_id or user_id are valid.';
    }

    echo json_encode(['success' => false, 'message' => $error_message]);
}
?>