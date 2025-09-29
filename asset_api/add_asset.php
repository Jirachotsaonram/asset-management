<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST'); // API นี้ใช้ Method POST
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include 'db_connect.php'; // ดึงไฟล์เชื่อมต่อฐานข้อมูล

// 1. รับข้อมูลจาก Client (ส่งมาในรูปแบบ JSON)
$data = json_decode(file_get_contents("php://input"));

// 2. การตรวจสอบข้อมูลที่จำเป็น (Basic Validation)
if (!isset($data->asset_name) || 
    !isset($data->serial_number) ||
    !isset($data->department_id) ||
    !isset($data->location_id) ||
    !isset($data->status)) 
{
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing required fields: asset_name, serial_number, department_id, location_id, and status are mandatory.']);
    exit();
}

try {
    // 3. กำหนดค่าตัวแปรจาก JSON (กำหนดค่าเริ่มต้นเผื่อกรณีที่ไม่ได้ส่งมา)
    $asset_name = $data->asset_name; //
    $serial_number = $data->serial_number; //
    $quantity = $data->quantity ?? 1; // ถ้าไม่ได้ส่งมา ให้ค่าเริ่มต้นเป็น 1
    $unit = $data->unit ?? 'เครื่อง'; //
    $price = $data->price ?? 0.00; //
    $received_date = $data->received_date ?? date('Y-m-d'); //
    $department_id = $data->department_id; //
    $location_id = $data->location_id; //
    $status = $data->status; //
    $barcode = $data->barcode ?? null; //
    $image = $data->image ?? null; //

    // 4. เตรียมคำสั่ง SQL INSERT (ใช้ Prepared Statement เพื่อความปลอดภัย)
    $sql = "
        INSERT INTO Assets 
        (asset_name, serial_number, quantity, unit, price, received_date, department_id, location_id, status, barcode, image) 
        VALUES 
        (:asset_name, :serial_number, :quantity, :unit, :price, :received_date, :department_id, :location_id, :status, :barcode, :image)
    ";

    $stmt = $pdo->prepare($sql);

    // 5. ผูกค่าตัวแปร (Binding Parameters)
    $stmt->bindParam(':asset_name', $asset_name);
    $stmt->bindParam(':serial_number', $serial_number);
    $stmt->bindParam(':quantity', $quantity);
    $stmt->bindParam(':unit', $unit);
    $stmt->bindParam(':price', $price);
    $stmt->bindParam(':received_date', $received_date);
    $stmt->bindParam(':department_id', $department_id);
    $stmt->bindParam(':location_id', $location_id);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':barcode', $barcode);
    $stmt->bindParam(':image', $image);
    
    // 6. ประมวลผลและตรวจสอบผลลัพธ์
    $stmt->execute();
    
    // ดึง ID ล่าสุดที่เพิ่งถูกเพิ่มเข้าไป
    $lastId = $pdo->lastInsertId();

    http_response_code(201); // Created
    echo json_encode([
        'success' => true,
        'message' => 'Asset added successfully',
        'asset_id' => $lastId
    ]);

} catch (PDOException $e) {
    // 7. จัดการ Error (เช่น Serial Number ซ้ำ, Foreign Key ผิดพลาด)
    http_response_code(500);
    
    $error_message = 'Database error: ' . $e->getMessage();
    
    // ตรวจสอบ Error Code สำหรับ Serial Number ซ้ำ (Unique Key)
    if ($e->getCode() == '23000') {
         $error_message = 'Serial Number already exists. Please use a unique serial number.';
    }

    echo json_encode(['success' => false, 'message' => $error_message]);
}
?>