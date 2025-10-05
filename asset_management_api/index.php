<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'utils/Response.php';

$request_method = $_SERVER["REQUEST_METHOD"];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse URL
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/asset-management/asset_management_api/', '', $path);
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
        
        if ($request_method !== 'GET') {
            $user_data = authenticate();
        }
        
        $controller = new AssetController();
        
        if ($request_method === 'GET' && !$id && !isset($_GET['q'])) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id) {
            $controller->getOne($id);
        } elseif ($request_method === 'GET' && isset($_GET['q'])) {
            $controller->search();
        } elseif ($request_method === 'POST') {
            $controller->create();
        } elseif ($request_method === 'PUT' && $id) {
            $controller->update($id);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== DEPARTMENTS ====================
    case 'departments':
        require_once 'controllers/DepartmentController.php';
        require_once 'middleware/auth.php';
        
        if ($request_method !== 'GET') {
            $user_data = authenticate();
        }
        
        $controller = new DepartmentController();
        
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id) {
            $controller->getOne($id);
        } elseif ($request_method === 'POST') {
            $controller->create();
        } elseif ($request_method === 'PUT' && $id) {
            $controller->update($id);
        } elseif ($request_method === 'DELETE' && $id) {
            $controller->delete($id);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== LOCATIONS ====================
    case 'locations':
        require_once 'controllers/LocationController.php';
        require_once 'middleware/auth.php';
        
        if ($request_method !== 'GET') {
            $user_data = authenticate();
        }
        
        $controller = new LocationController();
        
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id) {
            $controller->getOne($id);
        } elseif ($request_method === 'POST') {
            $controller->create();
        } elseif ($request_method === 'PUT' && $id) {
            $controller->update($id);
        } elseif ($request_method === 'DELETE' && $id) {
            $controller->delete($id);
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== ASSET CHECKS ====================
    case 'checks':
        require_once 'controllers/AssetCheckController.php';
        require_once 'middleware/auth.php';
        
        $user_data = authenticate();
        $controller = new AssetCheckController();
        
        if ($request_method === 'GET' && !$id && !$action) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id === 'unchecked') {
            $controller->getUnchecked();
        } elseif ($request_method === 'GET' && $id === 'asset' && $action) {
            $controller->getByAsset($action);
        } elseif ($request_method === 'POST') {
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
        
        $user_data = authenticate();
        $controller = new BorrowController();
        
        if ($request_method === 'GET' && !$id && !$action) {
            $controller->getAll();
        } elseif ($request_method === 'GET' && $id === 'active') {
            $controller->getActive();
        } elseif ($request_method === 'GET' && $id === 'asset' && $action) {
            $controller->getByAsset($action);
        } elseif ($request_method === 'POST') {
            $controller->create($user_data);
        } elseif ($request_method === 'PUT' && $id) {
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
        } else {
            Response::error('ไม่พบเส้นทาง API', 404);
        }
        break;

    // ==================== USERS ====================
    case 'users':
        require_once 'controllers/UserController.php';
        require_once 'middleware/auth.php';
        
        authenticate();
        $controller = new UserController();
        
        if ($request_method === 'GET' && !$id) {
            $controller->getAll();
        } elseif ($request_method === 'PUT' && $id && $action === 'status') {
            $controller->updateStatus($id);
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

    default:
        Response::error('ไม่พบเส้นทาง API', 404);
        break;
}
?>