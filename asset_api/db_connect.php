<?php
// กำหนดข้อมูลการเชื่อมต่อ
$host = 'localhost'; // XAMPP server
$dbname = 'asset_management_db'; // ชื่อฐานข้อมูลที่คุณสร้าง
$user = 'root'; // ผู้ใช้เริ่มต้นของ XAMPP
$password = ''; // รหัสผ่าน (ส่วนใหญ่จะว่างถ้าใช้ XAMPP)

try {
    // สร้าง Object การเชื่อมต่อ PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password);
    // ตั้งค่าโหมด Error ให้แสดง Exception (สำหรับ Debug)
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // ตั้งค่าให้ดึงผลลัพธ์เป็น Associative Array โดยดีฟอลต์
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // กรณีเชื่อมต่อฐานข้อมูลล้มเหลว
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}
// หากเชื่อมต่อสำเร็จ จะมี Object $pdo พร้อมใช้งาน
?>