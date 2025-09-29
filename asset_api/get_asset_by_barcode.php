<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET'); // ใช้ Method GET

include 'db_connect.php'; 

// 1. รับค่า Barcode จาก Query String ใน URL
$barcode = $_GET['barcode'] ?? null;

if (empty($barcode)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Missing barcode parameter.']);
    exit();
}

try {
    // 2. เตรียมคำสั่ง SQL เพื่อค้นหาครุภัณฑ์ด้วย Barcode
    // ใช้ LEFT JOIN เพื่อดึงข้อมูลสถานที่ตั้งและหน่วยงานมาแสดงพร้อมกัน
    $sql = "
        SELECT 
            A.asset_id, 
            A.asset_name, 
            A.serial_number, 
            A.quantity,
            A.unit,
            A.price,
            A.received_date,
            A.status,
            A.barcode,
            A.image,
            L.building_name, 
            L.room_number,
            D.department_name
        FROM 
            Assets A
        LEFT JOIN 
            Locations L ON A.location_id = L.location_id
        LEFT JOIN 
            Departments D ON A.department_id = D.department_id
        WHERE
            A.barcode = :barcode  -- กรองข้อมูลด้วย Barcode ที่รับเข้ามา
        LIMIT 1 -- คาดหวังผลลัพธ์แค่ 1 รายการเพราะ barcode เป็น Unique
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':barcode', $barcode);
    $stmt->execute();
    $asset_data = $stmt->fetch(); // ดึงข้อมูลแค่ 1 แถว

    if ($asset_data) {
        http_response_code(200); // OK
        echo json_encode([
            'success' => true,
            'message' => 'Asset found',
            'data' => $asset_data
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['success' => false, 'message' => 'Asset not found for the provided barcode.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>