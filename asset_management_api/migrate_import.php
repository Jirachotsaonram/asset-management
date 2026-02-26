<?php
// FILE: asset_management_api/migrate_import.php
require_once 'config/database.php';
require_once 'utils/Response.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $sql = "CREATE TABLE IF NOT EXISTS import_history (
        import_id INT AUTO_INCREMENT PRIMARY KEY,
        import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        filename VARCHAR(255),
        total_rows INT,
        success_count INT,
        failed_count INT,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $db->exec($sql);
    echo json_encode(["success" => true, "message" => "Table 'import_history' created successfully"]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
