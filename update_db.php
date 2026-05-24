<?php
require_once __DIR__ . '/asset_management_api/config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($conn) {
    try {
        $conn->exec("UPDATE assets SET status = 'ใช้งาน' WHERE status = 'ใช้งานได้'");
        $conn->exec("UPDATE asset_check SET check_status = 'ใช้งาน' WHERE check_status = 'ใช้งานได้'");
        echo "Database updated successfully.";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage();
    }
} else {
    echo "Connection failed.";
}
