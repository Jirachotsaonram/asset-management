<?php
require_once 'asset_management_api/config/database.php';
$database = new Database();
$db = $database->getConnection();
$table = $_GET['table'] ?? 'audittrail';
$stmt = $db->query("DESCRIBE $table");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
