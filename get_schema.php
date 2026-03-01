<?php
require_once 'asset_management_api/config/database.php';
$database = new Database();
$db = $database->getConnection();
$stmt = $db->query('SHOW CREATE TABLE users');
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo $row['Create Table'];
?>
