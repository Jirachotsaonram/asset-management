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
     * Validate CSV/Excel data before import
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

                // Validate serial_number uniqueness (skip if empty or '-')
                if (!empty($row->serial_number) && $row->serial_number !== '-') {
                    $checkQuery = "SELECT asset_id FROM Assets WHERE serial_number = :serial AND serial_number != '' AND serial_number != '-'";
                    $stmt = $this->db->prepare($checkQuery);
                    $stmt->bindParam(':serial', $row->serial_number);
                    $stmt->execute();
                    if ($stmt->rowCount() > 0) {
                        $errors[] = "Serial Number ซ้ำกับครุภัณฑ์ที่มีอยู่แล้ว";
                    }
                }

                // Resolve department: by ID or by name
                if (!empty($row->department_id)) {
                    $checkDept = "SELECT department_id FROM Departments WHERE department_id = :dept_id";
                    $stmtDept = $this->db->prepare($checkDept);
                    $stmtDept->bindParam(':dept_id', $row->department_id);
                    $stmtDept->execute();
                    if ($stmtDept->rowCount() === 0) {
                        $errors[] = "ไม่พบหน่วยงาน ID: {$row->department_id}";
                    }
                } elseif (!empty($row->department_name_excel) || !empty($row->faculty_name)) {
                    // Try to find department by name or faculty
                    $deptName = !empty($row->department_name_excel) ? $row->department_name_excel : $row->faculty_name;
                    $findDept = "SELECT department_id FROM Departments WHERE department_name = :dept_name OR faculty = :dept_name LIMIT 1";
                    $stmtFind = $this->db->prepare($findDept);
                    $stmtFind->bindParam(':dept_name', $deptName);
                    $stmtFind->execute();
                    if ($stmtFind->rowCount() > 0) {
                        $found = $stmtFind->fetch(PDO::FETCH_ASSOC);
                        $row->department_id = $found['department_id'];
                    }
                    // Not finding department is OK - importAssets will create it
                }

                // Resolve location: by ID or by name
                if (!empty($row->location_id)) {
                    $checkLoc = "SELECT location_id FROM Locations WHERE location_id = :loc_id";
                    $stmtLoc = $this->db->prepare($checkLoc);
                    $stmtLoc->bindParam(':loc_id', $row->location_id);
                    $stmtLoc->execute();
                    if ($stmtLoc->rowCount() === 0) {
                        $errors[] = "ไม่พบสถานที่ ID: {$row->location_id}";
                    }
                } elseif (!empty($row->room_text) || !empty($row->location_name)) {
                    // Try to find location by room_number
                    $locName = !empty($row->room_text) ? $row->room_text : $row->location_name;
                    $findLoc = "SELECT location_id FROM Locations WHERE room_number = :loc_name LIMIT 1";
                    $stmtFindLoc = $this->db->prepare($findLoc);
                    $stmtFindLoc->bindParam(':loc_name', $locName);
                    $stmtFindLoc->execute();
                    if ($stmtFindLoc->rowCount() > 0) {
                        $found = $stmtFindLoc->fetch(PDO::FETCH_ASSOC);
                        $row->location_id = $found['location_id'];
                    }
                    // Not finding location is OK - importAssets will create it
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

                // Build description from extra Excel fields
                $descParts = [];
                if (!empty($row->description)) $descParts[] = $row->description;
                // Store location_name in room_text if no location_id found
                if (!empty($row->location_name) && empty($row->location_id)) {
                    $row->room_text = $row->location_name;
                }
                if (!empty($row->vendor)) $descParts[] = "ผู้ขาย: {$row->vendor}";
                if (!empty($row->requester)) $descParts[] = "ผู้เบิก: {$row->requester}";
                if (!empty($row->budget_year)) $descParts[] = "ปีงบประมาณ: {$row->budget_year}";
                if (!empty($row->delivery_number)) {
                    $refParts = [];
                    if (!empty($row->reference_number)) $refParts[] = $row->reference_number;
                    $refParts[] = "ใบส่งของ: {$row->delivery_number}";
                    $row->reference_number = implode(' | ', $refParts);
                }
                if (count($descParts) > 0) {
                    $row->description = implode(' | ', $descParts);
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
                    $this->asset->serial_number = (!empty($row->serial_number) && $row->serial_number !== '-') ? $row->serial_number : '';
                    $this->asset->quantity = $row->quantity ?? 1;
                    $this->asset->unit = $row->unit ?? 'เครื่อง';
                    $this->asset->price = $row->price ?? 0;
                    $this->asset->received_date = $row->received_date ?? date('Y-m-d');
                    // Auto-resolve or create Department
                    if (empty($row->department_id) && (!empty($row->faculty_name) || !empty($row->department_name_excel))) {
                        $deptName = !empty($row->faculty_name) ? $row->faculty_name : $row->department_name_excel;
                        
                        $check = $this->db->prepare("SELECT department_id FROM Departments WHERE department_name = ? OR faculty = ? LIMIT 1");
                        $check->execute([$deptName, $deptName]);
                        $found = $check->fetch();
                        
                        if ($found) {
                            $row->department_id = $found['department_id'];
                        } else {
                            $ins = $this->db->prepare("INSERT INTO Departments (department_name, faculty) VALUES (?, ?)");
                            if ($ins->execute([$deptName, $deptName])) {
                                $row->department_id = $this->db->lastInsertId();
                            }
                        }
                    }

                    // Auto-resolve or create Location
                    if (empty($row->location_id) && (!empty($row->room_text) || !empty($row->location_name))) {
                        $locName = !empty($row->room_text) ? $row->room_text : $row->location_name;
                        
                        $check = $this->db->prepare("SELECT location_id FROM Locations WHERE room_number = ? LIMIT 1");
                        $check->execute([$locName]);
                        $found = $check->fetch();
                        
                        if ($found) {
                            $row->location_id = $found['location_id'];
                        } else {
                            $newBuilding = 'ไม่ระบุอาคาร';
                            $newFloor = '1';
                            if (preg_match('/^([A-Za-z]+)(\d+)-/', $locName, $m)) {
                                $newBuilding = "อาคาร " . strtoupper($m[1]);
                                $newFloor = $m[2];
                            } elseif (preg_match('/^(\d)\d{2}/', $locName, $m)) {
                                $newFloor = $m[1];
                            }

                            $ins = $this->db->prepare("INSERT INTO Locations (building_name, floor, room_number) VALUES (?, ?, ?)");
                            if ($ins->execute([$newBuilding, $newFloor, $locName])) {
                                $row->location_id = $this->db->lastInsertId();
                            }
                        }
                    }

                    $this->asset->department_id = !empty($row->department_id) ? $row->department_id : null;
                    $this->asset->location_id = !empty($row->location_id) ? $row->location_id : null;
                    $this->asset->status = $row->status ?? 'ใช้งานได้';
                    $this->asset->barcode = !empty($row->barcode) ? $row->barcode : 'QR' . time() . rand(1000, 9999) . $index;
                    $this->asset->description = $row->description ?? '';
                    $this->asset->reference_number = $row->reference_number ?? '';
                    $this->asset->faculty_name = $row->faculty_name ?? null;
                    $this->asset->delivery_number = $row->delivery_number ?? null;
                    $this->asset->fund_code = $row->fund_code ?? null;
                    $this->asset->plan_code = $row->plan_code ?? null;
                    $this->asset->project_code = $row->project_code ?? null;
                    $this->asset->room_text = $row->room_text ?? null;
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
                'barcode',
                'description',
                'reference_number'
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
                'QR001',
                'คุณสมบัติ: CPU Intel Core i7, RAM 16GB',
                'REF-2024-001'
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
                'QR002',
                'คุณสมบัติ: พิมพ์ขาวดำ 30 แผ่น/นาที',
                'REF-2024-002'
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