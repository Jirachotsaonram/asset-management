<?php
// FILE: asset_management_api/return_borrow.php
// หรือเพิ่มใน borrows.php สำหรับ PUT method

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db_connect.php';

// รับข้อมูล
$input = file_get_contents("php://input");
$data = json_decode($input);

// ดึง borrow_id จาก URL หรือ body
$borrow_id = isset($_GET['id']) ? $_GET['id'] : (isset($data->borrow_id) ? $data->borrow_id : null);

if (!$borrow_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ไม่พบ borrow_id']);
    exit();
}

try {
    // อัพเดทการคืน
    $return_date = isset($data->return_date) ? $data->return_date : date('Y-m-d');
    $return_remark = isset($data->return_remark) ? $data->return_remark : 'คืนปกติ';
    $status = 'คืนแล้ว';

    $sql = "UPDATE Borrow SET 
                return_date = :return_date,
                return_remark = :return_remark,
                status = :status
            WHERE borrow_id = :borrow_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':return_date' => $return_date,
        ':return_remark' => $return_remark,
        ':status' => $status,
        ':borrow_id' => $borrow_id
    ]);

    // อัพเดทสถานะครุภัณฑ์กลับเป็น 'ใช้งานได้'
    $sql2 = "UPDATE Assets SET status = 'ใช้งานได้' 
             WHERE asset_id = (SELECT asset_id FROM Borrow WHERE borrow_id = :borrow_id)";
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->execute([':borrow_id' => $borrow_id]);

    echo json_encode([
        'success' => true,
        'message' => 'บันทึกการคืนสำเร็จ',
        'data' => [
            'borrow_id' => $borrow_id,
            'return_date' => $return_date,
            'status' => $status
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
}
?>