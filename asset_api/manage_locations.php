<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE'); // อนุญาตให้ใช้ GET, POST, DELETE, PUT
header('Access-Control-Allow-Headers: Content-Type, Authorization');

include 'db_connect.php'; 

// 1. ตรวจสอบ HTTP Method ที่ร้องขอ
$method = $_SERVER['REQUEST_METHOD'];

// 2. รับข้อมูลจาก Client
$data = json_decode(file_get_contents("php://input"));

try {
    switch ($method) {
        
        // ===================================
        // A. GET: ดึงข้อมูลสถานที่ตั้งทั้งหมด
        // ===================================
        case 'GET':
            $sql = "SELECT location_id, building_name, room_number, description FROM Locations ORDER BY building_name, room_number";
            $stmt = $pdo->query($sql);
            $locations = $stmt->fetchAll();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $locations]);
            break;

        // ===================================
        // B. POST: เพิ่มสถานที่ตั้งใหม่
        // ===================================
        case 'POST':
            if (!isset($data->building_name) || !isset($data->room_number)) {
                throw new Exception('Missing required fields: building_name and room_number.', 400);
            }
            $sql = "INSERT INTO Locations (building_name, room_number, description) 
                    VALUES (:building_name, :room_number, :description)";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':building_name', $data->building_name);
            $stmt->bindParam(':room_number', $data->room_number);
            $stmt->bindParam(':description', $data->description);
            $stmt->execute();

            http_response_code(201); // Created
            echo json_encode(['success' => true, 'message' => 'Location added successfully', 'location_id' => $pdo->lastInsertId()]);
            break;

        // ===================================
        // C. PUT: แก้ไขข้อมูลสถานที่ตั้ง
        // ===================================
        case 'PUT':
            if (!isset($data->location_id) || (!isset($data->building_name) && !isset($data->room_number) && !isset($data->description))) {
                throw new Exception('Missing location_id or data for update.', 400);
            }
            // ใช้โค้ดสร้าง SQL UPDATE คล้ายกับ update_asset.php
            $update_fields = [];
            $update_params = [];
            $allowed_fields = ['building_name', 'room_number', 'description'];
            foreach ($allowed_fields as $field) {
                if (isset($data->$field)) {
                    $update_fields[] = "{$field} = :{$field}";
                    $update_params[":{$field}"] = $data->$field;
                }
            }
            if (empty($update_fields)) {
                 throw new Exception('No valid fields provided for update.', 400);
            }

            $sql = "UPDATE Locations SET " . implode(', ', $update_fields) . " WHERE location_id = :location_id";
            $stmt = $pdo->prepare($sql);
            $update_params[':location_id'] = $data->location_id;
            $stmt->execute($update_params);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Location updated successfully']);
            break;

        // ===================================
        // D. DELETE: ลบสถานที่ตั้ง
        // ===================================
        case 'DELETE':
            // สำหรับ DELETE เราจะรับ location_id ผ่าน URL Parameter (Query String) หรือ Body ก็ได้
            $location_id = $_GET['location_id'] ?? $data->location_id ?? null;
            if (!$location_id) {
                throw new Exception('Missing location_id for deletion.', 400);
            }
            
            // ใช้ SQL เพื่อลบ
            $sql = "DELETE FROM Locations WHERE location_id = :location_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':location_id', $location_id);
            $stmt->execute();

            if ($stmt->rowCount() == 0) {
                 http_response_code(404);
                 echo json_encode(['success' => false, 'message' => 'Location not found or already deleted.']);
            } else {
                 http_response_code(200);
                 echo json_encode(['success' => true, 'message' => 'Location deleted successfully']);
            }
            break;
            
        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
    }

} catch (Exception $e) {
    // จัดการข้อผิดพลาดทั่วไปและข้อผิดพลาดจากฐานข้อมูล
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>