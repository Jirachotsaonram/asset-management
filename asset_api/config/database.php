<?php
class Database {
    private $host = "localhost";
    private $db_name = "asset_management_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function __construct() {
        $server_addr = $_SERVER['SERVER_ADDR'] ?? '';
        $server_name = $_SERVER['SERVER_NAME'] ?? '';
        
        $isLocal = ($server_name === 'localhost' || $server_addr === '127.0.0.1' || $server_addr === '::1');

        if (!$isLocal) {
            // ตั้งค่าสำหรับรันบนเซิร์ฟเวอร์คณะ (ITIServer)
            $this->host = "localhost"; // ให้ชี้เข้าตัวเอง
            $this->db_name = "asset_management_db"; // ชื่อฐานข้อมูลที่คุณสร้างใน Webmin
            $this->username = "itisv"; // รหัสของ Webmin หรือถ้าใช้ root ก็แก้เป็น root
            $this->password = "@EH3319&2awr"; // รหัสของ Webmin หรือถ้าไม่ได้ตั้งก็ปล่อยว่าง
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