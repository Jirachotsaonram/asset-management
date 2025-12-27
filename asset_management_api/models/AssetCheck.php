<?php
class AssetCheck {
    private $conn;
    private $table_name = "asset_check";

    public $check_id;
    public $asset_id;
    public $user_id;
    public $check_date;
    public $check_status;
    public $remark;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_id=:asset_id, user_id=:user_id, check_date=:check_date,
                      check_status=:check_status, remark=:remark";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":check_date", $this->check_date);
        $stmt->bindParam(":check_status", $this->check_status);
        $stmt->bindParam(":remark", $this->remark);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT ac.*, a.asset_name, u.fullname as checker_name 
                  FROM " . $this->table_name . " ac
                  LEFT JOIN assets a ON ac.asset_id = a.asset_id
                  LEFT JOIN users u ON ac.user_id = u.user_id
                  ORDER BY ac.check_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readByAsset() {
        $query = "SELECT ac.*, u.fullname as checker_name 
                  FROM " . $this->table_name . " ac
                  LEFT JOIN Users u ON ac.user_id = u.user_id
                  WHERE ac.asset_id = :asset_id
                  ORDER BY ac.check_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->execute();
        return $stmt;
    }

    public function getUncheckedAssets() {
        $query = "SELECT a.* FROM assets a
                  WHERE a.asset_id NOT IN (
                      SELECT asset_id FROM " . $this->table_name . "
                      WHERE check_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
                  )
                  ORDER BY a.asset_name";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>