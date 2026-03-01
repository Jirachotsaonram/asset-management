<?php
class AuditTrail {
    private $conn;
    private $table_name = "audittrail";

    public $audit_id;
    public $user_id;
    public $asset_id;
    public $action;
    public $old_value;
    public $new_value;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET user_id=:user_id, asset_id=:asset_id, action=:action,
                      old_value=:old_value, new_value=:new_value";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":action", $this->action);
        $stmt->bindParam(":old_value", $this->old_value);
        $stmt->bindParam(":new_value", $this->new_value);

        return $stmt->execute();
    }

    public function readAll() {
        $query = "SELECT at.*, u.fullname, a.asset_name
                  FROM " . $this->table_name . " at
                  LEFT JOIN users u ON at.user_id = u.user_id
                  LEFT JOIN assets a ON at.asset_id = a.asset_id
                  ORDER BY at.action_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readByAsset() {
        $query = "SELECT at.*, u.fullname
                  FROM " . $this->table_name . " at
                  LEFT JOIN users u ON at.user_id = u.user_id
                  WHERE at.asset_id = :asset_id
                  ORDER BY at.action_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->execute();
        return $stmt;
    }

    public function readByUser() {
        $query = "SELECT at.*, a.asset_name
                  FROM " . $this->table_name . " at
                  LEFT JOIN assets a ON at.asset_id = a.asset_id
                  WHERE at.user_id = :user_id
                  ORDER BY at.action_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->execute();
        return $stmt;
    }
}
?>