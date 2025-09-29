<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST'); 

include 'db_connect.php'; 

$data = json_decode(file_get_contents("php://input"));

// 1. การตรวจสอบข้อมูลที่จำเป็น
if (!isset($data->asset_id) || 
    !isset($data->new_location_id) || 
    !isset($data->moved_by)) 
{
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Missing required fields: asset_id, new_location_id, and moved_by are mandatory.']);
    exit();
}

try {
    $asset_id = $data->asset_id;
    $new_location_id = $data->new_location_id; // ตำแหน่งใหม่
    $moved_by = $data->moved_by;           // ผู้ดำเนินการย้าย (user_id)
    $remark = $data->remark ?? 'บันทึกการย้ายโดย Inspector/Admin';

    // 2. ดึง Location ID ปัจจุบัน (ตำแหน่งเดิม) ก่อนทำการอัปเดต
    $sql_get_old_loc = "SELECT location_id FROM Assets WHERE asset_id = :asset_id";
    $stmt_get_old_loc = $pdo->prepare($sql_get_old_loc);
    $stmt_get_old_loc->bindParam(':asset_id', $asset_id);
    $stmt_get_old_loc->execute();
    $current_location = $stmt_get_old_loc->fetchColumn(); 

    if (!$current_location) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Asset not found.']);
        exit();
    }
    
    // **เริ่มต้น Transaction** เพื่อให้มั่นใจว่าทั้ง 2 คำสั่ง (UPDATE และ INSERT) จะสำเร็จพร้อมกัน
    $pdo->beginTransaction(); 

    // 3. คำสั่งที่ 1: อัปเดตตำแหน่งใหม่ในตาราง Assets
    $sql_update_asset = "
        UPDATE Assets 
        SET location_id = :new_location_id 
        WHERE asset_id = :asset_id
    ";
    $stmt_update = $pdo->prepare($sql_update_asset);
    $stmt_update->bindParam(':new_location_id', $new_location_id);
    $stmt_update->bindParam(':asset_id', $asset_id);
    $stmt_update->execute();

    // 4. คำสั่งที่ 2: บันทึกประวัติการย้ายในตาราง Asset_History
    $sql_insert_history = "
        INSERT INTO Asset_History 
        (asset_id, old_location_id, new_location_id, moved_by, move_date, remark) 
        VALUES 
        (:asset_id, :old_location_id, :new_location_id, :moved_by, NOW(), :remark)
    ";
    $stmt_insert = $pdo->prepare($sql_insert_history);
    $stmt_insert->bindParam(':asset_id', $asset_id);
    $stmt_insert->bindParam(':old_location_id', $current_location); // ตำแหน่งเดิม
    $stmt_insert->bindParam(':new_location_id', $new_location_id);
    $stmt_insert->bindParam(':moved_by', $moved_by);
    $stmt_insert->bindParam(':remark', $remark);
    $stmt_insert->execute();

    // 5. Commit Transaction หากทุกอย่างสำเร็จ
    $pdo->commit(); 

    http_response_code(200); // OK
    echo json_encode([
        'success' => true,
        'message' => 'Asset location updated and history recorded successfully.',
        'history_id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    // 6. Rollback หากเกิดข้อผิดพลาด
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    $error_message = 'Database error: ' . $e->getMessage();
    
    if ($e->getCode() == '23000') {
         $error_message = 'Data integrity violation. Check if asset_id, new_location_id, or moved_by are valid IDs.';
    }

    echo json_encode(['success' => false, 'message' => $error_message]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'General error: ' . $e->getMessage()]);
}
?>