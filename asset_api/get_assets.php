<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET'); // API นี้ใช้ Method GET

include 'db_connect.php'; 

try {
    // ใช้คำสั่ง SQL JOIN เพื่อรวมข้อมูล Assets, Locations, และ Departments
    // การ JOIN ข้อมูลสำคัญมากในการสร้าง API ที่มีประสิทธิภาพ
    $sql = "
        SELECT 
            A.asset_id, 
            A.asset_name, 
            A.serial_number, 
            A.quantity,
            A.price,
            A.received_date,
            A.status,
            L.building_name, 
            L.room_number,
            D.department_name
        FROM 
            Assets A
        LEFT JOIN 
            Locations L ON A.location_id = L.location_id
        LEFT JOIN 
            Departments D ON A.department_id = D.department_id
        ORDER BY 
            A.asset_id DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $assets = $stmt->fetchAll(); // ดึงข้อมูลทั้งหมดมาเป็น Array

    http_response_code(200); // OK
    echo json_encode([
        'success' => true,
        'count' => count($assets),
        'data' => $assets
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>