<?php
require_once 'asset_management_api/config/database.php';
$database = new Database();
$db = $database->getConnection();

$stmt = $db->query("SELECT username, role, LENGTH(role) as len FROM users");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "User: [" . $row['username'] . "] | Role: [" . $row['role'] . "] | Length: " . $row['len'] . " | Hex: " . bin2hex($row['role']) . "\n";
}
?>
