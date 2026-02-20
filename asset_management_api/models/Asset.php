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
    public $description;
    public $reference_number;
    public $faculty_name;
    public $delivery_number;
    public $fund_code;
    public $plan_code;
    public $project_code;
    public $room_text;
    public $image;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET asset_name=:asset_name, serial_number=:serial_number, 
                      quantity=:quantity, unit=:unit, price=:price, 
                      received_date=:received_date, department_id=:department_id, 
                      location_id=:location_id, room_text=:room_text, status=:status, barcode=:barcode,
                      description=:description, reference_number=:reference_number,
                      faculty_name=:faculty_name, delivery_number=:delivery_number,
                      fund_code=:fund_code, plan_code=:plan_code, project_code=:project_code,
                      image=:image";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_name", $this->asset_name);
        $stmt->bindParam(":serial_number", $this->serial_number);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":unit", $this->unit);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":received_date", $this->received_date);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->bindParam(":room_text", $this->room_text);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":barcode", $this->barcode);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":reference_number", $this->reference_number);
        $stmt->bindParam(":faculty_name", $this->faculty_name);
        $stmt->bindParam(":delivery_number", $this->delivery_number);
        $stmt->bindParam(":fund_code", $this->fund_code);
        $stmt->bindParam(":plan_code", $this->plan_code);
        $stmt->bindParam(":project_code", $this->project_code);
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
                      department_id=:department_id, location_id=:location_id, room_text=:room_text,
                      status=:status, description=:description,
                      reference_number=:reference_number,
                      faculty_name=:faculty_name, delivery_number=:delivery_number,
                      fund_code=:fund_code, plan_code=:plan_code, project_code=:project_code,
                      image=:image
                  WHERE asset_id = :asset_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":asset_name", $this->asset_name);
        $stmt->bindParam(":serial_number", $this->serial_number);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":unit", $this->unit);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":location_id", $this->location_id);
        $stmt->bindParam(":room_text", $this->room_text);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":reference_number", $this->reference_number);
        $stmt->bindParam(":faculty_name", $this->faculty_name);
        $stmt->bindParam(":delivery_number", $this->delivery_number);
        $stmt->bindParam(":fund_code", $this->fund_code);
        $stmt->bindParam(":plan_code", $this->plan_code);
        $stmt->bindParam(":project_code", $this->project_code);
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