<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$stmt = $db->query("DESCRIBE users");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($columns);
