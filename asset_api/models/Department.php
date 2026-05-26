<?php
class Department {
    private $conn;
    private $table_name = "departments";

    public $department_id;
    public $faculty;
    public $division_name;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET faculty=:faculty, division_name=:division_name";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":faculty", $this->faculty);
        $stmt->bindParam(":division_name", $this->division_name);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY faculty";
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
                  SET faculty=:faculty, division_name=:division_name
                  WHERE department_id = :department_id";
        
        $stmt = $this->conn->prepare($query);

        $this->faculty = htmlspecialchars(strip_tags($this->faculty));
        $this->division_name = htmlspecialchars(strip_tags($this->division_name ?? ''));

        $stmt->bindParam(":faculty", $this->faculty);
        $stmt->bindParam(":division_name", $this->division_name);
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