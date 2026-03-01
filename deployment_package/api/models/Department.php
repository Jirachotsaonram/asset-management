<?php
class Department {
    private $conn;
    private $table_name = "departments";

    public $department_id;
    public $department_name;
    public $faculty;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET department_name=:department_name, faculty=:faculty";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":department_name", $this->department_name);
        $stmt->bindParam(":faculty", $this->faculty);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY department_name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE department_id = :department_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->execute();
        return $stmt;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET department_name=:department_name, faculty=:faculty
                  WHERE department_id = :department_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":department_name", $this->department_name);
        $stmt->bindParam(":faculty", $this->faculty);
        $stmt->bindParam(":department_id", $this->department_id);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE department_id = :department_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":department_id", $this->department_id);
        return $stmt->execute();
    }
}
?>