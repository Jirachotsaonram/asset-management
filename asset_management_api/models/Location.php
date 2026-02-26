<?php
class Location {
    private $conn;
    private $table_name = "locations";

    public $location_id;
    public $building_name;
    public $floor;  // ← เพิ่มบรรทัดนี้
    public $room_number;
    public $description;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET building_name=:building_name, 
                      floor=:floor,
                      room_number=:room_number, 
                      description=:description";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":building_name", $this->building_name);
        $stmt->bindParam(":floor", $this->floor);
        $stmt->bindParam(":room_number", $this->room_number);
        $stmt->bindParam(":description", $this->description);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  ORDER BY building_name, floor, room_number";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE location_id = :location_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->execute();
        return $stmt;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET building_name=:building_name, 
                      floor=:floor,
                      room_number=:room_number,
                      description=:description
                  WHERE location_id = :location_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":building_name", $this->building_name);
        $stmt->bindParam(":floor", $this->floor);
        $stmt->bindParam(":room_number", $this->room_number);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":location_id", $this->location_id);

        return $stmt->execute();
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE location_id = :location_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":location_id", $this->location_id);
        return $stmt->execute();
    }
}
?>