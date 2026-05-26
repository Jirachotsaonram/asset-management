<?php
// FILE: asset_management_api/controllers/BackupController.php
require_once 'config/database.php';
require_once 'utils/Response.php';

class BackupController {
    private $db;
    private $db_name;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        
        // ดึงชื่อ DB จาก config/database.php
        $reflect = new ReflectionClass($database);
        $prop = $reflect->getProperty('db_name');
        $prop->setAccessible(true);
        $this->db_name = $prop->getValue($database);
    }

    /**
     * Export database to SQL file
     */
    public function export() {
        try {
            $tables = [];
            $result = $this->db->query("SHOW TABLES");
            while ($row = $result->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }

            $sql = "-- Asset Management System Database Backup\n";
            $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
            $sql .= "SET NAMES utf8mb4;\n";
            $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

            foreach ($tables as $table) {
                // Get table structure
                $res = $this->db->query("SHOW CREATE TABLE `$table` ");
                $row = $res->fetch(PDO::FETCH_NUM);
                $sql .= "DROP TABLE IF EXISTS `$table`;\n";
                $sql .= $row[1] . ";\n\n";

                // Get table data
                $res = $this->db->query("SELECT * FROM `$table` ");
                $rows = $res->fetchAll(PDO::FETCH_ASSOC);

                if (count($rows) > 0) {
                    $sql .= "INSERT INTO `$table` VALUES ";
                    $insert_rows = [];
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($row as $val) {
                            if ($val === null) {
                                $values[] = "NULL";
                            } else {
                                $values[] = $this->db->quote($val);
                            }
                        }
                        $insert_rows[] = "(" . implode(', ', $values) . ")";
                    }
                    $sql .= implode(",\n", $insert_rows) . ";\n\n";
                }
            }

            $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

            // Headers for download
            header('Content-Type: application/sql');
            header('Content-Disposition: attachment; filename="backup_' . $this->db_name . '_' . date('Ymd_His') . '.sql"');
            echo $sql;
            exit();

        } catch (Exception $e) {
            Response::error('เกิดข้อผิดพลาดในการสำรองข้อมูล: ' . $e->getMessage(), 500);
        }
    }
}
