<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization');

include 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

try {
    switch ($method) {
        
        // ===================================
        // A. GET: ดึงข้อมูลหน่วยงานทั้งหมด
        // ===================================
        case 'GET':
            $sql = "SELECT department_id, department_name, faculty FROM Departments ORDER BY department_name";
            $stmt = $pdo->query($sql);
            $departments = $stmt->fetchAll();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $departments]);
            break;

        // ===================================
        // B. POST: เพิ่มหน่วยงานใหม่
        // ===================================
        case 'POST':
            if (!isset($data->department_name) || !isset($data->faculty)) {
                throw new Exception('Missing required fields: department_name and faculty.', 400);
            }
            $sql = "INSERT INTO Departments (department_name, faculty) 
                    VALUES (:department_name, :faculty)";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':department_name', $data->department_name);
            $stmt->bindParam(':faculty', $data->faculty);
            $stmt->execute();

            http_response_code(201); // Created
            echo json_encode(['success' => true, 'message' => 'Department added successfully', 'department_id' => $pdo->lastInsertId()]);
            break;

        // ===================================
        // C. PUT: แก้ไขข้อมูลหน่วยงาน
        // ===================================
        case 'PUT':
            if (!isset($data->department_id) || (!isset($data->department_name) && !isset($data->faculty))) {
                throw new Exception('Missing department_id or data for update.', 400);
            }
            
            // โค้ดสร้าง SQL UPDATE คล้ายกับ manage_locations.php
            $update_fields = [];
            $update_params = [];
            $allowed_fields = ['department_name', 'faculty'];
            foreach ($allowed_fields as $field) {
                if (isset($data->$field)) {
                    $update_fields[] = "{$field} = :{$field}";
                    $update_params[":{$field}"] = $data->$field;
                }
            }
            if (empty($update_fields)) {
                 throw new Exception('No valid fields provided for update.', 400);
            }

            $sql = "UPDATE Departments SET " . implode(', ', $update_fields) . " WHERE department_id = :department_id";
            $stmt = $pdo->prepare($sql);
            $update_params[':department_id'] = $data->department_id;
            $stmt->execute($update_params);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Department updated successfully']);
            break;

        // ===================================
        // D. DELETE: ลบหน่วยงาน
        // ===================================
        case 'DELETE':
            $department_id = $_GET['department_id'] ?? $data->department_id ?? null;
            if (!$department_id) {
                throw new Exception('Missing department_id for deletion.', 400);
            }
            
            $sql = "DELETE FROM Departments WHERE department_id = :department_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':department_id', $department_id);
            $stmt->execute();

            if ($stmt->rowCount() == 0) {
                 http_response_code(404);
                 echo json_encode(['success' => false, 'message' => 'Department not found or already deleted.']);
            } else {
                 http_response_code(200);
                 echo json_encode(['success' => true, 'message' => 'Department deleted successfully']);
            }
            break;
            
        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
    }

} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>