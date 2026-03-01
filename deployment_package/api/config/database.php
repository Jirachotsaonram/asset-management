<?php
class Database {
    private $host = "localhost";
    private $db_name = "asset_management_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function __construct() {
        // สำหรับขึ้น Server จริง: แก้ไขข้อมูลด้านล่างให้ตรงกับ Server
        if ($_SERVER['SERVER_NAME'] !== 'localhost' && $_SERVER['SERVER_ADDR'] !== '127.0.0.1') {
            $this->host = "localhost";
            $this->db_name = "asset_management_db";
            $this->username = "itisv";
            $this->password = "@EH3319&2awr";
        }
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8mb4");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>