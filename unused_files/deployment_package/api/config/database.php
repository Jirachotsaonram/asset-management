<?php
class Database {
    private $host = "localhost";
    private $db_name = "asset_management_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function __construct() {
        // ตรวจสอบว่าเป็น Local Environment (localhost, 127.0.0.1, หรือ Private IP ในวง LAN)
        $server_addr = $_SERVER['SERVER_ADDR'] ?? '';
        $server_name = $_SERVER['SERVER_NAME'] ?? '';
        
        $isLocal = ($server_name === 'localhost' || $server_addr === '127.0.0.1' || $server_addr === '::1' ||
                    $server_addr === '10.40.143.98' || // Current Local IP
                    strpos($server_addr, '192.168.0.') === 0 || // ITI Internal IP range
                    strpos($server_addr, '10.14.91.') === 0 || // ITI Internal IP range
                    strpos($server_addr, '192.168.') === 0 || 
                    strpos($server_addr, '10.') === 0 || 
                    strpos($server_addr, '172.') === 0 || // 172.16.0.0 – 172.31.255.255
                    empty($server_addr)); // CLI mode

        if (!$isLocal) {
            // สำหรับขึ้น Server จริง: แก้ไขข้อมูลด้านล่างให้ตรงกับ Server
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