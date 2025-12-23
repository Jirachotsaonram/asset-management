<?php
// FILE: asset_management_api/controllers/ImportController.php
require_once 'config/database.php';
require_once 'models/Asset.php';
require_once 'models/Location.php';
require_once 'models/Department.php';
require_once 'utils/Response.php';

class ImportController {
    private $db;
    private $asset;
    private $location;
    private $department;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->asset = new Asset($this->db);
        $this->location = new Location($this->db);
        $this->department = new Department($this->db);
    }

    // Validate imported data
    public function validateImport() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->rows) || !is_array($data->rows)) {
            Response::error('ข้อมูลไม่ถูกต้อง', 400);
        }

        $validationResults = [
            'total' => count($data->rows),
            'valid' => 0,
            'errors' => [],
            'warnings' => []
        ];

        foreach ($data->rows as $index => $row) {
            $rowNumber = $index + 2; // +2 เพราะนับจากแถวที่ 2 (แถวแรกเป็น header)
            $hasError = false;

            // Validate required fields
            if (empty($row->asset_name)) {
                $validationResults['errors'][] = [
                    'row' => $rowNumber,
                    'field' => 'ชื่อตั้งเบิก',
                    'message' => 'ไม่มีชื่อครุภัณฑ์'
                ];
                $hasError = true;
            }

            if (empty($row->unit)) {
                $validationResults['errors'][] = [
                    'row' => $rowNumber,
                    'field' => 'หน่วยนับ',
                    'message' => 'ไม่มีหน่วยนับ'
                ];
                $hasError = true;
            }

            if (empty($row->price) || !is_numeric($row->price)) {
                $validationResults['errors'][] = [
                    'row' => $rowNumber,
                    'field' => 'มูลค่าครุภัณฑ์',
                    'message' => 'มูลค่าครุภัณฑ์ไม่ถูกต้อง'
                ];
                $hasError = true;
            }

            if (empty($row->quantity) || !is_numeric($row->quantity)) {
                $validationResults['errors'][] = [
                    'row' => $rowNumber,
                    'field' => 'จำนวน',
                    'message' => 'จำนวนไม่ถูกต้อง'
                ];
                $hasError = true;
            }

            // Check for duplicate asset_id
            if (!empty($row->asset_id)) {
                $query = "SELECT asset_id FROM Assets WHERE asset_id = :asset_id";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':asset_id', $row->asset_id);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $validationResults['errors'][] = [
                        'row' => $rowNumber,
                        'field' => 'หมายเลขครุภัณฑ์',
                        'message' => 'หมายเลขครุภัณฑ์ซ้ำในระบบ'
                    ];
                    $hasError = true;
                }
            }

            // Warnings
            if (empty($row->serial_number)) {
                $validationResults['warnings'][] = [
                    'row' => $rowNumber,
                    'field' => 'หมายเลขซีเรียล',
                    'message' => 'ไม่มีหมายเลขซีเรียล (แนะนำให้กรอก)'
                ];
            }

            if (empty($row->room_number)) {
                $validationResults['warnings'][] = [
                    'row' => $rowNumber,
                    'field' => 'ใช้ประจำห้อง',
                    'message' => 'ไม่ระบุห้องที่ติดตั้ง'
                ];
            }

            if (!$hasError) {
                $validationResults['valid']++;
            }
        }

        Response::success('ตรวจสอบข้อมูลเสร็จสิ้น', $validationResults);
    }

    // Import assets
    public function importAssets() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->rows) || !is_array($data->rows)) {
            Response::error('ข้อมูลไม่ถูกต้อง', 400);
        }

        $successCount = 0;
        $failedCount = 0;
        $errors = [];

        $this->db->beginTransaction();

        try {
            foreach ($data->rows as $index => $row) {
                $rowNumber = $index + 2;

                // Find or create location
                $location_id = null;
                if (!empty($row->building_name) && !empty($row->room_number)) {
                    $location_id = $this->findOrCreateLocation(
                        $row->building_name,
                        $row->floor ?? '1',
                        $row->room_number
                    );
                }

                // Find or create department
                $department_id = null;
                if (!empty($row->department_name)) {
                    $department_id = $this->findOrCreateDepartment($row->department_name);
                }

                // Generate barcode if not provided
                $barcode = !empty($row->barcode) ? $row->barcode : 'QR' . time() . rand(1000, 9999);

                // Insert asset
                $query = "INSERT INTO Assets 
                          (asset_id, asset_name, serial_number, quantity, unit, price, 
                           received_date, department_id, location_id, status, barcode)
                          VALUES 
                          (:asset_id, :asset_name, :serial_number, :quantity, :unit, :price,
                           :received_date, :department_id, :location_id, :status, :barcode)";

                $stmt = $this->db->prepare($query);
                
                $asset_id = !empty($row->asset_id) ? $row->asset_id : null;
                $received_date = !empty($row->received_date) ? $row->received_date : date('Y-m-d');
                $status = 'ใช้งานได้';

                $stmt->bindParam(':asset_id', $asset_id);
                $stmt->bindParam(':asset_name', $row->asset_name);
                $stmt->bindParam(':serial_number', $row->serial_number);
                $stmt->bindParam(':quantity', $row->quantity);
                $stmt->bindParam(':unit', $row->unit);
                $stmt->bindParam(':price', $row->price);
                $stmt->bindParam(':received_date', $received_date);
                $stmt->bindParam(':department_id', $department_id);
                $stmt->bindParam(':location_id', $location_id);
                $stmt->bindParam(':status', $status);
                $stmt->bindParam(':barcode', $barcode);

                if ($stmt->execute()) {
                    $successCount++;
                } else {
                    $failedCount++;
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => 'ไม่สามารถบันทึกได้'
                    ];
                }
            }

            $this->db->commit();

            Response::success('นำเข้าข้อมูลสำเร็จ', [
                'success' => $successCount,
                'failed' => $failedCount,
                'errors' => $errors
            ]);

        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    // Find or create location
    private function findOrCreateLocation($building_name, $floor, $room_number) {
        // Try to find existing location
        $query = "SELECT location_id FROM Locations 
                  WHERE building_name = :building_name 
                  AND floor = :floor 
                  AND room_number = :room_number";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':building_name', $building_name);
        $stmt->bindParam(':floor', $floor);
        $stmt->bindParam(':room_number', $room_number);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['location_id'];
        }

        // Create new location
        $query = "INSERT INTO Locations (building_name, floor, room_number) 
                  VALUES (:building_name, :floor, :room_number)";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':building_name', $building_name);
        $stmt->bindParam(':floor', $floor);
        $stmt->bindParam(':room_number', $room_number);
        
        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }

        return null;
    }

    // Find or create department
    private function findOrCreateDepartment($department_name) {
        // Try to find existing department
        $query = "SELECT department_id FROM Departments WHERE department_name = :department_name";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':department_name', $department_name);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['department_id'];
        }

        // Create new department
        $query = "INSERT INTO Departments (department_name) VALUES (:department_name)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':department_name', $department_name);
        
        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }

        return null;
    }
}
?>