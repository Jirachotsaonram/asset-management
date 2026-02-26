<?php
// เพิ่มการแสดง Error สำหรับ Debug (ลบออกในโปรดักชั่น)
error_reporting(E_ALL);
ini_set('display_errors', 0); // ไม่แสดง error ในหน้าจอ
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'utils/Response.php';

$request_method = $_SERVER["REQUEST_METHOD"];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse URL
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/asset-management/asset_management_api/', '', $path);
$path = str_replace('/asset_management_api/', '', $path); // local dev fallback
$segments = explode('/', trim($path, '/'));

$endpoint = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

// Routing
switch ($endpoint) {
    // ==================== AUTH ====================
    case 'auth':
        require_once 'controllers/AuthController.php';
        $controller = new AuthController();
        
        if ($id === 'login' && $request_method === 'POST') {
            $controller->login();
        } elseif ($id === 'register' && $request_method === 'POST') {
            $controller->register();
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== ASSETS ====================
    case 'assets':
        require_once 'controllers/AssetController.php';
        require_once 'middleware/auth.php';
        
        $controller = new AssetController();
        
        // GET requests - Viewer, Inspector, Admin สามารถดูได้
        if ($request_method === 'GET' && !$id && !isset($_GET['q'])) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id) {
            $controller->getOne($id);
        } elseif ($request_method === 'GET' && isset($_GET['q'])) {
            $controller->search();
        } 
        // POST, PUT, DELETE - เฉพาะ Admin และ Inspector เท่านั้น
        elseif ($request_method === 'POST') {
            requireAdminOrInspector();
            $controller->create();
        } elseif ($request_method === 'PUT' && $id) {
            requireAdminOrInspector();
            $controller->update($id);
        } elseif ($request_method === 'DELETE' && $id) {
            requireAdminOrInspector();
            $controller->delete($id);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== DEPARTMENTS ====================
    case 'departments':
        require_once 'controllers/DepartmentController.php';
        require_once 'middleware/auth.php';
        
        $controller = new DepartmentController();
        
        // GET requests - ทุกคนสามารถดูได้
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id) {
            $controller->getOne($id);
        } 
        // POST, PUT, DELETE - เฉพาะ Admin เท่านั้น
        elseif ($request_method === 'POST') {
            requireAdmin();
            $controller->create();
        } elseif ($request_method === 'PUT' && $id) {
            requireAdmin();
            $controller->update($id);
        } elseif ($request_method === 'DELETE' && $id) {
            requireAdmin();
            $controller->delete($id);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== LOCATIONS ====================
    case 'locations':
        require_once 'controllers/LocationController.php';
        require_once 'middleware/auth.php';
        
        $controller = new LocationController();
        
        // GET requests - ทุกคนสามารถดูได้
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id) {
            $controller->getOne($id);
        } 
        // POST, PUT, DELETE - เฉพาะ Admin และ Inspector เท่านั้น
        elseif ($request_method === 'POST') {
            requireAdminOrInspector();
            $controller->create();
        } elseif ($request_method === 'PUT' && $id) {
            requireAdminOrInspector();
            $controller->update($id);
        } elseif ($request_method === 'DELETE' && $id) {
            requireAdminOrInspector();
            $controller->delete($id);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== ASSET CHECKS ====================
    case 'checks':
        require_once 'controllers/AssetCheckController.php';
        require_once 'middleware/auth.php';
        
        $controller = new AssetCheckController();
        
        // GET requests - ทุกคนสามารถดูได้
        if ($request_method === 'GET' && !$id && !$action) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id === 'unchecked') {
            $controller->getUnchecked();
        } elseif ($request_method === 'GET' && $id === 'asset' && $action) {
            $controller->getByAsset($action);
        } 
        // POST - เฉพาะ Admin และ Inspector เท่านั้น
        elseif ($request_method === 'POST') {
            $user_data = requireAdminOrInspector();
            $controller->create($user_data);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== ASSET HISTORY ====================
    case 'history':
        require_once 'controllers/AssetHistoryController.php';
        require_once 'middleware/auth.php';
        
        $user_data = authenticate();
        $controller = new AssetHistoryController();
        
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id === 'asset' && $action) {
            $controller->getByAsset($action);
        } elseif ($request_method === 'POST') {
            $controller->create($user_data);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== BORROW ====================
    case 'borrows':
        require_once 'controllers/BorrowController.php';
        require_once 'middleware/auth.php';
        
        $controller = new BorrowController();
        
        // GET requests - ทุกคนสามารถดูได้
        if ($request_method === 'GET' && !$id && !$action) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id === 'active') {
            $controller->getActive();
        } elseif ($request_method === 'GET' && $id === 'asset' && $action) {
            $controller->getByAsset($action);
        } 
        // POST, PUT - เฉพาะ Admin และ Inspector เท่านั้น
        elseif (($request_method === 'POST' || $request_method === 'PUT') && $id && $action === 'return') {
            $user_data = requireAdminOrInspector();
            $controller->returnAsset($id, $user_data);
        } elseif ($request_method === 'POST') {
            $user_data = requireAdminOrInspector();
            $controller->create($user_data);
        } elseif ($request_method === 'PUT' && $id) {
            $user_data = requireAdminOrInspector();
            $controller->returnAsset($id, $user_data);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== AUDIT TRAIL ====================
    case 'audits':
        require_once 'controllers/AuditTrailController.php';
        require_once 'middleware/auth.php';
        
        authenticate();
        $controller = new AuditTrailController();
        
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id === 'asset' && $action) {
            $controller->getByAsset($action);
        } elseif ($request_method === 'GET' && $id === 'user' && $action) {
            $controller->getByUser($action);
        } elseif ($request_method === 'GET' && $id === 'export') {
            // GET /audits/export?format=excel หรือ csv
            $format = $_GET['format'] ?? 'csv';
            if ($format === 'excel') {
                $controller->exportExcel();
            } else {
                $controller->exportCSV();
            }
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== USERS ====================
    case 'users':
        require_once 'controllers/UserController.php';
        require_once 'middleware/auth.php';
        
        $controller = new UserController();
        
        if ($request_method === 'GET' && $id === 'profile') {
            // GET /users/profile - ดึงข้อมูลโปรไฟล์ตัวเอง
            $user_data = authenticate();
            $controller->getOne($user_data['user_id']);
            
        } elseif ($request_method === 'PUT' && $id === 'profile') {
            // PUT /users/profile - แก้ไขโปรไฟล์ตัวเอง
            $user_data = authenticate();
            $controller->updateProfile($user_data);
            
        } elseif ($request_method === 'GET' && !$id) {
            // GET /users - ดึงผู้ใช้ทั้งหมด (เฉพาะ Admin)
            requireAdmin();
            $controller->getAll();
            
        } elseif ($request_method === 'GET' && $id && !$action) {
            // GET /users/{id} - ดึงผู้ใช้คนเดียว (เฉพาะ Admin)
            requireAdmin();
            $controller->getOne($id);
            
        } elseif ($request_method === 'POST' && !$id) {
            // POST /users - เพิ่มผู้ใช้ใหม่ (เฉพาะ Admin)
            requireAdmin();
            $controller->create();
            
        } elseif ($request_method === 'PUT' && $id && $action === 'status') {
            // PUT /users/{id}/status - อัปเดตสถานะ (เฉพาะ Admin)
            requireAdmin();
            $controller->updateStatus($id);
            
        } elseif ($request_method === 'PUT' && $id && !$action) {
            // PUT /users/{id} - อัปเดตข้อมูลผู้ใช้ (เฉพาะ Admin)
            requireAdmin();
            $controller->update($id);
            
        } elseif ($request_method === 'DELETE' && $id) {
            // DELETE /users/{id} - ลบผู้ใช้ (เฉพาะ Admin)
            requireAdmin();
            $controller->delete($id);
            
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== UPLOAD ====================
    case 'upload':
        require_once 'controllers/UploadController.php';
        require_once 'middleware/auth.php';
        
        authenticate();
        $controller = new UploadController();
        
        if ($request_method === 'POST' && $id === 'asset' && $action) {
            // POST /upload/asset/{asset_id}
            $controller->uploadAssetImage($action);
        } elseif ($request_method === 'DELETE' && $id === 'asset' && $action) {
            // DELETE /upload/asset/{asset_id}
            $controller->deleteAssetImage($action);
        } elseif ($request_method === 'POST' && $id === 'multiple') {
            // POST /upload/multiple
            $controller->uploadMultipleImages();
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

        // ==================== REPORTS ====================
    case 'reports':
        require_once 'controllers/ReportController.php';
        require_once 'middleware/auth.php';
        
        authenticate();
        $controller = new ReportController();
        
        if ($request_method === 'GET') {
            if ($id === 'asset-summary') {
                // GET /reports/asset-summary - รายงานสรุปครุภัณฑ์
                $controller->assetSummary();
                
            } elseif ($id === 'check-report') {
                // GET /reports/check-report?start_date=xxx&end_date=xxx
                $controller->checkReport($_GET);
                
            } elseif ($id === 'by-status') {
                // GET /reports/by-status - สรุปตามสถานะ
                $controller->assetByStatus();
                
            } elseif ($id === 'by-department') {
                // GET /reports/by-department - สรุปตามหน่วยงาน
                $controller->assetByDepartment();
                
            } elseif ($id === 'unchecked') {
                // GET /reports/unchecked?days=365&page=1&limit=50&search=xxx&building=xxx...
                $controller->uncheckedAssets($_GET);
                
            } elseif ($id === 'movement-history') {
                // GET /reports/movement-history?start_date=xxx&end_date=xxx
                $controller->movementHistory($_GET);
                
            } elseif ($id === 'borrow-report') {
                // GET /reports/borrow-report?status=ยืม
                $status = $_GET['status'] ?? null;
                $controller->borrowReport($status);
                
            } elseif ($id === 'export') {
                // GET /reports/export?type=asset_summary&format=csv
                $reportType = $_GET['type'] ?? 'asset_summary';
                $format = $_GET['format'] ?? 'csv';
                
                if ($format === 'excel') {
                    $controller->exportExcel($reportType, $_GET);
                } else {
                    $controller->exportCSV($reportType, $_GET);
                }
                
            } else {
                Response::error('ไม่พบประเภทรายงาน', 404);
            }
        } else {
            Response::error('Method not allowed', 405);
        }
        break;

    // ==================== CHECK SCHEDULES ====================
    case 'check-schedules':
        require_once 'controllers/CheckScheduleController.php';
        require_once 'middleware/auth.php';
        
        authenticate();
        $controller = new CheckScheduleController();
        
        if ($request_method === 'GET' && !$id) {
            $controller->getAllSchedules();
        } elseif ($request_method === 'GET' && $id === 'notifications') {
            $controller->getNotifications();
        } elseif ($request_method === 'GET' && $id === 'overdue') {
            $controller->getOverdue();
        } elseif ($request_method === 'GET' && $id === 'all-notifications') {
            $controller->getAllNotifications();
        } elseif ($request_method === 'POST' && $id === 'assign-asset') {
            $controller->assignToAsset();
        } elseif ($request_method === 'POST' && $id === 'assign-location') {
            $controller->assignToLocation();
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== IMPORT ====================
    case 'import':
        require_once 'controllers/ImportController.php';
        require_once 'middleware/auth.php';
        
        $controller = new ImportController();
        
        if ($request_method === 'GET' && $id === 'template') {
            // GET /import/template - Download CSV template
            $controller->downloadTemplate();
        } elseif ($request_method === 'GET' && $id === 'history') {
            // GET /import/history - Get import history
            authenticate();
            $controller->getImportHistory();
        } elseif ($request_method === 'GET' && $id === 'references') {
            // GET /import/references - Get reference data
            authenticate();
            $controller->getReferences();
        } elseif ($request_method === 'POST' && $id === 'validate') {
            // POST /import/validate - Validate CSV data
            authenticate();
            $controller->validateCSV();
        } elseif ($request_method === 'POST' && $id === 'ocr') {
            // POST /import/ocr - Process OCR on image
            $controller->processOCR();
        } elseif ($request_method === 'POST' && $id === 'assets') {
            // POST /import/assets - Import assets
            $user_data = authenticate();
            $controller->importAssets($user_data);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== BACKUP ====================
    case 'backup':
        require_once 'controllers/BackupController.php';
        require_once 'middleware/auth.php';
        
        requireAdmin(); // เฉพาะ Admin เท่านั้น
        $controller = new BackupController();
        
        if ($request_method === 'GET') {
            $controller->export();
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;
}
?>