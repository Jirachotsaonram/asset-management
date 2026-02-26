<?php
require_once 'asset_management_api/config/database.php';
require_once 'asset_management_api/utils/Response.php';

function test_endpoint($name, $url) {
    echo "Testing $name... ";
    // Since we are running locally, we can just include the controller and call the method
    // But it's easier to just do a quick PDO query to check if the table and columns exist
}

$database = new Database();
$db = $database->getConnection();

$tests = [
    "assets" => "SELECT * FROM assets LIMIT 1",
    "audittrail" => "SELECT at.*, u.fullname FROM audittrail at LEFT JOIN users u ON at.user_id = u.user_id LIMIT 1",
    "borrow" => "SELECT b.*, a.asset_name FROM borrow b LEFT JOIN assets a ON b.asset_id = a.asset_id LIMIT 1",
    "view" => "SELECT * FROM v_assets_with_check_info LIMIT 1"
];

foreach ($tests as $name => $sql) {
    try {
        $stmt = $db->query($sql);
        if ($stmt) {
            echo "✅ $name: OK\n";
        } else {
            echo "❌ $name: Failed (no stmt)\n";
        }
    } catch (Exception $e) {
        echo "❌ $name: Error - " . $e->getMessage() . "\n";
    }
}
?>
