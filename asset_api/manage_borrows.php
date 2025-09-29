<?php
// ตั้งค่า CORS Headers (สำคัญมาก)
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
$data = json_decode(file_get_contents("php://input"));

try {
    switch ($method) {
        // ----------------------- 1. GET: ดึงรายการยืมทั้งหมด -----------------------
        case 'GET':
            $sql = "
                SELECT 
                    B.*, 
                    A.asset_name, 
                    D.department_name 
                FROM Borrow B
                JOIN Assets A ON B.asset_id = A.asset_id
                JOIN Departments D ON B.department_id = D.department_id
                ORDER BY B.borrow_date DESC
            ";
            $stmt = $pdo->query($sql);
            $borrows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $borrows]);
            break;

        // ----------------------- 2. POST: บันทึกการยืมใหม่ -----------------------
        case 'POST':
            $pdo->beginTransaction();

            // 1. ตรวจสอบข้อมูล
            if (empty($data->asset_id) || empty($data->borrower_name) || empty($data->department_id) || empty($data->borrow_date)) {
                throw new Exception('Missing required fields for borrowing.', 400);
            }

            // 2. ตรวจสอบสถานะครุภัณฑ์ในตาราง Assets (ห้ามยืมซ้ำ)
            $sql_check = "SELECT status FROM Assets WHERE asset_id = :asset_id";
            $stmt_check = $pdo->prepare($sql_check);
            $stmt_check->execute([':asset_id' => $data->asset_id]);
            $asset_status = $stmt_check->fetchColumn();

            if ($asset_status !== 'ใช้งานได้') {
                throw new Exception('Asset status is not "ใช้งานได้" (Current Status: ' . $asset_status . ')', 400);
            }

            // 3. บันทึกในตาราง Borrow
            $sql_borrow = "
                INSERT INTO Borrow (asset_id, borrower_name, department_id, borrow_date, status) 
                VALUES (:asset_id, :borrower_name, :department_id, :borrow_date, 'ยืม')
            ";
            $stmt_borrow = $pdo->prepare($sql_borrow);
            $stmt_borrow->execute([
                ':asset_id' => $data->asset_id,
                ':borrower_name' => $data->borrower_name,
                ':department_id' => $data->department_id,
                ':borrow_date' => $data->borrow_date
            ]);

            // 4. อัปเดตสถานะในตาราง Assets เป็น "ถูกยืม"
            $sql_asset_update = "UPDATE Assets SET status = 'ถูกยืม' WHERE asset_id = :asset_id";
            $stmt_asset_update = $pdo->prepare($sql_asset_update);
            $stmt_asset_update->execute([':asset_id' => $data->asset_id]);

            $pdo->commit();
            http_response_code(201); // Created
            echo json_encode(['success' => true, 'message' => 'Asset successfully borrowed.', 'borrow_id' => $pdo->lastInsertId()]);
            break;

        // ----------------------- 3. PUT: บันทึกการคืนครุภัณฑ์ -----------------------
        case 'PUT':
            $pdo->beginTransaction();

            // 1. ตรวจสอบข้อมูล
            if (empty($data->borrow_id) || empty($data->return_date)) {
                throw new Exception('Borrow ID and Return Date are required for return.', 400);
            }
            
            // 2. ดึงข้อมูลการยืมเดิม (เพื่อเอา asset_id)
            $sql_get_asset = "SELECT asset_id, status FROM Borrow WHERE borrow_id = :borrow_id";
            $stmt_get_asset = $pdo->prepare($sql_get_asset);
            $stmt_get_asset->execute([':borrow_id' => $data->borrow_id]);
            $borrow_record = $stmt_get_asset->fetch(PDO::FETCH_ASSOC);

            if (!$borrow_record) {
                throw new Exception('Borrow record not found.', 404);
            }
            if ($borrow_record['status'] === 'คืนแล้ว') {
                throw new Exception('This asset has already been returned.', 400);
            }
            $asset_id = $borrow_record['asset_id'];
            
            // 3. อัปเดตสถานะในตาราง Borrow เป็น "คืนแล้ว" และบันทึกวันที่คืน
            $sql_borrow_update = "
                UPDATE Borrow SET 
                return_date = :return_date, 
                status = 'คืนแล้ว' 
                WHERE borrow_id = :borrow_id
            ";
            $stmt_borrow_update = $pdo->prepare($sql_borrow_update);
            $stmt_borrow_update->execute([
                ':return_date' => $data->return_date,
                ':borrow_id' => $data->borrow_id
            ]);

            // 4. อัปเดตสถานะในตาราง Assets กลับเป็น "ใช้งานได้"
            $sql_asset_return = "UPDATE Assets SET status = 'ใช้งานได้' WHERE asset_id = :asset_id";
            $stmt_asset_return = $pdo->prepare($sql_asset_return);
            $stmt_asset_return->execute([':asset_id' => $asset_id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Asset successfully returned.']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
            break;
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code($e->getCode() === 400 || $e->getCode() === 404 ? $e->getCode() : 500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>