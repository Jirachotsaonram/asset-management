<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$stmt = $db->query('SHOW TABLES');
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach($tables as $table) {
    echo "\nTABLE: $table\n";
    $desc = $db->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
    foreach($desc as $col) {
        echo $col['Field'] . ' (' . $col['Type'] . ') ' . ($col['Key'] ? 'Key:'.$col['Key'] : '') . "\n";
    }
}
