<?php
// ตั้งค่า CORS Headers (สำคัญมากสำหรับ React)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// จัดการ Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); 
}

include 'db_connect.php'; 

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        // ----------------------- 1. GET: ดึงรายการผู้ใช้งานทั้งหมด -----------------------
        case 'GET':
            $sql = "SELECT user_id, username, fullname, role, email, phone, status FROM Users";
            $stmt = $pdo->query($sql);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $users]);
            break;

        // ----------------------- 2. POST: เพิ่มผู้ใช้งานใหม่ -----------------------
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            // ตรวจสอบข้อมูลที่จำเป็น
            if (empty($data->username) || empty($data->password) || empty($data->fullname) || empty($data->role)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
                exit();
            }

            // **สำคัญ: ควร Hash รหัสผ่านก่อนบันทึก**
            $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);

            $sql = "
                INSERT INTO Users (username, password, fullname, role, email, phone, status) 
                VALUES (:username, :password, :fullname, :role, :email, :phone, :status)
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':username' => $data->username,
                ':password' => $hashed_password,
                ':fullname' => $data->fullname,
                ':role' => $data->role,
                ':email' => $data->email ?? null,
                ':phone' => $data->phone ?? null,
                ':status' => $data->status ?? 'Active'
            ]);

            http_response_code(201); // Created
            echo json_encode(['success' => true, 'message' => 'User added successfully.', 'user_id' => $pdo->lastInsertId()]);
            break;

        // ----------------------- 3. PUT: แก้ไขข้อมูลผู้ใช้งาน -----------------------
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->user_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'User ID is required for update.']);
                exit();
            }
            
            // สร้าง Query แบบ Dynamic เพื่อ Update เฉพาะฟิลด์ที่ส่งมา
            $setClauses = [];
            $params = [':user_id' => $data->user_id];
            
            if (isset($data->fullname)) { $setClauses[] = "fullname = :fullname"; $params[':fullname'] = $data->fullname; }
            if (isset($data->role)) { $setClauses[] = "role = :role"; $params[':role'] = $data->role; }
            if (isset($data->status)) { $setClauses[] = "status = :status"; $params[':status'] = $data->status; }
            if (isset($data->email)) { $setClauses[] = "email = :email"; $params[':email'] = $data->email; }
            if (isset($data->phone)) { $setClauses[] = "phone = :phone"; $params[':phone'] = $data->phone; }
            
            // หากมีการส่งรหัสผ่านใหม่มา ให้ Hash ด้วย
            if (!empty($data->password)) { 
                $setClauses[] = "password = :password"; 
                $params[':password'] = password_hash($data->password, PASSWORD_DEFAULT);
            }

            if (empty($setClauses)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No fields provided for update.']);
                exit();
            }

            $sql = "UPDATE Users SET " . implode(', ', $setClauses) . " WHERE user_id = :user_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
            break;

        // ----------------------- 4. DELETE: ลบผู้ใช้งาน -----------------------
        case 'DELETE':
            // ใน Axios จะส่งข้อมูล DELETE ผ่าน Body ในรูปแบบ JSON
            $data = json_decode(file_get_contents("php://input"));
            $user_id = $data->user_id ?? null;

            if (empty($user_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'User ID is required for deletion.']);
                exit();
            }

            $sql = "DELETE FROM Users WHERE user_id = :user_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':user_id' => $user_id]);

            echo json_encode(['success' => true, 'message' => 'User deleted successfully.']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    // Error 23000 คือ Unique constraint violation (Username ซ้ำ)
    if ($e->getCode() == '23000') {
         echo json_encode(['success' => false, 'message' => 'Data integrity error: Username already exists or data constraint violation.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
    }
}
?>