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

    // ✅ ใช้ View ที่มีข้อมูล last_check_date จาก Asset_Check
    public function readAll() {
        $query = "SELECT 
                    a.*, 
                    d.department_name, 
                    l.building_name, 
                    l.floor,
                    l.room_number,
                    -- ดึง last_check_date จาก Asset_Check
                    (SELECT ac.check_date 
                     FROM asset_check ac 
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_check_date,
                    -- ดึงผู้ตรวจล่าสุด
                    (SELECT u.fullname 
                     FROM asset_check ac 
                     LEFT JOIN users u ON ac.user_id = u.user_id
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_checker,
                    -- ดึงข้อมูลรอบการตรวจ
                    sch.next_check_date,
                    sch.schedule_id,
                    cs.name AS schedule_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  LEFT JOIN asset_schedules sch ON a.asset_id = sch.asset_id
                  LEFT JOIN check_schedules cs ON sch.schedule_id = cs.schedule_id
                  ORDER BY a.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT 
                    a.*, 
                    d.department_name, 
                    l.building_name, 
                    l.floor,
                    l.room_number,
                    -- ดึง last_check_date
                    (SELECT ac.check_date 
                     FROM asset_check ac 
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_check_date,
                    -- ดึงผู้ตรวจล่าสุด
                    (SELECT u.fullname 
                     FROM asset_check ac 
                     LEFT JOIN users u ON ac.user_id = u.user_id
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_checker,
                    -- ดึงข้อมูลรอบการตรวจ
                    sch.next_check_date,
                    cs.name AS schedule_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  LEFT JOIN asset_schedules sch ON a.asset_id = sch.asset_id
                  LEFT JOIN check_schedules cs ON sch.schedule_id = cs.schedule_id
                  WHERE a.asset_id = :asset_id OR a.barcode = :barcode";
        
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
        $query = "SELECT 
                    a.*, 
                    d.department_name, 
                    l.building_name, 
                    l.floor,
                    l.room_number,
                    (SELECT ac.check_date 
                     FROM asset_check ac 
                     WHERE ac.asset_id = a.asset_id 
                     ORDER BY ac.check_date DESC 
                     LIMIT 1) AS last_check_date
                  FROM " . $this->table_name . " a
                  LEFT JOIN departments d ON a.department_id = d.department_id
                  LEFT JOIN locations l ON a.location_id = l.location_id
                  WHERE a.asset_name LIKE :keyword 
                     OR a.serial_number LIKE :keyword 
                     OR a.barcode LIKE :keyword
                  ORDER BY a.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $keyword = "%{$keyword}%";
        $stmt->bindParam(":keyword", $keyword);
        $stmt->execute();
        
        return $stmt;
    }
}
?>