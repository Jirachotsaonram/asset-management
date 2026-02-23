<?php
require_once 'asset_management_api/config/database.php';

$database = new Database();
$db = $database->getConnection();

$tables = ['assets', 'Asset_History', 'Locations', 'Users', 'Audit_Trail'];

foreach ($tables as $table) {
    echo "Checking table: $table\n";
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    if ($stmt->rowCount() > 0) {
        echo "  Found: $table\n";
        $columns = $db->query("DESCRIBE $table");
        while ($col = $columns->fetch(PDO::FETCH_ASSOC)) {
            echo "    - " . $col['Field'] . " (" . $col['Type'] . ")\n";
        }
    } else {
        echo "  NOT FOUND: $table\n";
        // Try lowercase
        $lower = strtolower($table);
        $stmt = $db->query("SHOW TABLES LIKE '$lower'");
        if ($stmt->rowCount() > 0) {
            echo "  Found instead: $lower\n";
            $columns = $db->query("DESCRIBE $lower");
            while ($col = $columns->fetch(PDO::FETCH_ASSOC)) {
                echo "    - " . $col['Field'] . " (" . $col['Type'] . ")\n";
            }
        }
    }
    echo "\n";
}
?>
