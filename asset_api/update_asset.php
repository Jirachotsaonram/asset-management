<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT'); // อนุญาตให้ใช้ Method POST หรือ PUT ก็ได้ตามมาตรฐาน REST
include 'db_connect.php'; // ดึงไฟล์เชื่อมต่อฐานข้อมูล

// 1. รับข้อมูลจาก Client (JSON)
$data = json_decode(file_get_contents("php://input"));

// 2. การตรวจสอบข้อมูลหลักที่จำเป็น (Primary Key และอย่างน้อย 1 ฟิลด์สำหรับแก้ไข)
if (!isset($data->asset_id) || empty((array)$data)) 
{
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing asset_id or no data provided for update.']);
    exit();
}

try {
    // 3. เริ่มต้นสร้างส่วน SET ของคำสั่ง SQL UPDATE
    $update_fields = [];
    $update_params = [];

    // ดึงเฉพาะฟิลด์ที่ถูกส่งมาเพื่อป้องกันการอัปเดตค่าที่ไม่จำเป็น
    $allowed_fields = [
        'asset_name', 'serial_number', 'quantity', 'unit', 'price', 
        'received_date', 'department_id', 'location_id', 'status', 
        'barcode', 'image'
    ];
    
    foreach ($allowed_fields as $field) {
        if (isset($data->$field)) {
            // เพิ่มฟิลด์ลงในคำสั่ง SET (เช่น asset_name = :asset_name)
            $update_fields[] = "{$field} = :{$field}";
            // ผูกค่าตัวแปร
            $update_params[":{$field}"] = $data->$field;
        }
    }
    
    if (empty($update_fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No valid fields provided for update.']);
        exit();
    }

    // 4. สร้างคำสั่ง SQL UPDATE สมบูรณ์
    $sql = "
        UPDATE Assets 
        SET " . implode(', ', $update_fields) . "
        WHERE asset_id = :asset_id
    ";

    $stmt = $pdo->prepare($sql);

    // 5. ผูกค่าตัวแปร asset_id และค่าอื่นๆ
    $update_params[':asset_id'] = $data->asset_id;
    
    $stmt->execute($update_params); // รันคำสั่ง

    // 6. ตรวจสอบว่ามีการเปลี่ยนแปลงข้อมูลหรือไม่
    if ($stmt->rowCount() > 0) {
        http_response_code(200); // OK
        echo json_encode([
            'success' => true,
            'message' => 'Asset ID ' . $data->asset_id . ' updated successfully',
            'rows_affected' => $stmt->rowCount()
        ]);
    } else {
        http_response_code(404); // Not Found หรือ Not Modified
        echo json_encode([
            'success' => false, 
            'message' => 'Asset ID ' . $data->asset_id . ' not found or no data was changed.'
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    $error_message = 'Database error: ' . $e->getMessage();
    
    // จัดการ Error เช่น Serial Number ซ้ำ หรือ Foreign Key ผิดพลาด
    if ($e->getCode() == '23000') {
         $error_message = 'Data integrity violation. Check for duplicate Serial Number or invalid Department/Location IDs.';
    }

    echo json_encode(['success' => false, 'message' => $error_message]);
}
?>