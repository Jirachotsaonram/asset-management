<?php
class Borrow {
    private $conn;
    private $table_name = "Borrow";

    public $borrow_id;
    public $asset_id;
    public $borrower_name;
    public $department_id;
    public $borrow_date;
    public $return_date;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_id=:asset_id, borrower_name=:borrower_name,
                      department_id=:department_id, borrow_date=:borrow_date,
                      return_date=:return_date, status=:status";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":borrower_name", $this->borrower_name);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":borrow_date", $this->borrow_date);
        $stmt->bindParam(":return_date", $this->return_date);
        $stmt->bindParam(":status", $this->status);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT b.*, a.asset_name, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN Assets a ON b.asset_id = a.asset_id
                  LEFT JOIN Departments d ON b.department_id = d.department_id
                  ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readByAsset() {
        $query = "SELECT b.*, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN Departments d ON b.department_id = d.department_id
                  WHERE b.asset_id = :asset_id
                  ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->execute();
        return $stmt;
    }

    public function readActive() {
        $query = "SELECT b.*, a.asset_name, d.department_name
                  FROM " . $this->table_name . " b
                  LEFT JOIN Assets a ON b.asset_id = a.asset_id
                  LEFT JOIN Departments d ON b.department_id = d.department_id
                  WHERE b.status = 'ยืม'
                  ORDER BY b.borrow_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function updateStatus() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status=:status, return_date=:return_date
                  WHERE borrow_id = :borrow_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":return_date", $this->return_date);
        $stmt->bindParam(":borrow_id", $this->borrow_id);

        return $stmt->execute();
    }
}
?>