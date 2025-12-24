<?php
// FILE: asset_management_api/controllers/ImportController.php
require_once 'config/database.php';
require_once 'models/Asset.php';
require_once 'utils/Response.php';

class ImportController {
    private $db;
    private $asset;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->asset = new Asset($this->db);
    }

    /**
     * Validate CSV data before import
     * POST /import/validate
     */
    public function validateCSV() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->rows) || !is_array($data->rows)) {
                Response::error('ไม่พบข้อมูลที่ต้องการตรวจสอบ', 400);
            }

            $results = [
                'valid' => [],
                'invalid' => [],
                'summary' => [
                    'total' => count($data->rows),
                    'valid_count' => 0,
                    'invalid_count' => 0
                ]
            ];

            foreach ($data->rows as $index => $row) {
                $rowNumber = $index + 1;
                $errors = [];

                // Validate required fields
                if (empty($row->asset_name)) {
                    $errors[] = 'ไม่พบชื่อครุภัณฑ์';
                }

                // Validate serial_number uniqueness
                if (!empty($row->serial_number)) {
                    $checkQuery = "SELECT asset_id FROM Assets WHERE serial_number = :serial";
                    $stmt = $this->db->prepare($checkQuery);
                    $stmt->bindParam(':serial', $row->serial_number);
                    $stmt->execute();
                    if ($stmt->rowCount() > 0) {
                        $errors[] = "Serial Number ซ้ำกับครุภัณฑ์ที่มีอยู่แล้ว";
                    }
                }

                // Validate department_id
                if (!empty($row->department_id)) {
                    $checkDept = "SELECT department_id FROM Departments WHERE department_id = :dept_id";
                    $stmtDept = $this->db->prepare($checkDept);
                    $stmtDept->bindParam(':dept_id', $row->department_id);
                    $stmtDept->execute();
                    if ($stmtDept->rowCount() === 0) {
                        $errors[] = "ไม่พบหน่วยงาน ID: {$row->department_id}";
                    }
                }

                // Validate location_id
                if (!empty($row->location_id)) {
                    $checkLoc = "SELECT location_id FROM Locations WHERE location_id = :loc_id";
                    $stmtLoc = $this->db->prepare($checkLoc);
                    $stmtLoc->bindParam(':loc_id', $row->location_id);
                    $stmtLoc->execute();
                    if ($stmtLoc->rowCount() === 0) {
                        $errors[] = "ไม่พบสถานที่ ID: {$row->location_id}";
                    }
                }

                // Validate price
                if (isset($row->price) && !is_numeric($row->price)) {
                    $errors[] = "ราคาต้องเป็นตัวเลข";
                }

                // Validate quantity
                if (isset($row->quantity) && (!is_numeric($row->quantity) || $row->quantity < 1)) {
                    $errors[] = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
                }

                // Validate status
                $validStatuses = ['ใช้งานได้', 'รอซ่อม', 'รอจำหน่าย', 'จำหน่ายแล้ว', 'ไม่พบ', 'ยืม'];
                if (!empty($row->status) && !in_array($row->status, $validStatuses)) {
                    $errors[] = "สถานะไม่ถูกต้อง";
                }

                if (empty($errors)) {
                    $results['valid'][] = [
                        'row' => $rowNumber,
                        'data' => $row
                    ];
                    $results['summary']['valid_count']++;
                } else {
                    $results['invalid'][] = [
                        'row' => $rowNumber,
                        'data' => $row,
                        'errors' => $errors
                    ];
                    $results['summary']['invalid_count']++;
                }
            }

            Response::success('ตรวจสอบข้อมูลเสร็จสิ้น', $results);

        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Import assets from validated CSV data
     * POST /import/assets
     */
    public function importAssets($user_data) {
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->rows) || !is_array($data->rows)) {
                Response::error('ไม่พบข้อมูลที่ต้องการนำเข้า', 400);
            }

            $this->db->beginTransaction();

            $results = [
                'success' => [],
                'failed' => [],
                'summary' => [
                    'total' => count($data->rows),
                    'success_count' => 0,
                    'failed_count' => 0
                ]
            ];

            foreach ($data->rows as $index => $row) {
                $rowNumber = $index + 1;
                
                try {
                    // Prepare asset data
                    $this->asset->asset_name = $row->asset_name ?? '';
                    $this->asset->serial_number = $row->serial_number ?? '';
                    $this->asset->quantity = $row->quantity ?? 1;
                    $this->asset->unit = $row->unit ?? 'เครื่อง';
                    $this->asset->price = $row->price ?? 0;
                    $this->asset->received_date = $row->received_date ?? date('Y-m-d');
                    $this->asset->department_id = !empty($row->department_id) ? $row->department_id : null;
                    $this->asset->location_id = !empty($row->location_id) ? $row->location_id : null;
                    $this->asset->status = $row->status ?? 'ใช้งานได้';
                    $this->asset->barcode = $row->barcode ?? 'QR' . uniqid();
                    $this->asset->image = '';

                    $asset_id = $this->asset->create();
                    
                    if ($asset_id) {
                        $results['success'][] = [
                            'row' => $rowNumber,
                            'asset_id' => $asset_id,
                            'asset_name' => $row->asset_name
                        ];
                        $results['summary']['success_count']++;
                    } else {
                        throw new Exception('ไม่สามารถเพิ่มครุภัณฑ์ได้');
                    }

                } catch (Exception $e) {
                    $results['failed'][] = [
                        'row' => $rowNumber,
                        'data' => $row,
                        'error' => $e->getMessage()
                    ];
                    $results['summary']['failed_count']++;
                }
            }

            $this->db->commit();

            Response::success('นำเข้าข้อมูลเสร็จสิ้น', $results);

        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Download CSV template
     * GET /import/template
     */
    public function downloadTemplate() {
        try {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="asset_import_template.csv"');
            
            $output = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // CSV Headers
            fputcsv($output, [
                'asset_name',
                'serial_number',
                'quantity',
                'unit',
                'price',
                'received_date',
                'department_id',
                'location_id',
                'status',
                'barcode'
            ]);

            // Example data
            fputcsv($output, [
                'คอมพิวเตอร์ Dell Optiplex 7080',
                'SN123456789',
                '1',
                'เครื่อง',
                '25000',
                '2024-01-15',
                '1',
                '1',
                'ใช้งานได้',
                'QR001'
            ]);

            fputcsv($output, [
                'เครื่องพิมพ์ HP LaserJet',
                'SN987654321',
                '1',
                'เครื่อง',
                '15000',
                '2024-02-20',
                '1',
                '2',
                'ใช้งานได้',
                'QR002'
            ]);

            fclose($output);
            exit;

        } catch (Exception $e) {
            Response::error('ไม่สามารถดาวน์โหลด Template ได้', 500);
        }
    }

    /**
     * Get reference data for import
     * GET /import/references
     */
    public function getReferences() {
        try {
            $departments = [];
            $locations = [];

            // Get departments
            $deptQuery = "SELECT department_id, department_name, faculty FROM Departments ORDER BY department_name";
            $stmtDept = $this->db->prepare($deptQuery);
            $stmtDept->execute();
            while ($row = $stmtDept->fetch(PDO::FETCH_ASSOC)) {
                $departments[] = $row;
            }

            // Get locations
            $locQuery = "SELECT location_id, building_name, floor, room_number FROM Locations ORDER BY building_name, floor, room_number";
            $stmtLoc = $this->db->prepare($locQuery);
            $stmtLoc->execute();
            while ($row = $stmtLoc->fetch(PDO::FETCH_ASSOC)) {
                $locations[] = $row;
            }

            Response::success('ดึงข้อมูลอ้างอิงสำเร็จ', [
                'departments' => $departments,
                'locations' => $locations,
                'valid_statuses' => ['ใช้งานได้', 'รอซ่อม', 'รอจำหน่าย', 'จำหน่ายแล้ว', 'ไม่พบ', 'ยืม']
            ]);

        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาด: ' . $e->getMessage(), 500);
        }
    }
}
?>