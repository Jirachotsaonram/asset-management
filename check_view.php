<?php
require_once 'asset_management_api/config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    $stmt = $db->query("SHOW CREATE VIEW v_assets_with_check_info");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($row, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
