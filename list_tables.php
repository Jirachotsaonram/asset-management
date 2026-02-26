<?php
require_once 'asset_management_api/config/database.php';
$database = new Database();
$db = $database->getConnection();
$stmt = $db->query("SHOW TABLES");
while($row = $stmt->fetch(PDO::FETCH_NUM)) {
    echo $row[0] . PHP_EOL;
}
