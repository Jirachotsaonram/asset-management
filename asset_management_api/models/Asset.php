<?php
class Asset {
    private $conn;
    private $table_name = "assets";

    public $asset_id;
    public $asset_name;
    public $serial_number;
    public $quantity;
    public $unit;
    public $price;
    public $received_date;
    public $department_id;
    public $location_id;
    public $status;
    public $barcode;
    public $image;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_name=:asset_name, serial_number=:serial_number, 
                      quantity=:quantity, unit=:unit, price=:price, 
                      received_date=:received_date, department_id=:department_id, 
                      location_id=:location_id, status=:status, barcode=:barcode, image=:image";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_name", $this->asset_name);
        $stmt->bindParam(":serial_number", $this->serial_number);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":unit", $this->unit);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":received_date", $this->received_date);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":barcode", $this->barcode);
        $stmt->bindParam(":image", $this->image);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function readAll() {
        // ใช้ View ที่มีข้อมูลครบถ้วน
        $query = "SELECT * FROM v_assets_with_check_info ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT * FROM v_assets_with_check_info 
                  WHERE asset_id = :asset_id OR barcode = :barcode";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_id", $this->asset_id);
        $stmt->bindParam(":barcode", $this->barcode);
        $stmt->execute();
        return $stmt;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET asset_name=:asset_name, serial_number=:serial_number, 
                      quantity=:quantity, unit=:unit, price=:price, 
                      department_id=:department_id, location_id=:location_id, 
                      status=:status, image=:image
                  WHERE asset_id = :asset_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_name", $this->asset_name);
        $stmt->bindParam(":serial_number", $this->serial_number);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":unit", $this->unit);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":asset_id", $this->asset_id);

        return $stmt->execute();
    }

    public function search($keyword) {
        $query = "SELECT * FROM v_assets_with_check_info
                  WHERE asset_name LIKE :keyword 
                     OR serial_number LIKE :keyword 
                     OR barcode LIKE :keyword
                  ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $keyword = "%{$keyword}%";
        $stmt->bindParam(":keyword", $keyword);
        $stmt->execute();
        return $stmt;
    }
}